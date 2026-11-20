"""Writes the four real apps from one page and one identity, as the family's builders do: the Mac app, the Windows
app and installer, the Fire tablet app and the iPhone and iPad app, each with its GitHub workflow that builds it,
opens it, and puts it on the Releases page.

    python3 -I tools/make_apps.py          (from the clavis folder, after tools/build.py)

Reads app.json (the name, the app ids, the data folder, the port, the build number) and icons/seal-1024.png (the seal
on nothing). Writes "Mac project", "Windows project", "Fire tablet project", "iphone-ipad" and
../.github/workflows/<file>-{mac,windows,apk,ios}.yml. Everything it wrote before is cleared first, so a new name
leaves nothing of the old one behind (platforms/generated.json lists what it wrote).
"""
import json
import os
import re
import shutil
import uuid

from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(HERE, "platforms")


def ident():
    a = json.load(open(os.path.join(HERE, "app.json"), encoding="utf-8"))
    name, file = a["name"], a["file_name"]
    tok = {
        "NAME": name, "NAME_UPPER": name.upper(), "NAME_DASH": re.sub(r"\s+", "-", name.strip()),
        "NAME_ID": re.sub(r"[^A-Za-z0-9]", "", name), "IOS_TARGET": re.sub(r"[^A-Za-z0-9]", "", name.title()),
        "FILE": file, "APP_ID": a["app_id"], "ANDROID_ID": a["android_id"], "DATA": a["data_folder"],
        "PORT": str(a["port"]), "PASS": str(a["pass"]), "BG": a.get("background", "#f5f2ea"), "PREFIX": "", "PREFIX_WIN": "",
        "GUID": str(uuid.uuid5(uuid.NAMESPACE_URL, "offline-project/" + a["app_id"])).upper(),
        "HOME_REPO": a.get("repos", {}).get("mac", "DevGroup2313/" + name),
    }
    return a, tok


def fill(text, tok):
    def sub(m):
        k = m.group(1)
        if k not in tok:
            raise KeyError("unknown token @@%s@@" % k)
        return tok[k]
    return re.sub(r"@@([A-Z_]+)@@", sub, text)


def write(path, text, written):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    written.append(os.path.abspath(path))


def copy(src, dst, written):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)
    written.append(os.path.abspath(dst))


def tpl(rel, tok):
    return fill(open(os.path.join(T, rel), encoding="utf-8").read(), tok)


def info(a, tok):
    return (f"{a['name']}\nPass: {a['pass']}\nCopyright (c) 2026 Yannie D. Forest. All rights reserved.\nNO LICENCE IS GRANTED.\n")


def icons(seal, out_dir, written):
    """The seal as each system wants it: on nothing for the Mac, Windows and the tablet (as Carpe Diem's), and on a
    white square where a system insists on filling a square itself (the iPhone's and iPad's home screen)."""
    im = Image.open(seal).convert("RGBA")
    big = im.resize((1024, 1024), Image.LANCZOS)
    res = {}
    p = os.path.join(out_dir, "seal-1024.png"); big.save(p); res["1024"] = p
    p = os.path.join(out_dir, "seal-512.png"); big.resize((512, 512), Image.LANCZOS).save(p); res["512"] = p
    p = os.path.join(out_dir, "app.icns"); big.save(p, format="ICNS"); res["icns"] = p
    p = os.path.join(out_dir, "app.ico"); big.save(p, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]); res["ico"] = p
    sq = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    inner = big.resize((940, 940), Image.LANCZOS)
    sq.alpha_composite(inner, (42, 42))
    p = os.path.join(out_dir, "ios-1024.png"); sq.convert("RGB").save(p); res["ios"] = p
    for d, px in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
        p = os.path.join(out_dir, f"android-{d}.png"); big.resize((px, px), Image.LANCZOS).save(p); res[d] = p
    return res


