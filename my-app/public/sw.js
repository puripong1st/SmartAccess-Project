// sw.js — SmartAccess Vanilla Service Worker
// กลยุทธ์: Network-First (เน้นข้อมูลเรียลไทม์ / ใช้แคชเมื่อออฟไลน์)
const CACHE_NAME = 'smartaccess-cache-v1';

// Static shell ที่ pre-cache ตอนติดตั้ง
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: ล้างแคชเก่า ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-First Strategy ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ข้าม non-GET requests (API POST/PUT/DELETE)
  if (request.method !== 'GET') return;

  // ข้าม API routes, auth, และ browser-extension
  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.protocol === 'chrome-extension:'
  ) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // แคชเฉพาะ response สำเร็จ
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // ออฟไลน์ → ดึงจากแคช
        return caches.match(request);
      })
  );
});

// ── Push Notification (จาก FCM) ──
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 SmartAccess',
    body: 'มีเหตุการณ์ใหม่ในระบบ',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      // FCM wraps data in notification/data fields
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
        data.icon = payload.notification.icon || data.icon;
      }
      if (payload.data) {
        data.url = payload.data.url || data.url;
      }
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'เปิดดู' },
      { action: 'close', title: 'ปิด' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // ถ้ามีหน้าต่างเปิดอยู่แล้ว ให้โฟกัส
      for (const client of clientList) {
        if (new URL(client.url).pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // ถ้าไม่มี เปิดหน้าต่างใหม่
      return self.clients.openWindow(targetUrl);
    })
  );
});
