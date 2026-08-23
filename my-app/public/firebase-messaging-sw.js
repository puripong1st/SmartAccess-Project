// firebase-messaging-sw.js — SmartAccess notification-only Service Worker.
// ไฟล์นี้ตั้งอยู่ที่ root ของ public/ เพื่อให้ FCM SDK สามารถสแกนพบโดยอัตโนมัติ
// ห้าม cache HTML/navigation ของ Next.js เพราะ HTML เก่าอาจอ้าง chunk ที่ถูกลบหลัง deploy
// และทำให้ Raspberry Pi แสดงหน้าขาวจนต้องล้าง cache ด้วยตนเอง

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

const APP_CACHE_PREFIX = 'smartaccess-cache-';

async function clearLegacyAppCaches() {
  const keys = await caches.keys();
  const deletions = [];
  for (const key of keys) {
    if (key.startsWith(APP_CACHE_PREFIX)) {
      deletions.push(caches.delete(key));
    }
  }
  await Promise.all(deletions);
}

// ── Install: activate immediately; this worker no longer pre-caches pages ──
self.addEventListener('install', (event) => {
  event.waitUntil(clearLegacyAppCaches().then(() => self.skipWaiting()));
});

// ── Activate: remove every page cache created by previous releases ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearLegacyAppCaches().then(() => self.clients.claim())
  );
});

// The worker intentionally has no fetch handler. Documents and Next.js chunks
// therefore follow the server's HTTP cache headers and can never be mixed
// across deployments by Cache Storage.

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_APP_CACHES') {
    event.waitUntil(clearLegacyAppCaches());
  } else if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
