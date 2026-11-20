# @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
# -*- mode: python ; coding: utf-8 -*-
#
# @@NAME@@ for Windows, the folder build (dist_installed\@@NAME@@\) that the installer (build\@@FILE@@.iss) puts in
# %LOCALAPPDATA%\Programs\@@NAME@@: it opens faster than the single file, which unpacks itself at every start.

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
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name='@@NAME@@', debug=False, bootloader_ignore_signals=False,
          strip=False, upx=False, console=False, disable_windowed_traceback=False, icon='@@FILE@@.ico')
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, upx_exclude=[], name='@@NAME@@')
