# 🔍 Análisis Exhaustivo: Seating Plan

**Fecha:** 20 Noviembre 2025, 22:00  
**Componente Principal:** `SeatingPlanRefactored.jsx` (2,166 líneas)

---

## 📊 Métricas del Proyecto

### Archivos y Líneas de Código

| Componente                    | Líneas  | Complejidad |
| ----------------------------- | ------- | ----------- |
| **SeatingPlanRefactored.jsx** | 2,166   | ⚠️ MUY ALTA |
| SeatingPlanToolbar.jsx        | 853     | ⚠️ ALTA     |
| SeatingPlanModern.jsx         | 820     | ⚠️ ALTA     |
| SeatingPlanCanvas.jsx         | 780     | ⚠️ ALTA     |
| SeatingPlanSidebar.jsx        | 756     | ⚠️ ALTA     |
| **Total proyecto Seating**    | ~21,000 | ⚠️ EXTREMA  |

### Componentes Importados

- **27 componentes diferentes** importados en SeatingPlanRefactored
- **24 useState** en el componente principal
- **Múltiples efectos** (useEffect, useMemo, useCallback)

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **Complejidad Extrema del Componente Principal** 🔴 CRÍTICO

#### Problema

`SeatingPlanRefactored.jsx` tiene **2,166 líneas** en un solo archivo.

#### Evidencia

```jsx
// 27 imports de componentes
import SeatingGuestDrawer from './SeatingGuestDrawer';
import SeatingInspectorPanel from './SeatingInspectorPanel';
import SeatingLibraryPanel from './SeatingLibraryPanel';
// ... 24 más

// 24 useState diferentes
const [showTables, setShowTables] = React.useState(true);
const [showRulers, setShowRulers] = React.useState(true);
const [backgroundOpen, setBackgroundOpen] = React.useState(false);
// ... 21 más
```

#### Impacto

- ❌ Imposible de mantener
- ❌ Alto riesgo de bugs
- ❌ Rerenders innecesarios
- ❌ Performance degradada

#### Recomendación

**Dividir en 5-7 componentes más pequeños:**

1. `SeatingPlanLayout.jsx` - Layout principal
2. `SeatingPlanState.jsx` - Hook personalizado para estado
3. `SeatingPlanPanels.jsx` - Gestión de paneles
4. `SeatingPlanModals.jsx` - Gestión de modales
5. `SeatingPlanCanvas.jsx` - Canvas (ya existe)

---

### 2. **Exceso de Estados Locales** 🔴 CRÍTICO

#### Estados Encontrados (24 total)

**UI States (15):**

```javascript
(showTables,
  showRulers,
  backgroundOpen,
  capacityOpen,
  showSeatNumbers,
  guidedGuestId,
  isMobile,
  guestSidebarOpen,
  showAdvancedTools,
  showLibraryPanel,
  showInspectorPanel,
  showSmartPanelPinned,
  showOverview,
  designFocusMode,
  ceremonyActiveRow);
```

**Modal States (7):**

```javascript
(guestDrawerOpen,
  exportWizardOpen,
  autoLayoutModalOpen,
  templateGalleryOpen,
  exportWizardEnhancedOpen,
  showTour,
  tooltipState);
```

**Canvas States (2):**

```javascript
(viewport, focusTableId);
```

#### Problema

- Demasiados estados dispersos
- Difícil de sincronizar
- Alto riesgo de estado inconsistente

#### Recomendación

**Consolidar en 3 objetos:**

```javascript
const [uiState, setUiState] = useState({
  showTables: true,
  showRulers: true,
  showSeatNumbers: false,
  // ... todos los UI states
});

const [modalState, setModalState] = useState({
  guestDrawer: false,
  exportWizard: false,
  // ... todos los modal states
});

const [canvasState, setCanvasState] = useState({
  viewport: { scale: 1, offset: { x: 0, y: 0 } },
  focusTableId: null,
});
```

---

### 3. **Mojibakes en Código** 🟡 MEDIO

#### Textos Mal Codificados

```javascript
const AREA_TYPE_META = {
  boundary: { label: 'Permetro', color: '#2563eb', order: 1 },
  //                     ⬆️ Debería ser "Perímetro"

  obstacle: { label: 'Obstéculos', color: '#f97316', order: 4 },
  //                     ⬆️ Debería ser "Obstáculos"

  kids: { label: 'rea infantil', color: '#f59e0b', order: 7 },
  //             ⬆️ Debería ser "Área infantil"

  free: { label: 'rea libre', color: '#4b5563', order: 8 },
  //             ⬆️ Debería ser "Área libre"
};
```

#### Impacto

- Textos ilegibles en la UI
- Mala experiencia de usuario

#### Solución

Reemplazar con caracteres correctos UTF-8.

---

### 4. **Componentes Duplicados/Redundantes** 🟡 MEDIO

