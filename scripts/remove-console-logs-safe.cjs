#!/usr/bin/env node

/**
 * Script simplificado para eliminar console.logs de forma segura
 * Solo procesa archivos en src y apps/main-app
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a procesar
const DIRECTORIES = [
  'src',
  'apps/main-app/src'
];

// Estadísticas
let stats = {
  filesProcessed: 0,
  consoleLogs: 0,
  consoleErrors: 0,
  consoleWarns: 0,
  totalReplaced: 0,
  filesModified: 0
};

// Archivos a excluir
const EXCLUDE_FILES = [
  'logger.js',
  'consoleCommands.js',
  'debugAuth.js',
  'errorLogger.js'
];

function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  return EXCLUDE_FILES.includes(fileName) ||
         fileName.includes('.test.') ||
         fileName.includes('.spec.') ||
         filePath.includes('test/') ||
         filePath.includes('tests/') ||
         filePath.includes('__tests__/');
}

function processFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileModified = false;
  
  // Patrones simples de reemplazo
  const patterns = [
    { 
      regex: /console\.log\(/g, 
      replacement: '// console.log(',
      type: 'log'
    },
    { 
      regex: /console\.error\(/g, 
      replacement: '// console.error(',
      type: 'error'
    },
    { 
      regex: /console\.warn\(/g, 
      replacement: '// console.warn(',
      type: 'warn'
    },
    { 
      regex: /console\.info\(/g, 
      replacement: '// console.info(',
      type: 'info'
    },
    { 
      regex: /console\.debug\(/g, 
      replacement: '// console.debug(',
      type: 'debug'
    }
  ];
  
  patterns.forEach(({ regex, replacement, type }) => {
    const matches = content.match(regex);
    if (matches) {
      const count = matches.length;
      if (count > 0) {
        content = content.replace(regex, replacement);
        fileModified = true;
        
        switch (type) {
          case 'log':
            stats.consoleLogs += count;
            break;
          case 'error':
            stats.consoleErrors += count;
            break;
          case 'warn':
            stats.consoleWarns += count;
            break;
          default:
            stats.consoleLogs += count;
        }
        stats.totalReplaced += count;
      }
    }
  });
  
  if (fileModified && content !== originalContent) {
    stats.filesModified++;
    
    if (VERBOSE) {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`📝 ${relativePath}`);
    }
    
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
  
  stats.filesProcessed++;
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️  Directorio no encontrado: ${dirPath}`);
    return;
  }
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') {
        continue;
      }
      
      const fullPath = path.join(dirPath, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
          processFile(fullPath);
        }
      } catch (err) {
        if (VERBOSE) {
          console.warn(`⚠️  No se pudo procesar: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    console.error(`❌ Error procesando directorio ${dirPath}:`, err.message);
  }
}

function main() {
  console.log('🔍 Eliminando console.logs del código...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  Modo DRY RUN - No se harán cambios\n');
  }
  
  const startTime = Date.now();
  
  DIRECTORIES.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    console.log(`📂 Procesando: ${dir}`);
    processDirectory(fullPath);
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Estadísticas:');
  console.log('================');
  console.log(`✅ Archivos procesados: ${stats.filesProcessed}`);
  console.log(`📝 Archivos modificados: ${stats.filesModified}`);
  console.log(`\n🔄 Console.logs comentados:`);
  console.log(`   console.log: ${stats.consoleLogs}`);
  console.log(`   console.error: ${stats.consoleErrors}`);
  console.log(`   console.warn: ${stats.consoleWarns}`);
  console.log(`   -----------`);
  console.log(`   Total: ${stats.totalReplaced}`);
  console.log(`\n⏱️  Tiempo: ${duration}s`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para aplicar los cambios, ejecuta sin --dry-run');
  } else {
    console.log('\n✅ Cambios aplicados exitosamente');
    console.log('\n⚠️  IMPORTANTE: Los console.logs han sido comentados, no eliminados.');
    console.log('   Esto permite restaurarlos fácilmente si es necesario.');
  }
}

main();
