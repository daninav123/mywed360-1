/**
 * TEST REAL: Crear solicitud de presupuesto SIN auto-limpieza
 *
 * Este test crea una solicitud REAL que permanece en Firestore
 * para que puedas verificarla manualmente en el panel de admin
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Configurar Firebase Admin
const possiblePaths = [
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json',
  'C:\\Users\\Administrator\\Documents\\Lovenda\\lovenda13123123 - copia\\serviceAccount.json',
];

let serviceAccount;
for (const path of possiblePaths) {
  try {
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
    console.log(`✅ Usando: ${path}`);
    break;
  } catch (error) {
    continue;
  }
}

if (!serviceAccount) {
  console.error('❌ No se encontró serviceAccount.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configuración del test
const TEST_CONFIG = {
  weddingId: '61ffb907-7fcb-4361-b764-0300b317fe06',
  ownerId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  supplierId: 'z0BAVOrrub8xQvUtHIOw',
  category: 'musica',
};

async function createRealQuoteRequest() {
  console.log('\n🚀 CREANDO SOLICITUD DE PRESUPUESTO REAL\n');
  console.log('Esta solicitud NO se eliminará automáticamente');
  console.log('Podrás verla en el panel de admin\n');

  try {
    // Verificar proveedor
    const supplierDoc = await db.collection('suppliers').doc(TEST_CONFIG.supplierId).get();
    if (!supplierDoc.exists) {
      throw new Error('Proveedor no encontrado');
    }
    const supplierData = supplierDoc.data();

    console.log(`📝 Creando solicitud para: ${supplierData.name}`);
    console.log(`   Email: ${supplierData.contact?.email}`);
    console.log('');

    // Crear solicitud
    const quoteRequest = {
      weddingId: TEST_CONFIG.weddingId,
      supplierId: TEST_CONFIG.supplierId,
      category: TEST_CONFIG.category,
      message: `Hola ${supplierData.name},

Estamos organizando nuestra boda para el 15 de junio de 2025 y nos interesa mucho su servicio de música.

Detalles de nuestro evento:
- Fecha: 15 de junio de 2025
- Invitados: 120 personas
- Tipo de evento: Boda en finca rústica
- Horario estimado: 19:00 - 02:00

Nos gustaría conocer:
1. Disponibilidad para esa fecha
2. Servicios incluidos en sus paquetes
3. Presupuesto estimado
4. Referencias o videos de bodas anteriores

Quedamos atentos a su respuesta.

¡Muchas gracias!`,
      requestedServices: ['Música en vivo', 'DJ', 'Equipo de sonido'],
      eventDate: new Date('2025-06-15').toISOString(),
      guestCount: 120,
      budget: {
        min: 1500,
        max: 2500,
        currency: 'EUR',
      },
      contact: {
        name: 'Daniel Navarro',
        email: 'danielnavarrocampos@icloud.com',
        phone: '+34612345678',
      },
      status: 'pending',
      supplierInfo: {
        name: supplierData.name || supplierData.profile?.name,
        email: supplierData.contact?.email,
        category: supplierData.category,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: TEST_CONFIG.ownerId,
      _testData: true, // Marca para identificarla como solicitud de test
    };

    const quoteRef = await db.collection('quoteRequests').add(quoteRequest);

    console.log('✅ SOLICITUD CREADA EXITOSAMENTE\n');
    console.log(`📋 ID: ${quoteRef.id}`);
    console.log(`🏢 Proveedor: ${supplierData.name}`);
    console.log(`📧 Email proveedor: ${supplierData.contact?.email}`);
    console.log(`📅 Fecha evento: 15 de junio de 2025`);
    console.log(`👥 Invitados: 120`);
    console.log('');

    // Crear notificación para el proveedor
    const notificationRef = await db.collection('notifications').add({
      type: 'quote_request',
      recipientId: TEST_CONFIG.supplierId,
      recipientType: 'supplier',
      title: 'Nueva solicitud de presupuesto',
      message: `Has recibido una solicitud de presupuesto para ${TEST_CONFIG.category}`,
      data: {
        quoteRequestId: quoteRef.id,
        weddingId: TEST_CONFIG.weddingId,
        category: TEST_CONFIG.category,
        guestCount: 120,
        eventDate: new Date('2025-06-15').toISOString(),
      },
      status: 'unread',
      createdAt: new Date().toISOString(),
      _testData: true,
    });

    console.log(`✅ NOTIFICACIÓN CREADA\n`);
    console.log(`📧 ID: ${notificationRef.id}`);
    console.log(`👤 Destinatario: ${supplierData.name}`);
    console.log('');

    // Instrucciones
    console.log('🎯 VERIFICACIÓN MANUAL:\n');
    console.log('1️⃣  PANEL DE ADMIN:');
    console.log('   - Ve a Solicitudes de Presupuesto');
    console.log(`   - Busca la solicitud con ID: ${quoteRef.id}`);
    console.log('   - Verifica que aparece correctamente');
    console.log('');
    console.log('2️⃣  PANEL DE PROVEEDOR (ReSona):');
    console.log('   - Inicia sesión como resona@icloud.com');
    console.log('   - Ve a notificaciones');
    console.log(`   - Verifica la notificación con ID: ${notificationRef.id}`);
    console.log('   - Responde a la solicitud con un presupuesto');
    console.log('');
    console.log('3️⃣  FIRESTORE (Firebase Console):');
    console.log('   - Colección: quoteRequests');
    console.log(`   - Documento: ${quoteRef.id}`);
    console.log('   - Colección: notifications');
    console.log(`   - Documento: ${notificationRef.id}`);
    console.log('');
    console.log('🧹 LIMPIEZA MANUAL:\n');
    console.log('   Para eliminar esta solicitud de test, ejecuta:');
    console.log(`   db.collection('quoteRequests').doc('${quoteRef.id}').delete()`);
    console.log(`   db.collection('notifications').doc('${notificationRef.id}').delete()`);
    console.log('');
    console.log('✅ TEST COMPLETADO - Solicitud lista para verificación\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createRealQuoteRequest();
