// lib/firebase-admin.ts — Firebase Admin SDK for server-side push notification dispatch
// ใช้ใน API routes (serverless functions) เท่านั้น

import { getPool } from './db';

// Firebase Admin SDK types (เราใช้ REST API โดยตรงเพื่อไม่ต้องเพิ่ม dependency)
interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  webpush?: {
    fcm_options?: {
      link?: string;
    };
    notification?: {
      icon?: string;
      badge?: string;
    };
  };
  data?: Record<string, string>;
}

interface FCMSendResult {
  success: boolean;
  token: string;
  error?: string;
}

// Google OAuth2 access token cache
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * สร้าง JWT สำหรับแลก access token กับ Google OAuth2
 * ใช้ service account credentials จาก environment variables
 */
async function getAccessToken(): Promise<string | null> {
  // ใช้ cached token ถ้ายังไม่หมดอายุ
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60000) {
    return cachedAccessToken.token;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const tokenUri = 'https://oauth2.googleapis.com/token';

  if (!clientEmail || !privateKey) {
    console.warn('[FCM] Firebase service account credentials not configured (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
    return null;
  }

  try {
    // สร้าง JWT claim
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = btoa(JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: tokenUri,
      exp: now + 3600,
      iat: now,
    }));

    // ลงนาม JWT ด้วย Web Crypto API
    const signInput = `${header}.${claim}`;
    const keyData = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const jwt = `${header}.${claim}.${signatureB64}`;

    // แลก JWT เป็น access token
    const res = await fetch(tokenUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!res.ok) {
      console.error('[FCM] Failed to get access token:', await res.text());
      return null;
    }

    const tokenData = await res.json() as { access_token: string; expires_in: number };
    cachedAccessToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };
    return tokenData.access_token;
  } catch (error) {
    console.error('[FCM] Error getting access token:', error);
    return null;
  }
}

/**
 * ส่ง push notification ผ่าน FCM HTTP v1 API
 */
export async function sendFCMNotification(message: FCMMessage): Promise<FCMSendResult> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return { success: false, token: message.token, error: 'Firebase project not configured' };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, token: message.token, error: 'Failed to get FCM access token' };
  }

  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as Record<string, unknown>;
      const errorCode = (errBody as { error?: { code?: number } })?.error?.code;

      // Token หมดอายุหรือใช้ไม่ได้ → ลบออกจาก DB
      if (errorCode === 404 || errorCode === 400) {
        await removeInvalidToken(message.token);
      }
      return { success: false, token: message.token, error: JSON.stringify(errBody) };
    }

    return { success: true, token: message.token };
  } catch (error) {
    return {
      success: false,
      token: message.token,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ลบ token ที่ไม่ valid ออกจากฐานข้อมูล (FCM token expired/revoked)
 */
async function removeInvalidToken(token: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM fcm_tokens WHERE fcm_token = $1', [token]);
    console.log('[FCM] Removed invalid FCM token from database');
  } catch (error) {
    console.error('[FCM] Failed to remove invalid token:', error);
  }
}

/**
 * ดึง FCM tokens ทั้งหมดของผู้ใช้คนหนึ่ง (Multi-device support)
 */
export async function getUserTokens(
  userId: number,
  role: 'student' | 'admin'
): Promise<string[]> {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT fcm_token FROM fcm_tokens WHERE user_id = $1 AND role = $2',
      [userId, role]
    );
    return rows.map((r: { fcm_token: string }) => r.fcm_token);
  } catch (error) {
    console.error('[FCM] Failed to get user tokens:', error);
    return [];
  }
}

/**
 * ดึง FCM tokens ของผู้ดูแลระบบทุกคน (สำหรับส่งแจ้งเตือนกลุ่ม)
 */
export async function getAllAdminTokens(): Promise<string[]> {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT DISTINCT ft.fcm_token FROM fcm_tokens ft
       INNER JOIN admin_users au ON ft.user_id = au.id AND ft.role = 'admin'
       WHERE au.is_active = TRUE`
    );
    return rows.map((r: { fcm_token: string }) => r.fcm_token);
  } catch (error) {
    console.error('[FCM] Failed to get admin tokens:', error);
    return [];
  }
}

/**
 * ส่ง push notification ไปยังผู้ใช้หลายคน (batch)
 */
export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    tokens.map((token) =>
      sendFCMNotification({
        token,
        notification: { title, body },
        webpush: {
          fcm_options: { link: url || '/' },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
          },
        },
        data: { url: url || '/' },
      })
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
