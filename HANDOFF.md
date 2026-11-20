# Clavis: handoff for the next session

Paste the block below into a new Claude Code session to carry on exactly where this one stopped. It is updated at
every shipped stage.

```text
Continue building Clavis, my search engine app for The Offline Project.

REPOSITORIES (clone all four side by side in one folder: clavis, clavis-window, clavis-ios-android, Offline-project-forest)
- DevGroup2313/Clavis: the app's sources (src/, tools/, tests/, art/, platforms/, app.json) and "Mac project/".
- DevGroup2313/Clavis-Window: "Windows project/" (written by Clavis's tools/make_apps.py; never edit it by hand).
- DevGroup2313/Clavis-IOS-Android: "Fire tablet project/" and "iphone-ipad/" (written by make_apps.py too).
- DevGroup2313/Offline-project-forest: the website; clavis/ is the web copy (written by make_apps.py).
- Work on branch claude/offline-search-engine-scholarly-32qvhe in all four (it is the default branch of the three
  Clavis repos). Ship in verifiable stages: after each stage, commit, push, and give me a short release note plus an
  updated handoff prompt in the chat (and update HANDOFF.md in DevGroup2313/Clavis).
- Reference (clone read-only): DevGroup2313/Ingenium-Mac-Mini (source/build/thoughts = the shared thoughts panel and
  quiet screen; source/build/jewels = the family's cut-stone keys; source/offline_project/french = the family's French
  toolkit), DevGroup2313/Carpe-Diem-Gift (its French: tr(key, english) + UI_FR, fr_engine.js, the harvest test),
  DevGroup2313/Forge-Mac, DevGroup2313/Inkwell-Mac-Mini, DevGroup2313/The-forge-IOS.

WHAT I WANT
- My own alternative to Google with no AI at all, in the same family as Carpe Diem, The Forge, Ingenium and Inkwell
  (design, graphics, AuDHD accessibility), working offline with online access for searches, with its own Scholarly
  mode, at the same level of quality as my other apps.
- Fully translated to French and Haitian Creole, done the way Carpe Diem's French was done and verified so nothing is
  left untranslated or wrong (my parents are native French speakers).
- The family's animated, popped-out, 3D layered depth look. No green. The seal must be one harmonious design.
- A REAL app on every device (Mac, Windows, Fire tablet, iPhone/iPad): the Python wrap (pywebview) on computers, its
  icon on my devices, installed and uninstalled as an app.

STATE
- Stage 1 shipped: the working app, smoke test (tests/t_smoke.js, every outside answer mocked by tests/mock.js).
- Stage 2 shipped: six name/seal choices (kept in Offline-project-forest's history, lucerna/docs/concepts). I chose Clavis.
- Stage 2b shipped: the four app projects and their GitHub workflows (all four built green as "Lucerna").
- Stage 4 shipped (this one): Clavis everywhere. The seal is an open book between two keys crossed in saltire, rays,
  rubies in the bows, CLAVIS carved on an ivory band in an onyx rim beaded with gold; onyx and ivory by day, onyx
  and gold by night. It is drawn by tools/clavis_seal.py as five layers (plate, rays, keys, book, gem) that
  src/seal3d.js stacks in depth: it tilts towards the pointer, arrives with a spring, sways, turns its rays, floats the
  keys, breathes a gold light, sweeps a shine and glints on the rubies; pressing it stamps a ring (Motion: Full only;
  Calm slows it; Still stops it). The keys that matter are the family's cut stones (tools/stones.py, from Ingenium's
  hx-stone): onyx by day, gold by night, gilt rim, sparks at the corners, lift and seat. The side buttons' glyphs
  breathe as Carpe Diem's do. Smoke test 73/73.
- Next: Stage 3 (French + Haitian Creole, Carpe Diem's way: English at the call site, dictionaries keyed by the
  English line (fr, ht), number/plural patterns, a translation layer for the shared English-only panels (thoughts,
  quiet screen), a 3-language picker (English, Français, Kreyòl), a Playwright harvest that fails on any English
  left in FR/HT, a review sheet for native speakers, Kreyòl dates). Then Stage 5 (devices, polish, a link from the
  website's hall).

HOW IT IS BUILT AND TESTED (in the clavis folder)
- python3 -I tools/build.py      -> clavis.html (the whole app in one file), sw.js, icons/
- python3 -I tools/seal_art.py   -> art/seal (the five layers, the 1024 icon seal, the 128 bar seal)
- python3 -I tools/stones.py     -> the cut-stone keys inside src/clavis.css
- python3 -I tools/make_apps.py  -> Mac project/ here, the other repos' projects, their workflows, the web copy
- python3 -m http.server 8151, then node tests/t_smoke.js http://127.0.0.1:8151/clavis.html OUT_DIR
- app.json: name Clavis, ids com.yannieforest.clavis / com.yannie.clavis, data folder Clavis, port 42071, build 101.
  Raise "pass" for each shipped build. Releases: tags clavis-mac (Clavis), clavis-windows (Clavis-Window),
  clavis-apk and clavis-ios (Clavis-IOS-Android).

THE FAMILY'S CONVENTIONS (keep them)
- "© 2026 Yannie D. Forest. All rights reserved." and "Designed and built by Yannie D. Forest"; show only the build
  number, no build dates. Copyright header with NO LICENCE IS GRANTED in READMEs.
- No endless scrolling; settings in rooms with a plain line saying what each holds, a tip under every choice, a
  "find a setting" box and a "show every setting" key; dropdowns legible in dark mode; fits an iPhone screen; raised
  keys (Depth: Raised/Flat); Day/Dusk/Night/Auto; Motion Full/Calm/Still; the 💭 thoughts panel and the quiet screen
  carried whole. Nothing that moves under a reaching hand: only glyphs and layers move, never the button itself.
```

## Stages

| Stage | What | State |
| --- | --- | --- |
| 1 | The working app, smoke-tested, works by double-click | shipped |
| 2 | New name, seal and colour choices | shipped; Clavis chosen |
| 2b | Real installable apps: Mac, Windows, Fire tablet, iPhone/iPad | shipped; all four built on GitHub |
| 4 | Clavis: the harmonious layered seal, onyx and gold, cut-stone keys, its own repositories | shipped |
| 3 | French and Haitian Creole, verified | next |
| 5 | Devices, polish, the website's hall | to do |
