/**
 * Script para verificar solicitud de presupuesto guardada
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar credenciales
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();

async function checkQuoteRequest() {
  try {
    console.log('🔍 Buscando solicitud de presupuesto: BjLhNP2SS8UD9crTp5WM\n');
    
    // Buscar en quote-requests-internet
    const doc = await db.collection('quote-requests-internet').doc('BjLhNP2SS8UD9crTp5WM').get();
    
    if (!doc.exists) {
      console.log('❌ Documento NO encontrado\n');
      
      // Listar todas las solicitudes recientes
      console.log('📋 Listando últimas 5 solicitudes en quote-requests-internet:\n');
      const recent = await db.collection('quote-requests-internet')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      recent.forEach((d, i) => {
        const data = d.data();
        console.log(`${i+1}. ${d.id}`);
        console.log(`   Proveedor: ${data.supplierName}`);
        console.log(`   UserId: ${data.userId || 'N/A'}`);
        console.log(`   Fecha: ${data.createdAt?.toDate?.() || 'N/A'}`);
        console.log('');
      });
      
      return;
    }
    
    const data = doc.data();
    
    console.log('✅ SOLICITUD ENCONTRADA\n');
    console.log('═'.repeat(60));
    console.log('📄 Datos guardados:\n');
    console.log(`   ID: ${doc.id}`);
    console.log(`   Proveedor: ${data.supplierName}`);
    console.log(`   Categoría: ${data.supplierCategory} (${data.supplierCategoryName})`);
    console.log(`   UserId: ${data.userId || '⚠️  NO GUARDADO'}`);
    console.log(`   WeddingId: ${data.weddingId || 'N/A'}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Fecha: ${data.createdAt?.toDate?.() || 'N/A'}`);
    console.log('');
    console.log('👤 Contacto:');
    console.log(`   Nombre: ${data.contacto?.nombre || 'N/A'}`);
    console.log(`   Email: ${data.contacto?.email || 'N/A'}`);
    console.log(`   Teléfono: ${data.contacto?.telefono || 'N/A'}`);
    console.log('');
    console.log('💒 Info boda:');
    console.log(`   Fecha: ${data.weddingInfo?.fecha || 'N/A'}`);
    console.log(`   Ciudad: ${data.weddingInfo?.ciudad || 'N/A'}`);
    console.log(`   Invitados: ${data.weddingInfo?.numeroInvitados || 'N/A'}`);
    console.log('');
    console.log('═'.repeat(60));
    
    if (!data.userId) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO:');
      console.log('   El campo "userId" está vacío o null');
      console.log('   Por eso no aparece en la lista del usuario\n');
      console.log('💡 SOLUCIÓN:');
      console.log('   Verificar que el usuario esté autenticado al solicitar el presupuesto');
      console.log('   El backend debe recibir userId en el payload\n');
    } else {
      console.log('\n✅ UserId guardado correctamente');
      console.log('   El problema puede estar en:');
      console.log('   1. El usuario no está autenticado en el frontend');
      console.log('   2. El userId del usuario actual es diferente');
      console.log('   3. Hay un error en la query del frontend\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkQuoteRequest();
