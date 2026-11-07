// Service worker do Alchemist's Corner: deixa o jogo abrir sem internet depois da primeira visita.
// Na instalação guarda todos os arquivos do build (lista em precache.json, gerada pelo Vite).
// Páginas: rede primeiro (para pegar versões novas), cache se estiver offline.
// Arquivos com hash no nome (JS, CSS, imagens, fontes): cache primeiro, porque nunca mudam.
const CACHE = 'alchemists-corner';
const SHELL = ['./', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

async function precache() {
  const cache = await caches.open(CACHE);
  let files = [];
  try {
    files = (await (await fetch('./precache.json', { cache: 'no-store' })).json()).files.map((f) => './' + f);
  } catch {
    // Sem lista (modo dev): guarda só o básico.
  }
  const keep = new Set([...SHELL, ...files].map((u) => new URL(u, self.location.href).href));
  await cache.addAll([...keep]);
  // Remove arquivos de versões antigas.
  for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./', { ignoreVary: true })),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
