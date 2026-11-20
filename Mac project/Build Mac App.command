#!/bin/bash
# CLAVIS  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.
# Builds Clavis.app on this Mac (GitHub builds it too, and puts it on the Releases page). Needs Python 3.
cd "$(dirname "$0")" || exit 1
echo "Building Clavis for this Mac..."
python3 -m venv .buildenv && . .buildenv/bin/activate || { echo "Python 3 is needed: https://www.python.org/downloads/"; exit 1; }
python -m pip install --quiet --upgrade pip pyinstaller pywebview || exit 1
python -m PyInstaller --noconfirm --clean clavis.spec > build_log.txt 2>&1 || { tail -n 15 build_log.txt; exit 1; }
cp -R "dist/Clavis.app" "$HOME/Desktop/" && echo "Clavis.app is on your Desktop. Drag it to Applications."
