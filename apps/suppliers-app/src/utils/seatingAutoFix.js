/**
 * Utilidades para auto-fix de problemas en Seating Plan
 * Funciones llamadas desde ValidationCoach
 */

/**
 * Ajusta el espaciado entre dos mesas
 */
export function adjustTableSpacing(tables, tableIds, targetSpacing, moveTableFn) {
  const tablesToAdjust = tables.filter((t) => tableIds.includes(String(t.id)));
  if (tablesToAdjust.length !== 2) {
    console.warn('[adjustTableSpacing] Se requieren exactamente 2 mesas');
    return false;
  }

  const [t1, t2] = tablesToAdjust;

  // Calcular espaciado actual
  const currentSpacing = Math.sqrt(Math.pow(t2.x - t1.x, 2) + Math.pow(t2.y - t1.y, 2));

  // Calcular cuánto mover
  const diff = targetSpacing - currentSpacing;
  const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x);

  // Mover ambas mesas alejándose entre sí
  moveTableFn(t1.id, {
    x: t1.x - (Math.cos(angle) * diff) / 2,
    y: t1.y - (Math.sin(angle) * diff) / 2,
  });

  moveTableFn(t2.id, {
    x: t2.x + (Math.cos(angle) * diff) / 2,
    y: t2.y + (Math.sin(angle) * diff) / 2,
  });

  return true;
}

/**
 * Mueve una mesa dentro del boundary
 */
export function moveTableInsideBoundary(table, boundary, hallSize, moveTableFn) {
  if (!table) return false;

  // Si no hay boundary, usar límites del salón
  if (!boundary || boundary.length === 0) {
    const margin = 100;
    const x = Math.max(margin, Math.min(table.x, hallSize.width - margin));
    const y = Math.max(margin, Math.min(table.y, hallSize.height - margin));

    moveTableFn(table.id, { x, y });
    return true;
  }

  // Encontrar punto más cercano dentro del boundary
  const closestPoint = findClosestPointInsidePolygon({ x: table.x, y: table.y }, boundary);

  moveTableFn(table.id, closestPoint);
  return true;
}

/**
 * Encuentra posición libre para una mesa
 */
export function findAndMoveToFreeSpot(
  table,
  allTables,
  obstacles,
  hallSize,
  moveTableFn,
  minSpacing = 100
) {
  if (!table) return false;

  const gridSize = 50;
  const tableRadius = table.shape === 'circle' ? (table.diameter || 120) / 2 : 60;

  // Grid search desde el centro hacia afuera
  const centerX = hallSize.width / 2;
  const centerY = hallSize.height / 2;
  const maxRadius = Math.max(hallSize.width, hallSize.height);

  for (let radius = 0; radius < maxRadius; radius += gridSize) {
    // Buscar en círculo
    const steps = Math.max(8, Math.floor((2 * Math.PI * radius) / gridSize));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const testX = centerX + Math.cos(angle) * radius;
      const testY = centerY + Math.sin(angle) * radius;

      // Verificar que está dentro del salón
      if (testX < 100 || testX > hallSize.width - 100) continue;
      if (testY < 100 || testY > hallSize.height - 100) continue;

      // Verificar colisiones con otras mesas
      const hasCollision = allTables.some((other) => {
        if (other.id === table.id) return false;

        const dx = testX - other.x;
        const dy = testY - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const otherRadius = other.shape === 'circle' ? (other.diameter || 120) / 2 : 60;
        const minDistance = tableRadius + otherRadius + minSpacing;

        return distance < minDistance;
      });

      if (!hasCollision) {
        // Verificar colisiones con obstáculos
        const hasObstacleCollision = obstacles?.some((obs) => {
          return (
            testX >= obs.x &&
            testX <= obs.x + obs.width &&
            testY >= obs.y &&
            testY <= obs.y + obs.height
          );
        });

        if (!hasObstacleCollision) {
          moveTableFn(table.id, { x: testX, y: testY });
          return true;
        }
      }
    }
  }

  console.warn('[findAndMoveToFreeSpot] No se encontró posición libre');
  return false;
}

