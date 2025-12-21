import { db } from '../db.js';

const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

async function checkLatestMail() {
  try {
    // Buscar el mail más reciente del usuario
    const mailsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('mails')
      .limit(1)
      .get();
    
    if (mailsSnapshot.empty) {
      console.log('❌ No hay mails en la bandeja del usuario');
      return;
    }
    
    // Obtener todos y ordenar manualmente
    const allMails = [];
    mailsSnapshot.forEach(doc => {
      allMails.push({ id: doc.id, ...doc.data() });
    });
    
    // Obtener más mails para encontrar el más reciente
    const moreMails = await db.collection('users')
      .doc(userId)
      .collection('mails')
      .limit(20)
      .get();
    
    const allMailsList = [];
    moreMails.forEach(doc => {
      allMailsList.push({ id: doc.id, ...doc.data() });
    });
    
    // Ordenar por fecha
    allMailsList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('\n📧 Últimos 5 emails en bandeja:\n');
    console.log('=====================================');
    
    allMailsList.slice(0, 5).forEach((mail, idx) => {
      console.log(`\n${idx + 1}. ID: ${mail.id}`);
      console.log(`   From: ${mail.from}`);
      console.log(`   To: ${mail.to}`);
      console.log(`   Subject: ${mail.subject}`);
      console.log(`   Date: ${mail.date}`);
      console.log(`   Folder: ${mail.folder}`);
      
      // Verificar si tiene @mg.malove.app
      if (mail.to && mail.to.includes('@mg.malove.app')) {
        console.log('   ⚠️ PROBLEMA: Email tiene @mg.malove.app en lugar de @malove.app');
      } else if (mail.to && mail.to.includes('@malove.app')) {
        console.log('   ✅ OK: Email tiene @malove.app');
      }
    });
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestMail();
