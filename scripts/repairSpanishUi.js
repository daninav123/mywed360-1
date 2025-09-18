#!/usr/bin/env node
// Repairs common mojibake in Spanish UI strings across src .js/.jsx files
const fs = require('fs');
const path = require('path');

const ROOTS = [path.resolve('src')];
const exts = new Set(['.js', '.jsx']);

const pairs = [
  [/Gesti�n/g, 'Gestión'], [/gesti�n/g, 'gestión'],
  [/electr�nicos/g, 'electrónicos'], [/electr�nico/g, 'electrónico'],
  [/electr�nica/g, 'electrónica'], [/electr�nicas/g, 'electrónicas'],
  [/direcci�n/g, 'dirección'], [/Direcci�n/g, 'Dirección'],
  [/env�os/g, 'envíos'], [/Env�os/g, 'Envíos'],
  [/configuraci�n/g, 'configuración'], [/Configuraci�n/g, 'Configuración'],
  [/pr�ximo/g, 'próximo'], [/pr�xima/g, 'próxima'], [/pr�ximos/g, 'próximos'], [/pr�ximas/g, 'próximas'],
  [/m�ltiples/g, 'múltiples'], [/m�ltiple/g, 'múltiple'],
  [/n�mero/g, 'número'], [/N�mero/g, 'Número'],
  [/tel�fono/g, 'teléfono'], [/Tel�fono/g, 'Teléfono'],
  [/opci�n/g, 'opción'], [/opci�nes/g, 'opciones'],
  [/correos electr�nicos/g, 'correos electrónicos'],
];

function walk(dir, fn) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, fn);
    else if (exts.has(path.extname(e.name))) fn(p);
  }
}

let changed = 0, scanned = 0;
function fixFile(p) {
  let txt = fs.readFileSync(p, 'utf8');
  const orig = txt;
  for (const [re, to] of pairs) txt = txt.replace(re, to);
  if (txt !== orig) { fs.writeFileSync(p, txt, 'utf8'); changed++; }
  scanned++;
}

for (const r of ROOTS) walk(r, fixFile);
console.log(`Spanish UI repair: scanned ${scanned} files, changed ${changed}.`);
