import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer serviceAccount desde la raíz del proyecto
const serviceAccountPath = resolve(__dirname, '../serviceAccount.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

const blogPost = {
  title: 'Cómo organizar tu boda perfecta',
  slug: 'como-organizar-tu-boda-perfecta',
  language: 'es',
  availableLanguages: ['es'],
  excerpt: 'Descubre los secretos para planificar una boda inolvidable con estos consejos prácticos y profesionales.',
  content: {
    body: `# Cómo organizar tu boda perfecta

Planificar una boda puede parecer una tarea abrumadora, pero con la organización adecuada y estos consejos profesionales, tu gran día será exactamente como lo soñaste.

## 1. Define tu presupuesto desde el inicio

Lo primero y más importante es establecer un presupuesto realista. Esto te ayudará a tomar decisiones informadas sobre cada aspecto de tu boda.

## 2. Elige la fecha con anticipación

Reserva tu fecha con al menos 12-18 meses de anticipación, especialmente si planeas una boda en temporada alta.

## 3. Contrata a los proveedores clave

Los fotógrafos, videógrafos y lugares se agotan rápidamente. Asegúrate de contratarlos lo antes posible.

## 4. Crea un timeline detallado

Un cronograma bien planificado te ayudará a mantener todo bajo control y reducir el estrés.

¡Con estos consejos, estarás en el camino correcto hacia tu boda perfecta!`,
    references: []
  },
  coverImage: {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    alt: 'Pareja de novios felices'
  },
  tags: ['planificación', 'consejos', 'organización', 'bodas'],
  byline: {
    id: 'planivia-team',
    name: 'Equipo Planivia',
    avatar: null,
    bio: 'Expertos en planificación de bodas'
  },
  status: 'published',
  publishedAt: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  views: 0,
  featured: true
};

async function createPost() {
  try {
    console.log('🔄 Creando post de blog en Firestore...');
    
    const docRef = await db.collection('blogPosts').add(blogPost);
    
    console.log('\n✅ Post creado exitosamente');
    console.log('📝 ID:', docRef.id);
    console.log('📰 Título:', blogPost.title);
    console.log('🔗 Slug:', blogPost.slug);
    console.log('📅 Publicado:', blogPost.publishedAt.toDate().toISOString());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando post:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createPost();