#### Evidencia

```javascript
// ¿Cuál es la diferencia?
import SeatingExportWizard from './SeatingExportWizard'; // 754 líneas
import ExportWizardEnhanced from './ExportWizardEnhanced'; // 387 líneas

// ¿Cuál es la diferencia?
import SeatingPlanRefactored from './SeatingPlanRefactored'; // 2,166 líneas
import SeatingPlanModern from './SeatingPlanModern'; // 820 líneas

// ¿Son diferentes?
import SeatingGuestDrawer from './SeatingGuestDrawer'; // 324 líneas
import SeatingGuestSidebar from './SeatingGuestSidebar'; // 557 líneas
```

#### Problema

- Funcionalidad duplicada
- No está claro cuál usar
- Mantenimiento duplicado

#### Recomendación

**Consolidar componentes duplicados:**

- Mantener solo 1 export wizard
- Mantener solo 1 guest panel
- Eliminar versiones obsoletas

---

### 5. **LocalStorage Sin Estrategia Clara** 🟡 MEDIO

#### Evidencia

```javascript
// Múltiples claves de localStorage
const uiPrefsKey = `seatingPlan:${activeWedding}:ui-prefs`;
localStorage.getItem('seating-has-visited');
// ... probablemente más

// Lógica de persistencia compleja y repetitiva (100+ líneas)
const persistUiPrefs = React.useCallback(
  (patch) => {
    if (typeof window === 'undefined' || !patch) return;
    try {
      const currentRaw = window.localStorage.getItem(uiPrefsKey);
      let base = {};
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw);
          if (parsed && typeof parsed === 'object') {
            base = parsed;
          }
        } catch (_) {
          base = {};
        }
      }
      window.localStorage.setItem(uiPrefsKey, JSON.stringify({ ...base, ...patch }));
    } catch (_) {}
  },
  [uiPrefsKey]
);
```

#### Problema

- Lógica repetitiva
- Error handling silencioso
- No hay estrategia de migración

#### Recomendación

**Crear servicio centralizado:**

```javascript
// services/seatingStorage.js
export const seatingStorage = {
  saveUIPrefs: (weddingId, prefs) => { ... },
  loadUIPrefs: (weddingId) => { ... },
  clearUIPrefs: (weddingId) => { ... },
};
```

---

### 6. **Lógica de Negocio Mezclada con UI** 🟡 MEDIO

#### Evidencia

```javascript
// En el componente principal (UI)
const resolveAreaType = (area) => {
  const rawType = typeof area?.type === 'string' ? area.type : ...
  let normalized = typeof rawType === 'string' ? rawType.trim().toLowerCase() : null;
  if (!normalized && area && typeof area.drawMode === 'string') {
    normalized = area.drawMode.trim().toLowerCase();
  }
  // ... 15 líneas más de lógica
  return normalized;
};

const sanitizeOnboardingState = (value) => {
  if (!value || typeof value !== 'object') {
    return createDefaultOnboardingState();
  }
  // ... lógica de transformación
};
```

#### Problema

- Lógica de negocio mezclada con componente de UI
- Difícil de testear
- No reutilizable

#### Recomendación

**Mover a utilidades:**

```javascript
// utils/seatingAreas.js
export const resolveAreaType = (area) => { ... };
export const sanitizeOnboardingState = (value) => { ... };
```

---

### 7. **Renderizado Condicional Complejo** 🟡 MEDIO

#### Evidencia

```javascript
const gridColumns = React.useMemo(() => {
  const cols = [];
  if (showLibraryPanel) cols.push('18rem');
  cols.push('1fr');
  if (showSmartPanel && !isMobile) cols.push('18rem');
  if (showInspectorPanel) cols.push('20rem');
  if (showGuestSidebar) cols.push('22rem');
  return cols.join(' ');
}, [showLibraryPanel, showSmartPanel, showInspectorPanel, showGuestSidebar, isMobile]);

// Múltiples condiciones para mostrar paneles
const smartPanelEligible = tab === 'banquet';
const showSmartPanel = smartPanelEligible && showSmartPanelPinned;
const showGuestSidebar = guestSidebarOpen && !isMobile;
```

#### Problema

- Lógica de layout compleja
- Difícil de entender
- Propenso a bugs

#### Recomendación

**Usar un sistema de layout más declarativo:**

```javascript
const layouts = {
  desktop: ['library', 'canvas', 'smart', 'inspector', 'guests'],
  tablet: ['library', 'canvas', 'inspector'],
  mobile: ['canvas'],
};

const currentLayout = getCurrentLayout(isMobile, showSmartPanel, ...);
```

---

## 🎯 FUNCIONALIDADES QUE PUEDEN NO FUNCIONAR

### 1. **Tour Interactivo** ⚠️

