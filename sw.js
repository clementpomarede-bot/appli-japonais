// Service Worker : cache-first pour un fonctionnement 100 % hors-ligne
const CACHE = "nihongo-tabi-v5";
const TAILWIND = "https://cdn.tailwindcss.com";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(["./", "./index.html"]);
    // Tailwind CDN (cross-origin) : réponse opaque, suffisante pour <script>
    try { await c.put(TAILWIND, await fetch(TAILWIND, { mode: "no-cors" })); } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      const c = await caches.open(CACHE);
      c.put(e.request, res.clone());
      return res;
    } catch (_) {
      return (await caches.match("./index.html")) || Response.error();
    }
  })());
});
