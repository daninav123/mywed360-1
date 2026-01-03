/**
 * Procesar manualmente emails de presupuestos que ya están en Firestore
 */

import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  isQuoteResponse,
  findMatchingQuoteRequest,
  analyzeQuoteResponse,
} from '../services/quoteResponseAnalysis.js';

console.log('🔄 Procesando emails de presupuestos pendientes...\n');

async function processEmail(mailDoc) {
  const mailId = mailDoc.id;
  const data = mailDoc.data();
  
  const from = data.from || '';
  const subject = data.subject || '';
  const body = data.body || data.bodyText || '';
  
  console.log(`\n📧 Procesando: ${mailId}`);
  console.log(`   De: ${from}`);
  console.log(`   Subject: ${subject.substring(0, 60)}...`);
  
  try {
    // 1. Verificar si es respuesta de presupuesto
    if (!isQuoteResponse({ subject, body })) {
      console.log('   ⏭️  No es respuesta de presupuesto (skipped)');
      return;
    }
    
    console.log('   ✓ Detectado como respuesta de presupuesto');
    
    // 2. Extraer email del remitente
    const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/);
    const fromEmail = emailMatch ? (emailMatch[1] || emailMatch[0]) : from;
    
    if (!fromEmail || !fromEmail.includes('@')) {
      console.log('   ❌ No se pudo extraer email válido');
      return;
    }
    
    console.log(`   Email extraído: ${fromEmail}`);
    
    // 3. Buscar solicitud correspondiente
    const matchingRequest = await findMatchingQuoteRequest({
      fromEmail: fromEmail.toLowerCase().trim(),
      subject,
      body,
      db,
    });
    
    if (!matchingRequest) {
      console.log('   ❌ No se encontró solicitud correspondiente');
      return;
    }
    
    console.log(`   ✓ Solicitud encontrada: ${matchingRequest.requestId}`);
    
    // 4. Analizar con IA
    console.log('   🤖 Analizando con IA...');
    
    const quoteData = await analyzeQuoteResponse({
      subject,
      body,
      attachments: [], // Por ahora sin adjuntos
      supplierName: matchingRequest.data.supplierName || '',
      categoryName: matchingRequest.data.supplierCategoryName || '',
    });
    
    if (!quoteData) {
      console.log('   ❌ No se pudo analizar con IA');
      return;
    }
    
    console.log(`   ✓ Análisis completado (${quoteData.confidence}% confianza)`);
    console.log(`   💶 Precio: ${quoteData.totalPrice || 'N/A'}€`);
    
    // 5. Guardar presupuesto
    const quoteRef = db.collection('quote-responses').doc();
    
    await quoteRef.set({
      id: quoteRef.id,
      requestId: matchingRequest.requestId,
      supplierId: matchingRequest.supplierId,
      mailId,
      
      supplierEmail: fromEmail.toLowerCase().trim(),
      supplierName: matchingRequest.data.supplierName || '',
      
      clientEmail: matchingRequest.data.contacto?.email || null,
      clientName: matchingRequest.data.contacto?.nombre || null,
      userId: matchingRequest.data.userId || null,
      weddingId: matchingRequest.data.weddingId || null,
      
      ...quoteData,
      
      emailSubject: subject,
      emailBody: body,
      hasAttachments: false,
      attachmentCount: 0,
      
      status: 'received',
      source: 'manual_reprocess',
      
      createdAt: FieldValue.serverTimestamp(),
      receivedAt: data.date || new Date().toISOString(),
    });
    
    console.log(`   ✅ Presupuesto guardado: ${quoteRef.id}`);
    
    // 6. Actualizar solicitud
    if (matchingRequest.source === 'internet_supplier') {
      await db
        .collection('quote-requests-internet')
        .doc(matchingRequest.requestId)
        .update({
          status: 'quoted',
          respondedAt: FieldValue.serverTimestamp(),
          quoteResponseId: quoteRef.id,
        });
      
      console.log(`   ✅ Solicitud actualizada a 'quoted'`);
    }
    
    return quoteRef.id;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function processAllPendingEmails() {
  try {
    // Buscar emails de resonaevents
    const mailsSnapshot = await db
      .collection('mails')
      .where('from', '>=', 'info@resonaevents.com')
      .where('from', '<=', 'info@resonaevents.com\uf8ff')
      .limit(20)
      .get();
    
    if (mailsSnapshot.empty) {
      console.log('No hay emails de resonaevents');
      return;
    }
    
    console.log(`Encontrados ${mailsSnapshot.size} emails de resonaevents\n`);
    console.log('═'.repeat(60));
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of mailsSnapshot.docs) {
      const result = await processEmail(doc);
      if (result) {
        processed++;
      } else {
        const data = doc.data();
        const subject = data.subject || '';
        if (isQuoteResponse({ subject, body: data.body || '' })) {
          errors++;
        } else {
          skipped++;
        }
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Procesados exitosamente: ${processed}`);
    console.log(`   ⏭️  Omitidos (no son presupuestos): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log('═'.repeat(60));
    
    if (processed > 0) {
      console.log('\n🎉 ¡Presupuestos procesados! Ve a /proveedores/presupuestos para verlos\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error(error.stack);
  }
}

// Configurar OpenAI desde variables de entorno
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'process.env.OPENAI_API_KEY';
process.env.OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || 'proj_7IWFKysvJciPmnkpqop9rrpT';

processAllPendingEmails().catch(console.error);
