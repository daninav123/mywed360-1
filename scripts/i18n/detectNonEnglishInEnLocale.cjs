#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/en');

const SPANISH_PATTERNS = [
  /ñ/i,
  /á|é|í|ó|ú/i,
  /¿|¡/,
  /(añadir|agregar|eliminar|guardar|cancelar|buscar|siguiente|anterior|continuar|volver|cerrar|abrir|editar|crear|actualizar|configurar|gestión|configuración|inicio|invitados|proveedores|finanzas|tareas|perfil|correo|diseños|contratos|boda|sesión)/i,
];

const COMMON_NON_ENGLISH_WORDS = {
  // Spanish
  'Añadir': 'Add',
  'Guardar': 'Save',
  'Eliminar': 'Delete',
  'Cancelar': 'Cancel',
  'Buscar': 'Search',
  'Siguiente': 'Next',
  'Anterior': 'Previous',
  'Continuar': 'Continue',
  'Volver': 'Back',
  'Cerrar': 'Close',
  'Abrir': 'Open',
  'Editar': 'Edit',
  'Crear': 'Create',
  'Actualizar': 'Update',
  'Cargando': 'Loading',
  'Éxito': 'Success',
  'Error': 'Error',
  'Sí': 'Yes',
  'No': 'No',
  'Filtrar': 'Filter',
  'Finalizar': 'Finish',
  'Inicio': 'Home',
  'Panel': 'Dashboard',
  'Invitados': 'Guests',
  'Proveedores': 'Providers',
  'Finanzas': 'Finance',
  'Tareas': 'Tasks',
  'Perfil': 'Profile',
  'Configuración': 'Settings',
  'Correo': 'Email',
  'Diseños': 'Designs',
  'Contratos': 'Contracts',
  'Boda': 'Wedding',
  'Sesión': 'Session',
  'Gestión': 'Management',
  'Usuario': 'User',
  'Usuarios': 'Users',
  'Papelera': 'Trash',
  'Borradores': 'Drafts',
  'Enviados': 'Sent',
  'Distribución': 'Distribution',
  'Mesa': 'Table',
  'Mesas': 'Tables',
  'Transacción': 'Transaction',
  'Transacciones': 'Transactions',
  'Ingresos': 'Income',
  'Gastos': 'Expenses',
  'Vence': 'Due',
  'Pendiente': 'Pending',
  'Confirmada': 'Confirmed',
  'Aportaciones': 'Contributions',
  'Presupuesto': 'Budget',
  'Categoría': 'Category',
  'Consejos': 'Tips',
  'Configurar': 'Configure',
  'Asignar': 'Assign',
  'Automática': 'Automatic',
  'Nueva': 'New',
  'Nuevo': 'New',
  'Editar': 'Edit',
  'Ver': 'View',
  'Concepto': 'Concept',
  'Monto': 'Amount',
  'Tipo': 'Type',
  'Obligatorio': 'Required',
  'Sugerencias': 'Suggestions',
  'Calculando': 'Calculating',
  'Aplicar': 'Apply',
  'Mediana': 'Median',
  'Cronograma': 'Schedule',
  'Mensual': 'Monthly',
  'Cambios': 'Changes',
  'Sin': 'Without',
  'Vincular': 'Link',
  'Vinculada': 'Linked',
  'Cuenta': 'Account',
  'Banco': 'Bank',
  'Requisitos': 'Requirements',
  'Selecciona': 'Select',
  'Activa': 'Active',
  'Estado': 'Status',
  'Título': 'Title',
  'Incluye': 'Includes',
  'Regalos': 'Gifts',
  'Familiares': 'Family',
  'Padres': 'Parents',
  'Total': 'Total',
  'Nombre': 'Name',
  'Ayuda': 'Help',
  'Filas': 'Rows',
  'Errores': 'Errors',
  'Consultar': 'Query',
  'Actualizar': 'Update',
  'Recomendación': 'Recommendation',
  'Consejos Financieros': 'Financial Tips',
  'Asientos': 'Seats',
  'Sillas': 'Chairs',
  'Bloquear': 'Lock',
  'Padrinos': 'Godparents',
  'Reservar': 'Reserve',
  'Banquete': 'Banquet',
};

