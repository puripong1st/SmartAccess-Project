// firebase-messaging-sw.js — SmartAccess Unified Service Worker (PWA Caching & FCM Notifications)
// ไฟล์นี้ตั้งอยู่ที่ root ของ public/ เพื่อให้ FCM SDK สามารถสแกนพบโดยอัตโนมัติ
// และลงทะเบียนที่ Scope '/' เพื่อดูแลทั้งการแคชไฟล์แบบออฟไลน์และการรับแจ้งเตือนพุชแบบเรียลไทม์

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

const CACHE_NAME = 'smartaccess-cache-v2';

// คลังรายการ Static Assets ที่จะ pre-cache ตอนติดตั้ง
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: เตรียม Pre-cache สำหรับการใช้งานแบบออฟไลน์ ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: ทำความสะอาดแคชเวอร์ชันเก่าที่ค้างอยู่ในเครื่องผู้ใช้ ──
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

// ── Fetch: Network-First Caching Strategy (เน้นข้อมูลเรียลไทม์ / ใช้แคชเมื่อเน็ตหลุด) ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ข้ามคำขอที่ไม่ใช่ GET (เช่นพวก API POST/PUT/DELETE)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  
  // ข้ามเส้นทางที่เป็น API, หน้าเว็บ Next.js ภายใน, หรือ Chrome-extension
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.protocol === 'chrome-extension:'
  ) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // แคชเฉพาะการดาวน์โหลดหน้าเว็บที่สำเร็จเท่านั้น
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // หากเน็ตหลุด (Offline) ดึงเอาแคชที่บันทึกไว้ในเครื่องมาใช้งานแทน
        return caches.match(request);
      })
  );
});

// ── Message Listener: รับข้อมูล Firebase Config เพื่อเริ่มงาน FCM SDK ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const messaging = firebase.messaging();
    
    // จัดการข้อความ Push แจ้งเตือนเมื่อแอปพลิเคชันอยู่ใน Background state
    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM-Background] Received background message:', payload);
      const notificationTitle = payload.notification?.title || '🔔 SmartAccess';
      const notificationOptions = {
        body: payload.notification?.body || 'มีข้อความแจ้งเตือนใหม่ในระบบ',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: payload.data || {},
        vibrate: [100, 50, 100],
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});

// ── Native Push Event Listener (เสริมนิยายรองรับแอนดรอยด์และเบราว์เซอร์เก่า) ──
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 SmartAccess',
    body: 'มีข้อความใหม่ในระบบควบคุม',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
        data.icon = payload.notification.icon || data.icon;
      }
      if (payload.data) {
        data.url = payload.data.url || data.url;
      }
    } catch (_e) {
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

// ── Notification Click: ดึงโฟกัสหน้าต่างเบราว์เซอร์หรือเปิดหน้าใหม่ ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // ค้นหาหน้าต่างที่เปิดแอปไว้แล้วเพื่อทำการโฟกัสโดยไม่ต้องโหลดใหม่
      for (const client of clientList) {
        if (new URL(client.url).pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // ถ้าปิดอยู่ ให้ทำการเปิดหน้าเว็บขึ้นมาใหม่
      return self.clients.openWindow(targetUrl);
    })
  );
});
