// src/data/blogFallbackPosts.js
// Generador de noticias de fallback para el blog cuando los servicios remotos no responden.

const FALLBACK_POST_TEMPLATES = [
  {
    id: 'fallback-atelier-vintage',
    url: 'https://www.marthastewart.com/wedding-vintage-inspired-reception',
    image: '/assets/services/default.webp',
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
    id: 'fallback-tuscany-destination',
    url: 'https://www.brides.com/tuscany-destination-wedding-ideas-7970213',
    image: '/assets/services/default.webp',
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
    id: 'fallback-modern-minimal',
    url: 'https://www.stylemepretty.com/2024/05/29/modern-floral-wedding-ideas/',
    image: '/assets/services/default.webp',
    source: 'Style Me Pretty',
    published: '2024-05-29T17:20:00.000Z',
    title: {
      es: 'Minimalismo moderno con flores en bloques de color',
      en: 'Modern Minimalism with Bold Floral Statements',
    },
    description: {
      es: 'Cómo combinar líneas limpias, arreglos escultóricos y mesas con carácter para un look contemporáneo.',
      en: 'Clean lines, sculptural arrangements, and statement tables for a striking modern aesthetic.',
    },
  },
  {
    id: 'fallback-lakeside-ceremony',
    url: 'https://greenweddingshoes.com/lakeside-wedding-ideas/',
    image: '/assets/services/default.webp',
    source: 'Green Wedding Shoes',
    published: '2024-03-22T16:15:00.000Z',
    title: {
      es: 'Ceremonia junto al lago con inspiración orgánica',
      en: 'Organic-Inspired Ceremony Beside the Lake',
    },
    description: {
      es: 'Paletas suaves, texturas naturales y detalles orgánicos ideales para bodas al aire libre.',
      en: 'Soft palettes, natural textures, and organic accents tailored to outdoor celebrations.',
    },
  },
  {
    id: 'fallback-garden-editorial',
    url: 'https://www.rockmywedding.co.uk/garden-wedding-editorial',
    image: '/assets/services/default.webp',
    source: 'Rock My Wedding',
    published: '2024-02-17T11:45:00.000Z',
    title: {
      es: 'Editorial de jardín con color y texturas inesperadas',
      en: 'Garden Editorial Full of Unexpected Color and Texture',
    },
    description: {
      es: 'Un enfoque artístico que mezcla flores vibrantes, arte textil y mesas escultóricas.',
      en: 'An artistic take mixing vibrant blooms, textile art, and sculptural tablescapes.',
    },
  },
  {
    id: 'fallback-planner-insights',
    url: 'https://www.vogue.com/article/how-to-choose-a-wedding-planner',
    image: '/assets/services/default.webp',
    source: 'Vogue',
    published: '2024-07-12T08:30:00.000Z',
    title: {
      es: 'Qué buscar al elegir a tu wedding planner ideal',
      en: 'How to Choose the Wedding Planner That Fits Your Vision',
    },
    description: {
      es: 'Preguntas clave, expectativas y señales de estilo para seleccionar al profesional adecuado.',
      en: 'Key questions, expectations, and style cues to find the pro that matches your vision.',
    },
  },
  {
    id: 'fallback-coastal-mallorca',
    url: 'https://www.oncewed.com/featured/romantic-coastal-wedding-in-mallorca/',
    image: '/assets/services/default.webp',
    source: 'Once Wed',
    published: '2024-06-18T15:05:00.000Z',
    title: {
      es: 'Boda costera en Mallorca con inspiración mediterránea',
      en: 'Romantic Coastal Wedding Inspiration from Mallorca',
    },
    description: {
      es: 'Diseños frescos, textiles artesanales y sabores locales con aire mediterráneo.',
      en: 'Fresh styling, artisanal textiles, and local flavors with a Mediterranean soul.',
    },
  },
  {
    id: 'fallback-napa-valley',
    url: 'https://www.over-the-moon.com/weddings/sarah-bretts-wedding-in-napa-valley/',
    image: '/assets/services/default.webp',
    source: 'Over The Moon',
    published: '2024-04-05T10:50:00.000Z',
    title: {
      es: 'Boda en Napa Valley con maridajes de autor',
      en: 'Napa Valley Wedding Filled with Bespoke Wine Pairings',
    },
    description: {
      es: 'Un menú pensado para amantes del vino con viñedos privados y mesas íntimas.',
      en: 'A wine lover’s menu featuring private vineyards and intimate tablescapes.',
    },
  },
  {
    id: 'fallback-mexico-festive',
    url: 'https://utterlyengaged.com/festive-mexico-destination-wedding-inspiration/',
    image: '/assets/services/default.webp',
    source: 'Utterly Engaged',
    published: '2024-01-22T13:25:00.000Z',
    title: {
      es: 'Color y tradición para una boda destino en México',
      en: 'Festive Mexican Destination Wedding Inspiration',
    },
    description: {
      es: 'Decoración vibrante, cócteles artesanales y textiles tradicionales para celebrar en grande.',
      en: 'Vibrant décor, craft cocktails, and traditional textiles for a big celebration.',
    },
  },
  {
    id: 'fallback-autumn-mood',
    url: 'https://junebugweddings.com/wedding-blog/moody-autumn-wedding-inspiration/',
    image: '/assets/services/default.webp',
    source: 'Junebug Weddings',
    published: '2023-10-14T18:40:00.000Z',
    title: {
      es: 'Inspiración otoñal con paleta profunda y velas',
      en: 'Moody Autumn Wedding Inspiration with Candlelight',
    },
    description: {
      es: 'Paleta profunda, flores secas y ambientes íntimos para ceremonias en otoño.',
      en: 'Deep palettes, dried florals, and intimate candlelit settings for fall ceremonies.',
    },
  },
  {
    id: 'fallback-rose-gold',
    url: 'https://www.loveandlavender.com/rose-gold-wedding-inspiration/',
    image: '/assets/services/default.webp',
    source: 'Love and Lavender',
    published: '2023-09-08T12:35:00.000Z',
    title: {
      es: 'Brillos rosados para una boda glam',
      en: 'Rose Gold Details for a Glamorous Wedding',
    },
    description: {
      es: 'Metálicos suaves, cristalería iridiscente y flores empolvadas para un look glam.',
      en: 'Soft metallics, iridescent glassware, and blush florals for a glam finish.',
    },
  },
  {
    id: 'fallback-weekend-guide',
    url: 'https://www.brides.com/guide-to-wedding-weekend-itineraries-7487479',
    image: '/assets/services/default.webp',
    source: 'Brides',
    published: '2024-03-11T09:45:00.000Z',
    title: {
      es: 'Cómo diseñar el itinerario perfecto para un wedding weekend',
      en: 'How to Design the Perfect Wedding Weekend Itinerary',
    },
    description: {
      es: 'Actividades, tiempos y experiencias para mantener entretenidos a tus invitados durante tres días.',
      en: 'Activities, timing, and experiences to keep guests engaged across a three-day celebration.',
    },
  },
  {
    id: 'fallback-sustainable-celebration',
    url: 'https://www.100layercake.com/blog/2024/04/02/sustainable-wedding-ideas/',
    image: '/assets/services/default.webp',
    source: '100 Layer Cake',
    published: '2024-04-02T11:10:00.000Z',
    title: {
      es: 'Ideas sostenibles para una boda con impacto positivo',
      en: 'Sustainable Wedding Ideas with Positive Impact',
    },
    description: {
      es: 'Materiales reutilizables, flores locales y donaciones solidarias integradas en la celebración.',
      en: 'Reusable materials, locally grown florals, and charitable giving woven into the celebration.',
    },
  },
];

