// Script para agregar fotos de ejemplo al portfolio de ReSona
import { db } from './db.js';

const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw';

// Fotos de ejemplo de Unsplash relacionadas con música/bodas
const samplePhotos = [
  {
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    title: 'Concierto en vivo',
    description: 'Actuación en directo con iluminación profesional',
    category: 'bodas',
    tags: ['musica', 'directo', 'boda'],
    featured: true,
  },
  {
    url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    title: 'Ambiente romántico',
    description: 'Música suave para ceremonia',
    category: 'bodas',
    tags: ['ceremonia', 'romantico'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    title: 'Equipo profesional',
    description: 'Equipamiento de audio de alta calidad',
    category: 'eventos-corporativos',
    tags: ['equipo', 'profesional'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    title: 'Banda en vivo',
    description: 'Grupo musical completo',
    category: 'bodas',
    tags: ['banda', 'musica', 'directo'],
    featured: true,
  },
  {
    url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    title: 'Pista de baile',
    description: 'Ambientación perfecta para la fiesta',
    category: 'bodas',
    tags: ['fiesta', 'baile', 'ambiente'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    title: 'DJ profesional',
    description: 'Música personalizada para tu evento',
    category: 'bodas',
    tags: ['dj', 'musica', 'fiesta'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
    title: 'Instrumentos acústicos',
    description: 'Actuación íntima y elegante',
    category: 'ceremonias',
    tags: ['acustico', 'guitarra', 'elegante'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1519908888274-5b98e42cf0a7?w=800',
    title: 'Show en vivo',
    description: 'Espectáculo completo con luces',
    category: 'bodas',
    tags: ['show', 'luces', 'espectaculo'],
    featured: true,
  },
  {
    url: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800',
    title: 'Saxofón en vivo',
    description: 'Música elegante para cóctel',
    category: 'ceremonias',
    tags: ['saxofon', 'elegante', 'coctel'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800',
    title: 'Cantante profesional',
    description: 'Voz en directo para tu boda',
    category: 'bodas',
    tags: ['cantante', 'voz', 'directo'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800',
    title: 'Violín romántico',
    description: 'Música clásica para ceremonia',
    category: 'ceremonias',
    tags: ['violin', 'clasica', 'romantico'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    title: 'Piano de cola',
    description: 'Elegancia y distinción',
    category: 'ceremonias',
    tags: ['piano', 'elegante', 'clasico'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    title: 'Batería en vivo',
    description: 'Ritmo y energía para tu fiesta',
    category: 'bodas',
    tags: ['bateria', 'ritmo', 'fiesta'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    title: 'Micrófono vintage',
    description: 'Estilo retro para tu evento',
    category: 'bodas',
    tags: ['vintage', 'retro', 'estilo'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?w=800',
    title: 'Guitarra eléctrica',
    description: 'Rock y energía',
    category: 'eventos-corporativos',
    tags: ['guitarra', 'rock', 'energia'],
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800',
    title: 'Trompeta jazz',
    description: 'Ambiente sofisticado',
    category: 'bodas',
    tags: ['jazz', 'trompeta', 'sofisticado'],
    featured: false,
  },
];

async function addPortfolioPhotos() {
  console.log('\n🎵 AGREGANDO FOTOS AL PORTFOLIO DE RESONA\n');
  console.log('='.repeat(70));

  try {
    // Verificar proveedor
    const supplierDoc = await db.collection('suppliers').doc(SUPPLIER_ID).get();
    if (!supplierDoc.exists) {
      console.log('❌ ERROR: Proveedor no encontrado');
      return;
    }

    const supplierData = supplierDoc.data();
    console.log('✅ Proveedor:', supplierData.profile?.name || supplierData.name);

    // Obtener fotos actuales
    const currentPhotos = await db
      .collection('suppliers')
      .doc(SUPPLIER_ID)
      .collection('portfolio')
      .get();

    console.log('\n📸 Portfolio actual:', currentPhotos.size, 'fotos');

    // Agregar fotos nuevas
    const batch = db.batch();
    let added = 0;

    for (const photo of samplePhotos) {
      const photoRef = db
        .collection('suppliers')
        .doc(SUPPLIER_ID)
        .collection('portfolio')
        .doc();

      const photoData = {
        url: photo.url,
        original: photo.url,
        thumbnails: {
          small: photo.url,
          medium: photo.url,
          large: photo.url,
        },
        title: photo.title,
        description: photo.description,
        category: photo.category,
        tags: photo.tags,
        featured: photo.featured,
        isCover: false,
        views: 0,
        likes: 0,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(photoRef, photoData);
      added++;
    }

    await batch.commit();

    console.log(`\n✅ Agregadas ${added} fotos nuevas`);

    // Actualizar flag de portfolio
    await db.collection('suppliers').doc(SUPPLIER_ID).update({
      'profile.hasPortfolio': true,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Flag hasPortfolio actualizado');

    // Verificar total
    const totalPhotos = await db
      .collection('suppliers')
      .doc(SUPPLIER_ID)
      .collection('portfolio')
      .get();

    console.log('\n📊 RESULTADO:');
    console.log('   Total de fotos:', totalPhotos.size);
    console.log('   Destacadas:', totalPhotos.docs.filter(d => d.data().featured).length);

    console.log('\n🎯 URLs para probar:');
    console.log(`   Modal: http://localhost:5173/proveedores (buscar "ReSona" y click "Ver detalles")`);
    console.log(`   Portfolio público: http://localhost:5173/proveedor/resona-valencia`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ PORTFOLIO ACTUALIZADO CORRECTAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

addPortfolioPhotos();
