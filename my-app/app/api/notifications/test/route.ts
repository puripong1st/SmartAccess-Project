// app/api/notifications/test/route.ts — API สำหรับส่งข้อความพุชทดสอบไปยังอุปกรณ์แอดมินคนปัจจุบัน
import { NextRequest, NextResponse } from 'next/server';
import { sendFCMNotification } from '@/lib/firebase-admin';
import { initDatabase } from '@/lib/db';

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

/**
 * POST /api/notifications/test
 * Body: { token: string }
 * ยิงส่ง Push Notification ทดสอบเข้าอุปกรณ์โดยตรงเพื่อตรวจสอบการทำงานของ Service Worker
 */
export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json() as { token?: string };
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'ไม่พบ FCM token สำหรับทดสอบ' }, { status: 400 });
    }

    console.log('[FCM-Test] Dispatching test push notification to token:', token.substring(0, 15) + '...');
    const result = await sendFCMNotification({
      token,
      notification: {
        title: '🔔 ทดสอบแจ้งเตือน SmartAccess PWA',
        body: 'ยินดีด้วย! ระบบแจ้งเตือนพุชบนมือถือและ Service Worker ของคุณทำงานอย่างสมบูรณ์แบบเรียลไทม์แล้ว 🚀',
      },
      webpush: {
        fcm_options: { link: '/admin/dashboard' },
        notification: {
          icon: '/icons/icon-128x128.png',
          badge: '/icons/icon-96x96.png',
        },
      },
      data: { url: '/admin/dashboard' },
    });

    if (!result.success) {
      console.error('[FCM-Test] Send error:', result.error);
      return NextResponse.json({ error: result.error || 'ล้มเหลวในการส่งข้อความพุชผ่าน Firebase' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'ส่งการแจ้งเตือนพุชทดสอบสำเร็จแล้ว! กรุณาเช็คบนหน้าจอมือถือของคุณ' });
  } catch (error: any) {
    console.error('[FCM-Test] API Error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
