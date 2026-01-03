/**
 * Categorías estandarizadas de proveedores de bodas
 * Usadas en toda la aplicación (frontend, backend, Google Places)
 */

export const SUPPLIER_CATEGORIES = [
  // Principales
  {
    id: 'fotografia',
    name: 'Fotografía',
    nameEn: 'Photography',
    icon: 'camera',
    description: 'Fotógrafos profesionales de bodas',
    googlePlacesType: 'photographer',
    keywords: ['fotografia', 'fotografo', 'photo', 'photography'],
    coverage: 'medium', // high, medium, low (para Google Places)
  },
  {
    id: 'video',
    name: 'Vídeo',
    nameEn: 'Videography',
    icon: 'video',
    description: 'Videógrafos y productoras de vídeo',
    googlePlacesType: 'videographer',
    keywords: ['video', 'videografia', 'videografo', 'cine', 'film'],
    coverage: 'medium',
  },
  {
    id: 'musica-ceremonia',
    name: 'Música Ceremonia',
    nameEn: 'Ceremony Music',
    icon: 'music',
    description: 'Música para ceremonia (violín, arpa, cuarteto, etc.)',
    googlePlacesType: 'musician',
    keywords: ['musica ceremonia', 'violin', 'arpa', 'cuarteto', 'piano', 'musica clasica', 'musicos ceremonia', 'musica bodas ceremonia', 'ceremony music'],
    coverage: 'medium',
  },
  {
    id: 'musica-cocktail',
    name: 'Música Cóctel',
    nameEn: 'Cocktail Music',
    icon: 'music',
    description: 'Música para cóctel (jazz, acústico, versiones, etc.)',
    googlePlacesType: 'musician',
    keywords: ['musica cocktail', 'jazz', 'acoustico', 'versiones', 'musica ambiente', 'cocktail music', 'musicos cocktail'],
    coverage: 'medium',
  },
  {
    id: 'musica-fiesta',
    name: 'Música Fiesta',
    nameEn: 'Party Music',
    icon: 'music',
    description: 'Música para fiesta (banda, orquesta, grupo musical)',
    googlePlacesType: 'night_club',
    keywords: ['musica fiesta', 'banda', 'orquesta', 'grupo musical', 'versiones', 'musica boda', 'party music', 'banda boda', 'orquesta boda'],
    coverage: 'medium',
  },
  {
    id: 'dj',
    name: 'DJ',
    nameEn: 'DJ',
    icon: 'disc',
    description: 'DJs profesionales para bodas',
    googlePlacesType: 'night_club',
    keywords: ['dj', 'disc jockey', 'discoteca', 'música electrónica', 'dj boda', 'pincha', 'sonido', 'audio', 'alquiler dj', 'equipos dj', 'sonido profesional', 'dj bodas', 'dj eventos'],
    coverage: 'medium',
  },
  {
    id: 'sonido-iluminacion',
    name: 'Sonido e Iluminación',
    nameEn: 'Sound & Lighting',
    icon: 'lightbulb',
    description: 'Empresas técnicas de sonido e iluminación profesional',
    googlePlacesType: null,
    keywords: ['sonido', 'iluminacion', 'audio', 'luces', 'equipos sonido', 'alquiler sonido', 'tecnica', 'sound', 'lighting', 'audioprobe', 'resona', 'gente de bien', 'produccion tecnica', 'equipos audio', 'iluminacion profesional'],
    coverage: 'medium',
  },
  {
    id: 'catering',
    name: 'Catering',
    nameEn: 'Catering',
    icon: 'utensils',
    description: 'Servicios de catering y banquetes',
    googlePlacesType: 'caterer',
    keywords: ['catering', 'banquete', 'comida', 'menu'],
    coverage: 'medium',
    // Campos adicionales para modalidades de servicio
    additionalFields: [
      {
        id: 'serviceModalities',
        label: 'Modalidades de servicio',
        type: 'checkboxGroup',
        options: [
          { value: 'ownVenue', label: 'Tenemos espacio propio', icon: '🏛️' },
          { value: 'external', label: 'Ofrecemos servicio externo', icon: '🚚' }
        ],
        description: 'Selecciona las modalidades que ofreces'
      },
      {
        id: 'venueCapacity',
        label: 'Capacidad del espacio',
        type: 'number',
        placeholder: 'Ej: 200',
        showIf: 'serviceModalities.ownVenue',
        description: 'Número máximo de personas en tu espacio'
      },
      {
        id: 'venueType',
        label: 'Tipo de espacio',
        type: 'select',
        options: [
          { value: 'finca', label: 'Finca' },
          { value: 'masia', label: 'Masía' },
          { value: 'hotel', label: 'Hotel' },
          { value: 'restaurante', label: 'Restaurante' },
          { value: 'salon', label: 'Salón de eventos' },
          { value: 'otro', label: 'Otro' }
        ],
        showIf: 'serviceModalities.ownVenue',
        description: 'Tipo de espacio que ofreces'
      }
    ]
  },
  {
    id: 'lugares',
    name: 'Lugares',
    nameEn: 'Venues',
    icon: 'home',
    description: 'Salones, fincas, haciendas, venues',
    googlePlacesType: 'banquet hall',
    keywords: ['salon', 'finca', 'hacienda', 'venue', 'lugar', 'espacio'],
    coverage: 'high',
  },
  {
    id: 'restaurantes',
    name: 'Restaurantes',
    nameEn: 'Restaurants',
    icon: 'utensils',
    description: 'Restaurantes con salones para bodas',
    googlePlacesType: 'restaurant',
    keywords: ['restaurante', 'comedor'],
    coverage: 'high',
  },
  {
    id: 'flores-decoracion',
    name: 'Flores y Decoración',
    nameEn: 'Flowers & Decoration',
    icon: 'flower',
    description: 'Floristerías y decoración floral',
    googlePlacesType: 'florist',
    keywords: ['flores', 'florista', 'floristeria', 'decoracion', 'ramos'],
    coverage: 'high',
  },
  {
    id: 'decoracion',
    name: 'Decoración',
    nameEn: 'Decoration',
    icon: 'palette',
    description: 'Decoración de espacios y ambientación',
    googlePlacesType: 'event planner',
    keywords: ['decoracion', 'ambientacion', 'montaje'],
    coverage: 'medium',
  },
  {
    id: 'vestidos-trajes',
    name: 'Vestidos y Trajes',
    nameEn: 'Dresses & Suits',
    icon: 'shirt',
    description: 'Vestidos de novia, trajes de novio',
    googlePlacesType: 'bridal_shop',
    keywords: ['vestido', 'novia', 'traje', 'novio', 'moda nupcial', 'vestido novia', 'traje novio', 'tienda novias', 'atelier', 'boutique novia', 'sastreria'],
    coverage: 'high',
  },
  {
    id: 'belleza',
    name: 'Belleza',
    nameEn: 'Beauty',
    icon: 'sparkles',
    description: 'Peluquería, maquillaje, estética',
    googlePlacesType: 'beauty salon',
    keywords: ['peluqueria', 'maquillaje', 'belleza', 'estetica', 'spa'],
    coverage: 'high',
  },
  {
    id: 'joyeria',
    name: 'Joyería',
    nameEn: 'Jewelry',
    icon: 'gem',
    description: 'Anillos, alianzas, joyería',
    googlePlacesType: 'jewelry store',
    keywords: ['joyeria', 'joyero', 'joyeros', 'anillos', 'alianzas', 'joyas', 'jewelry', 'jewellery', 'anillos boda', 'alianzas boda'],
    coverage: 'high',
  },
  {
    id: 'tartas',
    name: 'Tartas de Boda',
    nameEn: 'Wedding Cakes',
    icon: 'cake',
    description: 'Pastelerías y tartas personalizadas',
    googlePlacesType: 'bakery',
    keywords: ['tarta', 'pastel', 'pasteleria', 'reposteria', 'dulces', 'tarta boda', 'pastel boda', 'tartas personalizadas', 'reposteria creativa', 'cake design'],
    coverage: 'high',
  },
  {
    id: 'invitaciones',
    name: 'Invitaciones',
    nameEn: 'Invitations',
    icon: 'mail',
    description: 'Invitaciones y papelería de boda',
    googlePlacesType: null,
    keywords: ['invitaciones', 'papeleria', 'tarjetas', 'imprenta'],
    coverage: 'low',
  },
  {
    id: 'detalles',
    name: 'Detalles de Boda',
    nameEn: 'Wedding Favors',
    icon: 'gift',
    description: 'Detalles y regalos para invitados',
    googlePlacesType: 'gift_shop',
    keywords: ['detalles', 'regalos', 'recuerdos', 'souvenirs', 'detalles boda', 'regalos invitados', 'recuerdos boda', 'detalles personalizados', 'regalos bodas'],
    coverage: 'medium',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    nameEn: 'Transportation',
    icon: 'car',
    description: 'Coches clásicos, limusinas, transporte',
    googlePlacesType: 'car_rental',
    keywords: ['transporte', 'coche', 'limusina', 'autobus', 'vehiculo', 'coche clasico', 'alquiler coches', 'limusina boda', 'transporte bodas', 'coche novios', 'vehiculos clasicos'],
    coverage: 'medium',
  },
  {
    id: 'animacion',
    name: 'Animación',
    nameEn: 'Entertainment',
    icon: 'party-popper',
    description: 'Animadores, magos, espectáculos',
    googlePlacesType: null,
    keywords: ['animacion', 'entretenimiento', 'animador', 'mago', 'espectaculo', 'show', 'artista'],
    coverage: 'low',
  },
  {
    id: 'photocall',
    name: 'Photocall',
    nameEn: 'Photobooth',
    icon: 'camera',
    description: 'Photocall, photobooth, fotomatón',
    googlePlacesType: null,
    keywords: ['photocall', 'photobooth', 'fotomaton', 'photo booth', 'cabina fotos', 'corner fotos', 'atrezzo', 'props'],
    coverage: 'medium',
  },
  {
    id: 'fuegos-artificiales',
    name: 'Fuegos Artificiales',
    nameEn: 'Fireworks',
    icon: 'sparkles',
    description: 'Pirotecnia y fuegos artificiales',
    googlePlacesType: null,
    keywords: ['fuegos', 'artificiales', 'pirotecnia', 'bengalas'],
    coverage: 'low',
  },
  {
    id: 'organizacion',
    name: 'Organización',
    nameEn: 'Planning',
    icon: 'clipboard-list',
    description: 'Wedding planners y coordinadores',
    googlePlacesType: 'event planner',
    keywords: ['wedding planner', 'organizacion', 'coordinador', 'planner'],
    coverage: 'low',
  },
  {
    id: 'iglesias',
    name: 'Iglesias y Lugares de Culto',
    nameEn: 'Churches & Places of Worship',
    icon: 'church',
    description: 'Iglesias, parroquias, catedrales, templos',
    googlePlacesType: 'church',
    keywords: [
      'iglesia',
      'parroquia',
      'catedral',
      'ermita',
      'capilla',
      'basilica',
      'basílica',
      'templo',
      'church',
      'place of worship',
      'ceremonia religiosa',
      'boda religiosa',
      'boda por la iglesia',
      'misa',
      'templo religioso',
    ],
    coverage: 'high',
  },
  {
    id: 'ceremonia',
    name: 'Ceremonia Civil',
    nameEn: 'Civil Ceremony',
    icon: 'heart',
    description: 'Oficiantes, maestros de ceremonia civil, celebrantes',
    googlePlacesType: null,
    keywords: [
      'oficiante', 
      'maestro ceremonia', 
      'celebrante',
      'ceremonia civil',
      'boda civil',
      'civil ceremony',
      'ceremony',
      'officiant',
      'celebrant',
      'ceremonia simbolica',
      'ceremonia laica',
    ],
    coverage: 'low',
  },
  {
    id: 'alojamiento',
    name: 'Alojamiento',
    nameEn: 'Accommodation',
    icon: 'hotel',
    description: 'Hoteles para invitados, alojamiento rural',
    googlePlacesType: 'lodging',
    keywords: ['alojamiento', 'hotel', 'hospedaje', 'hostal', 'pension', 'accommodation', 'lodge', 'hotel invitados', 'alojamiento rural'],
    coverage: 'high',
  },
  {
    id: 'bar-bebidas',
    name: 'Bar y Bebidas',
    nameEn: 'Bar & Drinks',
    icon: 'wine',
    description: 'Barras móviles, coctelería, servicio de bebidas',
    googlePlacesType: 'bar',
    keywords: ['bar', 'bebidas', 'cocktail', 'coctel', 'barra movil', 'cocteleria', 'bartender', 'drinks', 'open bar', 'barra libre'],
    coverage: 'medium',
  },
  {
    id: 'iluminacion',
    name: 'Iluminación',
    nameEn: 'Lighting',
    icon: 'lightbulb',
    description: 'Iluminación técnica y decorativa',
    googlePlacesType: null,
    keywords: ['iluminacion', 'luces', 'lighting', 'led', 'iluminacion tecnica', 'luces ambiente', 'iluminacion decorativa', 'luz'],
    coverage: 'low',
  },
  {
    id: 'carpas-mobiliario',
    name: 'Carpas y Mobiliario',
    nameEn: 'Tents & Furniture',
    icon: 'warehouse',
    description: 'Alquiler de carpas, sillas, mesas, mobiliario',
    googlePlacesType: null,
    keywords: ['carpa', 'carpas', 'toldo', 'mobiliario', 'sillas', 'mesas', 'alquiler', 'furniture', 'tent', 'alquiler mobiliario', 'mesas sillas'],
    coverage: 'low',
  },
  {
    id: 'candy-bar',
    name: 'Candy Bar',
    nameEn: 'Candy Bar',
    icon: 'candy',
    description: 'Mesa de dulces, candy bar, dulces personalizados',
    googlePlacesType: 'bakery',
    keywords: ['candy bar', 'mesa dulces', 'chuches', 'golosinas', 'dulces', 'sweet table', 'candy buffet', 'mesa chuches'],
    coverage: 'medium',
  },
  {
    id: 'food-trucks',
    name: 'Food Trucks',
    nameEn: 'Food Trucks',
    icon: 'truck',
    description: 'Food trucks, comida móvil alternativa',
    googlePlacesType: 'restaurant',
    keywords: ['food truck', 'street food', 'comida movil', 'food truck boda', 'comida alternativa', 'foodtruck'],
    coverage: 'low',
  },
  {
    id: 'seguridad-staff',
    name: 'Seguridad y Staff',
    nameEn: 'Security & Staff',
    icon: 'shield',
    description: 'Personal de seguridad, coordinadores, staff',
    googlePlacesType: null,
    keywords: ['seguridad', 'staff', 'personal', 'coordinador', 'security', 'personal evento', 'seguridad privada'],
    coverage: 'low',
  },
  {
    id: 'parking',
    name: 'Parking y Valet',
    nameEn: 'Parking & Valet',
    icon: 'parking',
    description: 'Aparcamiento, servicio de valet',
    googlePlacesType: 'parking',
    keywords: ['parking', 'aparcamiento', 'valet', 'estacionamiento', 'aparcacoches', 'valet parking'],
    coverage: 'medium',
  },
  {
    id: 'cuidado-ninos',
    name: 'Cuidado de Niños',
    nameEn: 'Childcare',
    icon: 'baby',
    description: 'Niñeras, animadores infantiles, cuidado niños',
    googlePlacesType: null,
    keywords: ['niñera', 'nanny', 'cuidado niños', 'animacion infantil', 'childcare', 'canguro', 'entretenimiento niños'],
    coverage: 'low',
  },
  {
    id: 'spa-tratamientos',
    name: 'Spa y Tratamientos',
    nameEn: 'Spa & Treatments',
    icon: 'spa',
    description: 'Spa, masajes, tratamientos pre-boda',
    googlePlacesType: 'spa',
    keywords: ['spa', 'masaje', 'tratamiento', 'wellness', 'masajes', 'tratamientos belleza', 'spa dia', 'relajacion'],
    coverage: 'high',
  },
  {
    id: 'brunch-post-boda',
    name: 'Brunch Post-boda',
    nameEn: 'Post-wedding Brunch',
    icon: 'coffee',
    description: 'Desayuno o almuerzo día después de la boda',
    googlePlacesType: 'restaurant',
    keywords: ['brunch', 'desayuno', 'post boda', 'almuerzo', 'brunch post boda', 'desayuno dia despues'],
    coverage: 'medium',
  },
  {
    id: 'tecnologia-streaming',
    name: 'Tecnología y Streaming',
    nameEn: 'Technology & Streaming',
    icon: 'monitor',
    description: 'Apps personalizadas, streaming online, tecnología',
    googlePlacesType: null,
    keywords: ['streaming', 'app', 'tecnologia', 'virtual', 'online', 'boda virtual', 'transmision', 'streaming boda'],
    coverage: 'low',
  },
  {
    id: 'limpieza',
    name: 'Limpieza',
    nameEn: 'Cleaning',
    icon: 'trash',
    description: 'Servicios de limpieza post-evento',
    googlePlacesType: null,
    keywords: ['limpieza', 'cleaning', 'post evento', 'limpieza final', 'recogida'],
    coverage: 'low',
  },
  {
    id: 'luna-de-miel',
    name: 'Luna de Miel',
    nameEn: 'Honeymoon',
    icon: 'plane',
    description: 'Agencias de viajes, hoteles',
    googlePlacesType: 'lodging',
    keywords: ['luna de miel', 'viaje', 'hotel', 'honeymoon'],
    coverage: 'medium',
  },
  {
    id: 'otros',
    name: 'Otros',
    nameEn: 'Other',
    icon: 'more-horizontal',
    description: 'Otros servicios de boda',
    googlePlacesType: null,
    keywords: ['otros', 'varios', 'other'],
    coverage: 'low',
  },
];

