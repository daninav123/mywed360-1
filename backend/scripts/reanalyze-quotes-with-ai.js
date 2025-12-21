/**
 * Script para re-analizar quotes existentes con IA de OpenAI
 * Extrae datos estructurados (precio, servicios, condiciones de pago, etc)
 * 
 * SOLUCIÓN DEFINITIVA: Usa dynamic imports DESPUÉS de cargar dotenv
 * para asegurar que OPENAI_PROJECT_ID está disponible cuando se inicializa OpenAI
 */

async function reanalyzeQuotes() {
  // 1. Cargar dotenv PRIMERO
  await import('dotenv/config');
  
  console.log('✅ Variables de entorno cargadas:');
  console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` : '❌ NO');
  console.log('   OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || '❌ NO');
  console.log('');
  
  // 2. AHORA importar módulos (dynamic imports)
  const { db } = await import('../db.js');
  const { analyzeQuoteResponse } = await import('../services/quoteResponseAnalysis.js');
  const { FieldValue } = await import('firebase-admin/firestore');
  console.log('🤖 Iniciando re-análisis de quotes con IA...\n');

  try {
    // Buscar quotes de ReSona sin análisis IA completo
    const snapshot = await db.collection('quote-responses')
      .where('supplierEmail', '==', 'info@resonaevents.com')
      .where('status', '==', 'received')
      .get();

    console.log(`📊 Quotes encontrados: ${snapshot.size}\n`);

    let processed = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const quoteData = doc.data();
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📨 Analizando quote: ${doc.id}`);
      console.log(`   Precio actual: ${quoteData.totalPrice || 'N/A'}€`);

      try {
        // Analizar con IA
        const aiAnalysis = await analyzeQuoteResponse({
          subject: quoteData.emailSubject || '',
          body: quoteData.emailBody || '',
          attachments: quoteData.attachments || [],
          supplierName: quoteData.supplierName || '',
          categoryName: 'Música',
        });

        if (!aiAnalysis) {
          console.log('   ⚠️  IA no pudo analizar - conservando datos actuales');
          continue;
        }

        console.log(`   💰 Precio extraído: ${aiAnalysis.totalPrice || 'N/A'}€`);
        console.log(`   📋 Servicios: ${aiAnalysis.servicesIncluded?.length || 0}`);
        console.log(`   💳 Pago: ${aiAnalysis.paymentTerms ? 'SÍ' : 'NO'}`);
        console.log(`   🎯 Confianza: ${aiAnalysis.confidence || 'N/A'}%`);

        // Actualizar quote con análisis IA
        await db.collection('quote-responses').doc(doc.id).update({
          // Datos extraídos por IA
          totalPrice: aiAnalysis.totalPrice || quoteData.totalPrice,
          priceBreakdown: aiAnalysis.priceBreakdown || [],
          servicesIncluded: aiAnalysis.servicesIncluded || [],
          extras: aiAnalysis.extras || [],
          paymentTerms: aiAnalysis.paymentTerms || null,
          deliveryTime: aiAnalysis.deliveryTime || null,
          cancellationPolicy: aiAnalysis.cancellationPolicy || null,
          warranty: aiAnalysis.warranty || null,
          additionalNotes: aiAnalysis.additionalNotes || null,
          confidence: aiAnalysis.confidence || null,
          
          // Metadata
          analyzedAt: aiAnalysis.analyzedAt,
          model: aiAnalysis.model,
          source: 'email_reanalyzed_with_ai',
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`   ✅ Quote actualizado con análisis IA`);
        processed++;

      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errors++;
      }

      // Delay entre requests para no sobrecargar API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Re-analizados: ${processed}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📧 Total: ${snapshot.size}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  }
}

reanalyzeQuotes();
