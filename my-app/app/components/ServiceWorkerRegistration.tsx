'use client';

import { useEffect } from 'react';
import { getFirebaseConfig } from '@/lib/firebase';

/**
 * ServiceWorkerRegistration — ลงทะเบียน Service Worker เดี่ยวที่ชื่อ firebase-messaging-sw.js ที่ Scope '/'
 * เพื่อให้สามารถควบคุมระบบแคชไฟล์ออฟไลน์และเชื่อมเข้ากับ FCM JS SDK ได้อย่างสมบูรณ์แบบไม่ขัดแย้งกัน
 *
 * หมายเหตุสำคัญ: เราแนบ Firebase config ผ่าน query string ของ URL ไฟล์ SW
 * เพื่อให้ตัว SW สามารถ initialize Firebase ได้ทันทีตอน "Initial Evaluation"
 * (จำเป็นต่อการผูก event 'push'/'notificationclick' ให้ถูกต้องตามสเปก Service Worker)
 * วิธีนี้แก้ปัญหา warning และทำให้ getToken/FCM ทำงานได้เสถียร แทนการ postMessage แบบ lazy เดิม
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Unified Service Worker registered successfully at root scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
