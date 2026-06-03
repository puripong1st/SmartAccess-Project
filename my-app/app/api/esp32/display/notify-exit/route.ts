// app/api/esp32/display/notify-exit/route.ts — Internal endpoint to write exit logs and notify
// Only callable from internal Edge display route via x-internal header (running on standard Node.js runtime)
import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";
import { logEvent } from "@/lib/access-log";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;

export async function POST(req: NextRequest) {
  // Verify internal-only call
  const internalKey = req.headers.get("x-internal");
  if (!internalKey || internalKey !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!initialized) {
    await initDatabase();
    initialized = true;
  }

  try {
    const { room, ip } = await req.json();

    // 1. Write to PostgreSQL access_logs
    await logEvent({
      action: "exit_button_pressed",
      room: room || "default",
      ip: ip || "unknown",
      notes: "ออกจากห้องด้วยการกดปุ่ม Physical Exit Button",
      severity: "info",
    });

    // 2. Dispatch multi-channel notification (Discord, Telegram, LINE, PWA)
    const success = await sendDiscordNotification("exit_button_pressed", {
      room: room || "default",
      ip: ip || "unknown",
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error("[Notify Exit Internal error]", error);
    return NextResponse.json({ error: "Failed to process notification" }, { status: 500 });
  }
}
