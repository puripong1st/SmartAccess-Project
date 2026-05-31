'use client';

import { useEffect } from 'react';
import { getFirebaseConfig } from '@/lib/firebase';

/**
 * ServiceWorkerRegistration — ลงทะเบียน Service Worker เดี่ยวที่ชื่อ firebase-messaging-sw.js ที่ Scope '/'
 * เพื่อให้สามารถควบคุมระบบแคชไฟล์ออฟไลน์และเชื่อมเข้ากับ FCM JS SDK ได้อย่างสมบูรณ์แบบไม่ขัดแย้งกัน
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker is not supported in this browser');
      return;
    }

    // ลงทะเบียน Service Worker แบบควบรวมที่ Scope '/' ของเว็บไซต์
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Unified Service Worker registered successfully at root scope:', registration.scope);

        // ส่งข้อมูลคอนฟิกของ Firebase ไปบันทึกในหน่วยความจำของ SW เพื่อเริ่มระบบ FCM
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig) {
          const sendConfig = (sw: ServiceWorker) => {
            sw.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig,
            });
          };

          if (registration.active) {
            sendConfig(registration.active);
          } else if (registration.installing) {
            registration.installing.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') {
                sendConfig(e.target as ServiceWorker);
              }
            });
          } else if (registration.waiting) {
            sendConfig(registration.waiting);
          }
        }
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
