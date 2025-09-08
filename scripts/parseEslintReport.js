#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'eslint_report.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ No se encontró eslint_report.json. Ejecuta primero ESLint con formato JSON.');
  process.exit(1);
}

const raw = fs.readFileSync(reportPath, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('❌ No se pudo parsear eslint_report.json:', err.message);
  process.exit(1);
}

let totalErrors = 0;
let totalWarnings = 0;
const fileStats = [];

data.forEach((res) => {
  totalErrors += res.errorCount;
  totalWarnings += res.warningCount;
  if (res.errorCount > 0) {
    fileStats.push({
      file: res.filePath.replace(process.cwd() + path.sep, '').replace(process.cwd() + '/', ''),
      errors: res.errorCount,
    });
  }
});

fileStats.sort((a, b) => b.errors - a.errors);

const summaryLines = [];
summaryLines.push(`Resumen ESLint -> ${totalErrors} errores, ${totalWarnings} warnings`);
summaryLines.push('Top archivos con más errores:');
fileStats.slice(0, 15).forEach(({ file, errors }) => {
  summaryLines.push(`${errors.toString().padStart(3, ' ')} × ${file}`);
});

const outPath = path.resolve(process.cwd(), 'eslint_summary.txt');
fs.writeFileSync(outPath, summaryLines.join('\n'), 'utf8');
console.log(`✅ Resumen escrito en ${outPath}`);
