const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'apps', 'main-app', 'src', 'pages');
const COMPONENTS_DIR = path.join(__dirname, '..', 'apps', 'main-app', 'src', 'components');

// Patrones sospechosos de texto hardcodeado
const SUSPICIOUS_PATTERNS = [
  // Textos entre comillas con palabras en inglés/español
  /["'`]([A-Z][a-z]{3,}[\s\w]{10,})["'`]/g,
  // Títulos y etiquetas comunes
  /(?:title|label|placeholder|text|description)=["']([^"']+)["']/gi,
  // JSX con texto directo
  /<(?:h[1-6]|p|span|div|button|label)[^>]*>([A-Z][^<]{10,})<\//gi,
];

const IGNORE_PATTERNS = [
  /import\s/,
  /export\s/,
  /console\./,
  /localStorage\./,
  /className=/,
  /\/\//,  // comentarios
  /\/\*/,  // comentarios multilínea
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function shouldIgnoreLine(line) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(line));
}

function detectHardcodedText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  // Verificar si el archivo usa useTranslation
  const usesI18n = /useTranslation|useT|import.*i18n/.test(content);

  lines.forEach((line, index) => {
    if (shouldIgnoreLine(line)) return;

    // Buscar patrones sospechosos
    SUSPICIOUS_PATTERNS.forEach(pattern => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(match => {
        const text = match[1];
        // Filtrar textos muy cortos o que parecen variables
        if (text && text.length > 15 && !/^[a-z_$][\w$]*$/.test(text)) {
          // Verificar si el texto está en inglés o español
          const hasEnglish = /\b(the|and|or|in|on|at|to|for|of|with|is|are|was|were|have|has|had|will|would|can|could|should|may|might)\b/i.test(text);
          const hasSpanish = /\b(el|la|los|las|un|una|de|del|en|con|por|para|es|son|fue|fueron|tiene|tienen|será|puede|pueden|debe|deben)\b/i.test(text);
          
          if (hasEnglish || hasSpanish) {
            findings.push({
              line: index + 1,
              text: text.trim(),
              snippet: line.trim().substring(0, 100)
            });
          }
        }
      });
    });
  });

  return { filePath, usesI18n, findings };
}

function analyzeFiles(directories) {
  const allResults = [];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directorio no encontrado: ${dir}\n`);
      return;
    }

    const files = getAllFiles(dir);
    console.log(`\n📁 Analizando ${files.length} archivos en ${path.basename(dir)}...`);

    files.forEach(file => {
      const result = detectHardcodedText(file);
      if (result.findings.length > 0) {
        allResults.push(result);
      }
    });
  });

  return allResults;
}

function main() {
  console.log('🔍 DETECCIÓN DE TEXTOS HARDCODEADOS\n');
  console.log('═══════════════════════════════════════════════════════════');

  const results = analyzeFiles([PAGES_DIR, COMPONENTS_DIR]);

  if (results.length === 0) {
    console.log('\n✅ No se detectaron textos hardcodeados sospechosos.');
    return;
  }

  console.log(`\n⚠️  Se encontraron ${results.length} archivos con posibles textos hardcodeados:\n`);

  // Ordenar por cantidad de findings
  results.sort((a, b) => b.findings.length - a.findings.length);

  const topFiles = results.slice(0, 20);

  topFiles.forEach(result => {
    const relativePath = result.filePath.replace(path.join(__dirname, '..'), '');
    const i18nStatus = result.usesI18n ? '✓ usa i18n' : '✗ NO usa i18n';
    
    console.log(`\n📄 ${relativePath}`);
    console.log(`   ${i18nStatus} | ${result.findings.length} textos encontrados`);
    
    // Mostrar primeros 3 ejemplos
    result.findings.slice(0, 3).forEach(finding => {
      console.log(`   Línea ${finding.line}: "${finding.text.substring(0, 60)}${finding.text.length > 60 ? '...' : ''}"`);
    });
    
    if (result.findings.length > 3) {
      console.log(`   ... y ${result.findings.length - 3} más`);
    }
  });

  if (results.length > 20) {
    console.log(`\n... y ${results.length - 20} archivos más`);
  }

  // Generar reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      filesWithoutI18n: results.filter(r => !r.usesI18n).length,
      filesWithI18n: results.filter(r => r.usesI18n).length,
      totalFindings: results.reduce((sum, r) => sum + r.findings.length, 0)
    },
    files: results.map(r => ({
      path: r.filePath.replace(path.join(__dirname, '..'), ''),
      usesI18n: r.usesI18n,
      findingsCount: r.findings.length,
      findings: r.findings
    }))
  };

  const reportPath = path.join(__dirname, '..', 'hardcoded-text-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Archivos analizados con textos: ${results.length}`);
  console.log(`Archivos SIN i18n: ${report.summary.filesWithoutI18n}`);
  console.log(`Archivos CON i18n: ${report.summary.filesWithI18n}`);
  console.log(`Total de textos detectados: ${report.summary.totalFindings}`);
  console.log(`\n💾 Reporte guardado en: ${reportPath}`);
}

main();
