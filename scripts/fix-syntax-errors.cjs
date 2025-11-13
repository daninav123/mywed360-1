#!/usr/bin/env node

/**
 * Script para corregir errores de sintaxis causados por console.logs comentados
 * Elimina las líneas completas de console.logs multi-línea
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Archivos con errores detectados por ESLint
const FILES_TO_FIX = [
  'src/components/ChatWidget.jsx',
  'src/components/HomePage.jsx',
  'src/components/proveedores/RFQModal.jsx',
  'src/components/proveedores/ai/AIResultList.jsx',
  'src/components/seating/SeatingPlanModern.jsx',
  'src/components/suppliers/RecommendedSuppliers.jsx',
  'src/components/suppliers/SupplierCard.jsx',
  'src/components/suppliers/SupplierProtectedRoute.jsx',
  'src/components/tasks/TasksRefactored.jsx',
  'src/components/wedding/WeddingServicesOverview.jsx',
  'src/context/WeddingContext.jsx',
  'src/debug/supplierSearchDebug.js',
  'src/features/seating/SeatingCanvas.jsx',
  'src/firebaseConfig.jsx',
  'src/hooks/useAISearch.jsx',
  'src/hooks/useAuth.jsx',
  'src/hooks/useFallbackReporting.js',
  'src/hooks/useFinance.js',
  'src/hooks/useSeatingSync.js',
  'src/hooks/useWeddingCollection.js',
  'src/pages/Ideas.jsx',
  'src/pages/Invitados.jsx',
  'src/pages/Momentos.jsx',
  'src/pages/SupplierRegistration.jsx',
  'src/pages/disenos/VectorEditor.jsx',
  'src/pages/suppliers/SupplierPortfolio.jsx',
  'src/pages/suppliers/SupplierProducts.jsx',
  'src/pages/suppliers/SupplierRequestsNew.jsx',
  'src/services/EmailTemplateService.js',
  'src/services/GamificationService.js',
  'src/services/apiClient.js',
  'src/services/blogService.js',
  'src/services/storageUploadService.js',
  'src/services/supplierCategoryClassifier.js',
  'src/services/suppliersService.js',
  'src/services/whatsappService.js',
  'src/utils/performanceDiagnostic.js',
  'apps/main-app/src/services/storageUploadService.js',
  'apps/main-app/src/services/supplierCategoryClassifier.js',
  'apps/main-app/src/services/suppliersService.js',
  'apps/main-app/src/services/webSearchService.js',
  'apps/main-app/src/services/whatsappService.js',
  'apps/main-app/src/utils/performanceDiagnostic.js'
];

let stats = {
  filesProcessed: 0,
  filesFixed: 0,
  linesRemoved: 0
};

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  const lines = content.split('\n');
  const fixedLines = [];
  
  let i = 0;
  let linesRemovedInFile = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detectar console.log comentado que inicia un bloque multi-línea
    if (trimmed.startsWith('// console.log(') || 
        trimmed.startsWith('// console.error(') ||
        trimmed.startsWith('// console.warn(') ||
        trimmed.startsWith('// console.info(')) {
      
      // Buscar el cierre del paréntesis
      let depth = 0;
      let inString = false;
      let stringChar = null;
      let foundOpening = false;
      
      // Contar paréntesis en la primera línea
      for (let char of trimmed) {
        if (char === '"' || char === "'" || char === '`') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
        }
        if (!inString) {
          if (char === '(') {
            depth++;
            foundOpening = true;
          }
          else if (char === ')') depth--;
        }
      }
      
      // Si no está balanceado, eliminar todas las líneas hasta el cierre
      if (foundOpening && depth > 0) {
        linesRemovedInFile++;
        let j = i + 1;
        
        // Buscar el cierre
        while (j < lines.length && depth > 0) {
          const nextLine = lines[j];
          for (let char of nextLine) {
            if (char === '"' || char === "'" || char === '`') {
              if (!inString) {
                inString = true;
                stringChar = char;
              } else if (char === stringChar) {
                inString = false;
              }
            }
            if (!inString) {
              if (char === '(') depth++;
              else if (char === ')') depth--;
            }
          }
          linesRemovedInFile++;
          j++;
        }
        
        // Saltar todas estas líneas
        i = j;
        continue;
      }
    }
    
    fixedLines.push(line);
    i++;
  }
  
  const newContent = fixedLines.join('\n');
  
  if (newContent !== originalContent) {
    stats.filesFixed++;
    stats.linesRemoved += linesRemovedInFile;
    
    console.log(`✅ ${filePath} - ${linesRemovedInFile} líneas eliminadas`);
    
    if (!DRY_RUN) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
    }
  }
  
  stats.filesProcessed++;
}

function main() {
  console.log('🔧 Corrigiendo errores de sintaxis...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  Modo DRY RUN - No se harán cambios\n');
  }
  
  const startTime = Date.now();
  
  FILES_TO_FIX.forEach(file => {
    fixFile(file);
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Estadísticas:');
  console.log('================');
  console.log(`✅ Archivos procesados: ${stats.filesProcessed}`);
  console.log(`🔧 Archivos corregidos: ${stats.filesFixed}`);
  console.log(`🗑️  Líneas eliminadas: ${stats.linesRemoved}`);
  console.log(`⏱️  Tiempo: ${duration}s`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para aplicar los cambios, ejecuta sin --dry-run');
  } else {
    console.log('\n✅ Errores de sintaxis corregidos');
  }
}

main();
