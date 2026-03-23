const CACHE_NAME = 'golf-app-v36-fixed';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

// インストール時にすべての資産をキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// フェッチ処理（文字化け対策：Content-Typeヘッダーの強制上書き）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // HTMLファイルの場合、charset=UTF-8 を強制して文字化けを防止
        const contentType = cachedResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html') || event.request.url.endsWith('/') || event.request.url.includes('index.html')) {
          const newHeaders = new Headers(cachedResponse.headers);
          newHeaders.set('Content-Type', 'text/html; charset=UTF-8');
          return cachedResponse.blob().then(blob => {
            return new Response(blob, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: newHeaders
            });
          });
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});