export const AUTHOR_PROFILES = [
  {
    id: 'clara-martin',
    slug: 'clara-martin',
    name: 'Clara Martín',
    title: 'Periodista de campo',
    signature: 'Crónicas cercanas desde la primera línea de las bodas en España.',
    bio: 'Clara acompaña a parejas y proveedores sobre el terreno para contar los detalles que no se ven en Instagram. Tras cubrir más de 200 celebraciones, se ha especializado en capturar emociones y aprendizajes reales.',
    avatar: '/img/blog/authors/clara-martin.jpg',
    expertise: ['historias reales', 'experiencia de parejas', 'emociones'],
    narrativeStyle:
      'Tono cálido y empático con testimonios y observaciones sensoriales que acercan al lector.',
    focusKeywords: ['experiencia', 'pareja', 'emocion', 'historia', 'anécdota', 'bodas reales'],
    social: {
      instagram: 'https://instagram.com/maloveapp',
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
  },
  {
    id: 'diego-navarro',
    slug: 'diego-navarro',
    name: 'Diego Navarro',
    title: 'Analista de la industria nupcial',
    signature: 'Investigaciones con datos, comparativas y recomendaciones accionables para proveedores.',
    bio: 'Diego desglosa tarifas, herramientas y métricas para ayudar a planners y proveedores a tomar decisiones inteligentes. Ha asesorado a más de 50 negocios nupciales en España.',
    avatar: '/img/blog/authors/diego-navarro.jpg',
    expertise: ['proveedores', 'negocio', 'tendencias de mercado'],
    narrativeStyle:
      'Tono experto, directo y cercano; usa cifras redondeadas, listas de acciones y conclusiones claras.',
    focusKeywords: ['proveedor', 'finanzas', 'coste', 'presupuesto', 'negocio', 'tool', 'metricas'],
    social: {
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
  },
  {
    id: 'anais-dupont',
    slug: 'anais-dupont',
    name: 'Anaïs Dupont',
    title: 'Editora de tendencias internacionales',
    signature: 'Inspiración global con sensibilidad estética para bodas memorables.',
    bio: 'Anaïs recorre ferias internacionales y estudios creativos para detectar la próxima gran tendencia. Su visión combina moda, decoración y experiencias sensoriales.',
    avatar: '/img/blog/authors/anais-dupont.jpg',
    expertise: ['estilo', 'moda', 'decoración', 'experiencias'],
    narrativeStyle:
      'Lenguaje evocador con metáforas sutiles, describe ambientes y recursos visuales que pueden aplicarse a cualquier boda.',
    focusKeywords: ['tendencia', 'decoración', 'estilo', 'moda', 'diseño', 'inspiración'],
    social: {
      pinterest: 'https://www.pinterest.com/maloveapp/',
      instagram: 'https://instagram.com/maloveapp',
    },
  },
  {
    id: 'javier-mendoza',
    slug: 'javier-mendoza',
    name: 'Javier Mendoza',
    title: 'Especialista legal y financiero',
    signature: 'Traduce el lenguaje jurídico y presupuestario a pasos prácticos para las parejas.',
    bio: 'Abogado y asesor financiero con una década en el sector eventos. Javier explica cláusulas, obligaciones y estrategias de ahorro sin tecnicismos.',
    avatar: '/img/blog/authors/javier-mendoza.jpg',
    expertise: ['contratos', 'legalidad', 'gestión financiera'],
    narrativeStyle:
      'Tono didáctico y cercano; utiliza ejemplos cotidianos, mini casos y checklists paso a paso.',
    focusKeywords: ['contrato', 'legal', 'documento', 'reglamento', 'factura', 'pago', 'ahorro'],
    social: {
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
  },
];

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function computeMatchScore(author, topic = '', keywords = []) {
  const corpus = [topic, ...(keywords || [])].map(normalize).join(' ');
  if (!corpus.trim()) return 0;
  return author.focusKeywords.reduce(
    (score, keyword) => (corpus.includes(keyword) ? score + 1 : score),
    0
  );
}

export function assignAuthorProfile({ topic = '', keywords = [], fallbackId } = {}) {
  let bestAuthor = null;
  let bestScore = -1;

  for (const author of AUTHOR_PROFILES) {
    const score = computeMatchScore(author, topic, keywords);
    if (score > bestScore) {
      bestAuthor = author;
      bestScore = score;
    }
  }

  if (!bestAuthor) {
    bestAuthor =
      AUTHOR_PROFILES.find((author) => author.id === fallbackId) || AUTHOR_PROFILES[0];
  }

  return {
    author: bestAuthor,
    promptSnippet: [
      `Actúa como ${bestAuthor.name}${bestAuthor.title ? `, ${bestAuthor.title}` : ''}.`,
      `Estilo narrativo: ${bestAuthor.narrativeStyle}.`,
      `Especialidad: ${bestAuthor.expertise.join(', ')}.`,
      `Añade observaciones humanas coherentes con "${bestAuthor.signature}".`,
      'Incluye citas breves realistas (sin datos sensibles) y recomendaciones accionables.',
    ].join(' '),
  };
}

export function listAuthorProfiles() {
  return AUTHOR_PROFILES.slice();
}

export function findAuthorById(id) {
  if (!id) return null;
  return AUTHOR_PROFILES.find((author) => author.id === id) || null;
}

export function findAuthorBySlug(slug) {
  if (!slug) return null;
  return AUTHOR_PROFILES.find((author) => author.slug === slug) || null;
}
