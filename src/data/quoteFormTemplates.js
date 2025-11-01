/**
 * 💰 Templates de Formularios para Solicitud de Presupuestos
 *
 * Define qué campos mostrar según la categoría del proveedor.
 * Sistema dinámico y extensible.
 */

/**
 * 🎯 FOTOGRAFÍA - Template Específico
 */
export const FOTOGRAFIA_TEMPLATE = {
  category: 'fotografia',
  name: 'Fotografía',
  icon: '📸',
  fields: [
    {
      id: 'horasCobertura',
      label: '¿Cuántas horas de cobertura necesitas?',
      type: 'select',
      options: [
        { value: '4', label: '4 horas (ceremonia o banquete)' },
        { value: '6', label: '6 horas (lo esencial)' },
        { value: '8', label: '8 horas (recomendado)' },
        { value: '10', label: '10 horas (completo)' },
        { value: '12', label: '12 horas (día completo)' },
      ],
      default: '8',
      required: true,
      weight: 'high', // Afecta mucho al precio
      helpText: 'La mayoría de bodas necesitan 8-10 horas',
    },
    {
      id: 'album',
      label: '¿Quieres álbum físico?',
      type: 'boolean',
      default: true,
      required: true,
      weight: 'medium',
      helpText: 'Suele costar entre 300-800€ adicionales',
    },
    {
      id: 'tipoAlbum',
      label: 'Tipo de álbum',
      type: 'select',
      options: [
        { value: 'basico', label: 'Básico (20x20cm, 30 páginas)' },
        { value: 'premium', label: 'Premium (30x30cm, 50 páginas)' },
        { value: 'luxury', label: 'Luxury (40x40cm, 80 páginas)' },
      ],
      default: 'premium',
      dependsOn: { album: true }, // Solo mostrar si album = true
      weight: 'medium',
    },
    {
      id: 'fotosDigitales',
      label: '¿Cuántas fotos digitales?',
      type: 'select',
      options: [
        { value: 'seleccion', label: 'Selección editada (300-500 fotos)' },
        { value: 'todas', label: 'Todas las fotos editadas (800-1200)' },
        { value: 'completo', label: 'Todas + sin editar (1500-2000)' },
      ],
      default: 'todas',
      required: true,
      weight: 'low',
    },
    {
      id: 'segundoFotografo',
      label: '¿Segundo fotógrafo?',
      type: 'boolean',
      default: false,
      weight: 'medium',
      helpText: 'Recomendado para bodas de más de 100 invitados',
      smartSuggestion: (weddingInfo) => weddingInfo.guestCount > 100,
    },
    {
      id: 'sesionCompromiso',
      label: '¿Sesión de compromiso?',
      type: 'boolean',
      default: false,
      weight: 'low',
      helpText: 'Sesión previa de fotos de pareja',
    },
    {
      id: 'estilo',
      label: 'Estilo de fotografía preferido',
      type: 'select',
      options: [
        { value: 'natural', label: 'Natural / Documental' },
        { value: 'editorial', label: 'Editorial / Revista' },
        { value: 'artistico', label: 'Artístico / Creativo' },
        { value: 'clasico', label: 'Clásico / Tradicional' },
        { value: 'vintage', label: 'Vintage / Retro' },
      ],
      default: 'natural',
      required: false,
      weight: 'low',
    },
  ],
};

/**
 * 🎥 VIDEO - Template Específico
 */
export const VIDEO_TEMPLATE = {
  category: 'video',
  name: 'Vídeo',
  icon: '🎥',
  fields: [
    {
      id: 'paquete',
      label: '¿Qué paquete de vídeo necesitas?',
      type: 'select',
      options: [
        { value: 'corto', label: 'Corto (highlight 3-5 min)' },
        { value: 'medio', label: 'Medio (highlight + ceremonia)' },
        { value: 'completo', label: 'Completo (día entero editado)' },
        { value: 'premium', label: 'Premium (múltiples ediciones + raw)' },
      ],
      default: 'medio',
      required: true,
      weight: 'high',
      helpText: 'El paquete determina las horas y entregables',
    },
    {
      id: 'horasGrabacion',
      label: 'Horas de grabación',
      type: 'select',
      options: [
        { value: '4', label: '4 horas' },
        { value: '6', label: '6 horas' },
        { value: '8', label: '8 horas' },
        { value: '10', label: '10 horas' },
        { value: '12', label: '12 horas (día completo)' },
      ],
      default: '8',
      required: true,
      weight: 'high',
    },
    {
      id: 'highlightVideo',
      label: '¿Vídeo highlight (3-5 min)?',
      type: 'boolean',
      default: true,
      required: true,
      weight: 'medium',
      helpText: 'Resumen emotivo de la boda con música',
    },
    {
      id: 'videoCeremonia',
      label: '¿Vídeo completo de ceremonia?',
      type: 'boolean',
      default: true,
      weight: 'medium',
    },
    {
      id: 'videoBanquete',
      label: '¿Vídeo completo de banquete?',
      type: 'boolean',
      default: false,
      weight: 'medium',
    },
    {
      id: 'dron',
      label: '¿Tomas con dron?',
      type: 'boolean',
      default: false,
      weight: 'medium',
      helpText: 'Tomas aéreas espectaculares (+300-500€)',
    },
    {
      id: 'entregaEdicion',
      label: 'Tiempo de entrega preferido',
      type: 'select',
      options: [
        { value: '1mes', label: '1 mes (express +coste)' },
        { value: '2meses', label: '2 meses (normal)' },
        { value: '3meses', label: '3 meses (estándar)' },
      ],
      default: '2meses',
      weight: 'low',
    },
  ],
};

