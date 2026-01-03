#!/usr/bin/env node

/**
 * Script para corregir traducciones con llaves incorrectas
 * Encuentra: {t('key')} en contextos no-JSX
 * Reemplaza: t('key')
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');
let filesFixed = 0;
let replacements = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Patrón 1: {t('...')} en objetos/arrays (no en JSX)
  // Contextos donde NO debe tener llaves:
  // - Dentro de objetos: { prop: {t('key')} }
  // - Dentro de arrays: [{t('key')}]
  // - Como valores de propiedades: foo: {t('key')}
  // - En parámetros de funciones: func({t('key')})
  
  // Buscar {t('...')} que no esté dentro de JSX
  const regex = /\{\s*t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\}/g;
  
  // Para evitar reemplazar en JSX válido, solo reemplazamos en contextos específicos:
  // 1. Después de : (propiedad de objeto)
  // 2. Después de [ (elemento de array)
  // 3. Después de , (separador)
  // 4. Después de ( (argumento de función)
  
  const lines = content.split('\n');
  const newLines = [];
  let changed = false;
  
  for (const line of lines) {
    let newLine = line;
    
    // Detectar si la línea es JSX (tiene < o > cercanos)
    const isLikelyJSX = /<[^>]+>|\/>/.test(line) || (line.trim().startsWith('return') && line.includes('<'));
    
    if (!isLikelyJSX) {
      // Reemplazar {t(...)} por t(...) en contextos no-JSX
      const replaced = newLine.replace(
        /([:\[,\(]\s*)\{\s*t\s*\(\s*(['"`])([^'"`]+)\2\s*\)\s*\}/g,
        '$1t($2$3$2)'
      );
      
      if (replaced !== newLine) {
        newLine = replaced;
        changed = true;
        replacements++;
      }
    }
    
    newLines.push(newLine);
  }
  
  if (changed) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)} (${replacements} reemplazos)`);
    filesFixed++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(jsx|js)$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      
      fixFile(fullPath);
    }
  }
}

console.log('🔧 Corrigiendo {t(...)} en contextos no-JSX...\n');
scanDirectory(SRC_DIR);
console.log(`\n✅ Archivos corregidos: ${filesFixed}`);
console.log(`   Total reemplazos: ${replacements}\n`);
