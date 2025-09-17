#!/usr/bin/env node
/*
 Validates i18n JSON files for:
  - valid JSON syntax
  - key parity across locales (en is the source of truth)
  - reports missing/extra keys per file

 Usage: node scripts/validateI18n.js
 Exit code 1 on problems.
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales');
const LOCALES = ['en', 'es', 'fr'];
const BASE = 'en';

function walkJsonFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkJsonFiles(p));
    else if (e.isFile() && e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

function flatten(obj, prefix = '') {
  const out = {};
  if (obj === null || obj === undefined) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = true;
  }
  return out;
}

function relativeUnderLocales(p) {
  // returns like: en/common.json -> common.json
  const parts = p.split(path.sep);
  const idx = parts.findIndex((seg) => seg === 'locales');
  if (idx === -1 || idx + 2 > parts.length) return p;
  return parts.slice(idx + 2).join('/');
}

let hadError = false;
const strict = process.argv.includes('--strict');

function readJson(file) {
  try {
    let txt = fs.readFileSync(file, 'utf8');
    // Strip BOM if present
    if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
    return JSON.parse(txt);
  } catch (e) {
    console.error(`✖ Invalid JSON: ${file}`);
    console.error('  ', e.message);
    hadError = true;
    return null;
  }
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.log('No locales directory found, skipping.');
    process.exit(0);
  }

  // Build map: locale -> { relPath -> json }
  const data = {};
  for (const loc of LOCALES) {
    const locDir = path.join(LOCALES_DIR, loc);
    if (!fs.existsSync(locDir)) {
      console.warn(`⚠ Locale folder missing: ${locDir}`);
      data[loc] = {};
      hadError = true;
      continue;
    }
    const files = walkJsonFiles(locDir);
    data[loc] = {};
    for (const f of files) {
      const rel = relativeUnderLocales(f);
      data[loc][rel] = readJson(f);
    }
  }

  // Compare against base
  const baseFiles = Object.keys(data[BASE] || {});
  for (const rel of baseFiles) {
    const baseJson = data[BASE][rel];
    if (!baseJson) continue;
    const baseKeys = flatten(baseJson);
    for (const loc of LOCALES) {
      if (loc === BASE) continue;
      const otherJson = data[loc][rel];
      if (!otherJson) {
        console.error(`✖ Missing file for locale '${loc}': ${path.join(loc, rel)}`);
        hadError = true;
        continue;
      }
      const otherKeys = flatten(otherJson);
      const missing = Object.keys(baseKeys).filter((k) => !otherKeys[k]);
      const extra = Object.keys(otherKeys).filter((k) => !baseKeys[k]);
      if (missing.length) {
        const header = strict ? '✖ Missing keys' : '⚠ Missing keys';
        console[strict ? 'error' : 'warn'](`${header} in ${loc}/${rel}:`);
        missing.slice(0, 20).forEach((k) => console[strict ? 'error' : 'warn']('  -', k));
        if (missing.length > 20) console[strict ? 'error' : 'warn'](`  …and ${missing.length - 20} more`);
        if (strict) hadError = true;
      }
      if (extra.length) {
        console.warn(`⚠ Extra keys in ${loc}/${rel}:`);
        extra.slice(0, 20).forEach((k) => console.warn('  +', k));
      }
    }
  }

  if (hadError) {
    console.error('\n✖ i18n validation failed.');
    process.exit(1);
  } else {
    console.log('✓ i18n validation passed.');
  }
}

main();
