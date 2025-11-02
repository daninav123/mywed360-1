/**
 * Script para reparar es/common.json corrupto
 * Elimina claves con código JavaScript y reconstruye el JSON
 */
const fs = require('fs');
const path = require('path');

const ES_COMMON = path.resolve(__dirname, '..', 'src', 'i18n', 'locales', 'es', 'common.json');

console.log('\n🔧 Reparando es/common.json corrupto...\n');

// Leer archivo
const content = fs.readFileSync(ES_COMMON, 'utf-8');
const lines = content.split('\n');

console.log(`📊 Total líneas: ${lines.length}`);

// Filtrar líneas problemáticas
const cleaned = [];
let skipNext = false;
let inObject = 0;
let removedCount = 0;

lines.forEach((line, idx) => {
  // Detectar si la línea tiene código JavaScript (muy largas o con keywords JS)
  const hasJSCode = line.length > 500 || /function\s*\(|=>\s*{|const\s+\w+\s*=|\/\*\*/.test(line);

  if (hasJSCode) {
    console.log(`  🗑️  Línea ${idx + 1}: Código JS detectado (${line.length} chars)`);
    removedCount++;
    return; // Skip esta línea
  }

  cleaned.push(line);
});

console.log(`\n✂️  Eliminadas: ${removedCount} líneas con código JS`);
console.log(`✅ Conservadas: ${cleaned.length} líneas`);

// Intentar parsear
const cleanedContent = cleaned.join('\n');

try {
  const parsed = JSON.parse(cleanedContent);
  console.log('\n✅ JSON válido después de limpieza');

  // Contar claves
  const countKeys = (obj) => {
    let count = 0;
    for (const key in obj) {
      count++;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        count += countKeys(obj[key]);
      }
    }
    return count;
  };

  const totalKeys = countKeys(parsed);
  console.log(`📊 Total de claves: ~${totalKeys}`);

  // Crear backup
  const backupPath = `${ES_COMMON}.corrupted-backup-${Date.now()}`;
  fs.writeFileSync(backupPath, content, 'utf-8');
  console.log(`\n📦 Backup creado: ${path.basename(backupPath)}`);

  // Guardar limpio
  const beautified = JSON.stringify(parsed, null, 2);
  fs.writeFileSync(ES_COMMON, beautified, 'utf-8');
  console.log(`✅ es/common.json reparado y guardado`);

  const originalSize = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);
  const cleanSize = (Buffer.byteLength(beautified, 'utf8') / 1024).toFixed(2);

  console.log(`📊 Tamaño: ${originalSize} KB → ${cleanSize} KB`);
  console.log('\n✅ Reparación completada!\n');
} catch (err) {
  console.error('\n❌ ERROR: No se pudo parsear después de limpieza');
  console.error(err.message);

  // Guardar versión limpia para inspección manual
  const debugPath = ES_COMMON + '.cleaned-debug';
  fs.writeFileSync(debugPath, cleanedContent, 'utf-8');
  console.log(`\n📝 Archivo limpio guardado para debug: ${debugPath}`);
  console.log('   Revisa manualmente y corrige los errores restantes.');

  process.exit(1);
}
