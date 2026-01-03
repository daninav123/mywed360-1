#!/usr/bin/env node
/**
 * Ejecuta ESLint mediante su API y muestra un resumen rápido
 */
const { ESLint } = require("eslint");
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const eslint = new ESLint({
      cwd: process.cwd(),
      extensions: [".js", ".jsx"],
      cache: false,
    });

    const results = await eslint.lintFiles(["src/**/*.{js,jsx}"]);

    let totalErrors = 0;
    let totalWarnings = 0;
    const fileStats = [];

    for (const res of results) {
      totalErrors += res.errorCount;
      totalWarnings += res.warningCount;
      if (res.errorCount > 0) {
        fileStats.push({ file: res.filePath.replace(process.cwd()+"/", ""), errors: res.errorCount });
      }
    }

    fileStats.sort((a, b) => b.errors - a.errors);

    const summaryLines = [];
    summaryLines.push(`Resumen ESLint -> ${totalErrors} errores, ${totalWarnings} warnings`);
    summaryLines.push("Top archivos con más errores:");
    fileStats.slice(0, 15).forEach(({ file, errors }) => {
      summaryLines.push(`${errors.toString().padStart(3, " ")} × ${file}`);
    });

    const outPath = path.resolve(process.cwd(), 'eslint_summary.txt');
    fs.writeFileSync(outPath, summaryLines.join('\n'), 'utf8');
    console.log(`Resumen escrito en ${outPath}`);
  } catch (err) {
    console.error("❌ Error al ejecutar ESLint:", err.message);
    process.exit(1);
  }
})();
