# 🎯 PLAN DE MEJORAS - SEATING PLAN

**Fecha:** 2025-11-20  
**Estado:** 📋 Planificación  
**Prioridad:** Ordenado por urgencia

---

## ⚡ URGENTE - Hacer HOY (30-60 min)

### 1. ✅ Limpiar Logs de Debugging (30 min)

**Problema:** 50+ console statements activos causando overhead de performance.

**Impacto:**

- ~25 logs por movimiento de mesa
- Cientos de logs por segundo al arrastrar
- Ralentiza la UI

**Logs a remover:**

```javascript
// _useSeatingPlanDisabled.js
Línea 503: console.log('[setTablesBanquet] 🔄...')
Línea 509-510: console.log x2 por update
Línea 513-519: console.error + trace + warn
Línea 526-536: console.log + error x2
Línea 1193-1195: console.log x3 por click
Línea 1300-1307: console.log DEBUG
Línea 1315: console.log match
Línea 1322-1326: console.log RESULT
Línea 1330-1333: console.error x4
```

**Acción:**

- Comentar o remover todos los logs de debugging
- Mantener SOLO los console.error para errores críticos reales
- Mantener la LÓGICA de prevención de corrupción (líneas 512-520, 529-537)

**Resultado esperado:**

- Performance mejorada significativamente
- Console más limpia
- Mantener protecciones anti-corrupción

---

## 🔴 CRÍTICO - Esta Semana (4-6 horas)

### 2. 🧪 Tests E2E Automatizados (3-4 horas)

**Problema:** Sin tests, el bug de corrupción podría regresar.

**Tests necesarios:**

```javascript
// tests/e2e/seating-plan.spec.js

describe('Seating Plan - Críticos', () => {
  it('should maintain unique IDs for 25 tables', () => {
    // Generar 25 mesas
    // Verificar IDs únicos
  });

  it('should move only selected table', () => {
    // Generar mesas
    // Mover una mesa
    // Verificar que las otras 24 NO se movieron
  });

  it('should not move canvas when dragging table', () => {
    // Verificar que canvas permanece fijo
  });

  it('should prevent data corruption', () => {
    // Intentar crear estado corrupto
    // Verificar que se rechaza
  });
});
```

**Herramientas:** Cypress o Playwright

**Prioridad:** CRÍTICA - previene regresiones

---

### 3. 📦 Completar Fase 2 del Refactoring (2-3 horas)

**Problema:** Refactoring incompleto según `REFACTORIZACION-SEATING-PLAN-PROGRESO.md`

**Pendiente:**

- Actualizar todas las referencias de estado UI para usar `useSeatingUIState`
- Reducir complejidad de `SeatingPlanRefactored.jsx`
- Consolidar lógica duplicada

**Impacto:**

- Código más mantenible
- Menos bugs
- Más fácil de testear

---

## 🟡 IMPORTANTE - Próximas 2 Semanas (6-8 horas)

### 4. ⚡ Optimización de Performance (3-4 horas)

**Problema:** Re-renders innecesarios

**Mejoras:**

#### a) Memoización de TableItem

```javascript
// TableItem.jsx
export default React.memo(TableItem, (prev, next) => {
  return (
    prev.table.id === next.table.id &&
    prev.table.x === next.table.x &&
    prev.table.y === next.table.y &&
    prev.selected === next.selected
    // ... otros props críticos
  );
});
```

#### b) useMemo para cálculos costosos

```javascript
// Calcular solo cuando guests o tableId cambian
const guestCount = useMemo(() => {
  return guests.filter((g) => g.tableId === table.id).length;
}, [guests, table.id]);
```

#### c) useCallback para handlers

```javascript
const handleMove = useCallback(
  (id, pos) => {
    // ...
  },
  [dependencies]
);
```

**Impacto:** 30-50% mejora en performance con muchas mesas

---

### 5. 🎨 Mejoras de UX (3-4 horas)

#### a) Preview de Movimiento

```javascript
// Mostrar "ghost" de la mesa mientras se arrastra
<div className="table-ghost" style={{ opacity: 0.5, ... }} />
```

#### b) Feedback de Colisión en Tiempo Real

```javascript
// Borde rojo si hay colisión
style={{
  border: hasCollision ? '3px solid red' : '3px solid orange'
}}
```

#### c) Snap Guides Mejoradas

```javascript
// Guías más visibles y con animaciones
strokeWidth={2}  // Era 1.5
stroke="#4F46E5"  // Color más visible
```

#### d) Animaciones Suaves

```javascript
transition: 'transform 0.2s ease-out';
```

**Impacto:** UX profesional, menos frustración

---

## 🟢 MEJORAS FUTURAS - Backlog (12-20 horas)

### 6. ⏮️ Undo/Redo Funcional (4-5 horas)

**Estado:** `pushHistory` existe pero no hay UI

**Implementar:**

```javascript
// useUndoRedo.js
const [historyIndex, setHistoryIndex] = useState(-1);
const [history, setHistory] = useState([]);

const undo = () => {
  if (historyIndex > 0) {
    const prevState = history[historyIndex - 1];
    applyState(prevState);
    setHistoryIndex(historyIndex - 1);
  }
};

const redo = () => {
  if (historyIndex < history.length - 1) {
    const nextState = history[historyIndex + 1];
    applyState(nextState);
    setHistoryIndex(historyIndex + 1);
  }
};
```

**UI:**

- Botones Undo/Redo
- Atajos: Ctrl+Z, Ctrl+Shift+Z
- Indicador visual: "Undo available"

