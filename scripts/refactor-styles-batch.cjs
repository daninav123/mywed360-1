#!/usr/bin/env node
/**
 * Script de refactorización masiva de inline styles
 * Automatiza patrones comunes detectados en el análisis
 */

const fs = require('fs');
const path = require('path');

// Patrones de reemplazo comunes
const REPLACEMENTS = [
  // Colores de texto
  { pattern: /style=\{\{\s*color:\s*'var\(--color-text\)'\s*\}\}/g, replacement: 'className="text-body"' },
  { pattern: /style=\{\{\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g, replacement: 'className="text-secondary"' },
  { pattern: /style=\{\{\s*color:\s*'var\(--color-muted\)'\s*\}\}/g, replacement: 'className="text-muted"' },
  { pattern: /style=\{\{\s*color:\s*'var\(--color-danger\)'\s*\}\}/g, replacement: 'className="text-danger"' },
  { pattern: /style=\{\{\s*color:\s*'var\(--color-success\)'\s*\}\}/g, replacement: 'className="text-success"' },
  { pattern: /style=\{\{\s*color:\s*'var\(--color-primary\)'\s*\}\}/g, replacement: 'className="text-primary"' },
  
  // Backgrounds
  { pattern: /style=\{\{\s*backgroundColor:\s*'var\(--color-surface\)'\s*\}\}/g, replacement: 'className="bg-surface"' },
  { pattern: /style=\{\{\s*backgroundColor:\s*'var\(--color-bg\)'\s*\}\}/g, replacement: 'className="bg-page"' },
  
  // Borders
  { pattern: /style=\{\{\s*borderColor:\s*'var\(--color-border\)'\s*\}\}/g, replacement: 'className="border-default"' },
  { pattern: /style=\{\{\s*borderColor:\s*'var\(--color-border-soft\)'\s*\}\}/g, replacement: 'className="border-soft"' },
  
  // Combinaciones en className con inline style separado
  { 
    pattern: /className="([^"]*?)"\s*style=\{\{\s*color:\s*'var\(--color-text\)'\s*\}\}/g, 
    replacement: 'className="$1 text-body"' 
  },
  { 
    pattern: /className="([^"]*?)"\s*style=\{\{\s*color:\s*'var\(--color-text-secondary\)'\s*\}\}/g, 
    replacement: 'className="$1 text-secondary"' 
  },
  { 
    pattern: /className="([^"]*?)"\s*style=\{\{\s*color:\s*'var\(--color-muted\)'\s*\}\}/g, 
    replacement: 'className="$1 text-muted"' 
  },
  { 
    pattern: /className="([^"]*?)"\s*style=\{\{\s*backgroundColor:\s*'var\(--color-surface\)'\s*\}\}/g, 
    replacement: 'className="$1 bg-surface"' 
  },
  { 
    pattern: /className="([^"]*?)"\s*style=\{\{\s*backgroundColor:\s*'var\(--color-bg\)'\s*\}\}/g, 
    replacement: 'className="$1 bg-page"' 
  },
];

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  const originalContent = content;
  
  for (const { pattern, replacement } of REPLACEMENTS) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      changed = true;
      content = newContent;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Contar cuántos inline styles quedan
    const remainingStyles = (content.match(/style=\{/g) || []).length;
    const removedStyles = (originalContent.match(/style=\{/g) || []).length - remainingStyles;
    
    return { changed: true, removed: removedStyles, remaining: remainingStyles };
  }
  
  return { changed: false };
}

function processDirectory(dirPath) {
  const stats = {
    filesProcessed: 0,
    filesChanged: 0,
    stylesRemoved: 0,
    stylesRemaining: 0,
  };
  
  function walk(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          walk(filePath);
        }
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        stats.filesProcessed++;
        const result = refactorFile(filePath);
        
        if (result.changed) {
          stats.filesChanged++;
          stats.stylesRemoved += result.removed;
          stats.stylesRemaining += result.remaining;
          console.log(`✅ ${filePath}: -${result.removed} styles (${result.remaining} quedan)`);
        }
      }
    }
  }
  
  walk(dirPath);
  return stats;
}

// Main
const pagesDir = path.join(__dirname, '../apps/main-app/src/pages');
console.log('🚀 Iniciando refactorización masiva de inline styles...\n');

const stats = processDirectory(pagesDir);

console.log('\n📊 RESUMEN:');
console.log(`   Archivos procesados: ${stats.filesProcessed}`);
console.log(`   Archivos modificados: ${stats.filesChanged}`);
console.log(`   Inline styles eliminados: ${stats.stylesRemoved}`);
console.log(`   Inline styles restantes: ${stats.stylesRemaining}`);
console.log('\n✨ Refactorización completada!');
