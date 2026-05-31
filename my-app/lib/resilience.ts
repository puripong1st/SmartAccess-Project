export const DEFAULT_ROOMS = ["CE-401", "CE-402"];

export const DEFAULT_SYSTEM_SETTINGS: Record<string, string> = {
  auto_approve_enabled: "0",
  auto_approve_start_time: "09:00",
  auto_approve_end_time: "16:00",
  auto_approve_days: "1,2,3,4,5",
  discord_webhook_register: "",
  discord_webhook_approve: "",
  discord_webhook_logs: "",
  discord_webhook_admin_audit: "",
  auto_fill_enabled: "1",
  auto_fill_mode: "auto",
  configured_rooms: DEFAULT_ROOMS.join(","),
  "room_ip_CE-401": "192.168.1.100",
  "room_ip_CE-402": "192.168.1.101",
  "room_webhook_register_CE-401": "",
  "room_webhook_approve_CE-401": "",
  "room_webhook_logs_CE-401": "",
  student_id_display_mode: "full",
};

export type DependencyState = "online" | "degraded" | "offline";

export function parseConfiguredRooms(settings: Record<string, string>): string[] {
  const raw = settings.configured_rooms || DEFAULT_SYSTEM_SETTINGS.configured_rooms;
  const rooms = raw
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);
  return rooms.length > 0 ? rooms : DEFAULT_ROOMS;
}

export function getFallbackSettings(): Record<string, string> {
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

export function getDependencyState(states: boolean[]): DependencyState {
  const onlineCount = states.filter(Boolean).length;
  if (onlineCount === states.length) return "online";
  if (onlineCount === 0) return "offline";
  return "degraded";
}

/**
 * Lazy Heartbeat Check:
 * Replaces the 5-minute Vercel Cron Job. Called asynchronously by active API routes
 * to detect offline ESP32s and send Discord alerts without needing a scheduled task.
 */
export async function checkOfflineHeartbeatsAndAlert(): Promise<void> {
  try {
    const { getPool } = await import("./db");
    const { sendDiscordNotification } = await import("./discord");
    const pool = getPool();
    
    // Find all boards that haven't pinged in 5 minutes but are still marked 'online'
    const { rows } = await pool.query(
      `SELECT room_code, status 
       FROM esp32_heartbeats 
       WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
       AND status = 'online'`
    );

    for (const row of rows) {
      // Mark as offline
      await pool.query(
        "UPDATE esp32_heartbeats SET status = 'offline' WHERE room_code = $1",
        [row.room_code]
      );
      
      // Send Discord alert
      await sendDiscordNotification("esp32_offline", {
        room: row.room_code,
        ip: "ไม่ทราบ (Offline)",
        reason: "ขาดการติดต่อนานเกิน 5 นาที (Lazy Heartbeat Timeout)",
      });
    }
  } catch (error) {
    console.error("[Lazy Heartbeat Check Error]", error);
  }
}

