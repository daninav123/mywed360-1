/**
 * DEBUG: Verificar solicitudes del proveedor
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

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

const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw'; // ReSona

async function debugSupplierRequests() {
  console.log('\n🔍 DEBUG: Solicitudes del Proveedor ReSona\n');
  console.log(`Supplier ID: ${SUPPLIER_ID}\n`);

  try {
    // 1. Verificar que el proveedor existe
    console.log('1️⃣  Verificando proveedor...');
    const supplierDoc = await db.collection('suppliers').doc(SUPPLIER_ID).get();
    if (!supplierDoc.exists) {
      console.log('❌ Proveedor NO existe');
      process.exit(1);
    }
    const supplierData = supplierDoc.data();
    console.log(`   ✅ Proveedor: ${supplierData.name}`);
    console.log(`   Email: ${supplierData.contact?.email || 'N/A'}`);
    console.log('');

    // 2. Buscar en la colección principal quoteRequests
    console.log('2️⃣  Buscando en colección principal (quoteRequests)...');
    const mainSnapshot = await db
      .collection('quoteRequests')
      .where('supplierId', '==', SUPPLIER_ID)
      .get();

    console.log(`   📊 Total en quoteRequests: ${mainSnapshot.size}`);

    if (mainSnapshot.size > 0) {
      console.log('\n   📋 Solicitudes encontradas en quoteRequests:');
      mainSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}`);
        console.log(`     Mensaje: ${(data.message || '').substring(0, 50)}...`);
        console.log(`     Estado: ${data.status}`);
        console.log(`     Fecha: ${data.createdAt}`);
        console.log('');
      });
    }
    console.log('');

    // 3. Buscar en la subcolección suppliers/{id}/quote-requests
    console.log('3️⃣  Buscando en subcolección quote-requests...');
    const quoteRequestsSnapshot = await db
      .collection('suppliers')
      .doc(SUPPLIER_ID)
      .collection('quote-requests')
      .get();

    console.log(`   📊 Total en suppliers/{id}/quote-requests: ${quoteRequestsSnapshot.size}`);

    if (quoteRequestsSnapshot.size > 0) {
      console.log('\n   📋 Solicitudes en quote-requests:');
      quoteRequestsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}`);
        console.log(`     Datos: ${JSON.stringify(data, null, 2)}`);
        console.log('');
      });
    }
    console.log('');

    // 4. Buscar en la subcolección suppliers/{id}/requests (la que usa el panel)
    console.log('4️⃣  Buscando en subcolección requests (la que usa el panel)...');
    const requestsSnapshot = await db
      .collection('suppliers')
      .doc(SUPPLIER_ID)
      .collection('requests')
      .orderBy('receivedAt', 'desc')
      .get();

    console.log(`   📊 Total en suppliers/{id}/requests: ${requestsSnapshot.size}`);

    if (requestsSnapshot.size > 0) {
      console.log('\n   📋 Solicitudes en requests (PANEL DEL PROVEEDOR):');
      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   ✅ ID: ${doc.id}`);
        console.log(`      Nombre: ${data.coupleName || 'N/A'}`);
        console.log(`      Email: ${data.contactEmail || 'N/A'}`);
        console.log(`      Estado: ${data.status || 'N/A'}`);
        console.log(`      Mensaje: ${(data.message || '').substring(0, 50)}...`);
        console.log(`      Fecha: ${data.receivedAt}`);
        console.log('');
      });
    } else {
      console.log('   ❌ NO HAY SOLICITUDES en suppliers/{id}/requests');
      console.log('   ⚠️  El panel del proveedor lee de esta colección y está VACÍA');
    }
    console.log('');

    // 5. Resumen
    console.log('📊 RESUMEN:\n');
    console.log(`   Colección principal (quoteRequests): ${mainSnapshot.size}`);
    console.log(`   Subcolección quote-requests: ${quoteRequestsSnapshot.size}`);
    console.log(`   Subcolección requests (PANEL): ${requestsSnapshot.size}`);
    console.log('');

    if (requestsSnapshot.size === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   El panel del proveedor NO tiene solicitudes porque:');
      console.log('   → suppliers/{id}/requests está VACÍA');
      console.log('');
      console.log('💡 SOLUCIÓN:');
      console.log('   1. Envía una NUEVA solicitud desde el owner');
      console.log('   2. Verifica los logs del backend');
      console.log(
        '   3. Debe aparecer: "Solicitud guardada en subcolección del proveedor (suppliers/.../requests/...)"'
      );
      console.log('');
    } else {
      console.log('✅ El panel del proveedor DEBERÍA mostrar solicitudes');
      console.log('   Si no aparecen, verifica:');
      console.log('   1. Token de autenticación del proveedor');
      console.log('   2. Endpoint GET /api/supplier-requests/{supplierId}');
      console.log('   3. Logs del navegador (errores de red)');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugSupplierRequests();
