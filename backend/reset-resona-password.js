// Script para verificar y resetear la contraseña del proveedor ReSona
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const possiblePaths = [
  join(__dirname, 'serviceAccount.json'),
  join(__dirname, '..', 'serviceAccount.json'),
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

// ID del proveedor ReSona según los scripts de debug
const RESONA_ID = 'z0BAVOrrub8xQvUtHIOw';

async function resetResonaPassword() {
  console.log('\n🔧 RESET PASSWORD: Proveedor ReSona\n');
  console.log('='.repeat(70));

  try {
    // 1. Buscar proveedor por ID
    console.log('\n📋 Paso 1: Buscando proveedor...');
    const supplierDoc = await db.collection('suppliers').doc(RESONA_ID).get();

    if (!supplierDoc.exists) {
      console.log('❌ ReSona NO EXISTE con ID:', RESONA_ID);
      
      // Intentar buscar por email
      console.log('\n🔍 Intentando buscar por email: resona@test.com');
      const querySnapshot = await db
        .collection('suppliers')
        .where('contact.email', '==', 'resona@test.com')
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.log('❌ Tampoco se encontró por email resona@test.com');
        console.log('\n💡 Buscando TODOS los proveedores con "resona" en el nombre...');
        
        const allSuppliers = await db.collection('suppliers').limit(100).get();
        const resonaProviders = [];
        
        allSuppliers.forEach((doc) => {
          const data = doc.data();
          const name = (data.name || data.profile?.name || '').toLowerCase();
          if (name.includes('resona')) {
            resonaProviders.push({
              id: doc.id,
              name: data.name || data.profile?.name,
              email: data.contact?.email,
              status: data.status || data.profile?.status,
            });
          }
        });

        if (resonaProviders.length === 0) {
          console.log('❌ No se encontró ningún proveedor con "resona" en el nombre');
          console.log('\n📝 Proveedores disponibles:');
          allSuppliers.docs.slice(0, 10).forEach((doc) => {
            const data = doc.data();
            console.log(`   - ${data.name || data.profile?.name} (${data.contact?.email})`);
          });
          process.exit(1);
        }

        console.log(`\n✅ Se encontraron ${resonaProviders.length} proveedor(es):`);
        resonaProviders.forEach((p, i) => {
          console.log(`\n   ${i + 1}. ${p.name}`);
          console.log(`      ID: ${p.id}`);
          console.log(`      Email: ${p.email}`);
          console.log(`      Status: ${p.status}`);
        });

        process.exit(0);
      }

      const foundDoc = querySnapshot.docs[0];
      console.log('✅ Proveedor encontrado por email!');
      console.log(`   ID: ${foundDoc.id}`);
      
      return await resetPassword(foundDoc);
    }

    return await resetPassword(supplierDoc);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function resetPassword(supplierDoc) {
  const data = supplierDoc.data();
  
  console.log('\n✅ Proveedor encontrado!');
  console.log(`   ID: ${supplierDoc.id}`);
  console.log(`   Nombre: ${data.name || data.profile?.name}`);
  console.log(`   Email: ${data.contact?.email}`);
  console.log(`   Status: ${data.status || data.profile?.status}`);

  // 2. Verificar contraseña actual
  console.log('\n📋 Paso 2: Verificando contraseña actual...');
  if (data.auth?.passwordHash) {
    console.log('   ✅ Tiene contraseña configurada');
    console.log(`   Hash actual: ${data.auth.passwordHash.substring(0, 20)}...`);

    // Intentar verificar con "test123"
    const isTest123 = await bcrypt.compare('test123', data.auth.passwordHash);
    console.log(`   Contraseña actual es "test123": ${isTest123 ? '✅ SÍ' : '❌ NO'}`);

    if (isTest123) {
      console.log('\n✅ La contraseña ya es "test123"');
      console.log('\n🔑 CREDENCIALES DE LOGIN:');
      console.log('   Email: resona@test.com');
      console.log('   Password: test123');
      console.log('   URL: http://localhost:5175/login');
      process.exit(0);
    }
  } else {
    console.log('   ⚠️  NO tiene contraseña configurada');
  }

  // 3. Generar nuevo hash para "test123"
  console.log('\n📋 Paso 3: Generando nuevo hash para contraseña "test123"...');
  const newPassword = 'test123';
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  console.log('   ✅ Nuevo hash generado');

  // 4. Actualizar en Firestore
  console.log('\n📋 Paso 4: Actualizando contraseña en Firestore...');
  await supplierDoc.ref.update({
    'auth.passwordHash': newPasswordHash,
    'auth.passwordSetAt': admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅ Contraseña actualizada correctamente');

  // 5. Verificar la actualización
  console.log('\n📋 Paso 5: Verificando la actualización...');
  const updatedDoc = await supplierDoc.ref.get();
  const updatedData = updatedDoc.data();
  const verifyPassword = await bcrypt.compare('test123', updatedData.auth.passwordHash);
  
  if (verifyPassword) {
    console.log('   ✅ Verificación exitosa - Password "test123" funciona');
  } else {
    console.log('   ❌ ERROR: La verificación falló');
    process.exit(1);
  }

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ ¡PASSWORD RESETEADO EXITOSAMENTE!\n');
  console.log('🔑 CREDENCIALES DE LOGIN:');
  console.log('   Email: ' + (data.contact?.email || 'resona@test.com'));
  console.log('   Password: test123');
  console.log('\n📍 URL de Login:');
  console.log('   http://localhost:5175/login');
  console.log('\n💡 Usa estas credenciales para iniciar sesión como proveedor ReSona');
  console.log('\n' + '='.repeat(70));

  process.exit(0);
}

resetResonaPassword();
