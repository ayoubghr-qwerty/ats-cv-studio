#!/usr/bin/env node
/**
 * Verifies that every place holding the app version agrees, and that the
 * CHANGELOG has a dated section for it.
 *
 * Usage:
 *   node scripts/check-versions.mjs                 # consistency only
 *   node scripts/check-versions.mjs --expect 1.3.0  # also require this version
 *   node scripts/check-versions.mjs --expect v1.3.0 # a release tag works too
 *
 * Exit code 0 = OK, 1 = mismatch.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function jsonVersion(rel) {
  return JSON.parse(read(rel)).version;
}

function cargoTomlVersion(rel) {
  // First `version = "..."` after [package] and before the next table.
  const text = read(rel);
  const pkg = text.split(/^\[package\]\s*$/m)[1];
  if (!pkg) return undefined;
  const body = pkg.split(/^\[/m)[0];
  return /^version\s*=\s*"([^"]+)"/m.exec(body)?.[1];
}

function cargoLockVersion(rel, crate) {
  const re = new RegExp(`name = "${crate}"\\r?\\nversion = "([^"]+)"`);
  return re.exec(read(rel))?.[1];
}

const sources = [
  ["package.json", jsonVersion("package.json")],
  ["desktop/package.json", jsonVersion("desktop/package.json")],
  ["website/package.json", jsonVersion("website/package.json")],
  ["desktop/src-tauri/tauri.conf.json", jsonVersion("desktop/src-tauri/tauri.conf.json")],
  ["desktop/src-tauri/Cargo.toml", cargoTomlVersion("desktop/src-tauri/Cargo.toml")],
  [
    "desktop/src-tauri/Cargo.lock",
    cargoLockVersion("desktop/src-tauri/Cargo.lock", "ats-cv-studio"),
  ],
];

const errors = [];
const reference = sources[0][1];

for (const [file, version] of sources) {
  if (!version) errors.push(`${file}: version not found`);
  else if (!SEMVER.test(version)) errors.push(`${file}: "${version}" is not a valid version`);
  else if (version !== reference) {
    errors.push(`${file}: ${version} (expected ${reference}, as in package.json)`);
  }
}

// Optional: an explicit expected version (e.g. the release tag).
const args = process.argv.slice(2);
const expectIndex = args.indexOf("--expect");
if (expectIndex !== -1) {
  const raw = args[expectIndex + 1];
  if (!raw) {
    errors.push("--expect needs a value");
  } else {
    const expected = raw.replace(/^v/, "");
    if (!SEMVER.test(expected)) errors.push(`--expect "${raw}" is not a valid version`);
    else if (expected !== reference) {
      errors.push(`expected ${expected} but the app version is ${reference}`);
    }
  }
}

// The CHANGELOG must have a dated section for this version.
const changelog = read("CHANGELOG.md");
const escaped = reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const heading = new RegExp(`^## \\[${escaped}\\] — (\\d{4}-\\d{2}(?:-\\d{2})?)\\s*$`, "m");
if (!heading.test(changelog)) {
  errors.push(`CHANGELOG.md: no dated section "## [${reference}] — YYYY-MM-DD"`);
}

if (errors.length > 0) {
  console.error("[versions] FAILED");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`[versions] OK — ${reference} in ${sources.length} files, CHANGELOG dated`);
