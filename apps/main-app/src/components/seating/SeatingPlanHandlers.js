/**
 * SeatingPlanHandlers.js
 * Handlers separados para Drawing Tools y Templates
 * Para evitar sobrecarga del archivo principal
 */

import { toast } from 'react-toastify';

/**
 * Handler para añadir elemento dibujado
 */
export const createAddDrawingElementHandler = (setDrawingElements) => {
  return (element) => {
    const newElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      selected: false,
      createdAt: Date.now(),
    };
    setDrawingElements((prev) => [...prev, newElement]);
    // console.log('[DrawingTools] Elemento añadido:', newElement);
  };
};

/**
 * Handler para eliminar elemento dibujado
 */
export const createDeleteDrawingElementHandler = (setDrawingElements) => {
  return (elementId) => {
    setDrawingElements((prev) => prev.filter((el) => el.id !== elementId));
    // console.log('[DrawingTools] Elemento eliminado:', elementId);
  };
};

/**
 * Handler para seleccionar elemento dibujado
 */
export const createSelectDrawingElementHandler = (setDrawingElements) => {
  return (elementId) => {
    setDrawingElements((prev) =>
      prev.map((el) => ({
        ...el,
        selected: el.id === elementId ? !el.selected : el.selected,
      }))
    );
  };
};

/**
 * Handler para aplicar plantilla de boda
 */
export const createApplyTemplateHandler = ({
  tab,
  setTab,
  generateBanquetLayout,
  addTable,
  setDrawingElements,
}) => {
  return (templateResult) => {
    if (!templateResult) return;

    try {
      // console.log('[Template] Aplicando plantilla:', templateResult.template);

      // Asegurar que estamos en tab banquet
      if (tab !== 'banquet') {
        setTab('banquet');
      }

      // Aplicar mesas de la plantilla
      if (templateResult.tables && templateResult.tables.length > 0) {
        if (typeof generateBanquetLayout === 'function') {
          generateBanquetLayout(templateResult.tables);
        } else {
          templateResult.tables.forEach((table) => addTable(table));
        }
        // console.log(`[Template] ${templateResult.tables.length} mesas añadidas`);
      }

      // Aplicar zonas especiales
      if (templateResult.zones && templateResult.zones.length > 0) {
        const zonesWithIds = templateResult.zones.map((zone) => ({
          ...zone,
          id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          selected: false,
        }));

        setDrawingElements((prev) => [...prev, ...zonesWithIds]);
        // console.log(`[Template] ${zonesWithIds.length} zonas añadidas`);
      }

      toast.success(`✨ Plantilla "${templateResult.template}" aplicada correctamente`, {
        autoClose: 3000,
      });
    } catch (error) {
      // console.error('[Template] Error aplicando plantilla:', error);
      toast.error('Error al aplicar la plantilla');
    }
  };
};

/**
 * Handler para limpiar todos los elementos dibujados
 */
export const createClearDrawingElementsHandler = (setDrawingElements) => {
  return () => {
    setDrawingElements([]);
    toast.info('Elementos de dibujo eliminados');
  };
};

/**
 * Integración completa de handlers para SeatingPlanModern
 */
export const createSeatingPlanDrawingHandlers = ({
  tab,
  setTab,
  generateBanquetLayout,
  addTable,
  drawingElements,
  setDrawingElements,
}) => {
  return {
    handleAddDrawingElement: createAddDrawingElementHandler(setDrawingElements),
    handleDeleteDrawingElement: createDeleteDrawingElementHandler(setDrawingElements),
    handleSelectDrawingElement: createSelectDrawingElementHandler(setDrawingElements),
    handleApplyTemplate: createApplyTemplateHandler({
      tab,
      setTab,
      generateBanquetLayout,
      addTable,
      setDrawingElements,
    }),
    handleClearDrawingElements: createClearDrawingElementsHandler(setDrawingElements),
  };
};
