import { getUserTokens, getAllAdminTokens, sendPushToTokens } from './firebase-admin';
import { getPool } from './db';

/**
 * แจ้งเตือนนักศึกษาเมื่อสถานะการลงทะเบียนเปลี่ยน (อนุมัติ/ปฏิเสธ)
 */
export async function notifyStudentStatusChange(
  studentDbId: number,
  status: 'approved' | 'rejected',
  room: string,
  reason?: string
): Promise<void> {
  try {
    const tokens = await getUserTokens(studentDbId, 'student');
    if (tokens.length === 0) return;

    const title = status === 'approved'
      ? '✅ คำขอเข้าห้องได้รับการอนุมัติแล้ว!'
      : '❌ คำขอเข้าห้องถูกปฏิเสธ';

    const body = status === 'approved'
      ? `คุณได้รับอนุมัติให้เข้าห้อง ${room} แล้ว สามารถสแกน QR Code เพื่อเข้าห้องได้ทันที`
      : `คำขอเข้าห้อง ${room} ถูกปฏิเสธ${reason ? `: ${reason}` : ''}`;

    await sendPushToTokens(tokens, title, body, '/', 'fcm_notify_status_change');
  } catch (error) {
    console.error('[Push] Failed to notify student status change:', error);
  }
}

/**
 * แจ้งเตือนนักศึกษาเมื่อประตูเปิดด้วยบัญชีของตน (ยืนยันความปลอดภัย)
 */
export async function notifyStudentDoorOpen(
  studentDbId: number,
  room: string
): Promise<void> {
  try {
    const tokens = await getUserTokens(studentDbId, 'student');
    if (tokens.length === 0) return;

    const title = '🚪 ประตูเปิดแล้ว';
    const body = `มีการเปิดประตูห้อง ${room} ด้วยบัญชีของคุณเมื่อสักครู่`;

    await sendPushToTokens(tokens, title, body, '/', 'fcm_notify_door_open');
  } catch (error) {
    console.error('[Push] Failed to notify student door open:', error);
  }
}

/**
 * แจ้งเตือนผู้ดูแลระบบทุกคนเมื่อมีนักศึกษาลงทะเบียนใหม่
 */
export async function notifyAdminNewRegistration(
  studentName: string,
  studentId: string,
  room: string
): Promise<void> {
  try {
    const tokens = await getAllAdminTokens();
    if (tokens.length === 0) return;

    const title = '📝 มีนักศึกษาลงทะเบียนใหม่';
    const body = `${studentName} (${studentId}) ขอเข้าห้อง ${room} — รอการอนุมัติ`;

    await sendPushToTokens(tokens, title, body, '/admin/dashboard', 'fcm_notify_register');
  } catch (error) {
    console.error('[Push] Failed to notify admin new registration:', error);
  }
}

/**
 * แจ้งเตือนผู้ดูแลระบบเมื่อเกิดเหตุการณ์ด้านความปลอดภัย (Critical Alert)
 */
export async function notifyAdminSecurityAlert(
  alertTitle: string,
  alertDetail: string
): Promise<void> {
  try {
    const tokens = await getAllAdminTokens();
    if (tokens.length === 0) return;

    const title = `🚨 ${alertTitle}`;
    const body = alertDetail.slice(0, 200);

    await sendPushToTokens(tokens, title, body, '/admin/dashboard', 'fcm_notify_security_alert');
  } catch (error) {
    console.error('[Push] Failed to notify admin security alert:', error);
  }
}

/**
 * บันทึก FCM token ลงฐานข้อมูล
 */
export async function registerFCMToken(
  userId: number,
  role: 'student' | 'admin',
  fcmToken: string,
  deviceInfo?: string
): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO fcm_tokens (user_id, role, fcm_token, device_info)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (fcm_token)
       DO UPDATE SET user_id = $1, role = $2, device_info = $4, created_at = CURRENT_TIMESTAMP`,
      [userId, role, fcmToken, deviceInfo || null]
    );
    return true;
  } catch (error) {
    console.error('[Push] Failed to register FCM token:', error);
    return false;
  }
}

/**
 * ลบ FCM token (เมื่อผู้ใช้ logout หรือถอน permission)
 */
export async function unregisterFCMToken(fcmToken: string): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM fcm_tokens WHERE fcm_token = $1', [fcmToken]);
    return true;
  } catch (error) {
    console.error('[Push] Failed to unregister FCM token:', error);
    return false;
  }
}
