import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'lovenda-98c77',
  });
}

const db = admin.firestore();

async function createTestTemplate() {
  console.log('🚀 Creando plantilla de tareas de prueba...');

  const template = {
    name: 'Plantilla Base de Boda',
    version: '1.0.0',
    status: 'published',
    schemaVersion: 1,
    publishedAt: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    notes: 'Plantilla generada automáticamente para testing',
    totals: {
      blocks: 5,
      subtasks: 15,
    },
    blocks: [
      {
        id: 'venue-selection',
        title: 'Selección de Lugar',
        description: 'Búsqueda y reserva del espacio para la ceremonia y recepción',
        priority: 'high',
        daysBeforeWedding: 365,
        estimatedHours: 20,
        items: [
          {
            id: 'research-venues',
            title: 'Investigar posibles lugares',
            description: 'Buscar opciones de espacios que se ajusten al estilo y presupuesto',
            completed: false,
            priority: 'high',
          },
          {
            id: 'visit-venues',
            title: 'Visitar los lugares preseleccionados',
            description: 'Agendar visitas para conocer los espacios en persona',
            completed: false,
            priority: 'high',
          },
          {
            id: 'book-venue',
            title: 'Reservar el lugar elegido',
            description: 'Firmar contrato y pagar depósito del espacio',
            completed: false,
            priority: 'high',
          },
        ],
      },
      {
        id: 'catering-planning',
        title: 'Catering y Menú',
        description: 'Selección de catering y planificación del menú',
        priority: 'high',
        daysBeforeWedding: 180,
        estimatedHours: 15,
        items: [
          {
            id: 'research-caterers',
            title: 'Investigar servicios de catering',
            description: 'Buscar opciones de catering y solicitar presupuestos',
            completed: false,
            priority: 'medium',
          },
          {
            id: 'tasting-session',
            title: 'Asistir a degustaciones',
            description: 'Probar menús y seleccionar platos',
            completed: false,
            priority: 'high',
          },
          {
            id: 'finalize-menu',
            title: 'Finalizar menú',
            description: 'Confirmar menú final con el catering',
            completed: false,
            priority: 'high',
          },
        ],
      },
      {
        id: 'photography-video',
        title: 'Fotografía y Video',
        description: 'Contratación de fotógrafo y videógrafo',
        priority: 'high',
        daysBeforeWedding: 270,
        estimatedHours: 10,
        items: [
          {
            id: 'review-portfolios',
            title: 'Revisar portfolios',
            description: 'Ver trabajos de fotógrafos y videógrafos',
            completed: false,
            priority: 'medium',
          },
          {
            id: 'meet-photographers',
            title: 'Reunirse con candidatos',
            description: 'Entrevistar fotógrafos y videógrafos',
            completed: false,
            priority: 'high',
          },
          {
            id: 'book-photographer',
            title: 'Contratar servicios',
            description: 'Firmar contrato con fotógrafo y videógrafo',
            completed: false,
            priority: 'high',
          },
        ],
      },
      {
        id: 'invitations',
        title: 'Invitaciones',
        description: 'Diseño, impresión y envío de invitaciones',
        priority: 'medium',
        daysBeforeWedding: 90,
        estimatedHours: 12,
        items: [
          {
            id: 'design-invitations',
            title: 'Diseñar invitaciones',
            description: 'Crear o seleccionar diseño de invitaciones',
            completed: false,
            priority: 'medium',
          },
          {
            id: 'print-invitations',
            title: 'Imprimir invitaciones',
            description: 'Mandar a imprimir las invitaciones',
            completed: false,
            priority: 'medium',
          },
          {
            id: 'send-invitations',
            title: 'Enviar invitaciones',
            description: 'Enviar invitaciones a todos los invitados',
            completed: false,
            priority: 'high',
          },
        ],
      },
      {
        id: 'final-details',
        title: 'Detalles Finales',
        description: 'Últimos preparativos antes del día de la boda',
        priority: 'high',
        daysBeforeWedding: 7,
        estimatedHours: 25,
        items: [
          {
            id: 'final-venue-walkthrough',
            title: 'Recorrido final del lugar',
            description: 'Visitar el lugar y confirmar todos los detalles',
            completed: false,
            priority: 'high',
          },
          {
            id: 'confirm-vendors',
            title: 'Confirmar con proveedores',
            description: 'Confirmar horarios y detalles con todos los proveedores',
            completed: false,
            priority: 'high',
          },
          {
            id: 'rehearsal',
            title: 'Ensayo de ceremonia',
            description: 'Realizar ensayo con el equipo principal',
            completed: false,
            priority: 'high',
          },
        ],
      },
    ],
  };

  try {
    const docRef = await db.collection('adminTaskTemplates').add(template);
    console.log('✅ Plantilla creada exitosamente con ID:', docRef.id);
    console.log('📋 Detalles:');
    console.log('   - Nombre:', template.name);
    console.log('   - Versión:', template.version);
    console.log('   - Bloques:', template.totals.blocks);
    console.log('   - Subtareas:', template.totals.subtasks);
    console.log('   - Status:', template.status);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creando plantilla:', error);
    throw error;
  }
}

createTestTemplate()
  .then((id) => {
    console.log('\n🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falló:', error);
    process.exit(1);
  });
