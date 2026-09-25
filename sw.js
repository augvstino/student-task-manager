const CACHE_NAME = "task-manager-shell-v1";
const SHELL_FILES = [
  ".",
  "index.html",
  "css/style.css",
  "js/config.js",
  "js/auth.js",
  "js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept Supabase (or any cross-origin) requests — always go live
  if (url.origin !== self.location.origin) return;

  // For same-origin shell files, try cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});