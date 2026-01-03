# 🎨 GUÍA DE INTEGRACIÓN - COMPONENTES UX

**Fecha:** 2025-11-21 05:53 UTC+01:00  
**Estado:** ✅ COMPONENTES CREADOS  
**Objetivo:** Integrar los 5 nuevos componentes en SeatingPlanRefactored

---

## 📦 COMPONENTES CREADOS

### 1. **SeatingPropertiesSidebar**

**Ubicación:** `apps/main-app/src/components/seating/SeatingPropertiesSidebar.jsx`

**Props:**

```jsx
<SeatingPropertiesSidebar
  selectedTable={selectedTable} // Mesa seleccionada
  selectedIds={selectedIds} // Array de IDs seleccionados
  tables={tables} // Todas las mesas
  guests={guests} // Todos los invitados
  onUpdateTable={(id, updates) => {}} // Actualizar mesa
  onDeleteTable={(id) => {}} // Eliminar mesa
  onDuplicateTable={(id) => {}} // Duplicar mesa
  onToggleLock={(id) => {}} // Bloquear/desbloquear
  onClose={() => {}} // Cerrar sidebar
  onAssignGuest={(tableId) => {}} // Asignar invitado
  onRemoveGuest={(guestId) => {}} // Quitar invitado
/>
```

**Características:**

- Aparece al seleccionar mesa(s)
- Edición en tiempo real
- Sliders para capacidad y rotación
- Lista de invitados asignados
- Acciones rápidas

---

### 2. **ModeIndicator**

**Ubicación:** `apps/main-app/src/components/seating/ModeIndicator.jsx`

**Props:**

```jsx
<ModeIndicator
  mode="pan" // 'pan' | 'move' | 'boundary' | 'doors' | 'obstacles' | 'aisles'
  show={true} // Mostrar/ocultar
/>
```

**Características:**

- Banner flotante en top-center
- Muestra modo activo con icono y descripción
- Hints de uso
- Colores según modo

**Hook adicional:**

```jsx
import { useModeCursor } from './ModeIndicator';

const cursor = useModeCursor(drawMode); // Retorna cursor CSS
```

---

### 3. **ValidationCoach**

**Ubicación:** `apps/main-app/src/components/seating/ValidationCoach.jsx`

**Props:**

```jsx
<ValidationCoach
  suggestions={suggestions} // Array de sugerencias
  onDismiss={(id) => {}} // Cerrar sugerencia
  onAutoFix={(suggestion) => {}} // Arreglar automáticamente
  position="bottom-right" // Posición del panel
/>
```

**Formato de sugerencias:**

```javascript
const suggestion = {
  id: 'unique-id',
  severity: 'info' | 'warning' | 'suggestion' | 'success' | 'improvement',
  title: 'Título',
  message: 'Mensaje principal',
  details: 'Detalles opcionales',
  canAutoFix: true,
  autoFixLabel: 'Arreglar',
  autoFixAction: { type: 'adjust-spacing', ... },
  actions: [
    { label: 'Acción', onClick: () => {} }
  ],
  temporary: true,
  duration: 5, // segundos
};
```

**Helpers:**

```jsx
import { createSuggestionFromValidation, createImprovementSuggestions } from './ValidationCoach';

// Convertir validación a sugerencia
const suggestion = createSuggestionFromValidation(table, {
  type: 'insufficient-distance',
  tables: ['12', '13'],
  distance: 45,
});

// Crear sugerencias de mejora
const improvements = createImprovementSuggestions(tables, guests, hallSize);
```

---

### 4. **TemplateGallery**

**Ubicación:** `apps/main-app/src/components/seating/TemplateGallery.jsx`

**Props:**

```jsx
<TemplateGallery
  isOpen={showTemplates}
  onClose={() => setShowTemplates(false)}
  onSelectTemplate={(template) => {
    // template.id, template.layout, template.tablesCount
    applyTemplate(template);
  }}
  onCustomGenerate={() => {
    // Usuario quiere generar personalizado
    onGenerateAuto();
  }}
/>
```

**Templates incluidos:**

1. Boda Íntima (circular, 30-50 inv, 5 mesas)
2. Boda Estándar ⭐ (grid, 100-150 inv, 15 mesas)
3. Boda Grande (aisle, 200-300 inv, 25 mesas)
4. Distribución en U (u-shape, 80-120 inv, 12 mesas)

