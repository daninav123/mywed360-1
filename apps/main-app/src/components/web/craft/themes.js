/**
 * Temas predefinidos para el Web Builder
 */

export const TEMAS_PREDEFINIDOS = {
  romantico: {
    id: 'romantico',
    nombre: '💗 Romántico',
    descripcion: 'Suave, cálido y lleno de amor',
    colores: {
      primario: '#FF6B9D', // Rosa pastel
      secundario: '#C44569', // Rosa oscuro
      acento: '#FFC371', // Dorado suave
      fondo: '#FFF5F7', // Rosa muy claro
      texto: '#2C3E50', // Gris oscuro
      textoClaro: '#FFFFFF', // Blanco
    },
    fuentes: {
      titulo: 'Playfair Display',
      texto: 'Cormorant Garamond',
      categoria: 'Serif elegante',
    },
    gradientes: {
      hero: 'linear-gradient(135deg, #FF6B9D 0%, #FFC371 100%)',
      seccion: 'linear-gradient(180deg, #FFF5F7 0%, #FFE5EC 100%)',
    },
    fondo: {
      tipo: 'color', // 'color', 'imagen', 'gradiente', 'patron'
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: {
      flores: false, // Flores en esquinas
      petalos: false, // Pétalos cayendo
      divisores: false, // Divisores florales
      animaciones: true, // Animaciones al scroll (recomendado)
      marcos: false, // Marcos en fotos
    },
  },

  moderno: {
    id: 'moderno',
    nombre: '🎨 Moderno',
    descripcion: 'Limpio, minimalista y contemporáneo',
    colores: {
      primario: '#3498db', // Azul
      secundario: '#2c3e50', // Azul oscuro
      acento: '#e74c3c', // Rojo
      fondo: '#FFFFFF', // Blanco
      texto: '#2c3e50', // Gris oscuro
      textoClaro: '#FFFFFF', // Blanco
    },
    fuentes: {
      titulo: 'Montserrat',
      texto: 'Open Sans',
      categoria: 'Sans-serif moderno',
    },
    gradientes: {
      hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      seccion: 'linear-gradient(180deg, #FFFFFF 0%, #f8f9fa 100%)',
    },
    fondo: {
      tipo: 'color',
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: {
      flores: false,
      petalos: false,
      divisores: false,
      animaciones: true,
      marcos: false,
    },
  },

  elegante: {
    id: 'elegante',
    nombre: '✨ Elegante',
    descripcion: 'Sofisticado, clásico y atemporal',
    colores: {
      primario: '#1a1a1a', // Negro elegante
      secundario: '#8B7355', // Dorado viejo
      acento: '#C9B037', // Dorado
      fondo: '#FFFFFF', // Blanco
      texto: '#1a1a1a', // Negro
      textoClaro: '#FFFFFF', // Blanco
    },
    fuentes: {
      titulo: 'Cinzel',
      texto: 'Lora',
      categoria: 'Serif clásico',
    },
    gradientes: {
      hero: 'linear-gradient(135deg, #1a1a1a 0%, #8B7355 100%)',
      seccion: 'linear-gradient(180deg, #FFFFFF 0%, #f5f5f5 100%)',
    },
    fondo: {
      tipo: 'color',
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: {
      flores: false,
      petalos: false,
      divisores: false,
      animaciones: true,
      marcos: false,
    },
  },

  bohemio: {
    id: 'bohemio',
    nombre: '🌿 Bohemio',
    descripcion: 'Natural, relajado y terrenal',
    colores: {
      primario: '#6B8E23', // Verde oliva
      secundario: '#8B4513', // Marrón tierra
      acento: '#DAA520', // Dorado mostaza
      fondo: '#F5F5DC', // Beige
      texto: '#3E2723', // Marrón oscuro
      textoClaro: '#FFFFFF', // Blanco
    },
    fuentes: {
      titulo: 'Libre Baskerville',
      texto: 'Raleway',
      categoria: 'Serif natural',
    },
    gradientes: {
      hero: 'linear-gradient(135deg, #6B8E23 0%, #8B4513 100%)',
      seccion: 'linear-gradient(180deg, #F5F5DC 0%, #FFF8DC 100%)',
    },
    fondo: {
      tipo: 'color',
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: {
      flores: false,
      petalos: false,
      divisores: false,
      animaciones: true,
      marcos: false,
    },
  },

  playero: {
    id: 'playero',
    nombre: '🌊 Playero',
    descripcion: 'Fresco, luminoso y tropical',
    colores: {
      primario: '#00BCD4', // Turquesa
      secundario: '#0097A7', // Azul agua
      acento: '#FFB300', // Amarillo sol
      fondo: '#E0F7FA', // Azul muy claro
      texto: '#006064', // Azul oscuro
      textoClaro: '#FFFFFF', // Blanco
    },
    fuentes: {
      titulo: 'Pacifico',
      texto: 'Quicksand',
      categoria: 'Display playero',
    },
    gradientes: {
      hero: 'linear-gradient(135deg, #00BCD4 0%, #FFB300 100%)',
      seccion: 'linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)',
    },
    fondo: {
      tipo: 'color',
      imagen: null,
      gradiente: null,
      patron: null,
      ajuste: 'cover',
      repeticion: 'no-repeat',
      opacidad: 1,
    },
    decoraciones: {
      flores: false,
      petalos: false,
      divisores: false,
      animaciones: true,
      marcos: false,
    },
  },
};

/**
 * Tema por defecto
 */
export const TEMA_DEFAULT = TEMAS_PREDEFINIDOS.romantico;

/**
 * Obtener tema por ID
 */
export const getTema = (id) => {
  return TEMAS_PREDEFINIDOS[id] || TEMA_DEFAULT;
};

/**
 * Lista de temas para el selector
 */
export const LISTA_TEMAS = Object.values(TEMAS_PREDEFINIDOS);
