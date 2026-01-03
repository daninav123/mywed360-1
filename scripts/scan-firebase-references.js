#!/usr/bin/env node
/**
 * Script para encontrar todas las referencias a Firebase/Firestore
 * y generar un reporte de migración a PostgreSQL
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRONTEND_ROOT = join(__dirname, '../apps/main-app/src');

// Patrones a buscar
const FIREBASE_PATTERNS = [
  { pattern: /import.*from ['"].*firebase/gi, label: 'Firebase Import' },
  { pattern: /import.*firestore/gi, label: 'Firestore Import' },
  { pattern: /from ['"]\.\.?\/.*firebaseConfig/gi, label: 'FirebaseConfig Import' },
  { pattern: /\b(db|firestore)\.(collection|doc|get|set|update|delete|add)/gi, label: 'Firestore API Call' },
  { pattern: /collection\(/gi, label: 'collection()' },
  { pattern: /doc\(/gi, label: 'doc()' },
  { pattern: /getDocs|getDoc|addDoc|setDoc|updateDoc|deleteDoc/gi, label: 'Firestore SDK' },
  { pattern: /onSnapshot/gi, label: 'Firestore Realtime' },
  { pattern: /firebase\.auth/gi, label: 'Firebase Auth (legacy)' },
];

const results = {
  hooks: [],
  pages: [],
  components: [],
  services: [],
  utils: [],
  contexts: [],
  other: []
};

async function scanDirectory(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, build
      if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        continue;
      }
      await scanDirectory(fullPath, baseDir);
    } else if (entry.name.match(/\.(jsx?|tsx?)$/)) {
      await scanFile(fullPath, baseDir);
    }
  }
}

async function scanFile(filePath, baseDir) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const matches = [];
    
    for (const { pattern, label } of FIREBASE_PATTERNS) {
      const found = content.match(pattern);
      if (found) {
        matches.push({
          pattern: label,
          count: found.length,
          examples: found.slice(0, 3)
        });
      }
    }
    
    if (matches.length > 0) {
      const relativePath = relative(baseDir, filePath);
      const category = categorizeFile(relativePath);
      
      results[category].push({
        file: relativePath,
        matches,
        totalMatches: matches.reduce((sum, m) => sum + m.count, 0)
      });
    }
  } catch (error) {
    // Ignore read errors
  }
}

function categorizeFile(path) {
  if (path.includes('/hooks/')) return 'hooks';
  if (path.includes('/pages/')) return 'pages';
  if (path.includes('/components/')) return 'components';
  if (path.includes('/services/')) return 'services';
  if (path.includes('/utils/')) return 'utils';
  if (path.includes('/context')) return 'contexts';
  return 'other';
}

function getPriority(file, matches) {
  const criticalPatterns = ['Firestore API Call', 'collection()', 'doc()'];
  const hasCritical = matches.some(m => criticalPatterns.includes(m.pattern));
  
  const criticalFiles = [
    'useAuth', 'useWedding', 'useGuests', 'useProveedores',
    'Perfil', 'InfoBoda', 'Invitados', 'Finance', 'Tasks'
  ];
  const isCriticalFile = criticalFiles.some(cf => file.includes(cf));
  
  if (hasCritical && isCriticalFile) return 'CRÍTICO';
  if (hasCritical || isCriticalFile) return 'IMPORTANTE';
  return 'SECUNDARIO';
}

function printReport() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  REPORTE DE MIGRACIÓN FIREBASE → POSTGRESQL                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  
  const categories = ['hooks', 'pages', 'components', 'services', 'contexts', 'utils', 'other'];
  const categoryLabels = {
    hooks: 'HOOKS',
    pages: 'PÁGINAS',
    components: 'COMPONENTES',
    services: 'SERVICIOS',
    contexts: 'CONTEXTOS',
    utils: 'UTILIDADES',
    other: 'OTROS'
  };
  
  let totalFiles = 0;
  let criticalCount = 0;
  let importantCount = 0;
  
  for (const category of categories) {
    const items = results[category];
    if (items.length === 0) continue;
    
    totalFiles += items.length;
    
    console.log(`\n━━━ ${categoryLabels[category]} (${items.length} archivos) ━━━\n`);
    
    // Sort by priority
    items.sort((a, b) => {
      const priorityOrder = { 'CRÍTICO': 0, 'IMPORTANTE': 1, 'SECUNDARIO': 2 };
      const aPriority = getPriority(a.file, a.matches);
      const bPriority = getPriority(b.file, b.matches);
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });
    
    for (const item of items) {
      const priority = getPriority(item.file, item.matches);
      const icon = priority === 'CRÍTICO' ? '🔴' : priority === 'IMPORTANTE' ? '🟡' : '🟢';
      
      if (priority === 'CRÍTICO') criticalCount++;
      if (priority === 'IMPORTANTE') importantCount++;
      
      console.log(`${icon} ${priority.padEnd(12)} ${item.file}`);
      console.log(`   Referencias: ${item.totalMatches}`);
      
      for (const match of item.matches) {
        console.log(`   - ${match.pattern}: ${match.count}x`);
      }
      console.log('');
    }
  }
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  RESUMEN                                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  console.log(`  Total de archivos con Firebase: ${totalFiles}`);
  console.log(`  🔴 Críticos:    ${criticalCount}`);
  console.log(`  🟡 Importantes: ${importantCount}`);
  console.log(`  🟢 Secundarios: ${totalFiles - criticalCount - importantCount}`);
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  RECOMENDACIONES                                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  console.log('  1. Migrar HOOKS CRÍTICOS primero (afectan múltiples páginas)');
  console.log('  2. Migrar PÁGINAS IMPORTANTES después');
  console.log('  3. Migrar COMPONENTES y SERVICIOS según uso');
  console.log('  4. SECUNDARIOS pueden migrarse gradualmente\n');
  
  console.log('  ⚠️  Firebase Auth: Mantener activo hasta verificar todos los flows\n');
}

// Main
console.log('🔍 Escaneando proyecto...\n');
await scanDirectory(FRONTEND_ROOT);
printReport();
