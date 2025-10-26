#!/usr/bin/env node

/**
 * Script para generar inventario completo de archivos para migración i18n
 * Analiza todos los archivos y los categoriza por prioridad y complejidad
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');
const OUTPUT_FILE = path.join(__dirname, '../../docs/i18n/inventario-archivos.json');

// Archivos ya migrados
const MIGRATED = new Set([
  'src/components/marketing/MarketingLayout.jsx',
  'src/components/Nav.jsx',
  'src/pages/Login.jsx',
  'src/components/Spinner.jsx',
  'src/components/ui/Spinner.jsx',
]);

// Archivos que no necesitan migración (solo CSS, sin texto)
const NO_STRINGS = new Set([
  'src/components/Button.jsx', // Proxy file
  'src/components/ui/Button.jsx', // Solo estilos
]);

// Categorías de archivos
const CATEGORIES = {
  'ui-core': {
    priority: 1,
    pattern: /src\/components\/ui\//,
    description: 'Componentes UI base reutilizables',
  },
  'pages-auth': {
    priority: 2,
    pattern: /src\/pages\/(Login|Signup|Reset|Verify)/,
    description: 'Páginas de autenticación',
  },
  'pages-main': {
    priority: 2,
    pattern: /src\/pages\/(Home|Bodas|Finance|Tasks|Invitados|Proveedores|UnifiedEmail)/,
    description: 'Páginas principales del sistema',
  },
  'pages-admin': {
    priority: 3,
    pattern: /src\/pages\/admin\//,
    description: 'Panel de administración',
  },
  'components-guests': {
    priority: 3,
    pattern: /src\/components\/guests\//,
    description: 'Componentes de gestión de invitados',
  },
  'components-finance': {
    priority: 3,
    pattern: /src\/components\/finance\//,
    description: 'Componentes de finanzas',
  },
  'components-tasks': {
    priority: 3,
    pattern: /src\/components\/tasks\//,
    description: 'Componentes de tareas',
  },
  'components-proveedores': {
    priority: 3,
    pattern: /src\/components\/proveedores\//,
    description: 'Componentes de proveedores',
  },
  'components-seating': {
    priority: 3,
    pattern: /src\/components\/seating\//,
    description: 'Componentes de plan de asientos',
  },
  'components-email': {
    priority: 3,
    pattern: /src\/components\/email\//,
    description: 'Componentes de email',
  },
  'services': {
    priority: 4,
    pattern: /src\/services\//,
    description: 'Servicios (menos strings UI)',
  },
  'utils': {
    priority: 4,
    pattern: /src\/utils\//,
    description: 'Utilidades (mensajes de error)',
  },
  'data': {
    priority: 5,
    pattern: /src\/data\//,
    description: 'Data estática y templates',
  },
  'other': {
    priority: 6,
    pattern: /.*/,
    description: 'Otros archivos',
  },
};

function categorizeFile(filePath) {
  for (const [name, category] of Object.entries(CATEGORIES)) {
    if (category.pattern.test(filePath)) {
      return { name, ...category };
    }
  }
  return { name: 'other', ...CATEGORIES.other };
}

function estimateComplexity(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    
    // Contar strings potencialmente traducibles
    const spanishChars = (content.match(/[áéíóúñÁÉÍÓÚÑ¿¡]/g) || []).length;
    const quotedStrings = (content.match(/['"][^'"]{3,}['"]/g) || []).length;
    
    let complexity = 'low';
    if (lines > 300 || spanishChars > 20) complexity = 'high';
    else if (lines > 150 || spanishChars > 10) complexity = 'medium';
    
    return {
      lines,
      spanishChars,
      quotedStrings,
      complexity,
      estimatedMinutes: complexity === 'high' ? 60 : complexity === 'medium' ? 30 : 15,
    };
  } catch (error) {
    return {
      lines: 0,
      spanishChars: 0,
      quotedStrings: 0,
      complexity: 'unknown',
      estimatedMinutes: 30,
    };
  }
}

