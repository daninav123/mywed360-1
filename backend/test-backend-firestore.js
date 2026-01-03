// Test rápido: ¿El backend puede leer Firestore?
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

async function test() {
  console.log('\n🔍 TEST: ¿Cuántos proveedores hay en Firestore?\n');

  try {
    const snapshot = await db.collection('suppliers').get();

    console.log(`📊 Total proveedores: ${snapshot.size}\n`);

    if (snapshot.size === 0) {
      console.log('❌ NO HAY PROVEEDORES EN FIRESTORE');
      console.log('   Posibles causas:');
      console.log('   1. Credenciales incorrectas (proyecto equivocado)');
      console.log('   2. Colección vacía');
      console.log('');
      process.exit(1);
    }

    let activeCount = 0;
    let resonaFound = false;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status;
      const name = data.name || data.profile?.name || 'Sin nombre';

      if (status === 'active') {
        activeCount++;
      }

      if (doc.id === 'z0BAVOrrub8xQvUtHIOw') {
        resonaFound = true;
        console.log(`✅ ReSona encontrado:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Nombre: ${name}`);
        console.log(`   Status: ${status}`);
        console.log(`   Categoría: ${data.category}`);
        console.log('');
      }
    });

    console.log(`📊 Proveedores con status="active": ${activeCount}`);
    console.log('');

    if (!resonaFound) {
      console.log('❌ RESONA NO ENCONTRADO en Firestore');
      console.log('   Esto significa que el backend está leyendo otra base de datos');
    } else {
      console.log('✅ TODO CORRECTO - Firestore tiene los datos');
      console.log('');
      console.log('⚠️  PERO el backend NO los está devolviendo');
      console.log('   Verifica que:');
      console.log('   1. El backend se haya reiniciado');
      console.log('   2. El backend use las mismas credenciales');
      console.log('   3. No haya errores en los logs del backend');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  process.exit(0);
}

test();
