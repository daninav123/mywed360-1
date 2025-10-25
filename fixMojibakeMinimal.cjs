#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// SOLO las correcciones que realmente faltan (pocas y específicas)
const fixes = [
  ['sincronizacin', 'sincronización'],
  ['Sincronizacin', 'Sincronización'],
  ['Gestin', 'Gestión'],
  ['gestin', 'gestión'],
  ['conexin', 'conexión'],
  ['Conexin', 'Conexión'],
  ['Anlisis', 'Análisis'],
  ['anlisis', 'análisis'],
  ['prximos', 'próximos'],
  ['prximas', 'próximas'],
  ['xito', 'Éxito'],
];

function fix(text) {
  let f = text;
  for (const [b, g] of fixes) f = f.split(b).join(g);
  return f;
}

function proc(dir) {
  let c = 0;
  for (const it of fs.readdirSync(dir)) {
    const p = path.join(dir, it);
    if (fs.statSync(p).isDirectory()) c += proc(p);
    else if (it.endsWith('.json') && !it.includes('.bak')) {
      const txt = fs.readFileSync(p, 'utf8');
      const ftxt = fix(txt);
      if (txt !== ftxt) {
        fs.writeFileSync(p, ftxt, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), p)}`);
        c++;
      }
    }
  }
  return c;
}

const locDir = path.resolve(__dirname, 'src/i18n/locales');
console.log('🔧 Corrección mínima de mojibake...\n');
const tot = proc(locDir);
console.log(`\n✅ ${tot} archivos corregidos (solo palabras faltantes)`);
