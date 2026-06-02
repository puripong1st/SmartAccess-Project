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
    const tokens = await getUserTokens(studentDbId, 'student', 'fcm_notify_status_change');
    if (tokens.length === 0) return;

    const title = status === 'approved'
      ? '✅ คำขอเข้าห้องได้รับการอนุมัติแล้ว'
      : '❌ คำขอเข้าห้องเรียนถูกปฏิเสธ';

    const body = status === 'approved'
      ? `📍 ห้อง ${room}\n🎉 เปิดเว็บเพื่อสแกน QR Code เข้าห้องได้ทันที`
      : `📍 ห้อง ${room}\n⚠️ สาเหตุ: ${reason || 'ข้อมูลไม่ครบถ้วน'}`;

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
    const tokens = await getUserTokens(studentDbId, 'student', 'fcm_notify_door_open');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const title = '🚪 เปิดประตูสำเร็จ';
    const body = `📍 ห้อง ${room}\n⏰ ${timeString} น.\n🔒 หากไม่ใช่คุณกรุณาแจ้งผู้ดูแลระบบทันที`;

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
  studentYear: number | string,
  room: string
): Promise<void> {
  try {
    const tokens = await getAllAdminTokens('fcm_notify_register');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const title = '📝 คำขอลงทะเบียนเข้าห้องใหม่';
    const body = `👤 ${studentName} (${studentId}) ชั้นปี ${studentYear}\n📍 ห้อง ${room}\n⏰ ${timeString} น.`;

    await sendPushToTokens(tokens, title, body, '/admin/dashboard', 'fcm_notify_register');
  } catch (error) {
    console.error('[Push] Failed to notify admin new registration:', error);
  }
}

/**
 * แจ้งเตือนผู้ดูแลระบบทุกคนเมื่อคำขอได้รับการอนุมัติสำเร็จ
 */
export async function notifyAdminStudentApproved(
  studentName: string,
  studentId: string,
  studentYear: number | string,
  room: string,
  adminName: string
): Promise<void> {
  try {
    const tokens = await getAllAdminTokens('fcm_notify_register');
    if (tokens.length === 0) return;

    const title = '✅ อนุมัติสิทธิ์เข้าใช้งานสำเร็จ';
    const body = `👤 ${studentName} (${studentId}) ชั้นปี ${studentYear}\n📍 ห้อง ${room}\n👑 โดย: ${adminName}`;

    await sendPushToTokens(tokens, title, body, '/admin/dashboard', 'fcm_notify_register');
  } catch (error) {
    console.error('[Push] Failed to notify admin student approved:', error);
  }
}

/**
 * แจ้งเตือนผู้ดูแลระบบทุกคนเมื่อมีผู้เข้าห้องเรียนผ่านสิทธิ์ Bypass
 */
export async function notifyAdminBypassEntry(
  studentName: string,
  studentId: string,
  studentYear: number | string,
  room: string
): Promise<void> {
  try {
    const tokens = await getAllAdminTokens('fcm_notify_security_alert');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const title = '⚡ ผ่านเข้าห้องเรียนด้วย Bypass';
    const body = `👤 ${studentName} (${studentId}) ชั้นปี ${studentYear}\n📍 ห้อง ${room}\n⏰ ${timeString} น.`;

    await sendPushToTokens(tokens, title, body, '/admin/dashboard', 'fcm_notify_security_alert');
  } catch (error) {
    console.error('[Push] Failed to notify admin bypass entry:', error);
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
    const tokens = await getAllAdminTokens('fcm_notify_security_alert');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const title = `🚨 แจ้งเตือน: ${alertTitle}`;
    const body = `📝 รายละเอียด: ${alertDetail}\n⏰ ${timeString} น.`;

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
  deviceInfo?: string,
  preferences?: {
    fcm_notify_register?: string;
    fcm_notify_door_open?: string;
    fcm_notify_status_change?: string;
    fcm_notify_security_alert?: string;
  }
): Promise<boolean> {
  try {
    const pool = getPool();
    const notify_register = preferences?.fcm_notify_register === '0' ? '0' : '1';
    const notify_door_open = preferences?.fcm_notify_door_open === '0' ? '0' : '1';
    const notify_status_change = preferences?.fcm_notify_status_change === '0' ? '0' : '1';
    const notify_security_alert = preferences?.fcm_notify_security_alert === '0' ? '0' : '1';

    await pool.query(
      `INSERT INTO fcm_tokens (user_id, role, fcm_token, device_info, fcm_notify_register, fcm_notify_door_open, fcm_notify_status_change, fcm_notify_security_alert)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (fcm_token)
       DO UPDATE SET user_id = $1, role = $2, device_info = $4, 
                     fcm_notify_register = $5, fcm_notify_door_open = $6, fcm_notify_status_change = $7, fcm_notify_security_alert = $8,
                     created_at = CURRENT_TIMESTAMP`,
      [userId, role, fcmToken, deviceInfo || null, notify_register, notify_door_open, notify_status_change, notify_security_alert]
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
