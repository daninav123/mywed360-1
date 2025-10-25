import i18n from '../i18n';

const TEMPLATE_LIBRARY = {
  personalizada: {
    label: 'Personalizada',
    description: 'Crea una pagina web totalmente personalizada segun tus indicaciones',
    samplePrompt:
      i18n.t('common.quiero_una_web_elegante_moderna_con'),
    keywords: ['personalizada', 'moderna', 'premium'],
    tokens: {
      style: 'editorial contemporaneo con toques dorados y tipografia de lujo',
      palette: {
        primary: '#B5812D',
        secondary: '#F5F5F4',
        accent: '#D4B483',
        text: '#222222',
        muted: '#6B7280',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#FBF8F3',
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Inter', sans-serif",
        accent: "'Great Vibes', cursive",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap',
      ],
      hero: i18n.t('common.hero_pantalla_completa_con_nombres_superpuestos'),
      gallery: 'Mosaico de fotos con bordes redondeados y sombra suave, captions opcionales',
      buttons: 'Botones estilo pastilla con sombra suave y efecto hover de leve escala',
      textures: 'ornamentos florales suaves y lineas finas en dorado',
    },
  },
  clasica: {
    label: 'Clasica',
    description: 'Elegante con dorados y marfil, ideal para bodas tradicionales',
    samplePrompt:
      'Estilo clasico con dorado y marfil, tipografia serif elegante, separadores ornamentales y fotos enmarcadas. Incluir agenda del dia y informacion de dress code.',
    keywords: ['dorad', 'clasica', 'tradicional', 'marfil'],
    tokens: {
      style: 'clasico elegante con detalles ornamentales y acentos en dorado cepillado',
      palette: {
        primary: '#C5A572',
        secondary: '#FAF8F2',
        accent: '#E9DCC9',
        text: '#2A2A2A',
        muted: '#6B6B6B',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#FBF7F0',
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Inter', sans-serif",
        accent: "'Great Vibes', cursive",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
      ],
      hero: 'Hero central con nombre de la pareja en caligrafia dorada y marco ornamental',
      gallery: 'Galeria en rejilla con marcos suaves y filtros sepia opcionales',
      buttons: 'Botones con borde dorado y relleno marfil, efecto hover con brillo',
      textures: 'ornamentos florales y separadores en svg dorado claro',
    },
  },
  moderna: {
    label: 'Moderna',
    description: 'Minimalista, limpia y contemporanea, con tipografias sans-serif',
    samplePrompt:
      i18n.t('common.diseno_minimalista_con_bloques_asimetricos_fondo'),
    keywords: ['moderna', 'minimal', 'geometr', 'morad', 'contempor'],
    tokens: {
      style: 'minimalista premium con bloques asimetricos y microinteracciones',
      palette: {
        primary: '#6C63FF',
        secondary: '#F5E7EC',
        accent: '#2E2F5B',
        text: '#111111',
        muted: '#4B5563',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F8F7FE',
      },
      fonts: {
        heading: "'Poppins', sans-serif",
        body: "'Inter', sans-serif",
        accent: "'Poppins', sans-serif",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
      ],
      hero: 'Hero dividido con layout asimetrico, nombres en grande y contenedor con sombra flotante',
      gallery: 'Mosaico responsive con imagen principal y apoyos secundarios con bordes redondeados',
      buttons: 'Botones pill con color solido, sombra y animacion hover de traslacion',
      textures: 'lineas diagonales suaves y gradientes con transparencia',
    },
  },
  rustica: {
    label: 'Rustica',
    description: 'Campestre con tonos tierra, madera y acentos verdes',
    samplePrompt:
      'Quiero un look rustico chic con texturas de madera, hojas verdes y fotos polaroid. Agrega mapa embebido y recomendaciones de dress code boho.',
    keywords: ['rustic', 'campest', 'madera', 'tierra', 'verde'],
    tokens: {
      style: 'rustico chic con texturas organicas, tipografia amigable y hojas verdes',
      palette: {
        primary: '#8B6A3B',
        secondary: '#B9C4A7',
        accent: '#E8DCCA',
        text: '#2F2F2F',
        muted: '#5F6E57',
        background: '#FAF7F1',
        surface: '#FFFFFF',
        surfaceAlt: '#FAF3E7',
      },
      fonts: {
        heading: "'Merriweather', serif",
        body: "'Lato', sans-serif",
        accent: "'Dancing Script', cursive",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Merriweather:wght@400;600;700&family=Lato:wght@400;500;700&display=swap',
      ],
      hero: i18n.t('common.hero_con_foto_fondo_overlay_calido'),
      gallery: 'Grid estilo collage con marcos polaroid inclinados y cinta adhesiva simulada',
      buttons: 'Botones color tierra con borde redondeado y textura ligera',
      textures: 'elementos de acuarela, hojas y fibras naturales',
    },
  },
  playa: {
    label: 'Playa',
    description: 'Costera, fresca y luminosa con azules y arena',
    samplePrompt:
      i18n.t('common.necesito_diseno_inspirado_playa_con_ondas'),
    keywords: ['playa', 'mar', 'oceano', 'turquesa', 'cost'],
    tokens: {
      style: 'coastal chic con degradados inspirados en el mar y detalles de ondas',
      palette: {
        primary: '#2EC4B6',
        secondary: '#F4EBD0',
        accent: '#3A86FF',
        text: '#123A49',
        muted: '#4D7A85',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F0FAFB',
      },
      fonts: {
        heading: "'Quicksand', sans-serif",
        body: "'Inter', sans-serif",
        accent: "'Great Vibes', cursive",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Quicksand:wght@400;500;600&family=Inter:wght@400;500;600&display=swap',
      ],
      hero: i18n.t('common.hero_con_fondo_degradado_tipo_oleaje'),
      gallery: 'Gallery en tarjetas con borde redondeado, efecto de vidrio esmerilado y sombras suaves',
      buttons: 'Botones en turquesa con brillo tipo agua y microanimacion hover',
      textures: 'ondas svg, burbujas y elementos nauticos discretos',
    },
  },
  romantica: {
    label: 'Romantica',
    description: 'Floral, romantica y elegante (mas flores y detalles)',
    samplePrompt:
      'Busco un estilo romantico floral con acuarelas, fuentes caligraficas y bloques suaves. Incluir timeline ilustrado y seccion de mensajes especiales.',
    keywords: ['romant', 'flor', 'acuarel', 'ros', 'amor'],
    tokens: {
      style: 'romantico floral con ilustraciones acuarela y tipografia caligrafica',
      palette: {
        primary: '#C86B98',
        secondary: '#FBE7F2',
        accent: '#F3C4D7',
        text: '#2A1C2F',
        muted: '#7A4E68',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#FAF0F6',
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Inter', sans-serif",
        accent: "'Great Vibes', cursive",
      },
      fontImports: [
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
      ],
      hero: 'Hero con bouquet floral en acuarela, nombres caligraficos y texto centrado',
      gallery: 'Galeria en mosaico suave con marcos redondeados y sombras pastel',
      buttons: 'Botones degradados rosa con brillo y borde fino',
      textures: 'motivos florales suaves, bordes pintados y separadores curvos',
    },
  },
};

