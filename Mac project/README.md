CLAVIS  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED. See LICENCE.txt.

# Clavis for Mac

**Install.** Download Clavis-Mac.zip from the Releases page ("clavis-mac"), open it, and drag Clavis.app to
Applications. The first time, right-click Clavis.app, Open, Open (macOS asks once for any app not notarised by Apple;
MACOS_IF_BLOCKED.txt has the other ways). One app for Intel and Apple silicon Macs.

**Uninstall.** Drag Clavis.app to the Bin. Your library stays in ~/Library/Application Support/Clavis until you
delete that folder too.

**Installer en français.** Téléchargez Clavis-Mac.zip, ouvrez-le et glissez Clavis.app dans Applications.
La première fois : clic droit sur Clavis.app, Ouvrir, Ouvrir. Pour le désinstaller, glissez-le dans la Corbeille.

**How it is made.** clavis_app.py opens clavis.html (the whole app) in a native window, served from this Mac only at
127.0.0.1:42071, Clavis's own address. GitHub builds it (.github/workflows/clavis-mac.yml) with clavis.spec, opens
it once as Apple silicon and as Intel, and publishes it. "Build Mac App.command" builds it on your own Mac.
