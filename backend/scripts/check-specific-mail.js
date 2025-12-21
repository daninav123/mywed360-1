import { db } from '../db.js';

const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';
const mailId = 'yqNzfN9zUWJp7pu1ceGV'; // El ID del último mail según logs

async function checkMail() {
  try {
    // Buscar en la subcolección del usuario
    const mailDoc = await db.collection('users')
      .doc(userId)
      .collection('mails')
      .doc(mailId)
      .get();
    
    if (!mailDoc.exists) {
      console.log(`❌ Mail ${mailId} NO encontrado en subcolección usuario`);
      
      // Buscar en la colección global
      const globalMail = await db.collection('mails').doc(mailId).get();
      if (!globalMail.exists) {
        console.log(`❌ Mail ${mailId} NO encontrado en colección global tampoco`);
      } else {
        const data = globalMail.data();
        console.log(`✅ Mail ${mailId} encontrado en colección GLOBAL:`);
        console.log(`   From: ${data.from}`);
        console.log(`   To: ${data.to}`);
        console.log(`   Subject: ${data.subject}`);
        
        if (data.to && data.to.includes('@mg.malove.app')) {
          console.log('   ⚠️ PROBLEMA: Email en global tiene @mg.malove.app');
        } else if (data.to && data.to.includes('@malove.app')) {
          console.log('   ✅ OK: Email en global tiene @malove.app');
        }
      }
      return;
    }
    
    const data = mailDoc.data();
    console.log(`\n✅ Mail ${mailId} encontrado en subcolección usuario:`);
    console.log(`   From: ${data.from}`);
    console.log(`   To: ${data.to}`);
    console.log(`   Subject: ${data.subject}`);
    console.log(`   Date: ${data.date}`);
    console.log(`   Folder: ${data.folder}`);
    
    if (data.to && data.to.includes('@mg.malove.app')) {
      console.log('   ⚠️ PROBLEMA: Email tiene @mg.malove.app en lugar de @malove.app');
    } else if (data.to && data.to.includes('@malove.app')) {
      console.log('   ✅ OK: Email tiene @malove.app');
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMail();
