import { db } from '../db.js';

const TEST_CONFIG = {
  userId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  supplierEmail: 'info@resonaevents.com',
};

async function checkMusicRequests() {
  try {
    console.log('🔍 Verificando solicitudes de música/ReSona Events\n');
    console.log('=====================================\n');

    // 1. Buscar todas las solicitudes del usuario
    console.log('1️⃣ Buscando todas las solicitudes del usuario...');
    const allRequests = await db.collection('quote-requests-internet')
      .where('userId', '==', TEST_CONFIG.userId)
      .get();

    console.log(`✅ Encontradas ${allRequests.size} solicitudes totales\n`);

    if (allRequests.empty) {
      console.log('❌ No hay solicitudes del usuario\n');
      process.exit(1);
    }

    // 2. Mostrar todas las solicitudes con sus categorías
    console.log('2️⃣ Detalle de solicitudes:\n');
    allRequests.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📝 Solicitud ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Proveedor: ${data.supplierName}`);
      console.log(`   Email: ${data.supplierEmail}`);
      console.log(`   Categoría (supplierCategory): "${data.supplierCategory}"`);
      console.log(`   Categoría (category): "${data.category}"`);
      console.log(`   Estado: ${data.status}`);
      console.log(`   Fecha: ${data.createdAt?.toDate?.() || data.createdAt}`);
      console.log('');
    });

    // 3. Buscar específicamente ReSona Events
    console.log('3️⃣ Buscando solicitudes a ReSona Events...');
    const resonaRequests = allRequests.docs.filter(doc => {
      const data = doc.data();
      return data.supplierEmail === TEST_CONFIG.supplierEmail || 
             data.supplierName?.toLowerCase().includes('resona');
    });

    if (resonaRequests.length === 0) {
      console.log('❌ No se encontraron solicitudes a ReSona Events\n');
    } else {
      console.log(`✅ Encontradas ${resonaRequests.length} solicitudes a ReSona Events:\n`);
      resonaRequests.forEach((doc, index) => {
        const data = doc.data();
        console.log(`🎵 ReSona ${index + 1}:`);
        console.log(`   supplierCategory: "${data.supplierCategory}"`);
        console.log(`   category: "${data.category}"`);
        console.log(`   Estado: ${data.status}`);
        console.log(`   QuoteResponseId: ${data.quoteResponseId || 'N/A'}`);
        console.log('');
      });
    }

    // 4. Verificar qué categorías se están buscando
    console.log('4️⃣ Categorías únicas encontradas:');
    const categories = new Set();
    allRequests.docs.forEach(doc => {
      const data = doc.data();
      if (data.supplierCategory) categories.add(data.supplierCategory);
      if (data.category) categories.add(`alt: ${data.category}`);
    });
    categories.forEach(cat => console.log(`   - "${cat}"`));

    console.log('\n=====================================');
    console.log('✅ Verificación completada\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMusicRequests();