const SUPPORTED_LANGS = ['es', 'en'];

const FALLBACK_TEMPLATE_COUNT = FALLBACK_POST_TEMPLATES.length;

function resolveLang(lang) {
  const normalized = (lang || 'es').toLowerCase().slice(0, 2);
  if (SUPPORTED_LANGS.includes(normalized)) return normalized;
  return normalized === 'en' ? 'en' : 'es';
}

function appendTrackingParams(url, lang, sequence) {
  try {
    const target = new URL(url);
    target.searchParams.set('utm_source', 'lovenda-app');
    target.searchParams.set('utm_medium', 'fallback');
    target.searchParams.set('utm_campaign', 'wedding-news');
    target.searchParams.set('utm_content', `${lang}-${sequence}`);
    return target.toString();
  } catch (error) {
    return url;
  }
}

function shiftPublishedDate(isoDate, sequence) {
  if (!isoDate) return new Date().toISOString();
  const base = new Date(isoDate);
  if (Number.isNaN(base.getTime())) {
    return new Date().toISOString();
  }
  const cycleOffset = Math.floor(sequence / FALLBACK_TEMPLATE_COUNT);
  if (cycleOffset === 0) {
    return base.toISOString();
  }
  const shifted = new Date(base);
  shifted.setDate(base.getDate() - cycleOffset);
  return shifted.toISOString();
}

function createFallbackPost(template, lang, sequence) {
  const langKey = template.title[lang] ? lang : 'es';
  return {
    id: `${template.id}-${langKey}-seq${sequence}`,
    title: template.title[langKey] || template.title.es || template.title.en,
    description: template.description[langKey] || template.description.es || template.description.en,
    url: appendTrackingParams(template.url, langKey, sequence),
    image: template.image,
    source: template.source,
    published: shiftPublishedDate(template.published, sequence),
    __fallback: true,
  };
}

export function getFallbackWeddingNews(page, pageSize, lang) {
  if (!FALLBACK_TEMPLATE_COUNT) {
    return [];
  }
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : FALLBACK_TEMPLATE_COUNT;
  const langKey = resolveLang(lang);
  const startIndex = (safePage - 1) * safeSize;

  const results = [];
  for (let i = 0; i < safeSize; i += 1) {
    const globalIndex = startIndex + i;
    const template = FALLBACK_POST_TEMPLATES[globalIndex % FALLBACK_TEMPLATE_COUNT];
    results.push(createFallbackPost(template, langKey, globalIndex));
  }
  return results;
}

