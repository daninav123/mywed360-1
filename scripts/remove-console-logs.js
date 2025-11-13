#!/usr/bin/env node

/**
 * Script para eliminar console.logs del código de producción
 * Reemplaza console.log, console.error, console.warn con el nuevo logger
 * Uso: node scripts/remove-console-logs.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a procesar
const DIRECTORIES = [
  'src',
  'apps/main-app/src',
  'apps/suppliers-app/src',
  'apps/planners-app/src',
  'apps/admin-app/src',
];

// Archivos a excluir
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'test',
  'tests',
  '__tests__',
  'coverage',
  'logger.js',
  'consoleCommands.js', // Este archivo es para debugging intencional
  'debugAuth.js', // Archivo de debug
  '.spec.js',
  '.test.js',
];

// Estadísticas
let stats = {
  filesProcessed: 0,
  consoleLogs: 0,
  consoleErrors: 0,
  consoleWarns: 0,
  consoleInfos: 0,
  totalReplaced: 0,
  filesModified: 0,
};

/**
 * Determina el tipo de módulo desde el path del archivo
 */
function getModuleName(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(path.sep);

  if (parts.includes('components')) {
    const idx = parts.indexOf('components');
    if (parts[idx + 1]) {
      return `Component:${parts[idx + 1]}`;
    }
  }

  if (parts.includes('services')) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `Service:${fileName.replace('Service', '')}`;
  }

  if (parts.includes('hooks')) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `Hook:${fileName}`;
  }

  if (parts.includes('pages')) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `Page:${fileName}`;
  }

  if (parts.includes('utils')) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `Util:${fileName}`;
  }

  // Default: usar nombre del archivo
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

