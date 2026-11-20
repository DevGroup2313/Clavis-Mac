# @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
# -*- mode: python ; coding: utf-8 -*-
#
# @@NAME@@ for Windows, the single-file program (@@NAME@@.exe): carries the whole app inside it and opens from
# anywhere it is moved. The installed version is the folder build (@@FILE@@_onedir.spec), as Carpe Diem's.

from PyInstaller.utils.hooks import collect_all

extra_datas, extra_binaries, extra_hidden = [], [], []
for _pkg in ('webview', 'proxy_tools', 'clr_loader', 'pythonnet'):
    try:
        _d, _b, _h = collect_all(_pkg)
        extra_datas += _d
        extra_binaries += _b
        extra_hidden += _h
    except Exception as _e:
        print('@@FILE@@: nothing collected for %s (%s)' % (_pkg, _e))

a = Analysis(
    ['@@FILE@@_app.py'],
    pathex=[],
    binaries=extra_binaries,
    datas=extra_datas + [('@@FILE@@.html', '.'), ('@@FILE@@.ico', '.'), ('@@FILE@@.png', '.')],
    hiddenimports=['webview.platforms.edgechromium', 'webview.platforms.winforms', 'clr'] + extra_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz, a.scripts, a.binaries, a.datas, [],
    name='@@NAME@@',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    icon='@@FILE@@.ico',
)
