// src/data/blogFallbackPosts.js
// Lote curado de artículos para usar como fallback cuando no hay backend disponible.

const FALLBACK_POSTS = [
  {
    id: 'fallback-es-atelier-vintage',
    url: 'https://www.marthastewart.com/wedding-vintage-inspired-reception',
    image:
      'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=1280&q=80',
    source: 'Martha Stewart Weddings',
    published: '2024-04-12T09:00:00.000Z',
    title: {
      es: 'Un banquete inspirado en la elegancia vintage',
      en: 'A Vintage-Inspired Wedding Reception to Remember',
    },
    description: {
      es: 'Ideas de decoración, iluminación y detalles de época para crear una atmósfera cálida y sofisticada.',
      en: 'Décor, lighting, and heirloom details that create a warm, sophisticated celebration.',
    },
  },
  {
    id: 'fallback-es-destination-tuscany',
    url: 'https://www.brides.com/tuscany-destination-wedding-ideas-7970213',
    image:
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1280&q=80',
    source: 'Brides',
    published: '2024-05-03T14:30:00.000Z',
    title: {
      es: 'Una boda destino en la Toscana llena de detalles artesanales',
      en: 'Handcrafted Details for a Dreamy Tuscan Destination Wedding',
    },
    description: {
      es: 'Consejos para integrar gastronomía local, vino y paisajes italianos en una boda destino inolvidable.',
      en: 'Tips to weave local cuisine, wine, and scenery into an unforgettable Italian celebration.',
    },
  },
  {
    id: 'fallback-es-modern-minimal',
    url: 'https://www.instagram.com/p/C7Z3iLHN3s_/',
    image:
      'https://images.unsplash.com/photo-1511288597083-5023dc0f7c9a?auto=format&fit=crop&w=1280&q=80',
    source: 'Maison Fête',
    published: '2024-06-08T18:05:00.000Z',
    title: {
      es: 'Minimalismo moderno con toques escultóricos',
      en: 'Modern Minimalism With Sculptural Statements',
    },
    description: {
      es: 'Cómo combinar líneas limpias, flores en bloque de color y mobiliario escultórico para un look actual.',
      en: 'Combining clean lines, color-block florals, and sculptural rentals for a striking modern aesthetic.',
    },
  },
  {
    id: 'fallback-es-lakeside-ceremony',
    url: 'https://greenweddingshoes.com/lakeside-wedding-ideas/',
    image:
      'https://images.unsplash.com/photo-1520031606212-1c1f1cfd6d21?auto=format&fit=crop&w=1280&q=80',
    source: 'Green Wedding Shoes',
    published: '2024-03-22T16:15:00.000Z',
    title: {
      es: 'Ceremonia junto al lago con inspiración orgánica',
      en: 'Organic-Inspired Ceremony Beside the Lake',
    },
    description: {
      es: 'Paletas de color suaves, texturas naturales y detalles orgánicos para bodas al aire libre.',
      en: 'Soft palettes, natural textures, and organic accents tailored to outdoor celebrations.',
    },
  },
  {
    id: 'fallback-es-editorial-garden',
    url: 'https://www.rockmywedding.co.uk/garden-wedding-editorial',
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1280&q=80',
    source: 'Rock My Wedding',
    published: '2024-02-17T11:45:00.000Z',
    title: {
      es: 'Editorial de jardín con color y texturas inesperadas',
      en: 'Garden Editorial Full of Unexpected Color and Texture',
    },
    description: {
      es: 'Un enfoque artístico para bodas en exterior que mezcla flores vibrantes, arte textil y mesas escultóricas.',
      en: 'An artistic take on outdoor weddings mixing vibrant blooms, textile art, and sculptural tablescapes.',
    },
  },
  {
    id: 'fallback-es-planner-insights',
    url: 'https://www.vogue.com/article/how-to-choose-a-wedding-planner',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1280&q=80',
    source: 'Vogue',
    published: '2024-07-12T08:30:00.000Z',
    title: {
      es: 'Qué buscar al elegir a tu wedding planner ideal',
      en: 'How to Choose the Wedding Planner That Fits Your Vision',
    },
    description: {
      es: 'Preguntas clave, expectativas y señales de estilo para seleccionar al profesional adecuado.',
      en: 'Key questions, expectations, and style cues to find the professional that matches your vision.',
    },
  },
];

const FALLBACK_MAP = FALLBACK_POSTS.reduce((acc, entry) => {
  const base = {
    id: entry.id,
    url: entry.url,
    image: entry.image,
    source: entry.source,
    published: entry.published,
  };
  acc.es.push({
    ...base,
    title: entry.title.es,
    description: entry.description.es,
    __fallback: true,
  });
  acc.en.push({
    ...base,
    title: entry.title.en,
    description: entry.description.en,
    __fallback: true,
  });
  return acc;
}, { es: [], en: [] });

const SUPPORTED_LANGS = Object.keys(FALLBACK_MAP);

function resolveLang(lang) {
  const normalized = (lang || 'es').toLowerCase().slice(0, 2);
  if (SUPPORTED_LANGS.includes(normalized)) return normalized;
  return normalized === 'en' ? 'en' : 'es';
}

export function getFallbackWeddingNews(page, pageSize, lang) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : FALLBACK_POSTS.length;
  const key = resolveLang(lang);
  const collection = FALLBACK_MAP[key].length ? FALLBACK_MAP[key] : FALLBACK_MAP.es;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  return collection.slice(start, end);
}

