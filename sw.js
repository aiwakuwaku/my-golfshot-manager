const CACHE_NAME = 'golf-app-v41-perfect';
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

// インストール: 全資産をキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.log('Cache failed:', url)))
      );
    })
  );
});

// アクティベート: 旧キャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// フェッチ: オフライン表示の核心ロジック
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // コンテンツタイプを取得
        const contentType = cachedResponse.headers.get('content-type') || '';
        
        // HTML, JS, CSS の場合は UTF-8 ヘッダーを強制して文字化けを防ぐ
        if (
          event.request.mode === 'navigate' || 
          event.request.url.endsWith('index.html') ||
          contentType.includes('text/html') ||
          contentType.includes('application/javascript') ||
          contentType.includes('text/css')
        ) {
          const newHeaders = new Headers(cachedResponse.headers);
          newHeaders.set('Content-Type', contentType.split(';')[0] + '; charset=UTF-8');
          
          return cachedResponse.blob().then(blob => {
            return new Response(blob, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: newHeaders
            });
          });
        }
        // 画像などはそのまま（バイナリとして）返す
        return cachedResponse;
      }

      // キャッシュにない場合はネットワークから取得
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // 完全オフラインで未キャッシュの場合
        return new Response('Offline resource not found', { status: 404 });
      });
    })
  );
});