function scanDirectory(dir, baseDir = dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Excluir directorios
        if (['node_modules', 'dist', 'build', '.git', '__tests__', 'test'].includes(entry.name)) {
          continue;
        }
        files.push(...scanDirectory(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Solo JSX y JS (no tests)
        if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;
        if (/\.(test|spec)\.(jsx?|tsx?)$/.test(entry.name)) continue;
        
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const relativeFromRoot = `src/${relativePath}`;
        
        files.push({
          path: relativeFromRoot,
          fullPath,
          name: entry.name,
          ext: path.extname(entry.name),
          migrated: MIGRATED.has(relativeFromRoot),
          noStrings: NO_STRINGS.has(relativeFromRoot),
          category: categorizeFile(relativeFromRoot),
          ...estimateComplexity(fullPath),
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
  
  return files;
}

function generateReport(files) {
  const report = {
    generated: new Date().toISOString(),
    total: files.length,
    migrated: files.filter(f => f.migrated).length,
    noStrings: files.filter(f => f.noStrings).length,
    pending: files.filter(f => !f.migrated && !f.noStrings).length,
    byCategory: {},
    byComplexity: {},
    byPriority: {},
    estimatedHours: 0,
    files: files.sort((a, b) => {
      // Ordenar por prioridad, luego complejidad
      if (a.category.priority !== b.category.priority) {
        return a.category.priority - b.category.priority;
      }
      const complexityOrder = { high: 3, medium: 2, low: 1, unknown: 0 };
      return complexityOrder[b.complexity] - complexityOrder[a.complexity];
    }),
  };
  
  // Calcular estadísticas
  files.forEach(file => {
    // Por categoría
    const catName = file.category.name;
    if (!report.byCategory[catName]) {
      report.byCategory[catName] = {
        total: 0,
        migrated: 0,
        pending: 0,
        hours: 0,
      };
    }
    report.byCategory[catName].total++;
    if (file.migrated) report.byCategory[catName].migrated++;
    else if (!file.noStrings) {
      report.byCategory[catName].pending++;
      report.byCategory[catName].hours += file.estimatedMinutes / 60;
    }
    
    // Por complejidad
    const comp = file.complexity;
    report.byComplexity[comp] = (report.byComplexity[comp] || 0) + 1;
    
    // Por prioridad
    const pri = file.category.priority;
    report.byPriority[pri] = (report.byPriority[pri] || 0) + 1;
    
    // Horas totales
    if (!file.migrated && !file.noStrings) {
      report.estimatedHours += file.estimatedMinutes / 60;
    }
  });
  
  return report;
}

console.log('🔍 Escaneando archivos del proyecto...');
const files = scanDirectory(SRC_DIR);

console.log('📊 Generando reporte...');
const report = generateReport(files);

// Guardar reporte
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');

console.log('\n✅ Inventario generado exitosamente\n');
console.log(`📁 Total archivos: ${report.total}`);
console.log(`✅ Migrados: ${report.migrated} (${Math.round(report.migrated / report.total * 100)}%)`);
console.log(`⏭️  Sin strings: ${report.noStrings}`);
console.log(`⏸️  Pendientes: ${report.pending}`);
console.log(`⏱️  Tiempo estimado: ${Math.round(report.estimatedHours)} horas (~${Math.round(report.estimatedHours / 8)} días)`);
console.log(`\n📄 Reporte guardado en: ${OUTPUT_FILE}`);

// Mostrar resumen por categoría
console.log('\n📊 Por categoría:');
Object.entries(report.byCategory)
  .sort((a, b) => b[1].pending - a[1].pending)
  .forEach(([cat, stats]) => {
    if (stats.pending > 0) {
      console.log(`  ${cat}: ${stats.pending} pendientes (~${Math.round(stats.hours)}h)`);
    }
  });
