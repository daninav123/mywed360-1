/**
 * Arreglar solicitudes sin email y procesar presupuestos
 */

import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  isQuoteResponse,
  analyzeQuoteResponse,
} from '../services/quoteResponseAnalysis.js';

console.log('🔧 Arreglando solicitudes y procesando presupuestos...\n');

async function fixAndProcess() {
  try {
    // 1. ARREGLAR SOLICITUDES SIN EMAIL
    console.log('1️⃣ Actualizando solicitudes sin email...');
    console.log('─'.repeat(60));
    
    const requestsSnapshot = await db
      .collection('quote-requests-internet')
      .where('supplierName', '==', 'ReSona Events')
      .get();
    
    let updated = 0;
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      if (!data.supplierEmail || data.supplierEmail === 'N/A') {
        await doc.ref.update({
          supplierEmail: 'info@resonaevents.com'
        });
        console.log(`✓ Actualizada solicitud ${doc.id}`);
        updated++;
      }
    }
    
    console.log(`\n✅ ${updated} solicitudes actualizadas\n`);
    
    // 2. PROCESAR EMAILS PENDIENTES
    console.log('2️⃣ Procesando emails pendientes...');
    console.log('─'.repeat(60));
    
    const mailsSnapshot = await db
      .collection('mails')
      .where('from', '>=', 'info@resonaevents.com')
      .where('from', '<=', 'info@resonaevents.com\uf8ff')
      .get();
    
    console.log(`Encontrados ${mailsSnapshot.size} emails\n`);
    
    // Verificar cuáles ya están procesados
    const processedSnapshot = await db
      .collection('quote-responses')
      .get();
    
    const processedMailIds = new Set();
    processedSnapshot.forEach(doc => {
      const mailId = doc.data().mailId;
      if (mailId) processedMailIds.add(mailId);
    });
    
    let processed = 0;
    
    for (const mailDoc of mailsSnapshot.docs) {
      const mailId = mailDoc.id;
      
      // Saltar si ya está procesado
      if (processedMailIds.has(mailId)) {
        continue;
      }
      
      const data = mailDoc.data();
      const subject = data.subject || '';
      const body = data.body || data.bodyText || '';
      
      // Verificar si es respuesta de presupuesto
      if (!isQuoteResponse({ subject, body })) {
        continue;
      }
      
      console.log(`\n📧 Procesando nuevo email: ${mailId}`);
      console.log(`   Subject: ${subject.substring(0, 50)}...`);
      
      try {
        // Buscar solicitud pendiente
        const requestsForEmail = await db
          .collection('quote-requests-internet')
          .where('supplierEmail', '==', 'info@resonaevents.com')
          .where('status', '==', 'pending')
          .limit(1)
          .get();
        
        if (requestsForEmail.empty) {
          console.log('   ⚠️  No hay solicitudes pendientes');
          continue;
        }
        
        const requestDoc = requestsForEmail.docs[0];
        const requestData = requestDoc.data();
        
        console.log(`   ✓ Solicitud encontrada: ${requestDoc.id}`);
        
        // Analizar con IA
        console.log('   🤖 Analizando con IA...');
        
        const quoteData = await analyzeQuoteResponse({
          subject,
          body,
          attachments: [],
          supplierName: requestData.supplierName || '',
          categoryName: requestData.supplierCategoryName || '',
        });
        
        if (!quoteData) {
          console.log('   ❌ Error en análisis IA');
          continue;
        }
        
        console.log(`   ✓ Análisis completado (${quoteData.confidence}% confianza)`);
        console.log(`   💶 Precio: ${quoteData.totalPrice || 'N/A'}€`);
        
        // Guardar presupuesto
        const quoteRef = db.collection('quote-responses').doc();
        
        await quoteRef.set({
          id: quoteRef.id,
          requestId: requestDoc.id,
          supplierId: requestData.supplierId || null,
          mailId,
          
          supplierEmail: 'info@resonaevents.com',
          supplierName: requestData.supplierName || '',
          
          clientEmail: requestData.contacto?.email || null,
          clientName: requestData.contacto?.nombre || null,
          userId: requestData.userId || null,
          weddingId: requestData.weddingId || null,
          
          ...quoteData,
          
          emailSubject: subject,
          emailBody: body,
          hasAttachments: false,
          attachmentCount: 0,
          
          status: 'received',
          source: 'manual_fix',
          
          createdAt: FieldValue.serverTimestamp(),
          receivedAt: data.date || new Date().toISOString(),
        });
        
        // Actualizar solicitud
        await requestDoc.ref.update({
          status: 'quoted',
          respondedAt: FieldValue.serverTimestamp(),
          quoteResponseId: quoteRef.id,
        });
        
        console.log(`   ✅ Presupuesto guardado: ${quoteRef.id}`);
        processed++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN FINAL:');
    console.log(`   Solicitudes actualizadas: ${updated}`);
    console.log(`   Presupuestos procesados: ${processed}`);
    console.log('═'.repeat(60));
    
    if (processed > 0) {
      console.log('\n🎉 ¡Presupuestos listos! Recarga /proveedores/presupuestos\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Configurar OpenAI
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'process.env.OPENAI_API_KEY';
process.env.OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || 'proj_7IWFKysvJciPmnkpqop9rrpT';

fixAndProcess().catch(console.error);
