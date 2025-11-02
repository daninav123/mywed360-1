/**
 * Script para deduplicar claves en archivos i18n
 * Mantiene la ÚLTIMA aparición de cada clave (más actualizada)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const isDryRun = process.argv.includes('--dry-run');

console.log('\n🔧 Deduplicación de Claves i18n\n');
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
 * Parsear JSON preservando orden y encontrando duplicados
 */
function parseAndFindDuplicates(content) {
  const lines = content.split('\n');
  const keys = {};
  const duplicates = [];
  const result = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Detectar clave: "key": value
    const match = line.match(/^(\s*)"([^"]+)":\s*(.*)$/);

    if (match) {
      const indent = match[1];
      const key = match[2];
      const value = match[3];

      // Si ya existe la clave
      if (keys[key] !== undefined) {
        duplicates.push({
          key,
          line1: keys[key],
          line2: lineNum,
        });

        // NO agregar esta línea duplicada (mantenemos la ÚLTIMA aparición)
        // Actualizar la referencia a la nueva línea
        keys[key] = lineNum;
      } else {
        keys[key] = lineNum;
        result.push(line);
      }
    } else {
      // Línea no es clave (bracket, comentario, etc.)
      result.push(line);
    }
  });

  return {
    cleaned: result.join('\n'),
    duplicates,
    originalLines: lines.length,
    cleanedLines: result.length,
  };
}

/**
 * Método más robusto: reconstruir JSON sin duplicados
 */
function deduplicateJSON(filePath) {
  console.log(`\n📄 Procesando: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const { cleaned, duplicates, originalLines, cleanedLines } = parseAndFindDuplicates(content);

  stats.total++;

  if (duplicates.length === 0) {
    console.log(`  ✅ Sin duplicados`);
    return null;
  }

  console.log(`  ⚠️  ${duplicates.length} duplicados encontrados`);
  console.log(
    `  📊 Líneas: ${originalLines} → ${cleanedLines} (${originalLines - cleanedLines} eliminadas)`
  );

  // Mostrar primeros 5 duplicados
  duplicates.slice(0, 5).forEach((d) => {
    console.log(`     - "${d.key}" (líneas ${d.line1}, ${d.line2})`);
  });

  if (duplicates.length > 5) {
    console.log(`     ... y ${duplicates.length - 5} más`);
  }

  stats.duplicates += duplicates.length;

  // Validar que sigue siendo JSON válido
  try {
    JSON.parse(cleaned);
    console.log(`  ✅ JSON válido después de limpieza`);
  } catch (err) {
    console.error(`  ❌ ERROR: JSON inválido después de limpieza`);
    console.error(`     ${err.message}`);
    return null;
  }

  return {
    cleaned,
    duplicates,
    backup: content,
  };
}

/**
 * Procesar todos los locales
 */
async function main() {
  const results = {};

  for (const locale of locales) {
    const filePath = path.join(LOCALES_DIR, locale, 'common.json');

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  ${locale}/common.json no existe, saltando...`);
      continue;
    }

    const result = deduplicateJSON(filePath);

    if (result) {
      results[locale] = { filePath, ...result };
      stats.fixed++;
    }
  }

  // Resumen
  console.log('\n==========================================');
  console.log('\n📊 Resumen:\n');
  console.log(`  Archivos procesados: ${stats.total}`);
  console.log(`  Archivos con duplicados: ${stats.fixed}`);
  console.log(`  Total duplicados encontrados: ${stats.duplicates}`);
  console.log(`  Total duplicados eliminados: ${stats.duplicates}`);

  if (isDryRun) {
    console.log('\n🔍 DRY-RUN: Archivos NO modificados.\n');
    console.log('Para aplicar cambios, ejecuta:');
    console.log('  node scripts/deduplicateI18nKeys.js\n');
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
      const backupPath = `${data.filePath}.backup-${Date.now()}`;
      fs.writeFileSync(backupPath, data.backup, 'utf-8');
      console.log(`  📦 Backup: ${path.basename(backupPath)}`);

      // Guardar archivo limpio
      fs.writeFileSync(data.filePath, data.cleaned, 'utf-8');
      console.log(
        `  ✅ ${locale}/common.json actualizado (${data.duplicates.length} duplicados eliminados)`
      );
    } catch (err) {
      console.error(`  ❌ Error guardando ${locale}:`, err.message);
    }
  });

  // Verificación final
  console.log('\n🔍 Verificando integridad...\n');

  Object.entries(results).forEach(([locale, data]) => {
    try {
      const content = fs.readFileSync(data.filePath, 'utf-8');
      JSON.parse(content);
      console.log(`  ✅ ${locale}/common.json es JSON válido`);
    } catch (err) {
      console.error(`  ❌ ${locale}/common.json tiene errores:`, err.message);
    }
  });

  console.log('\n✅ Deduplicación completada!\n');
  console.log('📝 Próximos pasos:\n');
  console.log('   1. Verificar: npm run validate:i18n');
  console.log('   2. Probar app en navegador');
  console.log('   3. Si todo funciona, eliminar backups');
  console.log('   4. Commit: git commit -am "fix: deduplicate i18n keys"\n');

  console.log('==========================================\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
