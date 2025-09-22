// blogService.js - noticias de bodas
import axios from 'axios';
import { translateText } from './translationService.js';
import { getBackendBase } from '@/utils/backendBase.js';

// Evita spam de peticiones al backend si est cado/no iniciado
let BACKEND_BACKOFF_UNTIL = 0;
const backendAvailable = () => Date.now() > BACKEND_BACKOFF_UNTIL;
const backoffBackend = (ms = 60_000) => { BACKEND_BACKOFF_UNTIL = Date.now() + ms; };

// Preferimos el agregador backend (RSS) para variedad y fiabilidad.
// Si se quiere forzar NewsAPI, definir VITE_NEWSAPI_KEY en build.
const API_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';

function normalizeLang(lang) {
  if (!lang) return 'es';
  const s = String(lang).toLowerCase();
  const m = s.match(/^[a-z]{2}/);
  return m ? m[0] : 'es';
}

async function fetchFromBackend({ page, pageSize, language }) {
  const envBase = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_BASE)) || '';
  const derivedBase = getBackendBase();
  // Importante: no usar filter(Boolean) porque elimina '' y perdemos el fallback
  // a la ruta relativa '/api/wedding-news' gestionada por el proxy de Vite.
  const rawCandidates = [
    envBase ? envBase.replace(/\/$/, '') : undefined,
    derivedBase ? derivedBase.replace(/\/$/, '') : undefined,
    'https://mywed360-backend.onrender.com',
    '' // como último recurso: proxy de Vite o mismo origen
  ];
  let candidates = Array.from(new Set(rawCandidates.filter(v => v !== undefined && v !== null)));
  // Prioritize Render backend to avoid slow/failing local attempts first
  try {
    const RENDER_BASE = 'https://mywed360-backend.onrender.com';
    if (candidates.includes(RENDER_BASE)) {
      candidates = [RENDER_BASE, ...candidates.filter((b) => b !== RENDER_BASE)];
    }
  } catch {}

  let sawError = false;
  for (const base of candidates) {
    try {
      const url = base ? `${base}/api/wedding-news` : '/api/wedding-news';
      // Adaptive timeout: short for local/same-origin, longer for Render aggregator
      const isProbablyLocal = (b) => {
        const s = String(b || '');
        return s === '' || /localhost|127\.0\.0\.1|:4004/.test(s);
      };
      const timeoutMs = isProbablyLocal(base) ? 5000 : 35000;
      const resp = await axios.get(url, {
        params: { page, pageSize, lang: language },
        timeout: timeoutMs,
        validateStatus: () => true,
      });
      if (resp.status < 400 && Array.isArray(resp.data)) {
        if (resp.data.length > 0) return resp.data;
        // Si el backend de este candidato devuelve array vacío, probar el siguiente candidato
        continue;
      }
      // Estado no exitoso: marcar como error para posible backoff
      sawError = true;
    } catch {
      sawError = true;
    }
  }
  // Si hubo errores en candidatos, devolver null para diferenciar de "vacío"
  return sawError ? null : [];
}

const stripDiacritics = (text = '') =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeForMatch = (text = '') => stripDiacritics(text).toLowerCase();

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
  // Ruta principal: backend RSS aggregator
  const rssData = await fetchFromBackend({ page, pageSize, language: lang });
  // Si hubo errores de red/servidor, aplicar backoff breve
  if (rssData === null) { return []; }
  // Si el backend respondió OK pero sin datos, no aplicar backoff
  if (!Array.isArray(rssData) || !rssData.length) { return []; }

  let posts = rssData;
  if (lang && lang !== 'en') {
    for (const p of posts) {
      p.title = await translateText(p.title, lang, '');
      p.description = await translateText(p.description, lang, '');
    }
  }
  return posts;
  // NewsAPI (opcional) — no usado por defecto
  // Mantener el codigo para compatibilidad si en el futuro se habilita con API key.
  /*
  if (page > 1) {
    if (!backendAvailable()) return [];
    const arr = await fetchFromBackend({ page, pageSize, language: lang });
    if (!Array.isArray(arr) || !arr.length) { backoffBackend(); return []; }
    return arr;
  }
  const endpointOpts = {
    params: {
      q: 'wedding OR boda',
      language: lang,
      sortBy: 'publishedAt',
      pageSize,
      page,
    },
    headers: { 'X-Api-Key': API_KEY },
    timeout: 8000,
  };

  let data;
  try {
    const resp = await axios.get('https://newsapi.org/v2/everything', endpointOpts);
    data = resp.data;
  } catch (err) {
    if (err.response && err.response.status === 426) {
      console.warn('NewsAPI 426 Upgrade Required -> plan gratuito limitado a primera pagina.');
      return [];
    }
    throw err;
  }

  const articles = Array.isArray(data?.articles) ? data.articles : [];

  const entries = articles.map((article, idx) => {
    const rawText = [article.title || '', article.description || '', article.content || ''].join(' ');
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
        hasWeddingContext && (designHits > 0 || planningHits > 0) && !isHardNegative && !(isGossip && designHits === 0),
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

  let posts = pickPosts((entry) => entry.passesStrict, (entry) => entry.valueScore);

  if (!posts.length) {
    posts = pickPosts(
      (entry) => entry.passesLoose,
      (entry) => entry.valueScore || entry.designHits + entry.planningHits,
    );
  }

  if (!posts.length) {
    posts = pickPosts((entry) => entry.passesMinimal, (entry) => entry.designHits + entry.planningHits);
  }

  if (!posts.length) {
    posts = entries
      .filter((entry) => entry.hasWeddingContext && !entry.isHardNegative && !entry.isGossip)
      .slice(0, pageSize)
      .map(toPost);
  }

  if (lang && lang !== 'en') {
    for (const p of posts) {
      p.title = await translateText(p.title, lang, '');
      p.description = await translateText(p.description, lang, '');
    }
  }

  return posts;
  */
}
// Fin de archivo
