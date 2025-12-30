/**
 * Template de especificaciones por categoría de proveedor
 * Usado para definir qué necesita el usuario de cada tipo de proveedor
 */

export const SUPPLIER_SPECS_TEMPLATE = {
  fotografia: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      drone: false,
      engagement: false,
      album: false,
      hours: 8,
      photographers: 1,
      delivery: 'digital',
      style: 'natural',
      locationScouting: false,
    }
  },

  video: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      drone: false,
      highlights: false,
      fullCeremony: false,
      hours: 8,
      videographers: 1,
      style: 'cinematic',
      sameDay: false,
      interviews: false,
    }
  },

  // 🎵 MÚSICA Y ENTRETENIMIENTO - Categorías granulares por momento
  
  'musica-ceremonia': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: 'cuarteto',           // cuarteto, violin, arpa, gospel, piano, organo
      musicians: 4,
      repertoire: [],              // Piezas musicales específicas
      soundSystem: 'own',          // own (propio), provided (incluido), venue (del lugar)
      rehearsal: false,            // Ensayo previo
      customSongs: false,          // Canciones personalizadas
      entrance: '',                // Canción entrada
      ceremony: '',                // Canción durante ceremonia
      exit: '',                    // Canción salida
    }
  },

  'musica-cocktail': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: 'jazz',               // jazz, acustica, duo, trio, clasica
      musicians: 2,
      duration: 2,                 // Horas
      soundSystem: 'own',
      genre: [],                   // Jazz, bossa nova, clásica, pop acústico
      background: true,            // Música de fondo vs protagonista
    }
  },

  'musica-fiesta': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: 'banda',              // banda, orquesta, versiones, tributo
      musicians: 6,
      hours: 4,
      soundSystem: 'own',         // Sistema de sonido propio
      lights: false,              // Iluminación propia
      genre: [],                  // Rock, pop, latina, soul, funk
      breakDJ: false,             // DJ en descansos
      requests: true,             // Acepta peticiones
      playlist: '',               // Playlist requerida
    }
  },

  dj: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      lights: false,
      smoke: false,
      coldSparks: false,
      confetti: false,
      co2: false,
      led: false,
      hours: 5,
      genres: [],
      equipment: [],
      mc: false,
    }
  },

  catering: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      style: 'plated',
      courses: 3,
      appetizers: false,
      bar: 'open',
      wine: 'unlimited',
      champagne: false,
      lateSnacks: false,
      cake: 'included',
      staff: 0,
      vegetarian: 0,
      vegan: 0,
      glutenFree: 0,
      allergies: [],
    }
  },

  'flores-decoracion': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      bouquet: false,
      boutonniere: false,
      centerpieces: false,
      ceremony: false,
      arch: false,
      aisle: false,
      installation: false,
      petals: false,
      preferredFlowers: [],
      avoidFlowers: [],
    }
  },

  animacion: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: [],
      duration: 0,
      audience: 'all',
      interactive: false,
      fireworks: false,
      coldFire: false,
      confetti: false,
      bubbles: false,
      doves: false,
    }
  },

  // 📢 PRODUCCIÓN TÉCNICA - Sonido e Iluminación profesional
  'sonido-iluminacion': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      soundSystem: false,         // Sistema de sonido profesional
      lighting: false,            // Iluminación técnica
      dj: false,                  // Incluye DJ
      stage: false,               // Tarima/escenario
      screens: false,             // Pantallas LED
      projection: false,          // Proyección
      specialEffects: false,      // Efectos especiales (humo, CO2, fuego frío)
      ceremony: false,            // Cobertura ceremonia
      cocktail: false,            // Cobertura cóctel
      party: false,               // Cobertura fiesta
      hours: 6,                   // Horas totales de servicio
      guestCount: 0,              // Número de invitados (para dimensionar)
      indoor: true,               // Interior vs exterior
      technicians: 1,             // Técnicos en el evento
      uplighting: false,          // Iluminación ambiental decorativa
      pinspots: false,            // Focos en mesas
      gobo: false,                // Proyección nombres/logo
      movingHeads: false,         // Cabezas móviles
      ledPar: false,              // Focos LED PAR
      strobes: false,             // Estroboscopios
    }
  },

  photocall: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      backdrop: '',
      props: false,
      printer: false,
      digital: false,
      customProps: [],
      booth: false,
      socialShare: false,
    }
  },

  lugares: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      capacity: 0,
      indoorOutdoor: '',
      ceremony: false,
      reception: false,
      both: false,
      accommodation: false,
      parking: false,
      accessibility: false,
      exclusive: false,
      cateringIncluded: false,
      rainPlan: false,
    }
  },

  restaurantes: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      capacity: 0,
      privateRoom: false,
      exclusiveVenue: false,
      ceremony: false,
      terrace: false,
      parking: false,
      accommodation: false,
      menuTasting: false,
      customMenu: false,
    }
  },

  decoracion: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      tableCenterpieces: false,
      presidentialTable: false,
      ceremony: false,
      entrance: false,
      photocall: false,
      lounge: false,
      lighting: false,
      drapery: false,
      signage: false,
      theme: '',
    }
  },

  'vestidos-trajes': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      dress: false,
      suit: false,
      alterations: false,
      accessories: false,
      veil: false,
      shoes: false,
      rental: false,
      custom: false,
      fittings: 3,
      cleaningIncluded: false,
    }
  },

  belleza: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      brideHair: false,
      brideMakeup: false,
      trial: false,
      bridesmaids: 0,
      mothers: 0,
      groomPrep: false,
      onSiteService: false,
      touchUps: false,
      airbrush: false,
      extensions: false,
    }
  },

  joyeria: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      engagementRing: false,
      weddingBands: false,
      custom: false,
      engraving: false,
      metal: '',
      stones: '',
      warranty: false,
      insurance: false,
      resizing: false,
    }
  },

  tartas: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      tiers: 3,
      servings: 0,
      flavor: [],
      filling: [],
      design: '',
      fresh: false,
      delivery: false,
      stand: false,
      tasting: false,
      toppers: false,
    }
  },

  invitaciones: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      saveTheDates: false,
      invitations: false,
      rsvp: false,
      menus: false,
      programs: false,
      thankYou: false,
      envelopes: false,
      design: '',
      printing: '',
      quantity: 0,
    }
  },

  detalles: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: '',
      quantity: 0,
      personalized: false,
      packaging: false,
      display: false,
      tags: false,
      theme: '',
      forChildren: false,
      edible: false,
    }
  },

  transporte: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      coupleTransport: false,
      guestShuttles: false,
      vintage: false,
      luxury: false,
      capacity: 0,
      hours: 0,
      driver: false,
      decoration: false,
      redCarpet: false,
    }
  },

  'fuegos-artificiales': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      duration: 0,
      type: '',
      synchronized: false,
      music: false,
      sparklers: false,
      coldFire: false,
      permits: false,
      safety: false,
      rehearsal: false,
    }
  },

  organizacion: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      fullPlanning: false,
      partialPlanning: false,
      dayOf: false,
      design: false,
      vendorManagement: false,
      timeline: false,
      budget: false,
      meetings: 0,
      onSiteHours: 0,
    }
  },

  iglesias: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      capacity: 0,
      religion: '',
      premaritalCounseling: false,
      rehearsal: false,
      choir: false,
      organist: false,
      flowers: false,
      restrictions: [],
      certificate: false,
    }
  },

  ceremonia: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: 'civil',
      personalized: false,
      readings: false,
      vows: 'traditional',
      music: false,
      duration: 30,
      languages: [],
      symbolic: false,
      outdoor: false,
    }
  },

  alojamiento: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      rooms: 0,
      nights: 0,
      suiteForCouple: false,
      breakfast: false,
      blockBooking: false,
      discount: false,
      shuttle: false,
      lateCheckout: false,
      amenities: [],
    }
  },

  'bar-bebidas': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      openBar: false,
      signature: false,
      bartenders: 0,
      hours: 0,
      premium: false,
      wine: false,
      champagne: false,
      nonAlcoholic: false,
      customMenu: false,
    }
  },

  'carpas-mobiliario': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      tent: false,
      tentSize: 0,
      tables: 0,
      chairs: 0,
      linens: false,
      chiavari: false,
      lounge: false,
      installation: false,
      removal: false,
    }
  },

  'candy-bar': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      display: false,
      containers: false,
      personalized: false,
      variety: 0,
      themed: false,
      staff: false,
      packaging: false,
      signage: false,
    }
  },

  'food-trucks': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      type: '',
      servings: 0,
      hours: 0,
      menu: '',
      staff: 0,
      setup: false,
      lateNight: false,
      vegetarianOptions: false,
    }
  },

  'seguridad-staff': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      security: 0,
      waiters: 0,
      bartenders: 0,
      coordinators: 0,
      hours: 0,
      uniformed: false,
      bilingual: false,
    }
  },

  parking: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      valet: false,
      attendants: 0,
      capacity: 0,
      signage: false,
      covered: false,
      security: false,
      hours: 0,
    }
  },

  'cuidado-ninos': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      nannies: 0,
      ageRange: '',
      activities: false,
      separateRoom: false,
      hours: 0,
      meals: false,
      certified: false,
    }
  },

  'spa-tratamientos': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      bridePackage: false,
      couplePackage: false,
      bridalParty: 0,
      massage: false,
      facial: false,
      manicure: false,
      pedicure: false,
      prewedding: false,
    }
  },

  'brunch-post-boda': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      guests: 0,
      buffet: false,
      plated: false,
      drinks: false,
      venue: '',
      hours: 0,
      casual: false,
    }
  },

  'tecnologia-streaming': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      livestream: false,
      platform: '',
      cameras: 0,
      recording: false,
      app: false,
      hashtag: false,
      socialWall: false,
      tech: false,
    }
  },

  limpieza: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      postEvent: false,
      staff: 0,
      hours: 0,
      recycling: false,
      deep: false,
    }
  },

  'luna-de-miel': {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {
      destination: '',
      nights: 0,
      allInclusive: false,
      flights: false,
      excursions: false,
      honeymoonSuite: false,
      transfers: false,
      insurance: false,
    }
  },

  otros: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {}
  },

  // Template genérico para categorías sin specs específicas
  default: {
    required: [],
    desired: [],
    extras: [],
    notes: '',
    budget: 0,
    customOptions: [],
    specs: {}
  }
};

