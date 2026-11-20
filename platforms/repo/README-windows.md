@@NAME_UPPER@@ FOR WINDOWS  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
NO LICENCE IS GRANTED. See `Windows project/LICENCE.txt`.

# @@NAME@@ for Windows

The Offline Project's search engine, as a Windows app. Everything in this repository is written by `tools/make_apps.py`
in DevGroup2313/@@NAME@@ (the app's own sources live there); change it there, not here.

**Install**: open the Releases page, download `@@NAME@@-@@PASS@@-Windows-Setup.exe` and run it. It installs for you
alone (no administrator password), puts @@NAME@@ in the Start menu, and copies your library aside before every install.
**Uninstall**: Settings, Apps, @@NAME@@, Uninstall. Your library stays in `%LOCALAPPDATA%\@@DATA@@` unless you delete it.
**Without installing**: `@@NAME@@-Windows.zip` holds the same app as one program; unzip it and double-click it.

Every change to `Windows project/` builds it again on GitHub's own Windows machine, which installs it, opens it and
uninstalls it before publishing it (`.github/workflows/@@FILE@@-windows.yml`).
