import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getClientIp } from "./client-ip";
import { getPool } from "./db";

// ============================================================================
// ESP32 Zero-Trust API Security Module (V2.0 - Hardware-Segregated Zero-Trust)
// Implements: 
// 1. Dynamic Nonce Database Tracking (100% Replay Attack Prevention)
// 2. Cryptographic Key Derivation Function (KDF) (Per-device unique keys derived from MAC/ID)
// 3. Payload-Inclusive Signing (HMAC-SHA256 signing Request Body + Headers)
// ============================================================================

export interface SecurityCheckResult {
  allowed: boolean;
  errorResponse?: NextResponse;
  clientIp?: string;
}

export async function verifyEsp32Security(req: NextRequest, endpointPath: string): Promise<SecurityCheckResult> {
  const esp32ApiKey = process.env.ESP32_API_KEY;
  if (!esp32ApiKey) {
    console.error("[Security] ESP32_API_KEY is not set — rejecting all ESP32 requests");
    return { 
      allowed: false, 
      errorResponse: new NextResponse(
        JSON.stringify({ error: "Server misconfigured" }), 
        { status: 503, headers: { "Content-Type": "application/json" } }
      ) 
    };
  }

  const clientIp = getClientIp(req);
  
  // 1. IP Allowlist Filter
  const allowedIps = process.env.ALLOWED_IP_RANGES;
  if (allowedIps && allowedIps !== "*") {
    const ipList = allowedIps.split(",").map(ip => ip.trim());
    if (!ipList.includes(clientIp) && !ipList.includes("127.0.0.1") && !ipList.includes("::1")) {
      console.warn(`[Security] Blocked unauthorized IP: ${clientIp}`);
      return { allowed: false, errorResponse: new NextResponse(null, { status: 403 }) };
    }
  }

  // 2. Retrieve Required Security Headers
  const deviceId = req.headers.get("x-device-id");
  const timestampStr = req.headers.get("x-timestamp");
  const nonce = req.headers.get("x-nonce");
  const providedSignature = req.headers.get("x-hmac-signature");

  if (!deviceId || !timestampStr || !nonce || !providedSignature) {
    console.warn(`[Security] Missing Zero-Trust Headers from IP: ${clientIp}`);
    return { 
      allowed: false, 
      errorResponse: new NextResponse(
        JSON.stringify({ error: "Missing Security Headers" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      ) 
    };
  }

  // 3. Replay Attack Prevention: Validate Timestamp (Max 60 seconds drift)
  const timestamp = parseInt(timestampStr, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (isNaN(timestamp) || Math.abs(currentTimestamp - timestamp) > 60) {
    console.warn(`[Security] Timestamp expired (Replay Attack Prevention). IP: ${clientIp}, TS: ${timestamp}, Current: ${currentTimestamp}`);
    return { 
      allowed: false, 
      errorResponse: new NextResponse(
        JSON.stringify({ error: "Token Expired" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      ) 
    };
  }

  // 4. Replay Attack Prevention: Check and Consume Nonce in Database
  const pool = getPool();
  try {
    // Insert nonce; will throw a unique constraint error if nonce already exists
    await pool.query(
      "INSERT INTO api_nonces (nonce) VALUES ($1)",
      [nonce]
    );

    // Asynchronously prune old nonces (older than 2 minutes) to keep the table size small
    pool.query("DELETE FROM api_nonces WHERE created_at < NOW() - INTERVAL '2 minutes'").catch(err => {
      console.error("[Security] Nonce pruning error:", err);
    });
  } catch (err: any) {
    if (err.code === "23505") { // UNIQUE violation in PostgreSQL
      console.warn(`[Security] Replay Attack Blocked! Duplicate Nonce: ${nonce} from IP: ${clientIp}`);
      return { 
        allowed: false, 
        errorResponse: new NextResponse(
          JSON.stringify({ error: "Replay Detected" }), 
          { status: 401, headers: { "Content-Type": "application/json" } }
        ) 
      };
    }
    console.error("[Security] Nonce DB insertion failed:", err);
    return { 
      allowed: false, 
      errorResponse: new NextResponse(
        JSON.stringify({ error: "Security validation error" }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      ) 
    };
  }

  // 5. Key Derivation Function (KDF): Derive unique key for this device
  const deviceSecret = crypto
    .createHmac("sha256", esp32ApiKey)
    .update(deviceId)
    .digest("hex");

  // 6. Request Body Hashing (Zero-Trust Payload Integrity Protection)
  let bodyText = "";
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    try {
      const clone = req.clone();
      bodyText = await clone.text();
    } catch (e) {
      console.error("[Security] Failed to clone and hash request body:", e);
    }
  }
  const bodyHash = crypto.createHash("sha256").update(bodyText).digest("hex");

  // 7. Signature Verification
  // Format: "deviceId:timestampStr:nonce:endpointPath:bodyHash"
  const payloadToSign = `${deviceId}:${timestampStr}:${nonce}:${endpointPath}:${bodyHash}`;
  const expectedSignature = crypto
    .createHmac("sha256", deviceSecret)
    .update(payloadToSign)
    .digest("hex");

  if (expectedSignature !== providedSignature) {
    console.warn(`[Security] HMAC Signature mismatch from IP: ${clientIp}`);
    return { 
      allowed: false, 
      errorResponse: new NextResponse(
        JSON.stringify({ error: "Invalid Signature" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      ) 
    };
  }

  return { allowed: true, clientIp };
}
