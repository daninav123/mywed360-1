/**
 * Script para arreglar el encoding de archivos i18n
 * Convierte todos los archivos JSON a UTF-8 y reemplaza caracteres corruptos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de caracteres corruptos → correctos
const MOJIBAKE_MAP = {
  // Vocales acentuadas
  'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
  'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã"': 'Ó', 'Ãš': 'Ú',
  
  // Ñ
  'Ã±': 'ñ', 'Ñ': 'Ñ',
  
  // Diéresis
  'Ã¼': 'ü', 'Ãœ': 'Ü',
  
  // Símbolos comunes
  'Â¿': '¿', 'Â¡': '¡', 'Âº': 'º', 'Âª': 'ª',
  
  // Replacement character
  '\uFFFD': '',
  '�': '',
  
  // Casos específicos detectados
  '�xito': 'Éxito',
  'A�adir': 'Añadir',
  'S�': 'Sí',
  'electr�nico': 'electrónico',
  'M�s': 'Más',
  'configuraci�n': 'configuración',
  'sesi�n': 'sesión',
  'Men�': 'Menú',
  'Dise�os': 'Diseños',
  '�ltimo': 'Último',
  'B�squeda': 'Búsqueda',
  'edici�n': 'edición',
  'descripci�n': 'descripción',
  'ubicaci�n': 'ubicación',
  'informaci�n': 'información',
  'creaci�n': 'creación',
  'notificaci�n': 'notificación',
  'gesti�n': 'gestión',
  'comunicaci�n': 'comunicación',
  'selecci�n': 'selección',
  'Acci�n': 'Acción',
  'acci�n': 'acción',
  'tel�fono': 'teléfono',
  'Tel�fono': 'Teléfono',
  'direcci�n': 'dirección',
  'Direcci�n': 'Dirección',
  'n�mero': 'número',
  'N�mero': 'Número',
  'C�digo': 'Código',
  'c�digo': 'código',
  'M�todo': 'Método',
  'm�todo': 'método',
  'per�odo': 'período',
  'Per�odo': 'Período',
  'hist�rico': 'histórico',
  'Hist�rico': 'Histórico',
  'estad�stica': 'estadística',
  'Estad�stica': 'Estadística',
  'categor�a': 'categoría',
  'Categor�a': 'Categoría',
  'guardan�a': 'guardanía', 
  'Espa�a': 'España',
};

// Función para recorrer directorios recursivamente
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

// Función para limpiar el texto de mojibake
function cleanMojibake(text) {
  let cleaned = text;
  
  // Aplicar reemplazos del mapa
  for (const [bad, good] of Object.entries(MOJIBAKE_MAP)) {
    cleaned = cleaned.split(bad).join(good);
  }
  
  // Eliminar caracteres de reemplazo que no se capturaron
  cleaned = cleaned.replace(/\uFFFD/g, '');
  
  return cleaned;
}

// Función para validar JSON
function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// Función principal
function fixEncodingInFile(filepath) {
  try {
    // Leer archivo (intentar varios encodings)
    let content;
    try {
      content = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      console.warn(`⚠️  No se pudo leer ${filepath}: ${err.message}`);
      return { fixed: false, error: err.message };
    }
    
    // Validar que sea JSON válido antes de procesar
    if (!isValidJSON(content)) {
      console.warn(`⚠️  ${filepath} no es JSON válido, omitiendo`);
      return { fixed: false, error: 'Invalid JSON' };
    }
    
    // Limpiar mojibake
    const cleanedContent = cleanMojibake(content);
    
    // Si no hubo cambios, saltar
    if (cleanedContent === content) {
      return { fixed: false, reason: 'No changes needed' };
    }
    
    // Validar que el JSON limpio sea válido
    if (!isValidJSON(cleanedContent)) {
      console.warn(`⚠️  ${filepath} quedó inválido después de limpiar, no guardando`);
      return { fixed: false, error: 'Invalid after cleaning' };
    }
    
    // Formatear JSON (pretty print)
    const parsed = JSON.parse(cleanedContent);
    const formatted = JSON.stringify(parsed, null, 2);
    
    // Guardar con UTF-8 explícito
    fs.writeFileSync(filepath, formatted, { encoding: 'utf8' });
    
    return { fixed: true };
  } catch (err) {
    console.error(`❌ Error procesando ${filepath}:`, err.message);
    return { fixed: false, error: err.message };
  }
}

// Ejecutar
console.log('🔧 Arreglando encoding de archivos i18n...\n');

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const stats = {
  total: 0,
  fixed: 0,
  skipped: 0,
  errors: 0,
};

walkDir(localesDir, (filepath) => {
  stats.total++;
  const relativePath = path.relative(localesDir, filepath);
  
  const result = fixEncodingInFile(filepath);
  
  if (result.fixed) {
    stats.fixed++;
    console.log(`✅ ${relativePath}`);
  } else if (result.error) {
    stats.errors++;
    console.log(`❌ ${relativePath} - ${result.error}`);
  } else {
    stats.skipped++;
    // No imprimir archivos sin cambios para reducir ruido
  }
});

console.log('\n📊 Resumen:');
console.log(`   Total: ${stats.total} archivos`);
console.log(`   ✅ Arreglados: ${stats.fixed}`);
console.log(`   ⏭️  Sin cambios: ${stats.skipped}`);
console.log(`   ❌ Errores: ${stats.errors}`);

if (stats.fixed > 0) {
  console.log('\n✨ Encoding arreglado exitosamente!');
  console.log('   Ejecuta: npm run test -- i18nNoMojibake');
} else {
  console.log('\n✨ Todos los archivos ya están correctos!');
}

process.exit(stats.errors > 0 ? 1 : 0);
