// Script para añadir campos hasPortfolio y slug a ReSona
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixResonaFields() {
  try {
    console.log('🔍 Buscando ReSona...');
    
    const snapshot = await db.collection('suppliers')
      .where('name', '==', 'ReSona')
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontró ReSona');
      process.exit(1);
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('\n📊 Datos actuales de ReSona:');
    console.log('   ID:', doc.id);
    console.log('   name:', data.name);
    console.log('   hasPortfolio:', data.hasPortfolio);
    console.log('   slug:', data.slug);
    console.log('   portfolio length:', data.portfolio?.length || 0);
    
    // Actualizar campos
    const updates = {
      hasPortfolio: true,
      slug: 'resona-valencia',
    };
    
    console.log('\n✨ Actualizando campos...');
    await doc.ref.update(updates);
    
    console.log('✅ ReSona actualizado correctamente!');
    console.log('   hasPortfolio:', updates.hasPortfolio);
    console.log('   slug:', updates.slug);
    
    // Verificar
    const updated = await doc.ref.get();
    const updatedData = updated.data();
    console.log('\n🔍 Verificación:');
    console.log('   hasPortfolio:', updatedData.hasPortfolio);
    console.log('   slug:', updatedData.slug);
    console.log('   portfolio length:', updatedData.portfolio?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixResonaFields();
