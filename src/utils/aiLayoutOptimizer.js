/**
 * aiLayoutOptimizer - Optimizador de layouts con IA
 * FASE 5.2: Auto-Layout IA Mejorado
 */

/**
 * Analiza el layout actual y sugiere mejoras
 */
export function analyzeLayout(tables = [], hallSize = {}, guests = []) {
  const analysis = {
    score: 0,
    maxScore: 100,
    issues: [],
    suggestions: [],
    metrics: {},
  };

  const width = hallSize.width || 1800;
  const height = hallSize.height || 1200;

  // 1. DENSIDAD (20 puntos)
  const density = analyzeDensity(tables, width, height);
  analysis.metrics.density = density;
  analysis.score += density.score;
  if (density.issues.length > 0) {
    analysis.issues.push(...density.issues);
    analysis.suggestions.push(...density.suggestions);
  }

  // 2. DISTRIBUCIÓN (20 puntos)
  const distribution = analyzeDistribution(tables, width, height);
  analysis.metrics.distribution = distribution;
  analysis.score += distribution.score;
  if (distribution.issues.length > 0) {
    analysis.issues.push(...distribution.issues);
    analysis.suggestions.push(...distribution.suggestions);
  }

  // 3. ESPACIADO (20 puntos)
  const spacing = analyzeSpacing(tables);
  analysis.metrics.spacing = spacing;
  analysis.score += spacing.score;
  if (spacing.issues.length > 0) {
    analysis.issues.push(...spacing.issues);
    analysis.suggestions.push(...spacing.suggestions);
  }

  // 4. SIMETRÍA (15 puntos)
  const symmetry = analyzeSymmetry(tables, width, height);
  analysis.metrics.symmetry = symmetry;
  analysis.score += symmetry.score;
  if (symmetry.issues.length > 0) {
    analysis.issues.push(...symmetry.issues);
    analysis.suggestions.push(...symmetry.suggestions);
  }

  // 5. ASIGNACIÓN DE INVITADOS (25 puntos)
  const guestAssignment = analyzeGuestAssignment(tables, guests);
  analysis.metrics.guestAssignment = guestAssignment;
  analysis.score += guestAssignment.score;
  if (guestAssignment.issues.length > 0) {
    analysis.issues.push(...guestAssignment.issues);
    analysis.suggestions.push(...guestAssignment.suggestions);
  }

  // Clasificación del layout
  if (analysis.score >= 90) {
    analysis.rating = 'Excelente';
    analysis.emoji = '🌟';
  } else if (analysis.score >= 75) {
    analysis.rating = 'Muy Bueno';
    analysis.emoji = '✨';
  } else if (analysis.score >= 60) {
    analysis.rating = 'Bueno';
    analysis.emoji = '👍';
  } else if (analysis.score >= 40) {
    analysis.rating = 'Mejorable';
    analysis.emoji = '⚠️';
  } else {
    analysis.rating = 'Necesita mejoras';
    analysis.emoji = '❌';
  }

  return analysis;
}

/**
 * Analiza densidad de mesas
 */
function analyzeDensity(tables, width, height) {
  const result = {
    score: 0,
    issues: [],
    suggestions: [],
  };

  const area = width * height;
  const tableArea = tables.reduce((sum, t) => {
    if (t.shape === 'circle') {
      const r = (t.diameter || 120) / 2;
      return sum + Math.PI * r * r;
    }
    return sum + (t.width || 120) * (t.height || 80);
  }, 0);

  const densityRatio = tableArea / area;

  if (densityRatio < 0.15) {
    result.score = 20;
    result.suggestions.push({
      type: 'density',
      message: 'Puedes añadir más mesas sin saturar el espacio',
      priority: 'low',
    });
  } else if (densityRatio >= 0.15 && densityRatio <= 0.35) {
    result.score = 20;
  } else if (densityRatio > 0.35 && densityRatio <= 0.45) {
    result.score = 15;
    result.issues.push({
      type: 'density',
      message: 'Densidad alta - Considera espaciar más las mesas',
      severity: 'warning',
    });
  } else {
    result.score = 10;
    result.issues.push({
      type: 'density',
      message: 'Muy saturado - Reduce mesas o aumenta espacio entre ellas',
      severity: 'error',
    });
    result.suggestions.push({
      type: 'density',
      message: 'Usa mesas más pequeñas o elimina algunas',
      priority: 'high',
    });
  }

  return result;
}

