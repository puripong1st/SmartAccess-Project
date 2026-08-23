import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createOfflineDoorGrant,
  deriveOfflineDoorSigningKey,
  OFFLINE_GRANT_EXPIRY_SECONDS,
} from "../lib/qr";

describe("offline door grants", () => {
  it("creates a short-lived, room-scoped door grant", () => {
    const before = Math.floor(Date.now() / 1000);
    const grant = createOfflineDoorGrant("A-401", "12345678901");
    const [encodedPayload, signature] = grant.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const expectedSignature = crypto
      .createHmac("sha256", deriveOfflineDoorSigningKey("A-401"))
      .update(encodedPayload)
      .digest("base64url");

    expect(signature).toBe(expectedSignature);
    expect(payload).toMatchObject({
      v: 1,
      purpose: "door_unlock",
      room: "A-401",
      student_id: "12345678901",
    });
    expect(payload.issued_at).toBeGreaterThanOrEqual(before);
    expect(payload.expires_at - payload.issued_at).toBe(OFFLINE_GRANT_EXPIRY_SECONDS);
    expect(payload.nonce).toMatch(/^[a-f0-9]{32}$/);
  });

  it("derives different verification keys for different rooms", () => {
    expect(deriveOfflineDoorSigningKey("A-401"))
      .not.toBe(deriveOfflineDoorSigningKey("CE-402"));
  });
});
