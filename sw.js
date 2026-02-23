const CACHE_NAME = 'standsit-v12';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/measure.html',
  '/history.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // MediaPipe
  '/mediapipe/camera_utils/camera_utils.js',
  '/mediapipe/drawing_utils/drawing_utils.js',
  '/mediapipe/pose/pose.js',
  '/mediapipe/pose/pose_solution_packed_assets_loader.js',
  '/mediapipe/pose/pose_solution_simd_wasm_bin.js',
  '/mediapipe/pose/pose_solution_simd_wasm_bin.wasm',
  '/mediapipe/pose/pose_solution_wasm_bin.js',
  '/mediapipe/pose/pose_solution_wasm_bin.wasm',
  '/mediapipe/pose/pose_solution_simd_wasm_bin.data',
  '/mediapipe/pose/pose_solution_packed_assets.data',
  '/mediapipe/pose/pose_web.binarypb',
];

// インストール時に全ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// キャッシュ優先（オフライン対応）
self.addEventListener('fetch', (event) => {
  // Googleフォントはネットワーク優先・失敗時はスキップ
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request).then(c => c || new Response('', { status: 408 })))
    );
    return;
  }

  // それ以外はキャッシュ優先、なければネットワーク、それもなければindex.htmlを返す
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }).catch(() => {
        // ナビゲーションリクエストの場合はindex.htmlを返す
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
