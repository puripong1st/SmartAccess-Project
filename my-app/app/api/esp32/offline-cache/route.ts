import { NextRequest, NextResponse } from "next/server";
import { verifyEsp32Security } from "@/lib/api-security";
import { getPool, initDatabase } from "@/lib/db";
import { deriveOfflineDoorSigningKey } from "@/lib/qr";

export const runtime = "nodejs";

const ENDPOINT_PATH = "/api/esp32/offline-cache";
const DEVICE_ID_RE = /^esp32_([A-Za-z0-9_-]{1,50})$/;

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const security = await verifyEsp32Security(req, ENDPOINT_PATH);
    if (!security.allowed) return security.errorResponse!;

    const deviceId = req.headers.get("x-device-id") || "";
    const match = DEVICE_ID_RE.exec(deviceId);
    if (!match) {
      return NextResponse.json({ error: "Invalid device identity" }, { status: 401 });
    }

    const signedRoom = match[1];
    const requestedRoom = (req.nextUrl.searchParams.get("room") || "").trim();
    if (requestedRoom !== signedRoom) {
      return NextResponse.json({ error: "Room mismatch" }, { status: 403 });
    }

    const { rows } = await getPool().query(
      `SELECT student_id FROM students
       WHERE requested_room = $1 AND status = 'approved'
       ORDER BY student_id ASC
       LIMIT 150`,
      [signedRoom],
    );

    return NextResponse.json({
      schema_version: 1,
      room: signedRoom,
      students: rows.map((row) => String(row.student_id)),
      qr_key: deriveOfflineDoorSigningKey(signedRoom),
      generated_at: Math.floor(Date.now() / 1000),
    }, {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    console.error("[ESP32 Offline Cache]", error);
    return NextResponse.json({ error: "Unable to build offline cache" }, { status: 503 });
  }
}
