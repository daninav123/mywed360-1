/**
 * Configuración de productos y precios de Stripe
 * Basado en docs/planes-suscripcion.md
 */

export const STRIPE_PRODUCTS = {
  // Planes para Parejas
  couples: {
    free: {
      id: 'free',
      name: 'Básico (Free)',
      price: 0,
      currency: 'EUR',
      type: 'free',
      interval: null,
      features: [
        '1 evento',
        'Invitados hasta 80',
        'Seating plan básico',
        'Gestión de finanzas',
        'Directorio de proveedores',
      ],
    },
    annual: {
      id: 'couple_annual',
      name: 'Anual',
      price: 3500, // 35 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_COUPLE_ANNUAL, // Se configura en Stripe
      features: [
        'Todo lo del plan Free',
        'Sin límite de invitados',
        'Contacto directo con proveedores',
        'Protocolo completo de ceremonia',
        'Hasta 50 diseños web',
        'Soporte prioritario',
      ],
    },
    plus: {
      id: 'couple_plus',
      name: 'Plus',
      price: 5500, // 55 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_COUPLE_PLUS,
      features: [
        'Todo lo del plan Anual',
        'Sin marca MyWed360',
        '1 ayudante con acceso gratuito',
        'Invitaciones digitales premium',
        'Seating plan impreso sin marca',
      ],
    },
    eventPlus: {
      id: 'event_plus',
      name: 'Boda Plus',
      price: 2000, // 20 EUR en centavos
      currency: 'EUR',
      type: 'one_time',
      interval: null,
      stripePriceId: process.env.STRIPE_PRICE_EVENT_PLUS,
      features: [
        'Sin marca MyWed360',
        'Compatible con cualquier plan',
        'Pago único por evento',
      ],
    },
  },

  // Planes para Wedding Planners
  planners: {
    planner1: {
      id: 'planner_1',
      name: 'Wedding Planner 1',
      price: 12000, // 120 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_1,
      features: [
        'Hasta 5 bodas simultáneas',
        'Priorización en el sistema',
        'Clientes acceden a funciones premium',
        'Herramientas profesionales',
        'Soporte prioritario',
      ],
      maxWeddings: 5,
    },
    planner2: {
      id: 'planner_2',
      name: 'Wedding Planner 2',
      price: 20000, // 200 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_2,
      features: [
        'Hasta 10 bodas simultáneas',
        'Todo de Wedding Planner 1',
        'Analytics avanzados',
        'Reportes detallados por cliente',
      ],
      maxWeddings: 10,
    },
    teams: {
      id: 'planner_teams',
      name: 'Teams Wedding Planner',
      price: 80000, // 800 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_TEAMS,
      features: [
        'Hasta 40 bodas anuales',
        '1 perfil principal',
        '3 perfiles extra',
        'Dashboard consolidado',
        'Colaboración avanzada',
      ],
      maxWeddings: 40,
      maxUsers: 4,
    },
    unlimited: {
      id: 'planner_unlimited',
      name: 'Teams Wedding Planner Ilimitado',
      price: 150000, // 1500 EUR en centavos
      currency: 'EUR',
      type: 'subscription',
      interval: 'year',
      stripePriceId: process.env.STRIPE_PRICE_PLANNER_UNLIMITED,
      features: [
        'Bodas ilimitadas',
        'Perfiles de planners ilimitados',
        'White-label completo',
        'Personalización completa de la interfaz',
        'Dominio personalizado opcional',
        'Todas las funcionalidades premium',
        'Soporte dedicado 24/7',
        'Integración API personalizada',
        'Formación y onboarding personalizado',
      ],
      maxWeddings: -1, // Ilimitado
      maxUsers: -1, // Ilimitado
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
