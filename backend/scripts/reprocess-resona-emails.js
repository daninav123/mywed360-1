import { db } from '../db.js';
import { isQuoteResponse, findMatchingQuoteRequest, analyzeQuoteResponse } from '../services/quoteResponseAnalysis.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Script para reprocesar emails de ReSona Events que no se registraron como quotes
 * debido al error de sintaxis en quoteResponseAnalysis.js
 */

async function reprocessResonaEmails() {
  console.log('🔄 Iniciando reprocesamiento de emails de ReSona Events...\n');

  try {
    // Buscar emails de ReSona sin linkedQuoteResponseId
    const snapshot = await db.collection('mails')
      .where('from', '==', 'info@resonaevents.com')
      .limit(20)
      .get();

    console.log(`📧 Emails encontrados: ${snapshot.size}\n`);

    const emailsToProcess = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Solo procesar si NO tiene quote response ya enlazado
      if (!data.linkedQuoteResponseId) {
        emailsToProcess.push({ id: doc.id, data });
      }
    });

    console.log(`📋 Emails sin procesar: ${emailsToProcess.length}\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const email of emailsToProcess) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📨 Procesando email: ${email.id}`);
      console.log(`   Subject: ${email.data.subject?.substring(0, 50) || 'N/A'}`);
      console.log(`   Date: ${email.data.date}`);

      try {
        // 1. Detectar si es respuesta de presupuesto
        const isQuote = isQuoteResponse({
          subject: email.data.subject || '',
          body: email.data.body || '',
          fromEmail: email.data.from || ''
        });

        if (!isQuote) {
          console.log('   ⏭️  No es respuesta de presupuesto - SKIP');
          skipped++;
          continue;
        }

        console.log('   ✅ Detectado como respuesta de presupuesto');

        // 2. Buscar solicitud correspondiente
        const matchingRequest = await findMatchingQuoteRequest({
          fromEmail: email.data.from || '',
          subject: email.data.subject || '',
          body: email.data.body || '',
          db,
        });

        if (!matchingRequest) {
          console.log('   ⚠️  No se encontró solicitud correspondiente - SKIP');
          skipped++;
          continue;
        }

        console.log(`   ✅ Solicitud encontrada: ${matchingRequest.requestId}`);

        // 3. Analizar presupuesto con IA
        const quoteData = await analyzeQuoteResponse({
          subject: email.data.subject || '',
          body: email.data.body || '',
          attachments: [], // No reprocesamos adjuntos por simplicidad
          supplierName: matchingRequest.data.supplierName || '',
          categoryName: matchingRequest.data.supplierCategoryName || '',
        });

        if (!quoteData) {
          console.log('   ⚠️  No se pudo analizar presupuesto con IA - SKIP');
          skipped++;
          continue;
        }

        console.log(`   💰 Presupuesto analizado: ${quoteData.totalPrice || 'N/A'}€`);

        // 4. Crear quote-response
        const quoteRef = db.collection('quote-responses').doc();
        await quoteRef.set({
          // IDs de referencia
          id: quoteRef.id,
          requestId: matchingRequest.requestId,
          supplierId: matchingRequest.supplierId,
          mailId: email.id,
          
          // Info del proveedor
          supplierEmail: email.data.from || '',
          supplierName: matchingRequest.data.supplierName || '',
          
          // Info del cliente
          clientEmail: matchingRequest.data.contacto?.email || null,
          clientName: matchingRequest.data.contacto?.nombre || null,
          userId: matchingRequest.data.userId || null,
          weddingId: matchingRequest.data.weddingId || null,
          
          // Datos del presupuesto extraídos por IA
          ...quoteData,
          
          // Email original
          emailSubject: email.data.subject || '',
          emailBody: email.data.body || '',
          hasAttachments: false,
          attachmentCount: 0,
          
          // Estado
          status: 'received',
          source: 'email_reprocessed',
          
          // Timestamps
          createdAt: FieldValue.serverTimestamp(),
          receivedAt: email.data.date || new Date().toISOString(),
        });

        // 5. Actualizar mail con enlace a quote-response
        await db.collection('mails').doc(email.id).update({
          linkedQuoteResponseId: quoteRef.id,
          linkedQuoteRequestId: matchingRequest.requestId,
          ownerUid: matchingRequest.data.userId || null,
          weddingId: matchingRequest.data.weddingId || null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 6. Actualizar subcolección de usuario si existe
        const ownerUid = matchingRequest.data.userId;
        if (ownerUid) {
          try {
            await db
              .collection('users')
              .doc(ownerUid)
              .collection('mails')
              .doc(email.id)
              .update({
                linkedQuoteResponseId: quoteRef.id,
                linkedQuoteRequestId: matchingRequest.requestId,
                updatedAt: FieldValue.serverTimestamp(),
              });
          } catch (subErr) {
            console.log(`   ⚠️  No se pudo actualizar subcolección: ${subErr.message}`);
          }
        }

        // 7. Actualizar estado de la solicitud
        if (matchingRequest.source === 'registered_supplier') {
          await db
            .collection('suppliers')
            .doc(matchingRequest.supplierId)
            .collection('quote-requests')
            .doc(matchingRequest.requestId)
            .update({
              status: 'quoted',
              respondedAt: FieldValue.serverTimestamp(),
              quoteResponseId: quoteRef.id,
            });
        } else if (matchingRequest.source === 'internet_supplier') {
          await db
            .collection('quote-requests-internet')
            .doc(matchingRequest.requestId)
            .update({
              status: 'quoted',
              respondedAt: FieldValue.serverTimestamp(),
              quoteResponseId: quoteRef.id,
            });
        }

        console.log(`   ✅ Quote-response creado: ${quoteRef.id}`);
        processed++;

      } catch (err) {
        console.error(`   ❌ Error procesando email: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Procesados: ${processed}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📧 Total: ${emailsToProcess.length}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  }
}

// Ejecutar
reprocessResonaEmails();
