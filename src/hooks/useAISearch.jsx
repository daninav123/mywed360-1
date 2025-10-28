import { useState, useCallback } from 'react';

import useActiveWeddingInfo from './useActiveWeddingInfo';
import { useAuth } from './useAuth';
import { useFallbackReporting } from './useFallbackReporting';
import { post as apiPost, get as apiGet } from '../services/apiClient';
import useTranslations from './useTranslations';

const slugify = (value) =>
  !value
    ? ''
    : String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const guessServiceFromQuery = (query, t) => {
  const fallback = t('common.suppliers.aiSearch.services.generic');
  if (!query) return fallback;
  const words = query.toLowerCase().split(/[,;]+/)[0]?.trim();
  if (!words) return fallback;
  if (words.includes('foto')) return t('common.suppliers.aiSearch.services.photo');
  if (words.includes('video')) return t('common.suppliers.aiSearch.services.video');
  if (words.includes('catering')) return t('common.suppliers.aiSearch.services.catering');
  if (words.includes('dj') || words.includes('musica')) return t('common.suppliers.aiSearch.services.music');
  if (words.includes('flor')) return t('common.suppliers.aiSearch.services.flowers');
  return query.trim();
};

const ensureMatchScore = (match, index) => {
  if (typeof match === 'number' && !Number.isNaN(match)) {
    return Math.max(0, Math.min(100, Math.round(match)));
  }
  return Math.max(60, 95 - index * 5);
};

const generateAISummary = (item, query, t) => {
  const highlights = [];
  const queryWords = query.toLowerCase().split(' ');
  if (item.tags?.some((tag) => queryWords.includes(tag.toLowerCase()))) {
    highlights.push(t('common.suppliers.aiSearch.aiSummary.matchesPreferences'));
  }
  if (item.price) {
    highlights.push(t('common.suppliers.aiSearch.aiSummary.priceRange', { price: item.price }));
  }
  if (item.location) {
    highlights.push(t('common.suppliers.aiSearch.aiSummary.location', { location: item.location }));
  }
  return highlights.join(' ');
};

const normalizeResult = (item, index, query, t) => {
  const name = (
    item?.name ||
    item?.title ||
    t('common.suppliers.aiSearch.defaults.suggestedName', { index: index + 1 })
  ).trim();
  const service = (item?.service || item?.category || guessServiceFromQuery(query, t)).trim();
  const location = item?.location || item?.city || '';
  const priceRange = item?.priceRange || item?.price || '';
  const snippet = item?.snippet || item?.description || '';
  const link = item?.link || item?.url || item?.website || '';
  const match = ensureMatchScore(item?.match, index);
  const aiSummary = item?.aiSummary || generateAISummary(item, query, t);
  const image = item?.image || '';
  const email = item?.email || '';
  const phone = item?.phone || '';
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const keywords = Array.isArray(item?.keywords) ? item.keywords : [];
  const baseId = slugify(item?.id || link || `${name}-${location}`);
  const id = baseId ? `${baseId}-${index}` : `ai-provider-${index}`;

  return {
    id,
    name,
    service,
    snippet,
    image,
    location,
    priceRange,
    price: priceRange,
    tags,
    keywords,
    match,
    aiSummary,
    link,
    email,
    phone,
    raw: item,
  };
};

const extractFromArray = (arr, selector) => {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  for (const entry of arr) {
    const value = selector(entry);
    if (value) return value;
  }
  return '';
};

const normalizeProviderRecord = (item, index, query, inferredService, t) => {
  if (!item) return null;
  const tagsSet = new Set();
  if (Array.isArray(item.tags)) {
    item.tags.filter(Boolean).forEach((tag) => tagsSet.add(tag));
  }
  if (Array.isArray(item.services)) {
    item.services
      .map((s) => s?.name)
      .filter(Boolean)
      .forEach((name) => tagsSet.add(name));
  }

  const snippetParts = [];
  if (item.description) snippetParts.push(item.description);
  if (item.notes) snippetParts.push(item.notes);
  if (Array.isArray(item.services)) {
    item.services
      .map((s) => s?.description)
      .filter(Boolean)
      .forEach((desc) => snippetParts.push(desc));
  }
  const snippet = snippetParts.join(' ').trim();

  const imageCandidate =
    item.image ||
    item.imageUrl ||
    item.coverImage ||
    item.coverImageUrl ||
    extractFromArray(item.images, (img) => (typeof img === 'string' ? img : img?.url));

  const priceCandidate =
    item.priceRange ||
    item.price ||
    item.averagePrice ||
    extractFromArray(item.services, (svc) => svc?.priceRange || svc?.price);

  const linkCandidate =
    item.website ||
    item.url ||
    item.profileUrl ||
    extractFromArray(item.links, (link) => (typeof link === 'string' ? link : link?.url));

  return normalizeResult(
    {
      name: item.name,
      service: item.category || inferredService,
      location: item.location || item.city || item.address || '',
      priceRange: priceCandidate,
      snippet: snippet || item.summary || '',
      link: linkCandidate,
      image: imageCandidate || '',
      email: item.email || item.contactEmail || '',
      phone: item.phone || item.contactPhone || '',
      tags: Array.from(tagsSet),
      keywords: Array.from(tagsSet),
    },
    index,
    query,
    t
  );
};

