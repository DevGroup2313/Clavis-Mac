CLAVIS  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse engineering or commercial use
without the author's written permission. The parts carried inside under their own licences (WordNet, SCOWL,
citeproc-js, the CSL styles, PDF.js and the fonts) keep them: see `vendor/` and `fonts/`.

# Clavis: the Offline Project's search engine

A search engine in the family of Carpe Diem, The Forge, Ingenium and Inkwell, with no AI anywhere in it. Its seal is an
open book between two crossed keys, in onyx and gold, drawn in layers that stand at their own depths and move.

- **Everyday**: the open web (Marginalia, an independent non-commercial index), Wikipedia with Wikidata's facts,
  pictures (Openverse, Wikimedia Commons), books (Open Library), places (OpenStreetMap), news (GDELT, Hacker News),
  questions and answers (Stack Exchange), code (GitHub), a dictionary (WordNet on the device, Wiktionary online) and
  the Internet Archive. "Search elsewhere" opens Google with its "Web" results only and DuckDuckGo without AI.
- **Scholarly**: OpenAlex, Crossref, Europe PMC, PubMed, DOAJ and Semantic Scholar, joined into one record per work,
  retractions left out, every work vetted in Ingenium's words ("Preprint: not peer-reviewed", "peer review confirmed
  (journal listed in DOAJ)"), filters (years, kind, free to read, peer-reviewed journals), who cites it, what it cites,
  related works, author pages, and citations in Inkwell's styles by the same engine (APA, MLA, Chicago, Harvard, IEEE,
  Nature, MHRA, OSCOLA) with BibTeX, RIS and CSL-JSON for Fontes and Inkwell.
- **Offline**: Keep any result; a Wikipedia article is kept whole, pictures included, and reads here with no
  connection. Your own files (text, Markdown, web pages, PDF, BibTeX, RIS) join the library. "Take a topic offline"
  keeps the first Wikipedia articles on a subject. With no connection, the same search comes back from the answers kept,
  and anything else is found in the library by a full-text index on the device (BM25). Sums, conversions, dates, the
  dictionary and spelling are worked out on the device.
- **For an AuDHD mind**: ten results to a page with numbered pages (never an endless scroll); the question you came
  with kept in view, with "Found it"; the Clepsydra counting a search's minutes and a gentle time check that offers to
  put the rest aside; the family's 💭 thoughts panel (with "Search it later") and Ingenium's quiet screen, carried
  whole; Day, Dusk and Night; text size, roomy spacing, Atkinson Hyperlegible letters, a reading ruler, calm results,
  Motion at Full, Calm or Still; Display laid out in rooms with a tip under every choice and a box that finds any setting.

## Where each app lives

| Device | Repository | What to download from its Releases page |
| --- | --- | --- |
| Mac (Intel and Apple silicon) | DevGroup2313/Clavis-Mac (this one) | `Clavis-Mac.zip`: unzip, drag Clavis to Applications. Uninstall: drag it to the Bin. |
| Windows | DevGroup2313/Clavis-Window | `Clavis-101-Windows-Setup.exe` (the number is the build): installs for you alone, no administrator password; uninstall in Settings, Apps. `Clavis-Windows.zip` runs without installing. |
| Fire tablet, Android | DevGroup2313/Clavis-IOS-Android | `clavis.apk`: open it on the tablet and allow the install. Uninstall: hold its icon, Uninstall. |
| iPhone, iPad | DevGroup2313/Clavis-IOS-Android | `Clavis.ipa`: install with Sideloadly, as the family's apps are. Uninstall: hold its icon, Remove App. |
| Any browser | DevGroup2313/Offline-project-forest, `clavis/` | the website's copy; installs from the browser and opens with no connection. |

Every app keeps its library on the device it runs on (on a Mac in `~/Library/Application Support/Clavis`, on Windows in
`%LOCALAPPDATA%\Clavis`), and the desktop apps serve the page only to their own machine, at 127.0.0.1 port 42071.

## How it is made

- `src/` holds the sources. `python3 -I tools/build.py` writes `clavis.html` (the whole app in one file: its fonts,
  dictionary, word list, citation engine and styles, PDF reader and seal are inside it), `sw.js` and `icons/`.
- `python3 -I tools/seal_art.py` draws the seal from `tools/clavis_seal.py`: its five layers (plate, rays, keys, book,
  rubies) for the page, and the whole seal at 1024 px for the app icons and at 128 px for the bar.
- `python3 -I tools/stones.py` cuts the jewelled keys (onyx by day, gold by night) into `src/clavis.css`.
- `python3 -I tools/make_apps.py` (after build.py) writes every app from `app.json` and the family's recipes in
  `platforms/`: `Mac project/` here, `Windows project/` in Clavis-Window, `Fire tablet project/` and `iphone-ipad/` in
  Clavis-IOS-Android, each repository's `.github/workflows/`, and the website's copy. The three repositories sit side
  by side in one folder (`clavis`, `clavis-window`, `clavis-ios-android`, next to `Offline-project-forest`).
- `shared/` holds the thoughts panel and the quiet screen exactly as Ingenium's `source/build/thoughts/` has them.

## Its test

`python3 -m http.server 8151` in this folder, then `node tests/t_smoke.js http://127.0.0.1:8151/clavis.html OUT_DIR`
walks every room in Chromium, with every outside answer given by `tests/mock.js` (recorded from the real services in
`tests/fixtures/`), so a test sends nothing anywhere. It also opens the page from disk, as a double-click does.
