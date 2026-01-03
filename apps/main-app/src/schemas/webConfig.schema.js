/**
 * Schema de Configuración para Webs de Boda
 * Define la estructura JSON para el sistema de builder
 */

export const webConfigSchema = {
  meta: {
    type: 'object',
    required: ['id', 'titulo', 'slug'],
    properties: {
      id: { type: 'string' },
      titulo: { type: 'string' },
      slug: { type: 'string' },
      tema: { type: 'string', enum: ['romantico', 'moderno', 'vintage', 'playero', 'elegante'] },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  },

  secciones: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'tipo', 'orden'],
      properties: {
        id: { type: 'string' },
        tipo: {
          type: 'string',
          enum: [
            'hero',
            'story',
            'eventInfo',
            'photoGallery',
            'rsvp',
            'map',
            'timeline',
            'giftList',
          ],
        },
        orden: { type: 'number' },
        visible: { type: 'boolean', default: true },
        editable: { type: 'boolean', default: true },
        datos: { type: 'object' },
        estilo: { type: 'object' },
      },
    },
  },

  estilos: {
    type: 'object',
    properties: {
      tema: { type: 'string' },
      colores: {
        type: 'object',
        properties: {
          primario: { type: 'string' },
          secundario: { type: 'string' },
          acento: { type: 'string' },
          texto: { type: 'string' },
          fondo: { type: 'string' },
        },
      },
      fuentes: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          subtitulo: { type: 'string' },
          cuerpo: { type: 'string' },
        },
      },
      espaciado: {
        type: 'string',
        enum: ['compacto', 'normal', 'amplio'],
        default: 'normal',
      },
    },
  },
};

/**
 * Plantilla por defecto para nuevas webs
 */
export const defaultWebConfig = {
  meta: {
    id: null,
    titulo: '',
    slug: '',
    tema: 'romantico',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  secciones: [
    {
      id: 'hero-1',
      tipo: 'hero',
      orden: 1,
      visible: true,
      editable: true,
      datos: {
        titulo: '',
        subtitulo: '',
        imagen: null,
        textoBoton: 'Ver más',
        mostrarCountdown: true,
      },
      estilo: {
        altura: 'screen',
        alineacion: 'center',
        overlay: 0.3,
      },
    },
    {
      id: 'story-1',
      tipo: 'story',
      orden: 2,
      visible: true,
      editable: true,
      datos: {
        titulo: 'Nuestra Historia',
        texto: '',
        fotos: [],
        layout: 'texto-izquierda',
      },
      estilo: {
        fondo: 'blanco',
      },
    },
  ],

  estilos: {
    tema: 'romantico',
    colores: {
      primario: '#FFE4E9',
      secundario: '#FF9AB8',
      acento: '#FFD700',
      texto: '#333333',
      fondo: '#FFFFFF',
    },
    fuentes: {
      titulo: 'Playfair Display',
      subtitulo: 'Lato',
      cuerpo: 'Lato',
    },
    espaciado: 'normal',
  },
};

/**
 * Temas predefinidos
 */
export const temas = {
  romantico: {
    nombre: 'Romántico',
    descripcion: 'Suave, elegante y delicado',
    colores: {
      primario: '#FFE4E9',
      secundario: '#FF9AB8',
      acento: '#FFD700',
      texto: '#333333',
      fondo: '#FFFFFF',
    },
    fuentes: {
      titulo: 'Playfair Display',
      subtitulo: 'Lato',
      cuerpo: 'Lato',
    },
  },

  moderno: {
    nombre: 'Moderno',
    descripcion: 'Minimalista y contemporáneo',
    colores: {
      primario: '#2C3E50',
      secundario: '#ECF0F1',
      acento: '#3498DB',
      texto: '#2C3E50',
      fondo: '#FFFFFF',
    },
    fuentes: {
      titulo: 'Montserrat',
      subtitulo: 'Roboto',
      cuerpo: 'Roboto',
    },
  },

  vintage: {
    nombre: 'Vintage',
    descripcion: 'Clásico con toque retro',
    colores: {
      primario: '#D4A574',
      secundario: '#8B7355',
      acento: '#C19A6B',
      texto: '#4A4A4A',
      fondo: '#F5F5DC',
    },
    fuentes: {
      titulo: 'Merriweather',
      subtitulo: 'Georgia',
      cuerpo: 'Georgia',
    },
  },

  playero: {
    nombre: 'Playero',
    descripcion: 'Fresco y veraniego',
    colores: {
      primario: '#00CED1',
      secundario: '#FFE4B5',
      acento: '#FF6347',
      texto: '#2F4F4F',
      fondo: '#F0F8FF',
    },
    fuentes: {
      titulo: 'Pacifico',
      subtitulo: 'Open Sans',
      cuerpo: 'Open Sans',
    },
  },

  elegante: {
    nombre: 'Elegante',
    descripcion: 'Sofisticado y refinado',
    colores: {
      primario: '#1C1C1C',
      secundario: '#D4AF37',
      acento: '#FFFFFF',
      texto: '#1C1C1C',
      fondo: '#F8F8F8',
    },
    fuentes: {
      titulo: 'Cormorant Garamond',
      subtitulo: 'Raleway',
      cuerpo: 'Raleway',
    },
  },
};

/**
 * Valida una configuración de web
 */
export const validarWebConfig = (config) => {
  const errores = [];

  // Validar meta
  if (!config.meta?.titulo) {
    errores.push('El título es requerido');
  }
  if (!config.meta?.slug) {
    errores.push('El slug es requerido');
  }

  // Validar secciones
  if (!Array.isArray(config.secciones) || config.secciones.length === 0) {
    errores.push('Debe haber al menos una sección');
  }

  // Validar orden de secciones
  const ordenes = config.secciones?.map((s) => s.orden) || [];
  if (new Set(ordenes).size !== ordenes.length) {
    errores.push('Los órdenes de las secciones deben ser únicos');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};
