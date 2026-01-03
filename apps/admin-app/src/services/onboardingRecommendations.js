/**
 * Onboarding Recommendations Service
 * Genera recomendaciones personalizadas basadas en el cuestionario inicial
 * FASE 0.1 - Parte 2
 */

/**
 * Genera recomendaciones personalizadas basadas en respuestas del cuestionario
 * @param {Object} onboardingData - Datos del cuestionario inicial
 * @returns {Object} Recomendaciones personalizadas
 */
export const generateRecommendations = (onboardingData) => {
  const {
    budget = '',
    timeAvailable = '',
    priorities = '',
    guestCountRange = '',
    style = '',
    concerns = '',
  } = onboardingData;

  const recommendations = {
    budgetAdvice: generateBudgetAdvice(budget, guestCountRange),
    timelineAdjustments: generateTimelineAdjustments(timeAvailable),
    priorityFocus: generatePriorityFocus(priorities),
    styleRecommendations: generateStyleRecommendations(style, budget),
    concernsSolutions: generateConcernsSolutions(concerns),
    nextSteps: generateNextSteps(timeAvailable, priorities),
    estimatedCosts: estimateCostsByCategory(budget, guestCountRange),
  };

  return recommendations;
};

/**
 * Genera consejos de presupuesto
 */
const generateBudgetAdvice = (budget, guestCount) => {
  const budgetValue = parseBudget(budget);
  const guestNumber = parseGuestCount(guestCount);
  
  if (!budgetValue || budgetValue === 'flexible') {
    return {
      message: 'Te recomendamos definir un presupuesto aproximado para poder guiarte mejor.',
      suggestion: 'El presupuesto promedio en España es de 20.000-30.000€',
      flexible: true,
    };
  }

  const perPerson = guestNumber > 0 ? Math.round(budgetValue / guestNumber) : 0;

  let category = 'ajustado';
  let advice = 'Con tu presupuesto, te recomendamos priorizar los elementos más importantes.';

  if (perPerson >= 150) {
    category = 'premium';
    advice = 'Tu presupuesto te permite acceder a proveedores premium y detalles especiales.';
  } else if (perPerson >= 100) {
    category = 'confortable';
    advice = 'Tu presupuesto es adecuado para cubrir todos los servicios principales con calidad.';
  } else if (perPerson >= 70) {
    category = 'moderado';
    advice = 'Con tu presupuesto puedes lograr una boda bonita priorizando bien.';
  }

  return {
    category,
    perPerson: perPerson > 0 ? `${perPerson}€ por invitado` : null,
    advice,
    tips: getBudgetTips(category),
  };
};

/**
 * Genera ajustes de timeline según tiempo disponible
 */
const generateTimelineAdjustments = (timeAvailable) => {
  const months = parseInt(timeAvailable, 10);
  
  if (isNaN(months)) {
    return {
      message: 'Define cuántos meses tienes para organizar todo.',
      urgency: 'unknown',
    };
  }

  let urgency = 'comfortable';
  let message = '';
  let priorities = [];

  if (months >= 18) {
    urgency = 'relaxed';
    message = 'Tienes tiempo de sobra. Puedes planificar con calma y aprovechar ofertas.';
    priorities = [
      'Investiga proveedores con calma',
      'Compara precios y negocia',
      'Considera DIY para ahorrar',
      'Planifica eventos pre-boda',
    ];
  } else if (months >= 12) {
    urgency = 'comfortable';
    message = 'Tienes un tiempo ideal para organizar todo sin prisas.';
    priorities = [
      'Reserva locación y proveedores clave',
      'Define diseño y paleta de colores',
      'Comienza con invitaciones',
      'Planifica luna de miel',
    ];
  } else if (months >= 6) {
    urgency = 'moderate';
    message = 'Tiempo ajustado pero suficiente. Necesitas ser eficiente.';
    priorities = [
      '🔴 URGENTE: Reserva locación YA',
      '🔴 URGENTE: Contrata fotógrafo y catering',
      'Define lista de invitados final',
      'Compra vestido/traje',
    ];
  } else if (months >= 3) {
    urgency = 'urgent';
    message = '⚠️ Tiempo muy ajustado. Debes actuar rápido y priorizar.';
    priorities = [
      '🚨 HOY: Confirma locación',
      '🚨 ESTA SEMANA: Contrata proveedores básicos',
      '🚨 URGENTE: Invitaciones digitales',
      'Considera simplificar algunos elementos',
    ];
  } else {
    urgency = 'critical';
    message = '🚨 ALERTA: Tiempo crítico. Necesitas ayuda profesional.';
    priorities = [
      '🚨 INMEDIATO: Contrata wedding planner',
      '🚨 HOY: Reserva lo esencial (locación, catering)',
      '🚨 Simplifica al máximo',
      'Considera posponer si es posible',
    ];
  }

  return {
    months,
    urgency,
    message,
    priorities,
    deadline: calculateDeadlines(months),
  };
};

/**
 * Genera enfoque según prioridades
 */
