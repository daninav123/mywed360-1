/**
 * TEST: Enviar solicitud de presupuesto completa (con email)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

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

const BACKEND_URL = 'http://localhost:4004';
const OWNER_UID = '9EstYa0T8WRBm9j0XwnE8zU1iFo1'; // danielnavarrocampos@icloud.com
const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw'; // ReSona
const WEDDING_ID = '61ffb907-7fcb-4361-b764-0300b317fe06';

async function testQuoteRequest() {
  console.log('\n🧪 TEST: Enviar solicitud de presupuesto con EMAIL\n');

  try {
    // 1. Generar token de autenticación para el owner
    console.log('1️⃣  Generando token de autenticación...');
    const customToken = await admin.auth().createCustomToken(OWNER_UID);
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY || 'AIzaSyBXNw_9w9w9w9w9w9w9w9w9w9w9w9w'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await authResponse.json();
    const idToken = authData.idToken;
    console.log('   ✅ Token obtenido\n');

    // 2. Enviar solicitud de presupuesto
    console.log('2️⃣  Enviando solicitud de presupuesto...');
    const requestData = {
      weddingId: WEDDING_ID,
      supplierId: SUPPLIER_ID,
      category: 'musica',
      message: '🧪 PRUEBA AUTOMÁTICA: Verificando que el email llega correctamente al proveedor',
      requestedServices: ['DJ', 'Música en vivo'],
      budget: {
        min: 1000,
        max: 2000,
      },
      eventDate: '2025-08-15',
      guestCount: 120,
      location: {
        city: 'Valencia',
        venue: 'Salón de prueba',
      },
      contact: {
        name: 'Daniel Navarro (TEST)',
        email: 'danielnavarrocampos@icloud.com',
        phone: '+34 600 000 000',
      },
    };

    const response = await fetch(`${BACKEND_URL}/api/quote-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('   ✅ Solicitud enviada correctamente');
    console.log(`   ID de solicitud: ${result.requestId}\n`);

    // 3. Esperar un momento para que el email se envíe (proceso asíncrono)
    console.log('3️⃣  Esperando 3 segundos para que el email se envíe...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('   ✅ Tiempo de espera completado\n');

    // 4. Instrucciones para verificar
    console.log('📋 INSTRUCCIONES DE VERIFICACIÓN:\n');
    console.log('   1. Revisa los LOGS DEL BACKEND (terminal donde corre npm run dev)');
    console.log('      Deberías ver:');
    console.log('      ✅ [quote-requests] Solicitud guardada en subcolección...');
    console.log('      ✅ [quote-requests] Notificación creada para proveedor: ReSona');
    console.log('      📧 [quote-requests] Email enviado a resona@icloud.com para solicitud ...');
    console.log('');
    console.log('   2. Revisa el EMAIL de resona@icloud.com');
    console.log('      Busca: "Nueva solicitud de presupuesto"');
    console.log('      Asunto: "Nueva Solicitud de Presupuesto - Música"');
    console.log('');
    console.log('   3. Verifica en el PANEL DEL PROVEEDOR');
    console.log('      URL: http://localhost:5173/supplier/login');
    console.log('      Login: resona@icloud.com');
    console.log('      Debería aparecer la nueva solicitud con "🧪 PRUEBA AUTOMÁTICA"');
    console.log('');

    console.log('✅ TEST COMPLETADO\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR en el test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testQuoteRequest();
