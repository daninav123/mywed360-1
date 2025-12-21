/**
 * 🧪 Test completo del flujo de respuestas de presupuestos por email con IA
 */

import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  isQuoteResponse, 
  findMatchingQuoteRequest, 
  analyzeQuoteResponse 
} from '../services/quoteResponseAnalysis.js';
import { randomBytes } from 'crypto';

const TEST_SUPPLIER_EMAIL = 'fotografia.test@example.com';
const TEST_CLIENT_EMAIL = 'pareja.test@example.com';
const TEST_USER_ID = '9EstYa0T8WRBm9j0XwnE8zU1iFo1'; // Tu usuario real

console.log('🧪 TEST: Flujo completo de presupuestos por email con IA\n');

// Paso 1: Crear solicitud de presupuesto de prueba
async function step1CreateQuoteRequest() {
  console.log('📝 PASO 1: Crear solicitud de presupuesto de prueba...');
  
  const responseToken = randomBytes(32).toString('hex');
  
  const quoteRequestData = {
    // Info del proveedor
    supplierId: 'test-supplier-' + Date.now(),
    supplierName: 'Fotografía Perfecta Test',
    supplierEmail: TEST_SUPPLIER_EMAIL,
    supplierCategory: 'fotografia',
    supplierCategoryName: 'Fotografía',

    // Info de la boda
    weddingInfo: {
      fecha: new Date('2025-06-15').toISOString(),
      ciudad: 'Madrid',
      numeroInvitados: 120,
      presupuestoTotal: 15000,
    },

    // Info de contacto del cliente
    contacto: {
      nombre: 'Ana & Juan',
      email: TEST_CLIENT_EMAIL,
      telefono: '+34 666 777 888',
    },

    // Detalles del servicio
    serviceDetails: {
      tipoCobertura: '8 horas',
      fotosEditadas: 300,
      albumIncluido: true,
    },

    // Mensaje personalizado
    customMessage: 'Buscamos fotógrafo profesional con experiencia en bodas',

    // Token para respuesta
    responseToken,
    responseUrl: `http://localhost:5173/responder-presupuesto/${responseToken}`,

    // Estado
    status: 'pending',

    // Metadata
    source: 'test_script',
    userId: TEST_USER_ID,
    weddingId: 'test-wedding-123',
    viewed: false,

    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('quote-requests-internet').add(quoteRequestData);
  
  console.log(`✅ Solicitud creada: ${docRef.id}`);
  console.log(`   Email proveedor: ${TEST_SUPPLIER_EMAIL}`);
  console.log(`   Cliente: ${quoteRequestData.contacto.nombre}\n`);
  
  return docRef.id;
}

// Paso 2: Simular email entrante del proveedor
async function step2SimulateProviderEmail(requestId) {
  console.log('📧 PASO 2: Simular email del proveedor con presupuesto...\n');
  
  const emailSubject = 'Re: Nueva solicitud de presupuesto de Ana & Juan';
  const emailBody = `Hola Ana y Juan,

Muchas gracias por vuestro interés en nuestros servicios de fotografía.

Os adjunto presupuesto detallado para vuestra boda del 15 de junio de 2025.

PRESUPUESTO FOTOGRAFÍA BODA
============================

Precio total: 2.500€

SERVICIOS INCLUIDOS:
- Cobertura fotográfica completa 8 horas
- 300 fotografías editadas profesionalmente
- Álbum premium formato 30x30cm con 60 páginas
- Entrega digital en alta resolución
- Galería online privada por 1 año

SERVICIOS ADICIONALES (OPCIONALES):
- Sesión pre-boda: +400€
- Vídeo resumen (3-5 min): +800€
- Álbum extra para padres: +150€
- Hora adicional de cobertura: +200€/hora

CONDICIONES DE PAGO:
- Anticipo: 30% (750€) para confirmar reserva
- Segundo pago: 40% (1.000€) día de la boda
- Pago final: 30% (750€) a la entrega del álbum

TIEMPO DE ENTREGA:
- Selección de fotos: 15 días
- Álbum y fotos editadas: 45 días tras la boda

POLÍTICA DE CANCELACIÓN:
- Reembolso 100% hasta 60 días antes del evento
- Reembolso 50% hasta 30 días antes
- No hay reembolso si se cancela con menos de 30 días

GARANTÍAS:
- Garantía de 2 años en el álbum físico
- Respaldo de todas las fotos originales por 5 años
- Fotógrafo de respaldo disponible en caso de emergencia

Confirmo disponibilidad para vuestra fecha. El estilo de trabajo es natural y documental, capturando momentos espontáneos.

Podéis ver mi portfolio en: www.fotografiaperfecta.com

Quedamos a vuestra disposición para cualquier consulta.

Saludos cordiales,
María García
Fotografía Perfecta
Tel: +34 666 123 456
fotografia.test@example.com`;

  // Simular adjuntos (en caso real vendría del PDF)
  const attachmentsText = [{
    filename: 'Presupuesto_Boda_Ana_Juan.pdf',
    mime: 'application/pdf',
    text: `PRESUPUESTO DETALLADO - FOTOGRAFÍA BODA

Cliente: Ana & Juan
Fecha evento: 15 Junio 2025
Lugar: Madrid

PRECIO TOTAL: 2.500€

Desglose:
- Cobertura 8 horas: 1.800€
- 300 fotos editadas: 500€
- Álbum premium 30x30: 200€

IVA incluido

Forma de pago:
1. Señal 30%: 750€ (reserva)
2. Día boda 40%: 1.000€
3. Entrega 30%: 750€

Validez: 30 días`
  }];

  console.log('Contenido del email:');
  console.log('-------------------');
  console.log(`Subject: ${emailSubject}`);
  console.log(`\nBody (primeras 300 chars):\n${emailBody.substring(0, 300)}...\n`);
  console.log(`Adjuntos: 1 PDF\n`);

  return { emailSubject, emailBody, attachmentsText };
}

// Paso 3: Detectar si es respuesta de presupuesto
function step3DetectQuoteResponse(subject, body) {
  console.log('🔍 PASO 3: Detectar si es respuesta de presupuesto...');
  
  const isQuote = isQuoteResponse({ subject, body });
  
  if (isQuote) {
    console.log('✅ Email detectado como respuesta de presupuesto\n');
  } else {
    console.log('❌ Email NO detectado como respuesta de presupuesto\n');
  }
  
  return isQuote;
}

// Paso 4: Buscar solicitud correspondiente
async function step4FindMatchingRequest(emailSubject, emailBody) {
  console.log('🔎 PASO 4: Buscar solicitud correspondiente...');
  
  const matchingRequest = await findMatchingQuoteRequest({
    fromEmail: TEST_SUPPLIER_EMAIL,
    subject: emailSubject,
    body: emailBody,
    db,
  });

  if (matchingRequest) {
    console.log(`✅ Solicitud encontrada: ${matchingRequest.requestId}`);
    console.log(`   Proveedor: ${matchingRequest.data.supplierName}`);
    console.log(`   Cliente: ${matchingRequest.data.contacto.nombre}\n`);
  } else {
    console.log('❌ No se encontró solicitud correspondiente\n');
  }

  return matchingRequest;
}

// Paso 5: Analizar presupuesto con IA
async function step5AnalyzeWithAI(emailSubject, emailBody, attachmentsText, matchingRequest) {
  console.log('🤖 PASO 5: Analizar presupuesto con IA (GPT-4o-mini)...');
  console.log('   (Esto puede tardar 5-10 segundos...)\n');

  const startTime = Date.now();
  
  const quoteData = await analyzeQuoteResponse({
    subject: emailSubject,
    body: emailBody,
    attachments: attachmentsText,
    supplierName: matchingRequest?.data.supplierName || '',
    categoryName: matchingRequest?.data.supplierCategoryName || '',
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (quoteData) {
    console.log(`✅ Análisis completado en ${duration}s`);
    console.log('\n📊 DATOS EXTRAÍDOS POR IA:');
    console.log('========================');
    console.log(`Precio total: ${quoteData.totalPrice || 'N/A'}€`);
    console.log(`Confianza: ${quoteData.confidence || 'N/A'}%`);
    
    if (quoteData.priceBreakdown && quoteData.priceBreakdown.length > 0) {
      console.log('\nDesglose de precios:');
      quoteData.priceBreakdown.forEach(item => {
        console.log(`  - ${item.concept}: ${item.amount}€`);
      });
    }
    
    if (quoteData.servicesIncluded && quoteData.servicesIncluded.length > 0) {
      console.log('\nServicios incluidos:');
      quoteData.servicesIncluded.slice(0, 3).forEach(service => {
        console.log(`  ✓ ${service}`);
      });
      if (quoteData.servicesIncluded.length > 3) {
        console.log(`  ... y ${quoteData.servicesIncluded.length - 3} más`);
      }
    }
    
    if (quoteData.paymentTerms) {
      console.log(`\nCondiciones de pago: ${quoteData.paymentTerms}`);
    }
    
    if (quoteData.deliveryTime) {
      console.log(`Tiempo de entrega: ${quoteData.deliveryTime}`);
    }
    
    console.log('');
  } else {
    console.log('❌ No se pudo analizar el presupuesto\n');
  }

  return quoteData;
}

// Paso 6: Guardar en Firestore
async function step6SaveToFirestore(matchingRequest, quoteData, emailSubject, emailBody) {
  console.log('💾 PASO 6: Guardar presupuesto en Firestore...');

  const quoteRef = db.collection('quote-responses').doc();
  
  await quoteRef.set({
    // IDs de referencia
    id: quoteRef.id,
    requestId: matchingRequest.requestId,
    supplierId: matchingRequest.supplierId,
    mailId: 'test-mail-' + Date.now(),
    
    // Info del proveedor
    supplierEmail: TEST_SUPPLIER_EMAIL,
    supplierName: matchingRequest.data.supplierName || '',
    
    // Info del cliente
    clientEmail: matchingRequest.data.contacto?.email || null,
    clientName: matchingRequest.data.contacto?.nombre || null,
    userId: matchingRequest.data.userId || null,
    weddingId: matchingRequest.data.weddingId || null,
    
    // Datos del presupuesto extraídos por IA
    ...quoteData,
    
    // Email original
    emailSubject,
    emailBody,
    hasAttachments: true,
    attachmentCount: 1,
    
    // Estado
    status: 'received',
    source: 'test_email_auto',
    
    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    receivedAt: new Date().toISOString(),
  });

  console.log(`✅ Presupuesto guardado: ${quoteRef.id}`);
  console.log(`   Colección: quote-responses`);
  console.log(`   Estado: received\n`);

  // Actualizar estado de la solicitud
  await db
    .collection('quote-requests-internet')
    .doc(matchingRequest.requestId)
    .update({
      status: 'quoted',
      respondedAt: FieldValue.serverTimestamp(),
      quoteResponseId: quoteRef.id,
    });

  console.log(`✅ Solicitud actualizada a estado: quoted\n`);

  return quoteRef.id;
}

// Paso 7: Verificar en Firestore
async function step7VerifyInFirestore(quoteResponseId) {
  console.log('🔍 PASO 7: Verificar datos guardados en Firestore...');

  const doc = await db.collection('quote-responses').doc(quoteResponseId).get();
  
  if (doc.exists) {
    const data = doc.data();
    console.log('✅ Presupuesto encontrado en Firestore');
    console.log(`   Precio: ${data.totalPrice}€`);
    console.log(`   Servicios: ${data.servicesIncluded?.length || 0} items`);
    console.log(`   Confianza IA: ${data.confidence}%\n`);
    return true;
  } else {
    console.log('❌ Presupuesto NO encontrado en Firestore\n');
    return false;
  }
}

// Paso 8: Limpiar datos de prueba
async function step8Cleanup(requestId, quoteResponseId) {
  console.log('🧹 PASO 8: Limpieza de datos de prueba...');

  try {
    if (quoteResponseId) {
      await db.collection('quote-responses').doc(quoteResponseId).delete();
      console.log('✅ Presupuesto de prueba eliminado');
    }
    
    if (requestId) {
      await db.collection('quote-requests-internet').doc(requestId).delete();
      console.log('✅ Solicitud de prueba eliminada');
    }
    
    console.log('');
  } catch (err) {
    console.log('⚠️  Error en limpieza:', err.message);
  }
}

// EJECUTAR TEST COMPLETO
async function runCompleteTest() {
  let requestId = null;
  let quoteResponseId = null;
  
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TEST FLUJO COMPLETO: PRESUPUESTOS POR EMAIL CON IA');
    console.log('═══════════════════════════════════════════════════════\n');

    // Paso 1
    requestId = await step1CreateQuoteRequest();

    // Paso 2
    const { emailSubject, emailBody, attachmentsText } = await step2SimulateProviderEmail(requestId);

    // Paso 3
    const isQuote = step3DetectQuoteResponse(emailSubject, emailBody);
    if (!isQuote) {
      throw new Error('No se detectó como respuesta de presupuesto');
    }

    // Paso 4
    const matchingRequest = await step4FindMatchingRequest(emailSubject, emailBody);
    if (!matchingRequest) {
      throw new Error('No se encontró solicitud correspondiente');
    }

    // Paso 5
    const quoteData = await step5AnalyzeWithAI(emailSubject, emailBody, attachmentsText, matchingRequest);
    if (!quoteData) {
      throw new Error('Error en análisis con IA');
    }

    // Paso 6
    quoteResponseId = await step6SaveToFirestore(matchingRequest, quoteData, emailSubject, emailBody);

    // Paso 7
    const verified = await step7VerifyInFirestore(quoteResponseId);
    if (!verified) {
      throw new Error('No se verificó guardado en Firestore');
    }

    // Resumen final
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 RESUMEN:');
    console.log(`   • Solicitud creada: ${requestId}`);
    console.log(`   • Email del proveedor: Recibido y procesado`);
    console.log(`   • IA análisis: Completado (${quoteData.confidence}% confianza)`);
    console.log(`   • Presupuesto guardado: ${quoteResponseId}`);
    console.log(`   • Precio extraído: ${quoteData.totalPrice}€`);
    console.log(`   • Estado: Todo funcionando correctamente ✅\n`);

    // Limpieza
    await step8Cleanup(requestId, quoteResponseId);

    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎉 SISTEMA LISTO PARA PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    console.error(error);
    
    // Intentar limpieza si falló
    if (requestId || quoteResponseId) {
      console.log('\nIntentando limpieza...');
      await step8Cleanup(requestId, quoteResponseId);
    }
    
    process.exit(1);
  }
}

// Ejecutar
runCompleteTest().catch(console.error);
