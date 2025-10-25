// blogService.js - noticias de bodas

import i18n from '../i18n';
import { getBackendBase } from '@/utils/backendBase.js';
import { translateText } from './translationService.js';

// Evita spam de peticiones al backend si está caído/no iniciado (reservado para uso futuro)
let _BACKEND_BACKOFF_UNTIL = 0;
const _backendAvailable = () => Date.now() > _BACKEND_BACKOFF_UNTIL;
const _backoffBackend = (ms = 60_000) => {
  _BACKEND_BACKOFF_UNTIL = Date.now() + ms;
};

const _candidateBackoff = new Map();
const DEFAULT_CANDIDATE_BACKOFF = 10 * 60_000;

const candidateKey = (base) => (base === undefined || base === null || base === '' ? '__proxy__' : String(base));
const candidateAvailable = (base) => Date.now() > (_candidateBackoff.get(candidateKey(base)) || 0);
const backoffCandidate = (base, ms = DEFAULT_CANDIDATE_BACKOFF) => {
  _candidateBackoff.set(candidateKey(base), Date.now() + ms);
};
const clearCandidateBackoff = (base) => {
  _candidateBackoff.delete(candidateKey(base));
};

// Preferimos el agregador backend (RSS) para variedad y fiabilidad.
// Si se quiere forzar NewsAPI, definir VITE_NEWSAPI_KEY en build.
const API_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';
const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const DISABLE_RENDER_IN_DEV = ['1', 'true', 'yes', 'on'].includes(
  String(ENV.VITE_BLOG_DISABLE_RENDER_DEV || '').trim().toLowerCase()
);

function normalizeLang(lang) {
  if (!lang) return 'es';
  const s = String(lang).toLowerCase();
  const m = s.match(/^[a-z]{2}/);
  return m ? m[0] : 'es';
}

async function fetchFromBackend({ page, pageSize, language, skipLocalCandidates = false }) {
  const envBase =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_BASE)) ||
    '';
  const derivedBase = getBackendBase();
  // Importante: no usar filter(Boolean) porque elimina '' y perdemos el fallback
  // a la ruta relativa '/api/wedding-news' gestionada por el proxy de Vite.
  const normalizedEnvBase = envBase ? envBase.replace(/\/$/, '') : undefined;
  const normalizedDerivedBase = derivedBase ? derivedBase.replace(/\/$/, '') : undefined;
  const rawCandidates = [
    normalizedEnvBase,
    normalizedDerivedBase,
    'http://localhost:4004',
    'i18n.t('common.proxy_vite_mismo_origen_como_penultimo')https://maloveapp-backend.onrender.com',
  ];
  let candidates = Array.from(new Set(rawCandidates.filter((v) => v !== undefined && v !== null)));
  if (skipLocalCandidates) {
    console.info('[blogService] Local backend in backoff, saltando candidatos locales');
    candidates = candidates.filter(
      (candidate) =>
        candidate &&
        !/^https?:\/\/localhost(?::4004)?$/i.test(candidate) &&
        candidate !== 'i18n.t('common.desarrollo_podemos_desactivar_render_con_flag')i18n.t('common.produccion_priorizamos_render_por_fiabilidad_desarrollo')https://maloveapp-backend.onrender.com';
      if (candidates.includes(RENDER_BASE)) {
        candidates = [RENDER_BASE, ...candidates.filter((b) => b !== RENDER_BASE)];
      }
    } catch {}
  }

  let sawError = false;
  // Carga perezosa de axios para reducir bundle inicial
  const axios = (await import('axios')).default;
  for (const base of candidates) {
    if (!candidateAvailable(base)) {
      console.info('[blogService] candidato wedding-news en backoff', { base });
      continue;
    }
    try {
      const url = base ? `${base}/api/wedding-news` : '/api/wedding-news';
      // Adaptive timeout: short for local/same-origin, longer for Render aggregator
      const isProbablyLocal = (b) => {
        const s = String(b || '');
        return s === '' || /localhost|127\.0\.0\.1|:4004/.test(s);
      };
      const timeoutMs = isProbablyLocal(base) ? 20000 : 30000;
      const resp = await axios.get(url, {
        params: { page, pageSize, lang: language },
        timeout: timeoutMs,
        validateStatus: () => true,
      });
      console.info('[blogService] candidato wedding-news', {
        base,
        status: resp.status,
        isArray: Array.isArray(resp.data),
        length: Array.isArray(resp.data) ? resp.data.length : undefined,
      });
      if (resp.status < 400 && Array.isArray(resp.data)) {
        clearCandidateBackoff(base);
        if (resp.data.length > 0) return resp.data;
        // Si el backend de este candidato devuelve array vacío, probar el siguiente candidato
        continue;
      }
      // Estado no exitoso: marcar como error para posible backoff
      sawError = true;
      backoffCandidate(base);
    } catch (error) {
      console.warn('[blogService] error al consultar wedding-news', { base, message: error?.message });
      sawError = true;
      backoffCandidate(base, error?.code === 'ECONNABORTED' ? 2 * 60_000 : DEFAULT_CANDIDATE_BACKOFF);
    }
  }
  // Si hubo errores en candidatos, devolver null para diferenciar de "vacío"
  return sawError ? null : [];
}

