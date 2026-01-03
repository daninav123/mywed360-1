/**
 * 🎨 Utilidades para determinar el estado visual de las tarjetas de servicios
 */

export const SERVICE_STATES = {
  CONTRACTED: 'contracted',
  OVER_BUDGET: 'over_budget',
  HAS_QUOTES: 'has_quotes',
  CONTACTED: 'contacted',
  HAS_FAVORITES: 'has_favorites',
  NOT_STARTED: 'not_started',
};

export const STATE_CONFIG = {
  [SERVICE_STATES.CONTRACTED]: {
    label: 'Contratado',
    emoji: '✅',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    priority: 6,
  },
  [SERVICE_STATES.OVER_BUDGET]: {
    label: 'Sobre presupuesto',
    emoji: '⚠️',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    priority: 7,
  },
  [SERVICE_STATES.HAS_QUOTES]: {
    label: 'presupuestos',
    emoji: '📋',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    priority: 5,
  },
  [SERVICE_STATES.CONTACTED]: {
    label: 'contactados',
    emoji: '📧',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    priority: 4,
  },
  [SERVICE_STATES.HAS_FAVORITES]: {
    label: 'favoritos',
    emoji: '⭐',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    priority: 3,
  },
  [SERVICE_STATES.NOT_STARTED]: {
    label: 'Sin iniciar',
    emoji: '⚪',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    priority: 1,
  },
};

/**
 * Determina el estado de una categoría de servicio
 */
export function getServiceCardState(categoryData, wedding = null) {
  const {
    favoritos = 0,
    contactados = 0,
    presupuesto = null,
  } = categoryData;

  // Obtener datos de la boda si existen
  const weddingService = wedding?.services?.[categoryData.key];
  const hasContractedSuppliers = 
    weddingService?.suppliers?.some(s => s.status === 'active') || false;
  
  const totalCategoryBudget = weddingService?.totalBudget || 0;
  const budgetLimit = wedding?.budget?.allocated?.[categoryData.key] || 
                      presupuesto || 
                      0;

  // 1. Si tiene proveedor contratado
  if (hasContractedSuppliers) {
    // Verificar si supera el presupuesto
    if (budgetLimit > 0 && totalCategoryBudget > budgetLimit) {
      return {
        state: SERVICE_STATES.OVER_BUDGET,
        ...STATE_CONFIG[SERVICE_STATES.OVER_BUDGET],
        count: totalCategoryBudget - budgetLimit,
        displayText: `+${totalCategoryBudget - budgetLimit}€ sobre presupuesto`,
      };
    }
    
    const activeSuppliers = weddingService.suppliers.filter(s => s.status === 'active');
    return {
      state: SERVICE_STATES.CONTRACTED,
      ...STATE_CONFIG[SERVICE_STATES.CONTRACTED],
      count: activeSuppliers.length,
      displayText: activeSuppliers.length > 1 
        ? `${activeSuppliers.length} proveedores` 
        : activeSuppliers[0]?.supplierName || 'Contratado',
    };
  }

  // 2. Si tiene presupuestos recibidos (contactados > 0 con presupuestos)
  // Nota: Asumimos que "contactados" incluye solo aquellos que han enviado presupuesto
  // Si necesitas diferenciar, deberías tener un campo separado "presupuestosRecibidos"
  if (contactados > 0) {
    return {
      state: SERVICE_STATES.HAS_QUOTES,
      ...STATE_CONFIG[SERVICE_STATES.HAS_QUOTES],
      count: contactados,
      displayText: `${contactados} ${contactados === 1 ? 'presupuesto' : 'presupuestos'}`,
    };
  }

  // 3. Si tiene favoritos pero no contactados
  if (favoritos > 0) {
    return {
      state: SERVICE_STATES.HAS_FAVORITES,
      ...STATE_CONFIG[SERVICE_STATES.HAS_FAVORITES],
      count: favoritos,
      displayText: `${favoritos} ${favoritos === 1 ? 'favorito' : 'favoritos'}`,
    };
  }

  // 4. Sin actividad
  return {
    state: SERVICE_STATES.NOT_STARTED,
    ...STATE_CONFIG[SERVICE_STATES.NOT_STARTED],
    count: 0,
    displayText: 'Sin iniciar',
  };
}

/**
 * Obtiene las clases CSS para una tarjeta según su estado
 */
export function getCardClasses(stateInfo) {
  return {
    container: `${stateInfo.bgColor} ${stateInfo.borderColor} border-2 rounded-lg transition-all hover:shadow-md`,
    badge: `${stateInfo.badgeBg} ${stateInfo.badgeText} px-2 py-1 rounded text-xs font-semibold`,
    text: stateInfo.textColor,
  };
}
