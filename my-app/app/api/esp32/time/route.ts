// app/api/esp32/time/route.ts — Edge Runtime for low latency time synchronization
export const runtime = "edge";
export const preferredRegion = "sin1";

import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    return NextResponse.json(
      { timestamp, timezone: "Asia/Bangkok", status: "ok" },
      { headers: { ...CORS, "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[ESP32 Time Sync Edge] error:", error);
    return NextResponse.json({ error: "Failed to get time" }, { status: 500, headers: CORS });
  }
}
