// Utilidades de geometría y suavizado usadas por FreeDrawCanvas y otros componentes
// Todas las funciones son puras y libres de dependencias de React.

/**
 * Distancia euclídea entre dos puntos {x, y}
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// -------------------- Intersecciones --------------------

/** Algoritmo CCW para determinar si dos segmentos AB y CD se cruzan */
export function segmentsIntersect(p1, p2, p3, p4) {
  const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Comprueba si un polígono (array de puntos) se autointersecta.
 * Se asume que el último punto NO repite el primero.
 */
export function polySelfIntersects(pts = []) {
  if (pts.length < 4) return false;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = i + 1; j < pts.length - 1; j++) {
      if (Math.abs(i - j) <= 1) continue; // segmentos adyacentes
      if (i === 0 && j === pts.length - 2) continue; // primer y último segmento comparten vértice
      const a1 = pts[i], a2 = pts[i + 1];
      const b1 = pts[j], b2 = pts[j + 1];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

// -------------------- Suavizado y paths --------------------

/** Una iteración de Chaikin smoothing */
export function smooth(points) {
  if (points.length < 2) return points;
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
    out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
  }
  return out;
}

/**
 * Convierte un array de puntos en el atributo d de un path SVG de líneas rectas.
 * No cierra automáticamente; pásale el primer punto repetido si lo deseas cerrado.
 */
export function getPathD(pts) {
  if (!pts.length) return '';
  const d = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i].x} ${pts[i].y}`);
  return d.join(' ');
}
