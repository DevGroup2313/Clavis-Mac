// Clavis's tests answer every request to the outside world themselves, so a test run sends nothing anywhere and gives
// the same answers every time. Captured answers (tests/fixtures/*.json) were fetched once from the real services;
// the rest are written here in each service's own shape. install(context) routes every outside request: an address with
// no answer here gets a 404, so a test never reaches the network by accident.
const fs = require('fs'), path = require('path');
const FX = path.join(__dirname, 'fixtures');
const fx = n => JSON.parse(fs.readFileSync(path.join(FX, n + '.json'), 'utf8'));

const wikiPages = (q) => {
  const base = [
    { title: 'Lantern', description: 'Portable lighting device', extract: 'A lantern is a source of lighting, often portable. It typically features a protective enclosure for the light source.' },
    { title: 'Paper lantern', description: 'Lantern made of thin paper', extract: 'A paper lantern is a lantern made of thin, brightly coloured paper.' },
    { title: 'Magic lantern', description: 'Early type of image projector', extract: 'The magic lantern, also known by its Latin name lanterna magica, is an early type of image projector.' },
    { title: 'Diogenes', description: 'Ancient Greek philosopher', extract: 'Diogenes the Cynic carried a lamp in the daytime, claiming to be looking for an honest man.' },
    { title: 'Lighthouse', description: 'Tower designed to emit light', extract: 'A lighthouse is a tower, building, or other type of physical structure designed to emit light.' },
  ];
  if (/roman roads/i.test(q)) return [{ title: 'Roman roads', description: 'Roads built by the Roman state', extract: 'Roman roads were physical infrastructure vital to the maintenance and development of the Roman state.' },
    { title: 'Via Appia', description: 'Ancient Roman road', extract: 'The Appian Way is one of the earliest and strategically most important Roman roads of the ancient republic.' }];
  return base;
};
const wikiSearch = (url) => {
  const u = new URL(url), q = u.searchParams.get('gsrsearch') || '', lang = u.hostname.split('.')[0];
  const pages = wikiPages(q).map((p, i) => ({ pageid: 100 + i, ns: 0, title: p.title, index: i + 1, description: p.description, extract: p.extract,
    fullurl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
    thumbnail: i === 0 ? { source: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/${p.title.replace(/ /g, '_')}.jpg/200px-x.jpg`, width: 200, height: 150 } : undefined }));
  return { batchcomplete: true, query: { searchinfo: { totalhits: 4321, suggestion: /lantren/.test(q) ? 'lantern' : undefined }, pages } };
};
const wikiParse = (url) => {
  const page = new URL(url).searchParams.get('page') || 'Lantern';
  const html = `<div class="mw-parser-output"><div class="hatnote">For other uses, see <a href="/wiki/Lantern_(disambiguation)">Lantern (disambiguation)</a>.</div>
    <style>.x{color:red}</style><script>window.__pwned=1</script>
    <p>A <b>${page}</b> is a source of lighting, often portable.<sup id="cite_ref-1"><a href="#cite_note-1">[1]</a></sup> It typically features a protective enclosure for the light source, historically a <a href="/wiki/Candle" title="Candle">candle</a>.</p>
    <h2 id="History"><span class="mw-headline" id="History">History</span><span class="mw-editsection">[edit]</span></h2>
    <p>Lanterns were carried by night watchmen. <a href="https://example.org/lamps?utm_source=x" onclick="alert(1)">An outside page</a>.</p>
    <figure><img src="//upload.wikimedia.org/wikipedia/commons/a/aa/Lantern.jpg" alt="A lantern" width="220" height="160" onerror="alert(1)"><figcaption>A brass lantern</figcaption></figure>
    <h2 id="Types"><span class="mw-headline" id="Types">Types</span></h2><ul><li>Paper lanterns</li><li>Storm lanterns</li></ul>
    <h2 id="See_also">See also</h2><p><a href="/wiki/Lighthouse">Lighthouse</a></p>
    <h2 id="References">References</h2><ol class="references"><li id="cite_note-1"><span class="reference-text">A book about lamps, 1990.</span></li></ol>
    <table class="navbox"><tr><td>Navigation box that should not appear</td></tr></table></div>`;
  return { parse: { title: page.replace(/_/g, ' '), displaytitle: page.replace(/_/g, ' '), revid: 12345, text: html,
    sections: [{ toclevel: 1, line: 'History', anchor: 'History' }, { toclevel: 1, line: 'Types', anchor: 'Types' }, { toclevel: 1, line: 'See also', anchor: 'See_also' }, { toclevel: 1, line: 'References', anchor: 'References' }] } };
};
const wikiSummary = (url) => {
  const t = decodeURIComponent(url.split('/page/summary/')[1].split('?')[0]).replace(/_/g, ' ');
  return { type: 'standard', title: t, description: 'Portable lighting device', extract: `A ${t.toLowerCase()} is a source of lighting, often portable. It typically features a protective enclosure for the light source.`,
    thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Lantern.jpg/320px-Lantern.jpg' }, content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(t) } }, wikibase_item: 'Q862454' };
};
const wikidata = (url) => {
  const u = new URL(url);
  if (u.searchParams.get('props') === 'claims') return { entities: { Q862454: { claims: {
    P31: [{ rank: 'normal', mainsnak: { datavalue: { type: 'wikibase-entityid', value: { id: 'Q1305' } } } }],
    P575: [{ rank: 'normal', mainsnak: { datavalue: { type: 'time', value: { time: '-0400-00-00T00:00:00Z', precision: 9 } } } }],
    P856: [{ rank: 'normal', mainsnak: { datavalue: { type: 'string', value: 'https://example.org/lanterns' } } }] } } } };
  return { entities: { Q1305: { labels: { en: { value: 'light fixture' }, fr: { value: 'luminaire' } } } } };
};
const marginalia = () => ({ query: 'lantern', license: 'CC-BY-NC-SA 4.0', results: [
  { url: 'https://www.lanternmuseum.example/history', title: 'A short history of the lantern', description: 'From horn lanterns to storm lanterns: how people carried light through the dark.' },
  { url: 'https://en.wikipedia.org/wiki/Lantern', title: 'Lantern - Wikipedia', description: 'A lantern is a source of lighting, often portable.' },
  { url: 'https://blog.example.net/making-a-paper-lantern?utm_source=feed', title: 'Making a paper lantern at home', description: 'Paper, glue, a little patience: a lantern in an afternoon.' },
  { url: 'https://physics.example.edu/notes/light', title: 'Notes on light and flame', description: 'Why a flame gives light, and how glass protects it from the wind.' } ] });

const oaAuthors = [{ author: { id: 'https://openalex.org/A5023888391', display_name: 'Wolfram Schultz' }, institutions: [{ display_name: 'University of Cambridge' }] },
  { author: { id: 'https://openalex.org/A5000000002', display_name: 'Peter Dayan' }, institutions: [] }, { author: { id: 'https://openalex.org/A5000000003', display_name: 'P. Read Montague' }, institutions: [] }];
const oaWork = (i, extra) => Object.assign({
  id: 'https://openalex.org/W20' + (10 + i), doi: i === 0 ? 'https://doi.org/10.1126/science.275.5306.1593' : `https://doi.org/10.1234/example.${i}`,
  display_name: ['A Neural Substrate of Prediction and Reward', 'Dopamine reward prediction error coding', 'The debate over dopamine’s role in reward', 'Editorial: Dopamine and reward', 'Dopamine signals in the ventral striatum (preprint)'][i % 5],
  publication_year: [1997, 2016, 2007, 2019, 2023][i % 5], publication_date: ['1997-03-14', '2016-03-01', '2007-04-01', '2019-01-01', '2023-05-05'][i % 5],
  type: ['article', 'review', 'article', 'article', 'preprint'][i % 5], authorships: oaAuthors.slice(0, 3 - (i % 2)),
  primary_location: { landing_page_url: 'https://www.science.org/doi/10.1126/science.275.5306.1593', source: i === 4 ? { display_name: 'bioRxiv', type: 'repository' } : { display_name: ['Science', 'Dialogues in Clinical Neuroscience', 'Psychopharmacology', 'Frontiers in Neuroscience'][i % 4], type: 'journal', issn_l: '0036-8075', is_in_doaj: i === 1, host_organization_name: 'AAAS' } },
  open_access: { is_oa: i !== 0, oa_status: i ? 'gold' : 'closed', oa_url: i ? 'https://example.org/oa/' + i : null }, best_oa_location: i ? { landing_page_url: 'https://example.org/oa/' + i, pdf_url: 'https://example.org/oa/' + i + '.pdf' } : null,
  cited_by_count: [9876, 1530, 812, 12, 3][i % 5], is_retracted: false,
  abstract_inverted_index: { The: [0], firing: [1], of: [2], dopamine: [3], neurons: [4], signals: [5], a: [6], reward: [7], prediction: [8], error: [9] },
  biblio: { volume: '275', issue: '5306', first_page: '1593', last_page: '1599' }, language: 'en', ids: { pmid: 'https://pubmed.ncbi.nlm.nih.gov/9054347' }, referenced_works_count: 21 }, extra || {});
const openalex = (url) => {
  const u = new URL(url), p = u.pathname;
  if (/^\/works\/(doi:|W)/.test(p)) return oaWork(0, { related_works: ['https://openalex.org/W2011'], referenced_works: [], topics: [{ display_name: 'Neural dynamics and brain function' }],
    locations: [{ source: { display_name: 'Science' }, landing_page_url: 'https://www.science.org/doi/10.1126/science.275.5306.1593', version: 'publishedVersion', is_oa: false },
      { source: { display_name: 'PubMed Central' }, landing_page_url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC0000/', pdf_url: null, version: 'acceptedVersion', is_oa: true }] });
  if (/^\/authors\/A/.test(p)) return { id: 'https://openalex.org/A5023888391', display_name: 'Wolfram Schultz', orcid: 'https://orcid.org/0000-0002-8530-4518', works_count: 412, cited_by_count: 98765,
    summary_stats: { h_index: 120, i10_index: 300 }, last_known_institutions: [{ display_name: 'University of Cambridge' }], topics: [{ display_name: 'Neural dynamics' }, { display_name: 'Decision making' }],
    counts_by_year: [2024, 2023, 2022, 2021, 2020].map((y, i) => ({ year: y, works_count: 10 - i, cited_by_count: 4000 })) };
  if (p === '/authors') return { meta: { count: 2 }, results: [{ id: 'https://openalex.org/A5023888391', display_name: 'Wolfram Schultz', works_count: 412, cited_by_count: 98765, summary_stats: { h_index: 120 }, last_known_institutions: [{ display_name: 'University of Cambridge' }], topics: [{ display_name: 'Neural dynamics' }] },
    { id: 'https://openalex.org/A5000000002', display_name: 'Peter Dayan', works_count: 300, cited_by_count: 60000, summary_stats: { h_index: 90 }, last_known_institutions: [], topics: [] }] };
  if (p === '/works') { const page = +(u.searchParams.get('page') || 1); const n = page > 2 ? 0 : 5; return { meta: { count: 10 }, results: Array.from({ length: n }, (_, i) => oaWork(i + (page - 1) * 5)) }; }
  return { meta: { count: 0 }, results: [] };
};
const s2 = (url) => {
  if (/\/citations/.test(url)) return { data: [{ citingPaper: { paperId: 'abc', title: 'A later paper citing it', year: 2020, authors: [{ name: 'Ada Example' }], venue: 'Neuron', citationCount: 5, externalIds: { DOI: '10.1016/j.neuron.2020.01.001' }, publicationTypes: ['JournalArticle'], journal: { name: 'Neuron' } } }] };
  return { total: 2, offset: 0, data: [
    { paperId: 's2a', title: 'A Neural Substrate of Prediction and Reward', year: 1997, authors: [{ name: 'W. Schultz', authorId: '1' }], venue: 'Science', citationCount: 9900, isOpenAccess: false, externalIds: { DOI: '10.1126/science.275.5306.1593', PubMed: '9054347' }, abstract: null, publicationTypes: ['JournalArticle'], journal: { name: 'Science', volume: '275', pages: '1593 - 1599' }, publicationDate: '1997-03-14' },
    { paperId: 's2b', title: 'Dopamine, reward and learning: a preprint', year: 2024, authors: [{ name: 'Sam Example', authorId: '2' }], venue: 'arXiv.org', citationCount: 0, isOpenAccess: true, openAccessPdf: { url: 'https://arxiv.org/pdf/2401.00001' }, externalIds: { ArXiv: '2401.00001' }, abstract: 'We study dopamine and reward with a simple model.', publicationTypes: null, journal: null } ] };
};
const gdelt = () => ({ articles: [
  { url: 'https://news.example.com/lantern-festival', title: 'Thousands gather for the lantern festival', seendate: '20261118T120000Z', socialimage: '', domain: 'news.example.com', language: 'English', sourcecountry: 'United Kingdom' },
  { url: 'https://journal.example.fr/lanternes', title: 'Les lanternes de la ville', seendate: '20261117T090000Z', socialimage: '', domain: 'journal.example.fr', language: 'French', sourcecountry: 'France' } ] });
const wiktionary = () => ({ en: [{ partOfSpeech: 'Noun', language: 'English', definitions: [{ definition: 'A case of <a href="/wiki/translucent">translucent</a> material made to protect a flame.' }, { definition: 'The top part of a lighthouse.' }] }],
  fr: [{ partOfSpeech: 'Noun', language: 'French', definitions: [{ definition: 'lantern' }] }] });
const commons = () => ({ query: { pages: [1, 2, 3].map(i => ({ pageid: 900 + i, ns: 6, title: `File:Lantern ${i}.jpg`, index: i, imageinfo: [{ url: `https://upload.wikimedia.org/wikipedia/commons/${i}/lantern${i}.jpg`, thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/${i}/lantern${i}.jpg/320px.jpg`,
  descriptionurl: `https://commons.wikimedia.org/wiki/File:Lantern_${i}.jpg`, extmetadata: { Artist: { value: '<a href="x">A photographer</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] })) } });
const nominatim = () => ([{ place_id: 1, osm_type: 'relation', osm_id: 307829, lat: '18.5473', lon: '-72.3396', category: 'boundary', type: 'administrative', name: 'Port-au-Prince',
  display_name: 'Port-au-Prince, Ouest, Haiti', boundingbox: ['18.4986', '18.5958', '-72.3810', '-72.2850'], extratags: { wikipedia: 'fr:Port-au-Prince' } }]);

const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const ROUTES = [
  [/wikipedia\.org\/w\/api\.php.*action=parse/, u => wikiParse(u)],
  [/wikipedia\.org\/w\/api\.php/, u => wikiSearch(u)],
  [/wikipedia\.org\/api\/rest_v1\/page\/summary\//, u => wikiSummary(u)],
  [/wikidata\.org\/w\/api\.php/, u => wikidata(u)],
  [/api2\.marginalia-search\.com\/search/, () => marginalia()],
  [/api\.duckduckgo\.com\//, () => fx('ddg')],
  [/openlibrary\.org\/search\.json/, () => fx('openlibrary')],
  [/archive\.org\/advancedsearch\.php/, () => fx('archive')],
  [/api\.openverse\.org\/v1\/images/, () => fx('openverse')],
  [/commons\.wikimedia\.org\/w\/api\.php/, () => commons()],
  [/nominatim\.openstreetmap\.org\/search/, () => nominatim()],
  [/api\.gdeltproject\.org\//, () => gdelt()],
  [/hn\.algolia\.com\/api\/v1\/search/, () => fx('hn')],
  [/api\.stackexchange\.com\/2\.3\/search/, () => fx('stackexchange')],
  [/api\.github\.com\/search\/repositories/, () => fx('github')],
  [/wiktionary\.org\/api\/rest_v1\/page\/definition\//, () => wiktionary()],
  [/api\.openalex\.org\//, u => openalex(u)],
  [/api\.crossref\.org\/works\/10\./, () => fx('crossref_work')],
  [/api\.crossref\.org\/works\?/, () => fx('crossref')],
  [/europepmc\/webservices\/rest\/search/, () => fx('europepmc')],
  [/eutils\.ncbi\.nlm\.nih\.gov\/entrez\/eutils\/esearch/, () => fx('pubmed_search')],
  [/eutils\.ncbi\.nlm\.nih\.gov\/entrez\/eutils\/esummary/, () => fx('pubmed_summary')],
  [/doaj\.org\/api\/search\/articles\//, () => fx('doaj')],
  [/api\.semanticscholar\.org\/graph\/v1\//, u => s2(u)],
];
const seen = [];
async function install(ctx, opts = {}) {
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, async route => {
    const url = route.request().url(); seen.push(url);
    if (opts.fail && opts.fail.test(url)) return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, body: 'busy' });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET' } });
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)|covers\.openlibrary|services\/img|staticflickr|upload\.wikimedia\.org/i.test(url)) return route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: PNG1 });
    if (/openstreetmap\.org\/export\/embed/.test(url)) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>map</title><body style="background:#cde">map</body>' });
    for (const [re, fn] of ROUTES) if (re.test(url)) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(fn(url)) });
    return route.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*' }, body: 'not mocked' });
  });
}
module.exports = { install, seen };
