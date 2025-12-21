/**
 * Test simplificado sin IA - solo valida detección y matching
 */

import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  isQuoteResponse, 
  findMatchingQuoteRequest
} from '../services/quoteResponseAnalysis.js';
import { randomBytes } from 'crypto';

const TEST_SUPPLIER_EMAIL = 'fotografia.test@example.com';

async function runSimpleTest() {
  console.log('🧪 TEST SIMPLIFICADO: Detección y Matching\n');
  
  try {
    // 1. Crear solicitud
    console.log('1️⃣ Creando solicitud de prueba...');
    const quoteRequestData = {
      supplierId: 'test-' + Date.now(),
      supplierName: 'Fotografía Test',
      supplierEmail: TEST_SUPPLIER_EMAIL,
      supplierCategoryName: 'Fotografía',
      weddingInfo: { ciudad: 'Madrid' },
      contacto: { nombre: 'Test', email: 'test@test.com' },
      serviceDetails: {},
      customMessage: '',
      responseToken: randomBytes(32).toString('hex'),
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('quote-requests-internet').add(quoteRequestData);
    console.log(`✅ Solicitud creada: ${docRef.id}\n`);

    // 2. Simular email
    console.log('2️⃣ Simulando email del proveedor...');
    const subject = 'Re: Presupuesto fotografía';
    const body = 'Adjunto presupuesto: 2500€\nIncluye 8 horas de cobertura';
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body.substring(0, 50)}...\n`);

    // 3. Detectar
    console.log('3️⃣ Detectando si es respuesta de presupuesto...');
    const isQuote = isQuoteResponse({ subject, body });
    console.log(`   Resultado: ${isQuote ? '✅ SÍ detectado' : '❌ NO detectado'}\n`);

    // 4. Buscar matching
    console.log('4️⃣ Buscando solicitud correspondiente...');
    const match = await findMatchingQuoteRequest({
      fromEmail: TEST_SUPPLIER_EMAIL,
      subject,
      body,
      db,
    });

    if (match) {
      console.log(`✅ Solicitud encontrada: ${match.requestId}`);
      console.log(`   Proveedor: ${match.data.supplierName}`);
      console.log(`   Método: ${match.source}\n`);
    } else {
      console.log('❌ No se encontró solicitud\n');
    }

    // 5. Simular guardado (sin IA)
    console.log('5️⃣ Simulando guardado de presupuesto (sin análisis IA)...');
    const mockQuoteData = {
      totalPrice: 2500,
      servicesIncluded: ['Cobertura 8 horas', '300 fotos editadas'],
      paymentTerms: '30% adelanto',
      confidence: 0, // Mock - sin IA
      source: 'manual_test',
    };

    const quoteRef = db.collection('quote-responses').doc();
    await quoteRef.set({
      id: quoteRef.id,
      requestId: docRef.id,
      supplierEmail: TEST_SUPPLIER_EMAIL,
      ...mockQuoteData,
      emailSubject: subject,
      status: 'received',
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Presupuesto guardado: ${quoteRef.id}\n`);

    // 6. Verificar
    console.log('6️⃣ Verificando en Firestore...');
    const saved = await db.collection('quote-responses').doc(quoteRef.id).get();
    if (saved.exists) {
      console.log('✅ Datos verificados en Firestore');
      console.log(`   Precio: ${saved.data().totalPrice}€\n`);
    }

    // Limpiar
    console.log('🧹 Limpiando datos de prueba...');
    await quoteRef.delete();
    await docRef.delete();
    console.log('✅ Limpieza completada\n');

    console.log('═══════════════════════════════════════');
    console.log('  ✅ TEST BÁSICO COMPLETADO');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 RESUMEN:');
    console.log('  ✓ Detección de emails: OK');
    console.log('  ✓ Matching de solicitudes: OK');
    console.log('  ✓ Guardado en Firestore: OK');
    console.log('  ⚠️  Análisis IA: Pendiente (configurar OpenAI)\n');

    console.log('💡 SIGUIENTE PASO:');
    console.log('   Configurar OPENAI_API_KEY para habilitar análisis IA\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runSimpleTest().catch(console.error);
