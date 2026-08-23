import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = join(appRoot, "..");
const outputPath = join(appRoot, "app", "admin", "dashboard", "ArduinoCode.ts");
const existing = readFileSync(outputPath, "utf8");
const functionStart = existing.indexOf("export const getArduinoCode");

if (functionStart < 0) throw new Error("getArduinoCode export was not found");

const portalHeader = readFileSync(join(projectRoot, "esp32", "offline_portal.h"), "utf8");
let firmware = readFileSync(join(projectRoot, "esp32", "esp32.ino"), "utf8");
firmware = firmware
  .replace("ห้องปฏิบัติการเรียนการสอน: Classroom A-401", "ห้องปฏิบัติการเรียนการสอน: Classroom __ROOM_CODE__")
  .replace(
    /\/\/ #define WOKWI_SIM[^\r\n]*\r?\n\/\/ in production!\r?\n/,
    "__WOKWI_DEFINE__\n",
  )
  .replace(
    /const char \*FIRMWARE_URL = "[^"]+";/,
    'const char *FIRMWARE_URL = "__ORIGIN__/api/esp32/firmware-ota";',
  )
  .replace('#include "offline_portal.h"', portalHeader.trim())
  .replaceAll("`", "\\`")
  .replaceAll("${", "\\${");

const generated = `export const getArduinoCode = (roomCode: string, origin: string, mode: "wokwi" | "physical" = "physical") => {
  const wokwiDefine = mode === "wokwi"
    ? "#define WOKWI_SIM  // Simulator only — never deploy this build to production"
    : "// #define WOKWI_SIM  // Uncomment only for Wokwi Simulator";
  return String.raw\`${firmware}\`
    .replaceAll("__WOKWI_DEFINE__", wokwiDefine)
    .replaceAll("__ROOM_CODE__", roomCode)
    .replaceAll("__ORIGIN__", origin.replace(/\\\/$/, ""));
};
`;

writeFileSync(outputPath, existing.slice(0, functionStart) + generated, "utf8");
