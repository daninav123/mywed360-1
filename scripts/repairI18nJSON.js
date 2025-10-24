/**
 * Script para reparar archivos JSON de i18n corruptos
 * Intenta múltiples encodings y repara sintaxis JSON rota
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// Función para limpiar mojibake
function cleanMojibake(text) {
  let cleaned = text;
  
  // Reemplazos específicos detectados
  const replacements = {
    '�': 'ó',
    'ó': 'ó',
    'í': 'í',
    'á': 'á',
    'é': 'é',
    'ú': 'ú',
    'ñ': 'ñ',
    '¿': '¿',
    '¡': '¡',
    '\uFFFD': '',
  };
  
  for (const [bad, good] of Object.entries(replacements)) {
    cleaned = cleaned.split(bad).join(good);
  }
  
  return cleaned;
}

// Función para intentar reparar JSON
function tryRepairJSON(text) {
  let repaired = text;
  
  // Eliminar trailing commas antes de } o ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Asegurar que las strings estén bien cerradas
  // (esto es más complejo, por ahora solo limpiamos básico)
  
  return repaired;
}

// Función para intentar parsear con múltiples estrategias
function parseJSONFlexible(text) {
  // Estrategia 1: Parse directo
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Estrategia 2: Limpiar mojibake y reintentar
    try {
      const cleaned = cleanMojibake(text);
      return JSON.parse(cleaned);
    } catch (e2) {
      // Estrategia 3: Reparar sintaxis y reintentar
      try {
        const repaired = tryRepairJSON(cleanMojibake(text));
        return JSON.parse(repaired);
      } catch (e3) {
        // Estrategia 4: Usar JSON5 o evaluar con precaución
        // Por ahora, fallar
        throw new Error(`No se pudo parsear JSON: ${e3.message}`);
      }
    }
  }
}

// Función para procesar un archivo
function repairFile(filepath) {
  try {
    // Leer archivo
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Intentar parsear
    const data = parseJSONFlexible(content);
    
    // Guardar con formato correcto
    const formatted = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, formatted, { encoding: 'utf8' });
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Función para recorrer directorios
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
console.log('🔧 Reparando archivos JSON de i18n...\n');

const stats = {
  total: 0,
  fixed: 0,
  errors: 0,
};

const errors = [];

walkDir(LOCALES_DIR, (filepath) => {
  stats.total++;
  const relativePath = path.relative(LOCALES_DIR, filepath);
  
  const result = repairFile(filepath);
  
  if (result.success) {
    stats.fixed++;
    console.log(`✅ ${relativePath}`);
  } else {
    stats.errors++;
    console.log(`❌ ${relativePath} - ${result.error}`);
    errors.push({ file: relativePath, error: result.error });
  }
});

console.log('\n📊 Resumen:');
console.log(`   Total: ${stats.total} archivos`);
console.log(`   ✅ Reparados: ${stats.fixed}`);
console.log(`   ❌ Errores: ${stats.errors}`);

if (errors.length > 0 && errors.length <= 10) {
  console.log('\n❌ Archivos con errores:');
  errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

if (stats.fixed > 0) {
  console.log('\n✨ Archivos JSON reparados!');
  console.log('   Ejecutando limpieza de mojibake...');
  
  try {
    execSync('node scripts/fixI18nEncoding.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Error ejecutando fixI18nEncoding:', err.message);
  }
}

process.exit(stats.errors > 0 ? 1 : 0);
