import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { verifyEsp32Security } from "@/lib/api-security";
import {
  MAX_OFFLINE_LOG_BODY_BYTES,
  validateOfflineLogBatch,
} from "@/lib/offline-logs";

export const runtime = "nodejs";

const ENDPOINT_PATH = "/api/esp32/logs/sync";
const DEVICE_ID_RE = /^esp32_([A-Za-z0-9_-]{1,50})$/;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_OFFLINE_LOG_BODY_BYTES) {
    return json({ error: "Request body too large" }, 413);
  }

  try {
    await initDatabase();
    const security = await verifyEsp32Security(req, ENDPOINT_PATH);
    if (!security.allowed) return security.errorResponse!;

    const deviceId = req.headers.get("x-device-id") || "";
    const deviceMatch = DEVICE_ID_RE.exec(deviceId);
    if (!deviceMatch) return json({ error: "Invalid device identity" }, 401);
    const signedRoom = deviceMatch[1];

    const bodyText = await req.text();
    if (Buffer.byteLength(bodyText, "utf8") > MAX_OFFLINE_LOG_BODY_BYTES) {
      return json({ error: "Request body too large" }, 413);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const validation = validateOfflineLogBatch(payload, signedRoom);
    if (!validation.ok) return json({ error: validation.error }, 400);

    const pool = getPool();
    const client = await pool.connect();
    const acknowledged: string[] = [];
    const rejected: Array<{ event_id: string; reason: string }> = [];
    let accepted = 0;
    let duplicates = 0;

    try {
      await client.query("BEGIN");
      for (const event of validation.batch.events) {
        let studentDbId: number | null = null;
        if (event.student_code) {
          const studentResult = await client.query(
            `SELECT id, status FROM students
             WHERE student_id = $1 AND requested_room = $2
             LIMIT 1`,
            [event.student_code, signedRoom],
          );
          const student = studentResult.rows[0] as { id: number; status: string } | undefined;
          if (!student || student.status !== "approved") {
            rejected.push({ event_id: event.event_id, reason: "student_not_approved" });
            continue;
          }
          studentDbId = student.id;
        }

        const now = Math.floor(Date.now() / 1000);
        const occurredAt = event.occurred_at !== null &&
          event.occurred_at >= 1_704_067_200 &&
          event.occurred_at <= now + 300
          ? event.occurred_at
          : null;
        const details = JSON.stringify({
          source: "esp32_offline_sync",
          event_id: event.event_id,
          device_id: deviceId,
          uptime_seconds: event.uptime_seconds,
          clock_trusted: occurredAt !== null,
        });

        const insertResult = await client.query(
          `INSERT INTO access_logs
             (student_id, action, timestamp, notes, room_code, method, ip_address,
              details, severity, source_event_id)
           VALUES ($1, $2, COALESCE(to_timestamp($3), CURRENT_TIMESTAMP), $4, $5,
                   $6, $7, $8, 'info', $9)
           ON CONFLICT (source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING
           RETURNING id`,
          [
            studentDbId,
            event.action,
            occurredAt,
            `Offline access synchronized by ${deviceId}`,
            signedRoom,
            `offline_${event.method}`,
            security.clientIp || "unknown",
            details,
            event.event_id,
          ],
        );

        acknowledged.push(event.event_id);
        if ((insertResult.rowCount || 0) === 1) accepted += 1;
        else duplicates += 1;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return json({
      success: true,
      accepted,
      duplicates,
      rejected,
      ack_event_ids: acknowledged,
    });
  } catch (error) {
    console.error("[ESP32 Offline Log Sync]", error);
    return json({ error: "Unable to synchronize offline logs" }, 503);
  }
}
