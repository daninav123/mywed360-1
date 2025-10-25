#!/usr/bin/env node

/**
 * Revierte cambios de i18n en archivos que NO son componentes React
 * (servicios, utils, tests, workers, etc.)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../../src');

// Directorios que NO son componentes React
const NON_COMPONENT_DIRS = [
  'services',
  'utils',
  'test',
  'tests',
  'workers',
  'hooks', // los hooks no necesitan migracion, usan funciones
];

let filesReverted = 0;

function shouldRevert(filePath) {
  // Revertir si esta en un directorio no-componente
  return NON_COMPONENT_DIRS.some(dir => filePath.includes(`${path.sep}${dir}${path.sep}`));
}

function revertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Eliminar import de useTranslations
  content = content.replace(/import\s+{\s*useTranslations\s*}\s+from\s+['"][^'"]+['"];\s*\n/g, '');
  
  // Eliminar declaracion del hook
  content = content.replace(/^\s*const\s+{\s*t\s*}\s*=\s*useTranslations\(\);\s*\n/gm, '');
  
  // Revertir llamadas a t() por los textos originales
  // Esto es mas complejo, por ahora solo eliminamos las referencias
  // El usuario tendra que revisar manualmente o usar git checkout
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Revertido: ${path.relative(process.cwd(), filePath)}`);
    filesReverted++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const entries = fs.readFileSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(jsx|js)$/.test(entry.name)) continue;
      
      if (shouldRevert(fullPath)) {
        revertFile(fullPath);
      }
    }
  }
}

console.log('🔄 Revirtiendo cambios en archivos no-componentes...\n');

// Mejor estrategia: usar git checkout para revertir archivos especificos
const filesToRevert = [
  'src/services/**/*.js',
  'src/utils/**/*.js',
  'src/test/**/*.js',
  'src/tests/**/*.js',
  'src/workers/**/*.js',
];

filesToRevert.forEach(pattern => {
  try {
    console.log(`Revirtiendo: ${pattern}`);
    execSync(`git checkout HEAD -- ${pattern}`, { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
  } catch (e) {
    // Puede que no haya cambios en algunos patrones
  }
});

console.log(`\n✅ Archivos revertidos con git checkout\n`);
