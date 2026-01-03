/**
 * Verificar colección de emails en Firebase
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

async function checkMails() {
  console.log('🔍 Verificando colecciones de emails en Firebase\n');
  console.log('═'.repeat(60));
  
  // Verificar colección "mails"
  try {
    console.log('\n📁 Colección: mails');
    const mailsSnapshot = await db.collection('mails')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`   Total documentos: ${mailsSnapshot.size}`);
    
    if (!mailsSnapshot.empty) {
      console.log('\n   📧 Últimos 5 emails:');
      mailsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${doc.id}`);
        console.log(`      De: ${data.from || 'N/A'}`);
        console.log(`      Para: ${data.to || data.toList?.[0] || 'N/A'}`);
        console.log(`      Asunto: ${data.subject || 'Sin asunto'}`);
        console.log(`      Fecha: ${data.createdAt || data.date || 'N/A'}`);
        console.log(`      Carpeta: ${data.folder || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No hay emails en la colección "mails"');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Verificar colección "mail" (alternativa)
  try {
    console.log('\n\n📁 Colección: mail (alternativa)');
    const mailSnapshot = await db.collection('mail')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`   Total documentos: ${mailSnapshot.size}`);
    
    if (!mailSnapshot.empty) {
      console.log('\n   📧 Últimos 5 emails:');
      mailSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${doc.id}`);
        console.log(`      De: ${data.from || 'N/A'}`);
        console.log(`      Para: ${data.to || data.toList?.[0] || 'N/A'}`);
        console.log(`      Asunto: ${data.subject || 'Sin asunto'}`);
        console.log(`      Fecha: ${data.createdAt || data.date || 'N/A'}`);
        console.log(`      Carpeta: ${data.folder || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No hay emails en la colección "mail"');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '═'.repeat(60));
}

checkMails();