const generatePriorityFocus = (priorities) => {
  if (!priorities || !/^\d,\d,\d$/.test(priorities)) {
    return {
      message: 'Define tus 3 prioridades principales.',
      suggestions: [],
    };
  }

  const priorityMap = {
    1: { name: 'Fotografía/Video', budget: '15-20%', tips: ['Contrata cuanto antes', 'Revisa portfolios', 'Define shot list'] },
    2: { name: 'Comida/Catering', budget: '30-35%', tips: ['Prueba menús', 'Considera alergias', 'Plan B para clima'] },
    3: { name: 'Decoración', budget: '10-15%', tips: ['Define paleta de colores', 'Considera DIY', 'Reutiliza elementos'] },
    4: { name: 'Música', budget: '8-12%', tips: ['Reserva DJ/banda pronto', 'Lista de canciones prohibidas', 'Música ceremonia'] },
    5: { name: 'Locación', budget: '25-30%', tips: ['Visita en persona', 'Lee contrato', 'Pregunta qué incluye'] },
  };

  const order = priorities.split(',').map(n => parseInt(n.trim(), 10));
  const topThree = order.slice(0, 3).map(num => priorityMap[num]);

  return {
    top1: topThree[0],
    top2: topThree[1],
    top3: topThree[2],
    message: `Enfoca tu presupuesto y tiempo en: ${topThree[0].name}, ${topThree[1].name}, ${topThree[2].name}`,
    budgetAllocation: topThree.map(p => `${p.name}: ${p.budget}`),
  };
};

/**
 * Genera recomendaciones de estilo
 */
const generateStyleRecommendations = (style, budget) => {
  const styles = {
    rustico: {
      venues: ['Finca rústica', 'Masía', 'Granero', 'Viñedo'],
      decor: ['Madera', 'Arpillera', 'Mason jars', 'Flores silvestres', 'Guirnaldas'],
      colors: ['Tierra', 'Verde', 'Blanco roto', 'Dorado viejo'],
      savings: ['DIY centros de mesa', 'Decoración natural', 'Iluminación con velas'],
    },
    clasico: {
      venues: ['Hotel elegante', 'Palacio', 'Salón clásico', 'Iglesia'],
      decor: ['Flores elegantes', 'Candelabros', 'Manteles de lino', 'Vajilla fina'],
      colors: ['Blanco', 'Marfil', 'Dorado', 'Plata'],
      savings: ['Alquiler de decoración', 'Temporada baja', 'Centros florales sencillos'],
    },
    bohemio: {
      venues: ['Playa', 'Jardín', 'Bosque', 'Espacio abierto'],
      decor: ['Macramé', 'Alfombras', 'Cojines', 'Flores variadas', 'Dreamcatchers'],
      colors: ['Terracota', 'Mostaza', 'Verde salvia', 'Rosa suave'],
      savings: ['Decoración handmade', 'Flores de temporada', 'Mobiliario alquilado'],
    },
    moderno: {
      venues: ['Loft', 'Galería de arte', 'Azotea', 'Espacio industrial'],
      decor: ['Líneas limpias', 'Neón', 'Acrílico', 'Mínimal', 'Geometría'],
      colors: ['Blanco y negro', 'Metálicos', 'Colores bold'],
      savings: ['Menos es más', 'Iluminación LED', 'Decoración minimalista'],
    },
  };

  const styleData = styles[style] || styles.clasico;

  return {
    style,
    venues: styleData.venues,
    decor: styleData.decor,
    colorPalette: styleData.colors,
    savingTips: styleData.savings,
    inspiration: `Busca "${style} wedding" en Pinterest para inspiración`,
  };
};

/**
 * Genera soluciones para preocupaciones
 */
const generateConcernsSolutions = (concerns) => {
  if (!concerns || concerns.trim() === '') {
    return {
      message: 'No has mencionado preocupaciones específicas.',
      generalAdvice: [
        'Contrata un coordinador del día',
        'Ten plan B para clima',
        'Comunica claramente con proveedores',
        'Delega responsabilidades',
      ],
    };
  }

  const concernsLower = concerns.toLowerCase();
  const solutions = [];

  const concernKeywords = {
    'clima|lluvia|tiempo': {
      title: 'Clima adverso',
      solutions: [
        'Alquila carpa o tienda como plan B',
        'Elige locación con espacios interiores',
        'Ten paraguas elegantes de sobra',
        'Comunica plan B a invitados',
      ],
    },
    'presupuesto|dinero|caro|coste': {
      title: 'Presupuesto ajustado',
      solutions: [
        'Prioriza lo realmente importante',
        'Considera temporada baja',
        'DIY para elementos decorativos',
        'Negocia con proveedores',
        'Simplifica menú y bebidas',
      ],
    },
    'invitados|gente|familia|amigos': {
      title: 'Gestión de invitados',
      solutions: [
        'Define criterios claros desde el inicio',
        'Comunica decisiones con firmeza',
        'Usa sistema RSVP digital',
        'Ten lista de espera',
      ],
    },
    'estrés|ansiedad|agobio|nervios': {
      title: 'Estrés y ansiedad',
      solutions: [
        'Delega tareas a familiares/amigos',
        'Contrata coordinador del día',
        'Toma descansos regulares',
        'No busques la perfección',
        'Practica técnicas de relajación',
      ],
    },
    'familia|suegros|padres|conflicto': {
      title: 'Conflictos familiares',
      solutions: [
        'Establece límites claros',
        'Comunica decisiones como pareja',
        'Busca compromisos razonables',
        'No cedes en lo importante para vosotros',
      ],
    },
  };

  Object.entries(concernKeywords).forEach(([pattern, data]) => {
    if (new RegExp(pattern, 'i').test(concernsLower)) {
      solutions.push(data);
    }
  });

  if (solutions.length === 0) {
    solutions.push({
      title: 'Preocupación general',
      solutions: [
        'Habla con tu pareja regularmente',
        'Haz lista de preocupaciones y tackléalas',
        'Pide ayuda cuando la necesites',
        'Recuerda: no tiene que ser perfecto',
      ],
    });
  }

  return {
    identified: solutions,
    userConcern: concerns,
  };
};

