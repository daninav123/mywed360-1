# 🔧 INTEGRACIÓN PASO A PASO - Componentes UX en SeatingPlanRefactored

**Estado:** ✅ Imports y handlers YA AGREGADOS  
**Pendiente:** Reemplazar toolbar y agregar componentes al JSX

---

## ✅ COMPLETADO

### 1. Imports agregados (líneas 33-39)

```jsx
// ✅ NUEVOS COMPONENTES UX
import SeatingPropertiesSidebar from './SeatingPropertiesSidebar';
import ModeIndicator, { useModeCursor } from './ModeIndicator';
import ValidationCoach, {
  createSuggestionFromValidation,
  createImprovementSuggestions,
} from './ValidationCoach';
import TemplateGallery from './TemplateGallery';
import ContextualToolbar from './ContextualToolbar';
import * as AutoFixUtils from '../../utils/seatingAutoFix';
```

### 2. Estados agregados (líneas 191-197)

```jsx
// ✅ NUEVOS ESTADOS UX
const [showTemplateGalleryNew, setShowTemplateGalleryNew] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [showModeIndicator, setShowModeIndicator] = useState(true);

// Cursor dinámico según modo
const modeCursor = useModeCursor(drawMode);
```

### 3. Handlers agregados (líneas 848-946)

```jsx
const handleAutoFix = React.useCallback((suggestion) => { ... });
const handleUpdateTableFromSidebar = React.useCallback((tableId, updates) => { ... });
const handleSelectTemplateNew = React.useCallback(async (template) => { ... });
```

---

## 📝 PASO 1: Reemplazar SeatingPlanToolbar

**Ubicación:** Línea ~1684

**Buscar:**

```jsx
<SeatingPlanToolbar
  tab={tab}
  onUndo={undo}
  // ... muchas props
/>
```

**Reemplazar con:**

```jsx
<ContextualToolbar
  // Estado
  tables={safeTables}
  selectedTable={selectedTable}
  selectedIds={selectedIds}
  drawMode={drawMode}
  canUndo={canUndo}
  canRedo={canRedo}
  validationsEnabled={validationsEnabled}
  globalMaxSeats={globalMaxSeats}
  // Callbacks
  onGenerateAuto={() => {
    if (typeof generateAutoLayoutFromGuests === 'function') {
      generateAutoLayoutFromGuests('columns');
    }
  }}
  onOpenTemplates={() => setShowTemplateGalleryNew(true)}
  onOpenSpaceConfig={handleOpenSpaceConfig}
  onChangeDrawMode={setDrawMode}
  onUndo={undo}
  onRedo={redo}
  onDuplicateTable={duplicateTable}
  onDeleteTable={deleteTable}
  onRotateTable={(id, degrees) => rotateSelected(degrees)}
  onToggleLock={toggleTableLocked}
  onAlignTables={() => alignSelected('horizontal', 'start')}
  onDistributeTables={() => distributeSelected('x')}
  onToggleValidations={(enabled) => setValidationsEnabled(enabled)}
  onOpenCapacity={() => setBanquetConfigOpen(true)}
  onOpenAdvanced={() => setShowAdvancedTools(true)}
/>
```

---

## 📝 PASO 2: Agregar ModeIndicator

**Ubicación:** Después de los tabs y toolbar, antes del canvas

**Código a agregar:**

```jsx
{
  /* Indicador de modo activo */
}
<ModeIndicator
  mode={drawMode}
  show={showModeIndicator && !templateOpen && !ceremonyConfigOpen && !banquetConfigOpen}
/>;
```

---

## 📝 PASO 3: Modificar renderCanvas

**Ubicación:** Función renderCanvas (línea ~1393)

**Buscar:**

```jsx
const renderCanvas = (className = 'h-full') => (
  <SeatingPlanCanvas
    tab={tab}
    // ... props
  />
);
```

**Reemplazar con:**

```jsx
const renderCanvas = (className = 'h-full') => (
  <div className="relative h-full" style={{ cursor: modeCursor }}>
    <SeatingPlanCanvas
      tab={tab}
      areas={safeAreas}
      // ... todas las props existentes
    />

    {/* Sidebar de propiedades */}
    {(selectedTable || selectedIds.length > 0) && (
      <SeatingPropertiesSidebar
        selectedTable={selectedTable}
        selectedIds={selectedIds}
        tables={safeTables}
        guests={safeGuests}
        onUpdateTable={handleUpdateTableFromSidebar}
        onDeleteTable={deleteTable}
        onDuplicateTable={duplicateTable}
        onToggleLock={toggleTableLocked}
        onClose={() => handleSelectTable(null)}
        onAssignGuest={(tableId) => {
          // Abrir drawer de invitados para asignar
          setGuestDrawerOpen(true);
        }}
        onRemoveGuest={(guestId) => {
          moveGuest(guestId, null);
        }}
      />
    )}

    {/* Validaciones coach */}
    <ValidationCoach
      suggestions={suggestions}
      onDismiss={(id) => {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      }}
      onAutoFix={handleAutoFix}
      position="bottom-right"
    />
  </div>
);
```

---

## 📝 PASO 4: Agregar TemplateGallery al final

**Ubicación:** Antes del cierre de `</DndProvider>`, después de todos los modales

**Código a agregar:**

