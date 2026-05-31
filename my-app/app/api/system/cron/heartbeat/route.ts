export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT room_code, status 
       FROM esp32_heartbeats 
       WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
       AND status = 'online'`
    );

    let offlineCount = 0;
    for (const row of rows) {
      await pool.query(
        "UPDATE esp32_heartbeats SET status = 'offline' WHERE room_code = $1",
        [row.room_code]
      );
      
      await sendDiscordNotification("esp32_offline", {
        room: row.room_code,
        ip: "ไม่ทราบ (Offline)", // Usually we'd get this from settings, but for heartbeat alert this is fine
        reason: "ขาดการติดต่อนานเกิน 5 นาที (Heartbeat Timeout)",
      });
      offlineCount++;
    }

    return NextResponse.json({ success: true, offlineDevicesDetected: offlineCount });
  } catch (error) {
    console.error("[Heartbeat Cron Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