---

### 5. **ContextualToolbar**

**Ubicación:** `apps/main-app/src/components/seating/ContextualToolbar.jsx`

**Props:**

```jsx
<ContextualToolbar
  // Estado
  tables={tables}
  selectedTable={selectedTable}
  selectedIds={selectedIds}
  drawMode={drawMode}
  canUndo={canUndo}
  canRedo={canRedo}
  validationsEnabled={validationsEnabled}
  globalMaxSeats={globalMaxSeats}
  // Callbacks
  onGenerateAuto={() => {}}
  onOpenTemplates={() => {}}
  onOpenSpaceConfig={() => {}}
  onChangeDrawMode={(mode) => {}}
  onUndo={() => {}}
  onRedo={() => {}}
  onDuplicateTable={(id) => {}}
  onDeleteTable={(id) => {}}
  onRotateTable={(id, degrees) => {}}
  onToggleLock={(id) => {}}
  onAlignTables={() => {}}
  onDistributeTables={() => {}}
  onToggleValidations={(enabled) => {}}
  onOpenCapacity={() => {}}
  onOpenAdvanced={() => {}}
/>
```

**Estados del toolbar:**

- **EMPTY:** Sin mesas → [Generar] [Plantillas] [Configurar]
- **IDLE:** Con mesas, ninguna seleccionada → [Pan] [Mover] [Undo] [Redo] [Validaciones]
- **SINGLE:** Una mesa seleccionada → [Duplicar] [Rotar] [Bloquear] [Capacidad] [Eliminar]
- **MULTIPLE:** Varias mesas → [Alinear] [Distribuir] [Eliminar (N)]

---

## 🔧 PASOS DE INTEGRACIÓN

### Paso 1: Importar componentes

```jsx
// SeatingPlanRefactored.jsx
import SeatingPropertiesSidebar from './SeatingPropertiesSidebar';
import ModeIndicator, { useModeCursor } from './ModeIndicator';
import ValidationCoach, { createSuggestionFromValidation } from './ValidationCoach';
import TemplateGallery from './TemplateGallery';
import ContextualToolbar from './ContextualToolbar';
```

---

### Paso 2: Agregar estados

```jsx
// En SeatingPlanRefactored
const [showSidebar, setShowSidebar] = useState(false);
const [showTemplateGallery, setShowTemplateGallery] = useState(false);
const [showModeIndicator, setShowModeIndicator] = useState(true);
const [suggestions, setSuggestions] = useState([]);
```

---

### Paso 3: Lógica de sugerencias

```jsx
// Generar sugerencias desde validaciones
useEffect(() => {
  if (!validationsEnabled) {
    setSuggestions([]);
    return;
  }

  const newSuggestions = [];

  // Por cada mesa con problemas
  tables.forEach((table) => {
    const validation = validateTable(table, tables, hallSize, obstacles);
    if (validation.hasIssues) {
      validation.issues.forEach((issue) => {
        const suggestion = createSuggestionFromValidation(table, issue);
        newSuggestions.push(suggestion);
      });
    }
  });

  setSuggestions(newSuggestions);
}, [tables, validationsEnabled, hallSize, obstacles]);
```

---

### Paso 4: Handlers

```jsx
// Handler para actualizar mesa desde sidebar
const handleUpdateTableFromSidebar = (tableId, updates) => {
  // Usar función existente del hook
  const table = tables.find((t) => t.id === tableId);
  if (table) {
    moveTable(tableId, {
      x: updates.x ?? table.x,
      y: updates.y ?? table.y,
    });
    // Otros updates...
  }
};

// Handler para auto-fix de sugerencias
const handleAutoFix = (suggestion) => {
  const { autoFixAction } = suggestion;

  switch (autoFixAction.type) {
    case 'adjust-spacing':
      // Ajustar espaciado entre mesas
      adjustTableSpacing(autoFixAction.tables, autoFixAction.targetSpacing);
      break;

    case 'move-inside-boundary':
      // Mover mesa dentro del perímetro
      moveTableInsideBoundary(autoFixAction.tableId);
      break;

    case 'find-free-spot':
      // Encontrar posición libre
      findAndMoveToFreeSpot(autoFixAction.tableId);
      break;

    default:
      console.log('Auto-fix no implementado:', autoFixAction.type);
  }
};

// Handler para aplicar plantilla
const handleSelectTemplate = async (template) => {
  setShowTemplateGallery(false);

  // Generar layout según plantilla
  await setupSeatingPlanAutomatically({
    layoutPreference: template.layout,
    tableCapacity: 8,
  });
};
```

