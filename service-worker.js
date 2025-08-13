// flags-quiz: service worker v8
// 목적: HTML(홈, index.html)은 "네트워크 우선"으로 최신 표시.
// 게임 본문(flags-*.html)은 아예 간섭하지 않음.

const CACHE = "flags-quiz-v8";
const STATIC = [
  "./manifest.webmanifest"
  // CSS/JS/이미지 따로 쓰면 여기에 추가 가능
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k)))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 1) 게임 본문은 SW가 개입하지 않음
  const isGameHtml = /\/flags-(100|193)-(mobile|web)\.html$/.test(url.pathname) || /\/apps\/.+\.html$/.test(url.pathname);
  if (isGameHtml) return;

  // 2) HTML(네비게이션/홈)은 "네트워크 우선"
  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => {
          // 백업용으로만 보관
          caches.open(CACHE).then(c => c.put(req, res.clone())).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 3) 그 외 정적 리소스는 캐시 우선(없으면 네트워크)
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    const c = await caches.open(CACHE);
    c.put(req, res.clone());
    return res;
  })());
});
