import { db } from '../db.js';

const websiteUrl = 'https://www.resonaevents.com/';

async function checkWebCache() {
  try {
    const docId = encodeURIComponent(websiteUrl);
    const doc = await db.collection('supplier_web_analysis').doc(docId).get();
    
    if (!doc.exists) {
      console.log('❌ No hay caché para:', websiteUrl);
      return;
    }
    
    const data = doc.data();
    console.log('\n📦 Caché encontrado:');
    console.log('=====================================');
    console.log('URL:', data.url);
    console.log('createdAt:', data.createdAt);
    console.log('expiresAt:', data.expiresAt);
    console.log('\n📧 Datos de contacto:');
    console.log('contactEmail:', data.data?.contactEmail || 'NO DISPONIBLE');
    console.log('phone:', data.data?.phone || 'NO DISPONIBLE');
    console.log('address:', data.data?.address || 'NO DISPONIBLE');
    console.log('\n📝 Otros datos disponibles:');
    console.log('Claves en data:', Object.keys(data.data || {}));
    console.log('\n');
    
    if (!data.data?.contactEmail) {
      console.log('⚠️ PROBLEMA: No hay contactEmail en el caché');
      console.log('Necesitas analizar de nuevo la web o extraer el email manualmente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWebCache();
