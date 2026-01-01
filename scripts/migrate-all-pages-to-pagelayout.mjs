#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../apps/main-app/src/pages');

// Páginas que ya están migradas o que no deben tocarse
const SKIP_PAGES = [
  'Home2.jsx',
  'Finance.jsx',
  'HomePage2.jsx', // Es un componente, no página
];

// Detecta si una página ya usa PageLayout
function usesPageLayout(content) {
  return content.includes('from ../components/layouts') || 
         content.includes('from \'../components/layouts\'') ||
         content.includes('from "../components/layouts"');
}

// Detecta si tiene el layout antiguo
function hasOldLayout(content) {
  return content.includes('className="container') || 
         content.includes('className="max-w-') ||
         content.includes('bg-white') ||
         content.includes('bg-gray-50');
}

async function analyzePages() {
  const files = await fs.readdir(PAGES_DIR);
  const jsxFiles = files.filter(f => f.endsWith('.jsx') && !SKIP_PAGES.includes(f));
  
  const results = {
    alreadyMigrated: [],
    needsMigration: [],
    unknown: [],
  };
  
  for (const file of jsxFiles) {
    const filePath = path.join(PAGES_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (usesPageLayout(content)) {
      results.alreadyMigrated.push(file);
    } else if (hasOldLayout(content)) {
      results.needsMigration.push(file);
    } else {
      results.unknown.push(file);
    }
  }
  
  return results;
}

async function main() {
  console.log('🔍 Analizando páginas del proyecto...\n');
  
  const results = await analyzePages();
  
  console.log('✅ Páginas ya migradas:', results.alreadyMigrated.length);
  results.alreadyMigrated.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n📋 Páginas que necesitan migración:', results.needsMigration.length);
  results.needsMigration.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n❓ Páginas sin detectar layout:', results.unknown.length);
  results.unknown.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n📊 Resumen:');
  console.log(`   Total páginas: ${results.alreadyMigrated.length + results.needsMigration.length + results.unknown.length}`);
  console.log(`   Migradas: ${results.alreadyMigrated.length}`);
  console.log(`   Pendientes: ${results.needsMigration.length + results.unknown.length}`);
  console.log(`   Progreso: ${Math.round((results.alreadyMigrated.length / (results.alreadyMigrated.length + results.needsMigration.length + results.unknown.length)) * 100)}%`);
  
  // Guardar lista de páginas pendientes
  const pendingList = [...results.needsMigration, ...results.unknown];
  await fs.writeFile(
    path.join(__dirname, '../PAGINAS_PENDIENTES_MIGRACION.txt'),
    pendingList.join('\n'),
    'utf-8'
  );
  
  console.log('\n✅ Lista guardada en: PAGINAS_PENDIENTES_MIGRACION.txt');
}

main().catch(console.error);
