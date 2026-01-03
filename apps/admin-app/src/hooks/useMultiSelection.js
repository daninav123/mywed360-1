/**
 * useMultiSelection - Hook para gestionar selección múltiple de mesas
 */
import { useState, useCallback } from 'react';

export default function useMultiSelection() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Iniciar selección con marquee
  const startMarquee = useCallback((x, y) => {
    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });
    setIsSelecting(true);
  }, []);

  // Actualizar marquee mientras arrastra
  const updateMarquee = useCallback((x, y) => {
    if (isSelecting) {
      setMarqueeEnd({ x, y });
    }
  }, [isSelecting]);

  // Finalizar marquee y seleccionar mesas
  const endMarquee = useCallback((tables = []) => {
    if (!marqueeStart || !marqueeEnd) {
      setIsSelecting(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }

    // Calcular rectángulo del marquee
    const minX = Math.min(marqueeStart.x, marqueeEnd.x);
    const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
    const minY = Math.min(marqueeStart.y, marqueeEnd.y);
    const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

    // Detectar mesas dentro del marquee
    const tablesInMarquee = tables.filter(table => {
      const tx = table.x || 0;
      const ty = table.y || 0;
      return tx >= minX && tx <= maxX && ty >= minY && ty <= maxY;
    });

    // Actualizar selectedIds
    setSelectedIds(tablesInMarquee.map(t => t.id));

    // Limpiar marquee
    setIsSelecting(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
  }, [marqueeStart, marqueeEnd]);

  // Añadir/quitar de selección (Shift+Click)
  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Seleccionar solo uno (Click normal)
  const selectSingle = useCallback((id) => {
    setSelectedIds([id]);
  }, []);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Acciones batch
  const moveSelected = useCallback((deltaX, deltaY, tables, onMove) => {
    selectedIds.forEach(id => {
      const table = tables.find(t => t.id === id);
      if (table && onMove) {
        onMove(id, table.x + deltaX, table.y + deltaY);
      }
    });
  }, [selectedIds]);

  const alignSelected = useCallback((direction, tables, onMove) => {
    if (selectedIds.length === 0) return;
    
    const selectedTables = tables.filter(t => selectedIds.includes(t.id));
    if (selectedTables.length === 0) return;

    let target;
    if (direction === 'left') {
      target = Math.min(...selectedTables.map(t => t.x));
      selectedTables.forEach(t => onMove && onMove(t.id, target, t.y));
    } else if (direction === 'right') {
      target = Math.max(...selectedTables.map(t => t.x));
      selectedTables.forEach(t => onMove && onMove(t.id, target, t.y));
    } else if (direction === 'top') {
      target = Math.min(...selectedTables.map(t => t.y));
      selectedTables.forEach(t => onMove && onMove(t.id, t.x, target));
    } else if (direction === 'bottom') {
      target = Math.max(...selectedTables.map(t => t.y));
      selectedTables.forEach(t => onMove && onMove(t.id, t.x, target));
    } else if (direction === 'center-h') {
      const minX = Math.min(...selectedTables.map(t => t.x));
      const maxX = Math.max(...selectedTables.map(t => t.x));
      target = (minX + maxX) / 2;
      selectedTables.forEach(t => onMove && onMove(t.id, target, t.y));
    } else if (direction === 'center-v') {
      const minY = Math.min(...selectedTables.map(t => t.y));
      const maxY = Math.max(...selectedTables.map(t => t.y));
      target = (minY + maxY) / 2;
      selectedTables.forEach(t => onMove && onMove(t.id, t.x, target));
    }
  }, [selectedIds]);

  const distributeSelected = useCallback((direction, tables, onMove) => {
    if (selectedIds.length < 3) return; // Necesita al menos 3 para distribuir
    
    const selectedTables = tables.filter(t => selectedIds.includes(t.id));
    if (selectedTables.length < 3) return;

    if (direction === 'horizontal') {
      const sorted = selectedTables.slice().sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const maxX = sorted[sorted.length - 1].x;
      const spacing = (maxX - minX) / (sorted.length - 1);
      
      sorted.forEach((table, i) => {
        const newX = minX + (spacing * i);
        onMove && onMove(table.id, newX, table.y);
      });
    } else if (direction === 'vertical') {
      const sorted = selectedTables.slice().sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y;
      const spacing = (maxY - minY) / (sorted.length - 1);
      
      sorted.forEach((table, i) => {
        const newY = minY + (spacing * i);
        onMove && onMove(table.id, table.x, newY);
      });
    }
  }, [selectedIds]);

  return {
    selectedIds,
    marqueeStart,
    marqueeEnd,
    isSelecting,
    startMarquee,
    updateMarquee,
    endMarquee,
    toggleSelection,
    selectSingle,
    clearSelection,
    // Acciones batch
    moveSelected,
    alignSelected,
    distributeSelected,
  };
}
