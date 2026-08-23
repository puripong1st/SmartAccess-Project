import { describe, expect, it } from "vitest";
import { validateOfflineLogBatch } from "../lib/offline-logs";

const validBatch = {
  schema_version: 1,
  room_code: "A-401",
  events: [{
    event_id: "A-401:abcdef0123456789:1",
    student_code: "12345678901",
    action: "door_opened_offline",
    method: "qr",
    occurred_at: 1_800_000_000,
    uptime_seconds: 42,
  }],
};

describe("offline access log validation", () => {
  it("accepts the signed room schema", () => {
    const result = validateOfflineLogBatch(validBatch, "A-401");
    expect(result.ok).toBe(true);
  });

  it("rejects a room that differs from the signed device identity", () => {
    const result = validateOfflineLogBatch(validBatch, "CE-402");
    expect(result).toEqual({ ok: false, error: "Room does not match signed device identity" });
  });

  it("rejects duplicate event IDs", () => {
    const event = validBatch.events[0];
    const result = validateOfflineLogBatch(
      { ...validBatch, events: [event, { ...event }] },
      "A-401",
    );
    expect(result).toEqual({ ok: false, error: "Invalid or duplicate event_id" });
  });

  it("requires a student code for QR events", () => {
    const result = validateOfflineLogBatch({
      ...validBatch,
      events: [{ ...validBatch.events[0], student_code: "" }],
    }, "A-401");
    expect(result).toEqual({ ok: false, error: "QR events require student_code" });
  });
});
