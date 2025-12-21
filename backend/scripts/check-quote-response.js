import { db } from '../db.js';

const TEST_CONFIG = {
  userId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  supplierEmail: 'info@resonaevents.com',
};

async function checkQuoteResponses() {
  try {
    console.log('🔍 Verificando respuestas de presupuestos recibidas\n');
    console.log('=====================================\n');

    // 1. Buscar emails recibidos del proveedor
    console.log('1️⃣ Buscando emails recibidos de info@resonaevents.com...');
    const receivedMails = await db.collection('users')
      .doc(TEST_CONFIG.userId)
      .collection('mails')
      .where('from', '==', TEST_CONFIG.supplierEmail)
      .limit(10)
      .get();

    if (receivedMails.empty) {
      console.log('❌ No hay emails recibidos del proveedor\n');
    } else {
      console.log(`✅ Encontrados ${receivedMails.size} emails del proveedor\n`);
      
      receivedMails.docs.forEach((doc, index) => {
        const mail = doc.data();
        console.log(`📧 Email ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Subject: ${mail.subject}`);
        console.log(`   Date: ${mail.date}`);
        console.log(`   LinkedQuoteResponseId: ${mail.linkedQuoteResponseId || 'NO VINCULADO'}`);
        console.log('');
      });
    }

    // 2. Buscar presupuestos analizados (sin orderBy para evitar índice)
    console.log('2️⃣ Buscando presupuestos analizados en quote-responses...');
    const quoteResponses = await db.collection('quote-responses')
      .where('supplierEmail', '==', TEST_CONFIG.supplierEmail)
      .limit(10)
      .get();

    if (quoteResponses.empty) {
      console.log('❌ No hay presupuestos analizados aún\n');
      console.log('💡 El sistema debería analizarlos automáticamente al recibir el email.');
      console.log('   Verifica los logs del backend para ver si hubo algún error.\n');
    } else {
      console.log(`✅ Encontrados ${quoteResponses.size} presupuestos analizados:\n`);
      
      quoteResponses.docs.forEach((doc, index) => {
        const quote = doc.data();
        console.log(`💰 Presupuesto ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Precio Total: ${quote.totalPrice || 'N/A'}€`);
        console.log(`   Proveedor: ${quote.supplierName}`);
        console.log(`   Confianza IA: ${quote.confidence || 'N/A'}%`);
        console.log(`   Estado: ${quote.status}`);
        console.log(`   Fecha: ${quote.createdAt?.toDate?.() || quote.createdAt}`);
        
        if (quote.priceBreakdown && quote.priceBreakdown.length > 0) {
          console.log(`   Desglose:`);
          quote.priceBreakdown.forEach(item => {
            console.log(`     - ${item.concept}: ${item.amount}€`);
          });
        }
        
        if (quote.servicesIncluded && quote.servicesIncluded.length > 0) {
          console.log(`   Servicios incluidos: ${quote.servicesIncluded.join(', ')}`);
        }
        
        console.log('');
      });
    }

    // 3. Buscar solicitudes vinculadas
    console.log('3️⃣ Buscando solicitudes de presupuesto...');
    
    // Buscar en internet suppliers
    const internetRequests = await db.collection('quote-requests-internet')
      .where('contacto.email', '==', 'danielnavarrocampos@icloud.com')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (!internetRequests.empty) {
      console.log(`✅ Encontradas ${internetRequests.size} solicitudes:\n`);
      
      internetRequests.docs.forEach((doc, index) => {
        const request = doc.data();
        console.log(`📝 Solicitud ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Proveedor: ${request.supplierName}`);
        console.log(`   Estado: ${request.status}`);
        console.log(`   QuoteResponseId: ${request.quoteResponseId || 'N/A'}`);
        console.log(`   Fecha: ${request.createdAt?.toDate?.() || request.createdAt}`);
        console.log('');
      });
    }

    console.log('=====================================');
    console.log('✅ Verificación completada\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuoteResponses();
