#!/usr/bin/env node

/**
 * Script de migración automática de Lovenda/myWed360 a MaLoveApp
 * 
 * Este script reemplaza todas las referencias antiguas del proyecto:
 * - Lovenda → MaLoveApp
 * - myWed360 → MaLoveApp
 * - mywed360 → maloveapp (para URLs, claves, etc.)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuración
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a excluir
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'logs',
  'cypress/videos',
  'cypress/screenshots'
];

// Extensiones de archivos a procesar
const INCLUDE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.md', '.html', '.css',
  '.yml', '.yaml', '.sh', '.ps1',
  '.txt'
];

// Patrones de reemplazo
const REPLACEMENTS = [
  // 1. Clases CSS
  { pattern: /maloveapp-/g, replacement: 'maloveapp-', description: 'CSS classes' },
  
  // 2. LocalStorage keys y constantes (case sensitive)
  { pattern: /maloveapp_/g, replacement: 'maloveapp_', description: 'localStorage keys (maloveapp_)' },
  { pattern: /maloveapp_/g, replacement: 'maloveapp_', description: 'localStorage keys (maloveapp_)' },
  { pattern: /MaLoveApp_/g, replacement: 'MaLoveApp_', description: 'localStorage keys (MaLoveApp_)' },
  { pattern: /MALOVEAPP_/g, replacement: 'MALOVEAPP_', description: 'localStorage keys (MALOVEAPP_)' },
  
  // 3. Eventos custom
  { pattern: /maloveapp:/g, replacement: 'maloveapp:', description: 'Custom events (maloveapp:)' },
  { pattern: /maloveapp:/g, replacement: 'maloveapp:', description: 'Custom events (maloveapp:)' },
  { pattern: /'maloveapp-/g, replacement: "'maloveapp-", description: 'Event names (mywed360-)' },
  { pattern: /"maloveapp-/g, replacement: '"maloveapp-', description: 'Event names quoted (mywed360-)' },
  
  // 4. IDs y atributos HTML
  { pattern: /id="maloveapp/g, replacement: 'id="maloveapp', description: 'HTML IDs' },
  { pattern: /id="maloveappCountdown"/g, replacement: 'id="maloveappCountdown"', description: 'Countdown ID' },
  
  // 5. Dominios y URLs
  { pattern: /mywed360\.com/g, replacement: 'maloveapp.com', description: 'Domain (maloveapp.com)' },
  { pattern: /mywed360\.netlify\.app/g, replacement: 'maloveapp.netlify.app', description: 'Netlify domain' },
  { pattern: /mywed360\.web\.app/g, replacement: 'maloveapp.web.app', description: 'Firebase domain' },
  { pattern: /mywed360-backend\.onrender\.com/g, replacement: 'maloveapp-backend.onrender.com', description: 'Backend domain' },
  { pattern: /mywed360\.app/g, replacement: 'maloveapp.app', description: 'App domain' },
  
  // 6. Emails
  { pattern: /@lovenda\.com/g, replacement: '@maloveapp.com', description: 'Email domain (lovenda.com)' },
  { pattern: /@mywed360\.com/g, replacement: '@maloveapp.com', description: 'Email domain (maloveapp.com)' },
  { pattern: /admin@maloveapp/g, replacement: 'admin@maloveapp', description: 'Admin email' },
  { pattern: /soporte@maloveapp/g, replacement: 'soporte@maloveapp', description: 'Support email' },
  
  // 7. Nombres de proyecto y marcas en strings
  { pattern: /MaLoveApp/g, replacement: 'MaLoveApp', description: 'Brand name (MaLoveApp)' },
  { pattern: /MALOVEAPP/g, replacement: 'MALOVEAPP', description: 'Brand name uppercase (MALOVEAPP)' },
  { pattern: /MaLoveApp Access/g, replacement: 'MaLoveApp Access', description: 'Access branding' },
  { pattern: /Welcome to MaLoveApp/g, replacement: 'Welcome to MaLoveApp', description: 'Welcome message' },
  { pattern: /Your MaLoveApp account/g, replacement: 'Your MaLoveApp account', description: 'Account references' },
  
  // 8. Comentarios y documentación
  { pattern: /Sistema de emails de MaLoveApp/g, replacement: 'Sistema de emails de MaLoveApp', description: 'Email system docs' },
  { pattern: /aplicación MaLoveApp/g, replacement: 'aplicación MaLoveApp', description: 'App references (ES)' },
  { pattern: /PRUEBA DE MALOVEAPP', description: 'Test headers' },
  { pattern: /Comandos de consola MaLoveApp/g, replacement: 'Comandos de consola MaLoveApp', description: 'Console commands' },
  { pattern: /DIAGNÓSTICOS MALOVEAPP/g, replacement: 'DIAGNÓSTICOS MALOVEAPP', description: 'Diagnostics' },
  { pattern: /Panel de Estadísticas para Partners - MaLoveApp - MaLoveApp/g, replacement: 'Panel de Estadísticas para Partners - MaLoveApp - MaLoveApp - MaLoveApp', description: 'Partner stats' },
  
  // 9. Variables globales y flags
  { pattern: /__MALOVEAPP_/g, replacement: '__MALOVEAPP_', description: 'Global flags' },
  { pattern: /__MALOVEAPP_/g, replacement: '__MALOVEAPP_', description: 'Global flags (LOVENDA)' },
  
  // 10. Configuraciones de Firebase y proyectos
  { pattern: /maloveapp-test/g, replacement: 'maloveapp-test', description: 'Test project IDs' },
  { pattern: /maloveapp-rules-test/g, replacement: 'maloveapp-rules-test', description: 'Rules test project' },
  { pattern: /us-central1-maloveapp/g, replacement: 'us-central1-maloveapp', description: 'Firebase Functions region' },
  
  // 11. Nombres de objetos y propiedades (con comillas)
  { pattern: /'maloveapp'/g, replacement: "'maloveapp'", description: 'Object property (lovenda)' },
  { pattern: /'maloveapp'/g, replacement: "'maloveapp'", description: 'Object property (mywed360)' },
  { pattern: /"maloveapp"/g, replacement: '"maloveapp"', description: 'Object property quoted (lovenda)' },
  { pattern: /"maloveapp"/g, replacement: '"maloveapp"', description: 'Object property quoted (mywed360)' },
  
  // 12. Source y type en mensajes
  { pattern: /source: 'maloveapp'/g, replacement: "source: 'maloveapp'", description: 'Message source' },
  { pattern: /type: 'MALOVEAPP_/g, replacement: "type: 'MALOVEAPP_", description: 'Message types' },
  
  // 13. Cache names y service workers
  { pattern: /maloveapp-v/g, replacement: 'maloveapp-v', description: 'Cache version names' },
  { pattern: /maloveapp-static/g, replacement: 'maloveapp-static', description: 'Static cache' },
  { pattern: /maloveapp-dynamic/g, replacement: 'maloveapp-dynamic', description: 'Dynamic cache' },
  { pattern: /maloveapp-api/g, replacement: 'maloveapp-api', description: 'API cache' },
  { pattern: /maloveapp-share-target/g, replacement: 'maloveapp-share-target', description: 'Share target DB' },
  
  // 14. Branding y marcas en configuración
  { pattern: /branding: 'maloveapp'/g, replacement: "branding: 'maloveapp'", description: 'Branding config' },
  { pattern: /Sin marca MaLoveApp/g, replacement: 'Sin marca MaLoveApp', description: 'White label text' },
  { pattern: /Marca MaLoveApp visible/g, replacement: 'Marca MaLoveApp visible', description: 'Brand visibility text' },
  
  // 15. Administrador references
  { pattern: /Administrador MaLoveApp/g, replacement: 'Administrador MaLoveApp', description: 'Admin name' },
  
  // 16. Nombres en comentarios de código
  { pattern: /Compat migration for internal keys\/events from 'maloveapp' -> 'maloveapp'/g, 
    replacement: "Compat migration (legacy: lovenda/mywed360 -> maloveapp)", 
    description: 'Compat migration comment' },
];

// Estadísticas
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: []
};

/**
 * Verifica si un directorio debe ser excluido
 */
