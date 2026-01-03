#!/usr/bin/env node
/**
 * Script para verificar vulnerabilidades XSS en el proyecto
 * Busca uso de dangerouslySetInnerHTML sin sanitización
 * 
 * Uso: node scripts/check-xss-vulnerabilities.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

console.log('\n🛡️  Análisis de Vulnerabilidades XSS\n');
console.log('=====================================\n');

const results = {
  total: 0,
  safe: 0,
  unsafe: 0,
  unknown: 0,
  files: []
};

/**
 * Buscar archivos recursivamente
 */
function findFiles(dir, ext = ['.jsx', '.js']) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Ignorar directorios específicos
          if (['node_modules', 'dist', '.git', 'build'].includes(item)) {
            continue;
          }
          files = files.concat(findFiles(fullPath, ext));
        } else if (ext.some(e => fullPath.endsWith(e))) {
          files.push(fullPath);
        }
      } catch {}
    }
  } catch {}
  
  return files;
}

/**
 * Analizar archivo en busca de dangerouslySetInnerHTML
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Buscar dangerouslySetInnerHTML
    const dangerousLines = [];
    lines.forEach((line, index) => {
      if (line.includes('dangerouslySetInnerHTML')) {
        dangerousLines.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    if (dangerousLines.length === 0) {
      return null;
    }
    
    // Verificar si el archivo importa DOMPurify
    const hasDOMPurify = content.includes('DOMPurify') || 
                         content.includes('dompurify');
    
    // Verificar si usa sanitize en cada caso
    const usages = dangerousLines.map(({ line, content: lineContent }) => {
      // Buscar contexto alrededor de la línea
      const startLine = Math.max(0, line - 5);
      const endLine = Math.min(lines.length, line + 2);
      const context = lines.slice(startLine, endLine).join('\n');
      
      const hasSanitize = context.includes('sanitize') || 
                          context.includes('DOMPurify') ||
                          context.includes('clean');
      
      return {
        line,
        content: lineContent,
        safe: hasSanitize,
        status: hasSanitize ? '✅ SEGURO' : '❌ VULNERABLE'
      };
    });
    
    const allSafe = usages.every(u => u.safe);
    const allUnsafe = usages.every(u => !u.safe);
    
    return {
      file: path.relative(rootDir, filePath),
      hasDOMPurify,
      usages,
      status: allSafe ? 'safe' : allUnsafe ? 'unsafe' : 'mixed'
    };
    
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Analizar todos los archivos
 */
function analyzeProject() {
  console.log('🔍 Buscando archivos con dangerouslySetInnerHTML...\n');
  
  const files = findFiles(srcDir);
  console.log(`📁 Analizando ${files.length} archivos...\n`);
  
  for (const file of files) {
    const analysis = analyzeFile(file);
    if (analysis) {
      results.total++;
      results.files.push(analysis);
      
      if (analysis.status === 'safe') {
        results.safe++;
      } else if (analysis.status === 'unsafe') {
        results.unsafe++;
      } else {
        results.unknown++;
      }
    }
  }
}

/**
 * Mostrar resultados
 */
