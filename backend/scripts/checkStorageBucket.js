import admin from 'firebase-admin';
import { db } from '../db.js';

console.log('\n🔍 DIAGNÓSTICO DE FIREBASE STORAGE BUCKET\n');
console.log('═'.repeat(60));

// Variables de entorno
console.log('\n📋 Variables de entorno:');
console.log(
  '  VITE_FIREBASE_STORAGE_BUCKET:',
  process.env.VITE_FIREBASE_STORAGE_BUCKET || '(no definida)'
);
console.log('  Bucket configurado en db.js:', admin.app().options.storageBucket);

// Probar diferentes nombres de bucket
const bucketsToTest = [
  'lovenda-98c77.appspot.com',
  'lovenda-98c77.firebasestorage.app',
  process.env.VITE_FIREBASE_STORAGE_BUCKET,
  admin.app().options.storageBucket,
]
  .filter(Boolean)
  .filter((v, i, arr) => arr.indexOf(v) === i);

console.log('\n🧪 Probando buckets:');
console.log('═'.repeat(60));

for (const bucketName of bucketsToTest) {
  try {
    console.log(`\n🪣 Bucket: ${bucketName}`);
    const bucket = admin.storage().bucket(bucketName);

    // Intentar obtener metadata
    const [exists] = await bucket.exists();

    if (exists) {
      console.log('  ✅ EXISTE');
      const [metadata] = await bucket.getMetadata();
      console.log('  📊 Name:', metadata.name);
      console.log('  📊 Location:', metadata.location);
      console.log('  📊 Storage Class:', metadata.storageClass);
    } else {
      console.log('  ❌ NO EXISTE');
    }
  } catch (error) {
    console.log('  ❌ ERROR:', error.message);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Diagnóstico completado\n');

process.exit(0);