function shouldExcludeDir(dirPath) {
  const parts = dirPath.split(path.sep);
  return EXCLUDE_DIRS.some(exclude => parts.includes(exclude));
}

/**
 * Verifica si un archivo debe ser procesado
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Procesa un archivo aplicando todos los reemplazos
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    let fileHasChanges = false;
    let fileReplacements = 0;

    // Aplicar cada patrón de reemplazo
    for (const { pattern, replacement, description } of REPLACEMENTS) {
      const matches = (newContent.match(pattern) || []).length;
      if (matches > 0) {
        newContent = newContent.replace(pattern, replacement);
        fileHasChanges = true;
        fileReplacements += matches;
        
        if (VERBOSE) {
          console.log(`  ✓ ${description}: ${matches} replacement(s) in ${path.basename(filePath)}`);
        }
      }
    }

    if (fileHasChanges) {
      stats.filesModified++;
      stats.replacementsMade += fileReplacements;

      if (!DRY_RUN) {
        await writeFile(filePath, newContent, 'utf8');
      }

      console.log(`✓ Modified: ${filePath} (${fileReplacements} replacements)`);
    }

    stats.filesProcessed++;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Procesa recursivamente un directorio
 */
async function processDirectory(dirPath) {
  if (shouldExcludeDir(dirPath)) {
    return;
  }

  try {
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        await processDirectory(fullPath);
      } else if (stats.isFile() && shouldProcessFile(fullPath)) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`✗ Error reading directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de Lovenda/myWed360 a MaLoveApp...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  Modo DRY RUN activado - No se modificarán archivos\n');
  }

  const startTime = Date.now();
  const rootDir = process.cwd();

  await processDirectory(rootDir);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE LA MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`Archivos procesados: ${stats.filesProcessed}`);
  console.log(`Archivos modificados: ${stats.filesModified}`);
  console.log(`Total de reemplazos: ${stats.replacementsMade}`);
  console.log(`Tiempo: ${duration}s`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errores encontrados: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  console.log('\n✅ Migración completada exitosamente!');
  
  if (DRY_RUN) {
    console.log('\n💡 Ejecuta sin --dry-run para aplicar los cambios reales.');
  } else {
    console.log('\n⚠️  IMPORTANTE: Revisa los cambios y ejecuta las pruebas antes de hacer commit.');
    console.log('Comandos sugeridos:');
    console.log('  git diff              # Revisar cambios');
    console.log('  npm test              # Ejecutar pruebas');
    console.log('  npm run build         # Verificar build');
  }
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
