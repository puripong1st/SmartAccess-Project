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

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const title = status === 'approved'
      ? '✅ คำขอเข้าห้องได้รับการอนุมัติแล้ว'
      : '❌ คำขอเข้าห้องถูกปฏิเสธ';

    const body = status === 'approved'
      ? `📢 อัปเดตสถานะสิทธิ์การเข้าใช้งาน:\n📍 ห้องเรียน: ${room}\n📅 วันที่: ${dateString}\n⏰ เวลา: ${timeString} น.\n\n🎉 ยินดีด้วย! คำขอได้รับการอนุมัติแล้ว คุณสามารถเปิดเว็บสแกน QR Code เพื่อเปิดประตูเข้าห้องเรียนได้ทันที 🚀`
      : `⚠️ อัปเดตสถานะสิทธิ์การเข้าใช้งาน:\n📍 ห้องเรียน: ${room}\n📅 วันที่: ${dateString}\n⏰ เวลา: ${timeString} น.\n❌ สาเหตุ: ${reason || 'ข้อมูลไม่ครบถ้วน'}\n\nกรุณาติดต่ออาจารย์ผู้สอนหรือแอดมินเพื่อแก้ไขข้อมูลเพิ่มเติม`;

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
    const dateString = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const title = '🚪 ตรวจพบการเปิดประตูสำเร็จ';
    const body = `🔒 ยืนยันความปลอดภัยการเข้า-ออกห้องเรียน:\n📍 สถานที่: ห้อง ${room}\n📅 วันที่: ${dateString}\n⏰ เวลา: ${timeString} น.\n\nระบบตรวจพบการสแกนเปิดประตูด้วยบัญชีของคุณ หากคุณไม่ได้ดำเนินการด้วยตนเอง กรุณาติดต่อแอดมินหรือเปลี่ยนรหัสผ่านเพื่อความปลอดภัยทันที`;

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
    const tokens = await getAllAdminTokens('fcm_notify_register');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const title = '📝 มีคำขอลงทะเบียนเข้าห้องเรียนใหม่';
    const body = `🎓 มีผู้ใช้ส่งคำขอรับอนุมัติสิทธิ์เข้าเรียน:\n👤 ชื่อ-สกุล: ${studentName}\n🆔 รหัสนักศึกษา: ${studentId}\n📍 ขอเข้าใช้ห้อง: ${room}\n📅 วันที่: ${dateString}\n⏰ เวลา: ${timeString} น.\n\nกรุณาเข้าสู่ระบบแดชบอร์ดผู้ดูแลระบบเพื่อตรวจสอบและดำเนินการอนุมัติสิทธิ์ต่อไป`;

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
    const tokens = await getAllAdminTokens('fcm_notify_security_alert');
    if (tokens.length === 0) return;

    const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const title = `🚨 [ALERT] ${alertTitle}`;
    const body = `🔥 ตรวจพบเหตุการณ์ด้านความปลอดภัยระดับวิกฤต!\n📍 หัวข้อ: ${alertTitle}\n📅 วันที่: ${dateString}\n⏰ เวลา: ${timeString} น.\n📝 รายละเอียด: ${alertDetail}\n\nกรุณาเข้าตรวจสอบสถานะบอร์ดและการเข้า-ออกในแดชบอร์ดโดยด่วนเพื่อความปลอดภัยสูงสุดของระบบ`;

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
