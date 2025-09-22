#!/usr/bin/env node
/*
 Globally fix common Spanish mojibake in source files.

 Strategy:
 - If the file contains typical double‑decoded markers (Ã, Â, â), try the
   escape/decodeURIComponent trick to recover UTF‑8 text.
 - Then apply focused word replacements for frequent cases where replacement
   chars (�) were saved and can’t be auto‑recovered generically.

 Scope: src/** and src/i18n/locales/** with extensions: js, jsx, json, md, css, html
*/
const fs = require('fs');
const path = require('path');

const ROOTS = ['src'];
const EXTS = new Set(['.js', '.jsx', '.json', '.md', '.css', '.html']);

const WORD_FIXES = [
  // Most common UI words
  [/Gesti�n/gi, 'Gestión'],
  [/Administraci�n/gi, 'Administración'],
  [/Configuraci�n/gi, 'Configuración'],
  [/Direcci�n/gi, 'Dirección'],
  [/Env�o/gi, 'Envío'],
  [/Env�os/gi, 'Envíos'],
  [/Recepci�n/gi, 'Recepción'],
  [/Pr�xim/gi, 'Próxim'],
  [/M�s/gi, 'Más'],
  [/Opci�n/gi, 'Opción'],
  [/Opci�nes/gi, 'Opciones'],
  [/Dise�o/gi, 'Diseño'],
  [/Se�alizaci�n/gi, 'Señalización'],
  [/Se�ales/gi, 'Señales'],
  [/Se�al/gi, 'Señal'],
  [/A�ad/gi, 'Añad'],
  [/al�rgen/gi, 'alérgen'],
  [/Gu�a/gi, 'Guía'],
  [/gu�a/gi, 'guía'],
  [/N�mer/gi, 'Númer'],
  [/�ltima/gi, 'Última'],
  [/Comunicaci�n/gi, 'Comunicación'],
  [/conexi�n/gi, 'conexión'],
  [/b�sic/gi, 'básic'],
  [/m�vil/gi, 'móvil'],
  [/contrase�a/gi, 'contraseña'],
  // Common surnames and names in examples
  [/Mar�a/g, 'María'],
  [/Garc�a/g, 'García'],
  [/P�rez/g, 'Pérez'],
  [/L�pez/g, 'López'],
  // Misc
  [/Informaci�n/gi, 'Información'],
  [/Valoraci�n/gi, 'Valoración'],
  [/programaci�n/gi, 'programación'],
];

function walk(dir, fn) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, fn);
    else if (EXTS.has(path.extname(ent.name))) fn(p);
  }
}

function needsDecodeHeuristic(text) {
  return /[ÃÂâ]/.test(text);
}

function decodeMojibake(text) {
  try {
    // escape converts to %xx; decodeURIComponent interprets as UTF‑8 bytes
    const rec = decodeURIComponent(escape(text));
    return rec;
  } catch {
    return text;
  }
}

let scanned = 0, changed = 0;
function fixFile(p) {
  let content = fs.readFileSync(p, 'utf8');
  const original = content;

  if (needsDecodeHeuristic(content)) {
    const rec = decodeMojibake(content);
    // Prefer the decoded version only if it reduces typical markers
    if ((rec.match(/[ÃÂâ]/g)?.length || 0) < (content.match(/[ÃÂâ]/g)?.length || 0)) {
      content = rec;
    }
  }

  for (const [re, to] of WORD_FIXES) {
    content = content.replace(re, to);
  }

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changed++;
  }
  scanned++;
}

for (const root of ROOTS) {
  if (fs.existsSync(root)) walk(root, fixFile);
}

console.log(`fixSpanishMojibake: scanned ${scanned} files, modified ${changed}.`);

