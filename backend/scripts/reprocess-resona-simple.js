import { db } from '../db.js';
import { isQuoteResponse, findMatchingQuoteRequest } from '../services/quoteResponseAnalysis.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Script simplificado para reprocesar emails de ReSona Events
 * Sin depender de análisis IA - extrae precio manualmente del texto
 */

function extractPriceFromText(text) {
  const pricePatterns = [
    /presupuesto\s+(?:es\s+)?(\d+(?:\.\d+)?)\s*(?:€|euros?|e\b)/i,
    /precio\s+(?:total\s+)?(?:es\s+)?(\d+(?:\.\d+)?)\s*(?:€|euros?|e\b)/i,
    /(\d+(?:\.\d+)?)\s*(?:€|euros?|e\b)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1]);
      if (price > 0 && price < 100000) {
        return price;
      }
    }
  }
  return null;
}

async function reprocessResonaEmails() {
  console.log('🔄 Reprocesando emails de ReSona Events (modo simplificado)...\n');

  try {
    const snapshot = await db.collection('mails')
      .where('from', '==', 'info@resonaevents.com')
      .limit(20)
      .get();

    console.log(`📧 Emails encontrados: ${snapshot.size}\n`);

    const emailsToProcess = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.linkedQuoteResponseId) {
        emailsToProcess.push({ id: doc.id, data });
      }
    });

    console.log(`📋 Emails sin procesar: ${emailsToProcess.length}\n`);

    let processed = 0;
    let skipped = 0;

    for (const email of emailsToProcess) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📨 ${email.id}`);
      console.log(`   Subject: ${email.data.subject?.substring(0, 50) || 'N/A'}`);

      try {
        const isQuote = isQuoteResponse({
          subject: email.data.subject || '',
          body: email.data.body || '',
          fromEmail: email.data.from || ''
        });

        if (!isQuote) {
          console.log('   ⏭️  No es quote - SKIP');
          skipped++;
          continue;
        }

        const matchingRequest = await findMatchingQuoteRequest({
          fromEmail: email.data.from || '',
          subject: email.data.subject || '',
          body: email.data.body || '',
          db,
        });

        if (!matchingRequest) {
          console.log('   ⚠️  Sin solicitud - SKIP');
          skipped++;
          continue;
        }

        console.log(`   ✅ Solicitud: ${matchingRequest.requestId}`);

        // Extraer precio manualmente del texto
        const fullText = `${email.data.subject || ''} ${email.data.body || ''}`;
        const extractedPrice = extractPriceFromText(fullText);
        
        console.log(`   💰 Precio extraído: ${extractedPrice || 'N/A'}€`);

        // Crear quote-response con datos básicos
        const quoteRef = db.collection('quote-responses').doc();
        await quoteRef.set({
          id: quoteRef.id,
          requestId: matchingRequest.requestId,
          supplierId: matchingRequest.supplierId,
          mailId: email.id,
          
          supplierEmail: email.data.from || '',
          supplierName: matchingRequest.data.supplierName || '',
          
          clientEmail: matchingRequest.data.contacto?.email || null,
          clientName: matchingRequest.data.contacto?.nombre || null,
          userId: matchingRequest.data.userId || null,
          weddingId: matchingRequest.data.weddingId || null,
          
          // Datos extraídos manualmente
          totalPrice: extractedPrice,
          priceBreakdown: [],
          servicesIncluded: [],
          extras: [],
          paymentTerms: null,
          deliveryTime: null,
          cancellationPolicy: null,
          warranty: null,
          additionalNotes: 'Procesado automáticamente sin análisis IA',
          confidence: extractedPrice ? 70 : 30,
          
          emailSubject: email.data.subject || '',
          emailBody: email.data.body || '',
          hasAttachments: false,
          attachmentCount: 0,
          
          status: 'received',
          source: 'email_reprocessed_manual',
          
          createdAt: FieldValue.serverTimestamp(),
          receivedAt: email.data.date || new Date().toISOString(),
          analyzedAt: new Date().toISOString(),
          model: 'manual_extraction',
        });

        // Actualizar mail
        await db.collection('mails').doc(email.id).update({
          linkedQuoteResponseId: quoteRef.id,
          linkedQuoteRequestId: matchingRequest.requestId,
          ownerUid: matchingRequest.data.userId || null,
          weddingId: matchingRequest.data.weddingId || null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Actualizar subcolección de usuario
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
            console.log(`   ⚠️  Subcolección no actualizada`);
          }
        }

        // Actualizar solicitud
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

        console.log(`   ✅ Quote creado: ${quoteRef.id}`);
        processed++;

      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Procesados: ${processed}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   📧 Total: ${emailsToProcess.length}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  }
}

reprocessResonaEmails();
