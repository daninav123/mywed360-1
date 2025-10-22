#!/usr/bin/env node

/**
 * Script para crear un nuevo namespace de traducciones
 * Crea los archivos JSON base en todos los idiomas configurados
 * 
 * Uso: node scripts/i18n/createNamespace.js <namespace-name>
 * Ejemplo: node scripts/i18n/createNamespace.js tasks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');
const LANGUAGES = ['es', 'en', 'es-MX', 'es-AR', 'fr', 'it', 'pt', 'de'];

const namespaceName = process.argv[2];

if (!namespaceName) {
  console.error('❌ Error: Debes especificar el nombre del namespace');
  console.log('\nUso: node scripts/i18n/createNamespace.js <nombre>');
  console.log('Ejemplo: node scripts/i18n/createNamespace.js tasks\n');
  process.exit(1);
}

// Template base para cada namespace
const templates = {
  tasks: {
    tasks: {
      title: 'Tareas',
      newTask: 'Nueva tarea',
      editTask: 'Editar tarea',
      deleteTask: 'Eliminar tarea',
      viewTask: 'Ver tarea',
      searchPlaceholder: 'Buscar tareas...',
      noTasks: 'No hay tareas',
      createFirst: 'Crear primera tarea',
      status: {
        pending: 'Pendiente',
        in_progress: 'En progreso',
        completed: 'Completada',
        cancelled: 'Cancelada',
      },
      priority: {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente',
      },
      form: {
        title: 'Título',
        description: 'Descripción',
        assignee: 'Asignado a',
        dueDate: 'Fecha límite',
        category: 'Categoría',
        tags: 'Etiquetas',
      },
      messages: {
        created: 'Tarea creada correctamente',
        updated: 'Tarea actualizada correctamente',
        deleted: 'Tarea eliminada correctamente',
        error: 'Error al procesar la tarea',
      },
    },
  },
  
  guests: {
    guests: {
      title: 'Invitados',
      newGuest: 'Nuevo invitado',
      editGuest: 'Editar invitado',
      deleteGuest: 'Eliminar invitado',
      searchPlaceholder: 'Buscar invitados...',
      noGuests: 'No hay invitados',
      createFirst: 'Crear primer invitado',
      status: {
        confirmed: 'Confirmado',
        pending: 'Pendiente',
        declined: 'Rechazado',
      },
      form: {
        name: 'Nombre completo',
        email: 'Email',
        phone: 'Teléfono',
        group: 'Grupo',
        notes: 'Notas',
      },
      messages: {
        created: 'Invitado creado correctamente',
        updated: 'Invitado actualizado correctamente',
        deleted: 'Invitado eliminado correctamente',
        error: 'Error al procesar el invitado',
      },
    },
  },

  seating: {
    seating: {
      title: 'Distribución de Mesas',
      newTable: 'Nueva mesa',
      editTable: 'Editar mesa',
      deleteTable: 'Eliminar mesa',
      assignGuests: 'Asignar invitados',
      autoAssign: 'Asignación automática',
      noTables: 'No hay mesas configuradas',
      createFirst: 'Crear primera mesa',
      form: {
        tableName: 'Nombre de la mesa',
        capacity: 'Capacidad',
        shape: 'Forma',
        notes: 'Notas',
      },
      shapes: {
        round: 'Redonda',
        rectangular: 'Rectangular',
        square: 'Cuadrada',
      },
      messages: {
        created: 'Mesa creada correctamente',
        updated: 'Mesa actualizada correctamente',
        deleted: 'Mesa eliminada correctamente',
        assigned: 'Invitados asignados correctamente',
        error: 'Error al procesar la mesa',
      },
    },
  },

  email: {
    email: {
      title: 'Correo electrónico',
      inbox: 'Bandeja de entrada',
      compose: 'Redactar',
      sent: 'Enviados',
      drafts: 'Borradores',
      trash: 'Papelera',
      searchPlaceholder: 'Buscar correos...',
      noEmails: 'No hay correos',
      form: {
        to: 'Para',
        subject: 'Asunto',
        message: 'Mensaje',
        attachments: 'Adjuntos',
      },
      messages: {
        sent: 'Correo enviado correctamente',
        saved: 'Borrador guardado',
        deleted: 'Correo eliminado',
        error: 'Error al enviar el correo',
      },
    },
  },

  admin: {
    admin: {
      title: 'Administración',
      dashboard: 'Panel de control',
      users: 'Usuarios',
      settings: 'Configuración',
      analytics: 'Analíticas',
      logs: 'Registros',
      users: {
        title: 'Gestión de usuarios',
        newUser: 'Nuevo usuario',
        editUser: 'Editar usuario',
        deleteUser: 'Eliminar usuario',
        roles: {
          admin: 'Administrador',
          owner: 'Propietario',
          planner: 'Wedding Planner',
          assistant: 'Asistente',
        },
      },
      messages: {
        updated: 'Configuración actualizada',
        error: 'Error en la operación',
      },
    },
  },

  marketing: {
    marketing: {
      landing: {
        hero: {
          title: 'Organiza tu boda perfecta',
          subtitle: 'La plataforma todo-en-uno para bodas',
          cta: 'Empieza gratis',
        },
        features: {
          title: 'Todo lo que necesitas',
          guests: 'Gestión de invitados',
          finance: 'Control financiero',
          tasks: 'Organización de tareas',
          seating: 'Plan de mesas',
        },
      },
      pricing: {
        title: 'Precios simples y transparentes',
        free: 'Gratis',
        pro: 'Profesional',
        enterprise: 'Empresa',
        cta: 'Empezar ahora',
      },
    },
  },
};

// Obtener template según el nombre del namespace
const template = templates[namespaceName] || {
  [namespaceName]: {
    title: namespaceName.charAt(0).toUpperCase() + namespaceName.slice(1),
    placeholder: 'Añade tus traducciones aquí',
  },
};

console.log(`\n🚀 Creando namespace: ${namespaceName}\n`);

let created = 0;
let skipped = 0;

LANGUAGES.forEach(lang => {
  const langDir = path.join(LOCALES_DIR, lang);
  const filePath = path.join(langDir, `${namespaceName}.json`);

  // Crear directorio si no existe
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Verificar si ya existe
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${lang}/${namespaceName}.json ya existe (omitido)`);
    skipped++;
    return;
  }

  // Crear archivo con template
  const content = lang === 'es' 
    ? template 
    : { ...template, _note: `Translate from es/${namespaceName}.json` };

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  console.log(`✅ Creado: ${lang}/${namespaceName}.json`);
  created++;
});

console.log('\n' + '─'.repeat(60));
console.log(`\n📊 Resumen:`);
console.log(`   ✅ Archivos creados: ${created}`);
console.log(`   ⚠️  Archivos omitidos: ${skipped}`);

if (created > 0) {
  console.log('\n💡 Próximos pasos:');
  console.log(`   1. Editar src/i18n/locales/es/${namespaceName}.json con las traducciones`);
  console.log(`   2. Ejecutar: node scripts/i18n/validateTranslations.js`);
  console.log(`   3. Añadir el namespace al array 'ns' en src/i18n/index.js:`);
  console.log(`      ns: ['common', 'finance', '${namespaceName}'],`);
  console.log(`   4. Importar el JSON en src/i18n/index.js:`);
  console.log(`      import es${namespaceName.charAt(0).toUpperCase() + namespaceName.slice(1)} from './locales/es/${namespaceName}.json';`);
  console.log('\n');
}
