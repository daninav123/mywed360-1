/**
 * Test de autenticación para endpoint de emails
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
const auth = getAuth();
const USER_ID = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

async function testMailAuth() {
  console.log('🧪 Test de autenticación y consulta de emails\n');
  console.log('═'.repeat(60));
  
  // 1. Verificar usuario
  console.log('\n1️⃣ Verificando usuario en Firebase Auth...');
  try {
    const userRecord = await auth.getUser(USER_ID);
    console.log(`   ✅ Usuario: ${userRecord.email}`);
    console.log(`   UID: ${USER_ID}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return;
  }
  
  // 2. Verificar perfil en Firestore
  console.log('\n2️⃣ Verificando perfil en Firestore...');
  const userDoc = await db.collection('users').doc(USER_ID).get();
  const userData = userDoc.data();
  console.log(`   myWed360Email: ${userData.myWed360Email}`);
  console.log(`   email: ${userData.email}`);
  
  // 3. Contar emails en cada carpeta para este usuario
  console.log('\n3️⃣ Contando emails por carpeta...');
  
  const userEmail = userData.myWed360Email;
  
  // SENT
  const sentQuery = await db.collection('mails')
    .where('folder', '==', 'sent')
    .where('from', '==', userEmail)
    .get();
  console.log(`   📤 SENT: ${sentQuery.size} emails`);
  
  // INBOX
  const inboxQuery = await db.collection('mails')
    .where('folder', '==', 'inbox')
    .where('to', '==', userEmail)
    .get();
  console.log(`   📥 INBOX: ${inboxQuery.size} emails`);
  
  // 4. Mostrar detalles de emails
  console.log('\n4️⃣ Emails SENT:');
  sentQuery.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.subject} → ${data.to}`);
  });
  
  console.log('\n5️⃣ Emails INBOX:');
  inboxQuery.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.subject} ← ${data.from}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n💡 El usuario debería ver ${sentQuery.size + inboxQuery.size} emails en total`);
  console.log(`   En la app: localhost:5173/email`);
}

testMailAuth();
