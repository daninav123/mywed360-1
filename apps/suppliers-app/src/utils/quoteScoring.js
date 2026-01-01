/**
 * 🤖 Sistema de Scoring y Análisis de Presupuestos
 *
 * Calcula puntuaciones automáticas para presupuestos basándose en:
 * - Precio vs presupuesto disponible
 * - Servicios ofrecidos vs solicitados
 * - Condiciones comerciales
 * - Reputación del proveedor
 */

/**
 * Porcentaje del presupuesto total recomendado por categoría
 */
const CATEGORY_BUDGET_PERCENTAGES = {
  fotografia: 12,
  video: 10,
  catering: 35,
  dj: 5,
  florista: 8,
  venue: 25,
  vestido: 15,
  traje: 8,
  peluqueria: 3,
  maquillaje: 2,
  invitaciones: 2,
  decoracion: 5,
  transporte: 3,
  otros: 5,
};

/**
 * Calcula el score completo de un presupuesto
 */
export function calculateQuoteScore(quote, request, userPreferences = null) {
  const scores = {
    price: calculatePriceScore(quote, request),
    service: calculateServiceScore(quote, request),
    terms: calculateTermsScore(quote),
    reputation: calculateReputationScore(quote.supplier || {}),
  };

  // Pesos por defecto si no hay preferencias del usuario
  const weights = userPreferences || {
    price: 30,
    service: 40,
    terms: 20,
    reputation: 10,
  };

  // Calcular score total ponderado
  const totalScore =
    (scores.price * weights.price +
      scores.service * weights.service +
      scores.terms * weights.terms +
      scores.reputation * weights.reputation) /
    100;

  return {
    total: Math.round(totalScore),
    breakdown: scores,
    rating: scoreToRating(totalScore),
    strengths: identifyStrengths(scores),
    weaknesses: identifyWeaknesses(scores),
  };
}

/**
 * 1. Score de Precio (0-100)
 * Evalúa si el precio está dentro del presupuesto y es competitivo
 */
function calculatePriceScore(quote, request) {
  const userBudget = request.weddingInfo?.presupuestoTotal || 0;
  const category = quote.supplierCategory || 'otros';
  const categoryPercentage = CATEGORY_BUDGET_PERCENTAGES[category] || 5;
  const categoryBudget = (userBudget * categoryPercentage) / 100;
  const quotePrice = quote.pricing?.total || quote.total || 0;

  if (!quotePrice || !categoryBudget) return 50; // Si no hay datos, neutral

  const ratio = quotePrice / categoryBudget;

  // Mejor score si está dentro del presupuesto y es competitivo
  if (ratio <= 0.7) return 100; // Excelente precio (30% por debajo)
  if (ratio <= 0.9) return 95; // Muy buen precio (10% por debajo)
  if (ratio <= 1.0) return 90; // Dentro de presupuesto exacto
  if (ratio <= 1.1) return 80; // 10% sobre presupuesto
  if (ratio <= 1.2) return 65; // 20% sobre presupuesto
  if (ratio <= 1.3) return 50; // 30% sobre presupuesto
  if (ratio <= 1.5) return 35; // 50% sobre presupuesto
  return 20; // Muy por encima del presupuesto
}

/**
 * 2. Score de Servicio (0-100)
 * Compara lo solicitado vs lo ofrecido
 */
