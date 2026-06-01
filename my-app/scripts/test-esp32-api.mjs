#!/usr/bin/env node
import crypto from "crypto";

const BASE_URL = "http://localhost:3000";
const API_KEY = process.env.ESP32_API_KEY || "REDACTED_ESP32_API_KEY";
const ROOM = "CE-401";

function generateSignature(timestamp, path, secret) {
  const message = `${timestamp}:${path}`;
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

async function run() {
  console.log("=== Testing Slim API Mode ===");
  const timestamp = Math.floor(Date.now() / 1000);
  const path = "/api/esp32/display";
  const signature = generateSignature(timestamp, path, API_KEY);

  const res = await fetch(`${BASE_URL}${path}?room=${ROOM}&slim=true`, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "x-timestamp": timestamp.toString(),
      "x-hmac-signature": signature,
      "x-esp32-version": "1.0.0",
    },
  });

  console.log(`Status: ${res.status}`);
  if (res.status === 200) {
    const data = await res.json();
    console.log("Slim Response Payload:", JSON.stringify(data, null, 2));
    
    // Validate that slim keys are present and display/theme settings are omitted
    if (data.display === undefined && data.title === undefined) {
      console.log("✅ SUCCESS: Slim Polling Mode confirmed. Extra layout fields omitted.");
    } else {
      console.log("❌ FAILURE: Slim Polling Mode returned full-size layout fields!");
    }
  } else {
    const text = await res.text();
    console.error("Error response:", text);
  }
}

run().catch(console.error);
