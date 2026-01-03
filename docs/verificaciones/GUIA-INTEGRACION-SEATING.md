# 🔌 GUÍA DE INTEGRACIÓN - SEATING PLAN

**Fecha:** 13 Noviembre 2025, 03:03 AM  
**Estado:** Componentes listos para integrar

---

## ✅ COMPONENTES CREADOS Y LISTOS

### 1. **DrawingTools.jsx** ✅

**Ubicación:** `apps/main-app/src/components/seating/DrawingTools.jsx`  
**Funcionalidad:** Barra de herramientas para dibujar elementos

### 2. **DrawingElements.jsx** ✅

**Ubicación:** `apps/main-app/src/components/seating/DrawingElements.jsx`  
**Funcionalidad:** Renderiza elementos dibujados en el canvas

### 3. **WeddingTemplates.jsx** ✅

**Ubicación:** `apps/main-app/src/components/seating/WeddingTemplates.jsx`  
**Funcionalidad:** 8 plantillas profesionales de boda

### 4. **SeatingPlanHandlers.js** ✅

**Ubicación:** `apps/main-app/src/components/seating/SeatingPlanHandlers.js`  
**Funcionalidad:** Handlers helper para evitar sobrecargar SeatingPlanModern

---

## 📝 PASOS DE INTEGRACIÓN

### PASO 1: Imports en SeatingPlanModern.jsx

```javascript
// Ya añadidos (líneas 32-35):
import DrawingTools, { DRAWING_TOOLS } from './DrawingTools';
import DrawingElements from './DrawingElements';
import TemplateSelector from './WeddingTemplates';

// AÑADIR TAMBIÉN:
import { createSeatingPlanDrawingHandlers } from './SeatingPlanHandlers';
```

### PASO 2: Estados (Ya añadidos líneas 122-125)

```javascript
// FASE 2: Drawing Tools & Templates
const [activeTool, setActiveTool] = useState(DRAWING_TOOLS.SELECT);
const [drawingElements, setDrawingElements] = useState([]);
const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
```

### PASO 3: Crear handlers usando el helper

```javascript
// AÑADIR después de handleGenerateLayout (aprox línea 337)

// Crear todos los handlers de dibujo
const drawingHandlers = useMemo(() => {
  return createSeatingPlanDrawingHandlers({
    tab,
    setTab,
    generateBanquetLayout,
    addTable,
    drawingElements,
    setDrawingElements,
  });
}, [tab, setTab, generateBanquetLayout, addTable, drawingElements]);

const {
  handleAddDrawingElement,
  handleDeleteDrawingElement,
  handleSelectDrawingElement,
  handleApplyTemplate,
  handleClearDrawingElements,
} = drawingHandlers;
```

### PASO 4: Añadir botones al toolbar

```javascript
// En SeatingToolbarFloating (aprox línea 390-410)
// AÑADIR props:

<SeatingToolbarFloating
  mode={drawMode}
  onModeChange={setDrawMode}
  onAddTable={handleAddTable}
  onOpenDrawMode={handleOpenDrawMode}
  onAutoAssign={handleAutoAssign}
  onUndo={undo}
  onRedo={redo}
  canUndo={canUndo}
  canRedo={canRedo}
  onOpenLayoutGenerator={() => setLayoutGeneratorOpen(true)}
  // 👇 NUEVOS PROPS
  onOpenTemplates={() => setTemplateSelectorOpen(true)}
  onToggleDrawingTools={() =>
    setActiveTool(
      activeTool === DRAWING_TOOLS.SELECT ? DRAWING_TOOLS.PERIMETER : DRAWING_TOOLS.SELECT
    )
  }
  hasDrawingElements={drawingElements.length > 0}
  onClearDrawing={handleClearDrawingElements}
/>
```

### PASO 5: Integrar DrawingTools en el canvas

