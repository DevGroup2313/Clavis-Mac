#!/usr/bin/env python3
# @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
# engineering or commercial use without the author's written permission.
# See LICENCE.txt. Every distributed copy carries a build marker.
"""
@@NAME@@ — desktop app (Mac and Windows), made the way Carpe Diem's is.

A thin native-window shell around the search engine. All of the app lives in
the bundled page (@@FILE@@.html); this program serves that page from this
computer only, at @@NAME@@'s own address (127.0.0.1:@@PORT@@), and shows it in
a native window with the system's own web view. Searches go out to the sources
you leave switched on; everything you keep stays in your own profile.

Run it with:   python @@FILE@@_app.py
"""

import os
import sys

WINDOW_TITLE = "@@NAME@@"
DEFAULT_WIDTH = 1240
DEFAULT_HEIGHT = 840
MIN_WIDTH = 380
MIN_HEIGHT = 560
APP_PORT = @@PORT@@          # @@NAME@@'s own address, as Carpe Diem has 42049: no other app answers here
BACKGROUND = "@@BG@@"


def tell_user(text, title="@@NAME@@"):
    """Say something the person will actually see: a dialog on Windows and Mac, the terminal otherwise."""
    try:
        sys.stderr.write(text if text.endswith("\n") else text + "\n")
    except Exception:
        pass
    if sys.platform.startswith("win"):
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, str(text), str(title), 0x40)
            return
        except Exception:
            pass
    if sys.platform == "darwin":
        try:
            import subprocess
            body = str(text).replace("\\", "\\\\").replace('"', '\\"')
            head = str(title).replace('"', '\\"')
            subprocess.run(["osascript", "-e", 'display dialog "%s" with title "%s" buttons {"OK"} default button "OK"' % (body, head)],
                           check=False, timeout=120)
        except Exception:
            pass


def open_in_browser(app_html):
    """Last resort: the page itself is the whole application, so the browser can run it."""
    try:
        import webbrowser
        from pathlib import Path
        webbrowser.open(Path(app_html).as_uri())
        return True
    except Exception:
        return False


def resource_path(filename):
    base = getattr(sys, "_MEIPASS", None) or os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, filename)


def find_app_html():
    """The bundled page, wherever PyInstaller put it (Contents/Resources on a Mac, the unpack folder on Windows)."""
    here_script = os.path.dirname(os.path.abspath(__file__))
    try:
        here_exe = os.path.dirname(os.path.abspath(sys.executable))
    except Exception:
        here_exe = here_script
    for path in [resource_path("@@FILE@@.html"),
                 os.path.normpath(resource_path(os.path.join("..", "Resources", "@@FILE@@.html"))),
                 os.path.join(here_exe, "@@FILE@@.html"),
                 os.path.normpath(os.path.join(here_exe, "..", "Resources", "@@FILE@@.html")),
                 os.path.join(here_script, "@@FILE@@.html"),
                 os.path.join(os.getcwd(), "@@FILE@@.html")]:
        if path and os.path.isfile(path):
            return path
    return None


def storage_dir():
    """Where the web view keeps your library, history and settings: your own profile, never the app's folder,
    so updating or uninstalling the app never touches it (as Carpe Diem keeps CarpeDiem/storage)."""
    home = os.path.expanduser("~")
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or os.path.join(home, "AppData", "Local")
    elif sys.platform == "darwin":
        base = os.path.join(home, "Library", "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME") or os.path.join(home, ".local", "share")
    path = os.path.join(base, "@@DATA@@", "storage")
    try:
        os.makedirs(path, exist_ok=True)
        return path
    except Exception:
        log_problem("storage_dir: could not create %r" % path)
        return None


def crash_log_path():
    try:
        base = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, "frozen", False) else __file__))
        probe = os.path.join(base, ".@@FILE@@_write_test")
        with open(probe, "w") as fh:
            fh.write("")
        os.remove(probe)
        return os.path.join(base, "@@FILE@@_crash.log")
    except Exception:
        return os.path.join(os.path.expanduser("~"), "@@FILE@@_crash.log")


def log_problem(tag, exc_info=None):
    """A fault leaves a note to read instead of vanishing."""
    import datetime
    import traceback
    try:
        with open(crash_log_path(), "a", encoding="utf-8") as fh:
            fh.write("\n=== %s  %s ===\n" % (datetime.datetime.now().isoformat(timespec="seconds"), tag))
            if exc_info:
                traceback.print_exception(exc_info[0], exc_info[1], exc_info[2], file=fh)
            elif sys.exc_info()[0] is not None:
                traceback.print_exc(file=fh)
    except Exception:
        pass


