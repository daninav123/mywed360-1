/**
 * Template de diseño de boda
 * Estructura para almacenar preferencias de estilo, colores, decoración, etc.
 */

export const WEDDING_DESIGN_TEMPLATE = {
  // Visión y estilo general
  vision: {
    overallStyle: {
      primary: '',
      secondary: '',
      keywords: [],
    },
    mood: {
      atmosphere: '',
      energy: '',
      feeling: '',
    },
    inspiration: {
      images: [],
      likes: '',
      dislikes: '',
      mustHave: '',
      avoid: '',
    }
  },

  // Identidad visual
  visualIdentity: {
    colors: {
      primary: '',
      secondary: '',
      accent: '',
      palette: [],
      description: '',
    },
    patterns: {
      florals: false,
      geometric: false,
      organic: false,
      minimal: false,
    },
    materials: [],
  },

  // Decoración
  decoration: {
    flowers: {
      preferred: [],
      colors: '',
      style: '',
      avoid: [],
    },
    centerpieces: {
      style: '',
      elements: [],
      preferences: '',
    },
    lighting: {
      type: [],
      mood: '',
      special: '',
    },
    extras: {
      candles: false,
      signage: '',
      textiles: '',
      other: '',
    }
  },

  // Ceremonia
  ceremony: {
    type: '',
    structure: {
      entrance: '',
      readings: [],
      vows: '',
      rituals: [],
      music: {
        entrance: '',
        ceremony: '',
        exit: '',
      }
    },
    decoration: {
      altar: '',
      aisle: '',
      seating: '',
      backdrop: '',
    },
    roles: {
      officiant: '',
      bridesmaids: 0,
      groomsmen: 0,
      flowergirl: false,
      ringbearer: false,
    }
  },

  // Recepción
  reception: {
    layout: {
      style: '',
      seatingPlan: '',
      dancefloor: '',
      bar: '',
    },
    food: {
      style: '',
      preferences: [],
      signature: '',
      cake: {
        style: '',
        flavors: [],
        design: '',
      }
    },
    entertainment: {
      music: {
        style: [],
        liveMusic: false,
        dj: false,
        playlist: '',
      },
      activities: [],
      surprises: '',
    }
  },

  // Experiencia de invitados
  guestExperience: {
    welcome: {
      welcomeBags: false,
      welcomeNote: '',
      localTips: '',
    },
    during: {
      kidsArea: false,
      loungeArea: false,
      smokingArea: false,
      specialNeeds: '',
    },
    favors: {
      type: '',
      personalized: false,
      description: '',
    },
    afterParty: '',
    brunch: '',
  },

  // Detalles personales
  personalTouches: {
    story: {
      howMet: '',
      proposal: '',
      journey: '',
      displayStory: false,
    },
    traditions: {
      cultural: [],
      family: [],
      new: [],
    },
    symbolism: {
      colors: '',
      flowers: '',
      elements: '',
    }
  }
};

/**
 * Inicializa weddingDesign con el template
 */
export function initializeWeddingDesign() {
  return JSON.parse(JSON.stringify(WEDDING_DESIGN_TEMPLATE));
}

/**
 * Estilos de boda predefinidos
 */
export const WEDDING_STYLES = [
  { id: 'rustico', name: 'Rústico', emoji: '🌾', keywords: ['natural', 'campestre', 'madera'] },
  { id: 'clasico', name: 'Clásico', emoji: '👑', keywords: ['elegante', 'tradicional', 'formal'] },
  { id: 'moderno', name: 'Moderno', emoji: '✨', keywords: ['minimal', 'contemporáneo', 'clean'] },
  { id: 'boho', name: 'Boho', emoji: '🌸', keywords: ['libre', 'hippie', 'natural'] },
  { id: 'vintage', name: 'Vintage', emoji: '📻', keywords: ['retro', 'antiguo', 'nostálgico'] },
  { id: 'garden', name: 'Garden', emoji: '🌿', keywords: ['jardín', 'flores', 'aire libre'] },
  { id: 'playa', name: 'Playa', emoji: '🏖️', keywords: ['mar', 'arena', 'tropical'] },
  { id: 'romantico', name: 'Romántico', emoji: '💕', keywords: ['amor', 'delicado', 'soft'] },
  { id: 'glam', name: 'Glamuroso', emoji: '💎', keywords: ['lujo', 'brillante', 'opulento'] },
  { id: 'industrial', name: 'Industrial', emoji: '🏭', keywords: ['urbano', 'metal', 'brick'] },
];

/**
 * Atmósferas sugeridas
 */
export const ATMOSPHERES = [
  { id: 'intimo', name: 'Íntimo', emoji: '🕯️' },
  { id: 'festivo', name: 'Festivo', emoji: '🎉' },
  { id: 'romantico', name: 'Romántico', emoji: '💕' },
  { id: 'elegante', name: 'Elegante', emoji: '🎩' },
  { id: 'relajado', name: 'Relajado', emoji: '🌴' },
  { id: 'energico', name: 'Enérgico', emoji: '⚡' },
];

export default WEDDING_DESIGN_TEMPLATE;
