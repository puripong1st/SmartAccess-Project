export const MAX_OFFLINE_LOG_EVENTS = 50;
export const MAX_OFFLINE_LOG_BODY_BYTES = 32 * 1024;

const EVENT_ID_RE = /^[A-Za-z0-9:_-]{12,100}$/;
const ROOM_RE = /^[A-Za-z0-9_-]{1,50}$/;
const STUDENT_ID_RE = /^$|^[0-9]{8,13}$|^[0-9]{9,12}-[0-9]$/;
const ALLOWED_ACTIONS = new Set(["door_opened_offline"]);
const ALLOWED_METHODS = new Set(["qr", "pin", "portal"]);

export interface OfflineLogEvent {
  event_id: string;
  student_code: string;
  action: "door_opened_offline";
  method: "qr" | "pin" | "portal";
  occurred_at: number | null;
  uptime_seconds: number;
}

export interface OfflineLogBatch {
  schema_version: 1;
  room_code: string;
  events: OfflineLogEvent[];
}

export type OfflineLogBatchValidation =
  | { ok: true; batch: OfflineLogBatch }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateOfflineLogBatch(
  value: unknown,
  signedRoom: string,
): OfflineLogBatchValidation {
  if (!isRecord(value) || value.schema_version !== 1) {
    return { ok: false, error: "Unsupported offline log schema" };
  }

  const room = typeof value.room_code === "string" ? value.room_code.trim() : "";
  if (!ROOM_RE.test(room) || room !== signedRoom) {
    return { ok: false, error: "Room does not match signed device identity" };
  }
  if (!Array.isArray(value.events) || value.events.length < 1 || value.events.length > MAX_OFFLINE_LOG_EVENTS) {
    return { ok: false, error: `events must contain 1-${MAX_OFFLINE_LOG_EVENTS} items` };
  }

  const seen = new Set<string>();
  const events: OfflineLogEvent[] = [];
  for (const raw of value.events) {
    if (!isRecord(raw)) return { ok: false, error: "Invalid event object" };

    const eventId = typeof raw.event_id === "string" ? raw.event_id.trim() : "";
    const studentCode = typeof raw.student_code === "string" ? raw.student_code.trim() : "";
    const action = typeof raw.action === "string" ? raw.action : "";
    const method = typeof raw.method === "string" ? raw.method : "";
    const uptime = typeof raw.uptime_seconds === "number" ? raw.uptime_seconds : NaN;
    const occurredAt = raw.occurred_at === null || raw.occurred_at === undefined
      ? null
      : typeof raw.occurred_at === "number" ? raw.occurred_at : NaN;

    if (!EVENT_ID_RE.test(eventId) || seen.has(eventId)) {
      return { ok: false, error: "Invalid or duplicate event_id" };
    }
    if (!STUDENT_ID_RE.test(studentCode)) {
      return { ok: false, error: "Invalid student_code" };
    }
    if (!ALLOWED_ACTIONS.has(action) || !ALLOWED_METHODS.has(method)) {
      return { ok: false, error: "Invalid action or method" };
    }
    if (!Number.isSafeInteger(uptime) || uptime < 0) {
      return { ok: false, error: "Invalid uptime_seconds" };
    }
    if (occurredAt !== null && (!Number.isSafeInteger(occurredAt) || occurredAt < 0)) {
      return { ok: false, error: "Invalid occurred_at" };
    }
    if (method === "qr" && !studentCode) {
      return { ok: false, error: "QR events require student_code" };
    }

    seen.add(eventId);
    events.push({
      event_id: eventId,
      student_code: studentCode,
      action: "door_opened_offline",
      method: method as OfflineLogEvent["method"],
      occurred_at: occurredAt,
      uptime_seconds: uptime,
    });
  }

  return { ok: true, batch: { schema_version: 1, room_code: room, events } };
}
