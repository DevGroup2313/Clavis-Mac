// Clavis's smoke test: every room and every flow, in Chromium, with every outside answer given by tests/mock.js.
//     node tests/t_smoke.js http://127.0.0.1:8150/clavis.html OUT_DIR
// Fails (exit 1) on any check that does not hold and on any script error in the page.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const mock = require('./mock');
const URL0 = (process.argv[2] || 'http://127.0.0.1:8150/clavis.html') + '?nosw';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0; const errors = [];
function ok(cond, what) { if (cond) { pass++; console.log('  ✓ ' + what); } else { fail++; console.log('  ✗ ' + what); } }
async function step(name, fn) { console.log('• ' + name); try { await fn(); } catch (e) { fail++; console.log('  ✗ ' + name + ' threw: ' + (e && e.message || e).split('\n')[0]); } }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await mock.install(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|404/.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)); });
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  /* a search is settled when the address names it and its page says it is no longer busy */
  /* the page redraws a frame after its address changes: wait for the new drawing, then for its results to settle */
  const settled = async (g0) => p.waitForFunction(g0 => LV.ui.gen > g0 && !!document.querySelector('#results[aria-busy="false"]'), g0, { timeout: 20000 });
  const search = async (q) => { await p.waitForSelector('#q'); const g0 = await p.evaluate(() => LV.ui.gen); await p.fill('#q', q); await p.press('#q', 'Enter');
    await p.waitForFunction(q => window.LV && LV.route().p.q === q, q); await settled(g0); };

  await step('opens with the welcome card', async () => {
    await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#door');
    ok(await p.isVisible('#door-title'), 'the welcome card shows the name');
    const box = await p.$eval('.door-card .seal-big', e => e.getBoundingClientRect().height);
    ok(box > 100 && box < 200, 'the seal on the welcome card is its proper size (' + Math.round(box) + 'px)');
    await shot('01-door');
    await p.click('#door-open'); ok(!(await p.$('#door')), 'Open the search closes the card');
  });

  await step('everyday search: All', async () => {
    await search('lantern'); await p.waitForSelector('#rlist .res', { timeout: 15000 });
    const n = await p.$$eval('#rlist .res', l => l.length); ok(n >= 5, 'results are listed (' + n + ')');
    ok(await p.$eval('#rlist .res h3', e => /Lantern/.test(e.textContent)), 'Wikipedia’s own article comes first');
    ok(await p.$$eval('.srcchip[data-s="ok"]', l => l.length) >= 2, 'both sources show as answered');
    await p.waitForSelector('#side .panel', { timeout: 8000 }); ok(await p.$eval('#side .panel h2', e => e.textContent === 'Lantern'), 'the side panel shows the article’s summary');
    ok(await p.$eval('#side .panel', e => /light fixture/.test(e.textContent)), 'the panel carries a fact from Wikidata');
    ok(await p.$$eval('.res .badge.low', l => l.some(x => /Encyclopaedia/.test(x.textContent))), 'Wikipedia is labelled “Encyclopaedia (background, not evidence)”');
    const hrefs = await p.$$eval('#rlist .res h3 a', l => l.map(a => a.href)); ok(!hrefs.some(h => /utm_/.test(h)), 'tracking bits are taken off links');
    ok(await p.isVisible('#intent'), 'the question you came for is kept in view');
    ok(await p.isVisible('.elsewhere'), 'Search elsewhere is offered');
    ok(await p.$$eval('.elsewhere a', l => l.some(a => /udm=14/.test(a.href)) && l.some(a => /noai\.duckduckgo/.test(a.href))), 'elsewhere links leave the engines’ AI out');
    await shot('02-results-all');
  });

  await step('Why these results?', async () => {
    await p.click('.rstat .why'); await p.waitForSelector('.sheet'); ok(await p.$eval('.sheet', e => /Marginalia/.test(e.textContent)), 'the sheet names each source');
    await p.keyboard.press('Escape'); ok(!(await p.$('.sheet')), 'Esc closes the sheet');
  });

  await step('keep a Wikipedia article whole and read it here', async () => {
    const keep = p.locator('#rlist .res').first().locator('button:has-text("Keep")'); await keep.click();
    await p.waitForFunction(() => /Kept/.test(document.querySelector('#rlist .res button[aria-pressed]').textContent), null, { timeout: 8000 });
    ok(true, 'Keep becomes ✓ Kept');
    await p.locator('#rlist .res').first().locator('button:has-text("Read here")').click();
    await p.waitForSelector('.reader article h1'); ok(await p.$eval('.reader article h1', e => e.textContent === 'Lantern'), 'the reader opens the article');
    const html = await p.$eval('.reader article .body', e => e.innerHTML);
    ok(!/script|onclick|onerror|navbox|<style/i.test(html), 'scripts, handlers, styles and navigation boxes never reach the page');
    ok(/#\/read\?wiki=Candle/.test(html), 'links to other articles open inside Clavis');
    ok(!(await p.evaluate(() => window.__pwned)), 'nothing from the article ran');
    await p.click('.toc a[data-anchor]'); ok(/#\/read/.test(p.url()), 'the contents move within the page without leaving it');
    await shot('03-reader');
    await p.goBack(); await p.waitForSelector('#rlist .res'); ok(true, 'Back returns to the results');
  });

  await step('the other tabs', async () => {
    for (const [t, sel] of [['images', '.imgs .tile'], ['books', '#rlist .res'], ['places', '#rlist iframe']]) {
      await p.click('#tab-' + t); await p.waitForSelector(sel, { timeout: 10000 }); ok(true, 'tab ' + t + ' shows its results');
    }
    await shot('04-places');
    for (const t of ['news', 'qa', 'code', 'archive', 'dictionary', 'wikipedia', 'web']) {
      const has = await p.$('#tab-' + t);
      if (has) await p.click('#tab-' + t); else await p.selectOption('.tabs select', t);
      await p.waitForSelector(t === 'dictionary' ? '.answer' : '#rlist .res', { timeout: 10000 }); ok(true, 'tab ' + t + ' shows its results');
    }
    await shot('05-dictionary-or-web');
  });

  await step('answers worked out on this device', async () => {
    await search('12*(3+4)'); await p.waitForSelector('.answer .big'); ok(await p.$eval('.answer .big', e => e.textContent === '84'), 'a sum: 12×(3+4) = 84');
    await search('10 km in miles'); await p.waitForFunction(() => /6\.21/.test((document.querySelector('.answer .big') || {}).textContent || ''), null, { timeout: 8000 }); ok(true, 'a conversion: 10 km = 6.21… miles');
    await search('100 f to c'); await p.waitForFunction(() => /37\.7/.test((document.querySelector('.answer .big') || {}).textContent || ''), null, { timeout: 8000 }); ok(true, 'a temperature: 100 °F = 37.7… °C');
    await search('define search'); await p.waitForFunction(() => /WordNet/.test((document.querySelector('.answer') || {}).textContent || ''), null, { timeout: 20000 }); ok(true, 'the WordNet dictionary answers');
    await shot('06-define');
  });

  await step('scholarly search', async () => {
    { const g0 = await p.evaluate(() => LV.ui.gen); await p.click('#mode-scholarly'); await settled(g0); }
    await search('dopamine reward'); await p.waitForSelector('#rlist .res.paper', { timeout: 15000 });
    const n = await p.$$eval('#rlist .res.paper', l => l.length); ok(n >= 8, 'papers from the joined sources (' + n + ')');
    const ch = await p.$$eval('.srcchip', l => l.map(x => x.getAttribute('data-s') + ':' + x.textContent));
    ok(ch.filter(x => /^ok:/.test(x)).length >= 5, 'the scholarly sources answered: ' + ch.join(', '));
    ok(await p.$$eval('#rlist .res.paper .badge', l => l.some(x => /Preprint: not peer-reviewed/.test(x.textContent))), 'a preprint is labelled “Preprint: not peer-reviewed”');
    ok(await p.$$eval('#rlist .res.paper .badge', l => l.some(x => /peer review confirmed/.test(x.textContent))), 'a DOAJ journal article is labelled “peer review confirmed”');
    const titles = await p.$$eval('#rlist .res.paper h3', l => l.map(x => x.textContent.toLowerCase()));
    const dups = titles.filter((t, i) => titles.indexOf(t) !== i); ok(!dups.length, 'each work appears once (records joined by DOI and title)' + (dups.length ? ': ' + dups.join(' | ') : ''));
    await shot('07-scholarly');
    let g0 = await p.evaluate(() => LV.ui.gen); await p.selectOption('.filters select >> nth=0', 'cited'); await settled(g0); ok(/sort=cited/.test(p.url()), 'Most cited is chosen');
    g0 = await p.evaluate(() => LV.ui.gen); await p.check('.filters input[type=checkbox] >> nth=0'); await settled(g0); ok(/oa=1/.test(p.url()), 'Free to read only is chosen');
    const free = await p.$$eval('#rlist .res.paper', l => l.every(x => /Free to read/.test(x.textContent))); ok(free, 'every work shown is free to read');
  });

  await step('a work on its own page, cited', async () => {
    { const g0 = await p.evaluate(() => LV.ui.gen); await p.click('.filters .key.ghost'); await settled(g0); }
    await p.click('#rlist .res.paper h3 a >> nth=0'); await p.waitForSelector('.detail h1');
    ok(await p.$eval('.detail h1', e => e.textContent.length > 10), 'the work’s page opens');
    await p.waitForFunction(() => { const c = document.querySelector('.citebox'); return c && /\(\d{4}\)|\d{4}/.test(c.textContent) && !/Shaping/.test(c.textContent); }, null, { timeout: 20000 });
    const cite = await p.$eval('.citebox', e => e.textContent); ok(/Schultz/.test(cite), 'APA citation is made: ' + cite.slice(0, 120));
    await p.selectOption('.detail select.field', 'modern-language-association');
    await p.waitForFunction(() => /“|"/.test(document.querySelector('.citebox').textContent), null, { timeout: 10000 }); ok(true, 'MLA citation is made');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.detail button:has-text("BibTeX")')]);
    const bib = fs.readFileSync(await dl.path(), 'utf8'); ok(/^@article\{schultz1997/.test(bib) && /doi = \{10\.1126/.test(bib), 'BibTeX is exported for Fontes and Inkwell');
    await p.waitForSelector('.detail .tabs .tab'); await p.waitForSelector('.detail .card .res.paper', { timeout: 10000 }); ok(true, 'who cites it is listed');
    await shot('08-work');
    await p.click('.detail .authors button >> nth=0'); await p.waitForSelector('.detail .stat'); ok(await p.$eval('.detail h1', e => e.textContent === 'Wolfram Schultz'), 'the author’s page opens');
    await shot('09-author');
  });

  await step('the library: files, a topic taken offline', async () => {
    await p.goto(URL0 + '#/library', { waitUntil: 'load' }); await p.waitForSelector('.drop');
    const txt = path.join(OUT, 'notes-on-roman-roads.txt'); fs.writeFileSync(txt, 'Roman roads\n\nThe Via Appia ran from Rome to Brindisi. Milestones marked every Roman mile.');
    const bibf = path.join(OUT, 'refs.bib'); fs.writeFileSync(bibf, '@article{a1, author={Doe, Jane and Roe, R.}, title={On Milestones}, journal={Journal of Roads}, year={2001}, volume={3}, pages={1--9}, doi={10.5555/roads.1}}\n');
    await p.setInputFiles('.view input[type=file]', [txt, bibf]);
    await p.waitForFunction(() => document.querySelectorAll('.list .item').length >= 3, null, { timeout: 10000 }); ok(true, 'a text file and a BibTeX entry are added');
    await p.click('.tools-take, .card .key.gold').catch(() => {}); await p.waitForSelector('.sheet');
    await p.fill('.sheet input.field', 'Roman roads'); await p.click('.sheet .sf .key');
    await p.waitForFunction(() => !document.querySelector('.sheet') && /room=pages/.test(location.hash), null, { timeout: 20000 });
    await p.waitForSelector('.list .item'); ok(await p.$$eval('.list .item', l => l.some(x => /Via Appia/.test(x.textContent))), 'a topic is taken offline (Via Appia kept)');
    await shot('10-library');
  });

  await step('with no connection', async () => {
    await ctx.setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event('offline')));
    await p.click('.brand'); await p.waitForSelector('.home #q'); await p.click('#mode-everyday'); await p.waitForFunction(() => LV.S.mode === 'everyday' && document.querySelector('.home #q'));
    ok(await p.$eval('#net', e => e.getAttribute('data-on') === '0'), 'the bar says Offline');
    await search('lantern'); await p.waitForSelector('#rlist .res', { timeout: 15000 });
    ok(await p.$$eval('.srcchip', l => l.some(x => x.getAttribute('data-s') === 'kept')), 'the same search comes back from the kept answers');
    await search('milestones'); await p.waitForSelector('#rlist .res', { timeout: 15000 });
    ok(await p.$eval('#rlist', e => /Via Appia|Milestones|Roman/.test(e.textContent)), 'a new search finds what the library holds');
    await shot('11-offline');
    await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event('online')));
  });

  await step('history, the trail of a search', async () => {
    await p.goto(URL0 + '#/history', { waitUntil: 'load' }); await p.waitForSelector('.trail li');
    ok(await p.$$eval('.trail li', l => l.length) >= 5, 'each search and page is on the trail');
    ok(await p.$eval('.view', e => /You came for/.test(e.textContent)), 'the trail names what you came for');
  });

  await step('Display: rooms, a setting found by its words, night', async () => {
    await p.click('#bar-display'); await p.waitForSelector('.sheet .opt');
    await p.fill('.findset', 'dyslexia'); ok(await p.$eval('.sheet', e => /Reading letters/.test(e.textContent)), 'Find a setting finds the reading letters by “dyslexia”');
    await p.fill('.findset', ''); await p.click('.sheet .seg .key:has-text("Night")'); ok(await p.evaluate(() => document.documentElement.getAttribute('data-dress') === 'night'), 'Night dresses the whole app');
    await shot('12-display-night'); await p.keyboard.press('Escape');
    await p.click('#bar-display'); await p.click('.sheet [role=tab]:has-text("Reading")'); await p.click('.sheet .key:has-text("Largest")');
    ok(await p.evaluate(() => getComputedStyle(document.documentElement).fontSize === '20.16px'), 'Largest text makes everything larger');
    await p.click('.sheet .key:has-text("Standard") >> nth=0'); await p.keyboard.press('Escape');
    await p.click('#fab-dress'); ok(await p.evaluate(() => document.documentElement.getAttribute('data-dress') === 'day'), 'the moon key returns to day');
  });

  await step('the supports: thoughts, quiet screen, the Clepsydra, the tour', async () => {
    await p.goto(URL0 + '#/home', { waitUntil: 'load' }); await p.waitForSelector('#fab-thought');
    await p.click('#fab-thought'); await p.waitForSelector('.tc-el textarea, .tc-el [contenteditable]', { timeout: 5000 }); ok(true, 'the thoughts panel opens from 💭');
    await p.keyboard.type('Look up storm lanterns later'); await p.keyboard.press('Escape').catch(() => {});
    await p.click('#fab-quiet'); await p.waitForSelector('.qsc-screen:not([hidden])'); ok(true, 'the quiet screen opens from 🌿');
    await shot('13-quiet'); await p.keyboard.press('Escape'); await p.waitForSelector('.qsc-screen[hidden]', { state: 'attached' }); ok(true, 'Esc brings you back');
    await p.click('#fab-clock'); await p.waitForSelector('.sheet'); ok(await p.$eval('.sheet', e => /Clepsydra/.test(e.textContent)), 'the Clepsydra opens'); await p.keyboard.press('Escape');
    await p.click('#bar-guide'); await p.waitForSelector('.tour-card'); for (let i = 0; i < 3; i++) await p.click('#tour-next');
    ok(await p.$eval('.tour-card', e => /4 \/ 13/.test(e.textContent)), 'the tour moves card by card'); await shot('14-tour');
    await p.keyboard.press('Escape'); ok(!(await p.$('.tour-card')), 'Esc ends the tour');
  });

  await step('French', async () => {
    await p.click('#bar-lang'); await p.waitForFunction(() => document.documentElement.lang === 'fr');
    ok(await p.$eval('#bar-library', e => /Bibliothèque/.test(e.textContent)), 'the bar speaks French'); await shot('15-french');
    await p.click('#bar-lang');
  });

  await step('a phone', async () => {
    const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await mock.install(ph);
    const q = await ph.newPage(); q.on('pageerror', e => errors.push('phone pageerror: ' + e.message));
    await q.goto(URL0, { waitUntil: 'load' }); await q.waitForSelector('#door'); await q.screenshot({ path: path.join(OUT, '16-phone-door.png') });
    await q.click('#door-open'); await q.fill('#q', 'lantern'); await q.press('#q', 'Enter'); await q.waitForSelector('#rlist .res');
    const over = await q.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(over <= 1, 'nothing runs off the side of a phone (' + over + 'px)');
    await q.screenshot({ path: path.join(OUT, '17-phone-results.png') }); await ph.close();
  });

  await step('opened straight from disk, by double-click (file://)', async () => {
    const fc = await b.newContext(); await mock.install(fc); const q = await fc.newPage(); q.on('pageerror', e => errors.push('file pageerror: ' + e.message));
    await q.goto('file://' + path.resolve(__dirname, '..', 'clavis.html'), { waitUntil: 'load' }); await q.waitForSelector('#door');
    const r = await q.evaluate(async () => { const d = await LV.answers.define('define search');
      const c = await LV.scholar.format([{ kind: 'paper', title: 'A Neural Substrate of Prediction and Reward', authors: [{ name: 'Wolfram Schultz' }], venue: 'Science', year: 1997, volume: '275', issue: '5306', pages: '1593–1599', doi: '10.1126/science.275.5306.1593', type: 'article' }], 'apa');
      const sp = await LV.answers.spell('serch engne'); return { d: d && d.word, c: c.entries[0], sp: sp }; });
    ok(r.d === 'search', 'the dictionary opens from inside the page');
    ok(/Schultz, W\. \(1997\)/.test(r.c), 'citations are made from inside the page: ' + String(r.c).replace(/<[^>]+>/g, '').slice(0, 90));
    ok(r.sp === 'search engine', 'spelling is checked from inside the page (“serch engne” → “' + r.sp + '”)');
    await fc.close();
  });

  ok(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.slice(0, 6).join(' | ') : ''));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
