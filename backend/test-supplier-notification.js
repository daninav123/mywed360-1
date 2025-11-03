/**
 * Script de prueba para el sistema de notificaciones de proveedores
 *
 * USO:
 * 1. Asegúrate de tener un proveedor en Firestore
 * 2. node test-supplier-notification.js
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:4004';

// ⚠️ CONFIGURA ESTOS VALORES
const TEST_CONFIG = {
  supplierId: 'test_supplier_flores', // ID del proveedor en Firestore
  coupleName: 'Ana y Luis TEST',
  contactEmail: 'ana.test@example.com',
  weddingDate: '2026-07-15',
  message: 'Hola, estamos buscando flores para nuestra boda. ¿Podrían enviarnos un presupuesto?',
};

async function testSupplierNotification() {
  console.log('🧪 Iniciando test de notificaciones...\n');
  console.log('📋 Configuración:');
  console.log(`   - Proveedor: ${TEST_CONFIG.supplierId}`);
  console.log(`   - Email cliente: ${TEST_CONFIG.contactEmail}\n`);

  try {
    // 1. Enviar solicitud
    console.log('📤 Enviando solicitud de presupuesto...');
    const response = await fetch(
      `${BACKEND_URL}/api/suppliers/${TEST_CONFIG.supplierId}/request-quote`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupleName: TEST_CONFIG.coupleName,
          contactEmail: TEST_CONFIG.contactEmail,
          contactPhone: '+34612345678',
          weddingDate: TEST_CONFIG.weddingDate,
          location: 'Madrid',
          guestCount: 120,
          budget: '2000-3000€',
          services: ['flowers', 'decoration'],
          message: TEST_CONFIG.message,
          preferredContactMethod: 'email',
          urgency: 'normal',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('✅ Solicitud enviada exitosamente!\n');
    console.log('📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');

    // 2. Listar solicitudes
    console.log('📋 Listando solicitudes del proveedor...');
    const listResponse = await fetch(
      `${BACKEND_URL}/api/supplier-requests/${TEST_CONFIG.supplierId}`
    );

    if (listResponse.ok) {
      const list = await listResponse.json();
      console.log(`✅ Encontradas ${list.data.length} solicitudes\n`);

      if (list.data.length > 0) {
        console.log('📄 Última solicitud:');
        console.log(`   - ID: ${list.data[0].id}`);
        console.log(`   - Cliente: ${list.data[0].coupleName}`);
        console.log(`   - Estado: ${list.data[0].status}`);
        console.log(`   - Fecha: ${list.data[0].receivedAt}`);
      }
    }

    console.log('\n✅ TEST COMPLETADO!\n');
    console.log('🔍 Verifica:');
    console.log('   1. Logs del backend para ver el email enviado');
    console.log('   2. Tu inbox (email del proveedor)');
    console.log('   3. Firestore → suppliers/{id}/requests');
    console.log('   4. Mailgun Dashboard\n');
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. ¿Está el backend corriendo en http://localhost:4004?');
    console.error('   2. ¿Existe el proveedor en Firestore?');
    console.error('   3. ¿Está Mailgun configurado en .env?');
    console.error('   4. ¿Están instaladas las dependencias? (npm install)\n');
  }
}

// Ejecutar test
testSupplierNotification();