function detectNonEnglish(value, key, filePath) {
  if (typeof value !== 'string') return null;
  if (value.trim() === '') return null;

  for (const pattern of SPANISH_PATTERNS) {
    if (pattern.test(value)) {
      const suggestion = COMMON_NON_ENGLISH_WORDS[value] || 
                        COMMON_NON_ENGLISH_WORDS[value.toLowerCase()] ||
                        COMMON_NON_ENGLISH_WORDS[value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()];
      
      return {
        key,
        value,
        file: path.basename(filePath),
        suggestion: suggestion || '❓ (needs manual translation)',
        pattern: pattern.toString(),
      };
    }
  }

  return null;
}

function traverseObject(obj, callback, currentPath = '', filePath = '') {
  const issues = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      issues.push(...traverseObject(value, callback, fullPath, filePath));
    } else if (typeof value === 'string') {
      const issue = callback(value, fullPath, filePath);
      if (issue) {
        issues.push(issue);
      }
    }
  }

  return issues;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    return traverseObject(data, detectNonEnglish, '', filePath);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(directory) {
  const allIssues = [];
  const files = fs.readdirSync(directory);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    if (file.includes('.bak')) continue;
    if (file.includes('.backup')) continue;

    const filePath = path.join(directory, file);
    const issues = analyzeFile(filePath);
    allIssues.push(...issues);
  }

  return allIssues;
}

function generateReport(issues) {
  console.log('\n=== NON-ENGLISH TEXTS IN EN LOCALE ===\n');
  
  if (issues.length === 0) {
    console.log('✅ No non-English texts found in English locale files!\n');
    return;
  }

  console.log(`Found ${issues.length} potential non-English texts:\n`);

  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`\n📄 ${file} (${fileIssues.length} issues)`);
    console.log('─'.repeat(60));
    
    for (const issue of fileIssues) {
      console.log(`\n  Key: ${issue.key}`);
      console.log(`  Current: "${issue.value}"`);
      console.log(`  Suggested: "${issue.suggestion}"`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nTotal: ${issues.length} non-English texts found`);
  console.log('\n');
}

function fixFile(filePath, issues) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);
    
    let fixedCount = 0;
    
    for (const issue of issues) {
      if (issue.suggestion && !issue.suggestion.includes('❓')) {
        const pathParts = issue.key.split('.');
        let current = data;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (current[pathParts[i]] === undefined) {
            current = null;
            break;
          }
          current = current[pathParts[i]];
        }
        
        if (current && current[pathParts[pathParts.length - 1]] === issue.value) {
          current[pathParts[pathParts.length - 1]] = issue.suggestion;
          fixedCount++;
        }
      }
    }
    
    if (fixedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Fixed ${fixedCount} issues in ${path.basename(filePath)}`);
    }
    
    return fixedCount;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

function fixAllIssues(directory, issues) {
  console.log('\n=== FIXING NON-ENGLISH TEXTS ===\n');
  
  const byFile = {};
  for (const issue of issues) {
    const filePath = path.join(directory, issue.file);
    if (!byFile[filePath]) {
      byFile[filePath] = [];
    }
    byFile[filePath].push(issue);
  }
  
  let totalFixed = 0;
  for (const [filePath, fileIssues] of Object.entries(byFile)) {
    const fixed = fixFile(filePath, fileIssues);
    totalFixed += fixed;
  }
  
  console.log(`\n✅ Total fixed: ${totalFixed} texts`);
  
  const unfixable = issues.filter(i => !i.suggestion || i.suggestion.includes('❓'));
  if (unfixable.length > 0) {
    console.log(`\n⚠️  ${unfixable.length} texts need manual translation`);
    console.log('\nTexts that need manual review:');
    for (const issue of unfixable) {
      console.log(`  - ${issue.file}: ${issue.key} = "${issue.value}"`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  if (!fs.existsSync(EN_LOCALE_DIR)) {
    console.error(`Error: Directory not found: ${EN_LOCALE_DIR}`);
    process.exit(1);
  }

  console.log(`Scanning: ${EN_LOCALE_DIR}`);
  const issues = scanDirectory(EN_LOCALE_DIR);
  
  generateReport(issues);
  
  if (shouldFix && issues.length > 0) {
    fixAllIssues(EN_LOCALE_DIR, issues);
    console.log('\n✅ Done! Re-run without --fix to see remaining issues.\n');
  } else if (issues.length > 0) {
    console.log('💡 Run with --fix flag to automatically fix texts with known translations:\n');
    console.log('   node scripts/i18n/detectNonEnglishInEnLocale.js --fix\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { detectNonEnglish, analyzeFile, scanDirectory };