const mapBackendErrorMessage = (payload, status, fallbackMessage, t) => {
  const code = payload?.error || payload?.code;
  const detail = payload?.details || payload?.message || '';
  const statusLabel =
    status !== undefined && status !== null
      ? status
      : t('common.suppliers.aiSearch.errors.unknownStatus');
  switch (code) {
    case 'openai_failed':
      return t('common.suppliers.aiSearch.errors.openaiFailed');
    case 'openai_invalid_response':
      return t('common.suppliers.aiSearch.errors.openaiInvalidResponse');
    case 'openai_request_failed':
      return t('common.suppliers.aiSearch.errors.openaiRequestFailed');
    case 'serp_unavailable':
      return t('common.suppliers.aiSearch.errors.serpUnavailable');
    case 'rate_limited':
      return t('common.suppliers.aiSearch.errors.rateLimited');
    default:
      if (detail) return detail;
      if (fallbackMessage) return fallbackMessage;
      if (status) return t('common.suppliers.aiSearch.errors.http', { status: statusLabel });
      return t('common.suppliers.aiSearch.errors.generic');
  }
};

const generateDemoResults = (query, t) => {
  const demoDatabase =
    t('common.suppliers.aiSearch.demoResults', {
      returnObjects: true,
    }) || [];

  // Asegurarse de que demoDatabase es un array
  const databaseArray = Array.isArray(demoDatabase) ? demoDatabase : [];
  
  if (databaseArray.length === 0) {
    console.warn('[useAISearch] demoResults no es un array o está vacío, devolviendo array vacío');
    return [];
  }

  return databaseArray.map((item, index) =>
    normalizeResult(
      {
        ...item,
        priceRange: item.price ?? item.priceRange,
        match: ensureMatchScore(item.match, index),
        aiSummary: item.aiSummary || generateAISummary(item, query, t),
        },
      index,
      query,
      t
    )
  );
};

const rawBackendFlag =
  import.meta?.env?.VITE_ENABLE_AI_SUPPLIERS ??
  import.meta?.env?.VITE_AI_SUPPLIERS ??
  import.meta?.env?.VITE_AI_SUPPLIERS_ENABLED;

const ENABLE_BACKEND_AI =
  rawBackendFlag === undefined ||
  rawBackendFlag === null ||
  String(rawBackendFlag).trim() === ''
    ? true
    : String(rawBackendFlag)
        .trim()
        .match(/^(1|true|on|enabled)$/i);

// Variable para elegir tipo de búsqueda:
// 'tavily' = Tavily Search API (RECOMENDADO - mejor para IA)
// 'google' = Google Custom Search API
// 'false' = Solo GPT (datos generados/ficticios)
// TEMPORAL: Hardcodeado mientras se soluciona problema de carga de .env
const SEARCH_PROVIDER = 'tavily'; // String(import.meta?.env?.VITE_SEARCH_PROVIDER || 'false').toLowerCase();

// DEBUG: Sistema completo de diagnóstico de variables de entorno
  // ⭐ OPTIMIZADO: Solo mostrar en DEV y cuando hay errores
  if (import.meta.env.DEV && (!import.meta.env?.VITE_SEARCH_PROVIDER || !import.meta.env?.VITE_BACKEND_BASE_URL)) {
    console.log('🔍 [DEBUG] Diagnóstico de Variables de Entorno');
    console.log('🎯 VITE_SEARCH_PROVIDER:', import.meta.env?.VITE_SEARCH_PROVIDER);
    console.log('🎯 VITE_ENABLE_AI_SUPPLIERS:', import.meta.env?.VITE_ENABLE_AI_SUPPLIERS);
    console.log('🎯 VITE_BACKEND_BASE_URL:', import.meta.env?.VITE_BACKEND_BASE_URL);
    console.log('✅ SEARCH_PROVIDER procesado:', SEARCH_PROVIDER);
    console.log('✅ ENABLE_BACKEND_AI procesado:', ENABLE_BACKEND_AI);
  }