def readme_desktop(tok, which):
    n, f = tok["NAME"], tok["FILE"]
    if which == "mac":
        return f"""{tok['NAME_UPPER']}  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED. See LICENCE.txt.

# {n} for Mac

**Install.** Download {tok['NAME_DASH']}-Mac.zip from the Releases page ("{f}-mac"), open it, and drag {n}.app to
Applications. The first time, right-click {n}.app, Open, Open (macOS asks once for any app not notarised by Apple;
MACOS_IF_BLOCKED.txt has the other ways). One app for Intel and Apple silicon Macs.

**Uninstall.** Drag {n}.app to the Bin. Your library stays in ~/Library/Application Support/{tok['DATA']} until you
delete that folder too.

**Installer en français.** Téléchargez {tok['NAME_DASH']}-Mac.zip, ouvrez-le et glissez {n}.app dans Applications.
La première fois : clic droit sur {n}.app, Ouvrir, Ouvrir. Pour le désinstaller, glissez-le dans la Corbeille.

**How it is made.** {f}_app.py opens {f}.html (the whole app) in a native window, served from this Mac only at
127.0.0.1:{tok['PORT']}, {n}'s own address. GitHub builds it (.github/workflows/{f}-mac.yml) with {f}.spec, opens
it once as Apple silicon and as Intel, and publishes it. "Build Mac App.command" builds it on your own Mac.
"""
    return f"""{tok['NAME_UPPER']}  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED. See LICENCE.txt.

# {n} for Windows

**Install.** Download {tok['NAME_DASH']}-<build>-Windows-Setup.exe from the Releases page ("{f}-windows") and run it.
It installs for you alone, with no administrator password, adds {n} to the Start menu (and to the Desktop if you
tick it). If Windows SmartScreen says it protected your PC: More info, Run anyway (it is not signed by Microsoft).

**Uninstall.** Settings, Apps, {n}, Uninstall. Your library stays in %LOCALAPPDATA%\\{tok['DATA']} until you delete
that folder too; a copy of it is made before every install, in %LOCALAPPDATA%\\{tok['DATA']}\\backups.

**Installer en français.** Téléchargez {tok['NAME_DASH']}-<build>-Windows-Setup.exe et lancez-le : l'installation se
fait pour vous seul, sans mot de passe administrateur. Pour désinstaller : Paramètres, Applications, {n}, Désinstaller.

**The single program.** {tok['NAME_DASH']}-Windows.zip holds {n}.exe, which opens from anywhere you put it.

**How it is made.** {f}_app.py opens {f}.html (the whole app) in a native window (Edge WebView2), served from this
PC only at 127.0.0.1:{tok['PORT']}. GitHub builds it (.github/workflows/{f}-windows.yml), installs it, opens it,
uninstalls it, checks the library folder was untouched, and publishes it.
"""


