/**
 * PlanLimitsService - Servicio para gestión de límites por plan de suscripción
 * 
 * Define y valida los límites según el plan contratado (Gratis, Premium, Premium Plus)
 * para parejas y diferentes niveles para wedding planners.
 * 
 * @see docs/flujos-especificos/flujo-25-suscripciones.md
 * @see docs/planes-suscripcion.md
 */

// Definición de planes para parejas (owners)
export const OWNER_PLANS = {
  FREE: 'free',
  BASIC: 'basic', // Alias para FREE (compatibilidad con docs/planes-suscripcion.md)
  ANNUAL: 'annual',
  PREMIUM: 'premium',
  PLUS: 'plus',
  PREMIUM_PLUS: 'premium_plus'
};

// Definición de planes para wedding planners
export const PLANNER_PLANS = {
  EXPLORATORY: 'planner_exploratory',
  STUDIO: 'planner_studio', // Wedding Planner 1
  STUDIO_PLUS: 'planner_studio_plus',
  AGENCY: 'planner_agency', // Wedding Planner 2
  AGENCY_PLUS: 'planner_agency_plus',
  TEAMS: 'planner_teams',
  TEAMS_UNLIMITED: 'planner_teams_unlimited'
};

// Definición de planes para asistentes
export const ASSISTANT_PLANS = {
  ASSISTANT: 'assistant'
};

// Todos los planes disponibles
export const ALL_PLANS = {
  ...OWNER_PLANS,
  ...PLANNER_PLANS,
  ...ASSISTANT_PLANS
};

/**
 * Configuración de límites por plan
 * Basado en docs/flujos-especificos/flujo-25-suscripciones.md y docs/planes-suscripcion.md
 */
