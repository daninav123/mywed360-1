/**
 * Configuración de productos y precios de Stripe
 * Basado en docs/planes-suscripcion.md - Modelo de licencias por boda (octubre 2025)
 */

export const STRIPE_PRODUCTS = {
  // Planes para Parejas (pago único por boda)
  couples: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'EUR',
      type: 'free',
      interval: null,
      features: [
        '1 boda',
        'Hasta 80 invitados',
        'Seating plan básico',
        'Gestión de finanzas',
        'Directorio de proveedores',
        'Publicidad visible',
      ],
    },
    weddingPass: {
      id: 'wedding_pass',
      name: 'Wedding Pass',
      price: 5000, // 50 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: null,
      stripePriceId: process.env.STRIPE_PRICE_WEDDING_PASS,
      features: [
        'Todo lo de Free',
        'Invitados ilimitados',
        'Contacto directo con proveedores',
        'Protocolo completo',
        '50 diseños web',
        'Soporte prioritario',
        'Plantillas premium',
      ],
      validityDays: 30, // Vigencia: fecha_boda + 30 días
    },
    weddingPassPlus: {
      id: 'wedding_pass_plus',
      name: 'Wedding Pass Plus',
      price: 8500, // 85 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: null,
      stripePriceId: process.env.STRIPE_PRICE_WEDDING_PASS_PLUS,
      features: [
        'Todo lo de Wedding Pass',
        'Sin marca MyWed360',
        'Biblioteca completa de diseños',
        'Editor web premium',
        'Galería de recuerdos',
        '1 ayudante con acceso completo',
      ],
      validityDays: 30,
      whiteLabel: true,
    },
    postWeddingExtension: {
      id: 'post_wedding_extension',
      name: 'Extensión post-boda',
      price: 1500, // 15 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: null,
      stripePriceId: process.env.STRIPE_PRICE_POST_WEDDING_EXTENSION,
      features: [
        '90 días extra de acceso editable',
        'Compatible con cualquier plan',
      ],
      validityDays: 90,
    },
  },

  // Paquetes para Wedding Planners (suscripción con trial de 30 días)
  planners: {
    pack5Monthly: {
      id: 'planner_pack5_monthly',
      name: 'Planner Pack 5 (Mensual)',
      price: 4167, // 41,67 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_PACK5_MONTHLY,
      trialDays: 30,
      features: [
        'Hasta 5 bodas activas simultáneas',
        'Herramientas profesionales',
        'Priorización en directorio',
        'Soporte prioritario',
        '2 colaboradores por cliente',
      ],
      maxWeddings: 5,
      totalCost: 50000, // 500 EUR total (12 cuotas)
    },
    pack5Annual: {
      id: 'planner_pack5_annual',
      name: 'Planner Pack 5 (Anual)',
      price: 42500, // 425 EUR en centavos (15% descuento)
      currency: 'EUR',
      type: 'one_time',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_PACK5_ANNUAL,
      features: [
        'Hasta 5 bodas activas simultáneas',
        'Herramientas profesionales',
        'Priorización en directorio',
        'Soporte prioritario',
        '2 colaboradores por cliente',
        '15% descuento vs mensual',
      ],
      maxWeddings: 5,
      discount: 15,
    },
    pack15Monthly: {
      id: 'planner_pack15_monthly',
      name: 'Planner Pack 15 (Mensual)',
      price: 11250, // 112,50 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_PACK15_MONTHLY,
      trialDays: 30,
      features: [
        'Hasta 15 bodas activas simultáneas',
        'Analytics por cliente',
        'Priorización extendida',
        'Soporte prioritario',
        '2 colaboradores por cliente',
      ],
      maxWeddings: 15,
      totalCost: 135000, // 1.350 EUR total
    },
    pack15Annual: {
      id: 'planner_pack15_annual',
      name: 'Planner Pack 15 (Anual)',
      price: 114750, // 1.147,50 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_PACK15_ANNUAL,
      features: [
        'Hasta 15 bodas activas simultáneas',
        'Analytics por cliente',
        'Priorización extendida',
        'Soporte prioritario',
        '2 colaboradores por cliente',
        '15% descuento vs mensual',
      ],
      maxWeddings: 15,
      discount: 15,
    },
    teams40Monthly: {
      id: 'teams40_monthly',
      name: 'Teams 40 (Mensual)',
      price: 26667, // 266,67 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRICE_TEAMS40_MONTHLY,
      trialDays: 30,
      features: [
        '40 bodas activas por año natural',
        '1 perfil principal + 3 adicionales',
        'Dashboard consolidado de equipo',
        'Colaboración avanzada',
        'Soporte dedicado',
      ],
      maxWeddings: 40,
      maxUsers: 4,
      totalCost: 320000, // 3.200 EUR total
    },
    teams40Annual: {
      id: 'teams40_annual',
      name: 'Teams 40 (Anual)',
      price: 272000, // 2.720 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_TEAMS40_ANNUAL,
      features: [
        '40 bodas activas por año natural',
        '1 perfil principal + 3 adicionales',
        'Dashboard consolidado de equipo',
        'Colaboración avanzada',
        'Soporte dedicado',
        '15% descuento vs mensual',
      ],
      maxWeddings: 40,
      maxUsers: 4,
      discount: 15,
    },
    unlimitedMonthly: {
      id: 'teams_unlimited_monthly',
      name: 'Teams Ilimitado (Mensual)',
      price: 41667, // 416,67 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY,
      trialDays: 30,
      features: [
        'Bodas ilimitadas',
        'Perfiles ilimitados',
        'White-label completo',
        'Dominio personalizado',
        'Soporte dedicado 24/7',
        'Formación personalizada',
        'Acceso API configurado',
      ],
      maxWeddings: -1,
      maxUsers: -1,
      totalCost: 500000, // 5.000 EUR total
      whiteLabel: true,
    },
    unlimitedAnnual: {
      id: 'teams_unlimited_annual',
      name: 'Teams Ilimitado (Anual)',
      price: 425000, // 4.250 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL,
      features: [
        'Bodas ilimitadas',
        'Perfiles ilimitados',
        'White-label completo',
        'Dominio personalizado',
        'Soporte dedicado 24/7',
        'Formación personalizada',
        'Acceso API configurado',
        '15% descuento vs mensual',
      ],
      maxWeddings: -1,
      maxUsers: -1,
      discount: 15,
      whiteLabel: true,
    },
  },
};

/**
 * Obtiene la configuración de un producto por ID
 */
export function getProductById(productId) {
  // Buscar en couples
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.couples)) {
    if (product.id === productId) return product;
  }
  // Buscar en planners
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.planners)) {
    if (product.id === productId) return product;
  }
  return null;
}

/**
 * Obtiene la configuración de un producto por stripePriceId
 */
export function getProductByPriceId(priceId) {
  // Buscar en couples
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.couples)) {
    if (product.stripePriceId === priceId) return product;
  }
  // Buscar en planners
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.planners)) {
    if (product.stripePriceId === priceId) return product;
  }
  return null;
}

/**
 * Obtiene todos los productos de un tipo
 */
export function getProductsByType(type) {
  if (type === 'couples') return Object.values(STRIPE_PRODUCTS.couples);
  if (type === 'planners') return Object.values(STRIPE_PRODUCTS.planners);
  return [];
}