def build():
    a, tok = ident()
    seal = os.path.join(HERE, a.get("seal_1024") or "art/seal/1024/seal-day.png")
    tg = {k: os.path.normpath(os.path.join(HERE, v)) for k, v in a["targets"].items()}
    gen = os.path.join(T, "generated.json")
    if os.path.exists(gen):  # clear what was written last time, so a new name leaves nothing of the old one
        for p in json.load(open(gen)):
            if os.path.isfile(p):
                os.remove(p)
    for base, d in ((tg["mac"], "Mac project"), (tg["windows"], "Windows project"), (tg["mobile"], "Fire tablet project"), (tg["mobile"], "iphone-ipad")):
        p = os.path.join(base, d)
        if os.path.isdir(p):
            shutil.rmtree(p)
    written = []
    tmp = os.path.join(T, ".icons")
    os.makedirs(tmp, exist_ok=True)
    ic = icons(seal, tmp, written=None or [])
    page = os.path.join(HERE, a["file_name"] + ".html")
    f = tok["FILE"]
    lic = tpl("LICENCE.txt", tok)

    mac = os.path.join(tg["mac"], "Mac project")
    write(os.path.join(mac, f + "_app.py"), tpl("desktop/app.py", tok), written)
    write(os.path.join(mac, f + ".spec"), tpl("desktop/mac.spec", tok), written)
    copy(page, os.path.join(mac, f + ".html"), written)
    copy(ic["512"], os.path.join(mac, f + ".png"), written)
    copy(ic["icns"], os.path.join(mac, f + ".icns"), written)
    write(os.path.join(mac, "BUILD_INFO.txt"), info(a, tok), written)
    write(os.path.join(mac, "LICENCE.txt"), lic, written)
    write(os.path.join(mac, "README.md"), readme_desktop(tok, "mac"), written)
    write(os.path.join(mac, "MACOS_IF_BLOCKED.txt"), fill(MACOS_BLOCKED, tok), written)
    write(os.path.join(mac, "Build Mac App.command"), fill(MAC_COMMAND, tok), written)
    os.chmod(os.path.join(mac, "Build Mac App.command"), 0o755)

    win = os.path.join(tg["windows"], "Windows project")
    write(os.path.join(win, f + "_app.py"), tpl("desktop/app.py", tok), written)
    write(os.path.join(win, f + ".spec"), tpl("desktop/win.spec", tok), written)
    write(os.path.join(win, f + "_onedir.spec"), tpl("desktop/win_onedir.spec", tok), written)
    write(os.path.join(win, "build", f + ".iss"), tpl("desktop/setup.iss", tok), written)
    copy(page, os.path.join(win, f + ".html"), written)
    copy(ic["512"], os.path.join(win, f + ".png"), written)
    copy(ic["ico"], os.path.join(win, f + ".ico"), written)
    write(os.path.join(win, "BUILD_INFO.txt"), info(a, tok), written)
    write(os.path.join(win, "LICENCE.txt"), lic, written)
    write(os.path.join(win, "README.md"), readme_desktop(tok, "win"), written)
    write(os.path.join(win, ".gitattributes"), "# Keep the app file byte for byte as committed (as Carpe Diem's): Git on Windows would rewrite its line endings.\n*.html -text\n*.js -text\n*.json -text\n", written)
    write(os.path.join(win, f"Build {tok['NAME']} (Windows).bat"), fill(WIN_BAT, tok), written)

    apk = os.path.join(tg["mobile"], "Fire tablet project")
    write(os.path.join(apk, "settings.gradle"), tpl("android/settings.gradle", tok), written)
    write(os.path.join(apk, "build.gradle"), tpl("android/build.gradle", tok), written)
    write(os.path.join(apk, "gradle.properties"), tpl("android/gradle.properties", tok), written)
    write(os.path.join(apk, "gradle", "wrapper", "gradle-wrapper.properties"), tpl("android/gradle-wrapper.properties", tok), written)
    write(os.path.join(apk, "app", "build.gradle"), tpl("android/app.build.gradle", tok), written)
    copy(os.path.join(T, "android", "app.keystore"), os.path.join(apk, "app", "app.keystore"), written)
    main = os.path.join(apk, "app", "src", "main")
    write(os.path.join(main, "AndroidManifest.xml"), tpl("android/AndroidManifest.xml", tok), written)
    write(os.path.join(main, "java", *tok["ANDROID_ID"].split("."), "MainActivity.java"), tpl("android/MainActivity.java", tok), written)
    copy(page, os.path.join(main, "assets", f + ".html"), written)
    for d in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"):
        copy(ic[d], os.path.join(main, "res", "mipmap-" + d, "ic_launcher.png"), written)
    write(os.path.join(main, "res", "values", "strings.xml"), tpl("android/strings.xml", tok), written)
    write(os.path.join(apk, "BUILD_INFO.txt"), info(a, tok), written)
    write(os.path.join(apk, "LICENCE.txt"), lic, written)
    write(os.path.join(apk, "README_BUILD.txt"), fill(APK_README, tok), written)

    ios = os.path.join(tg["mobile"], "iphone-ipad")
    tgt = tok["IOS_TARGET"]
    write(os.path.join(ios, tgt + ".xcodeproj", "project.pbxproj"), tpl("ios/project.pbxproj", tok), written)
    for sw in ("ShellApp.swift", "ShellSchemeHandler.swift", "SaveSheet.swift", "DeskView.swift", "Info.plist"):
        write(os.path.join(ios, tgt, sw), tpl("ios/" + sw, tok), written)
    copy(page, os.path.join(ios, tgt, "www", f + ".html"), written)
    write(os.path.join(ios, tgt, "Assets.xcassets", "Contents.json"), '{\n  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n', written)
    write(os.path.join(ios, tgt, "Assets.xcassets", "AppIcon.appiconset", "Contents.json"),
          '{\n  "images" : [\n    {\n      "filename" : "icon-1024.png",\n      "idiom" : "universal",\n      "platform" : "ios",\n      "size" : "1024x1024"\n    }\n  ],\n  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n', written)
    copy(ic["ios"], os.path.join(ios, tgt, "Assets.xcassets", "AppIcon.appiconset", "icon-1024.png"), written)
    write(os.path.join(ios, "BUILD_INFO.txt"), info(a, tok), written)
    write(os.path.join(ios, "LICENCE.txt"), lic, written)
    write(os.path.join(ios, "README.txt"), fill(IOS_README, tok), written)

    for k, base in (("mac", tg["mac"]), ("windows", tg["windows"]), ("apk", tg["mobile"]), ("ios", tg["mobile"])):
        write(os.path.join(base, ".github", "workflows", f"{f}-{k}.yml"), tpl(f"workflows/{k}.yml", tok), written)
    # each app repository says on its front page what it holds and how to install and uninstall it
    write(os.path.join(tg["windows"], "README.md"), tpl("repo/README-windows.md", tok), written)
    write(os.path.join(tg["mobile"], "README.md"), tpl("repo/README-mobile.md", tok), written)
    # the website's copy: the page, its keeper, its manifest and its icons
    web = tg["web"]
    copy(page, os.path.join(web, "index.html"), written)
    copy(os.path.join(HERE, "sw.js"), os.path.join(web, "sw.js"), written)
    write(os.path.join(web, "manifest.webmanifest"), tpl("web/manifest.webmanifest", tok), written)
    for fn in sorted(os.listdir(os.path.join(HERE, "icons"))):
        copy(os.path.join(HERE, "icons", fn), os.path.join(web, "icons", fn), written)
    json.dump(written, open(gen, "w"), indent=1)
    for name, base in tg.items():
        print(f"  {name}: {base}")
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"{len(written)} files written for {tok['NAME']} (build {tok['PASS']})")


