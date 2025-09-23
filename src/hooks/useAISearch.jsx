import { useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { post as apiPost } from '../services/apiClient';

/**
 * Normaliza un valor a un slug seguro para IDs.
 */
const slugify = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
  if (typeof match === 'number' && !Number.isNaN(match)) {
    return Math.max(0, Math.min(100, Math.round(match)));
  }
  return Math.max(60, 95 - index * 5);
};

const generateAISummary = (item, query) => {
  const highlights = [];
  const queryWords = query.toLowerCase().split(' ');
  if (item.tags?.some((tag) => queryWords.includes(tag.toLowerCase()))) {
    highlights.push('Coincide con tus preferencias clave.');
  }
  if (item.price) {
    highlights.push(`Rango de precio estimado: ${item.price}.`);
  }
  if (item.location) {
    highlights.push(`Ubicado en ${item.location}.`);
  }
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
    source,
    raw: item,
  };
};

const generateDemoResults = (query) => {
  const queryLower = query.toLowerCase();

  const demoDatabase = [
    {
      id: '1',
      name: 'Fotografia Naturaleza Viva',
      service: 'Fotografia',
      snippet:
        'Estudio especializado en fotografia de bodas con estilo natural y documental. Capturamos los momentos mas emotivos y espontaneos.',
      image:
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=500&q=60',
      location: 'Madrid',
      price: '1200 EUR - 2500 EUR',
      tags: ['natural', 'documental', 'exterior', 'luz natural'],
      keywords: ['fotografo', 'natural', 'documental', 'boda'],
    },
    {
      id: '2',
      name: 'Lente Azul Fotografia',
      service: 'Fotografia',
      snippet:
        'Más de 10 anos de experiencia en bodas en playa y espacios naturales. Paquetes personalizados para cada pareja.',
      image:
        'https://images.unsplash.com/photo-1508435234994-67cfd7690508?auto=format&fit=crop&w=500&q=60',
      location: 'Barcelona',
      price: '1500 EUR - 3000 EUR',
      tags: ['playa', 'exterior', 'naturaleza'],
      keywords: ['fotografo', 'boda', 'playa', 'experiencia'],
    },
    {
      id: '3',
      name: 'Catering Delicious Moments',
      service: 'Catering',
      snippet:
        'Catering con opciones vegetarianas, veganas y alergias. Especialistas en eventos de 50 a 200 personas.',
      image:
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=500&q=60',
      location: 'Madrid',
      price: '70 EUR - 120 EUR por persona',
      tags: ['vegetariano', 'vegano', 'buffet'],
      keywords: ['catering', 'buffet', 'evento'],
    },
    {
      id: '4',
      name: 'DJ Sounds & Lights',
      service: 'Musica',
      snippet:
        'DJ con equipo profesional de sonido e iluminacion. Amplia experiencia en bodas y eventos corporativos.',
      image:
        'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=500&q=60',
      location: 'Valencia',
      price: '800 EUR - 1500 EUR',
      tags: ['dj', 'musica', 'iluminacion'],
      keywords: ['dj', 'musica', 'evento'],
    },
    {
      id: '5',
      name: 'Flores del Jardin',
      service: 'Flores',
      snippet:
        'Floristeria artesanal especializada en decoracion vintage y boho. Trabajamos con producto local de temporada.',
      image:
        'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=500&q=60',
      location: 'Sevilla',
      price: '500 EUR - 1500 EUR',
      tags: ['flores', 'decoracion', 'boho'],
      keywords: ['flores', 'decoracion', 'boda'],
    },
  ];

  const resultWithScores = demoDatabase.map((item) => {
    let score = 0;
    const fields = [
      { name: 'name', weight: 3 },
      { name: 'service', weight: 5 },
      { name: 'snippet', weight: 2 },
      { name: 'location', weight: 2 },
      { name: 'tags', weight: 4, isArray: true },
      { name: 'keywords', weight: 4, isArray: true },
    ];

    fields.forEach((field) => {
      if (field.isArray) {
        const matches = (item[field.name] || []).filter((tag) => {
          const tagValue = tag.toLowerCase();
          return queryLower.includes(tagValue) || tagValue.includes(queryLower);
        }).length;
        score += matches * field.weight;
      } else if (item[field.name]) {
        const fieldValue = item[field.name].toLowerCase();
        if (fieldValue.includes(queryLower) || queryLower.includes(fieldValue)) {
          score += field.weight;
        }
        queryLower
          .split(' ')
          .filter((word) => word.length > 3)
          .forEach((word) => {
            if (fieldValue.includes(word)) {
              score += field.weight * 0.5;
            }
          });
      }
    });

    return {
      ...item,
      match: Math.min(Math.round(score * 10), 95),
      aiSummary: generateAISummary(item, query),
    };
  });

  return resultWithScores.map((item, index) =>
    normalizeResult(
      {
        ...item,
        priceRange: item.price,
      },
      index,
      query,
      'ai-demo'
    )
  );
};

export const useAISearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const { user } = useAuth();

  const searchProviders = useCallback(
    async (query) => {
      if (!query?.trim() || !user) {
        return [];
      }

      setLoading(true);
      setLastQuery(query);
      setError(null);

      try {
        try {
          const res = await apiPost('/api/ai-suppliers', { query }, { auth: true });
          if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
              const normalized = data
                .filter((item) => item && (item.title || item.name))
                .map((item, index) =>
                  normalizeResult(
                    {
                      ...item,
                      name: item.name || item.title,
                      service: item.service || guessServiceFromQuery(query),
                      priceRange: item.priceRange,
                      snippet: item.snippet,
                    },
                    index,
                    query,
                    'ai-backend'
                  )
                );
              if (normalized.length) {
                setResults(normalized);
                setLoading(false);
                return normalized;
              }
            }
          }
        } catch (backendError) {
          console.warn('Fallo consultando ai-suppliers', backendError);
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
        const demoResults = generateDemoResults(query);
        setResults(demoResults);
        setLoading(false);
        return demoResults;
      } catch (err) {
        console.error('Error en la busqueda con IA:', err);
        setError('No se pudo completar la busqueda. Intentalo mas tarde.');
        setLoading(false);
        return [];
      }
    },
    [user]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setLastQuery('');
  }, []);

  return {
    results,
    loading,
    error,
    lastQuery,
    searchProviders,
    clearResults,
  };
};

export default useAISearch;
