# CLAVIS  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
# -*- mode: python ; coding: utf-8 -*-
#
# Clavis for Mac: the PyInstaller recipe, as Carpe Diem's (arguments that exist in PyInstaller 5 and 6 only).
# Built on GitHub's Mac by .github/workflows/clavis-mac.yml, or on your Mac by "Build Mac App.command".

import os
import re
import sys

from PyInstaller.utils.hooks import collect_all

try:
    _pass = re.search(r'^Pass:\s*(\d+)', open('BUILD_INFO.txt', encoding='utf-8').read(), re.M).group(1)
except Exception:
    _pass = '1'

# On GitHub the app is built for Intel and Apple silicon at once (APP_TARGET_ARCH=universal2).
_target_arch = os.environ.get('APP_TARGET_ARCH') or None

extra_datas, extra_binaries, extra_hidden = [], [], []
# pywebview reads its own JavaScript from disk while a window opens, so its files travel inside the bundle
for _pkg in ('webview', 'proxy_tools', 'objc', 'Foundation', 'WebKit'):
    try:
        _d, _b, _h = collect_all(_pkg)
        extra_datas += _d
        extra_binaries += _b
        extra_hidden += _h
    except Exception as _e:
        print('clavis: nothing collected for %s (%s)' % (_pkg, _e))

a = Analysis(
    ['clavis_app.py'],
    pathex=[],
    binaries=extra_binaries,
    datas=extra_datas + [('clavis.html', '.'), ('clavis.icns', '.'), ('clavis.png', '.')],
    # pywebview chooses its backend while running, so nothing imports these by name: named here, or no window
    hiddenimports=['webview.platforms.cocoa', 'objc', 'Foundation', 'AppKit', 'WebKit'] + extra_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Clavis',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=True,
    target_arch=_target_arch,
    codesign_identity=None,
    entitlements_file=None,
    icon='clavis.icns',
)

coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, upx_exclude=[], name='Clavis')

if sys.platform == 'darwin':
    app = BUNDLE(
        coll,
        name='Clavis.app',
        icon='clavis.icns',
        bundle_identifier='com.yannieforest.clavis',
        info_plist={
            'CFBundleName': 'Clavis',
            'CFBundleDisplayName': 'Clavis',
            'CFBundleShortVersionString': _pass,
            'CFBundleVersion': _pass,
            'NSHighResolutionCapable': True,
            'LSMinimumSystemVersion': '11.0',
            'LSApplicationCategoryType': 'public.app-category.reference',
        },
    )