MACOS_BLOCKED = """@@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.

@@NAME@@ on macOS: if it will not open the first time
=====================================================

macOS says "Apple could not verify @@NAME@@ is free of malware" for any app that has not been through Apple's paid
notarisation service. It is not saying it found something; it has no proof from Apple, so it asks you. Choose one:

1. Right-click (or Control-click) @@NAME@@.app in Applications, choose Open, then Open again. Only the first time.

2. System Settings, Privacy & Security: scroll down to the message about @@NAME@@ and press Open Anyway.

3. In Terminal:   xattr -dr com.apple.quarantine /Applications/@@NAME@@.app   then double-click it.

En français : clic droit sur @@NAME@@.app, Ouvrir, puis Ouvrir encore (la première fois seulement). Ou : Réglages
Système, Confidentialité et sécurité, Ouvrir quand même.
"""

MAC_COMMAND = """#!/bin/bash
# @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.
# Builds @@NAME@@.app on this Mac (GitHub builds it too, and puts it on the Releases page). Needs Python 3.
cd "$(dirname "$0")" || exit 1
echo "Building @@NAME@@ for this Mac..."
python3 -m venv .buildenv && . .buildenv/bin/activate || { echo "Python 3 is needed: https://www.python.org/downloads/"; exit 1; }
python -m pip install --quiet --upgrade pip pyinstaller pywebview || exit 1
python -m PyInstaller --noconfirm --clean @@FILE@@.spec > build_log.txt 2>&1 || { tail -n 15 build_log.txt; exit 1; }
cp -R "dist/@@NAME@@.app" "$HOME/Desktop/" && echo "@@NAME@@.app is on your Desktop. Drag it to Applications."
"""

WIN_BAT = """@echo off
rem @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.
rem Builds @@NAME@@.exe on this PC (GitHub builds it too, with its installer, and puts both on the Releases page).
cd /d "%~dp0"
py -m pip install --quiet --upgrade pip pyinstaller pywebview pythonnet || goto :fail
py -m PyInstaller --noconfirm --clean @@FILE@@.spec > build_log.txt 2>&1 || goto :fail
echo @@NAME@@.exe is in the dist folder.
pause
exit /b 0
:fail
echo The build did not finish. See build_log.txt.
pause
exit /b 1
"""

APK_README = """@@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.

@@NAME@@ for Fire tablet and Android
=====================================

INSTALL. On the tablet, open the Releases page of this repository ("@@FILE@@-apk"), tap @@FILE@@.apk, then open it
from Downloads and press Install. The first time, the tablet asks to allow installs from the browser (Silk): allow
it. Each new build installs over the old one and keeps your library.

UNINSTALL. Hold the seal on the home screen, then Uninstall (or Settings, Apps & Notifications, @@NAME@@, Uninstall).

EN FRANÇAIS. Sur la tablette, téléchargez @@FILE@@.apk depuis la page Releases, ouvrez-le depuis Téléchargements et
appuyez sur Installer. Pour désinstaller : maintenez le sceau appuyé, puis Désinstaller.

HOW IT IS MADE. A web view holds the page the app carries (app/src/main/assets/@@FILE@@.html), served from the app at
https://appassets.androidplatform.net, so the library persists on the tablet. GitHub builds it with Gradle 8.7
(.github/workflows/@@FILE@@-apk.yml). The app is signed with app/app.keystore, the same key every time, so updates
install over each other.
"""

IOS_README = """@@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved. NO LICENCE IS GRANTED.

@@NAME@@ FOR IPHONE AND IPAD
============================

Made from the recipe that builds The Forge for iPhone and iPad (the same Xcode project): one window holding the web
view that runs @@FILE@@.html, served from the app's own bundle at a fixed address, so the library you keep persists.

INSTALL. GitHub builds @@IOS_TARGET@@.ipa (.github/workflows/@@FILE@@-ios.yml) and puts it on the Releases page
("@@FILE@@-ios"). The IPA is not signed: Apple lets no app onto an iPhone or iPad unless it is signed with an Apple
ID, so Sideloadly signs it with yours while it installs it over the cable, as Inkwell, Ingenium and The Forge are
installed. On a computer: download @@IOS_TARGET@@.ipa, open Sideloadly, connect the iPhone or iPad, drag the IPA in,
type your Apple ID, Start. With a free Apple ID, install it again every 7 days (your library stays).

UNINSTALL. Hold the seal on the Home Screen, Remove App, Delete App.

EN FRANÇAIS. Téléchargez @@IOS_TARGET@@.ipa, ouvrez Sideloadly sur un ordinateur, branchez l'iPhone ou l'iPad, glissez
le fichier, saisissez votre identifiant Apple et appuyez sur Start. Pour désinstaller : maintenez le sceau appuyé,
Supprimer l'app.
"""

if __name__ == "__main__":
    build()
