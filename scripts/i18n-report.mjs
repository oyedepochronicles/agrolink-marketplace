#!/usr/bin/env node
/**
 * i18n completeness report.
 *
 * Compares every locale under src/i18n/locales against the authoritative
 * English base (en.json) and prints, per locale: missing keys, extra keys, and
 * a completeness percentage. Non-English locales are expected to be incomplete
 * (they safely fall back to English at runtime) — this script makes the gap
 * explicit so remaining translation work is tracked honestly.
 *
 * Usage:  node scripts/i18n-report.mjs
 *         npm run i18n:report
 *
 * Exit code is always 0 (reporting only) unless the English base is missing.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "..", "src", "i18n", "locales");
const BASE = "en";

const flatten = (obj, prefix = "", out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out[path] = value;
    }
  }
  return out;
};

const loadLocale = (code) =>
  flatten(JSON.parse(readFileSync(join(LOCALES_DIR, `${code}.json`), "utf8")));

const codes = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

if (!codes.includes(BASE)) {
  console.error(`✗ Base locale "${BASE}.json" not found in ${LOCALES_DIR}`);
  process.exit(1);
}

const base = loadLocale(BASE);
const baseKeys = Object.keys(base);
console.log(`\ni18n completeness — base: ${BASE} (${baseKeys.length} keys)\n`);

for (const code of codes.filter((c) => c !== BASE).sort()) {
  const locale = loadLocale(code);
  const localeKeys = new Set(Object.keys(locale));
  const missing = baseKeys.filter((k) => !localeKeys.has(k));
  const extra = [...localeKeys].filter((k) => !(k in base));
  const translated = baseKeys.length - missing.length;
  const pct = ((translated / baseKeys.length) * 100).toFixed(1);

  console.log(`── ${code} — ${pct}% (${translated}/${baseKeys.length})`);
  if (missing.length) {
    console.log(`   missing (${missing.length}):`);
    for (const k of missing) console.log(`     - ${k}`);
  }
  if (extra.length) {
    console.log(`   extra / stale (${extra.length}):`);
    for (const k of extra) console.log(`     + ${k}`);
  }
  if (!missing.length && !extra.length) console.log("   ✓ complete");
  console.log("");
}
