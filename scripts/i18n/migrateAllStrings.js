#!/usr/bin/env node

/**
 * Script de migracion automatica COMPLETA de todos los strings hardcodeados a i18n
 * - Detecta strings en español
 * - Genera claves i18n automaticamente
 * - Actualiza archivos de traduccion (es, en, fr)
 * - Modifica componentes para usar useTranslations
 * - Añade imports necesarios
 */

const fs = require('fs');
const path = require('path');

// Configuracion
const SRC_DIR = path.join(__dirname, '../../src');
const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');

// Patrones a excluir
const EXCLUDED_PATTERNS = [
  /className\s*=\s*["`']/,
  /style\s*=\s*{/,
  /import .* from/,
  /export .* from/,
  /console\./,
  /data-testid/,
  /data-/,
  /aria-/,
  /\{t\(/,
  /useTranslations/,
  /i18n/,
  /<\/[^>]+>/,
  /^\s*\/\//,
  /^\s*\*/,
];

// Palabras comunes en español para detectar
const SPANISH_INDICATORS = [
  'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü',
  'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü',
  '¿', '¡'
];

const stats = {
  filesScanned: 0,
  filesModified: 0,
  stringsFound: 0,
  stringsMigrated: 0,
};

const allTranslations = {
  es: {},
  en: {},
  fr: {},
};

function hasSpanishCharacters(text) {
  return SPANISH_INDICATORS.some(char => text.includes(char));
}

function shouldExcludeLine(line) {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(line));
}

function generateKey(text, namespace = 'common') {
  // Generar una clave unica basada en el texto
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2) // solo palabras significativas
    .slice(0, 5)
    .join('_');
  
  return cleaned || 'text_' + Math.random().toString(36).substr(2, 9);
}

function detectNamespace(filePath) {
  if (filePath.includes('/components/tasks')) return 'tasks';
  if (filePath.includes('/components/seating')) return 'seating';
  if (filePath.includes('/components/email')) return 'email';
  if (filePath.includes('/components/guests')) return 'guests';
  if (filePath.includes('/components/proveedores') || filePath.includes('/components/providers')) return 'providers';
  if (filePath.includes('/pages/Finance') || filePath.includes('/components/finance')) return 'finance';
  if (filePath.includes('/pages/Tasks')) return 'tasks';
  if (filePath.includes('/pages/SeatingPlan')) return 'seating';
  if (filePath.includes('/pages/Invitados')) return 'guests';
  if (filePath.includes('/pages/Proveedores')) return 'providers';
  if (filePath.includes('/pages/admin')) return 'admin';
  if (filePath.includes('/pages/marketing')) return 'marketing';
  if (filePath.includes('/pages/protocolo')) return 'protocol';
  if (filePath.includes('Auth') || filePath.includes('Login') || filePath.includes('Signup')) return 'auth';
  return 'common';
}

function findStringsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const strings = new Map();

  lines.forEach((line, index) => {
    if (shouldExcludeLine(line)) return;

    // Buscar strings entre comillas dobles
    const doubleQuoteRegex = /"([^"]{3,})"/g;
    let match;
    while ((match = doubleQuoteRegex.exec(line)) !== null) {
      const text = match[1];
      if (hasSpanishCharacters(text) && !strings.has(text)) {
        strings.set(text, { text, line: index + 1, quote: '"' });
      }
    }

    // Buscar strings entre comillas simples
    const singleQuoteRegex = /'([^']{3,})'/g;
    while ((match = singleQuoteRegex.exec(line)) !== null) {
      const text = match[1];
      if (hasSpanishCharacters(text) && !strings.has(text)) {
        strings.set(text, { text, line: index + 1, quote: "'" });
      }
    }

    // Buscar strings entre backticks simples (sin interpolacion)
    const backtickRegex = /`([^`$]{3,})`/g;
    while ((match = backtickRegex.exec(line)) !== null) {
      const text = match[1];
      if (hasSpanishCharacters(text) && !strings.has(text)) {
        strings.set(text, { text, line: index + 1, quote: '`' });
      }
    }
  });

  return Array.from(strings.values());
}