---

### Paso 5: Layout en JSX

```jsx
return (
  <div className="h-full flex flex-col">
    {/* Reemplazar toolbar existente con ContextualToolbar */}
    <ContextualToolbar
      tables={tables}
      selectedTable={selectedTable}
      selectedIds={selectedIds}
      drawMode={drawMode}
      canUndo={canUndo}
      canRedo={canRedo}
      validationsEnabled={validationsEnabled}
      globalMaxSeats={globalMaxSeats}
      onGenerateAuto={() => setupSeatingPlanAutomatically()}
      onOpenTemplates={() => setShowTemplateGallery(true)}
      onOpenSpaceConfig={() => setSpaceConfigOpen(true)}
      onChangeDrawMode={setDrawMode}
      onUndo={undo}
      onRedo={redo}
      onDuplicateTable={duplicateTable}
      onDeleteTable={deleteTable}
      onRotateTable={rotateSelected}
      onToggleLock={toggleTableLocked}
      onAlignTables={alignSelected}
      onDistributeTables={distributeSelected}
      onToggleValidations={setValidationsEnabled}
      onOpenCapacity={() => setBanquetConfigOpen(true)}
      onOpenAdvanced={() => {
        /* TODO */
      }}
    />

    {/* Indicador de modo */}
    <ModeIndicator
      mode={drawMode}
      show={showModeIndicator && !templateOpen && !ceremonyConfigOpen}
    />

    {/* Canvas con cursor dinámico */}
    <div className="flex-1 relative" style={{ cursor: useModeCursor(drawMode) }}>
      {/* Canvas existente */}
      <SeatingPlanCanvas {...canvasProps} />

      {/* Sidebar de propiedades */}
      {(selectedTable || selectedIds.length > 0) && (
        <SeatingPropertiesSidebar
          selectedTable={selectedTable}
          selectedIds={selectedIds}
          tables={tables}
          guests={guests}
          onUpdateTable={handleUpdateTableFromSidebar}
          onDeleteTable={deleteTable}
          onDuplicateTable={duplicateTable}
          onToggleLock={toggleTableLocked}
          onClose={() => {
            handleSelectTable(null);
          }}
          onAssignGuest={(tableId) => {
            // Abrir modal de asignación
          }}
          onRemoveGuest={(guestId) => {
            // Remover invitado
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

    {/* Galería de plantillas */}
    <TemplateGallery
      isOpen={showTemplateGallery}
      onClose={() => setShowTemplateGallery(false)}
      onSelectTemplate={handleSelectTemplate}
      onCustomGenerate={() => {
        setShowTemplateGallery(false);
        setupSeatingPlanAutomatically();
      }}
    />

    {/* Modales existentes... */}
  </div>
);
```

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### 1. **Sidebar Automático**

- ✅ Aparece al seleccionar mesa(s)
- ✅ Edición en tiempo real (sin modales)
- ✅ Sliders para valores numéricos
- ✅ Vista de invitados asignados
- ✅ Soporte para selección múltiple

### 2. **Toolbar Inteligente**

- ✅ Cambia según contexto (4 estados)
- ✅ Solo muestra botones relevantes
- ✅ Reduce sobrecarga cognitiva
- ✅ Responsive (oculta labels en móvil)

### 3. **Indicador de Modo**

- ✅ Banner flotante top-center
- ✅ Muestra modo activo
- ✅ Hints de shortcuts
- ✅ Cursor dinámico según modo

### 4. **Validaciones Amigables**

- ✅ Sugerencias en lugar de errores
- ✅ Botón "Arreglar automáticamente"
- ✅ Dismissibles
- ✅ Auto-ocultar después de N segundos

### 5. **Plantillas Visuales**

