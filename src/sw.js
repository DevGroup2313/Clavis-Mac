/* Clavis's keeper. The page carries its dictionary, word list, citation engine and PDF reader inside it, so keeping the
   page, its manifest and its icons when it is installed is enough for the whole app to open and work with no connection. The pictures of articles you keep are held in their own keep
   ("clavis-pictures"), which a new build never empties. A new build brings a new name, and the old keep is let go.
   Nothing is ever sent anywhere by this file. */
const CACHE = "clavis-__BUILD__", MINE = "clavis-", PICS = "clavis-pictures";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/seal-32.png", "icons/seal-night-32.png", "icons/seal-192.png", "icons/seal-512.png",
  "icons/seal-maskable-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(MINE) && k !== CACHE && k !== PICS).map(k => caches.delete(k))))
  .then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  /* the pictures of kept articles: from their keep when there is one, so a kept article reads the same offline */
  if (u.hostname === "upload.wikimedia.org") {
    e.respondWith(caches.open(PICS).then(c => c.match(r.url).then(hit => hit || fetch(r).catch(() => hit || Response.error()))));
    return;
  }
  const home = new URL("./", self.registration.scope).pathname;
  if (u.origin !== location.origin || !u.pathname.startsWith(home)) return;
  /* the page itself comes from the host first whenever there is a connection (so a new build arrives at once), and from
     the keep without one */
  if (u.pathname === home || u.pathname === home + "index.html" || u.pathname === home + "manifest.webmanifest") {
    e.respondWith(fetch(r, { cache: "no-cache" }).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(h => h || c.match("index.html")))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
});
