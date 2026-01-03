const CITY_IMAGES = {
  'es-madrid': '/assets/cities/es-madrid.webp',
  'es-barcelona': '/assets/cities/es-barcelona.webp',
  'es-valencia': '/assets/cities/es-valencia.webp',
  'es-sevilla': '/assets/cities/es-sevilla.webp',
  'es-coast': '/assets/cities/es-coast.webp',
  'es-interior': '/assets/cities/es-interior.webp',
  'mx-cdmx': '/assets/cities/mx-cdmx.webp',
  'mx-guadalajara': '/assets/cities/mx-guadalajara.webp',
  'mx-cancun': '/assets/cities/mx-cancun.webp',
  'mx-playadelcarmen': '/assets/cities/mx-playadelcarmen.webp',
  'ar-buenosaires': '/assets/cities/ar-buenosaires.webp',
  'ar-mendoza': '/assets/cities/ar-mendoza.webp',
  'ar-cordoba': '/assets/cities/ar-cordoba.webp',
  'fr-paris': '/assets/cities/fr-paris.webp',
  'fr-provence': '/assets/cities/fr-provence.webp',
  'generic-beach': '/assets/cities/generic-beach.webp',
  'generic-mountain': '/assets/cities/generic-mountain.webp',
  'generic-garden': '/assets/cities/generic-garden.webp',
  'generic-historic': '/assets/cities/generic-historic.webp',
  'generic-modern': '/assets/cities/generic-modern.webp',
};

const SPECIFIC_CITIES = {
  madrid: 'es-madrid',
  barcelona: 'es-barcelona',
  valencia: 'es-valencia',
  sevilla: 'es-sevilla',
  seville: 'es-sevilla',
  'ciudad de mexico': 'mx-cdmx',
  'mexico city': 'mx-cdmx',
  cdmx: 'mx-cdmx',
  guadalajara: 'mx-guadalajara',
  cancun: 'mx-cancun',
  'playa del carmen': 'mx-playadelcarmen',
  'buenos aires': 'ar-buenosaires',
  mendoza: 'ar-mendoza',
  cordoba: 'ar-cordoba',
  paris: 'fr-paris',
  provence: 'fr-provence',
};

const KEYWORDS = {
  beach: ['playa', 'beach', 'costa', 'coast', 'mar', 'sea', 'oceano', 'ocean', 'caribe', 'caribbean'],
  mountain: ['montana', 'mountain', 'sierra', 'alpes', 'alps', 'cordillera'],
  garden: ['jardin', 'garden', 'botanico', 'botanical', 'parque', 'park'],
  historic: ['historico', 'historic', 'medieval', 'castillo', 'castle', 'palacio', 'palace'],
  modern: ['moderno', 'modern', 'contemporaneo', 'contemporary', 'urbano', 'urban'],
};

const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function getCityImage(cityName, description = '', country = '') {
  const text = normalizeText(`${cityName || ''} ${description || ''}`);
  const normalized = normalizeText(cityName || '');

  if (SPECIFIC_CITIES[normalized]) {
    return CITY_IMAGES[SPECIFIC_CITIES[normalized]];
  }

  for (const [type, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => text.includes(normalizeText(kw)))) {
      return CITY_IMAGES[`generic-${type}`];
    }
  }

  const countryCode = (country || '').toLowerCase();
  if (countryCode === 'es') {
    if (text.includes('costa') || text.includes('playa') || text.includes('mar')) {
      return CITY_IMAGES['es-coast'];
    }
    return CITY_IMAGES['es-interior'];
  }

  if (countryCode === 'mx') {
    if (text.includes('playa') || text.includes('cancun') || text.includes('riviera')) {
      return CITY_IMAGES['mx-cancun'];
    }
    return CITY_IMAGES['mx-cdmx'];
  }

  if (countryCode === 'ar') return CITY_IMAGES['ar-buenosaires'];
  if (countryCode === 'fr') return CITY_IMAGES['fr-paris'];

  return CITY_IMAGES['generic-modern'];
}

export default getCityImage;