/**
 * Obtiene una categoría por ID
 */
export function getCategoryById(id) {
  return SUPPLIER_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Obtiene categorías con alta cobertura en Google Places
 */
export function getHighCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'high');
}

/**
 * Obtiene categorías con media cobertura en Google Places
 */
export function getMediumCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'medium');
}

/**
 * Obtiene categorías con baja cobertura en Google Places
 */
export function getLowCoverageCategories() {
  return SUPPLIER_CATEGORIES.filter((cat) => cat.coverage === 'low');
}

/**
 * Busca categoría por keyword
 */
export function findCategoryByKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim();
  return SUPPLIER_CATEGORIES.find((cat) =>
    cat.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))
  );
}

/**
 * Obtiene el tipo de Google Places para una categoría
 */
export function getGooglePlacesType(categoryId) {
  const category = getCategoryById(categoryId);
  return category?.googlePlacesType || null;
}

/**
 * IDs simples para usar en código
 */
export const CATEGORY_IDS = {
  PHOTOGRAPHY: 'fotografia',
  VIDEO: 'video',
  MUSIC_CEREMONY: 'musica-ceremonia',
  MUSIC_COCKTAIL: 'musica-cocktail',
  MUSIC_PARTY: 'musica-fiesta',
  DJ: 'dj',
  SOUND_LIGHTING: 'sonido-iluminacion',
  CATERING: 'catering',
  VENUES: 'lugares',
  RESTAURANTS: 'restaurantes',
  FLOWERS: 'flores-decoracion',
  DECORATION: 'decoracion',
  DRESSES: 'vestidos-trajes',
  BEAUTY: 'belleza',
  JEWELRY: 'joyeria',
  CAKES: 'tartas',
  INVITATIONS: 'invitaciones',
  FAVORS: 'detalles',
  TRANSPORTATION: 'transporte',
  ENTERTAINMENT: 'animacion',
  PHOTOCALL: 'photocall',
  FIREWORKS: 'fuegos-artificiales',
  PLANNING: 'organizacion',
  CHURCHES: 'iglesias',
  CEREMONY: 'ceremonia',
  ACCOMMODATION: 'alojamiento',
  BAR_DRINKS: 'bar-bebidas',
  LIGHTING: 'iluminacion',
  TENTS_FURNITURE: 'carpas-mobiliario',
  CANDY_BAR: 'candy-bar',
  FOOD_TRUCKS: 'food-trucks',
  SECURITY_STAFF: 'seguridad-staff',
  PARKING: 'parking',
  CHILDCARE: 'cuidado-ninos',
  SPA_TREATMENTS: 'spa-tratamientos',
  BRUNCH: 'brunch-post-boda',
  TECHNOLOGY: 'tecnologia-streaming',
  CLEANING: 'limpieza',
  HONEYMOON: 'luna-de-miel',
  OTHER: 'otros',
};

export default SUPPLIER_CATEGORIES;
