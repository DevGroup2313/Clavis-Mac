// Turns seal SVGs into pictures, in Chromium, with the seal's own fonts.
//     node tools/render_seals.js OUT_DIR SIZE file.svg [file.svg ...]
// Each file.svg becomes OUT_DIR/file.png at SIZE pixels square, on nothing (transparent).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const here = path.resolve(__dirname, '..');
const b64 = f => fs.readFileSync(path.join(here, 'fonts', f)).toString('base64');
const FONTS = `@font-face{font-family:'Clavis Cinzel';src:url(data:font/woff2;base64,${b64('cinzel-600.woff2')}) format('woff2');font-weight:600}
@font-face{font-family:'Clavis Cinzel B';src:url(data:font/woff2;base64,${b64('cinzel-var.woff2')}) format('woff2');font-weight:400 900}
@font-face{font-family:'Clavis Cinzel Deco';src:url(data:font/woff2;base64,${b64('cinzeldeco-900.woff2')}) format('woff2');font-weight:900}
@font-face{font-family:'Clavis Cormorant';src:url(data:font/woff2;base64,${b64('cormorant-700.woff2')}) format('woff2');font-weight:700}`;
(async () => {
  const [out, size, ...files] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +size, height: +size }, deviceScaleFactor: 1 });
  for (const f of files) {
    const svg = fs.readFileSync(f, 'utf8').replace(/width="640" height="640"/, `width="${size}" height="${size}"`);
    await p.setContent(`<!doctype html><html><head><style>${FONTS}html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
    const name = path.join(out, path.basename(f).replace(/\.svg$/, '.png'));
    await p.screenshot({ path: name, omitBackground: true, clip: { x: 0, y: 0, width: +size, height: +size } });
    console.log(name);
  }
  await b.close();
})();
