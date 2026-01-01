#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../apps/main-app/src/pages');

// Mapeo de reemplazos de estilos hardcodeados a variables CSS
const STYLE_REPLACEMENTS = [
  // Backgrounds
  { pattern: /className="([^"]*?)bg-white([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-surface)\' }}' },
  { pattern: /className="([^"]*?)bg-gray-50([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-bg)\' }}' },
  { pattern: /className="([^"]*?)bg-gray-100([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-bg)\' }}' },
  
  // Text colors
  { pattern: /className="([^"]*?)text-gray-900([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-text)\' }}' },
  { pattern: /className="([^"]*?)text-gray-800([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-text)\' }}' },
  { pattern: /className="([^"]*?)text-gray-700([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-text)\' }}' },
  { pattern: /className="([^"]*?)text-gray-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-text-secondary)\' }}' },
  { pattern: /className="([^"]*?)text-gray-500([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-muted)\' }}' },
  { pattern: /className="([^"]*?)text-gray-400([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-muted)\' }}' },
  
  // Borders
  { pattern: /className="([^"]*?)border-gray-200([^"]*?)"/g, replacement: 'className="$1$2" style={{ borderColor: \'var(--color-border)\' }}' },
  { pattern: /className="([^"]*?)border-gray-300([^"]*?)"/g, replacement: 'className="$1$2" style={{ borderColor: \'var(--color-border)\' }}' },
  
  // Primary colors
  { pattern: /className="([^"]*?)bg-blue-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-primary)\' }}' },
  { pattern: /className="([^"]*?)text-blue-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-primary)\' }}' },
  { pattern: /className="([^"]*?)border-blue-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ borderColor: \'var(--color-primary)\' }}' },
  
  // Success colors
  { pattern: /className="([^"]*?)bg-green-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-success)\' }}' },
  { pattern: /className="([^"]*?)text-green-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-success)\' }}' },
  { pattern: /className="([^"]*?)bg-green-500([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-success)\' }}' },
  { pattern: /className="([^"]*?)border-green-500([^"]*?)"/g, replacement: 'className="$1$2" style={{ borderColor: \'var(--color-success)\' }}' },
  
  // Danger colors
  { pattern: /className="([^"]*?)bg-red-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ backgroundColor: \'var(--color-danger)\' }}' },
  { pattern: /className="([^"]*?)text-red-600([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-danger)\' }}' },
  { pattern: /className="([^"]*?)text-red-500([^"]*?)"/g, replacement: 'className="$1$2" style={{ color: \'var(--color-danger)\' }}' },
];

async function getAllJsxFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllJsxFiles(fullPath));
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    let changes = 0;
    
    // Aplicar todos los reemplazos
    for (const { pattern, replacement } of STYLE_REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changes += matches.length;
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ ${path.basename(filePath)}: ${changes} cambios`);
      return { file: filePath, changes };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando migración de estilos a variables CSS...\n');
  
  const files = await getAllJsxFiles(PAGES_DIR);
  console.log(`📁 Encontrados ${files.length} archivos\n`);
  
  const results = [];
  for (const file of files) {
    const result = await migrateFile(file);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`   Archivos modificados: ${results.length}`);
  console.log(`   Total de cambios: ${results.reduce((sum, r) => sum + r.changes, 0)}`);
  console.log('\n✅ Migración completada');
}

main().catch(console.error);
