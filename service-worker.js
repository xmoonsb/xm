// flags-quiz: service worker v6 (루트 HTML 무간섭)
const CACHE = "flags-quiz-v6";
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
  if (url.origin !== location.origin) return;

  // 게임 본문(루트 HTML)과 /apps/*.html 은 절대 가로채지 않음
  const isGameHtml =
    /\/(mobile|web)-(100|193)\.html$/.test(url.pathname) ||
    /\/apps\/.+\.html$/.test(url.pathname);
  if (isGameHtml) return;

  // 나머지 정적 리소스는 캐시 우선
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    const res = await fetch(e.request);
    const c = await caches.open(CACHE);
    c.put(e.request, res.clone());
    return res;
  })());
});
