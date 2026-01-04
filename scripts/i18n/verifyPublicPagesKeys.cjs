#!/usr/bin/env node

/**
 * Script para verificar que todas las claves i18n usadas en páginas públicas
 * (fuera del login) existen en los archivos de traducción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_PAGES_DIRS = [
  'apps/main-app/src/pages/marketing',
  'apps/main-app/src/components/theme/WeddingTheme.jsx',
];

const LOCALES_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales');
const PROJECT_ROOT = path.join(__dirname, '../..');

// Regex para extraer llamadas a t()
const T_CALL_PATTERNS = [
  // t('key') o t("key")
  /t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  // t('namespace:key') o t("namespace:key")
  /t\s*\(\s*['"`]([^'"`]+:[^'"`]+)['"`]\s*\)/g,
  // {t('key')} en JSX
  /\{t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\}/g,
];

function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set();

  T_CALL_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  });

  return Array.from(keys);
}

function findPublicPageFiles() {
  const files = [];

  PUBLIC_PAGES_DIRS.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Directorio no encontrado: ${dir}`);
      return;
    }

    // Si es un archivo específico
    if (fs.statSync(fullPath).isFile()) {
      files.push(fullPath);
      return;
    }

    // Si es un directorio, buscar recursivamente
    try {
      const findCmd = `find "${fullPath}" -type f \\( -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" \\)`;
      const result = execSync(findCmd, { encoding: 'utf-8' });
      const foundFiles = result.trim().split('\n').filter(f => f);
      files.push(...foundFiles);
    } catch (error) {
      console.warn(`⚠️  Error buscando archivos en ${dir}:`, error.message);
    }
  });

  return files;
}

function parseKey(key) {
  // Parsear key con formato 'namespace:key' o simplemente 'key'
  const parts = key.split(':');
  if (parts.length === 2) {
    return { namespace: parts[0], key: parts[1] };
  }
  // Por defecto, asumir namespace 'common'
  return { namespace: 'common', key: key };
}

function checkKeyExists(namespace, key, locale) {
  const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    return { exists: false, reason: 'file_not_found' };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Navegar por claves anidadas (e.g., "footer.product")
    const keyParts = key.split('.');
    let current = data;
    
    for (const part of keyParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return { exists: false, reason: 'key_not_found' };
      }
    }

    return { exists: true };
  } catch (error) {
    return { exists: false, reason: 'parse_error', error: error.message };
  }
}

function getAvailableLocales() {
  return fs.readdirSync(LOCALES_DIR)
    .filter(dir => {
      const dirPath = path.join(LOCALES_DIR, dir);
      return fs.statSync(dirPath).isDirectory();
    });
}

function verifyPublicPages() {
  console.log('🔍 Verificando claves i18n en páginas públicas...\n');

  const files = findPublicPageFiles();
  console.log(`📄 Archivos encontrados: ${files.length}\n`);

  const allKeys = new Map(); // key -> [files using it]
  const missingKeys = new Map(); // key -> { files, locales }

  // Extraer todas las claves de todos los archivos
  files.forEach(file => {
    const keys = extractKeysFromFile(file);
    const relativePath = path.relative(PROJECT_ROOT, file);

    keys.forEach(key => {
      if (!allKeys.has(key)) {
        allKeys.set(key, []);
      }
      allKeys.get(key).push(relativePath);
    });
  });

  console.log(`🔑 Claves únicas encontradas: ${allKeys.size}\n`);

  const locales = getAvailableLocales();
  const primaryLocales = ['es', 'en']; // Verificar principalmente estos

  // Verificar cada clave en los locales principales
  allKeys.forEach((files, fullKey) => {
    const { namespace, key } = parseKey(fullKey);

    primaryLocales.forEach(locale => {
      const check = checkKeyExists(namespace, key, locale);

      if (!check.exists) {
        const missingKey = `${namespace}:${key}`;
        if (!missingKeys.has(missingKey)) {
          missingKeys.set(missingKey, {
            namespace,
            key,
            files: files,
            locales: []
          });
        }
        missingKeys.get(missingKey).locales.push({
          locale,
          reason: check.reason,
          error: check.error
        });
      }
    });
  });

  // Reporte
  if (missingKeys.size === 0) {
    console.log('✅ ¡Todas las claves existen en los archivos de traducción!\n');
    console.log('📊 Resumen:');
    console.log(`   📄 Archivos analizados: ${files.length}`);
    console.log(`   🔑 Claves encontradas: ${allKeys.size}`);
    console.log(`   🌍 Locales verificados: ${primaryLocales.join(', ')}`);
    console.log(`   ✓  Claves faltantes: 0`);
    return;
  }

  console.log(`❌ Se encontraron ${missingKeys.size} claves faltantes:\n`);

  missingKeys.forEach((info, missingKey) => {
    console.log(`\n🔴 ${missingKey}`);
    console.log(`   Namespace: ${info.namespace}`);
    console.log(`   Key: ${info.key}`);
    console.log(`   Usada en:`);
    info.files.forEach(file => {
      console.log(`     - ${file}`);
    });
    console.log(`   Falta en locales:`);
    info.locales.forEach(({ locale, reason, error }) => {
      const reasonText = reason === 'file_not_found' 
        ? `archivo ${info.namespace}.json no existe`
        : reason === 'key_not_found'
        ? 'clave no encontrada en el archivo'
        : `error: ${error}`;
      console.log(`     - ${locale}: ${reasonText}`);
    });
  });

  console.log('\n📊 Resumen:');
  console.log(`   📄 Archivos analizados: ${files.length}`);
  console.log(`   🔑 Claves encontradas: ${allKeys.size}`);
  console.log(`   🌍 Locales verificados: ${primaryLocales.join(', ')}`);
  console.log(`   ❌ Claves faltantes: ${missingKeys.size}`);

  // Generar JSON con el reporte
  const report = {
    timestamp: new Date().toISOString(),
    filesAnalyzed: files.length,
    totalKeys: allKeys.size,
    missingKeys: Array.from(missingKeys.entries()).map(([key, info]) => ({
      key,
      namespace: info.namespace,
      keyPath: info.key,
      files: info.files,
      missingInLocales: info.locales
    }))
  };

  const reportPath = path.join(__dirname, 'public-pages-i18n-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📝 Reporte guardado en: ${path.relative(PROJECT_ROOT, reportPath)}`);

  process.exit(missingKeys.size > 0 ? 1 : 0);
}

// Ejecutar
verifyPublicPages();
