// routes/suppliers-hybrid.js
// 🔄 FASE 2: BÚSQUEDA HÍBRIDA (Registrados + Internet)
//
// Busca primero en proveedores REGISTRADOS (Firestore)
// Si NO hay resultados (0), busca en INTERNET (Tavily)
// Priorización: [BD PROPIA] → [BODAS.NET] → [OTROS INTERNET]

import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';
import searchAnalyticsService from '../services/searchAnalyticsService.js';

const router = express.Router();

// Importar función de búsqueda Tavily desde el otro router
// (Necesitaremos refactorizar esto)
import fetch from 'node-fetch';

const NEUTRAL_LOCATIONS = new Set([
  'espana',
  'españa',
  'spain',
  'all',
  'todos',
  'todas',
  'any',
  'cualquier',
  'global',
]);

const normalizeText = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Función auxiliar: Buscar en Tavily (copiada temporalmente)
async function searchTavilySimple(query, location, service) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ TAVILY_API_KEY no configurada, saltando búsqueda en internet');
    return [];
  }

  // Query mejorada para fotógrafos de bodas específicos
  const searchQuery = `${service} bodas ${location} ${query || ''} profesional contacto -"buscar" -"encuentra" -"listado" -"directorio"`;

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
          'wikipedia.org',
          'youtube.com',
          'amazon',
          'pinterest',
          'ebay',
          'aliexpress',
          'milanuncios',
          'wallapop',
        ],
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
    const { service, location, query, budget, filters, user_id, wedding_id } = req.body;

    // Extraer modo de búsqueda (auto, database, internet)
    const searchMode = filters?.searchMode || 'auto';

    // Validaciones
    if (!service || !location) {
      return res.status(400).json({
        success: false,
        error: 'service y location son requeridos',
      });
    }

    console.log(`\n🔍 [HYBRID-SEARCH] ${service} en ${location}`);
    console.log(`   Query: "${query || 'sin query específica'}"`);
    console.log(`   Budget: ${budget || 'no especificado'}`);
    console.log(`   🎯 MODO: ${searchMode.toUpperCase()}\n`);

    // 🧠 CAPTURAR BÚSQUEDA PARA ANÁLISIS (async, no bloquea)
    searchAnalyticsService
      .captureSearch({
        query,
        service,
        location,
        filters: { budget, ...filters },
        user_id,
        wedding_id,
      })
      .catch((err) => console.error('[ANALYTICS] Error:', err));

    const db = admin.firestore();

    let registeredResults = [];
    let trueRegistered = [];
    let cachedResults = [];
    let internetResults = [];
    let usedTavily = false;

    // ===== 1. BUSCAR PROVEEDORES REGISTRADOS EN FIRESTORE =====
    // (Saltar si modo es 'internet')
    if (searchMode !== 'internet') {
      console.log('📊 [FIRESTORE] Buscando proveedores por nombre...');
      console.log(`   Servicio: "${service}" | Query: "${query || '—'}"`);

      // Traer todos los proveedores (sin filtro de categoría)
      // Filtraremos por nombre en memoria
      let firestoreQuery = db.collection('suppliers').limit(100); // Traer más documentos para buscar por nombre

      // Filtro por ubicación si se especifica
      const locationValue = typeof location === 'string' ? location.trim() : location;
      const shouldFilterByLocation = (() => {
        if (!locationValue) return false;
        const normalized = normalizeText(locationValue);
        return normalized.length > 0 && !NEUTRAL_LOCATIONS.has(normalized);
      })();

      if (shouldFilterByLocation) {
        firestoreQuery = firestoreQuery.where('location.city', '==', locationValue);
      }

      const snapshot = await firestoreQuery.get();

      console.log(`📊 [FIRESTORE] ${snapshot.size} documentos encontrados en colección suppliers`);

      let registeredResults = snapshot.docs
        .map((doc) => {
          const data = doc.data();

          // DEBUG: Log completo del proveedor
          console.log(`\n[DEBUG] Proveedor ID: ${doc.id}`);
          console.log(`   name: "${data.name}"`);
          console.log(`   registered: ${data.registered} (${typeof data.registered})`);
          console.log(`   status: "${data.status}"`);
          console.log(`   category: "${data.category || data.profile?.category}"`);
          console.log(`   tags: [${(data.tags || []).join(', ')}]`);
          console.log(
            `   description: "${(data.business?.description || '').substring(0, 50)}..."`
          );

          return {
            id: doc.id,
            ...data,
            priority: data.registered === true ? 'registered' : 'cached',
            badge: data.registered === true ? 'Verificado ✓' : 'En caché',
            badgeType: data.registered === true ? 'success' : 'info',
          };
        })
        // Filtrar por nombre/término de búsqueda
        .filter((supplier) => {
          const supplierName = (supplier.name || '').toLowerCase();
          const supplierDesc = (supplier.business?.description || '').toLowerCase();
          const supplierTags = (supplier.tags || []).join(' ').toLowerCase();

          const searchTokens = [];

          if (service) {
            searchTokens.push(String(service).toLowerCase().trim());
          }

          if (query && query.trim()) {
            const normalizedQuery = String(query).toLowerCase().trim();
            searchTokens.push(normalizedQuery);
            searchTokens.push(
              ...normalizedQuery
                .split(/\s+/)
                .map((token) => token.trim())
                .filter(Boolean)
            );
          }

          const tokens = [...new Set(searchTokens.filter(Boolean))];

          console.log(`\n🔍 [FILTER] Evaluando: ${supplier.name}`);
          console.log(`   Tokens búsqueda: [${tokens.join(', ')}]`);
          console.log(`   Name: "${supplierName}"`);
          console.log(`   Tags: "${supplierTags}"`);
          console.log(`   Desc: "${supplierDesc.substring(0, 50)}..."`);

          if (tokens.length === 0) {
            console.log(`   ✅ SIN TOKENS - Incluido`);
            return true;
          }

          const haystacks = [supplierName, supplierDesc, supplierTags];
          const normalizedHaystacks = haystacks.map(normalizeText);

          const matches = tokens.some((term) => {
            const token = term.toLowerCase();
            const normalizedToken = normalizeText(token);

            const found =
              haystacks.some((h) => h.includes(token)) ||
              normalizedHaystacks.some((h) => h.includes(normalizedToken));

            if (found) {
              console.log(`   ✅ MATCH con token "${term}"`);
            }

            return found;
          });

          if (!matches) {
            console.log(`   ❌ NO MATCH - Filtrado`);
          }

          return matches;
        })
        // Filtrar por status en memoria (evita índice compuesto)
        .filter((supplier) => {
          const status = supplier.status || 'active';
          const isValid = status === 'active' || status === 'discovered';

          if (!isValid) {
            console.log(`❌ [STATUS] ${supplier.name} filtrado por status: "${status}"`);
          }

          return isValid;
        })
        // Ordenar por matchScore en memoria (evita índice compuesto)
        .sort((a, b) => {
          const scoreA = a.metrics?.matchScore || 0;
          const scoreB = b.metrics?.matchScore || 0;
          return scoreB - scoreA; // Descendente
        })
        // Limitar resultados después de ordenar
        .slice(0, 20);

      // Filtro por presupuesto
      if (budget) {
        registeredResults = registeredResults.filter((supplier) => {
          const minBudget = supplier.business?.minBudget || 0;
          const maxBudget = supplier.business?.maxBudget || Infinity;
          return minBudget <= budget && maxBudget >= budget;
        });
      }

      // Filtros adicionales
      if (filters) {
        if (filters.priceRange) {
          registeredResults = registeredResults.filter(
            (s) => s.business?.priceRange === filters.priceRange
          );
        }
        if (filters.rating) {
          registeredResults = registeredResults.filter(
            (s) => (s.metrics?.rating || 0) >= filters.rating
          );
        }
        if (filters.availability) {
          registeredResults = registeredResults.filter(
            (s) => s.business?.availability === filters.availability
          );
        }
      }

      // Separar proveedores registrados de caché
      trueRegistered = registeredResults.filter((r) => r.registered === true);
      cachedResults = registeredResults.filter((r) => r.registered !== true);

      console.log(
        `✅ [FIRESTORE] ${registeredResults.length} proveedores encontrados en base de datos`
      );
      console.log(`   - Registrados reales: ${trueRegistered.length}`);
      console.log(`   - En caché: ${cachedResults.length}`);
    } else {
      console.log('⏭️ [FIRESTORE] Saltando búsqueda en base de datos (modo: internet)');
    }

    // ===== 2. BUSCAR EN INTERNET =====
    // (Saltar si modo es 'database')
    const MIN_RESULTS = 5;
    // trueRegistered ya está calculado arriba o inicializado vacío
    const shouldSearchInternet =
      searchMode === 'internet' || (searchMode === 'auto' && trueRegistered.length < MIN_RESULTS);

    if (searchMode !== 'database' && shouldSearchInternet) {
      console.log(
        `\n🌐 [TAVILY] Solo ${trueRegistered.length} proveedores registrados (mínimo: ${MIN_RESULTS}). Buscando en internet...`
      );

      try {
        const tavilyResults = await searchTavilySimple(query || service, location, service);

        console.log(`✅ [TAVILY] ${tavilyResults.length} proveedores encontrados en internet`);

        // Filtrar duplicados (que ya estén en Firestore)
        const registeredEmails = new Set(
          registeredResults.map((r) => r.contact?.email?.toLowerCase()).filter((e) => e)
        );

        const registeredUrls = new Set(
          registeredResults.map((r) => r.contact?.website?.toLowerCase()).filter((u) => u)
        );

        // Separar resultados de bodas.net vs otros
        const bodasNetResults = [];
        const otherResults = [];

        tavilyResults.forEach((r) => {
          const email = r.email?.toLowerCase();
          const url = r.url?.toLowerCase();

          // Excluir si ya está en Firestore
          if (email && registeredEmails.has(email)) return;
          if (url && registeredUrls.has(url)) return;

          // Separar bodas.net de otros
          if (url && url.includes('bodas.net')) {
            bodasNetResults.push(r);
          } else {
            otherResults.push(r);
          }
        });

        // PRIORIZAR: Bodas.net primero, luego otros
        const prioritizedResults = [...bodasNetResults, ...otherResults].slice(0, 8);

        console.log(
          `   📊 Resultados internet: ${bodasNetResults.length} de bodas.net, ${otherResults.length} otros`
        );

        internetResults = prioritizedResults.map((r) => ({
          // Convertir formato Tavily a formato supplier
          name: r.title,
          slug: null, // No tiene slug aún
          category: service,
          location: {
            city: location,
            province: '',
            country: 'España',
          },
          contact: {
            email: r.email || '',
            website: r.url,
            phone: r.phone || '',
            instagram: r.instagram || '',
          },
          business: {
            description: r.content?.substring(0, 200) || '',
            priceRange: '',
            services: [],
          },
          media: {
            logo: r.image || '',
            cover: '',
            portfolio: [],
          },
          metrics: {
            matchScore: Math.round((r.score || 0.5) * 100),
            views: 0,
            clicks: 0,
            conversions: 0,
            rating: 0,
            reviewCount: 0,
          },
          registered: false,
          source: r.url?.includes('bodas.net') ? 'bodas-net' : 'tavily-realtime',
          status: 'discovered',
          priority: 'internet',
          badge: r.url?.includes('bodas.net') ? 'Bodas.net 💒' : 'De internet 🌐',
          badgeType: r.url?.includes('bodas.net') ? 'info' : 'default',
        }));

        usedTavily = true;
        console.log(`🔄 [TAVILY] ${internetResults.length} proveedores nuevos (no duplicados)`);
      } catch (error) {
        console.error('❌ [TAVILY] Error en búsqueda:', error.message);
        // Continuar con solo resultados de Firestore
      }
    } else {
      if (searchMode === 'database') {
        console.log(`\n⏭️ [TAVILY] Saltando búsqueda en internet (modo: database)`);
      } else {
        console.log(
          `\n✅ [FIRESTORE] ${trueRegistered.length} proveedores registrados (≥${MIN_RESULTS}). No es necesario buscar en internet.`
        );
      }
    }

    // ===== 3. MEZCLAR RESULTADOS: LÓGICA INTELIGENTE =====
    let allResults;

    if (trueRegistered.length >= MIN_RESULTS) {
      // Si hay 5+ proveedores registrados, SOLO mostrar esos
      allResults = [...trueRegistered];
      console.log(
        `📊 [RESULTADO FINAL] ≥${MIN_RESULTS} registrados. Mostrando solo registrados: ${trueRegistered.length}`
      );
    } else if (trueRegistered.length > 0) {
      // Si hay 1-4 registrados, complementar con internet
      allResults = [
        ...trueRegistered, // 🟢 Registrados primero
        ...internetResults, // 🌐 Internet para complementar
      ];
      console.log(
        `📊 [RESULTADO FINAL] <${MIN_RESULTS} registrados. Mostrando registrados (${trueRegistered.length}) + internet (${internetResults.length})`
      );
    } else {
      // Si NO hay registrados, mostrar caché + internet
      allResults = [
        ...cachedResults, // 🟡 Proveedores en caché
        ...internetResults, // 🔵 De internet
      ];
      console.log(
        `📊 [RESULTADO FINAL] Sin registrados. Mostrando caché (${cachedResults.length}) + internet (${internetResults.length})`
      );
    }

    console.log(`\n📊 [RESULTADO] Total: ${allResults.length} proveedores`);
    console.log(`   🟢 Registrados reales: ${trueRegistered.length}`);
    console.log(
      `   🟡 En caché: ${trueRegistered.length >= MIN_RESULTS ? 0 : trueRegistered.length > 0 ? 0 : cachedResults.length}`
    );
    console.log(
      `   🌐 Internet: ${trueRegistered.length >= MIN_RESULTS ? 0 : internetResults.length}`
    );

    let sourceMsg = 'Solo caché';
    if (trueRegistered.length >= MIN_RESULTS) {
      sourceMsg = `Solo registrados (≥${MIN_RESULTS})`;
    } else if (trueRegistered.length > 0) {
      sourceMsg = `Registrados + Internet (<${MIN_RESULTS})`;
    } else if (usedTavily) {
      sourceMsg = 'Caché + Internet';
    }
    console.log(`   📡 Fuente: ${sourceMsg}\n`);

    // ===== 4. ACTUALIZAR MÉTRICAS DE VISTAS (solo para registrados reales) =====
    if (trueRegistered.length > 0) {
      const batch = db.batch();

      trueRegistered.forEach((supplier) => {
        if (supplier.id) {
          // Solo si tiene ID (está en Firestore)
          const docRef = db.collection('suppliers').doc(supplier.id);
          batch.update(docRef, {
            'metrics.views': admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await batch.commit();
      console.log(
        `📊 [METRICS] Views incrementadas para ${trueRegistered.length} proveedores registrados`
      );
    }

    // ===== 5. RESPONDER =====
    const cachedCount =
      trueRegistered.length >= MIN_RESULTS
        ? 0
        : trueRegistered.length > 0
          ? 0
          : registeredResults.filter((r) => r.registered !== true).length;

    res.json({
      success: true,
      count: allResults.length,
      breakdown: {
        registered: trueRegistered.length,
        cached: cachedCount,
        internet: internetResults.length,
      },
      searchMode: searchMode, // Modo de búsqueda usado
      source: usedTavily ? 'firestore+tavily' : 'firestore',
      minResults: MIN_RESULTS,
      showingInternetComplement: trueRegistered.length > 0 && trueRegistered.length < MIN_RESULTS,
      suppliers: allResults,
    });
  } catch (error) {
    console.error('❌ [HYBRID-SEARCH] Error:', error);
    logger.error('[suppliers-hybrid] Error en búsqueda híbrida', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Error en búsqueda híbrida de proveedores',
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
        error: 'action debe ser view, click o contact',
      });
    }

    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);

    // Verificar que existe
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Actualizar métrica correspondiente
    const updateData = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === 'click') {
      updateData['metrics.clicks'] = admin.firestore.FieldValue.increment(1);
    } else if (action === 'contact') {
      updateData['metrics.conversions'] = admin.firestore.FieldValue.increment(1);
      updateData['metrics.lastContactDate'] = admin.firestore.FieldValue.serverTimestamp();
    }
    // 'view' ya se registra en la búsqueda

    await docRef.update(updateData);

    // Registrar evento detallado en nueva ubicación
    await db
      .collection('suppliers')
      .doc(id)
      .collection('analytics')
      .doc('events')
      .collection('log')
      .add({
        supplierId: id,
        action,
        userId: userId || 'anonymous',
        weddingId: weddingId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`📊 [METRIC] ${action} registrado para ${id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error tracking metric:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'Proveedor no encontrado',
      });
    }

    res.json({
      success: true,
      supplier: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
