/**
 * Debug: Verificar emails recibidos y solicitudes pendientes
 */

import { db } from '../db.js';

console.log('🔍 Verificando emails recibidos y solicitudes pendientes...\n');

async function debugQuoteEmails() {
  try {
    // 1. Verificar últimos emails recibidos
    console.log('1️⃣ Últimos 10 emails recibidos (folder=inbox):');
    console.log('─'.repeat(60));
    
    const mailsSnapshot = await db
      .collection('mails')
      .where('folder', '==', 'inbox')
      .orderBy('date', 'desc')
      .limit(10)
      .get();

    if (mailsSnapshot.empty) {
      console.log('❌ No hay emails en inbox\n');
    } else {
      mailsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. De: ${data.from || 'N/A'}`);
        console.log(`   Subject: ${data.subject || 'N/A'}`);
        console.log(`   Fecha: ${data.date || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    // 2. Verificar solicitudes pendientes
    console.log('2️⃣ Solicitudes de presupuesto pendientes:');
    console.log('─'.repeat(60));
    
    const requestsSnapshot = await db
      .collection('quote-requests-internet')
      .where('status', '==', 'pending')
      .limit(10)
      .get();

    if (requestsSnapshot.empty) {
      console.log('❌ No hay solicitudes pendientes\n');
    } else {
      requestsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Proveedor: ${data.supplierName || 'N/A'}`);
        console.log(`   Email: ${data.supplierEmail || 'N/A'}`);
        console.log(`   Cliente: ${data.contacto?.nombre || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    // 3. Verificar presupuestos recibidos
    console.log('3️⃣ Presupuestos procesados (últimos 5):');
    console.log('─'.repeat(60));
    
    const responsesSnapshot = await db
      .collection('quote-responses')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (responsesSnapshot.empty) {
      console.log('❌ No hay presupuestos procesados\n');
    } else {
      responsesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Proveedor: ${data.supplierName || 'N/A'}`);
        console.log(`   Email: ${data.supplierEmail || 'N/A'}`);
        console.log(`   Precio: ${data.totalPrice || 'N/A'}€`);
        console.log(`   Confianza: ${data.confidence || 'N/A'}%`);
        console.log(`   Estado: ${data.status || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    // 4. Buscar emails que podrían ser respuestas de presupuesto
    console.log('4️⃣ Emails recientes con keywords de presupuesto:');
    console.log('─'.repeat(60));
    
    const allRecentMails = await db
      .collection('mails')
      .orderBy('date', 'desc')
      .limit(20)
      .get();

    const keywords = ['presupuesto', 'cotización', 'precio', 'tarifa', 'quote', 'budget'];
    let foundQuoteEmails = 0;

    allRecentMails.forEach((doc) => {
      const data = doc.data();
      const subject = (data.subject || '').toLowerCase();
      const body = (data.body || data.bodyText || '').toLowerCase();
      const text = subject + ' ' + body;

      const hasKeyword = keywords.some(kw => text.includes(kw));
      
      if (hasKeyword) {
        foundQuoteEmails++;
        console.log(`✓ De: ${data.from || 'N/A'}`);
        console.log(`  Subject: ${data.subject || 'N/A'}`);
        console.log(`  Fecha: ${data.date || 'N/A'}`);
        console.log(`  Folder: ${data.folder || 'N/A'}`);
        console.log(`  ID: ${doc.id}\n`);
      }
    });

    if (foundQuoteEmails === 0) {
      console.log('❌ No se encontraron emails con keywords de presupuesto\n');
    }

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   Emails en inbox: ${mailsSnapshot.size}`);
    console.log(`   Solicitudes pendientes: ${requestsSnapshot.size}`);
    console.log(`   Presupuestos procesados: ${responsesSnapshot.size}`);
    console.log(`   Emails con keywords: ${foundQuoteEmails}`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugQuoteEmails().catch(console.error);
