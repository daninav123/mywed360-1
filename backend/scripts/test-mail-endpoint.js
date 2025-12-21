/**
 * Test del endpoint GET /api/mail
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

async function testMailQuery() {
  console.log('🧪 Simulando query GET /api/mail?folder=sent\n');
  console.log('═'.repeat(60));
  
  // Obtener email del usuario
  const userSnapshot = await db.collection('users')
    .where('email', '==', 'danielnavarrocampos@icloud.com')
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.log('❌ Usuario no encontrado');
    return;
  }
  
  const userData = userSnapshot.docs[0].data();
  const userEmail = userData.myWed360Email || userData.email;
  
  console.log(`👤 Usuario: ${userEmail}`);
  console.log(`📧 Email normalizado: ${userEmail.toLowerCase()}`);
  
  // Query SENT
  console.log('\n📤 Query: folder=sent, from=' + userEmail.toLowerCase());
  const sentQuery = await db.collection('mails')
    .where('folder', '==', 'sent')
    .where('from', '==', userEmail.toLowerCase())
    .get();
  
  console.log(`   Resultados: ${sentQuery.size}`);
  
  sentQuery.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.subject} (de: ${data.from}, para: ${data.to})`);
  });
  
  // Query INBOX
  console.log('\n📥 Query: folder=inbox, to=' + userEmail.toLowerCase());
  const inboxQuery = await db.collection('mails')
    .where('folder', '==', 'inbox')
    .where('to', '==', userEmail.toLowerCase())
    .get();
  
  console.log(`   Resultados: ${inboxQuery.size}`);
  
  inboxQuery.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.subject} (de: ${data.from}, para: ${data.to})`);
  });
  
  // Mostrar TODOS los emails para comparar
  console.log('\n📊 TODOS los emails guardados:');
  const allMails = await db.collection('mails').limit(10).get();
  
  allMails.forEach(doc => {
    const data = doc.data();
    console.log(`\n   ${doc.id}`);
    console.log(`   - De: ${data.from}`);
    console.log(`   - Para: ${data.to}`);
    console.log(`   - Carpeta: ${data.folder}`);
    console.log(`   - Asunto: ${data.subject}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 DIAGNÓSTICO:');
  console.log(`   Usuario espera ver emails con:`);
  console.log(`   - SENT: from="${userEmail.toLowerCase()}"`);
  console.log(`   - INBOX: to="${userEmail.toLowerCase()}"`);
}

testMailQuery();
