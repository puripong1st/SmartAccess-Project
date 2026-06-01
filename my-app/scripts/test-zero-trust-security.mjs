#!/usr/bin/env node
import crypto from "crypto";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MASTER_KEY = process.env.ESP32_API_KEY || "REDACTED_ESP32_API_KEY";
const DEVICE_ID = "esp32_c1_door_phys";
const ROOM = "CE-401";

function generateSignatureV2(deviceId, timestamp, nonce, path, bodyText, masterKey) {
  // 1. KDF: Derive device secret key
  const deviceSecret = crypto.createHmac("sha256", masterKey).update(deviceId).digest("hex");
  // 2. Hash Request Body
  const bodyHash = crypto.createHash("sha256").update(bodyText || "").digest("hex");
  // 3. Construct Payload
  const payload = `${deviceId}:${timestamp}:${nonce}:${path}:${bodyHash}`;
  // 4. Compute HMAC-SHA256
  return crypto.createHmac("sha256", deviceSecret).update(payload).digest("hex");
}

async function sendRequest(label, path, method, body = null, headers = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString("hex");
  const bodyText = body ? JSON.stringify(body) : "";
  const signature = generateSignatureV2(DEVICE_ID, timestamp, nonce, path, bodyText, MASTER_KEY);

  const finalHeaders = {
    "Content-Type": "application/json",
    "x-device-id": DEVICE_ID,
    "x-timestamp": timestamp.toString(),
    "x-nonce": nonce,
    "x-hmac-signature": signature,
    "x-esp32-version": "1.0.0",
    ...headers,
  };

  const url = `${BASE_URL}${path}${method === "GET" ? `?room=${ROOM}&slim=true` : ""}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: method !== "GET" && body ? JSON.stringify(body) : undefined,
    });
    const duration = (performance.now() - start).toFixed(0);
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
    console.log(`[${res.status}] ${label} (${duration}ms)`);
    return { status: res.status, data, nonce, timestamp, signature, bodyText };
  } catch (err) {
    console.error(`[ERR] ${label} failed:`, err.message);
    return null;
  }
}

async function runAudit() {
  console.log(`\n=== SmartAccess Zero-Trust Security Audit Suite ===`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Device ID: ${DEVICE_ID}`);
  console.log(`===================================================\n`);

  // 1. Test Valid Flow
  console.log("[1] Testing Valid GET Request to /api/esp32/qr...");
  const validReq = await sendRequest("Valid GET Request", "/api/esp32/qr", "GET");
  if (validReq && validReq.status === 200) {
    console.log("✅ SUCCESS: Valid signature accepted.");
  } else {
    console.log("❌ FAILURE: Valid request was rejected!");
  }

  // 2. Test Replay Attack
  if (validReq) {
    console.log("\n[2] Testing Replay Attack (using duplicate Nonce and Timestamp)...");
    const replayHeaders = {
      "x-device-id": DEVICE_ID,
      "x-timestamp": validReq.timestamp.toString(),
      "x-nonce": validReq.nonce,
      "x-hmac-signature": validReq.signature,
    };
    try {
      const res = await fetch(`${BASE_URL}/api/esp32/qr?room=${ROOM}`, {
        method: "GET",
        headers: replayHeaders,
      });
      const data = await res.json().catch(() => ({}));
      console.log(`[${res.status}] Replayed GET Request`);
      if (res.status === 401 && (data.error === "Replay Detected" || data.error === "Token Expired")) {
        console.log("✅ SUCCESS: Replay attack successfully blocked by Nonce/Drift tracking!");
      } else {
        console.log("❌ FAILURE: Server accepted replayed credentials!");
      }
    } catch (e) {
      console.log("❌ FAILURE: Network error during replay test:", e.message);
    }
  }

  // 3. Test Signature Tampering (GET parameter modification)
  console.log("\n[3] Testing Signature Tampering (GET parameter mismatch)...");
  const tamperedSig = generateSignatureV2(DEVICE_ID, Math.floor(Date.now() / 1000), crypto.randomBytes(16).toString("hex"), "/api/esp32/qr", "", MASTER_KEY);
  try {
    const res = await fetch(`${BASE_URL}/api/esp32/qr?room=TAMPERED_ROOM_NAME`, {
      method: "GET",
      headers: {
        "x-device-id": DEVICE_ID,
        "x-timestamp": Math.floor(Date.now() / 1000).toString(),
        "x-nonce": crypto.randomBytes(16).toString("hex"),
        "x-hmac-signature": tamperedSig, // valid for "/api/esp32/qr" but room parameter is tampered/different
      },
    });
    console.log(`[${res.status}] Tampered GET Request`);
    if (res.status === 401) {
      console.log("✅ SUCCESS: Tampered request rejected!");
    } else {
      console.log("❌ FAILURE: Server accepted mismatched room parameters!");
    }
  } catch (e) {
    console.log("❌ FAILURE: Network error during tampering test:", e.message);
  }

  // 4. Test Device Mimicry / Invalid Key
  console.log("\n[4] Testing Device Mimicry (using forged/unregistered KDF Master Key)...");
  const badSignature = generateSignatureV2(DEVICE_ID, Math.floor(Date.now() / 1000), crypto.randomBytes(16).toString("hex"), "/api/esp32/qr", "", "invalid_master_key_123");
  const mimicReq = await sendRequest("Mimic Request (Bad Key)", "/api/esp32/qr", "GET", null, {
    "x-hmac-signature": badSignature,
  });
  if (mimicReq && mimicReq.status === 401) {
    console.log("✅ SUCCESS: Mimicry attempt using bad key was blocked!");
  } else {
    console.log("❌ FAILURE: Mimicry attempt bypass verification!");
  }

  console.log("\n===================================================");
  console.log("Audit complete.");
}

runAudit().catch(console.error);
