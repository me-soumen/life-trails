// Life Trails service worker: makes the site installable as an app and opens it fast (and offline).
// - Pages (navigations): network first, so a new deploy shows up on the next open; offline -> the cached app.
// - /assets/* (Vite output, file names contain a content hash, never change): cache first.
// - Anything else on this site (icons, images, manifest): network first, cached copy when offline.
// - Other origins (the API, fonts, visit tracking) are never touched: API data and photos always come live.
// Bump VERSION to drop every cached file on the next visit.
const VERSION = 'v1';
const CACHE = `life-trails-${VERSION}`;

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith('life-trails-') && k !== CACHE).map((k) => caches.delete(k))))
        .then(() => self.clients.claim()));
});

const networkFirst = async (request, fallback) => {
    const cache = await caches.open(CACHE);
    try {
        const res = await fetch(request);
        if (res.ok) cache.put(fallback || request, res.clone());
        return res;
    } catch {
        return (await cache.match(fallback || request)) || Response.error();
    }
};

const cacheFirst = async (request) => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
};

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, '/'));    // every route is the same single-page app
    } else if (url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});