function migrateFile(filePath) {
  stats.filesScanned++;
  
  const strings = findStringsInFile(filePath);
  if (strings.length === 0) return null;

  console.log(`\n📄 ${path.relative(process.cwd(), filePath)}`);
  console.log(`   Encontrados ${strings.length} strings`);

  const namespace = detectNamespace(filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  const replacements = [];

  // Generar claves y preparar reemplazos
  strings.forEach(({ text, quote }) => {
    const key = generateKey(text, namespace);
    const fullKey = `${namespace}.${key}`;

    // Guardar traduccion
    if (!allTranslations.es[namespace]) {
      allTranslations.es[namespace] = {};
      allTranslations.en[namespace] = {};
      allTranslations.fr[namespace] = {};
    }

    if (!allTranslations.es[namespace][key]) {
      allTranslations.es[namespace][key] = text;
      allTranslations.en[namespace][key] = text; // TODO: traducir
      allTranslations.fr[namespace][key] = text; // TODO: traducir
      stats.stringsMigrated++;
    }

    replacements.push({
      original: `${quote}${text}${quote}`,
      replacement: `{t('${fullKey}')}`,
      text
    });
  });

  // Aplicar reemplazos
  replacements.forEach(({ original, replacement, text }) => {
    // Usar escape para caracteres especiales en regex
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOriginal, 'g');
    
    if (content.includes(original)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`   ✓ "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);
    }
  });

  // Añadir import si no existe
  if (modified && !content.includes('useTranslations')) {
    const importStatement = "import { useTranslations } from '../../hooks/useTranslations';\n";
    
    // Buscar donde insertar el import
    const importRegex = /import .+ from .+;\n/g;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      content = content.slice(0, lastImportIndex + lastImport.length) + importStatement + content.slice(lastImportIndex + lastImport.length);
    } else {
      content = importStatement + content;
    }

    // Añadir hook al inicio del componente si no existe
    if (!content.includes('const { t }') && !content.includes('const t =')) {
      // Buscar la declaracion del componente
      const componentMatch = content.match(/(function|const)\s+\w+\s*[=\(]/);
      if (componentMatch) {
        const insertPos = content.indexOf('{', componentMatch.index) + 1;
        content = content.slice(0, insertPos) + '\n  const { t } = useTranslations();\n' + content.slice(insertPos);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    console.log(`   ✅ Archivo actualizado`);
  }

  return {
    filePath,
    namespace,
    stringsCount: strings.length,
    modified
  };
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage', 'i18n'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(jsx|js)$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      if (fullPath.includes('/i18n/')) continue;

      migrateFile(fullPath);
    }
  }
}

function saveTranslations() {
  console.log('\n\n💾 Guardando traducciones...');

  ['es', 'en', 'fr'].forEach(lang => {
    Object.keys(allTranslations[lang]).forEach(namespace => {
      const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
      
      // Leer existentes
      let existing = {};
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        // Crear directorio si no existe
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      // Merge (no sobrescribir existentes)
      const merged = { ...allTranslations[lang][namespace], ...existing };

      // Ordenar claves alfabeticamente
      const sorted = Object.keys(merged).sort().reduce((acc, key) => {
        acc[key] = merged[key];
        return acc;
      }, {});

      fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf-8');
      console.log(`   ✓ ${lang}/${namespace}.json - ${Object.keys(sorted).length} claves`);
    });
  });
}

function printSummary() {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE MIGRACION');
  console.log('='.repeat(70));
  console.log(`\n   Archivos escaneados:     ${stats.filesScanned}`);
  console.log(`   Archivos modificados:    ${stats.filesModified}`);
  console.log(`   Strings migrados:        ${stats.stringsMigrated}`);
  console.log('\n✅ MIGRACION COMPLETADA\n');
  
  if (stats.stringsMigrated > 0) {
    console.log('⚠️  SIGUIENTES PASOS:');
    console.log('   1. Revisar los archivos modificados');
    console.log('   2. Traducir las claves en en/*.json y fr/*.json');
    console.log('   3. Verificar que los componentes funcionan correctamente');
    console.log('   4. Ejecutar tests para validar');
  }
}

// MAIN
console.log('🚀 MIGRACION AUTOMATICA i18n\n');
console.log('Directorio: ' + SRC_DIR);
console.log('Locales: ' + LOCALES_DIR);
console.log('\n' + '='.repeat(70) + '\n');

scanDirectory(SRC_DIR);
saveTranslations();
printSummary();

console.log('\n');