// Variable global para cachear specs dinámicas
let DYNAMIC_SPECS_CACHE = null;

/**
 * Obtiene el template de specs para una categoría
 * Usa cache de specs dinámicas si están disponibles
 */
export function getSupplierSpecsTemplate(categoryId) {
  const specs = DYNAMIC_SPECS_CACHE || SUPPLIER_SPECS_TEMPLATE;
  return specs[categoryId] || specs.default || SUPPLIER_SPECS_TEMPLATE.default;
}

/**
 * Actualiza el cache de specs dinámicas
 * Llamar cuando se cargan desde Firestore
 */
export function setDynamicSpecs(specs) {
  DYNAMIC_SPECS_CACHE = specs;
  console.log('🔄 Cache de specs dinámicas actualizado');
}

/**
 * Limpia el cache y vuelve a specs por defecto
 */
export function clearDynamicSpecs() {
  DYNAMIC_SPECS_CACHE = null;
  console.log('🔄 Cache de specs dinámicas limpiado');
}

/**
 * Inicializa supplierRequirements con todos los templates
 * Importa SUPPLIER_CATEGORIES para garantizar que todas las categorías estén cubiertas
 */
export function initializeSupplierRequirements() {
  const requirements = {};
  
  // Importar dinámicamente las categorías para evitar circular dependency
  // En su lugar, iteramos sobre las claves existentes del template
  Object.keys(SUPPLIER_SPECS_TEMPLATE).forEach(categoryId => {
    if (categoryId !== 'default') {
      requirements[categoryId] = JSON.parse(JSON.stringify(SUPPLIER_SPECS_TEMPLATE[categoryId]));
    }
  });
  
  return requirements;
}