// Fallback: NewsAPI.org cuando hay API_KEY y el agregador devuelve vacD
async function fetchFromNewsApi(page, pageSize, lang) {
  // Carga perezosa de axios para reducir bundle inicial
  const axios = (await import('axios')).default;
  const endpointOpts = {
    params: {
      q: 'wedding OR boda',
      language: lang,
      sortBy: 'publishedAt',
      pageSize,
      page,
    },
    headers: { 'X-Api-Key': API_KEY },
    timeout: 10000,
    validateStatus: () => true,
  };

  const resp = await axios.get('https://newsapi.org/v2/everything', endpointOpts);
  if (resp.status === 426) {
    console.warn('NewsAPI 426 Upgrade Required -> plan gratuito limitado a primera pagina.');
    return [];
  }
  if (resp.status >= 400) {
    throw new Error(`NewsAPI error ${resp.status}`);
  }
  const data = resp.data || {};
  const articles = Array.isArray(data.articles) ? data.articles : [];

  const entries = articles.map((article, idx) => {
    const rawText = [article.title || '', article.description || '', article.content || ''].join(
      ' '
    );
    const normalizedText = normalizeForMatch(rawText);
    const hasWeddingContext = hasAny(normalizedText, WEDDING_PATTERNS);
    const designHits = scoreMatches(normalizedText, DESIGN_PATTERNS);
    const planningHits = scoreMatches(normalizedText, PLANNING_PATTERNS);
    const valueScore = designHits * 3 + planningHits;
    const isHardNegative = hasAny(normalizedText, HARD_NEGATIVE_PATTERNS);
    const isGossip = hasAny(normalizedText, GOSSIP_PATTERNS);

    return {
      article,
      idx,
      designHits,
      planningHits,
      valueScore,
      hasWeddingContext,
      isHardNegative,
      isGossip,
      passesStrict:
        hasWeddingContext &&
        (designHits > 0 || planningHits > 0) &&
        !isHardNegative &&
        !(isGossip && designHits === 0),
      passesLoose:
        hasWeddingContext && !isHardNegative && (!isGossip || designHits > 0 || planningHits > 0),
      passesMinimal: hasWeddingContext && !isHardNegative && !isGossip,
    };
  });

  const toPost = ({ article, idx }) => ({
    id: [String(page), String(idx), article.url].join('_'),
    title: article.title,
    description: article.description,
    url: article.url,
    image: article.urlToImage,
    source: article.source?.name,
    published: article.publishedAt,
  });

  const pickPosts = (filterFn, scoreFn) =>
    entries
      .filter(filterFn)
      .sort((a, b) => scoreFn(b) - scoreFn(a) || a.idx - b.idx)
      .map(toPost);

  let posts = pickPosts(
    (entry) => entry.passesStrict,
    (entry) => entry.valueScore
  );
  if (!posts.length) {
    posts = pickPosts(
      (entry) => entry.passesLoose,
      (entry) => entry.valueScore || entry.designHits + entry.planningHits
    );
  }
  if (!posts.length) {
    posts = pickPosts(
      (entry) => entry.passesMinimal,
      (entry) => entry.designHits + entry.planningHits
    );
  }
  if (!posts.length) {
    posts = entries
      .filter((entry) => entry.hasWeddingContext && !entry.isHardNegative && !entry.isGossip)
      .slice(0, pageSize)
      .map(toPost);
  }

  // Traducir sDlo si se solicita un idioma distinto a inglDs
  if (lang && lang !== 'en') {
    for (const p of posts) {
      p.title = await translateText(p.title, lang, '');
      p.description = await translateText(p.description, lang, '');
    }
  }
  return posts;
}

