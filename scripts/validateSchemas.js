#!/usr/bin/env node
/**
 * Validador básico de esquemas/archivos clave del proyecto.
 * - Verifica que firestore.rules exista y tenga secciones críticas de seating.
 * - Verifica que firestore.indexes.json y firebase.json (si existen) sean JSON válidos.
 * - Devuelve exit code != 0 ante fallos.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd());

function ok(msg) { console.log(`✔ ${msg}`); }
function fail(msg) { console.error(`✖ ${msg}`); process.exitCode = 1; }

function readJsonIfExists(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) { ok(`${file} (no existe, se omite)`); return null; }
  try {
    const raw = fs.readFileSync(p, 'utf8');
    JSON.parse(raw);
    ok(`${file} válido`);
  } catch (e) {
    fail(`${file} inválido: ${e.message}`);
  }
  return null;
}

function validateRules() {
  const p = path.join(root, 'firestore.rules');
  if (!fs.existsSync(p)) { fail('firestore.rules no encontrado'); return; }
  const content = fs.readFileSync(p, 'utf8');
  const mustHave = ['isValidSeatingPlanDoc', 'isValidBanquetData', 'isValidCeremonyData'];
  for (const token of mustHave) {
    if (!content.includes(token)) fail(`firestore.rules no contiene ${token}`); else ok(`firestore.rules contiene ${token}`);
  }
}

async function main() {
  validateRules();
  readJsonIfExists('firestore.indexes.json');
  readJsonIfExists('firebase.json');
}

main();