export const useAISearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const { user } = useAuth();
  const { info: weddingDoc } = useActiveWeddingInfo();
  const { reportFallback } = useFallbackReporting();
  const { t } = useTranslations();

  const searchProviders = useCallback(
    async (query, opts = {}) => {
      if (!query?.trim() || !user) return [];

      setLoading(true);
      setLastQuery(query);
      setError(null);
      setUsedFallback(false);

      const profile = (weddingDoc && (weddingDoc.weddingInfo || weddingDoc)) || {};
      const location =
        profile.celebrationPlace ||
        profile.location ||
        profile.city ||
        profile.ceremonyLocation ||
        profile.receptionVenue ||
        '';
      const budget =
        profile.budget || profile.estimatedBudget || profile.totalBudget || profile.presupuesto || '';
      const inferredService = (opts && opts.service) || guessServiceFromQuery(query, t);
      const allowFallback = opts?.allowFallback === true;
      const enrichedQuery = [query, inferredService, location, budget].filter(Boolean).join(' ').trim();

      let lastError = null;

      // Opciones de autenticación para llamadas a la API
      const baseFetchOptions = {
        auth: true, // Siempre enviar token de autenticación
        silent: true,
      };

      try {
        if (ENABLE_BACKEND_AI) {
          // Elegir endpoint según configuración
          let endpoint = '/api/ai-suppliers'; // Por defecto: solo GPT (datos generados)
          
          if (SEARCH_PROVIDER === 'tavily') {
            endpoint = '/api/ai-suppliers-tavily'; // Tavily Search (RECOMENDADO)
          } else if (SEARCH_PROVIDER === 'google') {
            endpoint = '/api/ai-suppliers-real'; // Google Custom Search
          }
          
          console.log('[useAISearch] 🚀 Usando endpoint:', endpoint);
          console.log('[useAISearch] 📊 Proveedor:', SEARCH_PROVIDER);
          
          const res = await apiPost(
            endpoint,
            { query, service: inferredService, budget, profile, location },
            baseFetchOptions
          );
          if (res?.ok) {
            const data = await res.json().catch(() => null);
            console.log('[useAISearch] ✅ Respuesta exitosa de ai-suppliers:', data);
            console.log('[useAISearch] 🖼️ Primera imagen:', data?.[0]?.image);
            console.log('[useAISearch] 📦 Primer resultado completo:', data?.[0]);
            const arr = Array.isArray(data) ? data : [];
            if (arr.length) {
              const normalized = arr
                .filter((item) => item && (item.title || item.name))
                .map((item, index) =>
                  normalizeResult(
                    {
                      ...item,
                      name: item.name || item.title,
                      service: item.service || inferredService,
                      priceRange: item.priceRange || item.price,
                      snippet: item.snippet,
                      image: item.image || '',
                      link: item.link || item.url || '',
                      email: item.email || '',
                      phone: item.phone || '',
                      tags: item.tags || [],
                    },
                    index,
                    query,
                    t
                  )
                );
              if (normalized.length) {
                console.log('[useAISearch] ✅ Proveedores normalizados:', normalized.length);
                const refined = refineResults(normalized, { service: inferredService, location, t });
                setResults(refined);
                setLoading(false);
                return refined;
              }
            } else {
              console.warn('[useAISearch] ⚠️ Backend respondió OK pero sin resultados');
            }
          } else {
            const payload = await res.json().catch(() => null);
            console.error('[useAISearch] ❌ ai-suppliers backend respondió error', {
              status: res?.status,
              payload,
            });
            const message = mapBackendErrorMessage(
              payload,
              res?.status,
              t('common.suppliers.aiSearch.errors.aiResponse', {
                status: res?.status ?? t('common.suppliers.aiSearch.errors.unknownStatus'),
              }),
              t
            );
            const err = new Error(message);
            if (payload?.error) err.code = payload.error;
            throw err;
          }
        }
      } catch (backendError) {
        console.warn('Fallo consultando ai-suppliers', backendError);
        console.debug('[useAISearch] ai-suppliers excepción', backendError?.message, backendError);
        
        // Detectar error de red (backend no disponible)
        if (backendError?.message?.includes('fetch') || backendError?.name === 'TypeError') {
          const networkError = new Error(
            t('common.suppliers.aiSearch.errors.offline')
          );
          networkError.code = 'BACKEND_OFFLINE';
          lastError = networkError;
          
          // Reportar fallback al sistema de monitoreo
          await reportFallback('ai-suppliers', networkError, {
            endpoint: '/api/ai-suppliers',
            query: enrichedQuery || query,
            service: inferredService,
          });
        } else {
          lastError = backendError instanceof Error ? backendError : new Error(String(backendError || 'Error'));
          
          // Reportar otros errores de API
          await reportFallback('ai-suppliers', lastError, {
            endpoint: '/api/ai-suppliers',
            query: enrichedQuery || query,
            service: inferredService,
          });
        }
      }

      try {
        const q = [query, inferredService, location].filter(Boolean).join(' ');
        const res2 = await apiGet(`/api/ai/search-suppliers?q=${encodeURIComponent(q)}`, {
          ...baseFetchOptions,
        });
        if (res2?.ok) {
          const json = await res2.json().catch(() => null);
          const arr = Array.isArray(json?.results) ? json.results : [];
          if (arr.length) {
            const normalized = arr.map((item, index) =>
              normalizeResult(
                {
                  name: item.title || item.name,
                  title: item.title || item.name,
                  link: item.link,
                  snippet: item.snippet,
                  service: inferredService,
                  location,
                },
                index,
                query,
                t
              )
            );
            const refined = refineResults(normalized, { service: inferredService, location, t });
            setResults(refined);
            setLoading(false);
            return refined;
          }
        } else if (res2) {
          const payload = await res2.json().catch(() => null);
          const message = mapBackendErrorMessage(
            payload,
            res2.status,
            t('common.suppliers.aiSearch.errors.externalResponse', {
              status: res2.status ?? t('common.suppliers.aiSearch.errors.unknownStatus'),
            }),
            t
          );
          const err = new Error(message);
          if (payload?.error) err.code = payload.error;
          if (!lastError) lastError = err;
          else if (!lastError.message || lastError.message === payload?.error) lastError = err;
        }
      } catch (searchErr) {
        console.warn('Fallo consultando search-suppliers', searchErr);
        if (!lastError) {
          lastError = searchErr instanceof Error ? searchErr : new Error(String(searchErr || 'Error'));
        }
      }

      // Intento 3: consultar la base interna de proveedores
      try {
        const providerQueries = Array.from(
          new Set(
            [query, `${inferredService} ${location}`.trim(), inferredService, location]
              .map((term) => String(term || '').trim())
              .filter(Boolean)
          )
        );

        for (const term of providerQueries) {
          const resProviders = await apiGet(`/api/providers/search?q=${encodeURIComponent(term)}`, {
            ...baseFetchOptions,
          });
          if (!resProviders) continue;

          if (resProviders.ok) {
            const payload = await resProviders.json().catch(() => null);
            const items = Array.isArray(payload?.items) ? payload.items : [];
            if (items.length) {
              const normalized = items
                .map((item, index) => normalizeProviderRecord(item, index, query, inferredService, t))
                .filter(Boolean);
              if (normalized.length) {
                const refined = refineResults(normalized, { service: inferredService, location, t });
                setResults(refined);
                setLoading(false);
                return refined;
              }
            }
          } else {
            const payload = await resProviders.json().catch(() => null);
            const providerError = new Error(
              mapBackendErrorMessage(
                payload,
                resProviders.status,
                t('common.suppliers.aiSearch.errors.internalResponse', {
                  status: resProviders.status ?? t('common.suppliers.aiSearch.errors.unknownStatus'),
                }),
                t
              ),
            );
            if (payload?.error) providerError.code = payload.error;
            if (!lastError) lastError = providerError;
          }
        }

        if (!lastError) {
          const noResultsError = new Error(t('common.suppliers.aiSearch.errors.noLocalResults'));
          noResultsError.code = 'NO_LOCAL_RESULTS';
          lastError = noResultsError;
        }
      } catch (providerErr) {
        console.warn('Fallo consultando providers/search', providerErr);
        if (!lastError) {
          lastError = providerErr instanceof Error ? providerErr : new Error(String(providerErr || 'Error'));
        }
      }
      // Si hay error de backend offline, mostrar mensaje claro
      if (lastError?.code === 'BACKEND_OFFLINE') {
        const backendError = new Error(
          t('common.suppliers.aiSearch.errors.backendUnavailable')
        );
        backendError.code = 'BACKEND_OFFLINE';
        setResults([]);
        setUsedFallback(false);
        setError(backendError);
        setLoading(false);
        return [];
      }

      // Si es error de OpenAI, mostrar mensaje específico
      if (lastError?.code === 'OPENAI_API_KEY missing' || lastError?.message?.includes('OPENAI_API_KEY')) {
        const openaiError = new Error(
          t('common.suppliers.aiSearch.errors.openaiNotConfigured')
        );
        openaiError.code = 'OPENAI_NOT_CONFIGURED';
        setResults([]);
        setUsedFallback(false);
        setError(openaiError);
        setLoading(false);
        return [];
      }

      // Solo usar fallback si se solicita explícitamente
      if (allowFallback) {
        console.info('[useAISearch] Usando resultados de demostración (fallback solicitado explícitamente)');
        const demoResults = generateDemoResults(query, t);
        const refined = refineResults(demoResults, {
          service: inferredService,
          location,
          isDemoMode: true,
          t,
        });
        setResults(refined);
        setUsedFallback(true);
        setLoading(false);
        return refined;
      }

      // Si llegamos aquí, no hay resultados reales
      setResults([]);
      setUsedFallback(false);
      const finalError = lastError || new Error(
        t('common.suppliers.aiSearch.errors.noResults')
      );
      setError(finalError);
      setLoading(false);
      return [];
    },
    [user, weddingDoc, reportFallback]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setLastQuery('');
    setUsedFallback(false);
  }, []);

  return { results, loading, error, lastQuery, usedFallback, searchProviders, clearResults };
};

