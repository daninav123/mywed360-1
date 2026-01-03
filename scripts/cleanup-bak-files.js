#!/usr/bin/env node
/**
 * Script para eliminar archivos .bak huérfanos del repositorio
 * Uso: node scripts/cleanup-bak-files.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');

console.log('\n🧹 Limpieza de Archivos .bak\n');
console.log('==============================\n');

if (isDryRun) {
  console.log('🔍 Modo DRY-RUN (no se eliminarán archivos)\n');
}

/**
 * Buscar todos los archivos .bak en el repositorio
 */
async function findBakFiles() {
  try {
    // Usar git ls-files para encontrar solo archivos trackeados
    const { stdout } = await execAsync('git ls-files "*.bak"', { cwd: rootDir });
    const files = stdout.trim().split('\n').filter(Boolean);
    return files;
  } catch (error) {
    // Si falla git, buscar manualmente
    console.warn('⚠️  Git no disponible, buscando manualmente...\n');
    return findBakFilesManually(rootDir);
  }
}

/**
 * Búsqueda manual recursiva de archivos .bak
 */
function findBakFilesManually(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      // Ignorar node_modules, dist, etc.
      if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'coverage') {
        continue;
      }

      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          findBakFilesManually(filePath, results);
        } else if (file.includes('.bak')) {
          // Buscar cualquier archivo que contenga .bak (ej: .bak3, .bak-json, etc.)
          const relativePath = path.relative(rootDir, filePath);
          results.push(relativePath);
        }
      } catch (err) {
        // Ignorar errores de permisos
      }
    }
  } catch (err) {
    console.error(`Error leyendo directorio ${dir}:`, err.message);
  }

  return results;
}

/**
 * Obtener tamaño de un archivo
 */
function getFileSize(filePath) {
  try {
    const fullPath = path.join(rootDir, filePath);
    const stats = fs.statSync(fullPath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Formatear bytes a formato legible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Eliminar archivos .bak
 */
async function deleteBakFiles(files) {
  if (files.length === 0) {
    console.log('✅ No se encontraron archivos .bak para eliminar.\n');
    return { deleted: 0, totalSize: 0 };
  }

  console.log(`📦 Archivos .bak encontrados: ${files.length}\n`);

  let totalSize = 0;
  const byCategory = {};

  // Agrupar por categoría
  for (const file of files) {
    const size = getFileSize(file);
    totalSize += size;

    let category = 'Otros';
    if (file.includes('i18n/locales')) category = 'Traducciones (i18n)';
    else if (file.includes('backend')) category = 'Backend';
    else if (file.includes('pages')) category = 'Páginas';
    else if (file.includes('components')) category = 'Componentes';

    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({ path: file, size });
  }

  // Mostrar resumen por categoría
  for (const [category, items] of Object.entries(byCategory)) {
    const categorySize = items.reduce((sum, item) => sum + item.size, 0);
    console.log(`\n📁 ${category} (${items.length} archivos, ${formatBytes(categorySize)})`);

    for (const item of items.slice(0, 5)) {
      console.log(`   - ${item.path} (${formatBytes(item.size)})`);
    }

    if (items.length > 5) {
      console.log(`   ... y ${items.length - 5} más`);
    }
  }

  console.log(`\n📊 Total: ${files.length} archivos, ${formatBytes(totalSize)}\n`);

  if (isDryRun) {
    console.log('🔍 DRY-RUN: Los archivos NO fueron eliminados.\n');
    console.log('Para eliminar realmente, ejecuta:');
    console.log('   node scripts/cleanup-bak-files.js\n');
    return { deleted: 0, totalSize: 0 };
  }

  // Confirmar eliminación
  console.log('⚠️  ¿Estás seguro de que deseas eliminar estos archivos?\n');
  console.log('   Presiona Ctrl+C para cancelar...\n');

  // Dar 3 segundos para cancelar
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('🗑️  Eliminando archivos...\n');

  let deleted = 0;

  for (const file of files) {
    try {
      // Usar git rm si está disponible
      try {
        await execAsync(`git rm "${file}"`, { cwd: rootDir });
        console.log(`   ✅ ${file}`);
        deleted++;
      } catch {
        // Si falla git rm, eliminar manualmente
        const fullPath = path.join(rootDir, file);
        fs.unlinkSync(fullPath);
        console.log(`   ✅ ${file} (manual)`);
        deleted++;
      }
    } catch (error) {
      console.error(`   ❌ Error eliminando ${file}:`, error.message);
    }
  }

  console.log(
    `\n✅ Eliminados ${deleted} de ${files.length} archivos (${formatBytes(totalSize)} liberados)\n`
  );

  return { deleted, totalSize };
}

/**
 * Main
 */
async function main() {
  try {
    const bakFiles = await findBakFiles();
    const result = await deleteBakFiles(bakFiles);

    if (result.deleted > 0 && !isDryRun) {
      console.log('📝 Próximos pasos:\n');
      console.log('   1. Revisar cambios: git status');
      console.log('   2. Commitear: git commit -m "chore: eliminar archivos .bak huérfanos"');
      console.log('   3. Subir: git push origin windows\n');
    }

    console.log('==============================\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
