import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { createOfflineDoorGrant, OFFLINE_GRANT_EXPIRY_SECONDS } from "@/lib/qr";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const STUDENT_ID_RE = /^\d{8,13}$|^\d{9,12}-\d$/;
const ROOM_RE = /^[A-Za-z0-9_-]{1,50}$/;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit({ key: `offline_door_grant:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const id = Number(body?.id);
    const studentId = typeof body?.student_id === "string" ? body.student_id.trim() : "";
    const bypassToken = typeof body?.bypass_token === "string" ? body.bypass_token.trim() : "";
    const room = typeof body?.room === "string" ? body.room.trim() : "";
    if (!Number.isSafeInteger(id) || id < 1 || !STUDENT_ID_RE.test(studentId) ||
        !/^[a-f0-9]{48,64}$/i.test(bypassToken) || !ROOM_RE.test(room)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    await initDatabase();
    const { rows } = await getPool().query(
      `SELECT 1 FROM students
       WHERE id = $1 AND student_id = $2 AND bypass_token = $3
         AND requested_room = $4 AND status = 'approved'
         AND approved_at IS NOT NULL
         AND approved_at <= CURRENT_TIMESTAMP
         AND approved_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
       LIMIT 1`,
      [id, studentId, bypassToken, room],
    );
    if (rows.length !== 1) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 403 });
    }

    return NextResponse.json({
      offline_door_grant: createOfflineDoorGrant(room, studentId),
      expires_in: OFFLINE_GRANT_EXPIRY_SECONDS,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Offline Door Grant]", error);
    return NextResponse.json({ error: "Unable to issue offline door grant" }, { status: 500 });
  }
}
