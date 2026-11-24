// מטמון לטעינה מהירה של מי המתחזה? פרו. קודם הרשת (גרסה עדכנית תמיד), ואם היא איטית/לא זמינה – מהמכשיר.
const V = 'mmpro-v2';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => {
    const net = fetch(r, { cache: 'no-cache' }).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; });
    const hit = c.match(r, { ignoreSearch: true });
    return Promise.race([net, new Promise(ok => setTimeout(() => ok(null), 2500))]).then(res => res || hit.then(h => h || net)).catch(() => hit.then(h => h || Response.error()));
  }));
});
