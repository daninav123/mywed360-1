import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Cargar service account
const serviceAccount = JSON.parse(
  readFileSync('./mywed360-firebase-adminsdk.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFirestoreWeddings() {
  try {
    console.log('🔍 Verificando bodas en Firestore...\n');
    
    // Obtener todas las bodas de la colección weddings
    const weddingsSnapshot = await db.collection('weddings').get();
    
    console.log(`📊 Total de bodas en Firestore: ${weddingsSnapshot.size}\n`);
    
    if (weddingsSnapshot.size > 0) {
      console.log('✅ Bodas encontradas en Firestore:\n');
      
      weddingsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        const weddingInfo = data.weddingInfo || {};
        
        console.log(`${index + 1}. ${weddingInfo.coupleName || 'Sin nombre'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Fecha: ${weddingInfo.weddingDate || 'No definida'}`);
        console.log(`   Lugar: ${weddingInfo.celebrationPlace || 'No definido'}`);
        console.log(`   Owners: ${JSON.stringify(data.ownerIds || [])}`);
        console.log(`   Planners: ${JSON.stringify(data.plannerIds || [])}`);
        console.log('');
      });
      
      console.log('\n💡 LAS BODAS ESTÁN EN FIRESTORE, NO EN POSTGRESQL');
      console.log('   Necesitas migrarlas a PostgreSQL para que funcionen con el nuevo sistema\n');
    } else {
      console.log('❌ No hay bodas en Firestore tampoco\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkFirestoreWeddings();
