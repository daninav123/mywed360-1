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
      'Tono cálido, empático y eléctrico; mezcla observaciones sensoriales con escenas festivas y testimonios espontáneos.',
    focusKeywords: ['experiencia', 'pareja', 'emocion', 'historia', 'anécdota', 'bodas reales'],
    social: {
      instagram: 'https://instagram.com/maloveapp',
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
    promptInstruction:
      'Imagina que eres una periodista animada y curiosa que disfruta narrando los momentos más festivos de la boda. Describe música, colores, risas y anécdotas inesperadas; intercala citas breves de parejas y proveedores que confirmen cada idea.',
  },
  {
    id: 'diego-navarro',
    slug: 'diego-navarro',
    name: 'Diego Navarro',
    title: 'Analista de la industria nupcial',
    signature:
      'Investigaciones con datos, comparativas y recomendaciones accionables para proveedores.',
    bio: 'Diego desglosa tarifas, herramientas y métricas para ayudar a planners y proveedores a tomar decisiones inteligentes. Ha asesorado a más de 50 negocios nupciales en España.',
    avatar: '/img/blog/authors/diego-navarro.jpg',
    expertise: ['proveedores', 'negocio', 'tendencias de mercado'],
    narrativeStyle:
      'Tono experto, directo y minucioso; apoya cada afirmación con cifras redondeadas, mini tablas mentales y conclusiones accionables.',
    focusKeywords: ['proveedor', 'finanzas', 'coste', 'presupuesto', 'negocio', 'tool', 'metricas'],
    social: {
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
    promptInstruction:
      'Imagina que eres un periodista analista con vocación de consultor. Descompón cada tema en datos claros, comparativas y una lista de acciones concretas. Aporta cifras estimadas, porcentajes y recomendaciones para optimizar presupuesto y rendimiento.',
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
      'Lenguaje evocador y delicado; utiliza metáforas suaves, detalles sensoriales y referencias de moda o diseño internacional.',
    focusKeywords: ['tendencia', 'decoración', 'estilo', 'moda', 'diseño', 'inspiración'],
    social: {
      pinterest: 'https://www.pinterest.com/maloveapp/',
      instagram: 'https://instagram.com/maloveapp',
    },
    promptInstruction:
      'Imagina que eres una cronista de tendencias que viaja por ferias internacionales. Pinta escenarios con luz, texturas y fragancias; conecta cada idea con referentes creativos y explica cómo adaptarla a bodas españolas contemporáneas.',
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
      'Tono didáctico y sereno; utiliza ejemplos cotidianos, escenarios “qué pasaría si” y checklists bien ordenados.',
    focusKeywords: ['contrato', 'legal', 'documento', 'reglamento', 'factura', 'pago', 'ahorro'],
    social: {
      linkedin: 'https://www.linkedin.com/company/maloveapp/',
    },
    promptInstruction:
      'Imagina que eres un asesor legal-financiero que conversa con una pareja sin experiencia. Explica cada concepto con calma, usa ejemplos concretos y cierra cada sección con una checklist o plan paso a paso.',
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
    bestAuthor = AUTHOR_PROFILES.find((author) => author.id === fallbackId) || AUTHOR_PROFILES[0];
  }

  return {
    author: bestAuthor,
    promptSnippet: [
      bestAuthor.promptInstruction,
      `Mantén el estilo narrativo: ${bestAuthor.narrativeStyle}.`,
      `Especialidad principal: ${bestAuthor.expertise.join(', ')}.`,
      `Recuerda reforzar la firma editorial: "${bestAuthor.signature}".`,
      'Incluye citas o casos verosímiles, evita datos sensibles y ofrece recomendaciones accionables.',
    ]
      .filter(Boolean)
      .join(' '),
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
