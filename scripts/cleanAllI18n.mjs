/**
 * Script para limpiar todos los archivos i18n eliminando caracteres de control
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// Eliminar caracteres de control inválidos
function removeInvalidControlChars(text) {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Reparar JSON
function repairJSON(text) {
  let repaired = text;
  
  // Eliminar BOM
  if (repaired.charCodeAt(0) === 0xFEFF) {
    repaired = repaired.slice(1);
  }
  
  // Eliminar caracteres de control
  repaired = removeInvalidControlChars(repaired);
  
  // Eliminar replacement chars
  repaired = repaired.replace(/\uFFFD/g, '');
  
  // Eliminar trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  return repaired;
}

// Procesar archivo
function processFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const repaired = repairJSON(content);
    
    try {
      const data = JSON.parse(repaired);
      const formatted = JSON.stringify(data, null, 2);
      fs.writeFileSync(filepath, formatted + '\n', { encoding: 'utf8' });
      return { success: true };
    } catch (parseErr) {
      fs.writeFileSync(filepath, repaired, { encoding: 'utf8' });
      return { success: false, error: parseErr.message, saved: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Recorrer directorios
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    
    if (stat.isDirectory()) {
      walkDir(filepath, callback);
    } else if (file.endsWith('.json')) {
      callback(filepath);
    }
  }
}

// Ejecutar
console.log('🔧 Limpiando archivos i18n...\n');

const stats = { total: 0, fixed: 0, partial: 0, errors: 0 };
const broken = [];

walkDir(LOCALES_DIR, (filepath) => {
  stats.total++;
  const rel = path.relative(LOCALES_DIR, filepath);
  const result = processFile(filepath);
  
  if (result.success) {
    stats.fixed++;
    console.log(`✅ ${rel}`);
  } else if (result.saved) {
    stats.partial++;
    console.log(`⚠️  ${rel}`);
    broken.push(rel);
  } else {
    stats.errors++;
    console.log(`❌ ${rel}`);
  }
});

console.log('\n📊 Resumen:');
console.log(`   Total: ${stats.total}`);
console.log(`   ✅ Reparados: ${stats.fixed}`);
console.log(`   ⚠️  Parciales: ${stats.partial}`);
console.log(`   ❌ Errores: ${stats.errors}`);

if (broken.length > 0 && broken.length <= 15) {
  console.log('\n⚠️  Archivos que necesitan revisión:');
  broken.forEach(f => console.log(`   - ${f}`));
}

console.log('\n✨ Limpieza completada');
