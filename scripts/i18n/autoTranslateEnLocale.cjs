#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/en');

const SPANISH_PATTERNS = [
  /ñ/i,
  /á|é|í|ó|ú|ü/i,
  /¿|¡/,
];

const TRANSLATIONS = {
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
  'Sí': 'Yes',
  'Filtrar': 'Filter',
  'Finalizar': 'Finish',
  'Tareas': 'Tasks',
  'categoría': 'category',
  'Categorías': 'Categories',
  
  'Gestión de usuarios': 'User Management',
  'Nuevo usuario': 'New User',
  'Editar usuario': 'Edit User',
  'Eliminar usuario': 'Delete User',
  'Administrador': 'Administrator',
  'Propietario': 'Owner',
  'Invitado': 'Guest',
  'Ver detalles': 'View Details',
  'Acciones': 'Actions',
  'Última conexión': 'Last Login',
  'Creado': 'Created',
  'Sin usuarios': 'No Users',
  'Crear primer usuario': 'Create First User',
  'Buscar usuarios...': 'Search users...',
  'Roles': 'Roles',
  'Administración': 'Administration',
  'Miembros del equipo': 'Team Members',
  'Agregar miembro': 'Add Member',
  'Invitar por correo': 'Invite by Email',
  
  'Buscar correos...': 'Search emails...',
  'No hay correos': 'No Emails',
  'Para': 'To',
  'Asunto': 'Subject',
  'Mensaje': 'Message',
  'Enviar': 'Send',
  'Enviando': 'Sending',
  'Correo enviado': 'Email Sent',
  'Error enviando correo': 'Error Sending Email',
  'Adjuntar archivo': 'Attach File',
  'Adjuntos': 'Attachments',
  
  'Gestión financiera': 'Financial Management',
  'Nueva Transacción': 'New Transaction',
  'Crear primera transacción': 'Create First Transaction',
  'Buscar por concepto...': 'Search by concept...',
  'Todas las categorías': 'All Categories',
  'Todos los proveedores': 'All Providers',
  'Todos los días': 'All Days',
  'Últimos 30 días': 'Last 30 Days',
  'Últimos 90 días': 'Last 90 Days',
  'Solo sin categoría': 'Only Uncategorized',
  'Transacción guardada': 'Transaction Saved',
  'Transacción eliminada': 'Transaction Deleted',
  'Error eliminando transacción:': 'Error Deleting Transaction:',
  'Error inesperado al guardar la transacción': 'Unexpected Error Saving Transaction',
  'Sin concepto': 'No Concept',
  'Sin categoría': 'Uncategorized',
  'Pagos próximos (7 días):': 'Upcoming Payments (7 days):',
  'Descripción': 'Description',
  '¿Eliminar esta transacción?': 'Delete This Transaction?',
  'Transacción creada': 'Transaction Created',
  'No se pudo eliminar': 'Could Not Delete',
  'Editar transacción': 'Edit Transaction',
  'Importación parcial': 'Partial Import',
  'Importación completada': 'Import Completed',
  'Importación no disponible': 'Import Not Available',
  'Error al guardar': 'Error Saving',
  'Transacción actualizada': 'Transaction Updated',
  'Análisis Financiero': 'Financial Analysis',
  'Visualizaciones y tendencias de tus finanzas de boda': 'Visualizations and Trends of Your Wedding Finances',
  'Categorías Activas': 'Active Categories',
  'Presupuesto vs Gastado por Categoría': 'Budget vs Spent by Category',
  'Distribucin de Gastos por Categoría': 'Expense Distribution by Category',
  'Progreso del Presupuesto por Categoría': 'Budget Progress by Category',
  'Más Eficiente': 'Most Efficient',
  'Porcentaje de uso y exceso por categoría': 'Usage Percentage and Excess by Category',
  'Compara lo asignado vs lo gastado por categoría': 'Compare Allocated vs Spent by Category',
  'Proporción de cada categoría en el total de gastos': 'Proportion of Each Category in Total Expenses',
  'Análisis automático de tus finanzas': 'Automatic Analysis of Your Finances',
  'Cargando análisis…': 'Loading Analysis…',
  'Evolución de ingresos, gastos y balance mes a mes': 'Evolution of Income, Expenses and Balance Month by Month',
  'Selecciona una boda activa': 'Select an Active Wedding',
  'No se pudo guardar la cuenta': 'Could Not Save Account',
  'Alternativa temporal: importa movimientos manualmente desde Finanzas  Transacciones  "Importar Banco".': 'Temporary Alternative: Import Transactions Manually from Finance → Transactions → "Import Bank".',
  'Gestión de presupuesto': 'Budget Management',
  'Organiza y controla el presupuesto por categorías': 'Organize and Control Budget by Categories',
  'Nueva categoría': 'New Category',
  'Categorías de presupuesto': 'Budget Categories',
  'No hay categorías de presupuesto': 'No Budget Categories',
  'Crear primera categoría': 'Create First Category',
  'Editar categoría': 'Edit Category',
  'Nombre de la categoría': 'Category Name',
  'Ej.: Catering, música, flores...': 'E.g.: Catering, Music, Flowers...',
  'El nombre de la categoría es obligatorio': 'Category Name is Required',
  'El monto debe ser un número válido': 'Amount Must Be a Valid Number',
  'Ests seguro de eliminar la categoría "{{category}}"?': 'Are You Sure You Want to Delete the Category "{{category}}"?',
  'No se pudo actualizar la recomendacin.': 'Could Not Update Recommendation.',
  'Crea categorías para organizar tu presupuesto de boda': 'Create Categories to Organize Your Wedding Budget',
  'Sugerencias de presupuesto basadas en bodas similares': 'Budget Suggestions Based on Similar Weddings',
  'Guardar presupuesto': 'Save Budget',
  'Pagos próximos (45 días)': 'Upcoming Payments (45 days)',
  'Sin pagos pendientes en las próximas semanas.': 'No Pending Payments in the Coming Weeks.',
  'Necesitamos más historial para calcular la tendencia.': 'We Need More History to Calculate the Trend.',
  '¿Eliminar esta aportación?': 'Delete This Contribution?',
  'Número de invitados': 'Number of Guests',
  'Haz clic en el icono para cargar automáticamente desde tu lista de invitados': 'Click the Icon to Load Automatically from Your Guest List',
  'Estimación de Regalos': 'Gift Estimation',
  'Guardar Cambios': 'Save Changes',
  'Proyección total basada en tus configuraciones': 'Total Projection Based on Your Settings',
  'Mantén un balance justo entre las aportaciones de ambas personas.': 'Maintain a Fair Balance Between Both People\'s Contributions.',
  'Es mejor subestimar los regalos de boda que sobreestimarlos.': 'It\'s Better to Underestimate Wedding Gifts Than Overestimate Them.',
  'Configuración de Aportaciones': 'Contributions Settings',
  'Tienes cambios sin guardar': 'You Have Unsaved Changes',
  'Actualizar Invitados': 'Update Guests',
  'Error en Gestión financiera': 'Error in Financial Management',
  '🔴 Críticas (>90%)': '🔴 Critical (>90%)',
  '✅ Categorías OK': '✅ Categories OK',
  'Próximos 7d': 'Next 7d',
  'Fecha límite': 'Due Date',
  'Atención: este pago está vencido.': 'Attention: This Payment is Overdue.',
  'Método de pago': 'Payment Method',
  'Selecciona un método': 'Select a Method',
  'Identifica con quién se contrata o de dónde proviene el dinero.': 'Identify Who You Contract With or Where the Money Comes From.',
  'La categoría es obligatoria': 'Category is Required',
  'El monto abonado debe ser un número positivo': 'The Amount Paid Must Be a Positive Number',
  
  'Distribución de Mesas': 'Table Distribution',
  'Editar mesa': 'Edit Table',
  'Eliminar mesa': 'Delete Table',
  'Asignar invitados': 'Assign Guests',
  'Asignación automática': 'Automatic Assignment',
  'Crear primera mesa': 'Create First Table',
  'Configurar Ceremonia': 'Configure Ceremony',
  'Guardar configuración': 'Save Configuration',
  'Configurar Banquete': 'Configure Banquet',
  
  'Editar tarea': 'Edit Task',
  'Eliminar tarea': 'Delete Task',
  'Buscar tareas...': 'Search tasks...',
  'No hay tareas': 'No Tasks',
  'Crear primera tarea': 'Create First Task',
  'Confirmar menúú final con catering': 'Confirm Final Menu with Catering',
  'Revisar decoración floral': 'Review Floral Decoration',
  'Coordinar horarios con fotógrafo': 'Coordinate Schedules with Photographer',
  'Verificar transporte para invitados': 'Verify Guest Transportation',
  'Confirmar menúú infantil': 'Confirm Kids Menu',
  
  'Valeria & Tomás Wedding': 'Valeria & Tomás Wedding',
  'María González': 'María González',
  'Ana Martínez': 'Ana Martínez',
  'https://planivia.net/para-proveedores': 'https://planivia.net/for-suppliers',
  
  'Analíticas': 'Analytics',
  'Configuración actualizada': 'Settings Updated',
  'Error en la operación': 'Operation Error',
  
  'se canceló un intento previo de home de sesión. vuelve a intentarlo.': 'a previous login attempt was cancelled. please try again.',
  'el code ha expirado. vuelve a iniciar sesión.': 'the code has expired. please log in again.',
  'code inválido.': 'invalid code.',
  'email o password no válidos': 'invalid email or password',
  'este dominio no está autorizado en la consola de firebase. contacta with support técnico.': 'this domain is not authorized in the firebase console. contact technical support.',
  'se ha enviado el código de verificación al correo electrónico': 'verification code has been sent to email',
  'autenticación exitosa': 'authentication successful',
  'error al autenticar': 'authentication error',
  'sesión expirada': 'session expired',
  'credenciales inválidas': 'invalid credentials',
  'usuario no encontrado': 'user not found',
  'contraseña incorrecta': 'incorrect password',
  
  'Fotografía': 'Photography',
  'Música': 'Music',
  'Música/DJ': 'Music/DJ',
  'Decoración': 'Decoration',
  'Lugar de celebración': 'Venue',
  'Vídeo': 'Video',
  'Catering': 'Catering',
  
  'Análisis': 'Analysis',
  'Última sincronización': 'Last Sync',
  'Sin conexión': 'Offline',
  'Estado del Presupuesto por Categorías': 'Budget Status by Categories',
  'Categorías en riesgo': 'Categories at Risk',
  'en riesgo': 'at risk',
  'sobrepasado': 'exceeded',
  'dentro del presupuesto': 'within budget',
  'Resumen del Balance': 'Balance Summary',
  'Balance actual': 'Current Balance',
  'Ingresos totales': 'Total Income',
  'Gastos totales': 'Total Expenses',
  'Pendiente de pago': 'Pending Payment',
  'Presupuesto restante': 'Remaining Budget',
  'Presupuesto total': 'Total Budget',
  'Gastado': 'Spent',
  'Disponible': 'Available',
  'Porcentaje usado': 'Percentage Used',
  'Excedido': 'Exceeded',
  'Vencido': 'Overdue',
  'Por vencer': 'Due Soon',
  'Pagado': 'Paid',
  'No pagado': 'Unpaid',
  
  'ya existe una account with este email asociada a otro proveedor. inicia session with el provider original y vincúlalo desde tu perfil.': 'an account with this email already exists associated with another provider. log in with the original provider and link it from your profile.',
  'no fue posible iniciar sesión. inténtalo de nuevo.': 'could not log in. please try again.',
  'no fue posible validar el código. inténtalo de nuevo.': 'could not validate the code. please try again.',
  'no hay un desafío mfa activo.': 'no active mfa challenge.',
  'no hay un desafío mfa activo. vuelve a iniciar sesión.': 'no active mfa challenge. please log in again.',
  'expiró el tiempo de espera. inténtalo de nuevo.': 'timeout expired. please try again.',
  'sesión cerrada': 'session closed',
  'demasiados intentos fallidos': 'too many failed attempts',
  'cuenta deshabilitada': 'account disabled',
  'cuenta bloqueada temporalmente': 'account temporarily locked',
  
  'Coordinacin día B': 'Day-of Coordination',
  'María': 'Maria',
  
  'Saldo proyectado día de la boda': 'Projected Balance on Wedding Day',
  'Punto de balance mínimo': 'Minimum Balance Point',
  'Basado en la media móvil de los últimos seis meses.': 'Based on the Moving Average of the Last Six Months.',
  'Analítica predictiva': 'Predictive Analytics',
  'Balance el día de la boda': 'Balance on Wedding Day',
  'Esperado': 'Expected',
  'Flujo de caja mensual (12 meses)': 'Monthly Cash Flow (12 months)',
  'Mes': 'Month',
  'Tendencia de ingresos y gastos': 'Income and Expense Trends',
  'Últimos 6 meses': 'Last 6 Months',
  'Próximos 6 meses (proyección)': 'Next 6 Months (Projection)',
  'mes': 'month',
  'Proyección': 'Projection',
  
  'introduce el code de verificación.': 'enter the verification code.',
  'el navegador bloqueó la ventana emergente. permite las ventanas emergentes e inténtalo de nuevo.': 'the browser blocked the pop-up window. allow pop-ups and try again.',
  'no se pudo completar la operación administrativa.': 'could not complete the administrative operation.',
  'no se pudo iniciar sesión.': 'could not log in.',
  'la ventana de autenticación se cerró before de completar el proceso.': 'the authentication window was closed before completing the process.',
  
  'Proyección financiera': 'Financial Projection',
  'Días en riesgo': 'Days at Risk',
  'Pagos próximos': 'Upcoming Payments',
  'Tipo de transacción': 'Transaction Type',
  'Selecciona una categoría': 'Select a Category',
  'Proveedor/Origen': 'Provider/Source',
  'Sin proveedor': 'No Provider',
  'Abonado': 'Paid',
  
  'Descripción adicional': 'Additional Description',
  'Detalles adicionales sobre la transacción...': 'Additional Details About the Transaction...',
  'El monto debe ser un número positivo': 'Amount Must Be a Positive Number',
  
  'Editar usuario': 'Edit User',
  'Eliminar usuario': 'Delete User',
  'Buscar correos...': 'Search emails...',
  'No hay correos': 'No Emails',
  'Correo enviado correctamente': 'Email Sent Successfully',
  'Correo eliminado': 'Email Deleted',
  'Error al enviar el correo': 'Error Sending Email',
  'Control total del presupuesto y los gastos de tu boda': 'Complete Control of Your Wedding Budget and Expenses',
  'Ej: Pago de catering, Regalo de boda...': 'E.g.: Catering Payment, Wedding Gift...',
  'Adjunta facturas, contratos o recibos para tenerlos a mano.': 'Attach Invoices, Contracts or Receipts to Have Them at Hand.',
  'Todos los proveedores': 'All Providers',
  'Visualizaciones y tendencias de tus finanzas de boda': 'Visualizations and Trends of Your Wedding Finances',
  'Alternativa temporal: importa movimientos manualmente desde Finanzas  Transacciones  "Importar Banco".': 'Temporary Alternative: Import Transactions Manually from Finance → Transactions → "Import Bank".',
  'No se pudo actualizar la recomendacin.': 'Could Not Update Recommendation.',
  'Editar mesa': 'Edit Table',
  'Eliminar mesa': 'Delete Table',
  'Asignar invitados': 'Assign Guests',
  'Crear primera mesa': 'Create First Table',
  'Configurar Ceremonia': 'Configure Ceremony',
  'Configurar Banquete': 'Configure Banquet',
  'Editar tarea': 'Edit Task',
  'Eliminar tarea': 'Delete Task',
  'No hay tareas': 'No Tasks',
  'Crear primera tarea': 'Create First Task',
  'Verificar transporte para invitados': 'Verify Guest Transportation',
  
  'Enviados': 'Sent',
  'Borradores': 'Drafts',
  'Papelera': 'Trash',
  'Nueva mesa': 'New Table',
  'Nuevo usuario': 'New User',
  'Nueva tarea': 'New Task',
  'Buscar tareas...': 'Search tasks...',
  'Buscar por concepto...': 'Search by concept...',
  'Todos los tipos': 'All Types',
  'Ingresos': 'Income',
  'Gastos': 'Expenses',
  'No se pudo eliminar': 'Could Not Delete',
  'No hay transacciones que mostrar': 'No Transactions to Show',
  'Comienza registrando tus primeros ingresos y gastos': 'Start Recording Your First Income and Expenses',
  'Conectar Banco (Nordigen)': 'Connect Bank (Nordigen)',
  'Error al generar el reporte. Por favor, intenta nuevamente.': 'Error Generating Report. Please Try Again.',
  'Panel de control': 'Control Panel',
  'Administrador': 'Administrator',
  'Propietario': 'Owner',
  'Ver tarea': 'View Task',
  'Pendiente': 'Pending',
  'En progreso': 'In Progress',
  'Completado': 'Completed',
  'No hay mesas configuradas': 'No Tables Configured',
  'Nombre de la mesa': 'Table Name',
  'Capacidad': 'Capacity',
  'Filas': 'Rows',
  'Sillas por fila': 'Seats per Row',
  'Total de sillas': 'Total Seats',
  'Filas de mesas': 'Table Rows',
  'Columnas de mesas': 'Table Columns',
  'Para': 'To',
};