/**
 * Procesa un archivo JavaScript/TypeScript
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const moduleName = getModuleName(filePath);
  let fileStats = { ...stats };

  // Verificar si ya importa el logger
  const hasLoggerImport =
    content.includes("from '@/utils/logger'") ||
    content.includes('from "@/utils/logger"') ||
    content.includes("from '../utils/logger'") ||
    content.includes('from "../utils/logger"');

  let needsLoggerImport = false;

  // Patrones de reemplazo con contexto mejorado
  const replacements = [
    {
      // console.log simple
      pattern: /console\.log\s*\(\s*['"`]([^'"`]*?)['"`]\s*\)/g,
      replacement: (match, message) => {
        needsLoggerImport = true;
        stats.consoleLogs++;
        return `logger.debug('${moduleName}', '${message}')`;
      },
    },
    {
      // console.log con datos
      pattern: /console\.log\s*\(\s*['"`]([^'"`]*?)['"`]\s*,\s*([^)]+)\)/g,
      replacement: (match, message, data) => {
        needsLoggerImport = true;
        stats.consoleLogs++;
        return `logger.debug('${moduleName}', '${message}', ${data})`;
      },
    },
    {
      // console.log con template literals
      pattern: /console\.log\s*\(\s*`([^`]*?)`\s*\)/g,
      replacement: (match, message) => {
        needsLoggerImport = true;
        stats.consoleLogs++;
        return `logger.debug('${moduleName}', \`${message}\`)`;
      },
    },
    {
      // console.error
      pattern: /console\.error\s*\(\s*['"`]([^'"`]*?)['"`]\s*(?:,\s*([^)]+))?\)/g,
      replacement: (match, message, data) => {
        needsLoggerImport = true;
        stats.consoleErrors++;
        if (data) {
          return `logger.error('${moduleName}', '${message}', ${data})`;
        }
        return `logger.error('${moduleName}', '${message}')`;
      },
    },
    {
      // console.warn
      pattern: /console\.warn\s*\(\s*['"`]([^'"`]*?)['"`]\s*(?:,\s*([^)]+))?\)/g,
      replacement: (match, message, data) => {
        needsLoggerImport = true;
        stats.consoleWarns++;
        if (data) {
          return `logger.warn('${moduleName}', '${message}', ${data})`;
        }
        return `logger.warn('${moduleName}', '${message}')`;
      },
    },
    {
      // console.info
      pattern: /console\.info\s*\(\s*['"`]([^'"`]*?)['"`]\s*(?:,\s*([^)]+))?\)/g,
      replacement: (match, message, data) => {
        needsLoggerImport = true;
        stats.consoleInfos++;
        if (data) {
          return `logger.info('${moduleName}', '${message}', ${data})`;
        }
        return `logger.info('${moduleName}', '${message}')`;
      },
    },
    {
      // console.group y console.groupEnd
      pattern: /console\.(group|groupEnd|groupCollapsed)\s*\([^)]*\);?/g,
      replacement: (match) => {
        stats.consoleLogs++;
        return '// ' + match; // Comentar en lugar de eliminar
      },
    },
    {
      // console.table
      pattern: /console\.table\s*\(([^)]+)\)/g,
      replacement: (match, data) => {
        needsLoggerImport = true;
        stats.consoleLogs++;
        return `logger.debug('${moduleName}', 'Table data:', ${data})`;
      },
    },
    {
      // console.time y console.timeEnd
      pattern: /console\.(time|timeEnd)\s*\(\s*['"`]([^'"`]*?)['"`]\s*\)/g,
      replacement: (match, method, label) => {
        needsLoggerImport = true;
        stats.consoleLogs++;
        if (method === 'time') {
          return `logger.time('${label}')`;
        } else {
          return `logger.timeEnd('${label}', '${moduleName}')`;
        }
      },
    },
  ];

  // Aplicar reemplazos
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Añadir import del logger si es necesario
  if (needsLoggerImport && !hasLoggerImport) {
    // Buscar dónde insertar el import
    const importMatch = content.match(/^(import .+ from .+;?\n)+/m);

    if (importMatch) {
      // Insertar después de los imports existentes
      const lastImportIndex = importMatch.index + importMatch[0].length;
      content =
        content.slice(0, lastImportIndex) +
        `import logger from '@/utils/logger';\n` +
        content.slice(lastImportIndex);
    } else {
      // Si no hay imports, añadir al principio
      content = `import logger from '@/utils/logger';\n\n` + content;
    }
  }

  // Calcular estadísticas reales
  const actualStats = {
    consoleLogs: stats.consoleLogs - fileStats.consoleLogs,
    consoleErrors: stats.consoleErrors - fileStats.consoleErrors,
    consoleWarns: stats.consoleWarns - fileStats.consoleWarns,
    consoleInfos: stats.consoleInfos - fileStats.consoleInfos,
  };

  const totalChanges =
    actualStats.consoleLogs +
    actualStats.consoleErrors +
    actualStats.consoleWarns +
    actualStats.consoleInfos;

  if (content !== originalContent) {
    stats.filesModified++;
    stats.totalReplaced += totalChanges;

    if (VERBOSE && totalChanges > 0) {
      console.log(`📝 ${path.relative(process.cwd(), filePath)}`);
      if (actualStats.consoleLogs > 0) console.log(`   - console.log: ${actualStats.consoleLogs}`);
      if (actualStats.consoleErrors > 0)
        console.log(`   - console.error: ${actualStats.consoleErrors}`);
      if (actualStats.consoleWarns > 0)
        console.log(`   - console.warn: ${actualStats.consoleWarns}`);
      if (actualStats.consoleInfos > 0)
        console.log(`   - console.info: ${actualStats.consoleInfos}`);
    }

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  stats.filesProcessed++;
}

/**
 * Procesa un directorio recursivamente
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Directorio no encontrado: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);

    // Verificar si debe ser excluido
    if (EXCLUDE_PATTERNS.some((pattern) => fullPath.includes(pattern))) {
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
      processFile(fullPath);
    }
  }
}

/**
 * Main
 */
function main() {
  console.log('🔍 Eliminando console.logs del código...\n');

  if (DRY_RUN) {
    console.log('⚠️  Modo DRY RUN - No se harán cambios\n');
  }

  const startTime = Date.now();

  // Procesar cada directorio
  DIRECTORIES.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    console.log(`📂 Procesando: ${dir}`);
    processDirectory(fullPath);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Mostrar estadísticas
  console.log('\n📊 Estadísticas:');
  console.log('================');
  console.log(`✅ Archivos procesados: ${stats.filesProcessed}`);
  console.log(`📝 Archivos modificados: ${stats.filesModified}`);
  console.log(`\n🔄 Reemplazos:`);
  console.log(`   console.log: ${stats.consoleLogs}`);
  console.log(`   console.error: ${stats.consoleErrors}`);
  console.log(`   console.warn: ${stats.consoleWarns}`);
  console.log(`   console.info: ${stats.consoleInfos}`);
  console.log(`   -----------`);
  console.log(`   Total: ${stats.totalReplaced}`);
  console.log(`\n⏱️  Tiempo: ${duration}s`);

  if (DRY_RUN) {
    console.log('\n💡 Para aplicar los cambios, ejecuta sin --dry-run');
  } else {
    console.log('\n✅ Cambios aplicados exitosamente');
  }
}

// Ejecutar
main();
