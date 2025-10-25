import i18n from '../i18n';

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
  PREMIUM_PLUS: 'premium_plusi18n.t('common.definicion_planes_para_wedding_planners_export')planner_exploratory',
  STUDIO: 'planner_studio', // Wedding Planner 1
  STUDIO_PLUS: 'planner_studio_plus',
  AGENCY: 'planner_agency', // Wedding Planner 2
  AGENCY_PLUS: 'planner_agency_plus',
  TEAMS: 'planner_teams',
  TEAMS_UNLIMITED: 'planner_teams_unlimitedi18n.t('common.definicion_planes_para_asistentes_export_const')assistanti18n.t('common.todos_los_planes_disponibles_export_const')Gratis',
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
      branding: 'maloveapp' // Marca MaLoveApp visible
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
      branding: 'maloveapp'
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
    billingPeriod: 'yearlyi18n.t('common.limits_activeweddings_maxguests_ilimitado_maxevents_ceremonia')priority',
      supportSLA: '4h',
      branding: 'maloveapp'
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
    displayName: 'Premiumi18n.t('common.price_pago_unico_por_boda_segun')EUR',
    billingPeriod: 'per_weddingi18n.t('common.limits_activeweddings_maxguests_ilimitado_maxevents_ceremonia')priority',
      supportSLA: '4h',
      branding: 'maloveapp'
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
      whiteLabel: true, // Sin marca MaLoveApp
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
    displayName: 'Premium Plusi18n.t('common.price_pago_unico_por_boda_segun')EUR',
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
      supportLevel: 'communityi18n.t('common.supportsla_null_features_editguests_true_edittasks')Invitados ilimitadosi18n.t('common.const_exceeded_currentguests_maxguests_return_exceeded')Eventos ilimitadosi18n.t('common.const_exceeded_currentevents_maxevents_return_exceeded')Asistentes ilimitadosi18n.t('common.const_exceeded_currentassistants_maxassistants_return_exceeded')exportPDF', 'useAI', 'whiteLabel')
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
      reason: allowed ? 'Permitido en tu plani18n.t('common.esta_funcion_requiere_plan_superior_obtiene')owner', 'planner', 'assistant')
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
        reason: i18n.t('common.plan_valido')
      };
    }

    const isUpgrade = toConfig.price > fromConfig.price;
    const isDowngrade = toConfig.price < fromConfig.price;

    return {
      isUpgrade,
      isDowngrade,
      allowed: true, // La lógica de negocio determina si se permite
      reason: isUpgrade ? 'Upgrade disponible' : isDowngrade ? i18n.t('common.downgrade_requiere_validacion') : 'Cambio lateral'
    };
  }
}

// Exportar instancia singleton
const planLimitsService = new PlanLimitsService();

export default planLimitsService;
export { PLAN_LIMITS, PlanLimitsService };