/**
 * Analiza distribución espacial
 */
function analyzeDistribution(tables, width, height) {
  const result = {
    score: 0,
    issues: [],
    suggestions: [],
  };

  if (tables.length === 0) return result;

  // Dividir en cuadrantes
  const quadrants = [
    { tables: [], x: 0, y: 0 },
    { tables: [], x: width / 2, y: 0 },
    { tables: [], x: 0, y: height / 2 },
    { tables: [], x: width / 2, y: height / 2 },
  ];

  tables.forEach(t => {
    const qx = (t.x || 0) < width / 2 ? 0 : 1;
    const qy = (t.y || 0) < height / 2 ? 0 : 2;
    quadrants[qx + qy].tables.push(t);
  });

  const counts = quadrants.map(q => q.tables.length);
  const avg = counts.reduce((a, b) => a + b, 0) / 4;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / 4;
  const stdDev = Math.sqrt(variance);

  // Cuanto menor la desviación, mejor distribución
  if (stdDev < 1) {
    result.score = 20;
  } else if (stdDev < 2) {
    result.score = 18;
  } else if (stdDev < 3) {
    result.score = 15;
    result.suggestions.push({
      type: 'distribution',
      message: 'Intenta distribuir las mesas más uniformemente',
      priority: 'medium',
    });
  } else {
    result.score = 10;
    result.issues.push({
      type: 'distribution',
      message: 'Distribución desigual - Algunas zonas están vacías',
      severity: 'warning',
    });
    result.suggestions.push({
      type: 'distribution',
      message: 'Mueve mesas para equilibrar los cuadrantes',
      priority: 'high',
    });
  }

  return result;
}

/**
 * Analiza espaciado entre mesas
 */
function analyzeSpacing(tables) {
  const result = {
    score: 0,
    issues: [],
    suggestions: [],
  };

  if (tables.length < 2) {
    result.score = 20;
    return result;
  }

  const MIN_SPACING = 150; // cm
  const IDEAL_SPACING = 200;

  let tooClose = 0;
  let violations = [];

  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const t1 = tables[i];
      const t2 = tables[j];

      const dx = (t1.x || 0) - (t2.x || 0);
      const dy = (t1.y || 0) - (t2.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Restar radios
      const r1 = t1.shape === 'circle' ? (t1.diameter || 120) / 2 : Math.max(t1.width || 120, t1.height || 80) / 2;
      const r2 = t2.shape === 'circle' ? (t2.diameter || 120) / 2 : Math.max(t2.width || 120, t2.height || 80) / 2;
      const clearance = distance - r1 - r2;

      if (clearance < MIN_SPACING) {
        tooClose++;
        violations.push({
          table1: t1.name || t1.id,
          table2: t2.name || t2.id,
          clearance: Math.round(clearance),
        });
      }
    }
  }

  const pairCount = (tables.length * (tables.length - 1)) / 2;
  const violationRatio = tooClose / pairCount;

  if (violationRatio === 0) {
    result.score = 20;
  } else if (violationRatio < 0.1) {
    result.score = 18;
    result.suggestions.push({
      type: 'spacing',
      message: `${tooClose} mesas están muy cerca. Sepáralas al menos ${MIN_SPACING}cm`,
      priority: 'low',
    });
  } else if (violationRatio < 0.3) {
    result.score = 12;
    result.issues.push({
      type: 'spacing',
      message: `${tooClose} pares de mesas tienen poco espacio`,
      severity: 'warning',
    });
    result.suggestions.push({
      type: 'spacing',
      message: 'Usa la función "Distribuir uniformemente" para espaciar mejor',
      priority: 'high',
    });
  } else {
    result.score = 5;
    result.issues.push({
      type: 'spacing',
      message: `Muchas mesas están demasiado juntas (${tooClose} conflictos)`,
      severity: 'error',
    });
    result.suggestions.push({
      type: 'spacing',
      message: 'Considera usar un template automático o reducir mesas',
      priority: 'high',
    });
  }

  return result;
}

/**
 * Analiza simetría del layout
 */
