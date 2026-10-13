#!/usr/bin/env node
/**
 * Builds the Windows portable executable for ATS CV Studio.
 *
 * Responsibilities:
 *   - run the production Tauri release build (msi + nsis + raw exe)
 *   - locate the built release executable
 *   - copy it into release/portable/windows/
 *   - rename to the portable name
 *   - drop a `portable.json` marker beside it so portable mode activates
 *   - validate the output exists
 *
 * Portable mode: when `portable.json` sits next to the exe, the desktop
 * storage layer stores data in a local `ATSData/` folder instead of the
 * app-data directory (see packages/desktop portable-mode.ts).
 */

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exeName = "ats-cv-studio.exe";
const portableName = "ATS_CV_Studio_Portable.exe";
const releaseTarget = join(root, "desktop", "src-tauri", "target", "release");
const outDir = join(root, "release", "portable", "windows");

console.log("[portable] starting Tauri release build…");
execSync("pnpm --filter desktop tauri build", {
  cwd: root,
  stdio: "inherit",
});

const exe = join(releaseTarget, exeName);
if (!existsSync(exe)) {
  throw new Error(`release executable not found: ${exe}`);
}

mkdirSync(outDir, { recursive: true });

const out = join(outDir, portableName);
cpSync(exe, out);

// Portable marker: presence activates portable-mode storage.
writeFileSync(join(outDir, "portable.json"), JSON.stringify({ portable: true }, null, 2));

if (!existsSync(out)) {
  throw new Error(`portable executable was not created: ${out}`);
}

console.log(`[portable] OK -> ${out}`);
console.log(`[portable] WebView2 runtime is required on the target machine.`);