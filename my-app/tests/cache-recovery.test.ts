import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("browser cache recovery", () => {
  it("keeps the notification worker from intercepting or caching pages", () => {
    const worker = readFileSync(join(root, "public", "firebase-messaging-sw.js"), "utf8");
    expect(worker).not.toContain("addEventListener('fetch'");
    expect(worker).not.toContain("cache.put(");
    expect(worker).toContain("clearLegacyAppCaches");
  });

  it("recovers stale Next.js assets without deleting user data", () => {
    const recovery = readFileSync(join(root, "app", "components", "CacheRecoveryScript.tsx"), "utf8");
    expect(recovery).toContain("/_next/static/");
    expect(recovery).toContain("smartaccess-cache-");
    expect(recovery).toContain("__smartaccessMarkHydrated");
    expect(recovery).toContain("if (recoveryStarted) return");
    expect(recovery).not.toContain("localStorage.clear");
    expect(recovery).not.toContain("indexedDB.deleteDatabase");
  });

  it("builds with a unique Next.js deployment identifier", () => {
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const buildScript = readFileSync(join(root, "scripts", "build-with-deployment-id.mjs"), "utf8");
    expect(packageJson.scripts.build).toContain("build-with-deployment-id.mjs");
    expect(buildScript).toContain("NEXT_DEPLOYMENT_ID");
  });
});
