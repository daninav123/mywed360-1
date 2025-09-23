import { useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import useActiveWeddingInfo from './useActiveWeddingInfo';
import { post as apiPost } from '../services/apiClient';

// Utils
const slugify = (value) =>
  !value
    ? ''
    : String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const guessServiceFromQuery = (query) => {
  if (!query) return 'Servicios para bodas';
  const words = query.toLowerCase().split(/[,;]+/)[0]?.trim();
  if (!words) return 'Servicios para bodas';
  if (words.includes('foto')) return 'Fotografia';
  if (words.includes('video')) return 'Video';
  if (words.includes('catering')) return 'Catering';
  if (words.includes('dj') || words.includes('musica')) return 'Musica';
  if (words.includes('flor')) return 'Flores';
  return query.trim();
};

const ensureMatchScore = (match, index) => {
  if (typeof match === 'number' && !Number.isNaN(match)) return Math.max(0, Math.min(100, Math.round(match)));
  return Math.max(60, 95 - index * 5);
};

const generateAISummary = (item, query) => {
  const highlights = [];
  const queryWords = query.toLowerCase().split(' ');
  if (item.tags?.some((tag) => queryWords.includes(tag.toLowerCase()))) highlights.push('Coincide con tus preferencias clave.');
  if (item.price) highlights.push(`Rango de precio estimado: ${item.price}.`);
  if (item.location) highlights.push(`Ubicado en ${item.location}.`);
  return highlights.join(' ');
};

const normalizeResult = (item, index, query, source) => {
  const name = (item?.name || item?.title || `Proveedor sugerido ${index + 1}`).trim();
  const service = (item?.service || item?.category || guessServiceFromQuery(query)).trim();
  const location = item?.location || item?.city || '';
  const priceRange = item?.priceRange || item?.price || '';
  const snippet = item?.snippet || item?.description || '';
  const link = item?.link || item?.url || item?.website || '';
  const match = ensureMatchScore(item?.match, index);
  const aiSummary = item?.aiSummary || '';
  const image = item?.image || '';
  const email = item?.email || '';
  const phone = item?.phone || '';
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const keywords = Array.isArray(item?.keywords) ? item.keywords : [];
  const baseId = slugify(item?.id || link || `${name}-${location}`);
  const id = baseId ? `${baseId}-${index}` : `ai-provider-${index}`;
  return { id, name, service, snippet, image, location, priceRange, price: priceRange, tags, keywords, match, aiSummary, link, email, phone, source, raw: item };
};

const generateDemoResults = (query) => {
  const demoDatabase = [
    { id: '1', name: 'Fotografia Naturaleza Viva', service: 'Fotografia', snippet: 'Estudio especializado en fotografia de bodas con estilo natural y documental. Capturamos los momentos mas emotivos y espontaneos.', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=500&q=60', location: 'Madrid', price: '1200 EUR - 2500 EUR', tags: ['natural', 'documental', 'exterior', 'luz natural'], keywords: ['fotografo', 'natural', 'documental', 'boda'] },
    { id: '2', name: 'Lente Azul Fotografia', service: 'Fotografia', snippet: 'Más de 10 años de experiencia en bodas en playa y espacios naturales. Paquetes personalizados para cada pareja.', image: 'https://images.unsplash.com/photo-1508435234994-67cfd7690508?auto=format&fit=crop&w=500&q=60', location: 'Barcelona', price: '1500 EUR - 3000 EUR', tags: ['playa', 'exterior', 'naturaleza'], keywords: ['fotografo', 'boda', 'playa', 'experiencia'] },
    { id: '3', name: 'Catering Delicious Moments', service: 'Catering', snippet: 'Catering con opciones vegetarianas, veganas y alergias. Especialistas en eventos de 50 a 200 personas.', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=500&q=60', location: 'Madrid', price: '70 EUR - 120 EUR por persona', tags: ['vegetariano', 'vegano', 'buffet'], keywords: ['catering', 'buffet', 'evento'] },
    { id: '4', name: 'DJ Sounds & Lights', service: 'Musica', snippet: 'DJ con equipo profesional de sonido e iluminacion. Amplia experiencia en bodas y eventos corporativos.', image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=500&q=60', location: 'Valencia', price: '800 EUR - 1500 EUR', tags: ['dj', 'musica', 'iluminacion'], keywords: ['dj', 'musica', 'evento'] },
    { id: '5', name: 'Flores del Jardin', service: 'Flores', snippet: 'Floristeria artesanal especializada en decoracion vintage y boho. Trabajamos con producto local de temporada.', image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=500&q=60', location: 'Sevilla', price: '500 EUR - 1500 EUR', tags: ['flores', 'decoracion', 'boho'], keywords: ['flores', 'decoracion', 'boda'] },
  ];
  return demoDatabase.map((item, index) => normalizeResult({ ...item, priceRange: item.price, match: ensureMatchScore(item.match, index), aiSummary: generateAISummary(item, query) }, index, query, 'ai-demo'));
};

export const useAISearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const { user } = useAuth();
  const { info: weddingDoc } = useActiveWeddingInfo();

  const searchProviders = useCallback(
    async (query, opts = {}) => {
      if (!query?.trim() || !user) return [];
      setLoading(true);
      setLastQuery(query);
      setError(null);
      setUsedFallback(false);

      // Contexto de boda para backend y fallback
      const profile = (weddingDoc && (weddingDoc.weddingInfo || weddingDoc)) || {};
      const location = profile.celebrationPlace || profile.location || profile.city || profile.ceremonyLocation || profile.receptionVenue || '';
      const budget = profile.budget || profile.estimatedBudget || profile.totalBudget || profile.presupuesto || '';
      const inferredService = (opts && opts.service) || guessServiceFromQuery(query);

      // Habilitar backend sólo si la variable de entorno lo indica
      const ENABLE_BACKEND_AI = (() => {
        try {
          const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};
          const v = env.VITE_ENABLE_AI_SUPPLIERS || env.VITE_AI_SUPPLIERS || '';
          return /^(1|true)$/i.test(String(v));
        } catch {
          return false;
        }
      })();

      try {
        if (ENABLE_BACKEND_AI) {
          const res = await apiPost('/api/ai-suppliers', { query, service: inferredService, budget, profile, location }, { auth: true, silent: true });
          if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
              const normalized = data
                .filter((item) => item && (item.title || item.name))
                .map((item, index) => normalizeResult({ ...item, name: item.name || item.title, service: item.service || inferredService, priceRange: item.priceRange, snippet: item.snippet }, index, query, 'ai-backend'));
              if (normalized.length) {
                const refined = refineResults(normalized, { service: inferredService, location });
                setResults(refined);
                setUsedFallback(false);
                setLoading(false);
                return refined;
              }
            }
          }
        }
      } catch (backendError) {
        console.warn('Fallo consultando ai-suppliers', backendError);
      }

      // Fallback local inmediato
      const demoResults = generateDemoResults(query);
      const refined = refineResults(demoResults, { service: inferredService, location });
      setResults(refined);
      setUsedFallback(true);
      setLoading(false);
      return refined;
    },
    [user, weddingDoc]
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

// Refinado: servicio estricto y ubicación estricta si hay matches; si no, blando por zona
function refineResults(list, ctx) {
  const serviceRef = String(ctx?.service || '').toLowerCase();
  const locRef = String(ctx?.location || '').toLowerCase();
  if (!Array.isArray(list) || (!serviceRef && !locRef)) return list || [];

  const byService = serviceRef
    ? (list || []).filter((it) => {
        const service = String(it?.service || '').toLowerCase();
        return includesWord(service, serviceRef) || includesWord(serviceRef, service);
      })
    : (list || []).slice();

  const scored = byService.map((it) => {
    const src = it || {};
    const service = String(src.service || '').toLowerCase();
    const location = String(src.location || '').toLowerCase();
    const base = typeof src.match === 'number' ? src.match : 60;
    const serviceMatch = serviceRef && service ? includesWord(service, serviceRef) || includesWord(serviceRef, service) : false;
    const locMatch = locRef && location ? location.includes(locRef) || locRef.includes(location) : false;
    let boost = 0;
    if (serviceRef) boost += serviceMatch ? 10 : -5;
    if (locRef) boost += locMatch ? 15 : -10;
    const match = Math.max(0, Math.min(100, Math.round(base + boost)));
    let aiSummary = src.aiSummary || '';
    if (locRef && locMatch && !/zona|\bubicaci[óo]n|\bdisponible/i.test(aiSummary)) {
      const humanLoc = ctx.location || '';
      aiSummary = (aiSummary ? aiSummary + ' ' : '') + `Disponible en la zona de ${humanLoc}.`;
    }
    return { ...src, match, aiSummary };
  });

  if (locRef) {
    const strictLoc = scored.filter((x) => {
      const lx = String(x.location || '').toLowerCase();
      return lx.includes(locRef) || locRef.includes(lx);
    });
    if (strictLoc.length > 0) return strictLoc.sort((a, b) => (b.match || 0) - (a.match || 0));
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

