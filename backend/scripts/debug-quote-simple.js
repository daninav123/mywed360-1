/**
 * Debug simple sin índices
 */

import { db } from '../db.js';

console.log('🔍 Verificando datos sin índices...\n');

async function debug() {
  try {
    // 1. Todos los emails (sin ordenar)
    console.log('1️⃣ Emails recientes (inbox):');
    console.log('─'.repeat(60));
    
    const mailsSnapshot = await db
      .collection('mails')
      .where('folder', '==', 'inbox')
      .limit(10)
      .get();

    if (mailsSnapshot.empty) {
      console.log('❌ No hay emails\n');
    } else {
      console.log(`✓ Encontrados ${mailsSnapshot.size} emails\n`);
      mailsSnapshot.forEach((doc, i) => {
        const data = doc.data();
        console.log(`${i + 1}. De: ${data.from || 'N/A'}`);
        console.log(`   Para: ${data.to || 'N/A'}`);
        console.log(`   Subject: ${(data.subject || 'N/A').substring(0, 60)}`);
        console.log(`   Fecha: ${data.date || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    // 2. Solicitudes pendientes
    console.log('2️⃣ Solicitudes pendientes:');
    console.log('─'.repeat(60));
    
    const requestsSnapshot = await db
      .collection('quote-requests-internet')
      .limit(10)
      .get();

    if (requestsSnapshot.empty) {
      console.log('❌ No hay solicitudes\n');
    } else {
      console.log(`✓ Encontradas ${requestsSnapshot.size} solicitudes\n`);
      requestsSnapshot.forEach((doc, i) => {
        const data = doc.data();
        console.log(`${i + 1}. Proveedor: ${data.supplierName || 'N/A'}`);
        console.log(`   Email: ${data.supplierEmail || 'N/A'}`);
        console.log(`   Estado: ${data.status || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    // 3. Presupuestos procesados
    console.log('3️⃣ Presupuestos procesados:');
    console.log('─'.repeat(60));
    
    const responsesSnapshot = await db
      .collection('quote-responses')
      .limit(10)
      .get();

    if (responsesSnapshot.empty) {
      console.log('❌ No hay presupuestos\n');
    } else {
      console.log(`✓ Encontrados ${responsesSnapshot.size} presupuestos\n`);
      responsesSnapshot.forEach((doc, i) => {
        const data = doc.data();
        console.log(`${i + 1}. Proveedor: ${data.supplierName || 'N/A'}`);
        console.log(`   Email: ${data.supplierEmail || 'N/A'}`);
        console.log(`   Precio: ${data.totalPrice || 'N/A'}€`);
        console.log(`   Estado: ${data.status || 'N/A'}`);
        console.log(`   Source: ${data.source || 'N/A'}`);
        console.log(`   ID: ${doc.id}\n`);
      });
    }

    console.log('═'.repeat(60));
    console.log('\n💡 PROBLEMAS POSIBLES:');
    console.log('1. Email no llegó al servidor (verificar webhook Mailgun)');
    console.log('2. Email llegó pero no se guardó en Firestore');
    console.log('3. Email no se detectó como respuesta de presupuesto');
    console.log('4. No se encontró solicitud correspondiente');
    console.log('5. Error en procesamiento con IA\n');
    
    console.log('🔧 SIGUIENTE PASO:');
    console.log('- ¿Qué email enviaste? (de quién y asunto)');
    console.log('- ¿A qué dirección lo enviaste?');
    console.log('- ¿Cuándo lo enviaste?\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

debug().catch(console.error);