const PLAN_LIMITS = {
  // ===== PLANES PARA PAREJAS (OWNERS) =====
  [OWNER_PLANS.FREE]: {
    displayName: 'Gratis',
    price: 0,
    currency: 'EUR',
    billingPeriod: null,
    limits: {
      activeWeddings: 1,
      maxGuests: 80,
      maxEvents: 1, // Solo ceremonia
      maxAssistants: 0,
      maxPlanners: 0,
      seatingAdvanced: false,
      aiTimeline: false,
      legalDocuments: false,
      emailAutomations: false,
      webDesigns: 5,
      whiteLabel: false,
      exportsPDF: false,
      exportsExcel: false,
      concierge: false,
      integrations: false,
      supportLevel: 'community',
      supportSLA: null,
      branding: 'mywed360' // Marca MyWed360 visible
    },
    features: {
      basicChecklist: true,
      manualBudget: true,
      supplierDirectory: true,
      basicSeating: true
    }
  },

  [OWNER_PLANS.BASIC]: {
    // Alias para FREE (compatibilidad)
    displayName: 'Básico',
    price: 0,
    currency: 'EUR',
    billingPeriod: null,
    limits: {
      activeWeddings: 1,
      maxGuests: 80,
      maxEvents: 1,
      maxAssistants: 0,
      maxPlanners: 0,
      seatingAdvanced: false,
      aiTimeline: false,
      legalDocuments: false,
      emailAutomations: false,
      webDesigns: 5,
      whiteLabel: false,
      exportsPDF: false,
      exportsExcel: false,
      concierge: false,
      integrations: false,
      supportLevel: 'community',
      supportSLA: null,
      branding: 'mywed360'
    },
    features: {
      basicChecklist: true,
      manualBudget: true,
      supplierDirectory: true,
      basicSeating: true,
      ads: true // Publicidad incluida
    }
  },

  [OWNER_PLANS.ANNUAL]: {
    displayName: 'Anual',
    price: 35,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 1,
      maxGuests: -1, // Ilimitado
      maxEvents: 3, // Ceremonia, cóctel, banquete
      maxAssistants: 0,
      maxPlanners: 1,
      seatingAdvanced: false,
      aiTimeline: false,
      legalDocuments: false,
      emailAutomations: false,
      webDesigns: 50,
      whiteLabel: false,
      exportsPDF: false,
      exportsExcel: false,
      concierge: false,
      integrations: false,
      supportLevel: 'priority',
      supportSLA: '4h',
      branding: 'mywed360'
    },
    features: {
      basicChecklist: true,
      manualBudget: true,
      supplierDirectory: true,
      supplierContact: true, // Contacto directo con proveedores
      basicSeating: true
    }
  },

  [OWNER_PLANS.PREMIUM]: {
    displayName: 'Premium',
    price: 35, // Pago único por boda según docs/flujo-25
    currency: 'EUR',
    billingPeriod: 'per_wedding',
    limits: {
      activeWeddings: 1,
      maxGuests: -1, // Ilimitado
      maxEvents: 3, // Ceremonia, cóctel, banquete
      maxAssistants: 3,
      maxPlanners: 1,
      seatingAdvanced: true,
      aiTimeline: true,
      legalDocuments: true,
      emailAutomations: true,
      webDesigns: 20,
      whiteLabel: false,
      exportsPDF: true,
      exportsExcel: true,
      concierge: false,
      integrations: false,
      supportLevel: 'priority',
      supportSLA: '4h',
      branding: 'mywed360'
    },
    features: {
      advancedChecklist: true,
      automatedBudget: true,
      supplierDirectory: true,
      supplierContact: true,
      advancedSeating: true,
      customWebPortal: true,
      pdfExports: true,
      excelExports: true
    }
  },

  [OWNER_PLANS.PLUS]: {
    displayName: 'Plus',
    price: 55,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 1,
      maxGuests: -1,
      maxEvents: 3,
      maxAssistants: 1, // Permite 1 ayudante con acceso gratuito
      maxPlanners: 1,
      seatingAdvanced: true,
      aiTimeline: true,
      legalDocuments: true,
      emailAutomations: true,
      webDesigns: 50,
      whiteLabel: true, // Sin marca MyWed360
      exportsPDF: true,
      exportsExcel: true,
      concierge: false,
      integrations: false,
      supportLevel: 'priority',
      supportSLA: '4h',
      branding: 'none' // Sin marca
    },
    features: {
      advancedChecklist: true,
      automatedBudget: true,
      supplierDirectory: true,
      supplierContact: true,
      advancedSeating: true,
      customWebPortal: true,
      pdfExports: true,
      excelExports: true,
      whiteLabelWeb: true,
      whiteLabelPDF: true,
      whiteLabelSeating: true,
      assistantIncluded: true
    }
  },

  [OWNER_PLANS.PREMIUM_PLUS]: {
    displayName: 'Premium Plus',
    price: 55, // Pago único por boda según docs/flujo-25
    currency: 'EUR',
    billingPeriod: 'per_wedding',
    limits: {
      activeWeddings: 1,
      maxGuests: -1,
      maxEvents: -1, // Ilimitado
      maxAssistants: 10,
      maxPlanners: 1,
      seatingAdvanced: true,
      aiTimeline: true,
      legalDocuments: true,
      emailAutomations: true,
      webDesigns: -1, // Ilimitado
      whiteLabel: true,
      exportsPDF: true,
      exportsExcel: true,
      concierge: true,
      integrations: true, // Google Calendar, Zapier
      supportLevel: 'dedicated',
      supportSLA: '2h',
      branding: 'none'
    },
    features: {
      advancedChecklist: true,
      automatedBudget: true,
      supplierDirectory: true,
      supplierContact: true,
      advancedSeating: true,
      customWebPortal: true,
      pdfExports: true,
      excelExports: true,
      whiteLabelWeb: true,
      whiteLabelPDF: true,
      whiteLabelSeating: true,
      dedicatedConcierge: true,
      externalIntegrations: true,
      exclusiveTemplates: true,
      specialistSessions: true
    }
  },

  // ===== PLANES PARA WEDDING PLANNERS =====
  [PLANNER_PLANS.EXPLORATORY]: {
    displayName: 'Exploratorio',
    price: 0,
    currency: 'EUR',
    billingPeriod: null,
    limits: {
      activeWeddings: 0, // No puede crear bodas reales
      maxGuests: 0,
      maxEvents: 0,
      maxAssistants: 0,
      maxCollaborators: 0,
      demoAccess: true,
      marketplacePriority: false,
      whiteLabel: false,
      analytics: false,
      supportLevel: 'community',
      supportSLA: null
    },
    features: {
      demoData: true,
      onboardingPrep: true
    }
  },

  [PLANNER_PLANS.STUDIO]: {
    displayName: 'Studio (WP1)',
    price: 120,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 5,
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: 0,
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: false,
      analytics: 'basic',
      supportLevel: 'priority',
      supportSLA: '4h'
    },
    features: {
      marketplaceHighlight: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      unlimitedExports: true,
      clientsPremiumAccess: true // Clientes Free acceden a premium
    }
  },

  [PLANNER_PLANS.STUDIO_PLUS]: {
    displayName: 'Studio Plus',
    price: 200,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 5,
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: 7,
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: 'partial',
      analytics: 'advanced',
      supportLevel: 'priority',
      supportSLA: '4h'
    },
    features: {
      marketplaceHighlight: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      unlimitedExports: true,
      clientsPremiumAccess: true,
      supplierConcierge: true,
      preferredNegotiations: true,
      specialistSessions: true
    }
  },

  [PLANNER_PLANS.AGENCY]: {
    displayName: 'Agency (WP2)',
    price: 200,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 10,
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: 10,
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: false,
      analytics: 'advanced',
      supportLevel: 'priority',
      supportSLA: '4h'
    },
    features: {
      marketplaceHighlight: true,
      marketplacePro: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      multiClientAutomations: true,
      unlimitedExports: true,
      clientsPremiumAccess: true,
      advancedAnalytics: true,
      customReports: true
    }
  },

  [PLANNER_PLANS.AGENCY_PLUS]: {
    displayName: 'Agency Plus',
    price: 400,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 10,
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: 10,
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: true,
      analytics: 'advanced',
      supportLevel: 'dedicated',
      supportSLA: '2h'
    },
    features: {
      marketplaceHighlight: true,
      marketplacePro: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      multiClientAutomations: true,
      unlimitedExports: true,
      clientsPremiumAccess: true,
      advancedAnalytics: true,
      customReports: true,
      whiteLabel: true,
      apiIntegrations: true,
      personalizedOnboarding: true
    }
  },

  [PLANNER_PLANS.TEAMS]: {
    displayName: 'Teams',
    price: 800,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: 40, // 40 bodas anuales
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: 3, // 1 principal + 3 extra
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: false,
      analytics: 'advanced',
      supportLevel: 'dedicated',
      supportSLA: '2h'
    },
    features: {
      marketplaceHighlight: true,
      marketplacePro: true,
      teamManagement: true,
      taskAssignment: true,
      consolidatedDashboard: true,
      teamCollaboration: true,
      teamReports: true,
      teamProductivity: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      multiClientAutomations: true,
      unlimitedExports: true,
      clientsPremiumAccess: true
    }
  },

  [PLANNER_PLANS.TEAMS_UNLIMITED]: {
    displayName: 'Teams Unlimited',
    price: 1500,
    currency: 'EUR',
    billingPeriod: 'yearly',
    limits: {
      activeWeddings: -1, // Ilimitado
      maxGuests: -1,
      maxEvents: -1,
      maxAssistants: -1,
      maxCollaborators: -1, // Ilimitado
      demoAccess: false,
      marketplacePriority: true,
      whiteLabel: true,
      analytics: 'enterprise',
      supportLevel: '24/7',
      supportSLA: '1h'
    },
    features: {
      marketplaceHighlight: true,
      marketplacePro: true,
      teamManagement: true,
      taskAssignment: true,
      consolidatedDashboard: true,
      teamCollaboration: true,
      teamReports: true,
      teamProductivity: true,
      duplicableTemplates: true,
      multiClientChecklist: true,
      multiClientAutomations: true,
      unlimitedExports: true,
      clientsPremiumAccess: true,
      whiteLabel: true,
      customDomain: true,
      apiIntegrations: true,
      customApi: true,
      personalizedTraining: true,
      personalizedOnboarding: true,
      dedicatedSupport247: true
    }
  },

  // ===== PLANES PARA ASISTENTES =====
  [ASSISTANT_PLANS.ASSISTANT]: {
    displayName: 'Asistente',
    price: 0,
    currency: 'EUR',
    billingPeriod: null,
    limits: {
      activeWeddings: 1, // Limitado a una boda activa
      maxGuests: -1, // Hereda del owner
      maxEvents: -1,
      maxAssistants: 0,
      maxPlanners: 0,
      inheritFromOwner: true, // Hereda nivel del owner
      supportLevel: 'community',
      supportSLA: null
    },
    features: {
      editGuests: true,
      editTasks: true,
      editTimeline: true,
      editSeating: true,
      viewBudget: false, // Sin permisos de facturación
      sendInvitations: false // Sin re-invitaciones
    }
  }
};

