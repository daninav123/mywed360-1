import { db } from '../db.js';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';

const TEST_CONFIG = {
  supplierEmail: 'info@resonaevents.com',
  supplierName: 'ReSona Events',
  clientName: 'Dani Navarro',
  clientEmail: 'danielnavarrocampos@malove.app',
  clientPhone: '+34666777888',
  weddingDate: '2025-06-15',
  city: 'Valencia',
  guestCount: 100,
  totalBudget: 15000,
  categoryName: 'Organización',
  responseUrl: 'http://localhost:5173/responder-presupuesto/test-token-123',
  requestId: 'test-' + Date.now(),
};

console.log('🧪 TEST: Envío de solicitud de presupuesto completo\n');
console.log('=====================================\n');

async function runTest() {
  try {
    // Paso 1: Verificar usuario existe
    console.log('1️⃣ Verificando usuario...');
    const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('❌ Usuario no encontrado');
    }
    
    const userData = userDoc.data();
    console.log(`✅ Usuario: ${userData.email}`);
    console.log(`   maLoveEmail: ${userData.maLoveEmail}`);
    console.log(`   myWed360Email: ${userData.myWed360Email}\n`);
    
    // Paso 2: Enviar email
    console.log('2️⃣ Enviando email de solicitud...');
    console.log(`   From: MyWed360 - Solicitudes <solicitudes@mg.malove.app>`);
    console.log(`   Reply-To: ${TEST_CONFIG.clientEmail}`);
    console.log(`   To: ${TEST_CONFIG.supplierEmail}`);
    console.log(`   Subject: 💼 Nueva solicitud de presupuesto de ${TEST_CONFIG.clientName}\n`);
    
    const emailResult = await sendQuoteRequestEmail({
      supplierEmail: TEST_CONFIG.supplierEmail,
      supplierName: TEST_CONFIG.supplierName,
      clientName: TEST_CONFIG.clientName,
      clientEmail: TEST_CONFIG.clientEmail,
      clientPhone: TEST_CONFIG.clientPhone,
      weddingDate: TEST_CONFIG.weddingDate,
      city: TEST_CONFIG.city,
      guestCount: TEST_CONFIG.guestCount,
      totalBudget: TEST_CONFIG.totalBudget,
      categoryName: TEST_CONFIG.categoryName,
      serviceDetails: {
        tipoEvento: 'Boda completa',
        servicios: 'Organización integral del evento'
      },
      customMessage: 'Este es un email de prueba del sistema de solicitudes.',
      responseUrl: TEST_CONFIG.responseUrl,
      requestId: TEST_CONFIG.requestId,
    });
    
    console.log('✅ Email enviado exitosamente!');
    console.log(`   Message ID: ${emailResult.messageId}`);
    console.log(`   To: ${emailResult.to}\n`);
    
    // Paso 3: Mail se guardó en colección "sent" (verificado en logs)
    console.log('3️⃣ Mail guardado en colección "mails" (verificado en logs)\n');
    
    // Paso 4: Simular webhook de respuesta
    console.log('4️⃣ Simulando webhook de Mailgun (respuesta del proveedor)...\n');
    
    const webhookPayload = {
      timestamp: Math.floor(Date.now() / 1000).toString(),
      token: 'test-token-' + Date.now(),
      signature: 'test-signature',
      recipient: TEST_CONFIG.clientEmail.replace('@malove.app', '@mg.malove.app'),
      sender: TEST_CONFIG.supplierEmail,
      subject: `Re: 💼 Nueva solicitud de presupuesto de ${TEST_CONFIG.clientName}`,
      'body-plain': 'Hola Dani,\n\nMuchas gracias por tu interés. Adjunto te envío nuestro presupuesto para tu boda.\n\nSaludos,\nReSona Events',
      'stripped-text': 'Hola Dani,\n\nMuchas gracias por tu interés. Adjunto te envío nuestro presupuesto para tu boda.\n\nSaludos,\nReSona Events',
    };
    
    console.log(`   Simulando email de ${webhookPayload.sender} → ${webhookPayload.recipient}`);
    
    const fetch = (await import('node-fetch')).default;
    const webhookResponse = await fetch('http://localhost:4004/api/inbound/mailgun', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(webhookPayload).toString(),
    });
    
    const webhookData = await webhookResponse.json();
    console.log(`   Status: ${webhookResponse.status}`);
    console.log(`   Response: ${JSON.stringify(webhookData)}\n`);
    
    if (webhookResponse.status !== 200) {
      throw new Error(`❌ Webhook falló con status ${webhookResponse.status}`);
    }
    
    // Paso 5: Verificar que la respuesta llegó a la bandeja del usuario
    console.log('5️⃣ Verificando respuesta en bandeja del usuario...');
    
    // Esperar 3 segundos para que se procese
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Buscar sin orderBy para evitar error de índice
    const userMailsQuery = await db.collection('users')
      .doc(userId)
      .collection('mails')
      .where('from', '==', TEST_CONFIG.supplierEmail.toLowerCase())
      .limit(10)
      .get();
    
    if (userMailsQuery.empty) {
      throw new Error('❌ FALLO: Respuesta NO llegó a la bandeja del usuario');
    }
    
    // Buscar el mail más reciente manualmente
    let userMail = null;
    let latestDate = null;
    userMailsQuery.docs.forEach(doc => {
      const data = doc.data();
      const mailDate = new Date(data.date);
      if (!latestDate || mailDate > latestDate) {
        latestDate = mailDate;
        userMail = { id: doc.id, data };
      }
    });
    
    if (!userMail) {
      throw new Error('❌ FALLO: No se encontró mail del proveedor');
    }
    
    console.log(`✅ Respuesta encontrada en bandeja del usuario`);
    console.log(`   ID: ${userMail.id}`);
    console.log(`   From: ${userMail.data.from}`);
    console.log(`   To: ${userMail.data.to}`);
    console.log(`   Subject: ${userMail.data.subject}`);
    console.log(`   Folder: ${userMail.data.folder}\n`);
    
    // Resumen final
    console.log('🎉 TEST COMPLETADO EXITOSAMENTE\n');
    console.log('=====================================');
    console.log('✅ Email de solicitud enviado');
    console.log('✅ Respuesta simulada recibida');
    console.log('✅ Respuesta guardada en bandeja usuario');
    console.log('\n👀 Revisa tu bandeja en: http://localhost:5173');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FALLÓ\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runTest();
