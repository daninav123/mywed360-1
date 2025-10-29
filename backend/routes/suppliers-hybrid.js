// routes/suppliers-hybrid.js
// 🔄 FASE 2: BÚSQUEDA HÍBRIDA (Registrados + Internet)
//
// Busca primero en proveedores REGISTRADOS (Firestore)
// Si NO hay resultados (0), busca en INTERNET (Tavily)
// Priorización: [BD PROPIA] → [BODAS.NET] → [OTROS INTERNET]

import express from 'express';
import OpenAI from 'openai';
import { db, admin } from '../db.js';
import axios from 'axios';
import crypto from 'crypto';
import logger from '../logger.js';
import searchAnalyticsService from '../services/searchAnalyticsService.js';

const router = express.Router();

// Importar función de búsqueda Tavily desde el otro router
// (Necesitaremos refactorizar esto)
import fetch from 'node-fetch';

// Importar servicio de Google Places
import * as googlePlacesService from '../services/googlePlacesService.js';

// Importar utilidades de ubicación
import { filterSuppliersByLocation } from '../utils/locationMatcher.js';

const NEUTRAL_LOCATIONS = new Set(['españa', 'spain', 'nacional', 'todo españa', 'toda españa']);

/**
 * Genera un ID único y determinístico para un proveedor basado en su email
 * Si el mismo proveedor aparece en múltiples búsquedas, tendrá el mismo ID
 */
function generateSupplierId(email, name) {
  if (!email || typeof email !== 'string') {
    // Fallback: generar ID basado en nombre + timestamp (menos ideal)
    const base = (name || 'unknown') + Date.now();
    return 'inet_' + crypto.createHash('md5').update(base).digest('hex').substring(0, 16);
  }

  // Email normalizado (lowercase, sin espacios)
  const normalized = email.toLowerCase().trim();

  // Hash MD5 del email (determinístico)
  const hash = crypto.createHash('md5').update(normalized).digest('hex');

  // Tomar primeros 16 caracteres + prefijo
  return 'inet_' + hash.substring(0, 16);
}

const normalizeText = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// ⭐ NUEVA: Función para extraer email del contenido
const extractEmail = (text = '') => {
  if (!text) return null;

  // Patrones de email
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern);

  if (!matches || matches.length === 0) return null;

  // Filtrar emails no deseados (genéricos, spam)
  const unwantedEmails = [
    'info@example.com',
    'noreply@',
    'no-reply@',
    'postmaster@',
    'webmaster@',
    'admin@example',
    'test@',
    'privacy@',
    'legal@',
    'soporte@bodas.net',
    'contacto@bodas.net',
  ];

  for (const email of matches) {
    const lowerEmail = email.toLowerCase();
    const isUnwanted = unwantedEmails.some((unwanted) => lowerEmail.includes(unwanted));

    if (!isUnwanted) {
      return email;
    }
  }

  return null;
};

