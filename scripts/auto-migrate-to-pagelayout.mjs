#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, '../apps/main-app/src/pages');

const SKIP_PAGES = ['Home2.jsx', 'Finance.jsx', 'HomePage2.jsx'];

// Extrae el título de una página
function extractTitle(content, filename) {
  // Buscar títulos en JSX
  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1Match) return h1Match[1].replace(/[🎯💰📋✅🎪🎨📝🔔⚙️👥💬📊🌟✨🎉🎁📱💻🖼️📷🎵🍰🌸💐🎭🎪]/g, '').trim();
  
  // Buscar en className="page-title"
  const pageTitleMatch = content.match(/className="page-title"[^>]*>([^<]+)</);
  if (pageTitleMatch) return pageTitleMatch[1].trim();
  
  // Usar nombre de archivo como fallback
  return filename.replace('.jsx', '').replace(/([A-Z])/g, ' $1').trim();
}

// Extrae el subtítulo
function extractSubtitle(content) {
  const subtitleMatch = content.match(/<p[^>]*className="[^"]*(?:subtitle|description|text-muted)"[^>]*>([^<]+)<\/p>/);
  if (subtitleMatch) return subtitleMatch[1].trim();
  return '';
}

// Detecta el icono emoji
function extractIcon(content) {
  const iconMatch = content.match(/[🎯💰📋✅🎪🎨📝🔔⚙️👥💬📊🌟✨🎉🎁📱💻🖼️📷🎵🍰🌸💐🎭🎪]/);
  return iconMatch ? iconMatch[0] : '';
}

// Migra una página
async function migratePage(filePath, filename) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Ya está migrada?
    if (content.includes('from ../components/layouts') || 
        content.includes('from \'../components/layouts\'') ||
        content.includes('PageLayout')) {
      return { file: filename, status: 'already_migrated' };
    }
    
    const title = extractTitle(content, filename);
    const subtitle = extractSubtitle(content);
    const icon = extractIcon(content);
    
    // Agregar import si no existe
    if (!content.includes('from ../components/layouts')) {
      const lastImportIndex = content.lastIndexOf('import ');
      const nextLineAfterImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, nextLineAfterImport + 1) + 
                "import { PageLayout, PageSection } from '../components/layouts';\n" +
                content.slice(nextLineAfterImport + 1);
    }
    
    // Encuentra la función principal
    const functionMatch = content.match(/(?:export default )?function\s+(\w+)\s*\([^)]*\)\s*{/);
    if (!functionMatch) {
      return { file: filename, status: 'no_function_found' };
    }
    
    const functionName = functionMatch[1];
    
    // Patrón 1: Buscar <div className="container...">
    const containerPattern = /<div className="(?:container|layout-container|max-w-)[^"]*"[^>]*>/;
    if (containerPattern.test(content)) {
      // Reemplazar container div con PageLayout
      content = content.replace(
        /return\s*\(\s*<>?\s*<div className="(?:container|layout-container|max-w-)[^"]*"[^>]*>/,
        `return (\n    <PageLayout title="${title}" subtitle="${subtitle}"${icon ? ` icon="${icon}"` : ''}>\n      <PageSection>`
      );
      
      // Cerrar PageLayout antes del final
      const lastClosingDiv = content.lastIndexOf('</div>');
      if (lastClosingDiv > -1) {
        content = content.slice(0, lastClosingDiv) + 
                  '</PageSection>\n    </PageLayout>' +
                  content.slice(lastClosingDiv + 6);
      }
    }
    
    // Patrón 2: Buscar <PageWrapper> o componentes similares
    else if (content.includes('<PageWrapper')) {
      content = content.replace(
        /<PageWrapper[^>]*>/,
        `<PageLayout title="${title}" subtitle="${subtitle}"${icon ? ` icon="${icon}"` : ''}>\n      <PageSection>`
      );
      content = content.replace(
        /<\/PageWrapper>/g,
        '</PageSection>\n    </PageLayout>'
      );
    }
    
    // Patrón 3: Return directo sin container
    else {
      // Buscar el return statement
      const returnIndex = content.indexOf('return (');
      if (returnIndex > -1) {
        const afterReturn = content.indexOf('\n', returnIndex);
        const closingReturn = content.lastIndexOf(');');
        
        content = content.slice(0, afterReturn + 1) +
                  `    <PageLayout title="${title}" subtitle="${subtitle}"${icon ? ` icon="${icon}"` : ''}>\n      <PageSection>\n` +
                  content.slice(afterReturn + 1, closingReturn).trim() + '\n' +
                  '      </PageSection>\n    </PageLayout>\n  ' +
                  content.slice(closingReturn);
      }
    }
    
    // Guardar archivo
    await fs.writeFile(filePath, content, 'utf-8');
    
    return { file: filename, status: 'migrated', title, subtitle, icon };
  } catch (error) {
    return { file: filename, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando migración automática a PageLayout...\n');
  
  const files = await fs.readdir(PAGES_DIR);
  const jsxFiles = files.filter(f => f.endsWith('.jsx') && !SKIP_PAGES.includes(f));
  
  console.log(`📁 Encontrados ${jsxFiles.length} archivos para procesar\n`);
  
  const results = {
    migrated: [],
    alreadyMigrated: [],
    errors: [],
    noFunction: []
  };
  
  for (const file of jsxFiles) {
    const filePath = path.join(PAGES_DIR, file);
    const result = await migratePage(filePath, file);
    
    switch (result.status) {
      case 'migrated':
        results.migrated.push(result);
        console.log(`✅ ${result.file} - "${result.title}"`);
        break;
      case 'already_migrated':
        results.alreadyMigrated.push(result);
        console.log(`⏭️  ${result.file} - Ya migrada`);
        break;
      case 'no_function_found':
        results.noFunction.push(result);
        console.log(`⚠️  ${result.file} - No se encontró función principal`);
        break;
      case 'error':
        results.errors.push(result);
        console.log(`❌ ${result.file} - Error: ${result.error}`);
        break;
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`   ✅ Migradas: ${results.migrated.length}`);
  console.log(`   ⏭️  Ya migradas: ${results.alreadyMigrated.length}`);
  console.log(`   ⚠️  Sin función: ${results.noFunction.length}`);
  console.log(`   ❌ Errores: ${results.errors.length}`);
  console.log(`   📈 Total procesado: ${jsxFiles.length}`);
  
  const totalSuccess = results.migrated.length + results.alreadyMigrated.length;
  console.log(`\n🎉 Progreso: ${totalSuccess}/${jsxFiles.length} páginas (${Math.round((totalSuccess/jsxFiles.length)*100)}%)`);
  
  // Guardar log detallado
  const logPath = path.join(__dirname, '../MIGRACION_LOG.json');
  await fs.writeFile(logPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Log guardado en: MIGRACION_LOG.json`);
}

main().catch(console.error);
