'use client';

import { useEffect } from 'react';
import { getFirebaseConfig } from '@/lib/firebase';

/**
 * ServiceWorkerRegistration — ลงทะเบียน Service Worker + Firebase Messaging SW
 * ใช้เป็น Client Component แยกจาก layout.tsx ที่เป็น Server Component
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker is not supported in this browser');
      return;
    }

    // 1. ลงทะเบียน Service Worker หลัก
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // 2. ส่ง Firebase config ไปยัง Firebase Messaging SW
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig && registration.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        }
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // 3. ลงทะเบียน Firebase Messaging Service Worker แยก
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' })
      .then((registration) => {
        console.log('[FCM] Firebase Messaging SW registered:', registration.scope);

        // ส่ง config เมื่อ SW พร้อม
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig) {
          const sendConfig = (sw: ServiceWorker) => {
            sw.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
          };
          if (registration.active) {
            sendConfig(registration.active);
          } else if (registration.installing) {
            registration.installing.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') {
                sendConfig(e.target as ServiceWorker);
              }
            });
          }
        }
      })
      .catch((error) => {
        console.error('[FCM] Firebase Messaging SW registration failed:', error);
      });
  }, []);

  return null;
}