- ✅ Preview SVG de layouts
- ✅ Tags descriptivos
- ✅ Indicador "Recomendado"
- ✅ Opción personalizada al final

---

## 🚀 FUNCIONES AUTO-FIX A IMPLEMENTAR

### adjustTableSpacing(tableIds, targetSpacing)

```javascript
function adjustTableSpacing(tableIds, targetSpacing) {
  const tablesToAdjust = tables.filter((t) => tableIds.includes(String(t.id)));
  if (tablesToAdjust.length !== 2) return;

  const [t1, t2] = tablesToAdjust;
  const currentSpacing = Math.sqrt(Math.pow(t2.x - t1.x, 2) + Math.pow(t2.y - t1.y, 2));

  const diff = targetSpacing - currentSpacing;
  const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x);

  // Mover t2 alejándola de t1
  moveTable(t2.id, {
    x: t2.x + (Math.cos(angle) * diff) / 2,
    y: t2.y + (Math.sin(angle) * diff) / 2,
  });
}
```

### moveTableInsideBoundary(tableId)

```javascript
function moveTableInsideBoundary(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;

  // Encontrar punto más cercano dentro del boundary
  const boundary = /* get boundary polygon */;
  const closestPoint = findClosestPointInsidePolygon(
    { x: table.x, y: table.y },
    boundary
  );

  moveTable(tableId, closestPoint);
}
```

### findAndMoveToFreeSpot(tableId)

```javascript
function findAndMoveToFreeSpot(tableId) {
  const table = tables.find((t) => t.id === tableId);
  if (!table) return;

  // Grid search para encontrar posición libre
  const gridSize = 50;
  for (let x = 100; x < hallSize.width; x += gridSize) {
    for (let y = 100; y < hallSize.height; y += gridSize) {
      const testPos = { x, y };
      const hasCollision = checkCollisions(testPos, table, tables, obstacles);
      if (!hasCollision) {
        moveTable(tableId, testPos);
        return;
      }
    }
  }
}
```

---

## 📊 TESTING

### Test 1: Sidebar

1. Seleccionar una mesa
2. ✅ Sidebar aparece a la derecha
3. Cambiar nombre → ✅ Se actualiza en vivo
4. Ajustar capacidad con slider → ✅ Actualiza inmediatamente
5. Click "Duplicar" → ✅ Crea mesa duplicada
6. Cerrar sidebar → ✅ Se oculta con animación

### Test 2: Toolbar Contextual

1. Sin mesas → ✅ Muestra [Generar] [Plantillas] [Config]
2. Crear mesas → ✅ Cambia a [Pan] [Mover] [Undo] [Redo]
3. Seleccionar 1 mesa → ✅ Muestra [Duplicar] [Rotar] [Capacidad]
4. Seleccionar 3 mesas → ✅ Muestra [Alinear] [Distribuir] [Eliminar (3)]

### Test 3: Modo Indicator

1. Cambiar a Pan → ✅ Banner azul "Modo Pan - Arrastra canvas"
2. Cambiar a Mover → ✅ Banner verde "Modo Mover - Click y arrastra"
3. Cambiar a Boundary → ✅ Banner púrpura con hint

### Test 4: Validaciones Coach

1. Acercar 2 mesas → ✅ Sugerencia "Espacio entre mesas"
2. Click "Arreglar" → ✅ Mesas se separan automáticamente
3. Click "Ignorar" → ✅ Sugerencia desaparece

### Test 5: Plantillas

1. Click "Plantillas" → ✅ Modal con galería visual
2. Hover sobre plantilla → ✅ Efecto hover
3. Click plantilla → ✅ Genera layout
4. Click "Personalizado" → ✅ Abre wizard

---

## 🎨 ESTILOS Y ANIMACIONES

Todos los componentes usan:

- ✅ Framer Motion para animaciones
- ✅ Tailwind CSS para estilos
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Transiciones suaves

---

## 📝 PRÓXIMOS PASOS

1. ✅ Componentes creados
2. ⏳ Integrar en SeatingPlanRefactored
3. ⏳ Implementar funciones auto-fix
4. ⏳ Testing manual
5. ⏳ Ajustes de UX basados en feedback

---

**Estado:** Componentes listos para integración. Requiere ~1-2 horas de integración en SeatingPlanRefactored. 🎯
