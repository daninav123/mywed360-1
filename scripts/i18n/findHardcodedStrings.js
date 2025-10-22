#!/usr/bin/env node

/**
 * Script para detectar strings hardcodeados en español
 * Busca texto con acentos/ñ que no están dentro de t() o useTranslations
 * 
 * Uso: node scripts/i18n/findHardcodedStrings.js [directorio]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio a analizar (por defecto src/)
const TARGET_DIR = process.argv[2] || path.join(__dirname, '../../src');

// Patrones a excluir (no son traducciones)
const EXCLUDED_PATTERNS = [
  /className\s*=\s*["`']/,           // className="..."
  /style\s*=\s*{/,                   // style={{...}}
  /import .* from/,                  // imports
  /console\.(log|error|warn|info)/,  // console logs
  /<\/[^>]+>/,                       // closing tags
  /^\s*\/\//,                        // comentarios
  /^\s*\*/,                          // comentarios multilinea
  /data-/,                           // data attributes
  /aria-/,                           // aria attributes
  /placeholder\s*=\s*{t\(/,          // ya traducido
  /\{t\(/,                           // ya usando t()
  /useTranslations/,                 // import hook
  /\.json/,                          // archivos JSON
];

// Regex para detectar español (strings con acentos, ñ, ¿, ¡)
const SPANISH_PATTERNS = [
  // Strings con acentos o ñ
  /['"`]([^'"`]*[áéíóúñÁÉÍÓÚÑ¿¡][^'"`]*)['"`]/g,
  // Palabras comunes en español hardcodeadas
  /(["'`])(Añadir|Eliminar|Guardar|Cancelar|Buscar|Filtrar|Editar|Cerrar)\1/g,
];

const stats = {
  filesScanned: 0,
  filesWithIssues: 0,
  totalIssues: 0,
  byComponent: {},
};

function shouldExcludeLine(line) {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(line));
}

function findHardcodedInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    if (shouldExcludeLine(line)) return;

    SPANISH_PATTERNS.forEach(pattern => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(match => {
        const text = match[1] || match[2];
        if (text && text.length > 2) { // Ignorar strings muy cortos
          issues.push({
            line: index + 1,
            text,
            context: line.trim().slice(0, 100),
          });
        }
      });
    });
  });

  return issues;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Ignorar node_modules, dist, build, etc.
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Solo archivos .jsx y .js
      if (!/\.(jsx|js)$/.test(entry.name)) continue;
      
      // Ignorar archivos de test y i18n
      if (/\.(test|spec)\./.test(entry.name)) continue;
      if (fullPath.includes('/i18n/')) continue;

      stats.filesScanned++;
      const issues = findHardcodedInFile(fullPath);

      if (issues.length > 0) {
        stats.filesWithIssues++;
        stats.totalIssues += issues.length;

        const relativePath = path.relative(process.cwd(), fullPath);
        const componentName = path.basename(fullPath, path.extname(fullPath));

        stats.byComponent[componentName] = (stats.byComponent[componentName] || 0) + issues.length;

        console.log(`\n📄 ${relativePath}`);
        console.log(`   ${issues.length} string(s) hardcoded encontrado(s):\n`);

        issues.forEach(issue => {
          console.log(`   Línea ${issue.line}: "${issue.text}"`);
          console.log(`   └─ ${issue.context}\n`);
        });
      }
    }
  }
}

console.log('🔍 Buscando strings hardcodeados en español...\n');
console.log(`📁 Directorio: ${TARGET_DIR}\n`);
console.log('─'.repeat(80));

scanDirectory(TARGET_DIR);

console.log('\n' + '─'.repeat(80));
console.log('\n📊 RESUMEN:\n');
console.log(`   Archivos analizados: ${stats.filesScanned}`);
console.log(`   Archivos con problemas: ${stats.filesWithIssues}`);
console.log(`   Total strings hardcodeados: ${stats.totalIssues}\n`);

if (stats.totalIssues > 0) {
  console.log('🏆 Top 10 componentes con más strings hardcodeados:\n');
  const sorted = Object.entries(stats.byComponent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sorted.forEach(([component, count], index) => {
    console.log(`   ${index + 1}. ${component}: ${count} strings`);
  });

  console.log('\n💡 Próximos pasos:');
  console.log('   1. Revisar los componentes del top 10');
  console.log('   2. Añadir las traducciones a src/i18n/locales/es/*.json');
  console.log('   3. Reemplazar strings con t("key")');
  console.log('   4. Ejecutar este script de nuevo para verificar');
  
  process.exit(1); // Exit con error para CI
} else {
  console.log('✅ ¡No se encontraron strings hardcodeados! 🎉\n');
  process.exit(0);
}
