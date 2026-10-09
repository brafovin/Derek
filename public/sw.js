/* Service Worker: das Spiel (eine einzige Datei) wird zwischengespeichert und läuft danach auch offline (Solo). */
const CACHE = 'letzte-aufnahme-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']).catch(() => { })).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' && (u.pathname === '/' || u.pathname === '/index.html')) {   // Netz zuerst (neue Version), sonst Cache
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('/', cp)); return r; }).catch(() => caches.match('/')));
  } else if (u.pathname.startsWith('/icons/') || u.pathname === '/manifest.webmanifest') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
