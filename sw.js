/* Service worker: app disponível offline + clique nas notificações */
const CACHE = 'rotina-danilo-v1';
const ARQUIVOS = [
  './', './index.html', './css/estilo.css', './icone.svg', './manifest.webmanifest',
  './js/app.js', './js/agenda.js', './js/estado.js', './js/interface.js',
  './js/notificacoes.js', './js/relatorio.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const c of lista) if ('focus' in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
