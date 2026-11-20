// A whole page as one picture: node tools/shot_page.js page.html out.png WIDTH
const { chromium } = require('playwright'); const path = require('path');
(async () => { const [f, out, w] = process.argv.slice(2); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w || 1800, height: 1000 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: out, fullPage: true }); await b.close(); })();
