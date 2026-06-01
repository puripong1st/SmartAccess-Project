// firebase-messaging-sw.js — SmartAccess Unified Service Worker (PWA Caching & FCM Notifications)
// ไฟล์นี้ตั้งอยู่ที่ root ของ public/ เพื่อให้ FCM SDK สามารถสแกนพบโดยอัตโนมัติ
// และลงทะเบียนที่ Scope '/' เพื่อดูแลทั้งการแคชไฟล์แบบออฟไลน์และการรับแจ้งเตือนพุชแบบเรียลไทม์

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// ──────────────────────────────────────────────────────────────────────────────
// FCM INITIALIZATION (ต้องทำตอน "Initial Evaluation" ของ Worker เท่านั้น)
// คอนฟิกถูกส่งผ่าน query string ตอนลงทะเบียน (ดู ServiceWorkerRegistration.tsx)
// การ initialize ที่ระดับบนสุดทำให้ FCM ผูก event 'push'/'notificationclick' ได้ถูกต้อง
// แก้ปัญหา warning: "Event handler must be added on the initial evaluation of worker script"
// ──────────────────────────────────────────────────────────────────────────────
const swParams = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: swParams.get('apiKey') || '',
  authDomain: swParams.get('authDomain') || '',
  projectId: swParams.get('projectId') || '',
  storageBucket: swParams.get('storageBucket') || '',
  messagingSenderId: swParams.get('messagingSenderId') || '',
  appId: swParams.get('appId') || '',
};

if (firebaseConfig.apiKey && firebaseConfig.projectId && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // ฟังก์ชันอ่านการตั้งค่าจาก IndexedDB (เนื่องจาก Service Worker ใช้ localStorage ไม่ได้)
  function getLocalSetting(key) {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("smartaccess_db", 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings");
          }
        };
        request.onsuccess = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("settings")) {
            resolve(null);
            return;
          }
          const tx = db.transaction("settings", "readonly");
          const store = tx.objectStore("settings");
          const getReq = store.get(key);
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  // จัดการข้อความ Push แจ้งเตือนเมื่อแอปพลิเคชันอยู่ใน Background state
  // เราส่งแบบ data-only payload จากเซิร์ฟเวอร์ จึงต้องสร้าง notification เองที่นี่
  // (กันปัญหา "แจ้งเตือนซ้ำ 2 ครั้ง" จากการที่เบราว์เซอร์แสดง notification payload ให้อัตโนมัติ)
  messaging.onBackgroundMessage(async (payload) => {
    // หากมีฟิลด์ notification ติดมาใน payload, FCM JS SDK จะดึงไปแสดงผลแบบ Native ให้อยู่แล้ว
    // เราจะไม่รันคำสั่ง showNotification ซ้ำเพื่อหลีกเลี่ยงการแจ้งเตือนซ้ำซ้อน (Double Notification)
    if (payload.notification) {
      console.log('[PWA SW] FCM native notification exists. Skipping manual showNotification to prevent duplicates.');
      return;
    }

    const d = payload.data || {};
    const type = d.type;

    // กรองประเภทแจ้งเตือนรายอุปกรณ์ (ถ้าถูกปิดไว้ใน IndexedDB ก็จะไม่แสดงแจ้งเตือน)
    if (type) {
      const isEnabled = await getLocalSetting(type);
      if (isEnabled === "0") {
        console.log(`[PWA SW] Notification of type '${type}' is disabled on this device. Blocked.`);
        return;
      }
    }

    const title = d.title || '🔔 SmartAccess';
    const options = {
      body: d.body || 'มีข้อความแจ้งเตือนใหม่ในระบบ',
      icon: d.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: { url: d.url || '/' },
      vibrate: [100, 50, 100],
      tag: d.tag || undefined, // รวมการแจ้งเตือนเรื่องเดียวกันไม่ให้รก
    };
    self.registration.showNotification(title, options);
  });
}

const CACHE_NAME = 'smartaccess-cache-v4';

// คลังรายการ Static Assets ที่จะ pre-cache ตอนติดตั้ง
const PRECACHE_ASSETS = [
  '/admin/login',
  '/manifest.json',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: เตรียม Pre-cache สำหรับการใช้งานแบบออฟไลน์ ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // ใช้ Promise.allSettled กันไฟล์ใดไฟล์หนึ่งโหลดไม่ได้แล้วทำให้ install ล้มทั้งชุด
      .then((cache) => Promise.allSettled(PRECACHE_ASSETS.map((a) => cache.add(a))))
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

  // ข้ามเส้นทางที่เป็น API, หน้าเว็บ Next.js ภายใน, คู่มือระบบเล่มหนา, หรือ Chrome-extension
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/complete_system_manual_th') ||
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

// ── Notification Click: ดึงโฟกัสหน้าต่างเบราว์เซอร์หรือเปิดหน้าใหม่ ──
// ผูกที่ระดับบนสุดของสคริปต์ (Initial Evaluation) ตามข้อกำหนดของ Service Worker
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
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
