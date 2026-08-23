// app/api/esp32/display/route.ts — Local Node.js Runtime for Raspberry Pi self-hosted deployment
// เชื่อมต่อตรงไปยังฐานข้อมูล PostgreSQL ท้องถิ่นแทน Supabase Cloud REST API

import { NextRequest, NextResponse } from "next/server";
import { sha1Hex } from "@/lib/edge-crypto";
import { cacheGet, cacheSet } from "@/lib/kv-cache";
import { initDatabase, getPool } from "@/lib/db";
import { verifyEsp32Security } from "@/lib/api-security";

// นำ Edge runtime ออกเพื่อให้รันบน Node.js runtime เสมอ ป้องกันข้อผิดพลาดการเชื่อมต่อ pg pool
// export const runtime = "edge";

const ALLOWED_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL || "https://smartaccess-project.vercel.app"
).replace(/\/$/, "");

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-timestamp, x-hmac-signature, x-esp32-version, If-None-Match",
  Vary: "Origin",
} as const;

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// แคชสำหรับกรองสแปมการบันทึกสัญญาณชีพ (Heartbeat throttle) บนโลคอลเซิร์ฟเวอร์
const localHeartbeatCache = new Map<string, number>();

// ─── Simple edge rate limiter via KV (bucket per IP, 360 req/min) ────────
async function edgeRateLimit(req: NextRequest): Promise<boolean> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
    const key = `rl:esp32display:${ip}`;
    const cached = await cacheGet<number>(key);
    const count = (cached ?? 0) + 1;
    if (count > 360) return false;
    await cacheSet(key, count, 60);
    return true;
  } catch {
    return true; // fail-open
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  try {
    await ensureDb();

    // ตรวจสอบความถี่ของ Request
    if (!(await edgeRateLimit(req))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60", ...CORS } });
    }

    // ตรวจสอบความถูกต้อง HMAC Security
    const sec = await verifyEsp32Security(req, "/api/esp32/display");
    if (!sec.allowed) return sec.errorResponse!;

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
    const { searchParams } = new URL(req.url);
    const room = (searchParams.get("room") || "default").trim();
    if (req.headers.get("x-device-id") !== `esp32_${room}`) {
      return NextResponse.json({ error: "Room mismatch" }, { status: 403, headers: CORS });
    }

    const pool = getPool();

    // ดึงค่าการตั้งค่าแบบแคช 15 วินาที
    const cacheKey = "system_settings:all";
    const cachedSettings = await cacheGet<Record<string, string>>(cacheKey);
    let allSettings: Record<string, string>;

    if (cachedSettings) {
      allSettings = cachedSettings;
    } else {
      const settRes = await pool.query("SELECT setting_key, setting_value FROM system_settings");
      allSettings = Object.fromEntries(settRes.rows.map((r) => [r.setting_key, r.setting_value]));
      await cacheSet(cacheKey, allSettings, 15);
    }

    // เลขรุ่นเฟิร์มแวร์แคช 60 วินาที
    const fwCacheKey = "firmware:latest_version";
    let serverVer = await cacheGet<string>(fwCacheKey);

    // คิวรี่ฐานข้อมูลโลคอลแบบขนานผ่าน PG Pool
    const [pendingRes, lastApprovedRes, tokenRes, firmwareRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int FROM students WHERE status = 'pending' AND requested_room = $1`,
        [room]
      ),
      pool.query(
        `SELECT first_name, last_name, student_id, approved_at FROM students 
         WHERE status = 'approved' AND requested_room = $1 AND approved_at IS NOT NULL 
         ORDER BY approved_at DESC LIMIT 1`,
        [room]
      ),
      pool.query(
        `SELECT token FROM dynamic_qr_tokens 
         WHERE is_consumed = false AND room_code = $1 AND created_at >= NOW() - INTERVAL '60 seconds' 
         ORDER BY created_at DESC LIMIT 1`,
        [room]
      ),
      serverVer ? Promise.resolve(null) : pool.query(
        `SELECT version FROM firmware_releases ORDER BY uploaded_at DESC LIMIT 1`
      )
    ]);

    // ตรวจสอบคำสั่งเปิดประตูฉุกเฉิน
    const doorCmdKey = `room_cmd_${room}`;
    const doorCmd = allSettings[doorCmdKey];
    let doorTrigger = "idle";
    if (doorCmd === "unlock") {
      doorTrigger = "open";
      try {
        await pool.query(
          `UPDATE system_settings SET setting_value = 'consumed', updated_at = NOW() WHERE setting_key = $1`,
          [doorCmdKey]
        );
      } catch (e) {
        console.error("[ESP32/Display] consume door cmd failed:", e);
      }
      await cacheSet(cacheKey, { ...allSettings, [doorCmdKey]: "consumed" }, 15);
    } else if (doorCmd === "reject") {
      doorTrigger = "reject";
      try {
        await pool.query(
          `UPDATE system_settings SET setting_value = 'consumed', updated_at = NOW() WHERE setting_key = $1`,
          [doorCmdKey]
        );
      } catch (e) {
        console.error("[ESP32/Display] consume door cmd failed:", e);
      }
      await cacheSet(cacheKey, { ...allSettings, [doorCmdKey]: "consumed" }, 15);
    }


    // ดึงจำนวนรออนุมัติ
    const pendingCount = pendingRes.rows[0]?.count || 0;

    // ประวัตินักศึกษาอนุมัติคนล่าสุด
    const lastStudent = lastApprovedRes.rows[0];

    // โหมดการแสดงผลรหัสนักศึกษาบนหน้าจอ
    const displayMode =
      allSettings[`rcfg_${room}_student_id_display_mode`] ||
      allSettings["student_id_display_mode"] ||
      "full";

    let displayStudentId = "";
    if (lastStudent) {
      const rawId = lastStudent.student_id;
      if (displayMode === "hidden") {
        displayStudentId = "HIDDEN";
      } else if (displayMode === "masked") {
        displayStudentId =
          rawId.length <= 6 ? "****" : rawId.substring(0, Math.max(1, rawId.length - 6)) + "******";
      } else {
        displayStudentId = rawId;
      }
    }

    // โทเคน QR ที่ยังไม่ถูกใช้
    let activeToken = tokenRes.rows[0]?.token;

    if (!activeToken) {
      try {
        const genRes = await fetch(
          `${appUrl}/api/esp32/qr/token?room=${encodeURIComponent(room)}`,
          { headers: { "x-internal": process.env.JWT_SECRET || "" } }
        );
        if (genRes.ok) {
          const td = await genRes.json();
          activeToken = td.token;
        }
      } catch { /* use undefined */ }
    }

    // การตรวจสอบอัปเดตบอร์ด
    const clientVer = req.headers.get("x-esp32-version") || "1.0.0";
    if (!serverVer) {
      serverVer = firmwareRes?.rows[0]?.version || "1.0.0";
      await cacheSet(fwCacheKey, serverVer, 60);
    }
    const updateAvailable = clientVer !== serverVer;

    // บันทึกสัญญาณชีพ (Heartbeat) อุปกรณ์ลงฐานข้อมูลโลคอล
    const hbKey = `hb:${room}`;
    const nowMs = Date.now();
    const cachedHb = localHeartbeatCache.get(hbKey);
    if (!cachedHb || nowMs - cachedHb > 30000) {
      localHeartbeatCache.set(hbKey, nowMs);
      await pool.query(
        `INSERT INTO esp32_heartbeats (room_code, last_seen, status)
         VALUES ($1, NOW(), 'online')
         ON CONFLICT (room_code)
         DO UPDATE SET last_seen = NOW(), status = 'online'`,
        [room]
      );
    }

    // เวลาเซิร์ฟเวอร์
    const nowTime = new Date();
    const serverTimeIso = nowTime.toISOString();
    const serverTimeText = nowTime.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

    const isSlim = searchParams.get("slim") === "true";

    const payload = isSlim
      ? {
          active_token: activeToken,
          register_url: `${appUrl}/?room=${room}`,
          requested_room: room,
          pending_count: pendingCount,
          last_approved: lastStudent
            ? {
                name: `${lastStudent.first_name} ${lastStudent.last_name}`,
                student_id: displayStudentId,
              }
            : null,
          server_time_text: serverTimeText,
          door_trigger: doorTrigger,
          update_available: updateAvailable,
          firmware_version: serverVer,
          offline_pin: allSettings[`offline_pin_${room}`] || "",
        }
      : {
          title: "SmartAccess Door Access",
          subtitle: "คณะครุศาสตร์อุตสาหกรรม มทร.พระนคร",
          active_token: activeToken,
          qr_url: `${appUrl}/api/esp32/qr?room=${room}`,
          register_url: `${appUrl}/?room=${room}`,
          pending_count: pendingCount,
          last_approved: lastStudent
            ? {
                name: `${lastStudent.first_name} ${lastStudent.last_name}`,
                student_id: displayStudentId,
                time: lastStudent.approved_at,
              }
            : null,
          server_time: serverTimeIso,
          server_time_text: serverTimeText,
          timezone: "Asia/Bangkok",
          status: "online",
          door_trigger: doorTrigger,
          requested_room: room,
          update_available: updateAvailable,
          firmware_version: serverVer,
          offline_pin: allSettings[`offline_pin_${room}`] || "",
          display: {
            width: 320,
            height: 240,
            orientation: "landscape",
            color_theme: { bg: "#000000", primary: "#4CAF50", secondary: "#FFD700", text: "#FFFFFF", error: "#F44336" },
          },
        };

    // ETag (ข้ามการ ETag เช็คเมื่อมีคำสั่งเปิดประตู)
    if (doorTrigger === "idle") {
      const etagSrc = `${pendingCount}|${lastStudent?.student_id || ""}|${activeToken || ""}|${updateAvailable}|${serverVer}|${allSettings[`offline_pin_${room}`] || ""}`;
      const etagHex = await sha1Hex(etagSrc);
      const etag = `"${etagHex.slice(0, 16)}"`;

      if (req.headers.get("if-none-match") === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": "no-store", ...CORS },
        });
      }
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store", ETag: etag, ...CORS },
      });
    }

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store", ...CORS } });
  } catch (error) {
    console.error("[ESP32/Display Node]", error);
    return NextResponse.json({ error: "ระบบไม่พร้อม" }, { status: 503, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  await ensureDb();
  const sec = await verifyEsp32Security(req, "/api/esp32/display");
  if (!sec.allowed) return sec.errorResponse!;
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const room = (searchParams.get("room") || "default").trim();
    if (req.headers.get("x-device-id") !== `esp32_${room}`) {
      return NextResponse.json({ error: "Room mismatch" }, { status: 403, headers: CORS });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";

    if (action === "exit_button") {
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

      fetch(`${appUrl}/api/esp32/display/notify-exit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal": process.env.JWT_SECRET || "",
        },
        body: JSON.stringify({ room, ip }),
      }).catch((err) => console.error("[ESP32 Display POST] Internal fetch failed:", err));

      return NextResponse.json({ received: true, action: "exit_button" }, { headers: CORS });
    }

    const body = await req.json();
    console.log("[ESP32] status POST:", body);
    return NextResponse.json({ received: true, server_time: new Date().toISOString() }, { headers: CORS });
  } catch {
    return NextResponse.json({ received: false }, { status: 400, headers: CORS });
  }
}
