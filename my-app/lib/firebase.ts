// lib/firebase.ts — Firebase Client SDK Configuration (PWA Push Notifications)
// ใช้สำหรับฝั่ง Browser เท่านั้น (ไม่ใช่ server-side)

/**
 * Firebase client config — ค่าเหล่านี้เป็น publishable keys (ปลอดภัยที่จะเปิดเผย)
 * ต้องตั้งค่าใน .env.local ด้วย NEXT_PUBLIC_ prefix
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export function getFirebaseConfig(): FirebaseConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * VAPID Key สำหรับ Web Push (ค่าจาก Firebase Console > Cloud Messaging > Web Push certificates)
 */
export function getVapidKey(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
}
