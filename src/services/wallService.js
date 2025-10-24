// Servicio para consumir el muro de inspiración backend
// POST /api/instagram/wall { page, query }
// Devuelve array de posts con html embebido y metadatos

import axios from 'axios';

// Imágenes de demo para fallback en desarrollo
const DEMO_IMAGES = [
  {
    id: 'demo_1',
    url: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?auto=format&fit=crop&w=800&q=60',
    thumb:
      'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?auto=format&fit=crop&w=400&q=60',
    tags: ['decoración', 'flores'],
    source: 'demo',
  },
  {
    id: 'demo_2',
    url: 'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=800&q=60',
    thumb:
      'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=400&q=60',
    tags: ['ceremonia'],
    source: 'demo',
  },
  {
    id: 'demo_3',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764b1c?auto=format&fit=crop&w=800&q=60',
    thumb:
      'https://images.unsplash.com/photo-1502920917128-1aa500764b1c?auto=format&fit=crop&w=400&q=60',
    tags: ['flores', 'vestido'],
    source: 'demo',
  },
];

/**
 * Obtiene un lote paginado del muro de inspiración.
 * @param {number} page
 * @param {string} query
 * @returns {Promise<Array<{id:string, html:string, score:number}>>}
 */
const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'https://maloveapp-backend.onrender.com';

export async function fetchWall(page = 1, query = 'wedding') {
  const proxify = (url) => {
    if (!url) return url;
    // Si la URL es de dominios que bloquean hotlinking (Instagram, Facebook CDN), siempre proxificamos
    const NEED_PROXY = /(instagram|fbcdn|pinimg|pinterest|pexels)\./i.test(url);
    if (NEED_PROXY) {
      return `${API_BASE}/api/image-proxy?u=${encodeURIComponent(url)}`;
    }
    // En producción (Render) proxy para todas las imágenes externas por consistencia
    if (!import.meta.env.DEV) {
      return `${API_BASE}/api/image-proxy?u=${encodeURIComponent(url)}`;
    }
    // En desarrollo, devolvemos la URL directa si no requiere proxy
    return url;
  };

  const KEYWORDS = {
    ceremonia: /ceremon(y|ia)|altar|vows/i,
    decoración: /decor|centerpiece|table|arco|floral/i,
    cóctel: /cocktail|drinks|bar/i,
    banquete: /reception|banquet|dinner|mesa/i,
    disco: /dance|disco|party|baile/i,
    flores: /flower|flor/i,
    vestido: /dress|vestido/i,
    pastel: /cake|pastel/i,
    fotografía: /photo|fotograf/i,
  };

  const guessTags = (text) => {
    const found = [];
    for (const [tag, re] of Object.entries(KEYWORDS)) {
      if (re.test(text)) found.push(tag);
    }
    return found;
  };

  const normalize = (p) => {
    // Intentar obtener una URL de imagen válida
    const original = p.media_url || p.url || p.image || p.thumb;
    if (!original) return null; // descartar post sin imagen

    const obj = { ...p };
    // original ya calculado más arriba
    obj.url = proxify(original);
    obj.original_url = original;
    obj.thumb = proxify(p.thumb || original);
    obj.tags = p.tags || p.categories;
    if (!obj.tags || obj.tags.length === 0) {
      const txt = (p.description || p.alt || p.permalink || '').toString();
      const inferred = guessTags(txt);
      if (inferred.length) obj.tags = inferred;
    }

    return obj;
  };

  // Circuit breaker mejorado: evitar spam de requests fallidos
  const lastFailureKey = `wallService_lastFailure_${page}_${query}`;
  const lastRequestKey = `wallService_lastRequest_${page}_${query}`;
  const lastFailure = localStorage.getItem(lastFailureKey);
  const lastRequest = localStorage.getItem(lastRequestKey);
  const now = Date.now();

  // Si estamos en desarrollo, no aplicamos circuit-breaker; siempre reintentamos.
  if (!import.meta.env.PROD) {
    localStorage.removeItem(lastFailureKey);
  } else {
    // Si falló hace menos de 30 minutos, usar datos demo directamente
    if (lastFailure && now - parseInt(lastFailure) < 30 * 60 * 1000) {
      console.log('wallService: usando datos demo (circuit breaker activo)');
      return DEMO_IMAGES;
    }
  }

  // Permitir solicitudes duplicadas; React 18 Strict Mode monta/desmonta componentes causando dobles peticiones.
  // Si el backend está caído activaremos igualmente el circuit-breaker mediante lastFailureKey.

  // Marcar timestamp del request
  localStorage.setItem(lastRequestKey, now.toString());

  try {
    let resp;
    try {
      resp = await axios.post(`${API_BASE}/api/instagram-wall`, { page, query });
    } catch (e) {
      // Compatibilidad con rutas antiguas
      if (e.response?.status === 404) {
        resp = await axios.post(`${API_BASE}/api/instagram/wall`, { page, query });
      } else {
        throw e;
      }
    }
    let data = (resp && resp.data ? resp.data : []).map(normalize).filter(Boolean);
    // Permitir imágenes de Pinterest y dominios pinimg siempre que se hayan proxificado correctamente.
    // Solo descartamos si la URL proxificada aún apunta al dominio bloqueado (lo que indicaría un fallo en el proxy).
    data = data.filter((p) => {
      const origBlocked = /(pinimg|pinterest)\./i.test(p.original_url || '');
      const proxiedOk = p.url && p.url.startsWith(`${API_BASE}/api/image-proxy`);
      // Si es dominio bloqueado pero está proxificado, se acepta.
      if (origBlocked && proxiedOk) return true;
      // Si no es dominio bloqueado, se acepta.
      if (!origBlocked) return true;
      // Si es dominio bloqueado y no está proxificado, se descarta.
      return false;
    });
    // Limpiar flag de fallo si la request fue exitosa
    localStorage.removeItem(lastFailureKey);
    return data.length ? data : DEMO_IMAGES;
  } catch (err) {
    // Marcar timestamp del fallo para activar circuit breaker
    localStorage.setItem(lastFailureKey, now.toString());
    console.warn('wallService: endpoint no disponible, usando datos demo');
    return DEMO_IMAGES;
  }
}
