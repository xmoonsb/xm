const CACHE_NAME = "flags-quiz-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./apps/mobile-100.html",
  "./apps/web-100.html",
  "./apps/mobile-193.html",
  "./apps/web-193.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k))))
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
  }
});