```jsx
{
  /* Galería de plantillas nueva */
}
<TemplateGallery
  isOpen={showTemplateGalleryNew}
  onClose={() => setShowTemplateGalleryNew(false)}
  onSelectTemplate={handleSelectTemplateNew}
  onCustomGenerate={() => {
    setShowTemplateGalleryNew(false);
    if (typeof generateAutoLayoutFromGuests === 'function') {
      generateAutoLayoutFromGuests('columns');
    }
  }}
/>;
```

---

## 📝 PASO 5: Agregar lógica de sugerencias

**Ubicación:** Después de los useEffect existentes, agregar nuevo useEffect

**Código a agregar:**

```jsx
// Generar sugerencias desde validaciones
useEffect(() => {
  if (!validationsEnabled || tab !== 'banquet') {
    setSuggestions([]);
    return;
  }

  const newSuggestions = [];

  // Por cada mesa, verificar validaciones
  safeTables.forEach((table) => {
    // Verificar distancia con otras mesas
    safeTables.forEach((other) => {
      if (table.id === other.id) return;

      const dx = table.x - other.x;
      const dy = table.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const minDistance = 140; // 140cm = 120cm diámetro + 20cm margen

      if (distance < minDistance) {
        const suggestionId = `spacing-${table.id}-${other.id}`;
        if (!newSuggestions.find((s) => s.id === suggestionId)) {
          newSuggestions.push({
            id: suggestionId,
            severity: 'suggestion',
            title: '💡 Espacio entre mesas',
            message: `Las mesas están un poco juntas (${Math.round(distance)}cm).`,
            details: 'Considera separarlas a 100cm para mejor circulación.',
            canAutoFix: true,
            autoFixLabel: 'Separar automáticamente',
            autoFixAction: {
              type: 'adjust-spacing',
              tables: [String(table.id), String(other.id)],
              targetSpacing: 220, // 220cm entre centros = 100cm libres
            },
          });
        }
      }
    });
  });

  // Sugerencias de mejora
  if (safeTables.length > 0 && safeGuests.length > 0) {
    const improvements = createImprovementSuggestions(safeTables, safeGuests, safeHallSize);
    newSuggestions.push(...improvements);
  }

  setSuggestions(newSuggestions.slice(0, 3)); // Máximo 3 sugerencias visibles
}, [safeTables, validationsEnabled, tab, safeGuests, safeHallSize]);
```

---

## 🎯 RESUMEN DE CAMBIOS

### Archivos a modificar: 1

- ✅ `SeatingPlanRefactored.jsx` (ya modificado parcialmente)

### Cambios pendientes en SeatingPlanRefactored.jsx:

1. ✅ Imports agregados
2. ✅ Estados agregados
3. ✅ Handlers agregados
4. ⏳ **Reemplazar SeatingPlanToolbar** → ContextualToolbar
5. ⏳ **Agregar ModeIndicator** después del toolbar
6. ⏳ **Modificar renderCanvas** para incluir Sidebar y ValidationCoach
7. ⏳ **Agregar TemplateGallery** al final
8. ⏳ **Agregar useEffect** para generar sugerencias

---

## 🧪 TESTING DESPUÉS DE INTEGRAR

### Test 1: ContextualToolbar

1. Sin mesas → ✅ Muestra [Generar] [Plantillas] [Config]
2. Con mesas → ✅ Muestra [Pan] [Mover] [Undo] [Redo]
3. Seleccionar mesa → ✅ Muestra opciones de mesa

### Test 2: Sidebar

1. Click en mesa → ✅ Sidebar aparece
2. Cambiar capacidad → ✅ Actualiza
3. Cerrar → ✅ Se oculta

### Test 3: ModeIndicator

1. Cambiar modo → ✅ Banner cambia de color
2. Muestra hints correctos

### Test 4: ValidationCoach

1. Mesas juntas → ✅ Sugerencia aparece
2. Click "Arreglar" → ✅ Mesas se separan
3. Dismissible funciona

### Test 5: TemplateGallery

1. Click "Plantillas" en toolbar → ✅ Modal abre
2. Seleccionar plantilla → ✅ Genera layout

---

## 📁 UBICACIÓN DE ARCHIVOS

### Componentes nuevos (ya creados):

- ✅ `apps/main-app/src/components/seating/SeatingPropertiesSidebar.jsx`
- ✅ `apps/main-app/src/components/seating/ModeIndicator.jsx`
- ✅ `apps/main-app/src/components/seating/ValidationCoach.jsx`
- ✅ `apps/main-app/src/components/seating/TemplateGallery.jsx`
- ✅ `apps/main-app/src/components/seating/ContextualToolbar.jsx`

### Utilidades (ya creadas):

- ✅ `apps/main-app/src/utils/seatingAutoFix.js`

### Archivo a modificar:

- ⏳ `apps/main-app/src/components/seating/SeatingPlanRefactored.jsx`

---

## ⚠️ IMPORTANTE

**NO eliminar SeatingPlanToolbar del proyecto**, otros componentes podrían usarlo.

Solo reemplazar su uso en SeatingPlanRefactored con ContextualToolbar.

---

## ✅ CHECKLIST

- [x] Imports agregados
- [x] Estados agregados
- [x] Handlers agregados
- [ ] Reemplazar SeatingPlanToolbar
- [ ] Agregar ModeIndicator
- [ ] Modificar renderCanvas
- [ ] Agregar TemplateGallery
- [ ] Agregar useEffect sugerencias
- [ ] Testing manual

---

**Siguiente paso:** Aplicar cambios 4-8 en SeatingPlanRefactored.jsx
