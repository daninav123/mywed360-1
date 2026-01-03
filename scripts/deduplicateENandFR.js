/**
 * Script para deduplicar ES, EN y FR
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const isDryRun = process.argv.includes('--dry-run');

console.log('\n🔧 Deduplicación de ES, EN y FR\n');
console.log('=========================================================\n');

if (isDryRun) {
  console.log('🔍 Modo DRY-RUN (no se modificarán archivos)\n');
}

const locales = ['es', 'en', 'fr']; // Los tres principales
const stats = {
  total: 0,
  duplicates: 0,
  fixed: 0,
};

/**
 * Contar duplicados
 */
function countDuplicates(content) {
  const lines = content.split('\n');
  const keys = new Map();
  let duplicates = 0;
  const duplicateList = [];

  lines.forEach((line, idx) => {
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
 * Procesar archivo
 */
function processFile(filePath, locale) {
  console.log(`\n📄 Procesando: ${locale}/common.json`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const { duplicates, duplicateList } = countDuplicates(content);

  stats.total++;

  if (duplicates === 0) {
    console.log(`  ✅ Sin duplicados`);
    return null;
  }

  console.log(`  ⚠️  ${duplicates} duplicados encontrados`);

  duplicateList.slice(0, 5).forEach((d) => {
    console.log(`     - "${d.key}" (líneas ${d.line1}, ${d.line2})`);
  });

  if (duplicates > 5) {
    console.log(`     ... y ${duplicates - 5} más`);
  }

  stats.duplicates += duplicates;

  // Parsear y reconstruir
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error(`  ❌ ERROR: JSON inválido`);
    console.error(`     ${err.message}`);
    return null;
  }

  const cleaned = JSON.stringify(parsed, null, 2);

  try {
    JSON.parse(cleaned);
    console.log(`  ✅ JSON limpio es válido`);
  } catch (err) {
    console.error(`  ❌ ERROR: JSON limpio inválido`);
    return null;
  }

  const originalSize = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);
  const cleanedSize = (Buffer.byteLength(cleaned, 'utf8') / 1024).toFixed(2);

  console.log(`  📊 Tamaño: ${originalSize} KB → ${cleanedSize} KB`);

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
      console.log(`\n⚠️  ${locale}/common.json no existe`);
      continue;
    }

    const result = processFile(filePath, locale);

    if (result) {
      results[locale] = { filePath, ...result };
    }
  }

  console.log('\n=========================================================');
  console.log('\n📊 Resumen:\n');
  console.log(`  Archivos procesados: ${stats.total}`);
  console.log(`  Archivos con duplicados: ${stats.fixed}`);
  console.log(`  Total duplicados eliminados: ${stats.duplicates}`);

  if (isDryRun) {
    console.log('\n🔍 DRY-RUN: Archivos NO modificados.\n');
    console.log('Para aplicar, ejecuta:');
    console.log('  node scripts/deduplicateENandFR.js\n');
    return;
  }

  if (Object.keys(results).length === 0) {
    console.log('\n✅ Nada que hacer.\n');
    return;
  }

  console.log('\n⚠️  ¿Aplicar cambios? Backups serán creados.\n');
  console.log('   Presiona Ctrl+C para cancelar...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('💾 Guardando...\n');

  Object.entries(results).forEach(([locale, data]) => {
    try {
      const backupPath = `${data.filePath}.backup-${Date.now()}`;
      fs.writeFileSync(backupPath, data.backup, 'utf-8');
      console.log(`  📦 ${locale}: backup creado`);

      fs.writeFileSync(data.filePath, data.cleaned, 'utf-8');
      console.log(`  ✅ ${locale}: ${data.duplicates} duplicados eliminados`);
    } catch (err) {
      console.error(`  ❌ ${locale}: ${err.message}`);
    }
  });

  console.log('\n🔍 Verificando...\n');

  let allValid = true;
  Object.entries(results).forEach(([locale, data]) => {
    try {
      const content = fs.readFileSync(data.filePath, 'utf-8');
      JSON.parse(content);
      console.log(`  ✅ ${locale}/common.json válido`);
    } catch (err) {
      console.error(`  ❌ ${locale}/common.json: ${err.message}`);
      allValid = false;
    }
  });

  console.log('\n=========================================================\n');

  if (allValid) {
    console.log('✅ Deduplicación EN y FR completada!\n');
    console.log('📝 Próximos pasos:\n');
    console.log('   1. Verificar: npm run validate:i18n');
    console.log('   2. Probar en navegador: cambiar a inglés/francés');
    console.log('   3. Commit: git commit -am "fix: deduplicate EN and FR i18n keys"');
    console.log('\n⚠️  ES (español) requiere reparación manual separada\n');
  } else {
    console.error('❌ Errores detectados. Revisa backups.\n');
  }

  console.log('=========================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
