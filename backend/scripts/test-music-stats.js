import { db } from '../db.js';

const TEST_CONFIG = {
  userId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  category: 'música',
};

// Normalizar categoría
function normalizeCategory(cat) {
  if (!cat) return '';
  return cat.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function testMusicStats() {
  try {
    console.log('🔍 Simulando respuesta del endpoint /api/quote-stats/category/música\n');
    console.log('=====================================\n');

    const category = TEST_CONFIG.category;
    const userId = TEST_CONFIG.userId;
    const normalizedCategory = normalizeCategory(category);

    console.log(`Buscando categoría: "${category}" (normalizado: "${normalizedCategory}")\n`);

    // 1. Buscar solicitudes
    const requests = [];
    
    const internetRequestsSnapshot = await db
      .collection('quote-requests-internet')
      .where('userId', '==', userId)
      .get();
    
    internetRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (normalizeCategory(data.supplierCategory) === normalizedCategory) {
        requests.push({
          id: doc.id,
          ...data,
          source: 'internet',
        });
      }
    });

    console.log(`✅ Encontradas ${requests.length} solicitudes\n`);

    // 2. Buscar respuestas
    const responses = [];
    const responseIds = new Set();

    for (const request of requests) {
      if (request.quoteResponseId && !responseIds.has(request.quoteResponseId)) {
        responseIds.add(request.quoteResponseId);
        
        const responseDoc = await db
          .collection('quote-responses')
          .doc(request.quoteResponseId)
          .get();
        
        if (responseDoc.exists) {
          responses.push({
            id: responseDoc.id,
            ...responseDoc.data(),
            linkedRequestId: request.id,
          });
        }
      }
    }

    console.log(`✅ Encontradas ${responses.length} respuestas\n`);

    // 3. Calcular estadísticas
    const stats = {
      category,
      contacted: new Set(requests.map(r => r.supplierEmail || r.supplierName)).size,
      sent: requests.length,
      received: responses.length,
      pending: requests.filter(r => r.status === 'pending').length,
      quoted: requests.filter(r => r.status === 'quoted').length,
      accepted: responses.filter(r => r.status === 'accepted').length,
      rejected: responses.filter(r => r.status === 'rejected').length,
    };

    // 4. Providers
    const providers = requests.map(req => ({
      id: req.supplierId || req.id,
      name: req.supplierName,
      email: req.supplierEmail,
      status: req.status,
      requestId: req.id,
      sentAt: req.createdAt,
      hasResponse: !!req.quoteResponseId,
      responseId: req.quoteResponseId || null,
    }));

    // 5. Presupuesto aceptado
    const acceptedQuote = responses.find(r => r.status === 'accepted');

    const result = {
      success: true,
      stats,
      providers,
      responses: responses.map(r => ({
        id: r.id,
        supplierName: r.supplierName,
        totalPrice: r.totalPrice,
        confidence: r.confidence,
        status: r.status,
        receivedAt: r.createdAt,
        servicesIncluded: r.servicesIncluded || [],
        priceBreakdown: r.priceBreakdown || [],
      })),
      acceptedQuote: acceptedQuote ? {
        id: acceptedQuote.id,
        supplierName: acceptedQuote.supplierName,
        totalPrice: acceptedQuote.totalPrice,
      } : null,
    };

    console.log('📊 RESULTADO FINAL:\n');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=====================================');
    console.log('✅ Test completado\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMusicStats();