const BASE_SECTIONS = [
  'Hero principal con nombres, fecha, ubicacion y CTA hacia la informacion logistica',
  'Resumen de la historia de la pareja con tono emotivo',
  'Cronograma / timeline del dia con horas y descripciones',
  'Seccion de ceremonia y recepcion con direcciones y botones para abrir mapa',
  'Bloque detallado de transporte (horarios de autobuses, puntos de recogida, notas por viaje)',
  'Galeria fotografica responsive con capturas destacadas',
  'Seccion de hospedaje con tarjetas (hotel, distancia, rango de precios, link)',
  'Guia de llegada a la ciudad (avion, tren/bus, coche particular, tips locales)',
  'Bloque de contacto y dudas con canales claros para los invitados',
  'Seccion de regalos / mesa de regalos / cuenta bancaria',
  'Bloque de preguntas frecuentes y notas especiales',
  'Footer con datos de contacto y links para compartir',
];

const COMMON_GUIDELINES = [
  'Usa HTML semantico y clases descriptivas.',
  'Incluye CSS en el <head> con variables, sin frameworks externos.',
  'Asegura experiencia responsive (mobile-first, max-width 1200px).',
  'Agrega microinteracciones suaves (hover, transiciones de 200-300ms).',
  i18n.t('common.resalta_cta_principal_hacia_informacion_logistica'),
  'Crea tablas limpias para los horarios de transporte y cards diferenciadas para los hoteles recomendados.',
  i18n.t('common.describe_claramente_las_rutas_llegada_avion'),
  'Incluye contador regresivo si hay fecha valida.',
  'Optimiza para legibilidad (contraste AA, espacios amplios, headings claros).',
];

