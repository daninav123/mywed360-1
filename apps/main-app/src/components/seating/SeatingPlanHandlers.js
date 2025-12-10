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
  applyBanquetTables,
  addTable,
  setDrawingElements,
}) => {
  return (templateResult) => {
    console.log('[Template] 🎯 Handler llamado con:', templateResult);

    if (!templateResult) {
      console.warn('[Template] ❌ templateResult es null/undefined');
      return;
    }

    try {
      console.log('[Template] ✅ Aplicando plantilla:', templateResult.template);
      console.log('[Template] 📊 Mesas a crear:', templateResult.tables?.length || 0);
      console.log('[Template] 🎨 Zonas a crear:', templateResult.zones?.length || 0);

      // Asegurar que estamos en tab banquet
      if (tab !== 'banquet') {
        console.log('[Template] 🔄 Cambiando a tab banquet');
        setTab('banquet');
      }

      // Aplicar mesas de la plantilla (REEMPLAZAR todas las existentes)
      if (templateResult.tables && templateResult.tables.length > 0) {
        console.log('[Template] 🪑 Reemplazando mesas existentes con plantilla...');
        console.log('[Template] 🆕 Nuevas mesas de plantilla:', templateResult.tables.length);

        // Las plantillas vienen con mesas ya posicionadas
        // Usar applyBanquetTables para REEMPLAZAR (no añadir)
        if (typeof applyBanquetTables === 'function') {
          console.log('[Template] ✅ Usando applyBanquetTables para reemplazar');
          applyBanquetTables(templateResult.tables);
          console.log(`[Template] ✅ ${templateResult.tables.length} mesas reemplazadas`);
        } else {
          console.error('[Template] ❌ applyBanquetTables no está disponible');
          console.warn(
            '[Template] ⚠️ Usando fallback addTable (esto añadirá en lugar de reemplazar)'
          );
          templateResult.tables.forEach((table) => addTable(table));
        }
      } else {
        console.warn('[Template] ⚠️ No hay mesas para añadir');
      }

      // Aplicar zonas especiales
      if (templateResult.zones && templateResult.zones.length > 0) {
        const zonesWithIds = templateResult.zones.map((zone) => ({
          ...zone,
          id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          selected: false,
        }));

        setDrawingElements((prev) => [...prev, ...zonesWithIds]);
        console.log(`[Template] ✅ ${zonesWithIds.length} zonas añadidas`);
      }

      toast.success(`✨ Plantilla "${templateResult.template}" aplicada correctamente`, {
        autoClose: 3000,
      });
    } catch (error) {
      console.error('[Template] ❌ Error aplicando plantilla:', error);
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
  applyBanquetTables,
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
      applyBanquetTables,
      addTable,
      setDrawingElements,
    }),
    handleClearDrawingElements: createClearDrawingElementsHandler(setDrawingElements),
  };
};
