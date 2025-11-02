/**
 * Script de Auditoría Completa del Proyecto
 * Detecta: duplicados, errores, inconsistencias, código muerto
 */

const fs = require('fs');
const path = require('path');

// Configuración
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LOCALES_DIR = path.join(SRC, 'i18n', 'locales');

const report = {
  timestamp: new Date().toISOString(),
  duplicates: {
    i18nKeys: {},
    bakFiles: [],
    testFiles: [],
  },
  issues: {
    console_logs: [],
    todos: [],
    unused_imports: [],
    large_files: [],
  },
  stats: {
    totalFiles: 0,
    totalLines: 0,
    codeQuality: {},
  },
};

// 1. Buscar claves i18n duplicadas
function findDuplicateI18nKeys() {
  console.log('\n🔍 Buscando claves i18n duplicadas...');

  const locales = ['es', 'en', 'fr'];

  locales.forEach((locale) => {
    const commonPath = path.join(LOCALES_DIR, locale, 'common.json');

    if (!fs.existsSync(commonPath)) {
      console.log(`  ⚠️  ${locale}/common.json no existe`);
      return;
    }

    try {
      const content = fs.readFileSync(commonPath, 'utf-8');
      const keys = {};
      const duplicates = [];

      // Buscar claves duplicadas con regex
      const keyPattern = /"([^"]+)":\s*/g;
      let match;
      let lineNum = 1;

      content.split('\n').forEach((line, idx) => {
        const keyMatch = line.match(/"([^"]+)":\s*/);
        if (keyMatch) {
          const key = keyMatch[1];
          if (keys[key]) {
            duplicates.push({
              key,
              line1: keys[key],
              line2: idx + 1,
            });
          } else {
            keys[key] = idx + 1;
          }
        }
      });

      if (duplicates.length > 0) {
        report.duplicates.i18nKeys[locale] = duplicates;
        console.log(`  ❌ ${locale}: ${duplicates.length} claves duplicadas`);
      } else {
        console.log(`  ✅ ${locale}: Sin duplicados`);
      }
    } catch (err) {
      console.error(`  ❌ Error leyendo ${locale}/common.json:`, err.message);
    }
  });
}

// 2. Buscar archivos .bak
function findBakFiles() {
  console.log('\n🔍 Buscando archivos .bak...');

  function scanDir(dir, depth = 0) {
    if (depth > 5 || dir.includes('node_modules')) return;

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (item.includes('.bak') || item.includes('.old')) {
          const relativePath = path.relative(ROOT, fullPath);
          const size = (stat.size / 1024).toFixed(2);
          report.duplicates.bakFiles.push({
            path: relativePath,
            size: `${size} KB`,
          });
        }
      });
    } catch (err) {
      // Ignorar errores de permisos
    }
  }

  scanDir(ROOT);
  console.log(`  Encontrados: ${report.duplicates.bakFiles.length} archivos`);
}

// 3. Buscar console.log en producción
function findConsoleLogs() {
  console.log('\n🔍 Buscando console.log en código...');

  function scanJSFiles(dir, depth = 0) {
    if (depth > 8 || dir.includes('node_modules') || dir.includes('test')) return;

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanJSFiles(fullPath, depth + 1);
          } else if (/\.(jsx?|tsx?)$/.test(item) && !item.includes('.test.')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
              if (/console\.(log|warn|error|info)/.test(line) && !line.trim().startsWith('//')) {
                const relativePath = path.relative(ROOT, fullPath);
                report.issues.console_logs.push({
                  file: relativePath,
                  line: idx + 1,
                  code: line.trim().substring(0, 80),
                });
              }
            });
          }
        } catch (err) {
          // Ignorar
        }
      });
    } catch (err) {
      // Ignorar
    }
  }

  scanJSFiles(SRC);
  console.log(`  Encontrados: ${report.issues.console_logs.length} console.log`);
}

// 4. Buscar TODOs y FIXMEs
function findTodos() {
  console.log('\n🔍 Buscando TODOs y FIXMEs...');

  function scanForTodos(dir, depth = 0) {
    if (depth > 8 || dir.includes('node_modules')) return;

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanForTodos(fullPath, depth + 1);
          } else if (/\.(jsx?|tsx?|md)$/.test(item)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
              const match = line.match(/(TODO|FIXME|HACK|XXX)[\s:](.*)/i);
              if (match) {
                const relativePath = path.relative(ROOT, fullPath);
                report.issues.todos.push({
                  file: relativePath,
                  line: idx + 1,
                  type: match[1].toUpperCase(),
                  message: match[2].trim().substring(0, 100),
                });
              }
            });
          }
        } catch (err) {
          // Ignorar
        }
      });
    } catch (err) {
      // Ignorar
    }
  }

  scanForTodos(SRC);
  console.log(`  Encontrados: ${report.issues.todos.length} TODOs/FIXMEs`);
}