const structuredWeddingData = (weddingInfo = {}) => {
  const safe = (value) => (value ? String(value) : '—');
  const lines = [
    `Novia: ${safe(weddingInfo.bride)}`,
    `Novio: ${safe(weddingInfo.groom)}`,
    `Fecha: ${safe(weddingInfo.date)}`,
    `Ceremonia: ${safe(weddingInfo.ceremonyTime)} en ${safe(weddingInfo.ceremonyLocation)}`,
    `Direccion ceremonia: ${safe(weddingInfo.ceremonyAddress)}`,
    `Recepcion: ${safe(weddingInfo.receptionTime)} en ${safe(weddingInfo.receptionVenue)}`,
    `Direccion recepcion: ${safe(weddingInfo.receptionAddress)}`,
    `Transporte general: ${safe(weddingInfo.transportation)}`,
    `Telefono de contacto: ${safe(weddingInfo.contactPhone)}`,
    `Email de contacto: ${safe(weddingInfo.contactEmail)}`,
    `Estilo de boda: ${safe(weddingInfo.weddingStyle)}`,
    `Paleta de colores textual: ${safe(weddingInfo.colorScheme)}`,
    `Informacion adicional provista: ${safe(weddingInfo.additionalInfo)}`,
  ];

  const schedule = Array.isArray(weddingInfo.shuttleSchedule) ? weddingInfo.shuttleSchedule : [];
  schedule.forEach((item, index) => {
    lines.push(
      `Autobus ${index + 1}: ${safe(item.time)} · ${safe(item.departure || item.from)} -> ${safe(
        item.destination || item.to
      )} (${safe(item.notes)})`
    );
  });

  const lodging = Array.isArray(weddingInfo.lodgingOptions) ? weddingInfo.lodgingOptions : [];
  lodging.forEach((hotel, index) => {
    lines.push(
      `Hospedaje ${index + 1}: ${safe(hotel.name || hotel.title)} · ${safe(
        hotel.distance || hotel.minutes
      )} · ${safe(hotel.priceRange || hotel.price)} · Link: ${safe(hotel.link || hotel.url)}`
    );
  });

  const travel = weddingInfo.travelGuide || {};
  if (travel.summary) lines.push(`Resumen de viaje: ${safe(travel.summary)}`);
  if (travel.byPlane) lines.push(`Llegar en avion: ${safe(travel.byPlane)}`);
  if (travel.byTrain) lines.push(`Llegar en tren/bus: ${safe(travel.byTrain)}`);
  if (travel.byCar) lines.push(`Llegar en coche: ${safe(travel.byCar)}`);
  if (travel.tips) lines.push(`Tips adicionales: ${safe(travel.tips)}`);
  if (Array.isArray(travel.airports) && travel.airports.length) {
    lines.push(`Aeropuertos cercanos: ${travel.airports.map(safe).join(', ')}`);
  }
  if (Array.isArray(travel.stations) && travel.stations.length) {
    lines.push(`Estaciones cercanas: ${travel.stations.map(safe).join(', ')}`);
  }

  return lines.join('\n');
};