```javascript
// Dentro del <SeatingLayoutFloating.Canvas> (aprox línea 420)

<SeatingLayoutFloating.Canvas ref={canvasRef}>
  {/* 👇 AÑADIR DrawingTools AQUÍ */}
  {tab === 'banquet' && (
    <DrawingTools
      activeTool={activeTool}
      onToolSelect={setActiveTool}
      onAddElement={handleAddDrawingElement}
      onDeleteElement={handleDeleteDrawingElement}
      elements={drawingElements}
      canvasRef={canvasRef}
      scale={1} // O el scale actual del canvas
      offset={{ x: 0, y: 0 }} // O el offset actual
    />
  )}

  {/* Canvas existente */}
  <SeatingPlanCanvas
    tables={tables}
    seats={seats}
    areas={areas}
    guests={guests}
    hallSize={hallSize}
    tab={tab}
    selectedTable={selectedTable}
    onSelectTable={handleSelectTable}
    onMoveTable={handleMoveTable}
    scale={1}
    offset={{ x: 0, y: 0 }}
  >
    {/* 👇 AÑADIR DrawingElements dentro del canvas */}
    {tab === 'banquet' && (
      <DrawingElements
        elements={drawingElements}
        scale={1}
        onSelectElement={handleSelectDrawingElement}
        selectedIds={drawingElements.filter((el) => el.selected).map((el) => el.id)}
      />
    )}
  </SeatingPlanCanvas>
</SeatingLayoutFloating.Canvas>
```

### PASO 6: Añadir modales de templates

```javascript
// Al final, junto con los otros modales (aprox línea 480)

{
  /* FASE 2: Template Selector Modal */
}
<TemplateSelector
  isOpen={templateSelectorOpen}
  onClose={() => setTemplateSelectorOpen(false)}
  onSelectTemplate={handleApplyTemplate}
  guestCount={stats.totalGuests}
/>;
```

---

## 🎨 PASO 7: Actualizar SeatingToolbarFloating.jsx

El toolbar necesita nuevos botones. Añadir en la lista de tools:

```javascript
// En SeatingToolbarFloating.jsx
const tools = [
  // ... tools existentes

  // 👇 AÑADIR ESTOS
  {
    id: 'templates',
    icon: Sparkles, // o el icono que prefieras
    label: 'Plantillas',
    shortcut: 'T',
    badge: 'NEW',
    onClick: onOpenTemplates, // Nuevo prop
  },
  {
    id: 'drawing',
    icon: PenTool, // o el icono que prefieras
    label: 'Herramientas de Dibujo',
    shortcut: 'B',
    onClick: onToggleDrawingTools, // Nuevo prop
  },
];
```

**Props nuevos a añadir en SeatingToolbarFloating:**

```javascript
export default function SeatingToolbarFloating({
  // ... props existentes
  onOpenTemplates,
  onToggleDrawingTools,
  hasDrawingElements,
  onClearDrawing,
}) {
  // ...
}
```

---

## 🚀 TESTING

Una vez integrado, probar:

1. ✅ Click en botón "Plantillas" → Debe abrir modal
2. ✅ Seleccionar plantilla → Debe generar mesas y zonas
3. ✅ Click en "Herramientas de Dibujo" → Debe mostrar barra
4. ✅ Dibujar perímetro, puertas, obstáculos → Deben aparecer
5. ✅ Seleccionar elementos → Deben resaltarse
6. ✅ Eliminar elementos → Deben desaparecer

---

## ⚡ ALTERNATIVA RÁPIDA (Si hay problemas de espacio)

En lugar de editar SeatingPlanModern.jsx directamente, puedes crear un **wrapper component**:

```javascript
// Crear: SeatingPlanModernEnhanced.jsx

import React, { useState } from 'react';
import SeatingPlanModern from './SeatingPlanModern';
import DrawingTools from './DrawingTools';
import DrawingElements from './DrawingElements';
import TemplateSelector from './WeddingTemplates';
import { createSeatingPlanDrawingHandlers } from './SeatingPlanHandlers';

export default function SeatingPlanModernEnhanced(props) {
  const [drawingElements, setDrawingElements] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // ... handlers aquí

  return (
    <>
      <SeatingPlanModern
        {...props}
        drawingToolsProps={{
          activeTool,
          elements: drawingElements,
          onAddElement: handleAddDrawingElement,
          // ... etc
        }}
      />

      <TemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />
    </>
  );
}
```

---

## 📊 ESTADO ACTUAL

- ✅ **Componentes:** 100% creados
- 🔄 **Integración:** 25% (imports añadidos, estados añadidos)
- ⏳ **Testing:** 0%

**Próximo paso:** Aplicar PASO 3-6 de esta guía

---

## 💡 NOTAS

- Los handlers están en un archivo separado para facilitar mantenimiento
- Drawing tools solo aparecen en tab "banquet"
- Templates son universales (funcionan en cualquier tab)
- Todos los componentes tienen TypeScript-style JSDoc

---

**Última actualización:** 13 Nov 2025, 03:03 AM
