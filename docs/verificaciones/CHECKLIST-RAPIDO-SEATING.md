# ✅ CHECKLIST RÁPIDO - SEATING PLAN

**Para terminar la integración en 30 minutos**

---

## 🚀 INICIO RÁPIDO

Los puertos ya están levantados:

- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:4004

---

## 📋 PASOS (En orden)

### ☐ PASO 1: Añadir import en SeatingPlanModern.jsx (2 min)

```javascript
// Línea ~36, después de los imports existentes:
import { createSeatingPlanDrawingHandlers } from './SeatingPlanHandlers';
```

### ☐ PASO 2: Crear handlers con useMemo (5 min)

```javascript
// Añadir después de handleGenerateLayout (línea ~337):

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

### ☐ PASO 3: Actualizar SeatingToolbarFloating props (3 min)

```javascript
// Línea ~390, añadir estos props:
<SeatingToolbarFloating
  {/* ... props existentes ... */}
  onOpenTemplates={() => setTemplateSelectorOpen(true)}
  onToggleDrawingTools={() => setActiveTool(
    activeTool === DRAWING_TOOLS.SELECT
      ? DRAWING_TOOLS.PERIMETER
      : DRAWING_TOOLS.SELECT
  )}
/>
```

### ☐ PASO 4: Integrar DrawingTools en canvas (5 min)

```javascript
// Dentro de <SeatingLayoutFloating.Canvas> (línea ~420):
<SeatingLayoutFloating.Canvas ref={canvasRef}>
  {tab === 'banquet' && (
    <DrawingTools
      activeTool={activeTool}
      onToolSelect={setActiveTool}
      onAddElement={handleAddDrawingElement}
      onDeleteElement={handleDeleteDrawingElement}
      elements={drawingElements}
      canvasRef={canvasRef}
      scale={1}
      offset={{ x: 0, y: 0 }}
    />
  )}

  {/* Canvas existente */}
  <SeatingPlanCanvas {...existingProps}>
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

### ☐ PASO 5: Añadir modal de Templates (2 min)

```javascript
// Al final del return, con los otros modales (línea ~480):
<TemplateSelector
  isOpen={templateSelectorOpen}
  onClose={() => setTemplateSelectorOpen(false)}
  onSelectTemplate={handleApplyTemplate}
  guestCount={stats.totalGuests}
/>
```

### ☐ PASO 6: Actualizar SeatingToolbarFloating.jsx (8 min)

**Añadir nuevos props:**

```javascript
export default function SeatingToolbarFloating({
  // ... props existentes
  onOpenTemplates,
  onToggleDrawingTools,
}) {
```

**Añadir botones a la lista de tools:**

```javascript
const tools = [
  // ... tools existentes
  {
    id: 'templates',
    icon: Sparkles,
    label: 'Plantillas',
    shortcut: 'T',
    badge: 'NEW',
    onClick: onOpenTemplates,
  },
  {
    id: 'drawing',
    icon: PenTool,
    label: 'Dibujo',
    shortcut: 'B',
    onClick: onToggleDrawingTools,
  },
];
```

### ☐ PASO 7: Añadir imports de iconos (1 min)

```javascript
// En SeatingToolbarFloating.jsx:
import { Sparkles, PenTool } from 'lucide-react';
```

---

## 🧪 TESTING RÁPIDO (5 min)

### ☐ Test 1: Plantillas

1. Click botón "Plantillas" (badge NEW)
2. Seleccionar "Imperial Clásico"
3. Verificar que aparecen mesas

### ☐ Test 2: Herramientas

1. Click botón "Dibujo"
2. Seleccionar herramienta "Perímetro" (P)
3. Click en canvas para dibujar puntos
4. Presionar Enter para finalizar

### ☐ Test 3: Zonas

1. Herramienta activa: "Zona especial" (Z)
2. Click para abrir menú de zonas
3. Seleccionar "DJ"
4. Click en canvas para colocar

---

## 🐛 SI HAY ERRORES

### Import no encontrado:

```bash
# Verificar que los archivos existen:
ls apps/main-app/src/components/seating/Drawing*.jsx
ls apps/main-app/src/components/seating/WeddingTemplates.jsx
ls apps/main-app/src/components/seating/SeatingPlanHandlers.js
```

### Props undefined:

- Verificar que todos los handlers están desestructurados
- Verificar que drawingElements está en el estado

### Mesas siguen cuadradas:

1. Hard refresh: Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows)
2. Abrir consola (F12)
3. Buscar logs: `[createTable]` y `[SeatingPlanModern]`
4. Copiar y pegar aquí los logs

---

## 📊 PROGRESO

- [x] ✅ Componentes creados (100%)
- [x] ✅ Documentación (100%)
- [ ] 🔄 Integración UI (33%)
- [ ] ⏳ Testing (0%)

---

## ⏱️ TIEMPO ESTIMADO TOTAL: 30 minutos

**Distribución:**

- Pasos 1-5: 17 minutos
- Paso 6-7: 9 minutos
- Testing: 4 minutos

---

## 📞 AYUDA RÁPIDA

**Archivos clave:**

- `GUIA-INTEGRACION-SEATING.md` - Guía detallada
- `RESUMEN-EJECUTIVO-SEATING-PLAN.md` - Estado completo
- `SeatingPlanHandlers.js` - Handlers listos para usar

**Logs útiles:**

- `[SeatingPlanModern]` - Actions del componente principal
- `[DrawingTools]` - Herramientas de dibujo
- `[Template]` - Aplicación de plantillas
- `[createTable]` - Creación de mesas

---

## 🎉 AL TERMINAR

Tendrás:

- ✅ Sistema completo de herramientas de dibujo
- ✅ 8 plantillas profesionales funcionales
- ✅ Generador de layouts automático
- ✅ Sincronización RSVP-Seating
- ✅ Actualización de capacidad de mesas

**Seating Plan: 100% FUNCIONAL** 🚀

---

**Última actualización:** 13 Nov 2025, 03:05 AM
