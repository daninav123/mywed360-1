const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'apps', 'main-app', 'src', 'i18n', 'locales');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const ES_DIR = path.join(LOCALES_DIR, 'es');

function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function compareFiles(enFile, esFile, namespace) {
  const enData = loadJSON(enFile);
  const esData = loadJSON(esFile);

  if (!enData || !esData) {
    return null;
  }

  const enKeys = new Set(getAllKeys(enData));
  const esKeys = new Set(getAllKeys(esData));

  const missingInEs = [...enKeys].filter(k => !esKeys.has(k));
  const missingInEn = [...esKeys].filter(k => !esKeys.has(k));

  return {
    namespace,
    totalEnKeys: enKeys.size,
    totalEsKeys: esKeys.size,
    missingInEs,
    missingInEn,
    hasIssues: missingInEs.length > 0 || missingInEn.length > 0
  };
}

function main() {
  console.log('🔍 Analizando archivos de traducción...\n');

  if (!fs.existsSync(EN_DIR) || !fs.existsSync(ES_DIR)) {
    console.error('❌ No se encontraron los directorios de locales');
    process.exit(1);
  }

  const enFiles = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json') && !f.includes('.bak'));
  const esFiles = fs.readdirSync(ES_DIR).filter(f => f.endsWith('.json') && !f.includes('.bak'));

  console.log(`📁 Archivos encontrados:`);
  console.log(`   EN: ${enFiles.length} archivos`);
  console.log(`   ES: ${esFiles.length} archivos\n`);

  const results = [];
  const allEnFiles = new Set(enFiles);
  const allEsFiles = new Set(esFiles);

  // Archivos solo en EN
  const onlyInEn = [...allEnFiles].filter(f => !allEsFiles.has(f));
  if (onlyInEn.length > 0) {
    console.log('⚠️  Archivos solo en EN (sin traducción ES):');
    onlyInEn.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  // Archivos solo en ES
  const onlyInEs = [...allEsFiles].filter(f => !allEnFiles.has(f));
  if (onlyInEs.length > 0) {
    console.log('⚠️  Archivos solo en ES (sin original EN):');
    onlyInEs.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  // Comparar archivos que existen en ambos idiomas
  const commonFiles = [...allEnFiles].filter(f => allEsFiles.has(f));
  
  for (const file of commonFiles) {
    const namespace = file.replace('.json', '');
    const enFile = path.join(EN_DIR, file);
    const esFile = path.join(ES_DIR, file);
    
    const result = compareFiles(enFile, esFile, namespace);
    if (result) {
      results.push(result);
    }
  }

  // Mostrar resultados
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESULTADOS DEL ANÁLISIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const problemFiles = results.filter(r => r.hasIssues);
  const cleanFiles = results.filter(r => !r.hasIssues);

  if (cleanFiles.length > 0) {
    console.log(`✅ Archivos sin problemas (${cleanFiles.length}):`);
    cleanFiles.forEach(r => {
      console.log(`   • ${r.namespace}.json - ${r.totalEnKeys} claves`);
    });
    console.log('');
  }

  if (problemFiles.length > 0) {
    console.log(`❌ Archivos con problemas (${problemFiles.length}):\n`);
    
    problemFiles.forEach(r => {
      console.log(`\n📄 ${r.namespace}.json`);
      console.log(`   EN: ${r.totalEnKeys} claves | ES: ${r.totalEsKeys} claves`);
      
      if (r.missingInEs.length > 0) {
        console.log(`\n   ⚠️  Faltan ${r.missingInEs.length} claves en ES:`);
        r.missingInEs.slice(0, 10).forEach(k => console.log(`      - ${k}`));
        if (r.missingInEs.length > 10) {
          console.log(`      ... y ${r.missingInEs.length - 10} más`);
        }
      }
      
      if (r.missingInEn.length > 0) {
        console.log(`\n   ℹ️  Claves extras en ES (${r.missingInEn.length}):`);
        r.missingInEn.slice(0, 5).forEach(k => console.log(`      - ${k}`));
        if (r.missingInEn.length > 5) {
          console.log(`      ... y ${r.missingInEn.length - 5} más`);
        }
      }
      console.log('');
    });
  }

  // Resumen final
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 RESUMEN GENERAL');
  console.log('═══════════════════════════════════════════════════════════');
  
  const totalMissingInEs = problemFiles.reduce((sum, r) => sum + r.missingInEs.length, 0);
  const totalMissingInEn = problemFiles.reduce((sum, r) => sum + r.missingInEn.length, 0);
  
  console.log(`Archivos analizados: ${results.length}`);
  console.log(`Archivos correctos: ${cleanFiles.length}`);
  console.log(`Archivos con problemas: ${problemFiles.length}`);
  console.log(`Total claves faltantes en ES: ${totalMissingInEs}`);
  console.log(`Total claves extras en ES: ${totalMissingInEn}`);
  
  if (problemFiles.length === 0 && onlyInEn.length === 0) {
    console.log('\n✨ ¡Todas las traducciones están completas!');
  } else {
    console.log('\n⚠️  Se requiere trabajo adicional para completar las traducciones.');
  }

  // Guardar reporte detallado
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      cleanFiles: cleanFiles.length,
      problemFiles: problemFiles.length,
      totalMissingInEs,
      totalMissingInEn,
      filesOnlyInEn: onlyInEn,
      filesOnlyInEs: onlyInEs
    },
    details: problemFiles.map(r => ({
      namespace: r.namespace,
      enKeys: r.totalEnKeys,
      esKeys: r.totalEsKeys,
      missingInEs: r.missingInEs,
      missingInEn: r.missingInEn
    }))
  };

  const reportPath = path.join(__dirname, '..', 'i18n-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);

  process.exit(problemFiles.length > 0 ? 1 : 0);
}

main();
