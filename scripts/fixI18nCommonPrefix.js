#!/usr/bin/env node
/**
 * Script para corregir el prefijo 'common.' en las llamadas a t()
 * 
 * Problema: Muchos componentes usan t('common.xxx') cuando deberían usar t('xxx')
 * porque ya están en el namespace 'common' por defecto.
 * 
 * Solución: Buscar y reemplazar todas las ocurrencias de t('common. por t('
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar todas las ocurrencias de t('common. o t("common.
    const hasCommonPrefix = /t\(['"]common\./g.test(content);
    
    if (!hasCommonPrefix) {
      return;
    }

    // Reemplazar t('common. por t(' y t("common. por t("
    let newContent = content;
    let replacements = 0;
    
    // Contar reemplazos
    const matches = content.match(/t\(['"]common\./g);
    if (matches) {
      replacements = matches.length;
    }
    
    // Hacer el reemplazo
    newContent = newContent.replace(/t\('common\./g, "t('");
    newContent = newContent.replace(/t\("common\./g, 't("');
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modifiedFiles++;
      totalReplacements += replacements;
      console.log(`✅ ${path.relative(SRC_DIR, filePath)} (${replacements} reemplazos)`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        totalFiles++;
        processFile(filePath);
      }
    }
  }
}

console.log('🔍 Buscando archivos con t(\'common.xxx\')...\n');
walkDir(SRC_DIR);

console.log('\n📊 Resumen:');
console.log(`   Archivos analizados: ${totalFiles}`);
console.log(`   Archivos modificados: ${modifiedFiles}`);
console.log(`   Total de reemplazos: ${totalReplacements}`);

if (modifiedFiles > 0) {
  console.log('\n✅ Corrección completada exitosamente');
  console.log('💡 Ahora recarga tu navegador para ver los cambios');
} else {
  console.log('\n✅ No se encontraron archivos que necesiten corrección');
}
