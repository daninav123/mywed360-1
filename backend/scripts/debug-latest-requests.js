/**
 * Script para debuggear las últimas solicitudes de presupuesto
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();

async function debugLatestRequests() {
  try {
    console.log('\n🔍 Últimas 5 solicitudes de presupuesto\n');
    console.log('═'.repeat(80));
    
    const snapshot = await db.collection('quote-requests-internet')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No hay solicitudes en quote-requests-internet\n');
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.();
      const isReSona = data.supplierName?.toLowerCase().includes('resona');
      
      console.log(`\n${index + 1}. ${isReSona ? '🎯 ' : ''}${doc.id}`);
      console.log('─'.repeat(80));
      console.log(`   Proveedor: ${data.supplierName}`);
      console.log(`   Email proveedor: ${data.supplierEmail || '❌ NO CONFIGURADO'}`);
      console.log(`   UserId: ${data.userId || 'N/A'}`);
      console.log(`   Cliente: ${data.contacto?.nombre} (${data.contacto?.email})`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Fecha: ${createdAt ? createdAt.toLocaleString('es-ES') : 'N/A'}`);
      
      if (!data.supplierEmail) {
        console.log('\n   ⚠️  PROBLEMA: No hay email del proveedor');
        console.log('   → El sistema NO pudo enviar el email automáticamente');
      }
      
      if (isReSona) {
        console.log('\n   📧 Email esperado: info@resonaevents.com');
        if (data.supplierEmail !== 'info@resonaevents.com') {
          console.log(`   ❌ Email actual: ${data.supplierEmail || 'VACÍO'}`);
        }
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 Acciones recomendadas:\n');
    console.log('1. Si el email está vacío o incorrecto:');
    console.log('   → El proveedor de Google Places no tiene email público');
    console.log('   → La extracción automática de la web no funcionó');
    console.log('\n2. Para corregir manualmente:');
    console.log('   → Ejecutar: node backend/scripts/fix-resona-email.js\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLatestRequests();
