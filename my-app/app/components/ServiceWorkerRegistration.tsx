'use client';

import { useEffect } from 'react';
import { getFirebaseConfig } from '@/lib/firebase';

declare global {
  interface Window {
    __smartaccessMarkHydrated?: () => void;
  }
}

/**
 * ลงทะเบียน Service Worker สำหรับ FCM ที่ scope '/' และสั่งล้างเฉพาะ
 * Cache Storage รุ่นเก่าซึ่งเคยเก็บหน้าเว็บไว้ โดยไม่แตะข้อมูลผู้ใช้ส่วนอื่น
 *
 * หมายเหตุสำคัญ: เราแนบ Firebase config ผ่าน query string ของ URL ไฟล์ SW
 * เพื่อให้ตัว SW สามารถ initialize Firebase ได้ทันทีตอน "Initial Evaluation"
 * (จำเป็นต่อการผูก event 'push'/'notificationclick' ให้ถูกต้องตามสเปก Service Worker)
 * วิธีนี้แก้ปัญหา warning และทำให้ getToken/FCM ทำงานได้เสถียร แทนการ postMessage แบบ lazy เดิม
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__smartaccessMarkHydrated?.();

    // Clear only Cache Storage created by old SmartAccess workers. Keep
    // localStorage, cookies, IndexedDB and push preferences intact.
    if ('caches' in window) {
      caches.keys()
        .then((keys) => {
          const deletions: Promise<boolean>[] = [];
          for (const key of keys) {
            if (key.startsWith('smartaccess-cache-')) {
              deletions.push(caches.delete(key));
            }
          }
          return Promise.all(deletions);
        })
        .catch((error) => console.warn('[PWA] Legacy cache cleanup failed:', error));
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker is not supported in this browser');
      return;
    }

    const firebaseConfig = getFirebaseConfig();

    // สร้าง URL ของ SW พร้อมแนบคอนฟิก (publishable keys — ปลอดภัยที่จะเปิดเผยฝั่ง client)
    let swUrl = '/firebase-messaging-sw.js';
    if (firebaseConfig) {
      const params = new URLSearchParams({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
      swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
    }

    navigator.serviceWorker
      .register(swUrl, { scope: '/', updateViaCache: 'none' })
      .then(async (registration) => {
        registration.installing?.postMessage({ type: 'SKIP_WAITING' });
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        registration.active?.postMessage({ type: 'CLEAR_APP_CACHES' });
        await registration.update();
        console.log('[PWA] Unified Service Worker registered successfully at root scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