const buildStyleBrief = (template) => {
  const { tokens } = template;
  const palette = tokens.palette;
  const fonts = tokens.fonts;

  return [
    `Estilo: ${tokens.style}.`,
    `Paleta sugerida: primario ${palette.primary}, secundario ${palette.secondary}, acento ${palette.accent}, fondo ${palette.background}.`,
    `Tipografias: headings con ${fonts.heading}, texto con ${fonts.body}, acentos con ${fonts.accent}.`,
    `Hero recomendado: ${tokens.hero}.`,
    `Tratamiento de galeria: ${tokens.gallery}.`,
    `Botones: ${tokens.buttons}.`,
    `Texturas y decoraciones: ${tokens.textures}.`,
  ].join('\n');
};

export const buildSystemMessage = () =>
  [
    'Eres un director de arte digital especializado en sitios de bodas premium.',
    'Devuelves unicamente un documento HTML completo con <head>, <style> y <body> integrado.',
    'Usa CSS moderno con variables (prefijo --color-, --font-), grid/flex responsive, sombras suaves y animaciones delicadas.',
    'No incluyas explicaciones ni comentarios fuera del HTML.',
    'Todos los enlaces de fuentes deben ser compatibles con Google Fonts y cargarse en el <head>.',
    'Asegura accesibilidad: contraste AA, alt en imagenes, jerarquia tipografica clara.',
    i18n.t('common.resalta_cta_principal_hacia_informacion_logistica'),
  ].join(' ');

export const buildDesignerPrompt = ({ templateKey = 'personalizada', weddingInfo, userPrompt }) => {
  const template = TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.personalizada;
  const baseSections = BASE_SECTIONS.map((section) => `- ${section}`).join('\n');
  const guidelines = COMMON_GUIDELINES.map((rule) => `- ${rule}`).join('\n');
  const styleBrief = buildStyleBrief(template);

  const promptBlocks = [
    'Disena un sitio web de boda impecable siguiendo estas pautas.',
    'SECCIONES OBLIGATORIAS:',
    baseSections,
    '',
    'LINEAMIENTOS DE DISENO:',
    styleBrief,
    '',
    'BUENAS PRACTICAS:',
    guidelines,
    '',
    'DATOS DE LA BODA:',
    structuredWeddingData(weddingInfo),
    '',
    'PREFERENCIAS ESPECIFICAS DEL USUARIO:',
    userPrompt || 'El usuario no agrego instrucciones adicionales; manten coherencia con el estilo.',
  ];

  return {
    systemMessage: buildSystemMessage(),
    userMessage: promptBlocks.join('\n'),
    template,
  };
};

export const getTemplateSamplePrompt = (templateKey = 'personalizada') =>
  TEMPLATE_LIBRARY[templateKey]?.samplePrompt || TEMPLATE_LIBRARY.personalizada.samplePrompt;

export const getTemplateDescriptor = (templateKey) =>
  TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.personalizada;

export const listTemplateOptions = () =>
  Object.entries(TEMPLATE_LIBRARY).map(([key, template]) => ({
    key,
    name: template.label,
    description: template.description,
    samplePrompt: template.samplePrompt,
  }));

export const detectTemplateFromText = (text = '') => {
  const lower = text.toLowerCase();
  let detected = 'personalizada';

  Object.entries(TEMPLATE_LIBRARY).forEach(([key, template]) => {
    if (key === 'personalizada') return;
    const hasKeyword = (template.keywords || []).some((kw) => lower.includes(kw));
    if (hasKeyword) detected = key;
  });

  return detected;
};

export { TEMPLATE_LIBRARY };
