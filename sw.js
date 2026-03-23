const CACHE_NAME = 'golf-app-v40-ultimate';
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

// インストール: キャッシュを強制的に作成
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching all assets');
      // 一つ失敗しても中断されないよう個別にキャッシュ
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.log('Failed to cache:', url, err)))
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

// フェッチ: キャッシュがあればそれを返す（オフライン優先）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // キャッシュがあれば即座に返す
      if (cachedResponse) {
        // 文字化け対策: HTMLファイルには明示的にcharsetを付加
        if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
          const newHeaders = new Headers(cachedResponse.headers);
          newHeaders.set('Content-Type', 'text/html; charset=UTF-8');
          return cachedResponse.blob().then(blob => {
            return new Response(blob, {
              status: cachedResponse.status,
              headers: newHeaders
            });
          });
        }
        return cachedResponse;
      }

      // キャッシュにない場合はネットワークから取得
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // ネットワークもダメで、キャッシュもない場合
        return new Response('Offline contents not available', { status: 503 });
      });
    })
  );
});