```javascript
const [showTour, setShowTour] = React.useState(false);
// ... pero solo se usa para mostrar/ocultar
// No hay lógica clara de pasos
```

**Estado:** Probablemente incompleto

### 2. **Colaboración en Tiempo Real** ⚠️

```javascript
const otherCollaborators = React.useMemo(
  () => Array.isArray(collaborators) ? collaborators.filter(...) : [],
  [collaborators]
);
```

**Estado:** Implementado parcialmente, puede que no funcione

### 3. **Drag Ghost Preview** ⚠️

```javascript
const { dragState, startDrag, updateDrag, endDrag } = useDragGhost();
// Se importa pero no se ve uso claro
```

**Estado:** Posiblemente no integrado correctamente

### 4. **AI Assistant Chat** ⚠️

```javascript
import AIAssistantChat from './AIAssistantChat.jsx'; // 325 líneas
// Se importa pero no se ve renderizado
```

**Estado:** Posiblemente no conectado

---

## 📋 FUNCIONALIDADES POSIBLEMENTE DUPLICADAS

### Export Features

- `SeatingExportWizard.jsx` (754 líneas)
- `ExportWizardEnhanced.jsx` (387 líneas)
- `EnhancedExportModal.jsx` (397 líneas)

### Guest Management

- `SeatingGuestDrawer.jsx` (324 líneas)
- `SeatingGuestSidebar.jsx` (557 líneas)

### Layout Generation

- `SeatingLayoutGenerator.jsx` (554 líneas)
- `AutoLayoutModal.jsx`
- `generateAutoLayoutFromGuests` (función del hook)

### Templates

- `TemplateGalleryModal.jsx` (275 líneas)
- `WeddingTemplates.jsx` (507 líneas)
- `LayoutTemplates.jsx` (274 líneas)

---

## 🚀 PLAN DE REFACTORIZACIÓN

### Fase 1 - CRÍTICO (1-2 semanas)

#### 1.1 Corregir Mojibakes

```javascript
// Antes
boundary: { label: 'Permetro', ... }
// Después
boundary: { label: 'Perímetro', ... }
```

#### 1.2 Consolidar Estados

```javascript
// Crear hook personalizado
const useSeatingUIState = () => {
  const [uiState, setUIState] = useState({...});
  const [modalState, setModalState] = useState({...});
  return { uiState, modalState, ... };
};
```

#### 1.3 Extraer Lógica de Negocio

```javascript
// utils/seatingAreas.js
// utils/seatingStorage.js
// utils/seatingLayout.js
```

---

### Fase 2 - ALTO (2-3 semanas)

#### 2.1 Dividir Componente Principal

- SeatingPlanRefactored.jsx (2,166 líneas) → 5 componentes (~400 líneas c/u)

#### 2.2 Eliminar Duplicados

- Decidir qué export wizard mantener
- Consolidar guest panels
- Unificar template galleries

#### 2.3 Crear Sistema de Layout

- Layout declarativo
- Responsive design mejorado

---

### Fase 3 - MEDIO (3-4 semanas)

#### 3.1 Completar Funcionalidades

- Tour interactivo
- Colaboración en tiempo real
- AI Assistant

#### 3.2 Performance

- Code splitting
- Lazy loading de paneles
- Memoización estratégica

---

## 📊 MÉTRICAS DE MEJORA ESPERADAS

| Métrica                         | Actual  | Objetivo | Mejora  |
| ------------------------------- | ------- | -------- | ------- |
| **Líneas componente principal** | 2,166   | ~400     | ⬇️ 80%  |
| **Estados locales**             | 24      | 8        | ⬇️ 67%  |
| **Componentes totales**         | 41      | 25       | ⬇️ 39%  |
| **Duplicación código**          | Alta    | Baja     | ⬇️ 50%  |
| **Tests**                       | Parcial | Completo | ⬆️ 100% |

---

## ✅ LO QUE FUNCIONA BIEN

1. ✅ **Hook useSeatingPlan** - Abstracción de estado
2. ✅ **DnD Provider** - Drag & drop funciona
3. ✅ **Canvas rendering** - Visualización correcta
4. ✅ **Persistencia básica** - LocalStorage funciona
5. ✅ **Responsividad** - Detecta mobile correctamente

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Inmediato (Esta semana)

1. ✅ Corregir mojibakes
2. ✅ Documentar funcionalidades duplicadas
3. ✅ Crear lista de componentes a eliminar

### Corto Plazo (1 mes)

4. ⏳ Consolidar estados
5. ⏳ Extraer lógica de negocio
6. ⏳ Dividir componente principal

### Medio Plazo (2-3 meses)

7. ⏳ Eliminar duplicados
8. ⏳ Completar funcionalidades
9. ⏳ Optimizar performance

---

**Análisis completado:** 2025-11-20 22:00 UTC+01:00  
**Próxima acción:** Corregir mojibakes y consolidar estados
