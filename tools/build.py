"""Builds Clavis's page from its sources, as the family's pages are built: one file that carries everything it needs.

    python3 -I tools/build.py           (run from the Clavis repository) writes clavis.html, sw.js and icons/

It writes into the page, in order: the fonts (woff2, as data), Clavis's styles, the shared thoughts panel and quiet
screen (carried whole, from Ingenium's build/thoughts), the two dresses of the seal, and the scripts. The keeper's
cache name carries the page's fingerprint, so a new build always replaces the old keep.
"""
import base64
import gzip
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "src")
FONTS = os.path.join(HERE, "fonts")
SHARED = os.path.join(HERE, "shared")
VENDOR = os.path.join(HERE, "vendor")
CARRIED = ["wordnet-lex.txt", "scowl-words.txt", "citeproc.js", "pdf.min.js", "pdf.worker.min.js", "csl.json"]

SCRIPTS = ["core.js", "answers.js", "web.js", "scholar.js", "offline.js", "search.js", "ui.js", "ui2.js", "seal3d.js", "support.js", "app.js"]
FACES = [  # family, file, weight, style
    ("Clavis Cormorant", "cormorant-500.woff2", 500, "normal"),
    ("Clavis Cormorant", "cormorant-500i.woff2", 500, "italic"),
    ("Clavis Cormorant", "cormorant-600.woff2", 600, "normal"),
    ("Clavis Cormorant", "cormorant-700.woff2", 700, "normal"),
    ("Clavis Cinzel", "cinzel-600.woff2", 600, "normal"),
    ("Clavis Inter", "inter.woff2", "400 700", "normal"),
    ("Clavis Atkinson", "ah-400.woff2", 400, "normal"),
    ("Clavis Atkinson", "ah-400i.woff2", 400, "italic"),
    ("Clavis Atkinson", "ah-700.woff2", 700, "normal"),
]


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def fonts_css():
    out = []
    for fam, fn, w, st in FACES:
        b = base64.b64encode(open(os.path.join(FONTS, fn), "rb").read()).decode()
        out.append(f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2')}}")
    return "\n".join(out)


def carried():
    """The vendor files the page carries inside it, each gzipped and written as base64 in a script element the browser
    never runs (type text/plain). core.js (LV.res) unpacks one the first time it is needed."""
    out = []
    for name in CARRIED:
        if name == "csl.json":
            d = os.path.join(VENDOR, "csl")
            data = json.dumps({f: read(os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith((".csl", ".xml"))}, ensure_ascii=False).encode("utf-8")
        else:
            data = open(os.path.join(VENDOR, name), "rb").read()
        b = base64.b64encode(gzip.compress(data, 9, mtime=0)).decode()
        out.append(f'<script type="text/plain" id="lvres-{re.sub("[^a-z0-9]", "-", name)}">{b}</script>')
    return "\n".join(out)


def no_close(js):
    """A script written into the page may not hold the words that end a script element."""
    return js.replace("</script", "<\\/script")


def icons():
    """The icons the website and the installed web app use, from the seal at 1024 pixels: on nothing for the tab, the
    bookmarks and an installed app that keeps its icon's shape, and on a white square where a device fills a square."""
    from PIL import Image
    out = os.path.join(HERE, "icons")
    os.makedirs(out, exist_ok=True)
    day = Image.open(os.path.join(HERE, "art", "seal", "1024", "seal-day.png")).convert("RGBA")
    night = Image.open(os.path.join(HERE, "art", "seal", "1024", "seal-night.png")).convert("RGBA")
    for name, im, px in (("seal-32.png", day, 32), ("seal-night-32.png", night, 32), ("seal-192.png", day, 192), ("seal-night-192.png", night, 192), ("seal-512.png", day, 512)):
        im.resize((px, px), Image.LANCZOS).save(os.path.join(out, name))
    for name, px, pad in (("seal-maskable-512.png", 512, .14), ("apple-touch-icon.png", 180, .06)):
        sq = Image.new("RGBA", (px, px), (255, 255, 255, 255))
        inner = round(px * (1 - 2 * pad))
        sq.alpha_composite(day.resize((inner, inner), Image.LANCZOS), ((px - inner) // 2, (px - inner) // 2))
        sq.convert("RGB").save(os.path.join(out, name))


def build():
    css = read(os.path.join(SRC, "clavis.css"))
    thoughts = read(os.path.join(SHARED, "thought_cloud.html"))
    quiet = read(os.path.join(SHARED, "quiet_screen.html"))
    scripts = "\n".join(f"/* ---- {n} ---- */\n" + read(os.path.join(SRC, n)) for n in SCRIPTS)
    icons()
    art = os.path.join(HERE, "art", "seal")
    def uri(path, mime):
        return "data:%s;base64,%s" % (mime, base64.b64encode(open(path, "rb").read()).decode())
    seal = {}
    for dress in ("day", "night"):
        seal[dress] = {part: uri(os.path.join(art, f"{part}-{dress}.webp"), "image/webp") for part in ("plate", "rays", "keys", "book", "gem")}
        seal[dress]["small"] = uri(os.path.join(art, "128", f"seal-{dress}.webp"), "image/webp")
    icon_day = uri(os.path.join(HERE, "icons", "seal-32.png"), "image/png")
    icon_night = uri(os.path.join(HERE, "icons", "seal-night-32.png"), "image/png")
    seal["iconDay"], seal["iconNight"] = icon_day, icon_night
    seals = "window.LV_SEALS=" + json.dumps(seal) + ";"
    early = r"""(function(){try{var s=JSON.parse(localStorage.getItem("clavis_settings")||"{}")||{},r=document.documentElement,d=s.dress||"auto";
if(d==="auto")d=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"night":"day";r.setAttribute("data-dress",d);
["depth","text","gap","font","motion"].forEach(function(k){if(s[k])r.setAttribute("data-"+k,s[k]);});if(s.lang)r.lang=s.lang;}catch(e){}})();"""
    page = f"""<!doctype html>
<!-- CLAVIS | Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED. No copying, adaptation,
     redistribution, reverse engineering or commercial use without the author's written permission. The parts carried
     inside under their own licences (WordNet, SCOWL, citeproc-js, the CSL styles, PDF.js and the fonts) keep them; see
     the vendor and fonts folders. Build {{BUILD}}. -->
<html lang="en" data-dress="day">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Clavis</title>
<meta name="description" content="Clavis, the Offline Project's search engine: the open web and the scholarly record online, everything you keep offline. No AI, no adverts, no tracking.">
<meta name="theme-color" content="#f5f2ea">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="manifest" href="manifest.webmanifest">
<link id="lv-icon" rel="icon" type="image/png" sizes="32x32" href="{icon_day}">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Clavis">
<script>{early}</script>
<style id="lv-fonts">{fonts_css()}</style>
<style id="lv-css">{css}</style>
</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
<header class="bar" id="bar"></header>
<main id="main" tabindex="-1"></main>
<div class="fabs" id="fabs" aria-label="Side buttons"></div>
<div id="lv-toast" class="toast" role="status" aria-live="polite"></div>
<noscript><p style="padding:2rem;font-family:Georgia,serif">Clavis needs JavaScript to run. Everything it does happens on this device.</p></noscript>
{thoughts}
{quiet}
<script>{seals}</script>
{carried()}
<script id="lv-js">
{no_close(scripts)}
</script>
</body>
</html>
"""
    fp = hashlib.sha256(page.encode("utf-8")).hexdigest()[:10]
    page = page.replace("{BUILD}", fp)
    with open(os.path.join(HERE, "clavis.html"), "w", encoding="utf-8") as f:
        f.write(page)
    sw = read(os.path.join(SRC, "sw.js")).replace("__BUILD__", fp)
    with open(os.path.join(HERE, "sw.js"), "w", encoding="utf-8") as f:
        f.write(sw)
    print(f"clavis.html {len(page.encode('utf-8')):,} bytes, build {fp}")


if __name__ == "__main__":
    build()