const stripDiacritics = (text = '') => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeForMatch = (text = '') => stripDiacritics(text).toLowerCase();

const cleanPlainText = (value = '') => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  const withoutTags = stringValue.replace(/<[^>]+>/g, ' ');
  return withoutTags.replace(/\s+/g, ' ').trim();
};

const ensureAbsoluteUrl = (value, baseUrl) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  try {
    return new URL(trimmed).toString();
  } catch {}
  if (baseUrl) {
    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {}
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
};

function normalizeBlogPost(raw) {
  const fallback = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Untitled',
    description: '',
    url: '',
    image: null,
    source: '',
    published: new Date().toISOString(),
  };

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const entry = { ...raw };
  if (entry.article && typeof entry.article === 'object') {
    for (const [key, value] of Object.entries(entry.article)) {
      if (entry[key] === undefined || entry[key] === null) {
        entry[key] = value;
      }
    }
  }

  const url = (() => {
    const candidates = [entry.url, entry.link, entry.guid];
    for (const candidate of candidates) {
      const resolved = ensureAbsoluteUrl(candidate);
      if (resolved) return resolved;
    }
    return '';
  })();

  const image = (() => {
    const candidates = [
      entry.image,
      entry.imageUrl,
      entry.imageURL,
      entry.thumbnail,
      entry.media?.thumbnail?.url,
      entry.media?.content?.url,
      entry.enclosure?.url,
      entry.urlToImage,
    ];
    for (const candidate of candidates) {
      const resolved = ensureAbsoluteUrl(candidate, url);
      if (resolved) return resolved;
    }
    return null;
  })();

  const published = (() => {
    const dateCandidates = [
      entry.published,
      entry.publishedAt,
      entry.isoDate,
      entry.pubDate,
      entry.date,
      entry.updated,
      entry.created_at,
    ];
    for (const candidate of dateCandidates) {
      if (!candidate) continue;
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return fallback.published;
  })();

  const title = cleanPlainText(entry.title || entry.name || entry.headline || fallback.title) || fallback.title;
  const description = cleanPlainText(
    entry.description ||
      entry.summary ||
      entry.summaryText ||
      entry.contentSnippet ||
      entry.excerpt ||
      entry.content ||
      ''
  );

  const source = (() => {
    const rawSource =
      (typeof entry.source === 'object' && entry.source
        ? entry.source.name || entry.source.title
        : entry.source) ||
      entry.feedSource ||
      entry.sourceName ||
      entry.domain ||
      entry.site ||
      '';
    const cleaned = cleanPlainText(rawSource);
    if (cleaned) return cleaned;
    if (url) {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {}
    }
    return '';
  })();

  let id =
    entry.id ||
    entry.guid ||
    entry.url ||
    entry.link ||
    (source ? `${source}_${published}` : '') ||
    '';
  if (!id) {
    id = fallback.id;
  } else {
    id = String(id);
  }

  return {
    id,
    title,
    description,
    url,
    image,
    source,
    published,
  };
}

const buildWordPattern = (keyword) => {
  const normalized = normalizeForMatch(keyword);
  const escaped = normalized.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp('\\b' + escaped + '\\b', 'i');
};

const WEDDING_PATTERNS = [
  'boda',
  'bodas',
  'wedding',
  'weddings',
  'bridal',
  'novia',
  'novio',
  'novios',
  'matrimonio',
  'enlace nupcial',
  'ceremonia de boda',
  'banquete de boda',
  'recepcion de boda',
  'fiesta de boda',
  'celebracion de boda',
  'ceremonia nupcial',
  'votos matrimoniales',
  'ceremonia civil',
].map(buildWordPattern);

const DESIGN_PATTERNS = [
  'tendencia',
  'tendencias',
  'trend',
  'trends',
  'decoracion',
  'decor',
  'diseno',
  'design',
  'inspiracion',
  'styling',
  'tematica',
  'ambientacion',
  'iluminacion',
  'paleta de colores',
  'color palette',
  'arreglo floral',
  'arreglos florales',
  'floral',
  'flores',
  'centro de mesa',
  'centros de mesa',
  'mesa de postres',
  'backdrop',
  'montaje',
  'escenografia',
  'look nupcial',
  'coleccion nupcial',
  'bridal collection',
  'vestido de novia',
  'vestidos de novia',
  'wedding dress',
  'wedding styling',
  'editorial de bodas',
  'tablescape',
  'tablescapes',
  'signature drink',
  'decoracion floral',
  'escenografia floral',
  'arquitectura floral',
].map(buildWordPattern);

