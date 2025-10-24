/**
 * Script de diagnóstico para verificar emails en inbox
 * 
 * Uso:
 * node backend/scripts/debugInboxEmails.js [email-del-usuario]
 */

import { db } from '../db.js';

const userEmail = process.argv[2] || null;

async function debugInboxEmails() {
  console.log('\n🔍 DIAGNÓSTICO DE EMAILS EN INBOX\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Contar todos los emails en inbox
    console.log('\n1️⃣ Emails totales en inbox:');
    const inboxSnapshot = await db.collection('mails')
      .where('folder', '==', 'inbox')
      .get();
    
    console.log(`   Total: ${inboxSnapshot.size} emails`);
    
    if (inboxSnapshot.size > 0) {
      console.log('\n   Últimos 5 emails en inbox:');
      inboxSnapshot.docs.slice(0, 5).forEach((doc, idx) => {
        const data = doc.data();
        console.log(`   ${idx + 1}. ID: ${doc.id}`);
        console.log(`      From: ${data.from}`);
        console.log(`      To: ${JSON.stringify(data.to)}`);
        console.log(`      Subject: ${data.subject}`);
        console.log(`      Date: ${data.date || data.createdAt}`);
        console.log('');
      });
    }
    
    // 2. Si se proporcionó email de usuario, buscar sus emails
    if (userEmail) {
      console.log(`\n2️⃣ Buscando emails para: ${userEmail}`);
      console.log(`   Email normalizado: ${userEmail.toLowerCase().trim()}`);
      
      // Buscar en subcolección del usuario
      console.log('\n   A. Buscando en users/{uid}/mails:');
      const usersSnapshot = await db.collection('users')
        .where('maLoveEmail', '==', userEmail.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        const uid = usersSnapshot.docs[0].id;
        const userData = usersSnapshot.docs[0].data();
        console.log(`      ✅ Usuario encontrado!`);
        console.log(`      UID: ${uid}`);
        console.log(`      Email: ${userData.email}`);
        console.log(`      maLoveEmail: ${userData.maLoveEmail}`);
        
        const userMailsSnapshot = await db.collection('users')
          .doc(uid)
          .collection('mails')
          .where('folder', '==', 'inbox')
          .get();
        
        console.log(`      Emails en subcolección: ${userMailsSnapshot.size}`);
        
        if (userMailsSnapshot.size > 0) {
          userMailsSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
            const data = doc.data();
            console.log(`      ${idx + 1}. ${data.subject}`);
          });
        }
      } else {
        console.log(`      ❌ Usuario NO encontrado con myWed360Email`);
        
        // Intentar con email de login
        const loginSnapshot = await db.collection('users')
          .where('email', '==', userEmail.toLowerCase().trim())
          .limit(1)
          .get();
        
        if (!loginSnapshot.empty) {
          const uid = loginSnapshot.docs[0].id;
          const userData = loginSnapshot.docs[0].data();
          console.log(`      ✅ Usuario encontrado por email de login!`);
          console.log(`      UID: ${uid}`);
          console.log(`      Email: ${userData.email}`);
          console.log(`      maLoveEmail: ${userData.maLoveEmail || 'NO CONFIGURADO'}`);
        }
      }
      
      // Buscar en colección global por 'to'
      console.log('\n   B. Buscando en mails (colección global) donde to == email:');
      const globalByToSnapshot = await db.collection('mails')
        .where('folder', '==', 'inbox')
        .where('to', '==', userEmail.toLowerCase().trim())
        .get();
      
      console.log(`      Emails encontrados: ${globalByToSnapshot.size}`);
      
      if (globalByToSnapshot.size > 0) {
        globalByToSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
          const data = doc.data();
          console.log(`      ${idx + 1}. ${data.subject} (${data.date})`);
        });
      }
      
      // Buscar emails donde 'to' contenga el email (puede ser array o string con comas)
      console.log('\n   C. Buscando todos los inbox y filtrando manualmente:');
      const allInboxSnapshot = await db.collection('mails')
        .where('folder', '==', 'inbox')
        .limit(100)
        .get();
      
      const matchingEmails = [];
      allInboxSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const to = data.to;
        let matches = false;
        
        if (typeof to === 'string') {
          matches = to.toLowerCase().includes(userEmail.toLowerCase());
        } else if (Array.isArray(to)) {
          matches = to.some(addr => 
            typeof addr === 'string' && addr.toLowerCase().includes(userEmail.toLowerCase())
          );
        }
        
        if (matches) {
          matchingEmails.push({ id: doc.id, ...data });
        }
      });
      
      console.log(`      Emails que coinciden: ${matchingEmails.length}`);
      
      if (matchingEmails.length > 0) {
        matchingEmails.slice(0, 5).forEach((email, idx) => {
          console.log(`      ${idx + 1}. Subject: ${email.subject}`);
          console.log(`         From: ${email.from}`);
          console.log(`         To: ${JSON.stringify(email.to)}`);
          console.log(`         Date: ${email.date}`);
          console.log('');
        });
      }
    }
    
    // 3. Verificar estructura de datos
    console.log('\n3️⃣ Análisis de estructura de datos:');
    if (inboxSnapshot.size > 0) {
      const firstEmail = inboxSnapshot.docs[0].data();
      console.log('   Estructura del primer email:');
      console.log(`   - to (tipo): ${typeof firstEmail.to}`);
      console.log(`   - to (valor): ${JSON.stringify(firstEmail.to)}`);
      console.log(`   - toList: ${JSON.stringify(firstEmail.toList)}`);
      console.log(`   - toArray: ${JSON.stringify(firstEmail.toArray)}`);
      console.log(`   - recipients: ${JSON.stringify(firstEmail.recipients)}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }
}

debugInboxEmails()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
