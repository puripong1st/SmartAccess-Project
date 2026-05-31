// firebase-messaging-sw.js — Firebase Cloud Messaging Service Worker
// ไฟล์นี้ต้องอยู่ที่ root ของ public/ เพื่อให้ FCM SDK ค้นหาเจอ
// การจัดการ push event จริงอยู่ใน sw.js (ไม่ซ้ำซ้อน)
// ไฟล์นี้ทำหน้าที่เป็น stub สำหรับ Firebase SDK compatibility

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Firebase config จะถูก inject ผ่าน postMessage จาก client
// หรือสามารถ hardcode ค่า public config ได้เนื่องจากเป็น publishable keys
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const messaging = firebase.messaging();
    // Background message handler
    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload.notification?.title || '🔔 SmartAccess';
      const notificationOptions = {
        body: payload.notification?.body || 'มีเหตุการณ์ใหม่',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: payload.data || {},
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});