// ⭐ NUEVA: Función para extraer teléfono del contenido
const extractPhone = (text = '') => {
  if (!text) return null;

  // Patrones de teléfono español (más flexibles)
  const phonePatterns = [
    // Móviles españoles: 6XX XXX XXX, 7XX XXX XXX
    /\b([67]\d{2}[\s\-]?\d{3}[\s\-]?\d{3})\b/g,
    // Fijos españoles: 9XX XXX XXX
    /\b(9\d{2}[\s\-]?\d{3}[\s\-]?\d{3})\b/g,
    // Con prefijo +34
    /\+34[\s\-]?([67]\d{2}[\s\-]?\d{3}[\s\-]?\d{3})\b/g,
    /\+34[\s\-]?(9\d{2}[\s\-]?\d{3}[\s\-]?\d{3})\b/g,
    // Con código de área entre paréntesis
    /\((\d{3})\)[\s\-]?(\d{3})[\s\-]?(\d{3})/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Limpiar y formatear
      let phone = matches[0].replace(/[\s\-\(\)]/g, '');

      // Si empieza con +34, quitar el prefijo
      if (phone.startsWith('+34')) {
        phone = phone.substring(3);
      }

      // Verificar que tiene 9 dígitos
      if (phone.length === 9) {
        // Formatear: XXX XXX XXX
        return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 9)}`;
      }
    }
  }

  return null;
};

// ⭐ NUEVA: Función para limpiar y mejorar descripción
const cleanDescription = (text = '', maxLength = 250) => {
  if (!text) return '';

  let cleaned = text
    // Eliminar HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Eliminar múltiples espacios
    .replace(/\s+/g, ' ')
    // Eliminar caracteres especiales problemáticos
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,;:()\-¿?¡!€$%&]/g, '')
    // Trim
    .trim();

  // Eliminar patrones de SEO/spam
  const spamPatterns = [
    /consulta (precio|presupuesto)/gi,
    /contacta con nosotros/gi,
    /solicita información/gi,
    /ver más/gi,
    /leer más/gi,
    /cookies/gi,
    /política de privacidad/gi,
  ];

  spamPatterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Truncar si es muy largo
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    // Buscar el último espacio para no cortar palabras
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > maxLength - 50) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned = cleaned.trim() + '...';
  }

  return cleaned;
};

// Función auxiliar: Buscar en Tavily (MEJORADA)
async function searchTavilySimple(query, location, service) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ TAVILY_API_KEY no configurada, saltando búsqueda en internet');
    return [];
  }

  // ✅ MEJORADA: Query más específica y efectiva
  const queryTerms = [];

  // 1. Servicio principal
  if (service) queryTerms.push(service);

  // 2. Términos de búsqueda del usuario
  if (query && query.trim()) {
    queryTerms.push(query.trim());
  }

  // 3. Contexto de bodas
  queryTerms.push('bodas');

  // 4. Ubicación
  if (location) queryTerms.push(location);

  // 5. Términos de calidad para mejorar resultados
  queryTerms.push('profesional OR empresa OR estudio');

  // 6. Excluir directorios y listados genéricos
  const excludeTerms = [
    '-"buscar"',
    '-"encuentra"',
    '-"listado"',
    '-"directorio"',
    '-"comparar"',
    '-"precios desde"',
    '-"opiniones de"',
  ];

  const searchQuery = `${queryTerms.join(' ')} ${excludeTerms.join(' ')}`;

  console.log(`🔍 [TAVILY] Query construida: "${searchQuery}"`);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: true, // ⭐ ACTIVADO: Para extraer email/teléfono del HTML
        include_images: true,
        max_results: 30, // ✅ Aumentado para obtener más resultados
        exclude_domains: [
          // ⭐ CAMBIO: Solo excluimos marketplaces genéricos y portales NO relacionados con bodas
          // Los portales de bodas (bodas.net, zankyou, etc.) se permiten y se filtran por CONTENIDO
          // Esto permite que CUALQUIER portal nuevo de bodas funcione automáticamente

          // Marketplaces genéricos (NO bodas)
          'wikipedia.org',
          'youtube.com',
          'amazon',
          'pinterest',
          'ebay',
          'aliexpress',
          'milanuncios',
          'wallapop',

          // Portales de clasificados genéricos (NO bodas)
          'milanuncios.com',
          'segundamano.es',
          'olx.es',
          'vibbo.com',
          'tablondeanuncios.com',

          // Portales de reseñas genéricos (NO bodas)
          'tripadvisor',
          'yelp',
          'foursquare',
          'mejores10.com',
          'top10.com',
          'rankia.com',
        ],
      }),
    });

    if (!response.ok) {
      console.error(`❌ Tavily API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    console.log(`📊 [TAVILY] Respuesta: ${data.results?.length || 0} resultados brutos`);

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
      const firestoreStart = Date.now();
      console.log('📊 [FIRESTORE] Buscando proveedores por nombre...');
      console.log(`   Servicio: "${service}" | Query: "${query || '—'}"`);

      // Traer todos los proveedores (sin filtro de categoría ni ubicación)
      // Filtraremos por nombre y ubicación en memoria con lógica de ámbito geográfico
      let firestoreQuery = db.collection('suppliers').limit(100);

      const snapshot = await firestoreQuery.get();

      console.log(`📊 [FIRESTORE] ${snapshot.size} documentos encontrados en colección suppliers`);

      let registeredResults = snapshot.docs
        .map((doc) => {
          const data = doc.data();

          // ⭐ OPTIMIZADO: Solo log si variable DEBUG está activada
          if (process.env.DEBUG_SUPPLIERS === 'true') {
            console.log(`\n[DEBUG] Proveedor ID: ${doc.id}`);
            console.log(`   name: "${data.name || data.profile?.name}"`);
            console.log(`   status: "${data.status}"`);
            console.log(`   category: "${data.category || data.profile?.category}"`);
            console.log(`   tags: [${(data.tags || []).join(', ')}]`);
            console.log(
              `   description: "${(data.business?.description || '').substring(0, 50)}..."`
            );
          }

          return {
            id: doc.id,
            ...data,
            // Todos los de la colección suppliers son registrados
            registered: true,
            priority: 'registered',
            badge: 'Verificado ',
            badgeType: 'success',
          };
        })
        // Filtrar por nombre/término de búsqueda
        .filter((supplier) => {
          const supplierName = (supplier.name || supplier.profile?.name || '').toLowerCase();
          const supplierDesc = (supplier.business?.description || '').toLowerCase();
          const supplierTags = (supplier.tags || supplier.business?.services || [])
            .join(' ')
            .toLowerCase();
          const supplierCategory = (
            supplier.category ||
            supplier.profile?.category ||
            ''
          ).toLowerCase();

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

          // ⭐ OPTIMIZADO: Solo log detallado si DEBUG activado
          if (process.env.DEBUG_SUPPLIERS === 'true') {
            console.log(`\n🔍 [FILTER] Evaluando: ${supplier.name || supplier.profile?.name}`);
            console.log(`   Tokens búsqueda: [${tokens.join(', ')}]`);
            console.log(`   Name: "${supplierName}"`);
            console.log(`   Category: "${supplierCategory}"`);
            console.log(`   Tags: "${supplierTags}"`);
            console.log(`   Desc: "${supplierDesc.substring(0, 50)}..."`);
          }

          if (tokens.length === 0) {
            return true;
          }

          // ⭐ MEJORADO: Match ponderado - priorizar nombre y categoría
          const matches = tokens.some((term) => {
            const token = term.toLowerCase();
            const normalizedToken = normalizeText(token);

            // 1. Match en nombre o categoría (más importante)
            const matchInNameOrCategory =
              supplierName.includes(token) ||
              supplierCategory.includes(token) ||
              normalizeText(supplierName).includes(normalizedToken) ||
              normalizeText(supplierCategory).includes(normalizedToken);

            if (matchInNameOrCategory) {
              if (process.env.DEBUG_SUPPLIERS === 'true') {
                console.log(`   ✅ MATCH en nombre/categoría con token "${term}"`);
              }
              return true;
            }

            // 2. Match en tags (menos importante, pero aceptable)
            const matchInTags =
              supplierTags.includes(token) || normalizeText(supplierTags).includes(normalizedToken);

            if (matchInTags) {
              if (process.env.DEBUG_SUPPLIERS === 'true') {
                console.log(`   ✅ MATCH en tags con token "${term}"`);
              }
              return true;
            }

            // 3. Match en descripción SOLO si el token es largo (>4 caracteres)
            // Esto evita falsos positivos con palabras cortas en descripciones largas
            if (token.length > 4) {
              const matchInDesc =
                supplierDesc.includes(token) ||
                normalizeText(supplierDesc).includes(normalizedToken);

              if (matchInDesc) {
                if (process.env.DEBUG_SUPPLIERS === 'true') {
                  console.log(`   ✅ MATCH en descripción con token "${term}"`);
                }
                return true;
              }
            }

            return false;
          });

          if (!matches && process.env.DEBUG_SUPPLIERS === 'true') {
            console.log(`   ❌ NO MATCH - Filtrado`);
          }

          return matches;
        })
        // Filtrar por status en memoria (evita índice compuesto)
        // ⚠️ PERMITIR: "active" y "cached" - NO "discovered" por implicaciones legales
        .filter((supplier) => {
          const status = supplier.status || 'active';
          const isValid = status === 'active' || status === 'cached'; // Activos + cached OK, NO discovered

          if (!isValid && process.env.DEBUG_SUPPLIERS === 'true') {
            console.log(`❌ [STATUS] ${supplier.name} filtrado por status: "${status}"`);
          }

          return isValid;
        });

      // ⭐ NUEVO: Filtrar por ubicación con lógica de ámbito geográfico
      const beforeLocationFilter = registeredResults.length;
      registeredResults = filterSuppliersByLocation(registeredResults, location);
      const filteredByLocation = beforeLocationFilter - registeredResults.length;

      if (filteredByLocation > 0) {
        console.log(
          `\n🌍 [UBICACIÓN] ${filteredByLocation} proveedores filtrados por ámbito geográfico`
        );
        console.log(`   Ubicación solicitada: "${location}"`);
        console.log(`   Proveedores que pueden trabajar ahí: ${registeredResults.length}`);
      }

      registeredResults = registeredResults
        // ⭐ ORDENAMIENTO INTELIGENTE: Priorizar coincidencias de nombre
        .sort((a, b) => {
          const nameA = (a.name || a.profile?.name || '').toLowerCase();
          const nameB = (b.name || b.profile?.name || '').toLowerCase();
          const scoreA = a.metrics?.matchScore || 0;
          const scoreB = b.metrics?.matchScore || 0;

          // Si hay query específica, priorizar coincidencias de nombre
          if (query && query.trim()) {
            // ⭐ CLAVE: Extraer tokens individuales de la query
            const queryTokens = String(query)
              .toLowerCase()
              .trim()
              .split(/\s+/)
              .filter((t) => t.length > 0);

            // Buscar coincidencias con CADA token
            for (const searchTerm of queryTokens) {
              // Coincidencia exacta de nombre (máxima prioridad)
              const exactMatchA = nameA === searchTerm;
              const exactMatchB = nameB === searchTerm;
              if (exactMatchA && !exactMatchB) return -1;
              if (!exactMatchA && exactMatchB) return 1;

              // Nombre comienza con el término (segunda prioridad)
              const startsWithA = nameA.startsWith(searchTerm);
              const startsWithB = nameB.startsWith(searchTerm);
              if (startsWithA && !startsWithB) return -1;
              if (!startsWithA && startsWithB) return 1;

              // Nombre contiene el término (tercera prioridad)
              const containsA = nameA.includes(searchTerm);
              const containsB = nameB.includes(searchTerm);
              if (containsA && !containsB) return -1;
              if (!containsA && containsB) return 1;
            }
          }

          // Si no hay coincidencias de nombre especiales, ordenar por matchScore
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

      // TODOS los proveedores en la colección 'suppliers' son registrados
      // No necesitamos filtrar por un campo 'registered'
      trueRegistered = registeredResults; // Todos son registrados
      cachedResults = []; // No hay caché si todos están en suppliers

      const firestoreEnd = Date.now();
      const firestoreDuration = firestoreEnd - firestoreStart;
      console.log(
        `✅ [FIRESTORE] ${registeredResults.length} proveedores encontrados en ${firestoreDuration}ms`
      );
      console.log(`   - Todos son REGISTRADOS (están en colección suppliers)`);
      console.log(`   - Registrados: ${trueRegistered.length}`);
    } else {
      console.log('⏭️ [FIRESTORE] Saltando búsqueda en base de datos (modo: internet)');
    }

    // ===== 2. BUSCAR EN INTERNET (ESTRATEGIA HÍBRIDA) =====
    // Flujo: FIRESTORE → GOOGLE PLACES → TAVILY
    // (Saltar si modo es 'database')
    const MIN_RESULTS = 5;
    const MIN_RESULTS_FOR_TAVILY = 15; // Aumentado para obtener más resultados antes de complementar con Tavily

    let googlePlacesResults = [];
    let usedGooglePlaces = false;

    // 2.1 GOOGLE PLACES (si categoría tiene alta/media cobertura)
    const shouldSearchGooglePlaces =
      searchMode !== 'database' &&
      (searchMode === 'internet' ||
        (searchMode === 'auto' && trueRegistered.length < MIN_RESULTS)) &&
      googlePlacesService.shouldUseGooglePlaces(service);

    if (shouldSearchGooglePlaces) {
      const googleStart = Date.now();

      try {
        const googleResults = await googlePlacesService.searchGooglePlaces(service, location, 40);

        if (googleResults && googleResults.length > 0) {
          const googleDuration = Date.now() - googleStart;
          console.log(
            `✅ [GOOGLE PLACES] ${googleResults.length} proveedores encontrados en ${googleDuration}ms`
          );

          // Convertir a formato estándar
          googlePlacesResults = googleResults.map((gp) => ({
            id: generateSupplierId(gp.contact?.email || gp.name, gp.name),
            name: gp.name,
            contact: gp.contact,
            location: gp.location,
            rating: gp.rating,
            reviewCount: gp.reviewCount,
            photos: gp.photos,
            verified: gp.verified,
            registered: false,
            source: 'google-places',
            status: 'google-verified',
            badge: gp.badge,
            badgeType: gp.badgeType,
            googlePlaceId: gp.googlePlaceId,
          }));

          usedGooglePlaces = true;
        } else {
          console.log(`📊 [GOOGLE PLACES] 0 resultados`);
        }
      } catch (error) {
        console.error(`❌ [GOOGLE PLACES] Error:`, error.message);
      }
    } else if (searchMode !== 'database') {
      if (!googlePlacesService.shouldUseGooglePlaces(service)) {
        console.log(
          `⏭️ [GOOGLE PLACES] Categoría "${service}" no usa Google Places (mejor cobertura con Tavily)`
        );
      }
    }

    // 2.2 TAVILY (complementar si todavía < 10 resultados)
    const currentTotalResults = trueRegistered.length + googlePlacesResults.length;
    const shouldSearchTavily =
      searchMode !== 'database' &&
      (searchMode === 'internet' ||
        (searchMode === 'auto' && currentTotalResults < MIN_RESULTS_FOR_TAVILY));

    if (shouldSearchTavily) {
      const tavilyStart = Date.now();
      console.log(
        `\n🌐 [TAVILY] ${currentTotalResults} proveedores hasta ahora (mínimo: ${MIN_RESULTS_FOR_TAVILY}). Buscando en Tavily...`
      );

      try {
        const tavilyResults = await searchTavilySimple(query || service, location, service);

        const tavilyDuration = Date.now() - tavilyStart;
        console.log(
          `✅ [TAVILY] ${tavilyResults.length} proveedores encontrados en ${tavilyDuration}ms`
        );

        // Filtrar duplicados (que ya estén en Firestore)
        const registeredEmails = new Set(
          registeredResults.map((r) => r.contact?.email?.toLowerCase()).filter((e) => e)
        );

        const registeredUrls = new Set(
          registeredResults.map((r) => r.contact?.website?.toLowerCase()).filter((u) => u)
        );

        // ✅ MEJORADO: Filtrar resultados de baja calidad
        const qualityResults = tavilyResults.filter((r) => {
          const email = r.email?.toLowerCase();
          const url = r.url?.toLowerCase();
          const title = r.title?.toLowerCase() || '';
          const content = r.content?.toLowerCase() || '';

          // Excluir si ya está en Firestore
          if (email && registeredEmails.has(email)) return false;
          if (url && registeredUrls.has(url)) return false;

          // ✅ Filtrar resultados de baja calidad y LISTADOS/DIRECTORIOS
          // ⭐ IMPORTANTE: NO hacemos excepciones por dominio
          // Los filtros de contenido funcionan para TODOS los portales (bodas.net, zankyou, etc.)
          const lowQualityIndicators = [
            // Opiniones y comparativas
            'opiniones de usuarios',
            'precios desde',
            'comparar precios',
            'reseñas verificadas',
            'valoraciones de clientes',

            // Directorios y listados ESPECÍFICOS
            'encuentra los mejores proveedores',
            'directorio oficial',
            'listado completo',
            'guía de proveedores de',

            // ⭐ NUEVO: Solo filtrar títulos MUY obvios de listado
            'los 10 mejores',
            'los 5 mejores',
            'las 10 mejores',
            'top 10',
            'top 5',
            'ranking de proveedores',
            'clasificación de empresas',

            // Agregadores específicos
            'busca y compara',
            'compara y contrata',
            'todos los proveedores de bodas',
          ];

          const hasLowQualityIndicator = lowQualityIndicators.some(
            (indicator) => title.includes(indicator) || content.includes(indicator)
          );

          if (hasLowQualityIndicator) {
            console.log(`   ❌ Filtrado por baja calidad/listado: ${r.title}`);
            return false;
          }

          // ✅ Debe tener al menos título y URL
          if (!r.title || !r.url) return false;

          // ⭐ NUEVO: Detectar si parece un listado por patrones en el título
          const listPatterns = [
            /^\d+\s+(mejores?|top)\s+(profesionales|empresas|proveedores)/i, // "10 mejores profesionales..."
            /(los|las)\s+\d+\s+mejores?\s+(profesionales|empresas|proveedores)/i, // "Los 10 mejores proveedores..."
            /^top\s+\d+\s+(profesionales|empresas|proveedores)/i, // "Top 10 empresas..."
            /^ranking\s+(de|del)\s+los/i, // "Ranking de los..."
            /^clasificación\s+(de|del)\s+los/i, // "Clasificación de los..."
            /encuentra\s+los\s+mejores\s+(proveedores|profesionales)/i, // "Encuentra los mejores proveedores..."
            /todos?\s+los\s+proveedores\s+de\s+bodas/i, // "Todos los proveedores de bodas"
          ];

          const seemsLikeListing = listPatterns.some((pattern) => pattern.test(title));

          if (seemsLikeListing) {
            console.log(`   ❌ Filtrado por patrón de listado: ${r.title}`);
            return false;
          }

          // ✅ Score mínimo de calidad (Tavily score 0-1) - Reducido para más resultados
          if ((r.score || 0) < 0.15) {
            console.log(`   ❌ Filtrado por score bajo (${r.score}): ${r.title}`);
            return false;
          }

          return true;
        });

        console.log(`   ✅ Tras filtrado de calidad: ${qualityResults.length} resultados`);

        // ✅ MEJORADO: Separar y priorizar por fuente y score
        const bodasNetResults = [];
        const highScoreResults = [];
        const otherResults = [];

        qualityResults.forEach((r) => {
          const url = r.url?.toLowerCase();
          const score = r.score || 0;

          // 1ª Prioridad: Bodas.net
          if (url && url.includes('bodas.net')) {
            bodasNetResults.push(r);
          }
          // 2ª Prioridad: Score alto (>0.7)
          else if (score > 0.7) {
            highScoreResults.push(r);
          }
          // 3ª Prioridad: Resto
          else {
            otherResults.push(r);
          }
        });

        // ✅ Ordenar cada grupo por score
        const sortByScore = (a, b) => (b.score || 0) - (a.score || 0);
        bodasNetResults.sort(sortByScore);
        highScoreResults.sort(sortByScore);
        otherResults.sort(sortByScore);

        // ✅ PRIORIZAR: Bodas.net → Alto score → Resto
        const prioritizedResults = [...bodasNetResults, ...highScoreResults, ...otherResults].slice(
          0,
          10
        ); // ✅ Aumentado de 8 a 10

        console.log(
          `   📊 Resultados priorizados: ${bodasNetResults.length} bodas.net, ${highScoreResults.length} alto score, ${otherResults.length} otros`
        );

        // ✅ MEJORADO: Convertir y extraer más información
        internetResults = prioritizedResults.map((r) => {
          const url = r.url?.toLowerCase() || '';
          const isBodas = url.includes('bodas.net');
          const score = r.score || 0.5;

          // ⭐ MEJORADO: Extraer datos del contenido
          const content = r.content || '';
          const rawContent = r.raw_content || content;

          // Combinar título + contenido para extracción
          const fullText = `${r.title || ''} ${content} ${rawContent}`.toLowerCase();

          // ✅ Extraer email (prioridad: campo directo > contenido)
          const extractedEmail = r.email || extractEmail(fullText);

          // ✅ Extraer teléfono (prioridad: campo directo > contenido)
          const extractedPhone = r.phone || extractPhone(fullText);

          // ✅ Limpiar y mejorar descripción
          const cleanedDescription = cleanDescription(content, 250);

          // ✅ Extraer redes sociales del contenido
          const instagramMatch = fullText.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
          const facebookMatch = fullText.match(/facebook\.com\/([a-zA-Z0-9._]+)/);

          // ⭐ NUEVO: Extraer nombre limpio del título (eliminar SEO)
          let cleanName = r.title || 'Proveedor';
          // Eliminar patrones de SEO comunes
          cleanName = cleanName
            .replace(/\s*[-|]\s*(bodas\.net|zankyou|the knot|matrimonio\.com).*$/i, '')
            .replace(/\s*\|\s*.*$/i, '')
            .replace(
              /^(mejores?\s+)?(\d+\s+)?(fotógrafos?|catering|dj|floristería|vestidos?)(\s+de\s+bodas?)?\s+en\s+/i,
              ''
            )
            .trim();

          console.log(`📧 [EXTRACCIÓN] ${cleanName}:`);
          console.log(`   Email: ${extractedEmail || '❌ No encontrado'}`);
          console.log(`   Teléfono: ${extractedPhone || '❌ No encontrado'}`);
          console.log(
            `   Descripción: ${cleanedDescription ? '✅ ' + cleanedDescription.substring(0, 50) + '...' : '❌ Vacía'}`
          );

          // Generar ID único y determinístico
          const supplierId = generateSupplierId(extractedEmail, cleanName);

          return {
            // Convertir formato Tavily a formato supplier
            id: supplierId, // ✅ NUEVO: ID único basado en email
            name: cleanName,
            slug: null, // No tiene slug aún
            category: service,
            location: {
              city: location,
              province: '',
              country: 'España',
            },
            contact: {
              email: extractedEmail || '',
              website: r.url,
              phone: extractedPhone || '',
              instagram: instagramMatch
                ? `https://instagram.com/${instagramMatch[1]}`
                : r.instagram || '',
              facebook: facebookMatch ? `https://facebook.com/${facebookMatch[1]}` : '',
            },
            business: {
              description: cleanedDescription,
              priceRange: '',
              services: [service], // ✅ Añadido el servicio
            },
            media: {
              logo: r.image || '',
              cover: '',
              portfolio: [],
            },
            metrics: {
              matchScore: Math.round(score * 100), // ✅ Usar score real
              views: 0,
              clicks: 0,
              conversions: 0,
              rating: 0,
              reviewCount: 0,
              tavilyScore: score, // ✅ NUEVO: Guardar score original
            },
            registered: false,
            source: isBodas ? 'bodas-net' : 'tavily-realtime',
            status: 'internet-only', // ⚠️ NO "discovered" - no se guarda en BD
            priority: isBodas ? 'high' : score > 0.7 ? 'medium' : 'low', // ✅ NUEVO: Prioridad dinámica
            badge: isBodas ? 'Bodas.net 💒' : score > 0.7 ? 'Alta calidad ⭐' : 'De internet 🌐',
            badgeType: isBodas ? 'info' : score > 0.7 ? 'success' : 'default',
            // ✅ NUEVO: Metadata de búsqueda
            searchMetadata: {
              query: query || service,
              location: location,
              discoveredAt: new Date().toISOString(),
              tavilyUrl: r.url,
            },
          };
        });

        // ⭐ FILTRAR 1: Descartar proveedores SIN contacto (debe tener email O teléfono)
        const beforeFilter = internetResults.length;
        internetResults = internetResults.filter((supplier) => {
          const hasEmail = supplier.contact?.email && supplier.contact.email.length > 0;
          const hasPhone = supplier.contact?.phone && supplier.contact.phone.length > 0;
          const hasContact = hasEmail || hasPhone;

          if (!hasContact) {
            console.log(`   ❌ Descartado (sin contacto): ${supplier.name}`);
          }

          return hasContact;
        });

        const filtered = beforeFilter - internetResults.length;
        if (filtered > 0) {
          console.log(
            `\n🔍 [FILTRO] ${filtered} proveedores descartados por falta de contacto (email o teléfono)`
          );
        }

        // ⭐ FILTRAR 2: Eliminar duplicados inteligente
        // Estrategia: dominio email + ubicación + similitud nombre
        const seenEmails = new Set();
        const seenPhones = new Set();
        const seenDomains = new Map(); // Map<dominio, {name, location}>
        const beforeDedup = internetResults.length;

        // Función para extraer dominio de email
        const extractDomain = (email) => {
          if (!email) return null;
          const match = email.match(/@([a-z0-9.-]+\.[a-z]{2,})$/i);
          return match ? match[1].toLowerCase() : null;
        };

        // Función para extraer dominio de URL
        const extractUrlDomain = (url) => {
          if (!url) return null;
          try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase().replace(/^www\./, '');
          } catch {
            return null;
          }
        };

        // Función de similitud de texto (simple)
        const similarity = (str1, str2) => {
          const s1 = str1.toLowerCase().trim();
          const s2 = str2.toLowerCase().trim();
          if (s1 === s2) return 1;
          if (s1.includes(s2) || s2.includes(s1)) return 0.8;
          const longer = s1.length > s2.length ? s1 : s2;
          const shorter = s1.length > s2.length ? s2 : s1;
          if (longer.includes(shorter)) return 0.7;
          return 0;
        };

        internetResults = internetResults.filter((supplier) => {
          const email = supplier.contact?.email?.toLowerCase().trim();
          const phone = supplier.contact?.phone?.replace(/\s/g, '');
          const name = supplier.name || '';
          const loc = (supplier.location?.city || '').toLowerCase();

          // Extraer usuario de Instagram (sin URL)
          const instagram = supplier.contact?.instagram || '';
          const instagramUser = instagram
            .replace(/https?:\/\/(www\.)?instagram\.com\//i, '')
            .replace(/@/g, '')
            .toLowerCase()
            .trim();

          // 1. Verificar duplicado exacto por email/teléfono (como antes)
          const isDuplicateEmail = email && seenEmails.has(email);
          const isDuplicatePhone = phone && seenPhones.has(phone);

          if (isDuplicateEmail || isDuplicatePhone) {
            const reason = isDuplicateEmail ? 'email duplicado' : 'teléfono duplicado';
            console.log(`   🔄 Descartado (${reason}): ${supplier.name}`);
            return false;
          }

          // 2. Verificar duplicado por dominio + ubicación
          const emailDomain = extractDomain(email);
          const urlDomain = extractUrlDomain(supplier.contact?.website);
          const domain = emailDomain || urlDomain;

          if (domain && loc) {
            const key = `${domain}::${loc}`; // Clave: dominio + ubicación
            const seen = seenDomains.get(key);

            if (seen) {
              // Ya vimos este dominio en esta ubicación
              const nameSimilarity = similarity(name, seen.name);

              // ⭐ MEJORADO: También verificar Instagram
              const sameInstagram =
                instagramUser && seen.instagram && instagramUser === seen.instagram;

              if (nameSimilarity >= 0.7 || sameInstagram) {
                // Mismo dominio + ubicación + (nombre similar O mismo Instagram) = DUPLICADO
                const reason = sameInstagram ? 'Instagram duplicado' : 'nombre similar';
                console.log(`   🔄 Descartado (dominio ${domain} + ${reason}): ${supplier.name}`);
                return false;
              }
            } else {
              // Primera vez que vemos este dominio en esta ubicación
              seenDomains.set(key, { name, location: loc, instagram: instagramUser });
            }
          }

          // Registrar email y teléfono como vistos
          if (email) seenEmails.add(email);
          if (phone) seenPhones.add(phone);

          return true;
        });

        const duplicates = beforeDedup - internetResults.length;
        if (duplicates > 0) {
          console.log(`\n🔄 [DEDUP] ${duplicates} proveedores duplicados eliminados`);
        }

        usedTavily = true;
        console.log(`🔄 [TAVILY] ${internetResults.length} proveedores únicos y útiles`);
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

    // ===== 3. MEZCLAR RESULTADOS: ESTRATEGIA HÍBRIDA =====
    // Prioridad: REGISTRADOS → GOOGLE PLACES → TAVILY
    let allResults;

    if (trueRegistered.length >= MIN_RESULTS) {
      // Si hay 5+ proveedores registrados, SOLO mostrar esos
      allResults = [...trueRegistered];
      console.log(
        `📊 [RESULTADO FINAL] ≥${MIN_RESULTS} registrados. Mostrando solo registrados: ${trueRegistered.length}`
      );
    } else if (trueRegistered.length > 0) {
      // Si hay 1-4 registrados, complementar con Google Places + Tavily
      allResults = [
        ...trueRegistered, // 🟢 Registrados primero (PRIORIDAD 1)
        ...googlePlacesResults, // 🌍 Google Places (PRIORIDAD 2)
        ...internetResults, // 🌐 Tavily (PRIORIDAD 3)
      ];
      console.log(
        `📊 [RESULTADO FINAL] <${MIN_RESULTS} registrados. Mostrando registrados (${trueRegistered.length}) + Google Places (${googlePlacesResults.length}) + Tavily (${internetResults.length})`
      );
    } else {
      // Si NO hay registrados, mostrar caché + Google Places + Tavily
      allResults = [
        ...cachedResults, // 🟡 Proveedores en caché
        ...googlePlacesResults, // 🌍 Google Places
        ...internetResults, // 🔵 Tavily
      ];
      console.log(
        `📊 [RESULTADO FINAL] Sin registrados. Mostrando caché (${cachedResults.length}) + Google Places (${googlePlacesResults.length}) + Tavily (${internetResults.length})`
      );
    }

    console.log(`\n📊 [RESULTADO] Total: ${allResults.length} proveedores`);
    console.log(`   🟢 Registrados reales: ${trueRegistered.length}`);
    console.log(
      `   🟡 En caché: ${trueRegistered.length >= MIN_RESULTS ? 0 : trueRegistered.length > 0 ? 0 : cachedResults.length}`
    );
    console.log(
      `   🌍 Google Places: ${trueRegistered.length >= MIN_RESULTS ? 0 : googlePlacesResults.length}`
    );
    console.log(
      `   🌐 Tavily: ${trueRegistered.length >= MIN_RESULTS ? 0 : internetResults.length}`
    );

    let sourceMsg = 'Solo caché';
    if (trueRegistered.length >= MIN_RESULTS) {
      sourceMsg = `Solo registrados (≥${MIN_RESULTS})`;
    } else if (trueRegistered.length > 0) {
      const sources = [];
      sources.push('Registrados');
      if (googlePlacesResults.length > 0) sources.push('Google Places');
      if (internetResults.length > 0) sources.push('Tavily');
      sourceMsg = sources.join(' + ');
    } else {
      const sources = [];
      if (cachedResults.length > 0) sources.push('Caché');
      if (googlePlacesResults.length > 0) sources.push('Google Places');
      if (internetResults.length > 0) sources.push('Tavily');
      sourceMsg = sources.join(' + ') || 'Sin resultados';
    }
    console.log(`   📡 Fuente: ${sourceMsg}\n`);

    // ⚠️ REMOVED: NO GUARDAR PROVEEDORES DISCOVERED EN FIRESTORE
    // Motivo: Implicaciones legales - no debemos almacenar datos scraped de internet
    // Los proveedores de internet solo se devuelven en la respuesta, NO se guardan en BD

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

    // Determinar fuente
    let finalSource = 'firestore';
    if (usedGooglePlaces && usedTavily) {
      finalSource = 'firestore+google-places+tavily';
    } else if (usedGooglePlaces) {
      finalSource = 'firestore+google-places';
    } else if (usedTavily) {
      finalSource = 'firestore+tavily';
    }

    res.json({
      success: true,
      count: allResults.length,
      breakdown: {
        registered: trueRegistered.length,
        cached: cachedCount,
        googlePlaces: googlePlacesResults.length,
        tavily: internetResults.length,
        total: allResults.length,
      },
      searchMode: searchMode, // Modo de búsqueda usado
      source: finalSource,
      minResults: MIN_RESULTS,
      showingInternetComplement: trueRegistered.length > 0 && trueRegistered.length < MIN_RESULTS,
      usedGooglePlaces: usedGooglePlaces,
      usedTavily: usedTavily,
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
