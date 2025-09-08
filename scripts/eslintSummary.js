#!/usr/bin/env node
/**
 * Lee eslint_report.json y muestra un resumen rápido en consola
 * Uso: node scripts/eslintSummary.js
 */
const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(__dirname, '..', 'eslint_report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ No se encontró eslint_report.json, ejecuta ESLint con --format json --output-file eslint_report.json');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error('❌ Error al parsear eslint_report.json:', err.message);
  process.exit(1);
}

let totalErrors = 0;
let totalWarnings = 0;
const fileStats = [];

for (const file of data) {
  totalErrors += file.errorCount;
  totalWarnings += file.warningCount;
  if (file.errorCount > 0) {
    fileStats.push({ file: path.relative(process.cwd(), file.filePath), errors: file.errorCount });
  }
}

fileStats.sort((a, b) => b.errors - a.errors);

console.log(`\nResumen ESLint -> ${totalErrors} errores, ${totalWarnings} warnings`);
console.log('Top archivos con más errores:');
fileStats.slice(0, 15).forEach(({ file, errors }) => {
  console.log(`${errors.toString().padStart(3, ' ')} × ${file}`);
});