function analyzeSymmetry(tables, width, height) {
  const result = {
    score: 0,
    issues: [],
    suggestions: [],
  };

  if (tables.length < 4) {
    result.score = 15;
    return result;
  }

  const centerX = width / 2;
  const centerY = height / 2;

  // Calcular centroide de las mesas
  const avgX = tables.reduce((sum, t) => sum + (t.x || 0), 0) / tables.length;
  const avgY = tables.reduce((sum, t) => sum + (t.y || 0), 0) / tables.length;

  const offsetX = Math.abs(avgX - centerX);
  const offsetY = Math.abs(avgY - centerY);

  const maxOffset = Math.max(width, height) * 0.1;

  if (offsetX < maxOffset * 0.3 && offsetY < maxOffset * 0.3) {
    result.score = 15;
  } else if (offsetX < maxOffset && offsetY < maxOffset) {
    result.score = 12;
  } else {
    result.score = 8;
    result.suggestions.push({
      type: 'symmetry',
      message: 'Las mesas están descentradas. Usa "Centrar en salón" para equilibrar',
      priority: 'medium',
    });
  }

  return result;
}

/**
 * Analiza asignación de invitados
 */
function analyzeGuestAssignment(tables, guests) {
  const result = {
    score: 0,
    issues: [],
    suggestions: [],
  };

  if (guests.length === 0) {
    result.score = 25;
    return result;
  }

  const assigned = guests.filter(g => g.tableId || g.table).length;
  const assignmentRatio = assigned / guests.length;

  // Puntos por ratio de asignación
  result.score = Math.round(assignmentRatio * 20);

  // Analizar capacidad
  const occupancy = new Map();
  guests.forEach(g => {
    const tableId = g.tableId || g.table;
    if (tableId) {
      const count = occupancy.get(String(tableId)) || 0;
      const companions = parseInt(g.companion, 10) || 0;
      occupancy.set(String(tableId), count + 1 + companions);
    }
  });

  let overcrowded = 0;
  tables.forEach(t => {
    const capacity = t.seats || 8;
    const occupied = occupancy.get(String(t.id)) || 0;
    if (occupied > capacity) {
      overcrowded++;
    }
  });

  if (overcrowded > 0) {
    result.score -= 5;
    result.issues.push({
      type: 'capacity',
      message: `${overcrowded} mesas exceden su capacidad`,
      severity: 'error',
    });
    result.suggestions.push({
      type: 'capacity',
      message: 'Reasigna invitados o aumenta capacidad de mesas',
      priority: 'high',
    });
  } else {
    result.score += 5;
  }

  if (assignmentRatio < 1) {
    result.suggestions.push({
      type: 'assignment',
      message: `${guests.length - assigned} invitados sin mesa asignada`,
      priority: 'medium',
    });
  }

  return result;
}

/**
 * Sugiere optimizaciones automáticas
 */
export function suggestOptimizations(analysis) {
  const optimizations = [];

  // Ordenar por prioridad
  const highPriority = analysis.suggestions.filter(s => s.priority === 'high');
  const mediumPriority = analysis.suggestions.filter(s => s.priority === 'medium');
  const lowPriority = analysis.suggestions.filter(s => s.priority === 'low');

  return [...highPriority, ...mediumPriority, ...lowPriority];
}

/**
 * Aplica optimización automática
 */
export function applyAutoOptimization(tables, hallSize, optimizationType) {
  const width = hallSize.width || 1800;
  const height = hallSize.height || 1200;

  switch (optimizationType) {
    case 'center':
      return centerTables(tables, width, height);
    case 'distribute':
      return distributeTables(tables, width, height);
    case 'align':
      return alignTables(tables);
    default:
      return tables;
  }
}

function centerTables(tables, width, height) {
  if (tables.length === 0) return tables;

  const avgX = tables.reduce((sum, t) => sum + (t.x || 0), 0) / tables.length;
  const avgY = tables.reduce((sum, t) => sum + (t.y || 0), 0) / tables.length;

  const offsetX = width / 2 - avgX;
  const offsetY = height / 2 - avgY;

  return tables.map(t => ({
    ...t,
    x: (t.x || 0) + offsetX,
    y: (t.y || 0) + offsetY,
  }));
}

function distributeTables(tables, width, height) {
  // Implementación simplificada
  return tables;
}

function alignTables(tables) {
  // Implementación simplificada
  return tables;
}
