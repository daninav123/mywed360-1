import admin from 'firebase-admin';
import fs from 'fs';

// Leer serviceAccount.json desde la raíz
const serviceAccount = JSON.parse(fs.readFileSync('../serviceAccount.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

const testPosts = [
  {
    title: 'Cómo planificar tu boda perfecta',
    slug: 'como-planificar-tu-boda-perfecta',
    language: 'es',
    availableLanguages: ['es'],
    excerpt: 'Descubre los mejores consejos para organizar una boda inolvidable con todos los detalles cubiertos.',
    content: {
      body: 'Planificar una boda puede parecer abrumador, pero con la organización adecuada se convierte en una experiencia maravillosa...',
      references: []
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      alt: 'Pareja de novios'
    },
    tags: ['planificación', 'consejos', 'organización'],
    byline: {
      id: 'planivia-team',
      name: 'Equipo Planivia',
      avatar: null
    },
    status: 'published',
    publishedAt: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    title: 'Tendencias en decoración de bodas 2025',
    slug: 'tendencias-decoracion-bodas-2025',
    language: 'es',
    availableLanguages: ['es'],
    excerpt: 'Las últimas tendencias en decoración que harán de tu boda un evento único y memorable.',
    content: {
      body: 'Este año las tendencias en decoración de bodas apuntan hacia lo natural y sostenible...',
      references: []
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80',
      alt: 'Decoración de boda'
    },
    tags: ['decoración', 'tendencias', '2025'],
    byline: {
      id: 'planivia-team',
      name: 'Equipo Planivia',
      avatar: null
    },
    status: 'published',
    publishedAt: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

async function addTestPosts() {
  try {
    console.log('🔄 Añadiendo posts de prueba a Firestore...');
    
    const batch = db.batch();
    
    for (const post of testPosts) {
      const docRef = db.collection('blogPosts').doc();
      batch.set(docRef, post);
      console.log(`✅ Post añadido: ${post.title} (${docRef.id})`);
    }
    
    await batch.commit();
    
    console.log('\n✅ Posts de prueba añadidos exitosamente');
    console.log('📊 Total de posts añadidos:', testPosts.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error añadiendo posts:', error);
    process.exit(1);
  }
}

addTestPosts();
