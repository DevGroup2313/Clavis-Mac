@@NAME_UPPER@@ FOR FIRE TABLET, ANDROID, IPHONE AND IPAD  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
NO LICENCE IS GRANTED. See `Fire tablet project/LICENCE.txt` and `iphone-ipad/LICENCE.txt`.

# @@NAME@@ for tablets and phones

The Offline Project's search engine, as an app for a Fire tablet or any Android device, and for iPhone and iPad.
Everything in this repository is written by `tools/make_apps.py` in DevGroup2313/@@NAME@@ (the app's own sources live
there); change it there, not here.

**Fire tablet, Android**: from the Releases page, download `@@FILE@@.apk` on the tablet and open it (allow your browser
to install apps when it asks). Every build is signed with the same key, so a new one installs over the old one and
keeps your library. Uninstall: hold @@NAME@@'s icon, Uninstall.

**iPhone, iPad**: from the Releases page, download `@@NAME@@.ipa` on a computer, open Sideloadly, connect the iPhone or
iPad with its cable, drag `@@NAME@@.ipa` in and press Start, as the family's apps are installed. Uninstall: hold its
icon, Remove App.

Every change to `Fire tablet project/` or `iphone-ipad/` builds it again on GitHub (`.github/workflows/@@FILE@@-apk.yml`,
`.github/workflows/@@FILE@@-ios.yml`) and publishes it.
