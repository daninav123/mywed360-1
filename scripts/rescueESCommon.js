/**
 * Rescate agresivo de es/common.json
 * Estrategia: Copiar estructura de EN y sobrescribir con traducciones válidas de ES
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');

const EN_PATH = path.join(LOCALES_DIR, 'en', 'common.json');
const ES_PATH = path.join(LOCALES_DIR, 'es', 'common.json');
const ES_CORRUPTED = path.join(LOCALES_DIR, 'es', 'common.json.cleaned-debug');

console.log('\n🔧 Rescate de es/common.json\n');
console.log('===========================================\n');

// Leer EN (estructura base)
console.log('📖 Leyendo estructura base (EN)...');
const enContent = fs.readFileSync(EN_PATH, 'utf-8');
const enData = JSON.parse(enContent);
console.log('  ✅ EN parseado correctamente');

// Intentar leer ES corrupto y extraer lo que se pueda
console.log('\n📖 Analizando ES corrupto...');
const esCorruptedContent = fs.existsSync(ES_CORRUPTED)
  ? fs.readFileSync(ES_CORRUPTED, 'utf-8')
  : fs.readFileSync(ES_PATH, 'utf-8');

// Extraer claves válidas del ES corrupto
const validESKeys = {};
let extractedCount = 0;
let skippedCount = 0;

const lines = esCorruptedContent.split('\n');

lines.forEach((line, idx) => {
  // Buscar líneas que parecen claves válidas: "key": "value"
  // Evitar líneas con código JS
  const match = line.match(/^\s*"([^"]+)":\s*"([^"]*)"[,]?$/);

  if (match && line.length < 300) {
    // Solo líneas cortas y simples
    const key = match[1];
    const value = match[2];

    // Validar que no sea código JS
    if (
      !value.includes('function') &&
      !value.includes('=>') &&
      !value.includes('const ') &&
      !value.includes('return ') &&
      value.length < 200
    ) {
      validESKeys[key] = value;
      extractedCount++;
    } else {
      skippedCount++;
    }
  }
});

console.log(`  ✅ Extraídas: ${extractedCount} claves válidas`);
console.log(`  ⚠️  Omitidas: ${skippedCount} claves corruptas`);

// Función para aplicar traducciones españolas sobre estructura EN
function applySpanishTranslations(obj, path = '') {
  const result = {};

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursivo para objetos anidados
      result[key] = applySpanishTranslations(value, currentPath);
    } else if (typeof value === 'string') {
      // Si existe traducción en ES válida, usarla; sino, mantener EN
      result[key] = validESKeys[key] || value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

console.log('\n🔄 Reconstruyendo es/common.json...');

// Crear nueva estructura con traducciones válidas
const newESData = applySpanishTranslations(enData);

// Añadir traducciones comunes que sabemos que existen
const commonSpanishTranslations = {
  // app
  name: 'MaLove.App',
  brandName: 'Lovenda',
  tagline: 'Tu boda perfecta, organizada digitalmente',
  loading: 'Cargando...',
  error: 'Error',
  success: 'Éxito',
  cancel: 'Cancelar',
  save: 'Guardar',
  delete: 'Eliminar',
  edit: 'Editar',
  add: 'Añadir',
  search: 'Buscar',
  filter: 'Filtrar',
  close: 'Cerrar',
  confirm: 'Confirmar',
  back: 'Volver',
  next: 'Siguiente',
  previous: 'Anterior',
  yes: 'Sí',
  no: 'No',
  ok: 'OK',
  apply: 'Aplicar',
  reset: 'Restablecer',
  clear: 'Limpiar',
  select: 'Seleccionar',
  selectAll: 'Seleccionar todo',
  deselectAll: 'Deseleccionar todo',
  download: 'Descargar',
  upload: 'Subir',
  export: 'Exportar',
  import: 'Importar',
  print: 'Imprimir',
  share: 'Compartir',
  copy: 'Copiar',
  paste: 'Pegar',
  cut: 'Cortar',
  undo: 'Deshacer',
  redo: 'Rehacer',
  refresh: 'Actualizar',
};

// Aplicar traducciones comunes si existen en la estructura
if (newESData.app) {
  Object.keys(commonSpanishTranslations).forEach((key) => {
    if (newESData.app[key] !== undefined) {
      newESData.app[key] = commonSpanishTranslations[key];
    }
  });
}

// Validar que el nuevo JSON es válido
try {
  const newJSON = JSON.stringify(newESData, null, 2);
  JSON.parse(newJSON); // Validar
  console.log('  ✅ JSON reconstruido es válido');

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

  const totalKeys = countKeys(newESData);
  console.log(`  📊 Total de claves: ${totalKeys}`);

  // Crear backup del corrupto
  const backupPath = `${ES_PATH}.corrupted-backup-${Date.now()}`;
  const originalContent = fs.readFileSync(ES_PATH, 'utf-8');
  fs.writeFileSync(backupPath, originalContent, 'utf-8');
  console.log(`\n📦 Backup del corrupto: ${path.basename(backupPath)}`);

  // Guardar nuevo archivo
  fs.writeFileSync(ES_PATH, newJSON, 'utf-8');
  console.log('✅ es/common.json rescatado y guardado');

  const originalSize = (Buffer.byteLength(originalContent, 'utf8') / 1024).toFixed(2);
  const newSize = (Buffer.byteLength(newJSON, 'utf8') / 1024).toFixed(2);

  console.log(`📊 Tamaño: ${originalSize} KB → ${newSize} KB`);

  // Verificar
  console.log('\n🔍 Verificando...');
  const savedContent = fs.readFileSync(ES_PATH, 'utf-8');
  JSON.parse(savedContent);
  console.log('  ✅ Archivo guardado es JSON válido');

  console.log('\n===========================================');
  console.log('\n✅ Rescate completado!\n');
  console.log('📝 Próximos pasos:\n');
  console.log('   1. Verificar: npm run validate:i18n');
  console.log('   2. Deduplicar: node scripts/deduplicateENandFR.js (agregar ES)');
  console.log('   3. Probar en navegador en español');
  console.log('   4. Revisar traducciones que quedaron en inglés');
  console.log('   5. Corregir manualmente las que sean críticas\n');

  console.log('⚠️  NOTA: Algunas traducciones pueden estar en inglés');
  console.log('   porque el archivo original estaba muy corrupto.\n');
  console.log('===========================================\n');
} catch (err) {
  console.error('\n❌ ERROR: No se pudo crear JSON válido');
  console.error(err.message);
  process.exit(1);
}