function calculateServiceScore(quote, request) {
  let score = 50; // Base neutral

  const requestedFields = request.serviceDetails || {};
  const offeredFields = quote.serviceOffered || {};

  // Si no hay detalles, no podemos comparar
  if (Object.keys(requestedFields).length === 0) return 70; // Neutral-positivo

  let matches = 0;
  let total = 0;

  // Comparar cada campo solicitado
  Object.keys(requestedFields).forEach((key) => {
    total++;

    const requested = requestedFields[key];
    const offered = offeredFields[key];

    // Match exacto
    if (offered === requested) {
      matches++;
      score += 4;
    }
    // Para campos numéricos, si ofrece más es mejor
    else if (typeof requested === 'number' && typeof offered === 'number') {
      if (offered >= requested) {
        matches += 0.8;
        score += 3;
      }
    }
    // Para booleanos, si solicitó true y ofrece true
    else if (requested === true && offered === true) {
      matches++;
      score += 4;
    }
  });

  // Extras añaden puntos bonus
  const extrasCount = offeredFields.extras?.length || 0;
  score += Math.min(extrasCount * 3, 20);

  // Bonus si cumple con todo lo solicitado
  if (total > 0 && matches / total >= 0.9) {
    score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * 3. Score de Condiciones (0-100)
 * Evalúa términos comerciales (adelanto, cancelación, entrega, garantía)
 */
function calculateTermsScore(quote) {
  let score = 50; // Base

  const terms = quote.terms || {};

  // 1. Adelanto (deposit) - Mejor si es bajo
  const deposit = terms.deposit || 50;
  if (deposit <= 20) score += 15;
  else if (deposit <= 30) score += 12;
  else if (deposit <= 40) score += 8;
  else if (deposit <= 50) score += 5;

  // 2. Política de cancelación - Mejor si es flexible
  const cancelPolicy = (terms.cancellationPolicy || '').toLowerCase();
  if (cancelPolicy.includes('reembolso 100%')) score += 15;
  else if (cancelPolicy.includes('reembolso') && cancelPolicy.includes('80%')) score += 12;
  else if (cancelPolicy.includes('reembolso') && cancelPolicy.includes('50%')) score += 8;
  else if (cancelPolicy.includes('reembolso')) score += 5;

  // 3. Tiempo de entrega - Mejor si es rápido
  const deliveryText = terms.deliveryTime || '';
  const deliveryDays = parseInt(deliveryText) || 90;
  if (deliveryDays <= 20) score += 12;
  else if (deliveryDays <= 30) score += 10;
  else if (deliveryDays <= 45) score += 7;
  else if (deliveryDays <= 60) score += 5;

  // 4. Garantía - Bonus si existe
  if (terms.warranty) score += 8;

  return Math.min(score, 100);
}

/**
 * 4. Score de Reputación (0-100)
 * Basado en rating y cantidad de reseñas
 */
function calculateReputationScore(supplier) {
  const rating = supplier.rating || 0;
  const reviewCount = supplier.reviewCount || 0;

  // Score base del rating
  let score = (rating / 5) * 70;

  // Bonus por cantidad de reseñas (más reseñas = más confiable)
  if (reviewCount >= 100) score += 30;
  else if (reviewCount >= 50) score += 25;
  else if (reviewCount >= 25) score += 20;
  else if (reviewCount >= 10) score += 15;
  else if (reviewCount >= 5) score += 10;
  else if (reviewCount >= 2) score += 5;

  return Math.round(Math.min(score, 100));
}

/**
 * Convierte un score numérico a rating con estrellas y label
 */
function scoreToRating(score) {
  if (score >= 90) return { stars: 5, label: 'Excelente', emoji: '🌟' };
  if (score >= 80) return { stars: 4.5, label: 'Muy bueno', emoji: '⭐' };
  if (score >= 70) return { stars: 4, label: 'Bueno', emoji: '👍' };
  if (score >= 60) return { stars: 3.5, label: 'Aceptable', emoji: '👌' };
  if (score >= 50) return { stars: 3, label: 'Regular', emoji: '😐' };
  return { stars: 2.5, label: 'Mejorable', emoji: '⚠️' };
}

/**
 * Identifica los puntos fuertes de un presupuesto
 */
function identifyStrengths(scores) {
  const strengths = [];

  if (scores.price >= 90)
    strengths.push({
      aspect: 'Precio',
      reason: 'Excelente relación calidad-precio',
      icon: '💰',
    });

  if (scores.service >= 90)
    strengths.push({
      aspect: 'Servicio',
      reason: 'Incluye todo lo solicitado y más',
      icon: '✨',
    });

  if (scores.terms >= 85)
    strengths.push({
      aspect: 'Condiciones',
      reason: 'Términos muy favorables',
      icon: '📋',
    });

  if (scores.reputation >= 85)
    strengths.push({
      aspect: 'Reputación',
      reason: 'Proveedor muy bien valorado',
      icon: '⭐',
    });

  return strengths;
}

/**
 * Identifica los puntos débiles de un presupuesto
 */
function identifyWeaknesses(scores) {
  const weaknesses = [];

  if (scores.price < 60)
    weaknesses.push({
      aspect: 'Precio',
      reason: 'Por encima del presupuesto disponible',
      severity: 'high',
      icon: '⚠️',
    });

  if (scores.service < 70)
    weaknesses.push({
      aspect: 'Servicio',
      reason: 'No incluye todo lo solicitado',
      severity: 'medium',
      icon: '⚠️',
    });

  if (scores.terms < 60)
    weaknesses.push({
      aspect: 'Condiciones',
      reason: 'Términos poco flexibles',
      severity: 'medium',
      icon: '📋',
    });

  if (scores.reputation < 50)
    weaknesses.push({
      aspect: 'Reputación',
      reason: 'Pocas valoraciones o rating bajo',
      severity: 'low',
      icon: 'ℹ️',
    });

  return weaknesses;
}

/**
 * Compara múltiples presupuestos y genera un análisis
 */
export function compareQuotes(quotes, request, userPreferences = null) {
  // Calcular scores para todos
  const quotesWithScores = quotes.map((quote) => ({
    ...quote,
    analysis: calculateQuoteScore(quote, request, userPreferences),
  }));

  // Ordenar por score total
  const sorted = [...quotesWithScores].sort((a, b) => b.analysis.total - a.analysis.total);

  // Identificar mejor en cada aspecto
  const bestPrice = [...quotesWithScores].sort(
    (a, b) => b.analysis.breakdown.price - a.analysis.breakdown.price
  )[0];

  const bestService = [...quotesWithScores].sort(
    (a, b) => b.analysis.breakdown.service - a.analysis.breakdown.service
  )[0];

  const bestTerms = [...quotesWithScores].sort(
    (a, b) => b.analysis.breakdown.terms - a.analysis.breakdown.terms
  )[0];

  const recommended = sorted[0];

  // Calcular estadísticas
  const prices = quotesWithScores.map((q) => q.pricing?.total || 0);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    quotes: sorted,
    recommended,
    bests: {
      price: bestPrice,
      service: bestService,
      terms: bestTerms,
    },
    stats: {
      count: quotes.length,
      avgPrice: Math.round(avgPrice),
      minPrice,
      maxPrice,
      priceRange: maxPrice - minPrice,
    },
    insights: generateInsights(sorted, request),
  };
}

/**
 * Genera insights automáticos sobre la comparación
 */
function generateInsights(sortedQuotes, request) {
  const insights = [];
  const top = sortedQuotes[0];
  const budget = request.weddingInfo?.presupuestoTotal || 0;

  // Insight 1: Recomendación principal
  insights.push({
    type: 'recommendation',
    title: `Recomendamos: ${top.supplierName}`,
    message: `Con una puntuación de ${top.analysis.total}/100, ofrece la mejor combinación de precio, servicio y condiciones.`,
    icon: '🏆',
  });

  // Insight 2: Si hay diferencia de precio significativa
  if (sortedQuotes.length >= 2) {
    const priceDiff =
      sortedQuotes[sortedQuotes.length - 1].pricing.total - sortedQuotes[0].pricing.total;
    if (priceDiff > 500) {
      insights.push({
        type: 'price',
        title: 'Gran variación de precios',
        message: `Hay una diferencia de ${priceDiff}€ entre el más caro y el más barato. Revisa qué incluye cada uno.`,
        icon: '💡',
      });
    }
  }

  // Insight 3: Si alguno está muy por encima del presupuesto
  const overBudget = sortedQuotes.filter((q) => {
    const categoryBudget = (budget * (CATEGORY_BUDGET_PERCENTAGES[q.supplierCategory] || 5)) / 100;
    return q.pricing.total > categoryBudget * 1.3;
  });

  if (overBudget.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Algunos presupuestos superan tu límite',
      message: `${overBudget.length} ${overBudget.length === 1 ? 'presupuesto está' : 'presupuestos están'} más de un 30% por encima de tu presupuesto recomendado.`,
      icon: '⚠️',
    });
  }

  // Insight 4: Si todos tienen buenas valoraciones
  const allWellRated = sortedQuotes.every((q) => (q.supplier?.rating || 0) >= 4.5);
  if (allWellRated) {
    insights.push({
      type: 'positive',
      title: 'Proveedores de calidad',
      message:
        'Todos los proveedores que respondieron tienen excelentes valoraciones. ¡Buenas opciones!',
      icon: '✨',
    });
  }

  return insights;
}

/**
 * Formatea un presupuesto para comparación visual
 */
export function formatQuoteForComparison(quote) {
  return {
    id: quote.quoteId,
    supplier: {
      id: quote.supplierId,
      name: quote.supplierName,
      rating: quote.supplier?.rating || 0,
      reviewCount: quote.supplier?.reviewCount || 0,
    },
    price: {
      subtotal: quote.pricing?.subtotal || 0,
      taxes: quote.pricing?.taxes || 0,
      discount: quote.pricing?.discount || 0,
      total: quote.pricing?.total || 0,
      display: `${(quote.pricing?.total || 0).toLocaleString('es-ES')}€`,
    },
    service: Object.keys(quote.serviceOffered || {}),
    terms: {
      deposit: `${quote.terms?.deposit || 0}%`,
      delivery: quote.terms?.deliveryTime || 'No especificado',
      cancellation: quote.terms?.cancellationPolicy || 'No especificado',
    },
  };
}
