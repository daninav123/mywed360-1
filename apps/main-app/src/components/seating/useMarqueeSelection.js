/**
 * useMarqueeSelection - Hook para gestionar selección por área (marquee)
 * Permite seleccionar múltiples elementos arrastrando un rectángulo
 */

import { useState, useCallback, useMemo } from 'react';

export default function useMarqueeSelection(items = [], enabled = true) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Calcular rectángulo de selección
  const selectionBox = useMemo(() => {
    if (!startPoint || !endPoint) return null;

    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    return { x, y, width, height };
  }, [startPoint, endPoint]);

  // Verificar si un elemento está dentro del rectángulo de selección
  const isInSelection = useCallback((item, box) => {
    if (!box) return false;

    const itemX = item.x || 0;
    const itemY = item.y || 0;
    const itemWidth = item.width || item.diameter || 120;
    const itemHeight = item.height || item.diameter || 120;

    // Centro del elemento
    const centerX = itemX + itemWidth / 2;
    const centerY = itemY + itemHeight / 2;

    // Verificar si el centro está dentro del rectángulo
    return (
      centerX >= box.x &&
      centerX <= box.x + box.width &&
      centerY >= box.y &&
      centerY <= box.y + box.height
    );
  }, []);

  // Calcular elementos seleccionados
  const selectedItems = useMemo(() => {
    if (!selectionBox || !items) return [];

    return items.filter((item) => isInSelection(item, selectionBox));
  }, [items, selectionBox, isInSelection]);

  // Handler: Iniciar selección
  const handleSelectionStart = useCallback(
    (point) => {
      if (!enabled) return;

      setIsSelecting(true);
      setStartPoint(point);
      setEndPoint(point);
    },
    [enabled]
  );

  // Handler: Mover durante la selección
  const handleSelectionMove = useCallback(
    (point) => {
      if (!isSelecting || !enabled) return;

      setEndPoint(point);

      // Actualizar IDs seleccionados
      const ids = selectedItems.map((item) => item.id);
      setSelectedIds(ids);
    },
    [isSelecting, enabled, selectedItems]
  );

  // Handler: Finalizar selección
  const handleSelectionEnd = useCallback(() => {
    if (!enabled) return;

    setIsSelecting(false);

    // Si no hay elementos seleccionados, limpiar
    if (selectedItems.length === 0) {
      setStartPoint(null);
      setEndPoint(null);
      setSelectedIds([]);
    }
  }, [enabled, selectedItems]);

  // Handler: Limpiar selección
  const clearSelection = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
    setSelectedIds([]);
  }, []);

  // Handler: Toggle elemento en selección
  const toggleSelection = useCallback((itemId) => {
    setSelectedIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  // Handler: Seleccionar todo
  const selectAll = useCallback(() => {
    if (!items) return;
    setSelectedIds(items.map((item) => item.id));
  }, [items]);

  return {
    // Estado
    isSelecting,
    startPoint,
    endPoint,
    selectedIds,
    selectedItems,
    selectionBox: selectionBox ? { ...selectionBox, count: selectedItems.length } : null,

    // Handlers
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    clearSelection,
    toggleSelection,
    selectAll,
  };
}
