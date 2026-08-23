import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const generatedDeploymentId = [
  new Date().toISOString().replace(/\D/g, "").slice(0, 14),
  crypto.randomBytes(4).toString("hex"),
].join("-");

const deploymentId = process.env.NEXT_DEPLOYMENT_ID || generatedDeploymentId;
console.log(`[Build] NEXT_DEPLOYMENT_ID=${deploymentId}`);

const result = spawnSync(
  process.execPath,
  [
    "--max-old-space-size=4096",
    "node_modules/next/dist/bin/next",
    "build",
  ],
  {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_DEPLOYMENT_ID: deploymentId },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
