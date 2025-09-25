#!/usr/bin/env node
/**
 * fixDocsMojibake.js
 *
 * Corrige mojibake (acentos rotos, caracteres �, secuencias ���) en la documentación.
 * Aplica una heurística segura: solo reescribe si el contenido mejora (menos "�/���").
 *
 * Ámbito: docs/** y archivos Markdown/YAML del root (p. ej., README.md).
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  'docs',
  '.', // para cubrir README.md del root
];
const EXTS = new Set(['.md', '.markdown', '.mdx', '.yaml', '.yml']);

function listFiles(dir) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist' || ent.name === 'coverage') continue;
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (EXTS.has(path.extname(ent.name))) out.push(p);
    }
  }
  walk(dir);
  return out;
}

// Métrica de "mojibake"; más bajo es mejor
function scoreMojibake(s) {
  const badChars = (s.match(/[�]/g) || []).length; // replacement char
  const trip = (s.match(/���/g) || []).length;
  const markers = (s.match(/[ǟ���]/g) || []).length;
  return badChars * 5 + trip * 3 + markers;
}

// Cuenta de tildes y eñes para favorecer la versión decodificada si gana legibilidad
function scoreAccents(s) {
  const accents = (s.match(/[áéíóúñÁÉÍÓÚÑ]/g) || []).length;
  return accents;
}

function decodeViaEscape(s) {
  try {
    // escape -> %xx, decodeURIComponent asume UTF-8
    // No siempre sirve, por eso se compara score
    return decodeURIComponent(escape(s));
  } catch {
    return s;
  }
}

function decodeLatin1ToUtf8(s) {
  try {
    return Buffer.from(s, 'latin1').toString('utf8');
  } catch {
    return s;
  }
}

const WORD_FIXES = [
  [/Gesti���n/gi, 'Gestión'],
  [/Administraci���n/gi, 'Administración'],
  [/Configuraci���n/gi, 'Configuración'],
  [/Direcci���n/gi, 'Dirección'],
  [/Env���o/gi, 'Envío'],
  [/Env���os/gi, 'Envíos'],
  [/Recepci���n/gi, 'Recepción'],
  [/Pr���xim/gi, 'Próxim'],
  [/M���s/gi, 'Más'],
  [/Opci���n/gi, 'Opción'],
  [/Dise���o/gi, 'Diseño'],
  [/Se���alizaci���n/gi, 'Señalización'],
  [/Se���ales/gi, 'Señales'],
  [/Se���al/gi, 'Señal'],
  [/A���ad/gi, 'Añad'],
  [/al���rgen/gi, 'alérgen'],
  [/Gu���a/gi, 'Guía'],
  [/N���mer/gi, 'Númer'],
  [/���ltima/gi, 'Última'],
  [/Comunicaci���n/gi, 'Comunicación'],
  [/conexi���n/gi, 'conexión'],
  [/b���sic/gi, 'básic'],
  [/m���vil/gi, 'móvil'],
  [/contrase���a/gi, 'contraseña'],
  [/Mar���a/g, 'María'],
  [/Garc���a/g, 'García'],
  [/P���rez/g, 'Pérez'],
  [/L���pez/g, 'López'],
  [/Informaci���n/gi, 'Información'],
  [/Valoraci���n/gi, 'Valoración'],
  [/programaci���n/gi, 'programación'],
  // Casos frecuentes en README/docs
  [/documentaci��n/gi, 'documentación'],
  [/Caracter��sticas/g, 'Características'],
  [/caracter��sticas/g, 'características'],
  [/Instalaci��n/g, 'Instalación'],
  [/M��dulos/g, 'Módulos'],
  [/m��dulos/g, 'módulos'],
  [/Monitorizaci��n/gi, 'Monitorización'],
  [/Pr�xim/gi, 'Próxim'],
  [/Pr��xim/gi, 'Próxim'],
  [/mǸtricas/gi, 'métricas'],
  [/tǸcnic/gi, 'técnic'],
  // Francés
  [/Param���tres/gi, 'Paramètres'],
  [/D���connexion/gi, 'Déconnexion'],
  [/T���ches/gi, 'Tâches'],
  [/Cr���er/gi, 'Créer'],
  [/R���initialiser/gi, 'Réinitialiser'],
  [/Invit���s/gi, 'Invités'],
  [/T���l���phone/gi, 'Téléphone'],
  [/S���lectionnez/gi, 'Sélectionnez'],
  [/estim���/gi, 'estimé'],
  [/ic���ne/gi, 'icône'],
];

function fixText(text) {
  const baseScore = scoreMojibake(text);
  const baseAcc = scoreAccents(text);

  const candidates = [];
  const esc = decodeViaEscape(text);
  candidates.push(esc);
  const lat = decodeLatin1ToUtf8(text);
  candidates.push(lat);

  let best = text;
  let bestScore = baseScore;
  let bestAcc = baseAcc;

  for (const cand of candidates) {
    const s = scoreMojibake(cand);
    const a = scoreAccents(cand);
    // Preferir menor mojibake; empate: preferir más acentos reconocidos
    if (s < bestScore || (s === bestScore && a > bestAcc)) {
      best = cand;
      bestScore = s;
      bestAcc = a;
    }
  }

  let out = best;
  for (const [re, to] of WORD_FIXES) out = out.replace(re, to);
  // Limpiezas genéricas
  out = out.replace(/���+/g, '');
  // Arreglar secuencias comunes de comillas/guiones mal decodificadas
  out = out.replace(/�?"/g, ' – '); // guion largo aproximado
  out = out.replace(/�"/g, '"');
  out = out.replace(/�'�/g, "'");
  return out;
}

let scanned = 0, changed = 0;
const files = Array.from(new Set(ROOTS.flatMap(listFiles)));
for (const f of files) {
  // Solo algunos archivos del root (README*)
  if (path.dirname(f) === '.' && !/^README(\..*)?$/.test(path.basename(f))) continue;
  try {
    const original = fs.readFileSync(f, 'utf8');
    let fixed = fixText(original);
    // Normalización específica para README.md (título Monorepo y tagline)
    if (path.basename(f).toLowerCase() === 'readme.md') {
      const lines = fixed.split(/\r?\n/);
      if (lines[0] && /MyWed360/.test(lines[0]) && /Monorepo/.test(lines[0])) {
        lines[0] = '# MyWed360 – Monorepo (Frontend + Backend + Docs)';
      }
      // Buscar la primera línea no vacía después del título que repite el tagline
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        if (lines[i] && /MyWed360/.test(lines[i]) && /Monorepo/.test(lines[i])) {
          lines[i] = 'MyWed360 – Monorepo (Frontend + Backend + Docs)';
          break;
        }
      }
      fixed = lines.join('\n');
    }
    if (fixed !== original) {
      fs.writeFileSync(f, fixed, 'utf8');
      changed++;
      process.stdout.write(`[fixed] ${f}\n`);
    }
    scanned++;
  } catch (e) {
    process.stderr.write(`[skip] ${f}: ${e.message}\n`);
  }
}

console.log(`fixDocsMojibake: scanned ${scanned} files, modified ${changed}.`);
