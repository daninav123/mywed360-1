#!/usr/bin/env node
/*
  Sweep and normalize common mojibake accent sequences across text files.
  Targets: src, docs, public with extensions: js, jsx, ts, tsx, md, json, css
*/
const fs = require('fs');
const path = require('path');

const ROOTS = ['src', 'docs', 'public'];
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.css']);

const MAP = new Map([
  ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'], ['Ã±', 'ñ'],
  ['Ã', 'Á'], ['Ã‰', 'É'], ['Ã', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'], ['Ã‘', 'Ñ'],
  ['Ã¼', 'ü'], ['Ãœ', 'Ü'],
  ['Â¿', '¿'], ['Â¡', '¡'], ['Âº', 'º'], ['Âª', 'ª'], ['Â·', '·'], ['Â°', '°'], ['Â´', '´'],
  ['Ã—', '×']
]);

let changed = 0;
let files = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(entry.name))) {
      fixFile(p);
    }
  }
}

function fixFile(p) {
  files++;
  let content = fs.readFileSync(p, 'utf8');
  const original = content;
  for (const [bad, good] of MAP.entries()) {
    if (content.includes(bad)) content = content.split(bad).join(good);
  }
  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changed++;
  }
}

for (const r of ROOTS) {
  if (fs.existsSync(r)) walk(r);
}

console.log(`fix-accents: processed ${files} files, changed ${changed}`);