function displayResults() {
  console.log('📊 Resultados del Análisis\n');
  console.log('=====================================\n');
  
  console.log(`Total de archivos con dangerouslySetInnerHTML: ${results.total}\n`);
  console.log(`  ✅ Seguros (con sanitización):    ${results.safe}`);
  console.log(`  ⚠️  Mixtos (algunos sin sanitizar): ${results.unknown}`);
  console.log(`  ❌ Vulnerables (sin sanitización): ${results.unsafe}\n`);
  
  if (results.unsafe === 0 && results.unknown === 0) {
    console.log('🎉 ¡Excelente! Todos los usos están sanitizados.\n');
    return;
  }
  
  console.log('=====================================\n');
  console.log('📝 Detalle de Archivos\n');
  
  // Primero mostrar los vulnerables
  const vulnerableFiles = results.files.filter(f => f.status === 'unsafe');
  if (vulnerableFiles.length > 0) {
    console.log('❌ ARCHIVOS VULNERABLES (Acción Urgente):\n');
    
    for (const file of vulnerableFiles) {
      console.log(`\n  📄 ${file.file}`);
      console.log(`     DOMPurify importado: ${file.hasDOMPurify ? '✅ Sí' : '❌ No'}`);
      console.log(`     Usos encontrados: ${file.usages.length}\n`);
      
      for (const usage of file.usages) {
        console.log(`     Línea ${usage.line}: ${usage.status}`);
        console.log(`       ${usage.content.substring(0, 80)}${usage.content.length > 80 ? '...' : ''}\n`);
      }
    }
  }
  
  // Luego los mixtos
  const mixedFiles = results.files.filter(f => f.status === 'mixed');
  if (mixedFiles.length > 0) {
    console.log('\n⚠️  ARCHIVOS MIXTOS (Revisar):\n');
    
    for (const file of mixedFiles) {
      console.log(`\n  📄 ${file.file}`);
      console.log(`     DOMPurify importado: ${file.hasDOMPurify ? '✅ Sí' : '❌ No'}`);
      
      const unsafeUsages = file.usages.filter(u => !u.safe);
      console.log(`     Usos vulnerables: ${unsafeUsages.length} de ${file.usages.length}\n`);
      
      for (const usage of unsafeUsages) {
        console.log(`     Línea ${usage.line}: ${usage.status}`);
        console.log(`       ${usage.content.substring(0, 80)}${usage.content.length > 80 ? '...' : ''}\n`);
      }
    }
  }
  
  // Finalmente los seguros (solo resumen)
  const safeFiles = results.files.filter(f => f.status === 'safe');
  if (safeFiles.length > 0) {
    console.log('\n✅ ARCHIVOS SEGUROS:\n');
    for (const file of safeFiles) {
      console.log(`   ✅ ${file.file} (${file.usages.length} uso${file.usages.length > 1 ? 's' : ''})`);
    }
    console.log('');
  }
  
  console.log('=====================================\n');
  console.log('💡 Recomendaciones:\n');
  
  if (results.unsafe > 0 || results.unknown > 0) {
    console.log('1. Instalar DOMPurify (si no está):');
    console.log('   npm install dompurify\n');
    
    console.log('2. Importar en cada archivo:');
    console.log('   import DOMPurify from \'dompurify\';\n');
    
    console.log('3. Sanitizar SIEMPRE antes de usar dangerouslySetInnerHTML:');
    console.log('   <div dangerouslySetInnerHTML={{ ');
    console.log('     __html: DOMPurify.sanitize(htmlContent, {');
    console.log('       ALLOWED_TAGS: [\'p\', \'br\', \'b\', \'i\', \'u\', \'a\'],');
    console.log('       ALLOWED_ATTR: [\'href\', \'target\']');
    console.log('     })');
    console.log('   }} />\n');
    
    console.log('4. Para emails HTML, permitir más tags:');
    console.log('   DOMPurify.sanitize(emailHtml, {');
    console.log('     ALLOWED_TAGS: [\'p\', \'div\', \'br\', \'b\', \'i\', \'u\', \'a\', \'img\', \'span\'],');
    console.log('     ALLOWED_ATTR: [\'href\', \'src\', \'alt\', \'style\', \'class\']');
    console.log('   })\n');
  }
  
  console.log('=====================================\n');
  
  if (results.unsafe > 0) {
    console.log('⚠️  ACCIÓN REQUERIDA: Corregir archivos vulnerables antes de deploy.\n');
    process.exit(1);
  } else if (results.unknown > 0) {
    console.log('⚠️  REVISAR: Algunos archivos tienen usos mixtos.\n');
    process.exit(0);
  } else {
    console.log('✅ Todo correcto. No se encontraron vulnerabilidades XSS.\n');
    process.exit(0);
  }
}

// Ejecutar análisis
analyzeProject();
displayResults();
