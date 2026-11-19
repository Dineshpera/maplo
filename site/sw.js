/* Maplo service worker: the app opens with no signal, showing the last data it saw.
   - App files (html, css, js, icons): served from cache at once, refreshed in the background.
   - Data (data/*.json): network first, so jobs are fresh; the cached copy if the network fails or is slow.
   - MapLibre and fonts: cache first (their URLs are versioned).
   - OpenFreeMap tiles: served from cache and refreshed, capped so the phone's storage isn't eaten.
   - Share pages (/b/<id>/, /c/<id>/) offline: sent to the app's own #b=<id> view.
   Bump VERSION when the list of app files changes; old caches are deleted on activate. */
const VERSION = "maplo-v1";
const SHELL = `${VERSION}-shell`, DATA = "maplo-data", LIBS = "maplo-libs-v1", TILES = "maplo-tiles-v1";
const KEEP = [SHELL, DATA, LIBS, TILES];
const TILE_CAP = 1500;
const DATA_TIMEOUT = 4000;

const SHELL_FILES = ["./", "style.css", "app.js", "camera.js", "manifest.webmanifest",
  "icons/logo.svg", "icons/icon-192.png", "icons/favicon-32.png"];
const DATA_FILES = ["data/core.json", "data/jobs.json"];
const LIB_FILES = ["https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js",
  "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    await (await caches.open(SHELL)).addAll(SHELL_FILES);
    // Data and libraries are a bonus at install time: a failure here must not block the worker.
    await Promise.allSettled([
      caches.open(DATA).then(c => c.addAll(DATA_FILES)),
      caches.open(LIBS).then(c => c.addAll(LIB_FILES)),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!KEEP.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);

  if (url.origin === scope.origin) {
    if (!url.pathname.startsWith(scope.pathname)) return;
    const path = url.pathname.slice(scope.pathname.length);
    if (req.mode === "navigate") return e.respondWith(navigate(req, path, scope));
    if (path.startsWith("data/")) return e.respondWith(networkFirst(req, DATA));
    return e.respondWith(staleWhileRevalidate(req, SHELL, e));
  }
  if (url.hostname === "unpkg.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com")
    return e.respondWith(cacheFirst(req, LIBS));
  if (url.hostname === "tiles.openfreemap.org")
    return e.respondWith(staleWhileRevalidate(req, TILES, e, TILE_CAP));
});

async function navigate(req, path, scope) {
  try {
    const res = await fetch(req);
    if (res.ok && (path === "" || path === "index.html")) (await caches.open(SHELL)).put("./", res.clone());
    return res;
  } catch {
    const share = path.match(/^([bc])\/([^/]+)\/?(index\.html)?$/);
    if (share) return Response.redirect(`${scope.href}#${share[1]}=${encodeURIComponent(decodeURIComponent(share[2]))}`, 302);
    return (await caches.match("./", { cacheName: SHELL })) || new Response("Offline", { status: 503 });
  }
}

async function networkFirst(req, name) {
  const cache = await caches.open(name);
  const key = req.url.split("?")[0];
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, no) => setTimeout(() => no(new Error("slow")), DATA_TIMEOUT)),
    ]);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, name, e, cap) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: name === SHELL });
  const update = fetch(req).then(async res => {
    if (res.ok) {
      await cache.put(req, res.clone());
      if (cap && Math.random() < 0.05) trim(cache, cap);
    }
    return res;
  }).catch(() => hit || Response.error());
  if (hit) { e.waitUntil(update); return hit; }
  return update;
}

async function trim(cache, cap) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - cap; i++) await cache.delete(keys[i]);
}