function hasSpanishCharacters(text) {
  return SPANISH_PATTERNS.some(pattern => pattern.test(text));
}

function translateText(text) {
  if (TRANSLATIONS[text]) {
    return TRANSLATIONS[text];
  }
  
  const trimmed = text.trim();
  if (TRANSLATIONS[trimmed]) {
    return TRANSLATIONS[trimmed];
  }
  
  return null;
}

function processValue(value, keyPath, fileName) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  
  if (!hasSpanishCharacters(value)) {
    return null;
  }
  
  const translation = translateText(value);
  
  return {
    path: keyPath,
    original: value,
    translation,
    file: fileName,
  };
}

function traverseAndCollect(obj, prefix = '', fileName = '') {
  const findings = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      findings.push(...traverseAndCollect(value, currentPath, fileName));
    } else if (typeof value === 'string') {
      const result = processValue(value, currentPath, fileName);
      if (result) {
        findings.push(result);
      }
    }
  }
  
  return findings;
}

function applyTranslations(obj, translations) {
  let applied = 0;
  
  for (const trans of translations) {
    if (!trans.translation) continue;
    
    const parts = trans.path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) break;
      current = current[parts[i]];
    }
    
    const lastKey = parts[parts.length - 1];
    if (current && current[lastKey] === trans.original) {
      current[lastKey] = trans.translation;
      applied++;
    }
  }
  
  return applied;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const fileName = path.basename(filePath);
    const findings = traverseAndCollect(data, '', fileName);
    
    return { data, findings };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function scanDirectory(dir) {
  const allFindings = [];
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .filter(f => !f.includes('.bak') && !f.includes('.backup'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const result = processFile(filePath);
    if (result) {
      allFindings.push(...result.findings);
    }
  }
  
  return allFindings;
}

function main() {
  const shouldFix = process.argv.includes('--fix');
  
  console.log(`\n🔍 Scanning: ${EN_LOCALE_DIR}\n`);
  
  const findings = scanDirectory(EN_LOCALE_DIR);
  
  const withTranslation = findings.filter(f => f.translation);
  const withoutTranslation = findings.filter(f => !f.translation);
  
  console.log(`📊 Found ${findings.length} Spanish texts:`);
  console.log(`   ✅ ${withTranslation.length} with translations`);
  console.log(`   ❌ ${withoutTranslation.length} need manual translation\n`);
  
  if (shouldFix && withTranslation.length > 0) {
    console.log('🔧 Applying translations...\n');
    
    const byFile = {};
    for (const finding of withTranslation) {
      if (!byFile[finding.file]) {
        byFile[finding.file] = [];
      }
      byFile[finding.file].push(finding);
    }
    
    let totalFixed = 0;
    
    for (const [fileName, fileFindings] of Object.entries(byFile)) {
      const filePath = path.join(EN_LOCALE_DIR, fileName);
      const result = processFile(filePath);
      
      if (result) {
        const applied = applyTranslations(result.data, fileFindings);
        if (applied > 0) {
          fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2) + '\n', 'utf8');
          console.log(`✅ ${fileName}: ${applied} translations applied`);
          totalFixed += applied;
        }
      }
    }
    
    console.log(`\n✨ Total: ${totalFixed} texts translated\n`);
  }
  
  if (withoutTranslation.length > 0) {
    console.log('⚠️  Texts needing manual translation:\n');
    
    const byFile = {};
    for (const finding of withoutTranslation) {
      if (!byFile[finding.file]) {
        byFile[finding.file] = [];
      }
      byFile[finding.file].push(finding);
    }
    
    for (const [fileName, fileFindings] of Object.entries(byFile)) {
      console.log(`📄 ${fileName}:`);
      for (const f of fileFindings.slice(0, 5)) {
        console.log(`   ${f.path}: "${f.original}"`);
      }
      if (fileFindings.length > 5) {
        console.log(`   ... and ${fileFindings.length - 5} more`);
      }
      console.log('');
    }
  }
  
  if (!shouldFix && withTranslation.length > 0) {
    console.log('💡 Run with --fix to apply translations:\n');
    console.log('   node scripts/i18n/autoTranslateEnLocale.cjs --fix\n');
  }
}

if (require.main === module) {
  main();
}
