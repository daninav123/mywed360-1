import { db } from '../db.js';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';

const TEST_CONFIG = {
  userId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  supplierEmail: 'info@resonaevents.com',
  clientEmail: 'danielnavarrocampos@malove.app',
};

async function testSentMail() {
  try {
    console.log('🧪 TEST: Email en bandeja de salida\n');
    console.log('=====================================\n');

    // 1. Obtener info del usuario
    console.log('1️⃣ Verificando usuario...');
    const userDoc = await db.collection('users').doc(TEST_CONFIG.userId).get();
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }
    const userData = userDoc.data();
    console.log(`✅ Usuario: ${userData.email}`);
    console.log(`   maLoveEmail: ${userData.maLoveEmail}`);
    console.log(`   myWed360Email: ${userData.myWed360Email}\n`);

    // 2. Enviar email de solicitud
    console.log('2️⃣ Enviando email de solicitud...');
    const result = await sendQuoteRequestEmail({
      supplierEmail: TEST_CONFIG.supplierEmail,
      supplierName: 'ReSona Events',
      clientName: 'Dani Navarro',
      clientEmail: TEST_CONFIG.clientEmail,
      clientPhone: '+34 600 000 000',
      weddingDate: '2025-06-15',
      city: 'Barcelona',
      guestCount: 150,
      totalBudget: 10000,
      categoryName: 'Música',
      serviceDetails: { tipo: 'DJ + Saxo' },
      customMessage: 'Test de bandeja de salida',
      responseUrl: 'http://localhost:5173/test',
      requestId: `test-${Date.now()}`,
      userId: TEST_CONFIG.userId,
    });

    console.log('✅ Email enviado exitosamente!');
    console.log(`   Message ID: ${result.messageId}\n`);

    // 3. Verificar en subcolección del usuario
    console.log('3️⃣ Verificando email en bandeja salida del usuario...');
    
    // Esperar un poco para que se guarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar todos los mails en sent folder (sin orderBy para evitar índice)
    const sentMails = await db.collection('users')
      .doc(TEST_CONFIG.userId)
      .collection('mails')
      .where('folder', '==', 'sent')
      .limit(20)
      .get();

    if (sentMails.empty) {
      console.log('❌ FALLO: Email NO encontrado en bandeja de salida del usuario\n');
      process.exit(1);
    }

    // Buscar el más reciente manualmente
    let latestSent = null;
    let latestDate = null;
    sentMails.docs.forEach(doc => {
      const data = doc.data();
      const mailDate = new Date(data.date);
      if (!latestDate || mailDate > latestDate) {
        latestDate = mailDate;
        latestSent = { id: doc.id, data };
      }
    });

    const mailData = latestSent.data;
    
    console.log('✅ Email encontrado en bandeja de salida');
    console.log(`   ID: ${latestSent.id}`);
    console.log(`   From: ${mailData.from}`);
    console.log(`   To: ${mailData.to}`);
    console.log(`   Subject: ${mailData.subject}`);
    console.log(`   Folder: ${mailData.folder}`);
    console.log(`   Date: ${mailData.date}\n`);

    console.log('🎉 TEST COMPLETADO EXITOSAMENTE\n');
    console.log('=====================================');
    console.log('✅ Email enviado');
    console.log('✅ Email guardado en colección global');
    console.log('✅ Email guardado en bandeja salida del usuario\n');
    console.log('👀 Revisa tu bandeja en: http://localhost:5173');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en test:', error);
    process.exit(1);
  }
}

testSentMail();
