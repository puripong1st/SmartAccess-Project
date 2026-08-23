// Legacy cleanup worker. Older Raspberry Pi installations may still check
// /sw.js for updates, so activate this tiny worker and remove stale page caches.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        const deletions = [];
        for (const key of keys) {
          if (key.startsWith('smartaccess-cache-')) {
            deletions.push(caches.delete(key));
          }
        }
        return Promise.all(deletions);
      })
      .then(() => self.clients.claim())
  );
});