/**
 * Servicio para gestión de límites de planes
 */
class PlanLimitsService {
  /**
   * Obtiene la configuración de un plan
   * @param {string} planId - ID del plan
   * @returns {Object|null} Configuración del plan o null si no existe
   */
  getPlanConfig(planId) {
    return PLAN_LIMITS[planId] || null;
  }

  /**
   * Obtiene los límites de un plan
   * @param {string} planId - ID del plan
   * @returns {Object} Límites del plan
   */
  getPlanLimits(planId) {
    const config = this.getPlanConfig(planId);
    return config ? config.limits : {};
  }

  /**
   * Obtiene las características de un plan
   * @param {string} planId - ID del plan
   * @returns {Object} Características del plan
   */
  getPlanFeatures(planId) {
    const config = this.getPlanConfig(planId);
    return config ? config.features : {};
  }

  /**
   * Verifica si un plan tiene una característica específica
   * @param {string} planId - ID del plan
   * @param {string} feature - Nombre de la característica
   * @returns {boolean} true si tiene la característica
   */
  hasFeature(planId, feature) {
    const features = this.getPlanFeatures(planId);
    return features[feature] === true;
  }

  /**
   * Verifica si se ha alcanzado el límite de invitados
   * @param {string} planId - ID del plan
   * @param {number} currentGuests - Número actual de invitados
   * @returns {Object} { exceeded: boolean, limit: number, current: number }
   */
  checkGuestLimit(planId, currentGuests) {
    const limits = this.getPlanLimits(planId);
    const maxGuests = limits.maxGuests;
    
    if (maxGuests === -1) {
      return { exceeded: false, limit: -1, current: currentGuests, message: 'Invitados ilimitados' };
    }
    
    const exceeded = currentGuests > maxGuests;
    return {
      exceeded,
      limit: maxGuests,
      current: currentGuests,
      message: exceeded 
        ? `Has alcanzado el límite de ${maxGuests} invitados` 
        : `${currentGuests} de ${maxGuests} invitados`
    };
  }

