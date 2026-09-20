// Service worker di "Tommy e la Villa Scura": fa funzionare il gioco anche senza internet.
// Cambia il numero di VERSIONE quando pubblichi una nuova versione dei file.
const VERSIONE = "tommy-v3";
const FILE = [
  "./", "index.html", "style.css", "app.js", "manifest.webmanifest", "PressStart2P.woff2",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== VERSIONE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Prima la rete (cosi' gli aggiornamenti arrivano subito), se offline si usa la copia salvata.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(VERSIONE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))
      )
  );
});
