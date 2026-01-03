// Script para verificar y configurar el slug de ReSona
import { db } from './db.js';

const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw';

async function checkAndFixResonaSlug() {
  console.log('\n🔍 VERIFICANDO SLUG DE RESONA\n');
  console.log('='.repeat(70));

  try {
    // 1. Obtener datos actuales
    const supplierDoc = await db.collection('suppliers').doc(SUPPLIER_ID).get();

    if (!supplierDoc.exists) {
      console.log('❌ ERROR: Proveedor no encontrado');
      return;
    }

    const data = supplierDoc.data();
    console.log('\n📋 Datos actuales:');
    console.log('   ID:', SUPPLIER_ID);
    console.log('   Nombre:', data.profile?.name || data.name || 'N/A');
    console.log('   Slug actual:', data.profile?.slug || '❌ NO TIENE SLUG');
    console.log('   Categoría:', data.profile?.category || 'N/A');

    // 2. Verificar portfolio
    const portfolioQuery = await db
      .collection('suppliers')
      .doc(SUPPLIER_ID)
      .collection('portfolio')
      .get();

    console.log('\n📸 Portfolio:');
    console.log('   Fotos:', portfolioQuery.size);

    if (portfolioQuery.size > 0) {
      console.log('   ✅ Tiene fotos en el portfolio');
      portfolioQuery.docs.slice(0, 3).forEach((doc, i) => {
        const photo = doc.data();
        console.log(`   ${i + 1}. ${photo.url || 'Sin URL'} (${photo.category || 'sin categoría'})`);
      });
    } else {
      console.log('   ⚠️  NO tiene fotos en el portfolio');
    }

    // 3. Configurar slug si no existe
    const currentSlug = data.profile?.slug;
    
    if (!currentSlug) {
      const newSlug = 'resona'; // Slug basado en el nombre
      
      console.log('\n🔧 Configurando slug...');
      console.log('   Nuevo slug:', newSlug);

      await db.collection('suppliers').doc(SUPPLIER_ID).update({
        'profile.slug': newSlug,
        'profile.hasPortfolio': portfolioQuery.size > 0,
        updatedAt: new Date().toISOString(),
      });

      console.log('   ✅ Slug configurado correctamente');

      // Verificar que se guardó
      const updatedDoc = await db.collection('suppliers').doc(SUPPLIER_ID).get();
      const updatedData = updatedDoc.data();
      console.log('\n✅ VERIFICACIÓN:');
      console.log('   Slug guardado:', updatedData.profile?.slug);
      console.log('   hasPortfolio:', updatedData.profile?.hasPortfolio);

    } else {
      console.log('\n✅ El proveedor YA tiene slug configurado');
    }

    // 4. Probar la API
    console.log('\n🧪 Probando API pública...');
    const slugToTest = currentSlug || 'resona';
    console.log(`   URL: GET /api/suppliers/public/${slugToTest}`);
    console.log('   Prueba manual:');
    console.log(`   curl http://localhost:4004/api/suppliers/public/${slugToTest}`);

    // 5. URL del portfolio
    console.log('\n🎯 URL DEL PORTFOLIO:');
    console.log(`   http://localhost:5173/proveedor/${slugToTest}`);
    console.log('');

    console.log('='.repeat(70));
    console.log('\n✅ VERIFICACIÓN COMPLETA\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

checkAndFixResonaSlug();
