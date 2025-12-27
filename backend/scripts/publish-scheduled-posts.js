import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'lovenda-98c77',
  });
}

const db = admin.firestore();

async function publishScheduledPosts() {
  console.log('🔍 Buscando posts scheduled...');
  
  const snapshot = await db.collection('blogPosts')
    .where('status', '==', 'scheduled')
    .get();
  
  console.log(`📊 Encontrados: ${snapshot.size} posts`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`✏️  Publicando: ${data.title?.substring(0, 50)}...`);
    
    await doc.ref.update({
      status: 'published',
      publishedAt: data.publishedAt || admin.firestore.FieldValue.serverTimestamp(),
      scheduledAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  console.log('✅ Todos los posts actualizados a published');
  process.exit(0);
}

publishScheduledPosts().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
