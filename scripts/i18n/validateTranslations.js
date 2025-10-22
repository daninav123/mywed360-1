#!/usr/bin/env node

/**
 * Script para validar que las traducciones están completas
 * Compara español (fuente) con inglés (destino) y reporta claves faltantes
 * 
 * Uso: node scripts/i18n/validateTranslations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');

// Idiomas a validar
const SOURCE_LANG = 'es'; // Idioma fuente (completo)
const TARGET_LANGS = ['en', 'es-MX', 'es-AR']; // Idiomas a validar

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error cargando ${filePath}:`, error.message);
    return null;
  }
}

function findMissingKeys(source, target, path = '') {
  const missing = [];
  const extra = [];

  // Buscar claves faltantes en target
  for (const key in source) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!(key in target)) {
      missing.push(currentPath);
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (typeof target[key] === 'object' && target[key] !== null) {
        const nested = findMissingKeys(source[key], target[key], currentPath);
        missing.push(...nested.missing);
        extra.push(...nested.extra);
      } else {
        missing.push(currentPath);
      }
    }
  }

  // Buscar claves extra en target (no están en source)
  for (const key in target) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in source)) {
      extra.push(currentPath);
    }
  }

  return { missing, extra };
}

function getTranslationFiles(langDir) {
  try {
    const files = fs.readdirSync(langDir);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    return [];
  }
}

function validateLanguage(sourceLang, targetLang) {
  const sourceLangDir = path.join(LOCALES_DIR, sourceLang);
  const targetLangDir = path.join(LOCALES_DIR, targetLang);

  if (!fs.existsSync(targetLangDir)) {
    console.log(`\n⚠️  Idioma ${targetLang} no tiene carpeta de traducciones`);
    return { totalMissing: 0, totalExtra: 0 };
  }

  const sourceFiles = getTranslationFiles(sourceLangDir);
  let totalMissing = 0;
  let totalExtra = 0;

  console.log(`\n🌍 Validando: ${sourceLang} → ${targetLang}`);
  console.log('─'.repeat(60));

  sourceFiles.forEach(filename => {
    const sourcePath = path.join(sourceLangDir, filename);
    const targetPath = path.join(targetLangDir, filename);

    const sourceData = loadJSON(sourcePath);
    if (!sourceData) return;

    if (!fs.existsSync(targetPath)) {
      console.log(`\n❌ ${filename} - FALTA COMPLETAMENTE`);
      return;
    }

    const targetData = loadJSON(targetPath);
    if (!targetData) return;

    const { missing, extra } = findMissingKeys(sourceData, targetData);

    if (missing.length > 0 || extra.length > 0) {
      console.log(`\n📄 ${filename}:`);

      if (missing.length > 0) {
        console.log(`   ❌ Faltan ${missing.length} claves:`);
        missing.slice(0, 10).forEach(key => {
          console.log(`      - ${key}`);
        });
        if (missing.length > 10) {
          console.log(`      ... y ${missing.length - 10} más`);
        }
        totalMissing += missing.length;
      }

      if (extra.length > 0) {
        console.log(`   ⚠️  ${extra.length} claves extra (no en source):`);
        extra.slice(0, 5).forEach(key => {
          console.log(`      + ${key}`);
        });
        if (extra.length > 5) {
          console.log(`      ... y ${extra.length - 5} más`);
        }
        totalExtra += extra.length;
      }
    } else {
      console.log(`   ✅ ${filename} - Completo`);
    }
  });

  return { totalMissing, totalExtra };
}

console.log('🔍 Validando traducciones...\n');
console.log(`📁 Directorio: ${LOCALES_DIR}`);
console.log(`📌 Idioma fuente: ${SOURCE_LANG}`);
console.log(`🎯 Idiomas objetivo: ${TARGET_LANGS.join(', ')}\n`);

let globalMissing = 0;
let globalExtra = 0;

TARGET_LANGS.forEach(targetLang => {
  const { totalMissing, totalExtra } = validateLanguage(SOURCE_LANG, targetLang);
  globalMissing += totalMissing;
  globalExtra += totalExtra;
});

console.log('\n' + '═'.repeat(60));
console.log('\n📊 RESUMEN GLOBAL:\n');
console.log(`   ❌ Total claves faltantes: ${globalMissing}`);
console.log(`   ⚠️  Total claves extra: ${globalExtra}`);

if (globalMissing > 0) {
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisar las claves faltantes arriba');
  console.log('   2. Añadirlas a los archivos JSON correspondientes');
  console.log('   3. Ejecutar: node scripts/i18n/autoTranslate.js (opcional)');
  console.log('   4. Revisar y corregir traducciones manualmente\n');
  process.exit(1);
} else {
  console.log('\n✅ ¡Todas las traducciones están completas! 🎉\n');
  process.exit(0);
}
