// app/api/students/[id]/approve/route.ts — Approve student + open door
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie, canOperateRoom } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { openDoor } from "@/lib/esp32";
import { sendDiscordNotification } from "@/lib/discord";
import { notifyStudentStatusChange, notifyAdminStudentApproved } from "@/lib/push-notify";
import { sweepExpiredPending } from "@/lib/auto-reject";
import { logEvent, getRequestContext } from "@/lib/access-log";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

function runBackground(task: Promise<unknown>, label: string): void {
  task.catch((err) => console.error(`[Approve] Background ${label} failed:`, err));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied — owner only" }, { status: 403 });

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const pool = getPool();

    await sweepExpiredPending();

    // 1. Fetch the student record first to verify room authorization and status
    const { rows: studentCheckRows } = await pool.query(
      "SELECT id, first_name, last_name, student_id, year, requested_room, status FROM students WHERE id = $1",
      [studentId]
    );
    if (studentCheckRows.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }

    const student = studentCheckRows[0] as {
      id: number;
      first_name: string;
      last_name: string;
      student_id: string;
      year: number;
      requested_room: string;
      status: string;
    };

    if (student.status !== "pending") {
      return NextResponse.json({ error: "นักศึกษานี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" }, { status: 400 });
    }

    // 2. Perform the BOLA/IDOR room permission check BEFORE any status updates are made
    if (!canOperateRoom(admin, student.requested_room)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ควบคุมห้องนี้" }, { status: 403 });
    }

    // Acquire a 5-second concurrency lock to prevent double-triggering or relay chattering
    const lockResult = await rateLimit({
      key: `lock:door:${student.requested_room}`,
      limit: 1,
      windowMs: 5000,
    });
    if (!lockResult.success) {
      return NextResponse.json(
        { error: "ระบบเปิดประตูกำลังประมวลผลคำขอก่อนหน้า โปรดรอ 5 วินาทีก่อนสั่งใหม่อีกครั้ง" },
        { status: 429 }
      );
    }

    // 3. Execute the status update now that the admin is fully authorized
    await pool.query(
      `UPDATE students
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [admin.id, studentId]
    );

    // Open door via ESP32
    const esp32Result = await openDoor(student.student_id, student.requested_room);

    const { ip, userAgent } = getRequestContext(req);
    runBackground(logEvent({
      action: esp32Result.success ? "door_opened" : "door_failed",
      studentId,
      performedBy: admin.id,
      room: student.requested_room,
      ip,
      userAgent,
      esp32Response: esp32Result.message,
      notes: `อนุมัติโดย: ${admin.full_name}`,
      method: "admin_approve",
      severity: esp32Result.success ? "info" : "warning",
    }), "access log");
    if (esp32Result.success) {
      runBackground(
        pool.query("UPDATE students SET last_door_open = CURRENT_TIMESTAMP WHERE id = $1", [studentId]),
        "last_door_open update"
      );
    }

    // Discord notification
    const eventType = esp32Result.success ? "student_approved" : "door_failed";
    await sendDiscordNotification(eventType, {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      esp32Response: esp32Result.message,
      room: student.requested_room,
      ip,
      userAgent,
    }).catch(() => {});

    // PWA Push Notification → แจ้งเตือนนักศึกษาบนอุปกรณ์ที่ลงทะเบียน FCM token ไว้
    runBackground(
      notifyStudentStatusChange(studentId, esp32Result.success ? 'approved' : 'rejected', student.requested_room),
      'push notification'
    );

    // PWA Push Notification → แจ้งเตือนผู้ดูแลระบบทุกคนว่าอนุมัติสำเร็จแล้ว
    if (esp32Result.success) {
      runBackground(
        notifyAdminStudentApproved(
          `${student.first_name} ${student.last_name}`,
          student.student_id,
          student.year,
          student.requested_room,
          admin.full_name
        ),
        'admin approval push notification'
      );
    }

    return NextResponse.json({
      success: true,
      message: `อนุมัติสำเร็จ${esp32Result.success ? " และเปิดประตูแล้ว" : " แต่เปิดประตูไม่สำเร็จ"}`,
      esp32: esp32Result,
    });
  } catch (error) {
    console.error("[Approve] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
