import { db } from '../db.js';

const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

async function checkUserEmail() {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const data = userDoc.data();
    console.log('\n📧 Configuración de emails del usuario:');
    console.log('=====================================');
    console.log('email (login):', data.email || 'NO CONFIGURADO');
    console.log('maLoveEmail:', data.maLoveEmail || 'NO CONFIGURADO');
    console.log('myWed360Email:', data.myWed360Email || 'NO CONFIGURADO');
    console.log('\n✅ Emails válidos para recibir correos:');
    
    const validEmails = [];
    if (data.email) validEmails.push(`  - ${data.email} (email login)`);
    if (data.maLoveEmail) validEmails.push(`  - ${data.maLoveEmail} (maLoveEmail)`);
    if (data.myWed360Email) validEmails.push(`  - ${data.myWed360Email} (myWed360Email)`);
    
    if (validEmails.length > 0) {
      validEmails.forEach(e => console.log(e));
    } else {
      console.log('  ⚠️ NO HAY EMAILS CONFIGURADOS');
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserEmail();
