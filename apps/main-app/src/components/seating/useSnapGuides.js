/**
 * useSnapGuides - Hook para calcular guías de alineación
 * Detecta cuando una mesa está cerca de alinearse con otras
 */

import { useState, useCallback, useMemo } from 'react';

const SNAP_THRESHOLD = 10; // píxeles de tolerancia

export default function useSnapGuides(tables = []) {
  const [draggingTableId, setDraggingTableId] = useState(null);
  const [guides, setGuides] = useState([]);

  // Calcular guías cuando se arrastra una mesa
  const calculateGuides = useCallback(
    (draggedTable) => {
      if (!draggedTable || !tables) return [];

      const newGuides = [];
      const { x, y, width = 120, height = 120 } = draggedTable;

      // Calcular centro, bordes izquierdo/derecho, superior/inferior
      const draggedCenterX = x + width / 2;
      const draggedCenterY = y + height / 2;
      const draggedLeft = x;
      const draggedRight = x + width;
      const draggedTop = y;
      const draggedBottom = y + height;

      tables.forEach((table) => {
        if (table.id === draggedTable.id) return;

        const tableWidth = table.width || table.diameter || 120;
        const tableHeight = table.height || table.diameter || 120;
        const tableCenterX = table.x + tableWidth / 2;
        const tableCenterY = table.y + tableHeight / 2;
        const tableLeft = table.x;
        const tableRight = table.x + tableWidth;
        const tableTop = table.y;
        const tableBottom = table.y + tableHeight;

        // Guías verticales (alineación horizontal)
        // Centro con centro
        if (Math.abs(draggedCenterX - tableCenterX) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: tableCenterX });
        }
        // Borde izquierdo con borde izquierdo
        if (Math.abs(draggedLeft - tableLeft) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: tableLeft });
        }
        // Borde derecho con borde derecho
        if (Math.abs(draggedRight - tableRight) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: tableRight });
        }
        // Borde izquierdo con borde derecho
        if (Math.abs(draggedLeft - tableRight) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: tableRight });
        }
        // Borde derecho con borde izquierdo
        if (Math.abs(draggedRight - tableLeft) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'vertical', position: tableLeft });
        }

        // Guías horizontales (alineación vertical)
        // Centro con centro
        if (Math.abs(draggedCenterY - tableCenterY) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: tableCenterY });
        }
        // Borde superior con borde superior
        if (Math.abs(draggedTop - tableTop) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: tableTop });
        }
        // Borde inferior con borde inferior
        if (Math.abs(draggedBottom - tableBottom) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: tableBottom });
        }
        // Borde superior con borde inferior
        if (Math.abs(draggedTop - tableBottom) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: tableBottom });
        }
        // Borde inferior con borde superior
        if (Math.abs(draggedBottom - tableTop) < SNAP_THRESHOLD) {
          newGuides.push({ type: 'horizontal', position: tableTop });
        }
      });

      // Eliminar duplicados
      const uniqueGuides = newGuides.filter(
        (guide, index, self) =>
          index ===
          self.findIndex((g) => g.type === guide.type && Math.abs(g.position - guide.position) < 1)
      );

      return uniqueGuides;
    },
    [tables]
  );

  // Handler para cuando empieza el drag
  const handleDragStart = useCallback((tableId) => {
    setDraggingTableId(tableId);
  }, []);

  // Handler para cuando se mueve
  const handleDragMove = useCallback(
    (table) => {
      const newGuides = calculateGuides(table);
      setGuides(newGuides);
    },
    [calculateGuides]
  );

  // Handler para cuando termina el drag
  const handleDragEnd = useCallback(() => {
    setDraggingTableId(null);
    setGuides([]);
  }, []);

  return {
    guides,
    draggingTableId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