---

### 7. 🔄 Multi-selección Mejorada (3-4 horas)

**Mejoras:**

```javascript
// Drag-to-select con marquee (ya existe parcial)
// Mover múltiples mesas juntas
const moveSelectedTables = (delta) => {
  selectedIds.forEach((id) => {
    const table = tables.find((t) => t.id === id);
    moveTable(id, { x: table.x + delta.x, y: table.y + delta.y });
  });
};

// Alinear múltiples mesas
const alignTables = (direction) => {
  // Alinear horizontalmente o verticalmente
};
```

---

### 8. 🔑 Migrar a UUID (2-3 horas)

**Problema:** Dependencia de timestamps

**Solución:**

```javascript
// Instalar uuid
npm install uuid

// seatingTables.js
import { v4 as uuidv4 } from 'uuid';

export function createTableFromType(tableType, overrides = {}) {
  return {
    id: overrides.id ?? uuidv4(),  // ⬅️ UUID en lugar de Date.now()
    // ...
  };
}
```

**Beneficios:**

- IDs únicos garantizados
- No depende de timing
- Más robusto

---

### 9. 🗂️ State Management con useReducer (5-6 horas)

**Problema:** 30+ useState en el hook

**Refactor:**

```javascript
// seatingReducer.js
const initialState = {
  tablesBanquet: [],
  tablesCeremony: [],
  areasBanquet: [],
  areasCeremony: [],
  selectedTable: null,
  // ... todo el state unificado
};

function seatingReducer(state, action) {
  switch (action.type) {
    case 'MOVE_TABLE':
      return {
        ...state,
        tablesBanquet: state.tablesBanquet.map((t) =>
          t.id === action.tableId ? { ...t, x: action.pos.x, y: action.pos.y } : t
        ),
      };

    case 'ADD_TABLE':
      return {
        ...state,
        tablesBanquet: [...state.tablesBanquet, action.table],
      };

    // ... más acciones

    default:
      return state;
  }
}

// En el hook
const [state, dispatch] = useReducer(seatingReducer, initialState);

// Uso
dispatch({ type: 'MOVE_TABLE', tableId: 1, pos: { x: 100, y: 200 } });
```

**Beneficios:**

- State management predecible
- Más fácil de testear
- Mejor para debugging
- Time-travel debugging posible

---

### 10. ♿ Accesibilidad (a11y) (3-4 horas)

**Mejoras:**

#### a) Navegación por Teclado

```javascript
// Permitir mover mesas con flechas
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!selectedTable) return;

    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case 'ArrowUp':
        moveTable(selectedTable, { x: table.x, y: table.y - step });
        break;
      case 'ArrowDown':
        moveTable(selectedTable, { x: table.x, y: table.y + step });
        break;
      // ...
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedTable]);
```

#### b) ARIA Labels

```javascript
<div
  role="button"
  aria-label={`Mesa ${table.name}, ${guestCount} invitados, posición ${table.x}, ${table.y}`}
  tabIndex={0}
>
```

#### c) Focus Management

```javascript
// Focus visible
style={{
  outline: isFocused ? '3px solid blue' : 'none'
}}
```

---

## 📊 PRIORIZACIÓN RECOMENDADA

### Sprint 1 (Esta Semana)

```
Día 1: ⚡ Limpiar logs (0.5h)
Día 2-3: 🧪 Tests E2E (4h)
Día 4-5: 📦 Fase 2 refactor (3h)

Total: 7.5 horas
```

### Sprint 2 (Próxima Semana)

```
Día 1-2: ⚡ Performance (4h)
Día 3-5: 🎨 UX improvements (4h)

Total: 8 horas
```

### Sprint 3-4 (Siguientes 2 Semanas)

```
Backlog items según prioridad de negocio
```

---

## 🔥 QUICK WINS (Hacer Primero)

1. ✅ **Limpiar logs** (30 min) → Performance inmediata
2. ✅ **React.memo en TableItem** (1h) → 30% mejora
3. ✅ **Tests básicos** (2h) → Prevención de regresiones

---

## 📈 MÉTRICAS DE ÉXITO

### Performance

- **Antes:** ~100ms render time con 25 mesas
- **Meta:** <50ms render time

### Code Quality

- **Antes:** 4272 líneas en un archivo
- **Meta:** <3000 líneas, mejor separación

### Testing

- **Antes:** 0% cobertura
- **Meta:** 80% cobertura en funciones críticas

### UX

- **Antes:** Funcional pero básico
- **Meta:** Smooth, profesional, con feedback visual

---

## 🚨 RIESGOS

### Alto Riesgo

- ❌ No hacer tests → Bug puede regresar
- ❌ No optimizar → UX degradada con muchas mesas

### Medio Riesgo

- ⚠️ Refactor incompleto → Código confuso
- ⚠️ Logs en producción → Performance afectada

### Bajo Riesgo

- ⚡ UX sin pulir → Funcional pero no óptimo
- ⚡ Sin undo/redo → Usuario debe tener cuidado

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Semana 1

- [ ] Limpiar logs de debugging
- [ ] Crear tests E2E básicos
- [ ] Completar Fase 2 refactor

### Semana 2

- [ ] Implementar React.memo
- [ ] Agregar preview de arrastre
- [ ] Mejorar snap guides

### Backlog

- [ ] Implementar undo/redo
- [ ] Multi-selección mejorada
- [ ] Migrar a UUID
- [ ] State con useReducer
- [ ] Accesibilidad completa

---

**Próxima acción:** Limpiar logs de debugging (30 minutos)
