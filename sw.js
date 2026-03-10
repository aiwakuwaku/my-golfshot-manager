const CACHE_NAME = 'golf-mgr-v101-offline'; // バージョンを上げる
const assets = [
  './',
  './index.html',
  './manifest.json',
  // アイコンファイルが実際に存在することを確認してください。なければリストから消すか作成してください。
  './icon-192.png', 
  './icon-512.png',
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => {
      // 途中で失敗しても残りをキャッシュできるように一つずつ追加する
      return Promise.allSettled(assets.map(url => c.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME && caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 外部CDNも含めてキャッシュから優先的に読み込む
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});