/**
 * Genera próximos pasos según contexto
 */
const generateNextSteps = (timeAvailable, priorities) => {
  const months = parseInt(timeAvailable, 10) || 12;
  
  const steps = [
    {
      order: 1,
      task: 'Definir presupuesto final',
      why: 'Todo depende del presupuesto disponible',
      duration: '1-2 días',
      urgent: months < 6,
    },
    {
      order: 2,
      task: 'Reservar locación',
      why: 'Los mejores lugares se agotan rápido',
      duration: '2-4 semanas',
      urgent: months < 9,
    },
    {
      order: 3,
      task: 'Contratar fotógrafo',
      why: 'Los buenos fotógrafos se reservan con meses de antelación',
      duration: '1-2 semanas',
      urgent: months < 9,
    },
    {
      order: 4,
      task: 'Definir lista de invitados',
      why: 'Afecta presupuesto, locación y catering',
      duration: '1 semana',
      urgent: months < 6,
    },
    {
      order: 5,
      task: 'Contratar catering',
      why: 'Uno de los mayores gastos, requiere pruebas',
      duration: '2-3 semanas',
      urgent: months < 6,
    },
  ];

  return steps.filter(step => {
    if (months < 6) return step.urgent;
    return true;
  });
};

/**
 * Estima costes por categoría
 */
const estimateCostsByCategory = (budget, guestCount) => {
  const budgetValue = parseBudget(budget);
  
  if (!budgetValue || budgetValue === 'flexible') {
    return null;
  }

  const distribution = {
    'Locación': 0.25,
    'Catering': 0.30,
    'Fotografía/Video': 0.15,
    'Decoración': 0.10,
    'Música': 0.08,
    'Vestimenta': 0.07,
    'Otros': 0.05,
  };

  const estimates = {};
  Object.entries(distribution).forEach(([category, percentage]) => {
    estimates[category] = Math.round(budgetValue * percentage);
  });

  return estimates;
};

// Helpers

const parseBudget = (budget) => {
  if (!budget) return null;
  if (budget.toLowerCase().includes('flexible')) return 'flexible';
  
  const cleaned = budget.replace(/[^\d]/g, '');
  const value = parseInt(cleaned, 10);
  return isNaN(value) ? null : value;
};

const parseGuestCount = (guestCount) => {
  if (!guestCount) return 0;
  
  const ranges = {
    'menos-50': 40,
    '50-100': 75,
    '100-150': 125,
    'mas-150': 200,
  };
  
  return ranges[guestCount] || 100;
};

const getBudgetTips = (category) => {
  const tips = {
    premium: [
      'Considera proveedores de lujo',
      'Invierte en experiencias únicas',
      'Personaliza al máximo',
    ],
    confortable: [
      'Equilibra calidad y precio',
      'Negocia paquetes completos',
      'Invierte en lo importante',
    ],
    moderado: [
      'Prioriza elementos clave',
      'Busca ofertas y descuentos',
      'Considera temporada baja',
    ],
    ajustado: [
      'Simplifica donde puedas',
      'DIY para ahorrar',
      'Lista de invitados ajustada',
    ],
  };
  
  return tips[category] || tips.moderado;
};

const calculateDeadlines = (months) => {
  const now = new Date();
  const deadlines = {};
  
  const addMonths = (date, m) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + m);
    return result;
  };
  
  if (months >= 12) {
    deadlines['Reservar locación'] = addMonths(now, 2);
    deadlines['Contratar fotógrafo'] = addMonths(now, 3);
    deadlines['Vestido/traje'] = addMonths(now, 6);
    deadlines['Invitaciones'] = addMonths(now, months - 3);
  } else if (months >= 6) {
    deadlines['Reservar locación'] = addMonths(now, 1);
    deadlines['Contratar fotógrafo'] = addMonths(now, 1);
    deadlines['Vestido/traje'] = addMonths(now, 2);
    deadlines['Invitaciones'] = addMonths(now, months - 2);
  } else {
    deadlines['TODO INMEDIATO'] = addMonths(now, 0);
  }
  
  return deadlines;
};

export default {
  generateRecommendations,
};