  /**
   * Verifica si se ha alcanzado el límite de eventos
   * @param {string} planId - ID del plan
   * @param {number} currentEvents - Número actual de eventos
   * @returns {Object} { exceeded: boolean, limit: number, current: number }
   */
  checkEventLimit(planId, currentEvents) {
    const limits = this.getPlanLimits(planId);
    const maxEvents = limits.maxEvents;
    
    if (maxEvents === -1) {
      return { exceeded: false, limit: -1, current: currentEvents, message: 'Eventos ilimitados' };
    }
    
    const exceeded = currentEvents > maxEvents;
    return {
      exceeded,
      limit: maxEvents,
      current: currentEvents,
      message: exceeded 
        ? `Has alcanzado el límite de ${maxEvents} eventos` 
        : `${currentEvents} de ${maxEvents} eventos`
    };
  }

  /**
   * Verifica si se ha alcanzado el límite de asistentes
   * @param {string} planId - ID del plan
   * @param {number} currentAssistants - Número actual de asistentes
   * @returns {Object} { exceeded: boolean, limit: number, current: number }
   */
  checkAssistantLimit(planId, currentAssistants) {
    const limits = this.getPlanLimits(planId);
    const maxAssistants = limits.maxAssistants;
    
    if (maxAssistants === -1) {
      return { exceeded: false, limit: -1, current: currentAssistants, message: 'Asistentes ilimitados' };
    }
    
    const exceeded = currentAssistants > maxAssistants;
    return {
      exceeded,
      limit: maxAssistants,
      current: currentAssistants,
      message: exceeded 
        ? `Has alcanzado el límite de ${maxAssistants} asistentes` 
        : `${currentAssistants} de ${maxAssistants} asistentes`
    };
  }

