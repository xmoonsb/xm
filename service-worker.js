// flags-quiz: service worker v5 (apps 페이지 무간섭)
const CACHE = "flags-quiz-v5";
const CORE = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // 외부 출처 패스
  if (url.origin !== location.origin) return;

  // 앱 HTML은 절대 가로채지 않음(브라우저 네이티브로)
  const isApp = /^\/xm\/apps\/.+\.html$/.test(url.pathname) || /\/apps\/.+\.html$/.test(url.pathname);
  if (isApp) return;

  // 코어/정적 리소스는 캐시 우선
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    const res = await fetch(e.request);
    const c = await caches.open(CACHE);
    c.put(e.request, res.clone());
    return res;
  })());
});