/**
 * 🍽️ CATERING - Template Específico
 */
export const CATERING_TEMPLATE = {
  category: 'catering',
  name: 'Catering',
  icon: '🍽️',
  fields: [
    {
      id: 'tipoServicio',
      label: 'Tipo de servicio',
      type: 'select',
      options: [
        { value: 'sentado', label: 'Menú sentado (formal)' },
        { value: 'buffet', label: 'Buffet libre' },
        { value: 'cocktail', label: 'Cocktail / Finger food' },
        { value: 'mixto', label: 'Mixto (cocktail + sentado)' },
      ],
      default: 'sentado',
      required: true,
      weight: 'high',
    },
    {
      id: 'numeroPlatos',
      label: 'Número de platos',
      type: 'select',
      options: [
        { value: '2', label: '2 platos' },
        { value: '3', label: '3 platos (recomendado)' },
        { value: '4', label: '4 platos' },
        { value: '5', label: '5 platos (completo)' },
      ],
      default: '3',
      dependsOn: { tipoServicio: ['sentado', 'mixto'] },
      required: true,
      weight: 'high',
    },
    {
      id: 'barralibre',
      label: '¿Barra libre?',
      type: 'boolean',
      default: true,
      required: true,
      weight: 'high',
      helpText: 'Bebidas ilimitadas durante el banquete',
    },
    {
      id: 'horasBarraLibre',
      label: 'Horas de barra libre',
      type: 'select',
      options: [
        { value: '3', label: '3 horas' },
        { value: '4', label: '4 horas' },
        { value: '5', label: '5 horas (recomendado)' },
        { value: '6', label: '6 horas' },
        { value: 'ilimitado', label: 'Ilimitado' },
      ],
      default: '5',
      dependsOn: { barralibre: true },
      weight: 'medium',
    },
    {
      id: 'cocteles',
      label: '¿Cócteles premium?',
      type: 'boolean',
      default: false,
      dependsOn: { barralibre: true },
      weight: 'medium',
      helpText: 'Mojitos, gin-tonics, etc. (+coste)',
    },
    {
      id: 'restricciones',
      label: 'Restricciones alimentarias',
      type: 'multi-select',
      options: [
        { value: 'vegetariano', label: 'Vegetariano' },
        { value: 'vegano', label: 'Vegano' },
        { value: 'celiaco', label: 'Celíaco / Sin gluten' },
        { value: 'lactosa', label: 'Sin lactosa' },
        { value: 'halal', label: 'Halal' },
        { value: 'kosher', label: 'Kosher' },
      ],
      default: [],
      required: false,
      weight: 'medium',
      helpText: 'Selecciona todas las que apliquen',
    },
    {
      id: 'tipoComida',
      label: 'Tipo de comida',
      type: 'select',
      options: [
        { value: 'mediterranea', label: 'Mediterránea' },
        { value: 'tradicional', label: 'Tradicional española' },
        { value: 'fusion', label: 'Fusión / Moderna' },
        { value: 'internacional', label: 'Internacional' },
        { value: 'tematica', label: 'Temática (especificar en mensaje)' },
      ],
      default: 'mediterranea',
      weight: 'low',
    },
    {
      id: 'tartaNupcial',
      label: '¿Tarta nupcial incluida?',
      type: 'boolean',
      default: true,
      weight: 'low',
    },
  ],
};

/**
 * 🎵 DJ / MÚSICA - Template Específico
 */
export const MUSICA_TEMPLATE = {
  category: 'dj',
  name: 'DJ / Música',
  icon: '🎵',
  fields: [
    {
      id: 'horas',
      label: '¿Cuántas horas de música?',
      type: 'select',
      options: [
        { value: '3', label: '3 horas' },
        { value: '4', label: '4 horas' },
        { value: '5', label: '5 horas (recomendado)' },
        { value: '6', label: '6 horas' },
        { value: '7', label: '7+ horas' },
      ],
      default: '5',
      required: true,
      weight: 'high',
    },
    {
      id: 'tipoMusica',
      label: 'Estilos de música preferidos',
      type: 'multi-select',
      options: [
        { value: 'pop', label: 'Pop' },
        { value: 'rock', label: 'Rock' },
        { value: 'latina', label: 'Latina / Reggaeton' },
        { value: 'electronica', label: 'Electrónica / Dance' },
        { value: 'clasicos', label: 'Clásicos / Oldies' },
        { value: 'romantica', label: 'Romántica' },
        { value: 'jazz', label: 'Jazz / Swing' },
      ],
      default: ['pop', 'rock', 'latina'],
      required: true,
      weight: 'medium',
      helpText: 'Selecciona todos los estilos que quieras incluir',
    },
    {
      id: 'equipoSonido',
      label: '¿Necesitas equipo de sonido?',
      type: 'boolean',
      default: true,
      weight: 'medium',
      helpText: 'Altavoces, mesa de mezclas, etc.',
    },
    {
      id: 'equipoLuces',
      label: '¿Necesitas equipo de luces?',
      type: 'boolean',
      default: true,
      weight: 'medium',
      helpText: 'Luces LED, focos, efectos',
    },
    {
      id: 'presentacion',
      label: '¿DJ con presentación/animación?',
      type: 'boolean',
      default: false,
      weight: 'low',
      helpText: 'DJ que presenta momentos y anima la fiesta',
    },
    {
      id: 'listaNegra',
      label: 'Música que NO quieres',
      type: 'text',
      placeholder: 'Ej: reggaeton, heavy metal...',
      required: false,
      weight: 'low',
    },
  ],
};

