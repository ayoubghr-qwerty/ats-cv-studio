#!/usr/bin/env node
/**
 * ATS source lint for CV templates.
 *
 * Scans template source (families + shared components) for patterns that are
 * forbidden in ATS-safe output: tables, images, decorative svg, floats,
 * multi-column layouts, absolute/fixed positioning, and hidden-text tricks.
 *
 * Unlike the render-based `atsViolations` check (which only inspects what the
 * samples produce), this lints the source so a pattern that no sample ever
 * triggers is still caught at the gate.
 *
 * Run:  node scripts/lint-template-ats-rules.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(fileURLToPath(import.meta.url), "..", ".."));
const base = join(root, "packages", "templates", "src");
const scanDirs = ["families", "components"];

const FORBIDDEN = [
  { pattern: /<table[\s>]/i, label: "table element" },
  { pattern: /<img[\s>]/i, label: "image element" },
  { pattern: /<svg[\s>]/i, label: "decorative svg" },
  { pattern: /\bfloat\s*:/i, label: "float layout" },
  { pattern: /\bcolumn-count\s*:/i, label: "multi-column layout" },
  { pattern: /\bcolumns\s*:/i, label: "multi-column layout" },
  { pattern: /\bposition\s*:\s*(absolute|fixed)\b/i, label: "absolute/fixed positioning" },
  { pattern: /\bvisibility\s*:\s*hidden\b/i, label: "hidden text" },
  { pattern: /\bdisplay\s*:\s*none\b/i, label: "hidden text" },
];

// Safe context exemptions so legit usage is not flagged.

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const files = scanDirs.flatMap((d) => walk(join(base, d)));
const issues = [];
let checked = 0;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  checked++;
  lines.forEach((line, i) => {
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(line)) {
        issues.push(`${file}:${i + 1}  ${rule.label}\n    ${line.trim()}`);
      }
    }
  });
}

if (issues.length > 0) {
  console.error(`ATS lint failed (${issues.length} issue(s) across ${checked} files):`);
  for (const issue of issues) console.error("  " + issue);
  process.exit(1);
}

console.log(`ATS lint OK (${checked} template source files clean).`);