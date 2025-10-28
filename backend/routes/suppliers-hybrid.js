// routes/suppliers-hybrid.js
// 🔄 FASE 2: BÚSQUEDA HÍBRIDA (Registrados + Internet)
// 
// Busca primero en proveedores REGISTRADOS (Firestore)
// Si hay < 10, complementa con INTERNET (Tavily)
// Resultado: [VERIFICADOS] primero + [Internet] después

import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

const router = express.Router();

// Importar función de búsqueda Tavily desde el otro router
// (Necesitaremos refactorizar esto)
import fetch from 'node-fetch';

// Función auxiliar: Buscar en Tavily (copiada temporalmente)
async function searchTavilySimple(query, location, service) {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ TAVILY_API_KEY no configurada, saltando búsqueda en internet');
    return [];
  }

  const searchQuery = `${query} ${location} ${service} contacto -"buscar" -"encuentra"`;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        include_images: true,
        max_results: 20,
        exclude_domains: [
          'wikipedia.org', 'youtube.com', 'amazon', 'pinterest',
          'ebay', 'aliexpress', 'milanuncios', 'wallapop'
        ]
      }),
    });

    if (!response.ok) {
      console.error(`❌ Tavily API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('❌ Error en búsqueda Tavily:', error.message);
    return [];
  }
}

// POST /api/suppliers/search - Búsqueda híbrida
router.post('/search', async (req, res) => {
  try {
    const { service, location, query, budget, filters } = req.body;
    
    // Validaciones
    if (!service || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'service y location son requeridos' 
      });
    }
    
    console.log(`\n🔍 [HYBRID-SEARCH] ${service} en ${location}`);
    console.log(`   Query: "${query || 'sin query específica'}"`);
    console.log(`   Budget: ${budget || 'no especificado'}\n`);
    
    const db = admin.firestore();
    
    // ===== 1. BUSCAR PROVEEDORES REGISTRADOS EN FIRESTORE =====
    console.log('📊 [FIRESTORE] Buscando proveedores registrados...');
    
    let firestoreQuery = db.collection('suppliers')
      .where('status', 'in', ['active', 'discovered']) // Incluir discovered también
      .where('category', '==', service);
    
    // Filtro por ubicación (ciudad exacta)
    // TODO: Mejorar para buscar en serviceArea también
    if (location && location !== 'España') {
      firestoreQuery = firestoreQuery.where('location.city', '==', location);
    }
    
    // Ordenar por matchScore (mejores primero)
    firestoreQuery = firestoreQuery
      .orderBy('metrics.matchScore', 'desc')
      .limit(20);
    
    const snapshot = await firestoreQuery.get();
    
    let registeredResults = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        priority: data.registered ? 'registered' : 'cached', // Diferenciar registrados de cache
        badge: data.registered ? 'Verificado ✓' : 'En caché',
        badgeType: data.registered ? 'success' : 'info'
      };
    });
    
    // Filtro adicional por keywords si hay query específica
    if (query && query.trim()) {
      const keywords = query.toLowerCase().split(' ');
      registeredResults = registeredResults.filter(supplier => {
        const searchText = [
          supplier.name,
          supplier.business?.description || '',
          ...(supplier.tags || [])
        ].join(' ').toLowerCase();
        
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }
    
    // Filtro por presupuesto
    if (budget) {
      registeredResults = registeredResults.filter(supplier => {
        const minBudget = supplier.business?.minBudget || 0;
        const maxBudget = supplier.business?.maxBudget || Infinity;
        return minBudget <= budget && maxBudget >= budget;
      });
    }
    
    // Filtros adicionales
    if (filters) {
      if (filters.priceRange) {
        registeredResults = registeredResults.filter(s => 
          s.business?.priceRange === filters.priceRange
        );
      }
      if (filters.rating) {
        registeredResults = registeredResults.filter(s => 
          (s.metrics?.rating || 0) >= filters.rating
        );
      }
      if (filters.availability) {
        registeredResults = registeredResults.filter(s => 
          s.business?.availability === filters.availability
        );
      }
    }
    
    console.log(`✅ [FIRESTORE] ${registeredResults.length} proveedores encontrados en base de datos`);
    console.log(`   - Registrados: ${registeredResults.filter(r => r.registered).length}`);
    console.log(`   - En caché: ${registeredResults.filter(r => !r.registered).length}`);
    
    // ===== 2. SI HAY POCOS, BUSCAR EN INTERNET (TAVILY) =====
    let internetResults = [];
    let usedTavily = false;
    
    if (registeredResults.length < 10) {
      console.log(`\n🌐 [TAVILY] Menos de 10 resultados en BD. Buscando en internet...`);
      
      try {
        const tavilyResults = await searchTavilySimple(
          query || service, 
          location, 
          service
        );
        
        console.log(`✅ [TAVILY] ${tavilyResults.length} proveedores encontrados en internet`);
        
        // Filtrar duplicados (que ya estén en Firestore)
        const registeredEmails = new Set(
          registeredResults
            .map(r => r.contact?.email?.toLowerCase())
            .filter(e => e)
        );
        
        const registeredUrls = new Set(
          registeredResults
            .map(r => r.contact?.website?.toLowerCase())
            .filter(u => u)
        );
        
        internetResults = tavilyResults
          .filter(r => {
            const email = r.email?.toLowerCase();
            const url = r.url?.toLowerCase();
            
            // Excluir si ya está en Firestore
            if (email && registeredEmails.has(email)) return false;
            if (url && registeredUrls.has(url)) return false;
            
            return true;
          })
          .slice(0, 8) // Máximo 8 de internet
          .map(r => ({
            // Convertir formato Tavily a formato supplier
            name: r.title,
            slug: null, // No tiene slug aún
            category: service,
            location: {
              city: location,
              province: '',
              country: 'España'
            },
            contact: {
              email: r.email || '',
              website: r.url,
              phone: r.phone || '',
              instagram: r.instagram || ''
            },
            business: {
              description: r.content?.substring(0, 200) || '',
              priceRange: '',
              services: []
            },
            media: {
              logo: r.image || '',
              cover: '',
              portfolio: []
            },
            metrics: {
              matchScore: Math.round((r.score || 0.5) * 100),
              views: 0,
              clicks: 0,
              conversions: 0,
              rating: 0,
              reviewCount: 0
            },
            registered: false,
            source: 'tavily-realtime',
            status: 'discovered',
            priority: 'internet',
            badge: 'De internet 🌐',
            badgeType: 'default'
          }));
        
        usedTavily = true;
        console.log(`🔄 [TAVILY] ${internetResults.length} proveedores nuevos (no duplicados)`);
        
      } catch (error) {
        console.error('❌ [TAVILY] Error en búsqueda:', error.message);
        // Continuar con solo resultados de Firestore
      }
    } else {
      console.log(`\n✅ [FIRESTORE] Suficientes resultados en BD (${registeredResults.length}). No se busca en internet.`);
    }
    
    // ===== 3. MEZCLAR RESULTADOS: REGISTRADOS PRIMERO =====
    const allResults = [
      ...registeredResults,  // 🟢 PRIMERO: Registrados y cache
      ...internetResults     // 🔵 DESPUÉS: De internet
    ];
    
    console.log(`\n📊 [RESULTADO] Total: ${allResults.length} proveedores`);
    console.log(`   🟢 Registrados: ${registeredResults.filter(r => r.registered).length}`);
    console.log(`   🔵 En caché: ${registeredResults.filter(r => !r.registered).length}`);
    console.log(`   🌐 Internet: ${internetResults.length}`);
    console.log(`   📡 Fuente: ${usedTavily ? 'Firestore + Tavily' : 'Solo Firestore'}\n`);
    
    // ===== 4. ACTUALIZAR MÉTRICAS DE VISTAS (solo para los de Firestore) =====
    if (registeredResults.length > 0) {
      const batch = db.batch();
      
      registeredResults.forEach(supplier => {
        if (supplier.id) { // Solo si tiene ID (está en Firestore)
          const docRef = db.collection('suppliers').doc(supplier.id);
          batch.update(docRef, {
            'metrics.views': admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      console.log(`📊 [METRICS] Views incrementadas para ${registeredResults.length} proveedores`);
    }
    
    // ===== 5. RESPONDER =====
    res.json({
      success: true,
      count: allResults.length,
      breakdown: {
        registered: registeredResults.filter(r => r.registered).length,
        cached: registeredResults.filter(r => !r.registered).length,
        internet: internetResults.length
      },
      source: usedTavily ? 'firestore+tavily' : 'firestore',
      suppliers: allResults
    });
    
  } catch (error) {
    console.error('❌ [HYBRID-SEARCH] Error:', error);
    logger.error('[suppliers-hybrid] Error en búsqueda híbrida', { 
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Error en búsqueda híbrida de proveedores'
    });
  }
});

// POST /api/suppliers/:id/track - Registrar métrica (view/click/contact)
router.post('/:id/track', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, userId, weddingId } = req.body;
    
    // Validar action
    const validActions = ['view', 'click', 'contact'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'action debe ser view, click o contact' 
      });
    }
    
    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);
    
    // Verificar que existe
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    // Actualizar métrica correspondiente
    const updateData = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (action === 'click') {
      updateData['metrics.clicks'] = admin.firestore.FieldValue.increment(1);
    } else if (action === 'contact') {
      updateData['metrics.conversions'] = admin.firestore.FieldValue.increment(1);
      updateData['metrics.lastContactDate'] = admin.firestore.FieldValue.serverTimestamp();
    }
    // 'view' ya se registra en la búsqueda
    
    await docRef.update(updateData);
    
    // Registrar evento detallado (opcional)
    await db.collection('supplier_events').add({
      supplierId: id,
      action,
      userId: userId || 'anonymous',
      weddingId: weddingId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`📊 [METRIC] ${action} registrado para ${id}`);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error tracking metric:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/suppliers/:id - Obtener detalles de un proveedor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = admin.firestore();
    const doc = await db.collection('suppliers').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    res.json({
      success: true,
      supplier: { id: doc.id, ...doc.data() }
    });
    
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
