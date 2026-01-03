/**
 * Script robusto para deduplicar claves i18n
 * Parsea JSON, elimina duplicados recursivamente, y reconstruye
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const isDryRun = process.argv.includes('--dry-run');

console.log('\n🔧 Deduplicación Robusta de Claves i18n\n');
console.log('==========================================\n');

if (isDryRun) {
  console.log('🔍 Modo DRY-RUN (no se modificarán archivos)\n');
}

const locales = ['es', 'en', 'fr'];
const stats = {
  total: 0,
  duplicates: 0,
  fixed: 0,
};

/**
 * Eliminar claves duplicadas de un objeto (recursivo)
 * JavaScript Objects no pueden tener claves duplicadas, así que el último valor gana
 * Pero queremos reportar cuántos había en el archivo original
 */
function deduplicateObject(obj, path = '') {
  const seen = new Set();
  let duplicateCount = 0;

  // JSON.parse ya elimina duplicados automáticamente,
  // solo necesitamos contar cuántos había

  return { clean: obj, duplicateCount };
}

/**
 * Contar líneas duplicadas en el archivo original
 */
function countDuplicates(content) {
  const lines = content.split('\n');
  const keys = new Map();
  let duplicates = 0;
  const duplicateList = [];

  lines.forEach((line, idx) => {
    // Buscar líneas que definen claves: "key": value
    const match = line.trim().match(/^"([^"]+)":\s*/);

    if (match) {
      const key = match[1];

      if (keys.has(key)) {
        duplicates++;
        duplicateList.push({
          key,
          line1: keys.get(key),
          line2: idx + 1,
        });
      } else {
        keys.set(key, idx + 1);
      }
    }
  });

  return { duplicates, duplicateList };
}

/**
 * Procesar un archivo
 */
function processFile(filePath) {
  console.log(`\n📄 Procesando: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Contar duplicados en el original
  const { duplicates, duplicateList } = countDuplicates(content);

  stats.total++;

  if (duplicates === 0) {
    console.log(`  ✅ Sin duplicados`);
    return null;
  }

  console.log(`  ⚠️  ${duplicates} duplicados encontrados`);

  // Mostrar primeros 5
  duplicateList.slice(0, 5).forEach((d) => {
    console.log(`     - "${d.key}" (líneas ${d.line1}, ${d.line2})`);
  });

  if (duplicates > 5) {
    console.log(`     ... y ${duplicates - 5} más`);
  }

  stats.duplicates += duplicates;

  // Parsear JSON (esto automáticamente elimina duplicados)
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error(`  ❌ ERROR: No se puede parsear JSON original`);
    console.error(`     ${err.message}`);
    return null;
  }

  // Serializar de vuelta con formato bonito
  const cleaned = JSON.stringify(parsed, null, 2);

  // Verificar que es válido
  try {
    JSON.parse(cleaned);
    console.log(`  ✅ JSON limpio es válido`);
  } catch (err) {
    console.error(`  ❌ ERROR: JSON limpio es inválido`);
    console.error(`     ${err.message}`);
    return null;
  }

  const originalSize = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);
  const cleanedSize = (Buffer.byteLength(cleaned, 'utf8') / 1024).toFixed(2);
  const saved = (originalSize - cleanedSize).toFixed(2);

  console.log(`  📊 Tamaño: ${originalSize} KB → ${cleanedSize} KB (${saved} KB ahorrados)`);

  stats.fixed++;

  return {
    cleaned,
    duplicates,
    backup: content,
  };
}

/**
 * Main
 */
async function main() {
  const results = {};

  for (const locale of locales) {
    const filePath = path.join(LOCALES_DIR, locale, 'common.json');

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  ${locale}/common.json no existe, saltando...`);
      continue;
    }

    const result = processFile(filePath);

    if (result) {
      results[locale] = { filePath, ...result };
    }
  }

  // Resumen
  console.log('\n==========================================');
  console.log('\n📊 Resumen:\n');
  console.log(`  Archivos procesados: ${stats.total}`);
  console.log(`  Archivos con duplicados: ${stats.fixed}`);
  console.log(`  Total duplicados eliminados: ${stats.duplicates}`);

  if (isDryRun) {
    console.log('\n🔍 DRY-RUN: Archivos NO modificados.\n');
    console.log('Para aplicar cambios, ejecuta:');
    console.log('  node scripts/deduplicateI18nKeysRobust.js\n');
    return;
  }

  if (Object.keys(results).length === 0) {
    console.log('\n✅ No hay nada que hacer.\n');
    return;
  }

  // Confirmar
  console.log('\n⚠️  ¿Aplicar cambios? Los archivos originales se respaldarán.\n');
  console.log('   Presiona Ctrl+C para cancelar...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Aplicar cambios
  console.log('💾 Guardando archivos...\n');

  Object.entries(results).forEach(([locale, data]) => {
    try {
      // Crear backup
      const backupPath = `${data.filePath}.backup-dedupe-${Date.now()}`;
      fs.writeFileSync(backupPath, data.backup, 'utf-8');
      console.log(`  📦 Backup: ${path.basename(backupPath)}`);

      // Guardar archivo limpio
      fs.writeFileSync(data.filePath, data.cleaned, 'utf-8');
      console.log(
        `  ✅ ${locale}/common.json actualizado (${data.duplicates} duplicados eliminados)`
      );
    } catch (err) {
      console.error(`  ❌ Error guardando ${locale}:`, err.message);
    }
  });

  // Verificación final
  console.log('\n🔍 Verificando integridad...\n');

  let allValid = true;
  Object.entries(results).forEach(([locale, data]) => {
    try {
      const content = fs.readFileSync(data.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const keyCount = JSON.stringify(parsed).split('"').length;
      console.log(
        `  ✅ ${locale}/common.json es JSON válido (~${Math.floor(keyCount / 4)} claves)`
      );
    } catch (err) {
      console.error(`  ❌ ${locale}/common.json tiene errores:`, err.message);
      allValid = false;
    }
  });

  console.log('\n==========================================');

  if (allValid) {
    console.log('\n✅ Deduplicación completada exitosamente!\n');
    console.log('📝 Próximos pasos:\n');
    console.log('   1. Verificar: npm run validate:i18n');
    console.log('   2. Probar app en navegador (cambiar idioma)');
    console.log('   3. Si todo funciona, eliminar archivos *.backup-dedupe-*');
    console.log(
      '   4. Commit: git commit -am "fix: deduplicate i18n keys (removed ' +
        stats.duplicates +
        ' duplicates)"\n'
    );
  } else {
    console.error('\n❌ Algunos archivos tienen errores. Revisa los backups.\n');
  }

  console.log('==========================================\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