/**
 * 🎯 TEMPLATE GENÉRICO - Para categorías sin template específico
 */
export const GENERIC_TEMPLATE = {
  category: 'generic',
  name: 'Genérico',
  icon: '📋',
  fields: [
    {
      id: 'descripcion',
      label: 'Describe qué necesitas',
      type: 'textarea',
      placeholder: 'Cuéntale al proveedor exactamente qué buscas...',
      required: true,
      weight: 'high',
      rows: 5,
    },
    {
      id: 'presupuestoAproximado',
      label: 'Presupuesto aproximado para este servicio',
      type: 'number',
      placeholder: '1500',
      suffix: '€',
      required: false,
      weight: 'medium',
      helpText: 'Opcional, pero ayuda al proveedor a ajustar su oferta',
    },
  ],
};

/**
 * 📦 MAPA DE TEMPLATES POR CATEGORÍA
 *
 * Mapea cada categoryId a su template correspondiente.
 * Si una categoría no tiene template, usa GENERIC_TEMPLATE.
 */
export const QUOTE_FORM_TEMPLATES = {
  // Templates específicos
  fotografia: FOTOGRAFIA_TEMPLATE,
  video: VIDEO_TEMPLATE,
  catering: CATERING_TEMPLATE,
  dj: MUSICA_TEMPLATE,
  musica: MUSICA_TEMPLATE, // Alias

  // TODO: Añadir más templates en futuras iteraciones
  // 'lugares': VENUE_TEMPLATE,
  // 'flores-decoracion': FLORES_TEMPLATE,
  // 'decoracion': DECORACION_TEMPLATE,
  // 'vestidos-trajes': ATTIRE_TEMPLATE,
  // 'belleza': BEAUTY_TEMPLATE,

  // Fallback genérico
  generic: GENERIC_TEMPLATE,
};

/**
 * Obtiene el template apropiado para una categoría
 *
 * @param {string} categoryId - ID de la categoría del proveedor
 * @returns {Object} Template del formulario
 */
export function getQuoteFormTemplate(categoryId) {
  if (!categoryId) {
    return GENERIC_TEMPLATE;
  }

  // Buscar template específico
  const template = QUOTE_FORM_TEMPLATES[categoryId];

  // Si no existe, usar genérico
  return template || GENERIC_TEMPLATE;
}

/**
 * Calcula qué campos son visibles según dependencias
 *
 * @param {Object} template - Template del formulario
 * @param {Object} formData - Datos actuales del formulario
 * @returns {Array} Lista de campos visibles
 */
export function getVisibleFields(template, formData = {}) {
  return template.fields.filter((field) => {
    // Si no tiene dependencias, siempre visible
    if (!field.dependsOn) {
      return true;
    }

    // Si es un objeto { fieldName: value }
    if (typeof field.dependsOn === 'object' && !Array.isArray(field.dependsOn)) {
      return Object.entries(field.dependsOn).every(([key, expectedValue]) => {
        const actualValue = formData[key];

        // Si expectedValue es array, verificar que actualValue esté en el array
        if (Array.isArray(expectedValue)) {
          return expectedValue.includes(actualValue);
        }

        // Comparación directa
        return actualValue === expectedValue;
      });
    }

    return true;
  });
}

/**
 * Calcula el progreso del formulario
 *
 * @param {Object} template - Template del formulario
 * @param {Object} formData - Datos actuales del formulario
 * @returns {number} Progreso de 0 a 100
 */
export function calculateProgress(template, formData = {}) {
  const visibleFields = getVisibleFields(template, formData);
  const requiredFields = visibleFields.filter((f) => f.required);

  if (requiredFields.length === 0) {
    return 100;
  }

  const filledFields = requiredFields.filter((field) => {
    const value = formData[field.id];

    // Verificar según tipo
    if (field.type === 'boolean') {
      return value !== undefined && value !== null;
    }

    if (field.type === 'multi-select') {
      return Array.isArray(value) && value.length > 0;
    }

    // Texto, select, number, etc.
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
}

export default QUOTE_FORM_TEMPLATES;