/**
 * Obtiene o crea especificaciones para una categoría específica
 */
export function getOrCreateCategorySpecs(requirements, categoryId) {
  if (!requirements[categoryId]) {
    requirements[categoryId] = JSON.parse(
      JSON.stringify(getSupplierSpecsTemplate(categoryId))
    );
  }
  return requirements[categoryId];
}

/**
 * Labels para cada spec
 */
export const SPEC_LABELS = {
  fotografia: {
    drone: 'Dron para fotos aéreas',
    engagement: 'Sesión pre-boda',
    album: 'Álbum físico',
    hours: 'Horas de cobertura',
    photographers: 'Número de fotógrafos',
    delivery: 'Tipo de entrega',
    style: 'Estilo fotográfico',
    locationScouting: 'Visita previa al lugar',
  },
  video: {
    drone: 'Dron para vídeo aéreo',
    highlights: 'Vídeo resumen (highlights)',
    fullCeremony: 'Ceremonia completa',
    hours: 'Horas de cobertura',
    videographers: 'Número de videógrafos',
    style: 'Estilo de vídeo',
    sameDay: 'Same day edit',
    interviews: 'Entrevistas a invitados',
  },
  dj: {
    lights: 'Iluminación incluida',
    smoke: 'Máquina de humo',
    coldSparks: 'Fuego frío',
    confetti: 'Confeti',
    co2: 'Cañones CO2',
    led: 'Pantallas LED',
    hours: 'Horas de DJ',
    genres: 'Géneros musicales',
    equipment: 'Equipamiento',
    mc: 'Maestro de ceremonias',
  },
  'musica-ceremonia': {
    type: 'Tipo de agrupación',
    musicians: 'Número de músicos',
    repertoire: 'Repertorio',
    soundSystem: 'Sistema de sonido',
    rehearsal: 'Ensayo previo',
    customSongs: 'Canciones personalizadas',
    entrance: 'Canción de entrada',
    ceremony: 'Canción durante ceremonia',
    exit: 'Canción de salida',
  },
  'musica-cocktail': {
    type: 'Tipo de agrupación',
    musicians: 'Número de músicos',
    duration: 'Duración (horas)',
    soundSystem: 'Sistema de sonido',
    genre: 'Géneros musicales',
    background: 'Música de fondo',
  },
  'musica-fiesta': {
    type: 'Tipo de agrupación',
    musicians: 'Número de músicos',
    hours: 'Horas de actuación',
    soundSystem: 'Sistema de sonido',
    lights: 'Iluminación propia',
    genre: 'Géneros musicales',
    breakDJ: 'DJ en descansos',
    requests: 'Acepta peticiones',
    playlist: 'Playlist requerida',
  },
  'sonido-iluminacion': {
    soundSystem: 'Sistema de sonido',
    lighting: 'Iluminación técnica',
    dj: 'Incluye DJ',
    stage: 'Tarima/escenario',
    screens: 'Pantallas LED',
    projection: 'Proyección',
    specialEffects: 'Efectos especiales',
    ceremony: 'Cobertura ceremonia',
    cocktail: 'Cobertura cóctel',
    party: 'Cobertura fiesta',
    hours: 'Horas de servicio',
    guestCount: 'Número de invitados',
    indoor: 'Interior/Exterior',
    technicians: 'Técnicos en evento',
    uplighting: 'Iluminación ambiental',
    pinspots: 'Focos en mesas',
    gobo: 'Proyección nombres/logo',
    movingHeads: 'Cabezas móviles',
    ledPar: 'Focos LED PAR',
    strobes: 'Estroboscopios',
  },
  animacion: {
    type: 'Tipo de animación',
    duration: 'Duración (minutos)',
    audience: 'Público objetivo',
    interactive: 'Interactivo',
    fireworks: 'Fuegos artificiales',
    coldFire: 'Fuego frío',
    confetti: 'Confeti',
    bubbles: 'Burbujas',
    doves: 'Palomas',
  },
};

export default SUPPLIER_SPECS_TEMPLATE;
