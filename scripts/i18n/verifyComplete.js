#!/usr/bin/env node

/**
 * Verificación final de migración i18n
 * Busca strings que podrían necesitar traducción
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');

const EXCLUDE_PATTERNS = [
  // Comentarios
  /^\s*\/\//,
  /^\s*\*/,
  /^\s*\/\*/,
  
  // Imports/exports
  /import .* from/,
  /export .* from/,
  
  // Console logs
  /console\./,
  
  // Atributos técnicos
  /className\s*=/,
  /data-testid\s*=/,
  /data-\w+\s*=/,
  /style\s*=/,
  /key\s*=/,
  
  // URLs y rutas
  /https?:\/\//,
  /^\/[^"']*$/,
  
  // Ya traducido
  /\{t\(/,
  /useTranslations/,
  /i18n/,
  
  // Regex patterns
  /\/.*\/[gimuy]*/,
  
  // Valores de constantes
  /const\s+\w+\s*=\s*['"`]/,
  
  // Enums y constantes
  /^[A-Z_]+$/,
];

const stats = {
  totalFiles: 0,
  filesWithPossibleStrings: 0,
  possibleStrings: 0,
  byFile: {},
};

function shouldExclude(line) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(line));
}

function checkFile(filePath) {
  stats.totalFiles++;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];
  
  lines.forEach((line, index) => {
    if (shouldExclude(line)) return;
    
    // Buscar strings con caracteres españoles
    const spanishRegex = /["']([^"']{5,}[áéíóúñÁÉÍÓÚÑ¿¡][^"']{2,})["']/g;
    let match;
    
    while ((match = spanishRegex.exec(line)) !== null) {
      const text = match[1];
      
      // Filtros adicionales
      if (text.length < 5) continue; // muy corto
      if (/^\w+$/.test(text)) continue; // solo una palabra técnica
      if (/^[A-Z_]+$/.test(text)) continue; // constante
      if (/\$\{/.test(text)) continue; // template string con variables
      
      findings.push({
        line: index + 1,
        text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
        context: line.trim().substring(0, 100),
      });
      
      stats.possibleStrings++;
    }
  });
  
  if (findings.length > 0) {
    stats.filesWithPossibleStrings++;
    stats.byFile[filePath] = findings;
  }
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
      
      checkFile(fullPath);
    }
  }
}

console.log('🔍 Verificación final de migración i18n\n');
console.log('=' .repeat(70) + '\n');

scanDirectory(SRC_DIR);

console.log('\n📊 RESUMEN:\n');
console.log(`   Archivos analizados: ${stats.totalFiles}`);
console.log(`   Archivos con posibles strings: ${stats.filesWithPossibleStrings}`);
console.log(`   Posibles strings encontrados: ${stats.possibleStrings}\n`);

if (stats.filesWithPossibleStrings > 0) {
  console.log('⚠️  ARCHIVOS CON POSIBLES STRINGS:\n');
  
  const sorted = Object.entries(stats.byFile)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 20); // Top 20
  
  sorted.forEach(([file, findings]) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`\n📄 ${relativePath} (${findings.length} strings):`);
    findings.slice(0, 5).forEach(f => {
      console.log(`   L${f.line}: "${f.text}"`);
    });
    if (findings.length > 5) {
      console.log(`   ... y ${findings.length - 5} más`);
    }
  });
  
  console.log('\n\n💡 NOTA:');
  console.log('   Muchos de estos pueden ser:');
  console.log('   - Comentarios en español (no necesitan traducción)');
  console.log('   - Valores de constantes/enums (no necesitan traducción)');
  console.log('   - Regex patterns para validación');
  console.log('   - Texto ya dentro de t() que no se detectó');
  console.log('\n   Revisa manualmente los más importantes.');
} else {
  console.log('✅ ¡No se encontraron strings pendientes!\n');
}

console.log('\n');