const PLANNING_PATTERNS = [
  'wedding planner',
  'planner',
  'planificador de bodas',
  'organizador de bodas',
  'coordinador de bodas',
  'consejo',
  'consejos',
  'guia',
  'guias',
  'idea',
  'ideas',
  'tips',
  'checklist',
  'proveedor',
  'proveedores',
  'venue',
  'lugares de boda',
  'lugar de celebracion',
  'destino',
  'destination wedding',
  'presupuesto',
  'budget',
  'cronograma',
  'cronologia',
  'timeline',
  'agenda de boda',
  'plan de boda',
  'experiencia de invitados',
  'coctel de bienvenida',
  'recepcion',
  'banquete',
  'ceremonia',
].map(buildWordPattern);

const HARD_NEGATIVE_PATTERNS = [
  'crash',
  'crashes',
  'shooting',
  'murder',
  'killed',
  'kill',
  'war',
  'tragedy',
  'accident',
  'injured',
  'dead',
  'death',
  'explosion',
  'fuego',
  'incendio',
  'terremoto',
  'earthquake',
  'huracan',
  'hurricane',
  'flood',
  'flooding',
  'storm',
  'tormenta',
  'tsunami',
  'massacre',
].map(buildWordPattern);

const GOSSIP_PATTERNS = [
  'cotilleo',
  'gossip',
  'rumor',
  'rumores',
  'drama',
  'escandalo',
  'escandalos',
  'paparazzi',
  'breakup',
  'ruptura',
  'divorcio',
  'separacion',
  'demanda',
  'lawsuit',
  'arresto',
  'detencion',
  'police',
  'policia',
  'carcel',
  'sentencia',
  'custodia',
  'rumoured',
  'rumored',
  'romance',
].map(buildWordPattern);

const hasAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));
const scoreMatches = (text, patterns) =>
  patterns.reduce((score, pattern) => (pattern.test(text) ? score + 1 : score), 0);

/**
 * @typedef {Object} BlogPost
 * @property {string} id          Identificador unico
 * @property {string} title       Titulo
 * @property {string} description Descripcion
 * @property {string} url         Enlace original
 * @property {string|null} image  URL de la imagen
 * @property {string} source      Fuente
 * @property {string} published   ISODate de publicacion
 */

/**
 * Obtiene titulares de bodas.
 * Con API_KEY -> NewsAPI.org; sin API_KEY -> proxy RSS backend.
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {string} [language='es'] ISO 639-1
 * @returns {Promise<BlogPost[]>}
 */
export async function fetchWeddingNews(page = 1, pageSize = 10, language = 'es') {
  const lang = normalizeLang(language);
  const skipLocal = !_backendAvailable();
  const rssData = await fetchFromBackend({
    page,
    pageSize,
    language: lang,
    skipLocalCandidates: skipLocal,
  });

  if (rssData === null) {
    console.warn('[blogService] Backend wedding-news unavailable');
    if (_backendAvailable()) {
      _backoffBackend(2 * 60_000);
    }
    if (!API_KEY) {
      return [];
    }
  }

  if (Array.isArray(rssData) && rssData.length > 0) {
    return maybeTranslatePosts(rssData.map((post) => normalizeBlogPost(post, lang)), lang);
  }

  if (!API_KEY) {
    return [];
  }

  try {
    const news = await fetchFromNewsApi(page, pageSize, lang);
    if (!news.length) {
      return [];
    }
    return maybeTranslatePosts(news.map((entry) => normalizeBlogPost(entry, lang)), lang);
  } catch (error) {
    console.warn('[blogService] NewsAPI fallback failed', error);
    return [];
  }
}

async function maybeTranslatePosts(posts, lang) {
  if (!lang || lang === 'en') {
    return posts;
  }

  const translated = [];
  for (const post of posts) {
    const copy = { ...post };
    try {
      copy.title = await translateText(copy.title, lang, '');
      copy.description = await translateText(copy.description, lang, '');
    } catch (error) {
      console.warn('[blogService] translateText failed', error);
    }
    translated.push(copy);
  }
  return translated;
}

// Fin de archivo


