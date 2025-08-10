// flags-quiz: service worker v4
const CACHE = "flags-quiz-v4";

// 꼭 필요한 코어 파일만 선캐시 (앱 본문은 네트워크 우선)
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting(); // 즉시 새 SW 적용
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

// /apps/*.html 은 네트워크 우선, 실패 시 캐시
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // 외부 리소스는 패스
  if (url.origin !== location.origin) return;

  // GitHub Pages 하위경로(/xm/) 고려
  const isAppPage =
    /^\/xm\/apps\/.+\.html$/.test(url.pathname) || /\/apps\/.+\.html$/.test(url.pathname);

  if (isAppPage) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // 그 외 정적 리소스는 캐시 우선
  e.respondWith(cacheFirst(e.request));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: "no-store" });
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response("오프라인입니다.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(CACHE);
  cache.put(req, res.clone());
  return res;
}