def save_bytes(win, name, mime, data_b64):
    """Write an exported file (BibTeX, RIS, the library) from Python, through the system's Save dialog. A web view's
    own download path is where Carpe Diem's export crash was, so it is never used."""
    import base64
    try:
        raw = base64.b64decode(data_b64 or "")
    except Exception:
        log_problem("save_bytes: undecodable payload")
        return False
    keep = " ._-()[]"
    safe = "".join(c for c in str(name or "download") if c.isalnum() or c in keep).strip() or "download"
    target, shown = None, False
    try:
        import webview
        w = win
        if w is None:
            ws = [x for x in (getattr(webview, "windows", None) or []) if x is not None]
            w = ws[0] if ws else None
        if w is not None:
            shown = True
            res = w.create_file_dialog(webview.SAVE_DIALOG, save_filename=safe)
            if res:
                target = res if isinstance(res, str) else res[0]
    except Exception:
        log_problem("save_bytes: file dialog unavailable")
        shown, target = False, None
    if shown and not target:
        return "cancelled"
    if not target:
        d = os.path.join(os.path.expanduser("~"), "Downloads")
        target = os.path.join(d if os.path.isdir(d) else os.path.expanduser("~"), safe)
    try:
        with open(target, "wb") as fh:
            fh.write(raw)
        return target
    except Exception:
        log_problem("save_bytes: write failed")
        return False


def open_url(url):
    """A result's page opens in your own browser, never inside the app."""
    url = str(url or "")
    if not (url.startswith("https://") or url.startswith("http://")):
        return False
    try:
        import webbrowser
        return bool(webbrowser.open(url))
    except Exception:
        log_problem("open_url")
        return False


class Api:
    """What the page may ask of the app (window.pywebview.api)."""

    def __init__(self):
        self.window = None

    def save_file(self, name, mime, data_b64):
        return save_bytes(self.window, name, mime, data_b64)

    def open_url(self, url):
        return open_url(url)

    def app_info(self):
        return {"app": "@@NAME@@", "build": "@@PASS@@", "shell": "desktop", "platform": sys.platform}


def skip_server_name_lookup():
    """Start the page server without asking the network who this computer is (on macOS Sequoia that lookup asks to
    find devices on local networks, and the window stays blank while it waits: Carpe Diem build 1042)."""
    try:
        import http.server
        import socketserver

        def server_bind(self):
            socketserver.TCPServer.server_bind(self)
            host, port = self.server_address[:2]
            self.server_name = host
            self.server_port = port

        http.server.HTTPServer.server_bind = server_bind
    except Exception:
        log_problem("could not skip the page server's name lookup")


def show_seal_in_dock(picture):
    """macOS 26 sets an app's own icon in a grey square when it is not Apple's rounded square, so while the app runs
    the Dock is given the round seal at its full size. Anywhere else nothing changes."""
    if sys.platform != "darwin":
        return
    try:
        pic = resource_path(picture)
        if not os.path.isfile(pic):
            return
        from AppKit import NSApplication, NSImage
        img = NSImage.alloc().initWithContentsOfFile_(pic)
        if img is not None:
            NSApplication.sharedApplication().setApplicationIconImage_(img)
    except Exception:
        log_problem("dock seal", sys.exc_info())


def main():
    skip_server_name_lookup()
    app_html = find_app_html()
    if not app_html:
        tell_user("Could not find @@FILE@@.html, the page that is the whole app.\n\n"
                  "Keep @@FILE@@.html beside this program, or open it on its own: it is the whole app.")
        sys.exit(1)
    try:
        import webview
    except BaseException:
        log_problem("import webview failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user("@@NAME@@ has opened in your browser, because the part that draws its own window is missing.\n\n"
                      "Everything works the same there.")
            return
        tell_user("@@NAME@@ needs pywebview to open its window:  pip install pywebview")
        sys.exit(1)
    try:
        webview.settings["OPEN_EXTERNAL_LINKS_IN_BROWSER"] = True
        webview.settings["ALLOW_DOWNLOADS"] = True
    except Exception:
        pass
    try:
        import platform
        log_problem("start: python %s on %s %s | pywebview %s" % (platform.python_version(), platform.system(), platform.release(),
                                                                 getattr(webview, "__version__", "unknown")))
    except Exception:
        pass
    api = Api()
    try:
        window = webview.create_window(WINDOW_TITLE, app_html, js_api=api, width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT,
                                       min_size=(MIN_WIDTH, MIN_HEIGHT), background_color=BACKGROUND, text_select=True)
        api.window = window
    except BaseException:
        log_problem("create_window failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user("@@NAME@@ could not open its own window on this computer, so it has opened in your browser.\n\n"
                      "Details were written to:\n  %s" % crash_log_path())
            return
        sys.exit(1)

    def _hook(exc_type, exc, tb):
        log_problem("uncaught", (exc_type, exc, tb))
        sys.__excepthook__(exc_type, exc, tb)
    sys.excepthook = _hook

    show_seal_in_dock("@@FILE@@.png")
    store = storage_dir()
    try:
        # private_mode=False and storage_path are what keep your library between openings
        if store:
            webview.start(gui=None, debug=False, private_mode=False, storage_path=store, http_port=APP_PORT)
        else:
            webview.start(gui=None, debug=False, private_mode=False, http_port=APP_PORT)
    except TypeError:
        log_problem("webview.start refused private_mode or storage_path: this pywebview is too old and the library will not persist")
        webview.start(gui=None, debug=False)
    except Exception:
        log_problem("webview.start failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user("@@NAME@@ could not open its own window on this computer, so it has opened in your browser.\n\n"
                      "On Windows that usually means a missing Edge WebView2 runtime.\nDetails were written to:\n  %s" % crash_log_path())


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        log_problem("fatal")
        tell_user("@@NAME@@ stopped unexpectedly.\n\nDetails were written to:\n  %s\n\n@@FILE@@.html still opens the whole app." % crash_log_path())
        sys.exit(1)