export default useAISearch;

function refineResults(list, ctx) {
  const serviceRef = String(ctx?.service || '').toLowerCase();
  const locRef = String(ctx?.location || '').toLowerCase();
  const isDemoMode = ctx?.isDemoMode === true;
  const translate = ctx?.t;
  if (!Array.isArray(list) || (!serviceRef && !locRef)) return list || [];

  let byService = serviceRef
    ? (list || []).filter((it) => {
        const service = String(it?.service || '').toLowerCase();
        return includesWord(service, serviceRef) || includesWord(serviceRef, service);
      })
    : (list || []).slice();

  // En modo demo, si quedan muy pocos resultados, mostrar todos
  if (serviceRef && (byService.length === 0 || (isDemoMode && byService.length < 3))) {
    byService = (list || []).slice();
  }

  const scored = byService.map((it) => {
    const src = it || {};
    const service = String(src.service || '').toLowerCase();
    const location = String(src.location || '').toLowerCase();
    const base = typeof src.match === 'number' ? src.match : 60;
    const serviceMatch =
      serviceRef && service ? includesWord(service, serviceRef) || includesWord(serviceRef, service) : false;
    const locMatch = locRef && location ? location.includes(locRef) || locRef.includes(location) : false;
    let boost = 0;
    if (serviceRef) boost += serviceMatch ? 10 : -5;
    if (locRef) boost += locMatch ? 15 : -10;
    const match = Math.max(0, Math.min(100, Math.round(base + boost)));
    let aiSummary = src.aiSummary || '';
    if (locRef && locMatch && !/zona|\bubicaci[óo]n|\bdisponible/i.test(aiSummary)) {
      const humanLoc = ctx.location || '';
      const locationLine = translate
        ? translate('common.suppliers.aiSearch.aiSummary.locationAvailable', { location: humanLoc })
        : `Disponible en la zona de ${humanLoc}.`;
      aiSummary = (aiSummary ? aiSummary + ' ' : '') + locationLine;
    }
    return { ...src, match, aiSummary };
  });

  if (locRef) {
    const strictLoc = scored.filter((x) => {
      const lx = String(x.location || '').toLowerCase();
      return lx.includes(locRef) || locRef.includes(lx);
    });
    if (strictLoc.length > 0) {
      return strictLoc.sort((a, b) => (b.match || 0) - (a.match || 0));
    }
  }

  return scored.sort((a, b) => (b.match || 0) - (a.match || 0));
}

function includesWord(haystack, needle) {
  if (!haystack || !needle) return false;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return true;
  const hw = h.split(/[\s,/-]+/);
  const nw = n.split(/[\s,/-]+/);
  return hw.some((w) => nw.includes(w));
}
