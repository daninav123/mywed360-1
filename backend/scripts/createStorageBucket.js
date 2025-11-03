import admin from 'firebase-admin';
import { db } from '../db.js';

console.log('🔧 Intentando crear bucket de Storage...');

async function createBucket() {
  try {
    const bucketName = 'lovenda-98c77.appspot.com';
    console.log(`📦 Verificando bucket: ${bucketName}`);

    // Intentar obtener el bucket
    const bucket = admin.storage().bucket(bucketName);

    try {
      const [exists] = await bucket.exists();
      if (exists) {
        console.log('✅ El bucket ya existe:', bucketName);
        return;
      }
    } catch (error) {
      console.log('⚠️  El bucket no existe, intentando crear...');
    }

    // Intentar crear el bucket
    await admin.storage().bucket().create(bucketName);
    console.log('✅ Bucket creado exitosamente:', bucketName);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 SOLUCIÓN MANUAL:');
    console.log('1. Ve a https://console.firebase.google.com/project/lovenda-98c77/storage');
    console.log('2. Haz clic en "Comenzar" o "Get started"');
    console.log('3. Acepta las reglas de seguridad por defecto');
    console.log('4. El bucket se creará automáticamente\n');
  }

  process.exit(0);
}

createBucket();