/**
 * Optimiza el layout completo
 */
export function optimizeLayout(tables, guests, hallSize, applyTablesFn) {
  // Calcular número óptimo de mesas
  const avgGuestsPerTable = 8;
  const optimalTableCount = Math.ceil(guests.length / avgGuestsPerTable);

  if (tables.length >= optimalTableCount) {
    console.log('[optimizeLayout] Ya hay suficientes mesas');
    return false;
  }

  // Generar nuevas mesas en grid
  const tablesToAdd = optimalTableCount - tables.length;
  const cols = Math.ceil(Math.sqrt(optimalTableCount));
  const rows = Math.ceil(optimalTableCount / cols);

  const spacingX = 200;
  const spacingY = 200;
  const startX = 150;
  const startY = 150;

  const newTables = [...tables];
  let currentId = Math.max(...tables.map((t) => t.id), 0) + 1;

  for (let i = 0; i < tablesToAdd; i++) {
    const totalIndex = tables.length + i;
    const row = Math.floor(totalIndex / cols);
    const col = totalIndex % cols;

    newTables.push({
      id: currentId++,
      name: `Mesa ${currentId}`,
      x: startX + col * spacingX,
      y: startY + row * spacingY,
      shape: 'circle',
      diameter: 120,
      seats: avgGuestsPerTable,
      enabled: true,
    });
  }

  applyTablesFn(newTables);
  return true;
}

/**
 * Redistribuye invitados uniformemente
 */
export function redistributeGuests(tables, guests, moveGuestFn) {
  // Vaciar todas las mesas
  guests.forEach((guest) => {
    if (guest.tableId) {
      moveGuestFn(guest.id, null);
    }
  });

  // Asignar uniformemente
  const guestsPerTable = Math.ceil(guests.length / tables.length);
  let tableIndex = 0;
  let currentTableCount = 0;

  guests.forEach((guest) => {
    if (currentTableCount >= guestsPerTable) {
      tableIndex++;
      currentTableCount = 0;
    }

    if (tableIndex < tables.length) {
      moveGuestFn(guest.id, tables[tableIndex].id);
      currentTableCount++;
    }
  });

  return true;
}

// Utilidades de geometría

/**
 * Encuentra el punto más cercano dentro de un polígono
 */
function findClosestPointInsidePolygon(point, polygon) {
  // Si ya está dentro, retornar el mismo punto
  if (isPointInsidePolygon(point, polygon)) {
    return point;
  }

  // Encontrar el punto más cercano en el borde
  let closestPoint = point;
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    const closest = closestPointOnSegment(point, p1, p2);
    const distance = Math.sqrt(Math.pow(closest.x - point.x, 2) + Math.pow(closest.y - point.y, 2));

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = closest;
    }
  }

  // Mover un poco hacia adentro
  const center = getPolygonCenter(polygon);
  const dx = center.x - closestPoint.x;
  const dy = center.y - closestPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length > 0) {
    return {
      x: closestPoint.x + (dx / length) * 20, // 20cm hacia adentro
      y: closestPoint.y + (dy / length) * 20,
    };
  }

  return closestPoint;
}

function closestPointOnSegment(p, a, b) {
  const atob = { x: b.x - a.x, y: b.y - a.y };
  const atop = { x: p.x - a.x, y: p.y - a.y };
  const len = atob.x * atob.x + atob.y * atob.y;
  let dot = atop.x * atob.x + atop.y * atob.y;
  const t = Math.min(1, Math.max(0, dot / len));

  return {
    x: a.x + atob.x * t,
    y: a.y + atob.y * t,
  };
}

function isPointInsidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getPolygonCenter(polygon) {
  let sumX = 0;
  let sumY = 0;
  polygon.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });
  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length,
  };
}
