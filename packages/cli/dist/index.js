#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const localTtsx = resolve(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const workspaceTsx = resolve(
  workspaceRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const tsxBin = existsSync(localTtsx) ? localTtsx : workspaceTsx;
const entry = resolve(packageRoot, "src", "index.ts");

const result = spawnSync(tsxBin, [entry, ...process.argv.slice(2)], {
  cwd: packageRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to launch miyabi via tsx: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
