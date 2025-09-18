#!/usr/bin/env node
/**
 * Recode locale JSON strings that appear as UTF-8 shown as Latin-1
 * e.g. "AÃ±adir" -> "Añadir" across all string values.
 */
const fs = require('fs');
const path = require('path');

const files = [
  path.resolve('src/i18n/locales/es/common.json'),
  path.resolve('src/i18n/locales/fr/common.json'),
  path.resolve('src/i18n/locales/es/finance.json'),
];

function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, o){ fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8'); }

function scoreBad(s){
  // Characters typically present in mojibake
  const bad = (s.match(/[ÃÂ�]/g) || []).length;
  const good = (s.match(/[ñÑáéíóúÁÉÍÓÚüÜçÇàèìòùÀÈÌÒÙ]/g) || []).length;
  return bad - good; // lower is better
}

function recodeLatin1ToUtf8IfBetter(s){
  if (typeof s !== 'string') return s;
  if (!/[ÃÂ�]/.test(s)) return s; // quick exit if no signs of mojibake
  try {
    const rec = Buffer.from(s, 'latin1').toString('utf8');
    return scoreBad(rec) < scoreBad(s) ? rec : s;
  } catch {
    return s;
  }
}

function walk(obj){
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === 'object'){
    const out = {};
    for (const [k,v] of Object.entries(obj)){
      const nk = recodeLatin1ToUtf8IfBetter(k);
      out[nk] = (v && typeof v === 'object') ? walk(v) : recodeLatin1ToUtf8IfBetter(v);
    }
    return out;
  }
  return recodeLatin1ToUtf8IfBetter(obj);
}

let changed = 0;
for (const f of files){
  if (!fs.existsSync(f)) continue;
  let before = fs.readFileSync(f, 'utf8');
  // Clean NULs and stray BOMs which break JSON.parse
  before = before.replace(/\u0000/g, '').replace(/^\uFEFF/, '');
  let data;
  try { data = JSON.parse(before); } catch (e){
    console.error('Attempting to auto-fix invalid JSON:', f);
    // Try a naive fix: trim any trailing commas before closing braces/brackets
    const sanitized = before
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\r\n/g, '\n');
    try { data = JSON.parse(sanitized); before = sanitized; }
    catch { console.error('Skip invalid JSON', f); continue; }
  }
  const afterObj = walk(data);
  const after = JSON.stringify(afterObj, null, 2) + '\n';
  if (after !== before){
    fs.writeFileSync(f, after, 'utf8');
    console.log('Re-encoded:', f);
    changed++;
  }
}
console.log('Done. Files changed:', changed);