// 5. Archivos grandes (>500 líneas)
function findLargeFiles() {
  console.log('\n🔍 Buscando archivos grandes...');

  function scanForLarge(dir, depth = 0) {
    if (depth > 8 || dir.includes('node_modules') || dir.includes('test')) return;

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanForLarge(fullPath, depth + 1);
          } else if (/\.(jsx?|tsx?)$/.test(item)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            report.stats.totalFiles++;
            report.stats.totalLines += lines;

            if (lines > 500) {
              const relativePath = path.relative(ROOT, fullPath);
              report.issues.large_files.push({
                file: relativePath,
                lines,
                size: `${(stat.size / 1024).toFixed(2)} KB`,
              });
            }
          }
        } catch (err) {
          // Ignorar
        }
      });
    } catch (err) {
      // Ignorar
    }
  }

  scanForLarge(SRC);
  report.issues.large_files.sort((a, b) => b.lines - a.lines);
  console.log(`  Encontrados: ${report.issues.large_files.length} archivos grandes (>500 líneas)`);
}

// 6. Generar informe
function generateReport() {
  console.log('\n📊 Generando informe...');

  const reportPath = path.join(ROOT, 'docs', 'AUDITORIA-PROYECTO.md');

  let md = `# 🔍 Auditoría Completa del Proyecto\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-ES')}\n\n`;
  md += `---\n\n`;

  // Resumen ejecutivo
  md += `## 📋 Resumen Ejecutivo\n\n`;
  md += `| Categoría | Cantidad | Nivel |\n`;
  md += `|-----------|----------|-------|\n`;
  md += `| Archivos .bak | ${report.duplicates.bakFiles.length} | ${report.duplicates.bakFiles.length > 50 ? '🔴 Alto' : report.duplicates.bakFiles.length > 20 ? '🟡 Medio' : '🟢 Bajo'} |\n`;

  const totalDuplicates = Object.values(report.duplicates.i18nKeys).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  md += `| Claves i18n duplicadas | ${totalDuplicates} | ${totalDuplicates > 20 ? '🔴 Alto' : totalDuplicates > 5 ? '🟡 Medio' : '🟢 Bajo'} |\n`;
  md += `| Console.log en código | ${report.issues.console_logs.length} | ${report.issues.console_logs.length > 500 ? '🔴 Alto' : report.issues.console_logs.length > 200 ? '🟡 Medio' : '🟢 Bajo'} |\n`;
  md += `| TODOs/FIXMEs | ${report.issues.todos.length} | ${report.issues.todos.length > 100 ? '🔴 Alto' : report.issues.todos.length > 50 ? '🟡 Medio' : '🟢 Bajo'} |\n`;
  md += `| Archivos grandes | ${report.issues.large_files.length} | ${report.issues.large_files.length > 30 ? '🔴 Alto' : report.issues.large_files.length > 15 ? '🟡 Medio' : '🟢 Bajo'} |\n\n`;

  // Archivos .bak
  md += `## 🗑️ Archivos .bak (${report.duplicates.bakFiles.length})\n\n`;
  if (report.duplicates.bakFiles.length > 0) {
    md += `**Recomendación:** Eliminar estos archivos con \`npm run cleanup:bak\`\n\n`;
    md += `\`\`\`\n`;
    report.duplicates.bakFiles.slice(0, 30).forEach((f) => {
      md += `${f.path} (${f.size})\n`;
    });
    if (report.duplicates.bakFiles.length > 30) {
      md += `... y ${report.duplicates.bakFiles.length - 30} más\n`;
    }
    md += `\`\`\`\n\n`;
  } else {
    md += `✅ No se encontraron archivos .bak\n\n`;
  }

  // Claves i18n duplicadas
  md += `## 🌍 Claves i18n Duplicadas\n\n`;
  Object.entries(report.duplicates.i18nKeys).forEach(([locale, duplicates]) => {
    md += `### ${locale.toUpperCase()} (${duplicates.length} duplicados)\n\n`;
    md += `| Clave | Línea 1 | Línea 2 |\n`;
    md += `|-------|---------|----------|\n`;
    duplicates.slice(0, 15).forEach((d) => {
      md += `| \`${d.key}\` | ${d.line1} | ${d.line2} |\n`;
    });
    if (duplicates.length > 15) {
      md += `\n*... y ${duplicates.length - 15} más*\n`;
    }
    md += `\n`;
  });

  // Console.log
  md += `## 📝 Console.log en Producción (${Math.min(report.issues.console_logs.length, 50)})\n\n`;
  if (report.issues.console_logs.length > 0) {
    md += `**Recomendación:** Remover o convertir a loggers apropiados\n\n`;
    report.issues.console_logs.slice(0, 50).forEach((c) => {
      md += `- \`${c.file}:${c.line}\` → \`${c.code}\`\n`;
    });
    if (report.issues.console_logs.length > 50) {
      md += `\n*... y ${report.issues.console_logs.length - 50} más*\n`;
    }
    md += `\n`;
  }

  // TODOs
  md += `## ✏️ TODOs y FIXMEs (${Math.min(report.issues.todos.length, 30)})\n\n`;
  const grouped = {};
  report.issues.todos.forEach((t) => {
    if (!grouped[t.type]) grouped[t.type] = [];
    grouped[t.type].push(t);
  });

  Object.entries(grouped).forEach(([type, items]) => {
    md += `### ${type} (${items.length})\n\n`;
    items.slice(0, 10).forEach((t) => {
      md += `- \`${t.file}:${t.line}\` → ${t.message}\n`;
    });
    if (items.length > 10) {
      md += `\n*... y ${items.length - 10} más*\n`;
    }
    md += `\n`;
  });

  // Archivos grandes
  md += `## 📦 Archivos Grandes (>500 líneas)\n\n`;
  md += `**Top 20 archivos más grandes:**\n\n`;
  md += `| Archivo | Líneas | Tamaño |\n`;
  md += `|---------|--------|--------|\n`;
  report.issues.large_files.slice(0, 20).forEach((f) => {
    md += `| \`${f.file}\` | ${f.lines} | ${f.size} |\n`;
  });
  md += `\n`;

  // Estadísticas
  md += `## 📊 Estadísticas del Proyecto\n\n`;
  md += `- **Total de archivos JS/JSX:** ${report.stats.totalFiles}\n`;
  md += `- **Total de líneas de código:** ${report.stats.totalLines.toLocaleString()}\n`;
  md += `- **Promedio líneas/archivo:** ${Math.round(report.stats.totalLines / report.stats.totalFiles)}\n\n`;

  // Recomendaciones
  md += `## 💡 Recomendaciones Prioritarias\n\n`;
  md += `### 🔴 Crítico\n\n`;
  if (totalDuplicates > 0) {
    md += `1. **Eliminar claves i18n duplicadas** (${totalDuplicates} encontradas)\n`;
    md += `   - Crear script de deduplicación\n`;
    md += `   - Verificar que no rompa funcionalidad\n\n`;
  }
  if (report.duplicates.bakFiles.length > 50) {
    md += `2. **Limpiar archivos .bak** (${report.duplicates.bakFiles.length} encontrados)\n`;
    md += `   - Ejecutar: \`npm run cleanup:bak\`\n\n`;
  }

  md += `### 🟡 Medio\n\n`;
  if (report.issues.console_logs.length > 200) {
    md += `1. **Reducir console.log** (${report.issues.console_logs.length} encontrados)\n`;
    md += `   - Implementar logger centralizado\n`;
    md += `   - Remover logs de debug en producción\n\n`;
  }
  if (report.issues.large_files.length > 15) {
    md += `2. **Refactorizar archivos grandes** (${report.issues.large_files.length} >500 líneas)\n`;
    md += `   - Dividir en componentes más pequeños\n`;
    md += `   - Mejorar mantenibilidad\n\n`;
  }

  md += `### 🟢 Bajo\n\n`;
  if (report.issues.todos.length > 50) {
    md += `1. **Resolver TODOs/FIXMEs** (${report.issues.todos.length} encontrados)\n`;
    md += `   - Crear issues en GitHub\n`;
    md += `   - Priorizar por impacto\n\n`;
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n✅ Informe generado: ${reportPath}`);
}

// Ejecutar auditoría
async function runAudit() {
  console.log('🚀 Iniciando auditoría del proyecto...\n');

  findBakFiles();
  findDuplicateI18nKeys();
  findConsoleLogs();
  findTodos();
  findLargeFiles();
  generateReport();

  console.log('\n✅ Auditoría completada!\n');
}

runAudit().catch((err) => {
  console.error('❌ Error en auditoría:', err);
  process.exit(1);
});
