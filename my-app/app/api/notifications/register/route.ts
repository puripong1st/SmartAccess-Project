// app/api/notifications/register/route.ts — รับและบันทึก FCM Token จากอุปกรณ์
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/auth';
import { registerFCMToken, unregisterFCMToken } from '@/lib/push-notify';
import { initDatabase } from '@/lib/db';

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

/**
 * POST /api/notifications/register
 * Body: { token: string, role: 'student' | 'admin', userId?: number, deviceInfo?: string }
 *
 * สำหรับ admin: ดึง userId จาก JWT cookie อัตโนมัติ
 * สำหรับ student: ต้องส่ง userId มาด้วย (student DB id)
 */
export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json() as {
      token?: string;
      role?: string;
      userId?: number;
      deviceInfo?: string;
    };
    const { token, role, userId, deviceInfo } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    if (role !== 'student' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    let resolvedUserId: number;

    if (role === 'admin') {
      // ผู้ดูแลระบบ: ตรวจสอบ JWT และดึง id อัตโนมัติ
      const admin = await getAdminFromCookie();
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      resolvedUserId = admin.id;
    } else {
      // นักศึกษา: ต้องส่ง userId มา
      if (!userId || typeof userId !== 'number') {
        return NextResponse.json({ error: 'Missing userId for student' }, { status: 400 });
      }
      resolvedUserId = userId;
    }

    const success = await registerFCMToken(resolvedUserId, role, token, deviceInfo);

    if (!success) {
      return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    console.error('[Notifications] Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/register
 * Body: { token: string }
 * ลบ FCM token เมื่อผู้ใช้ปิดการแจ้งเตือน
 */
export async function DELETE(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json() as { token?: string };
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    const success = await unregisterFCMToken(token);

    if (!success) {
      return NextResponse.json({ error: 'Failed to unregister token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'FCM token removed' });
  } catch (error) {
    console.error('[Notifications] Unregister error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