  /**
   * Verifica si se puede realizar una acción según el plan
   * @param {string} planId - ID del plan
   * @param {string} action - Acción a verificar (e.g., 'exportPDF', 'useAI', 'whiteLabel')
   * @returns {Object} { allowed: boolean, reason: string }
   */
  canPerformAction(planId, action) {
    const limits = this.getPlanLimits(planId);
    const features = this.getPlanFeatures(planId);

    const actionMap = {
      'exportPDF': limits.exportsPDF || features.pdfExports,
      'exportExcel': limits.exportsExcel || features.excelExports,
      'useAI': limits.aiTimeline,
      'whiteLabel': limits.whiteLabel,
      'advancedSeating': limits.seatingAdvanced || features.advancedSeating,
      'emailAutomations': limits.emailAutomations,
      'legalDocuments': limits.legalDocuments,
      'concierge': limits.concierge || features.dedicatedConcierge,
      'integrations': limits.integrations || features.externalIntegrations
    };

    const allowed = actionMap[action] === true;
    
    return {
      allowed,
      reason: allowed ? 'Permitido en tu plan' : `Esta función requiere un plan superior`
    };
  }

  /**
   * Obtiene el plan por defecto para un rol
   * @param {string} role - Rol del usuario ('owner', 'planner', 'assistant')
   * @returns {string} ID del plan por defecto
   */
  getDefaultPlanForRole(role) {
    const roleMap = {
      'owner': OWNER_PLANS.FREE,
      'pareja': OWNER_PLANS.FREE,
      'planner': PLANNER_PLANS.EXPLORATORY,
      'wedding_planner': PLANNER_PLANS.EXPLORATORY,
      'assistant': ASSISTANT_PLANS.ASSISTANT,
      'ayudante': ASSISTANT_PLANS.ASSISTANT
    };
    
    return roleMap[role] || OWNER_PLANS.FREE;
  }

  /**
   * Obtiene todos los planes disponibles para un rol
   * @param {string} role - Rol del usuario
   * @returns {Array} Lista de planes disponibles
   */
  getAvailablePlansForRole(role) {
    if (role === 'owner' || role === 'pareja') {
      return Object.keys(OWNER_PLANS).map(key => ({
        id: OWNER_PLANS[key],
        ...PLAN_LIMITS[OWNER_PLANS[key]]
      }));
    }
    
    if (role === 'planner' || role === 'wedding_planner') {
      return Object.keys(PLANNER_PLANS).map(key => ({
        id: PLANNER_PLANS[key],
        ...PLAN_LIMITS[PLANNER_PLANS[key]]
      }));
    }
    
    return [];
  }

  /**
   * Compara dos planes y determina si es un upgrade o downgrade
   * @param {string} fromPlan - Plan actual
   * @param {string} toPlan - Plan destino
   * @returns {Object} { isUpgrade: boolean, isDowngrade: boolean, allowed: boolean, reason: string }
   */
  comparePlans(fromPlan, toPlan) {
    const fromConfig = this.getPlanConfig(fromPlan);
    const toConfig = this.getPlanConfig(toPlan);

    if (!fromConfig || !toConfig) {
      return {
        isUpgrade: false,
        isDowngrade: false,
        allowed: false,
        reason: 'Plan no válido'
      };
    }

    const isUpgrade = toConfig.price > fromConfig.price;
    const isDowngrade = toConfig.price < fromConfig.price;

    return {
      isUpgrade,
      isDowngrade,
      allowed: true, // La lógica de negocio determina si se permite
      reason: isUpgrade ? 'Upgrade disponible' : isDowngrade ? 'Downgrade requiere validación' : 'Cambio lateral'
    };
  }
}

// Exportar instancia singleton
const planLimitsService = new PlanLimitsService();

export default planLimitsService;
export { PLAN_LIMITS, PlanLimitsService };
