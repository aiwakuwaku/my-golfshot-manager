const CACHE_NAME = 'golf-pro-v2-11-cache-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-golf.png'
];

// インストール時に全資産をキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS).catch(err => {
        console.error('Failed to cache assets. Check if icon-golf.png exists.', err);
      });
    })
  );
});

// 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// キャッシュ優先戦略 (Stale-While-Revalidate)
// キャッシュがあれば即座に返し、同時にネットワークから最新を取得してキャッシュを更新します
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // 取得成功したらキャッシュを更新
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // ネットワークエラー時（完全オフライン）は何もせずエラーを出さない
        });

        // キャッシュがあればそれを返す。なければネットワークの結果を待つ
        return cachedResponse || fetchedResponse;
      });
    })
  );
});