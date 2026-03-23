const CACHE_NAME = 'golf-app-v35'; // バージョンを上げて再認識させる
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // CDNのライブラリも事前にキャッシュリストに入れるとオフラインでより安定します
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // --- 文字化け対策の核心部分 ---
        // HTMLファイルの場合、レスポンスヘッダーに charset=UTF-8 を強制的に付与して返す
        if (event.request.url.endsWith('/') || event.request.url.includes('index.html')) {
          const newHeaders = new Headers(cachedResponse.headers);
          newHeaders.set('Content-Type', 'text/html; charset=UTF-8');
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: newHeaders
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
      }).catch(() => {
        // オフラインかつキャッシュもない場合の予備処理（必要に応じて）
      });
    })
  );
});