# 🚨 ANÁLISIS CRÍTICO - Corrupción de Datos Seating Plan

**Fecha:** 2025-11-20 22:45 UTC+01:00  
**Severidad:** 🔴 **CRÍTICA** - Pérdida de datos del usuario  
**Estado:** 🔍 EN INVESTIGACIÓN

---

## 🎯 SÍNTOMA DEL PROBLEMA

### Descripción

Al mover cualquier mesa en el Seating Plan, **TODAS las 25 mesas terminan en la MISMA posición**, perdiendo completamente la distribución del layout.

### Evidencia de Logs

```javascript
// INICIO: 25 mesas en posiciones diferentes
[applyBanquetTables] Posiciones ANTES: (460,220), (680,220), (900,220)...
[setTablesBanquet] Direct call - Total: 25 Únicas: 25 ✅ CORRECTO

// DESPUÉS DE MOVER UNA MESA: Todas en la misma posición
[setTablesBanquet] Function call - Total: 25 Únicas: 1 ❌ CORRUPTO
[setTablesBanquet] Primeras 5: (1340,220), (1340,220), (1340,220), (1340,220), (1340,220)

🔴 DATOS CORRUPTOS DETECTADOS!
  total: 25
  posicionesUnicas: 1  // ¡Solo 1 posición para 25 mesas!
```

---

## 🔍 FLUJO DEL ERROR

### 1. Usuario Arrastra Mesa

```
TableItem.jsx:190 → onMove(table.id, pos, {finalize: false})
                     ↓
_useSeatingPlanDisabled.js:1281 → moveTable(tableId, pos)
                     ↓
Línea 1293-1296 → apply() y setTablesBanquet()
```

### 2. Código de moveTable (líneas 1281-1308)

```javascript
const moveTable = (tableId, pos, { finalize } = { finalize: true }) => {
  const currentTables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;

  // Verificar colisión
  if (finalize && checkTableCollision(tableId, pos, currentTables)) {
    toast.warning('⚠️ No se puede mover: colisión con otra mesa');
    return false;
  }

  // ⚠️ SOSPECHOSO: closure de tableId y pos
  const apply = (prev) =>
    prev.map((t) => (String(t.id) === String(tableId) ? { ...t, x: pos.x, y: pos.y } : t));

  if (tab === 'ceremony') setTablesCeremony((p) => apply(p));
  else setTablesBanquet((p) => apply(p));  // ⚠️ AQUÍ OCURRE LA CORRUPCIÓN

  if (finalize) {
    pushHistory({...});  // ⚠️ Usa estado ANTIGUO
  }
  return true;
};
```

---

## 🧪 HIPÓTESIS SOBRE LA CAUSA

### Hipótesis 1: Problema de Closures con React Batching ❓

**Teoría:**

- React hace batching de múltiples `setState` durante el drag
- Todos los `apply` usan el MISMO `tableId` y `pos` del último closure
- El último valor sobrescribe todos los anteriores

**Probabilidad:** Media

---

### Hipótesis 2: Referencias Compartidas en Objetos ❓❓❓

**Teoría:**

- `createTableFromType()` o `sanitizeTable()` retorna referencias al MISMO objeto
- `.map()` crea nuevo array pero las mesas apuntan al mismo objeto interno
- Modificar una posición modifica todas

**Evidencia a Favor:**

```javascript
// En applyBanquetTables (1581-1589)
const sanitized = tablesArray.map((t) => {
  const base = createTableFromType(type, { ...t, id });
  return sanitizeTable(base, { forceAuto: base.autoCapacity });
});
```

Si `createTableFromType` retorna un objeto singleton o reutiliza referencias, esto explicaría todo.

**Probabilidad:** Alta

---

### Hipótesis 3: Bug en la Lógica de Comparación de IDs ❓

**Teoría:**

- `String(t.id) === String(tableId)` está dando true para TODAS las mesas
- Posible que todas las mesas tengan el mismo ID (timestamps)

**Evidencia en Contra:**

- Los logs muestran IDs diferentes inicialmente
- La corrupción ocurre EN el movimiento, no en la creación

**Probabilidad:** Baja

---

## 📊 DATOS RELEVANTES

### Estado Inicial (Correcto)

```javascript
Mesa 1: {id: 1763674728001, x: 460, y: 220}
Mesa 2: {id: 1763674728002, x: 680, y: 220}
Mesa 3: {id: 1763674728003, x: 900, y: 220}
// ... 22 más con posiciones únicas
```

### Después de Mover (Corrupto)

```javascript
Mesa 1: {id: 1763674728001, x: 1340, y: 220}
Mesa 2: {id: 1763674728002, x: 1340, y: 220}  // ⚠️ Igual que Mesa 1
Mesa 3: {id: 1763674728003, x: 1340, y: 220}  // ⚠️ Igual que Mesa 1
// ... TODAS en (1340, 220)
```

---

## 🔬 PRUEBAS A REALIZAR

### Test 1: Verificar Referencias de Objetos

```javascript
// Agregar después de applyBanquetTables
const uniqueObjects = new Set(sanitized.map((t) => t));
console.log('Objetos únicos:', uniqueObjects.size); // Debe ser 25
console.log('Mesas totales:', sanitized.length); // Es 25

// Si uniqueObjects.size < 25 → PROBLEMA DE REFERENCIAS
```

### Test 2: Logging Detallado en moveTable

```javascript
const apply = (prev) => {
  console.log('[moveTable] Actualizando ID:', tableId, 'a posición:', pos);
  console.log('[moveTable] Total mesas en prev:', prev.length);
  console.log('[moveTable] IDs en prev:', prev.map((t) => t.id).join(', '));

  const result = prev.map((t) => {
    const match = String(t.id) === String(tableId);
    if (match) {
      console.log('[moveTable] ✅ Match encontrado para mesa:', t.id);
    }
    return match ? { ...t, x: pos.x, y: pos.y } : t;
  });

  console.log(
    '[moveTable] Posiciones únicas después:',
    new Set(result.map((t) => `${t.x},${t.y}`)).size
  );

  return result;
};
```

### Test 3: Verificar createTableFromType

```javascript
// Verificar si retorna el mismo objeto
const table1 = createTableFromType('round', { id: 1, x: 0, y: 0 });
const table2 = createTableFromType('round', { id: 2, x: 100, y: 100 });
console.log('Son el mismo objeto?', table1 === table2); // Debe ser false
console.log('Tienen la misma referencia de props?', table1.x === table2.x); // OK
```

---

## 💡 SOLUCIONES PROPUESTAS

### Solución 1: Deep Clone en apply() (Inmediata)

```javascript
const apply = (prev) =>
  prev.map((t) => {
    if (String(t.id) === String(tableId)) {
      // Deep clone para evitar referencias compartidas
      return JSON.parse(JSON.stringify({ ...t, x: pos.x, y: pos.y }));
    }
    return JSON.parse(JSON.stringify(t)); // Clone todos
  });
```

**Pros:** Garantiza objetos independientes  
**Contras:** Puede ser lento con muchas mesas

---

### Solución 2: Usar Immer para Inmutabilidad (Recomendada)

```javascript
import { produce } from 'immer';

const apply = (prev) =>
  produce(prev, (draft) => {
    const table = draft.find((t) => String(t.id) === String(tableId));
    if (table) {
      table.x = pos.x;
      table.y = pos.y;
    }
  });
```

**Pros:** Manejo robusto de inmutabilidad, performance  
**Contras:** Requiere dependencia adicional

---

### Solución 3: Usar useReducer con Acción Explícita (Arquitectura)

```javascript
const tableReducer = (state, action) => {
  switch (action.type) {
    case 'MOVE_TABLE':
      return state.map((t) =>
        String(t.id) === String(action.tableId) ? { ...t, x: action.pos.x, y: action.pos.y } : t
      );
    default:
      return state;
  }
};

// En el componente
const [tablesBanquet, dispatch] = useReducer(tableReducer, []);

// Al mover
dispatch({ type: 'MOVE_TABLE', tableId, pos });
```

**Pros:** Arquitectura más limpia, debugging más fácil  
**Contras:** Requiere refactor grande

---

### Solución 4: Validación Pre-Update (Temporal)

```javascript
const setTablesBanquet = useCallback((newTables) => {
  if (typeof newTables === 'function') {
    setTablesBanquetState((prev) => {
      const result = newTables(prev);

      // ⚠️ VALIDACIÓN: Rechazar si hay corrupción
      const uniquePos = new Set(result.map((t) => `${t.x},${t.y}`)).size;
      if (result.length > 3 && uniquePos < result.length * 0.3) {
        console.error('🔴 CORRUPCIÓN DETECTADA - RECHAZANDO UPDATE');
        return prev; // ⬅️ Mantener estado anterior
      }

      return result;
    });
  } else {
    // ...
  }
}, []);
```

**Pros:** Previene corrupción inmediatamente  
**Contras:** No soluciona la causa raíz

---

## 🚨 IMPACTO DEL BUG

### Severidad

- **Crítica** - Pérdida de datos del usuario
- **Reproducible** - 100% de las veces al mover una mesa
- **Alcance** - Afecta a TODOS los usuarios del Seating Plan

### Consecuencias

1. ❌ Usuario pierde toda la distribución de mesas
2. ❌ Imposible usar el Seating Plan
3. ❌ Datos se guardan corruptos en Firestore
4. ❌ No hay forma de recuperar el layout anterior

---

## ⏭️ PRÓXIMOS PASOS INMEDIATOS

### 1. Agregar Logs Detallados (5 minutos)

```javascript
// En moveTable, línea 1293
const apply = (prev) => {
  console.log('[moveTable] DEBUG:', {
    tableId,
    pos,
    totalMesas: prev.length,
    prevIds: prev.map((t) => t.id),
    prevPosiciones: prev.map((t) => `(${t.x},${t.y})`).slice(0, 5),
  });

  const result = prev.map((t) =>
    String(t.id) === String(tableId) ? { ...t, x: pos.x, y: pos.y } : t
  );

  console.log('[moveTable] RESULT:', {
    posicionesUnicas: new Set(result.map((t) => `${t.x},${t.y}`)).size,
    resultPosiciones: result.map((t) => `(${t.x},${t.y})`).slice(0, 5),
  });

  return result;
};
```

### 2. Implementar Solución 4 (Validación) (10 minutos)

Modificar el wrapper `setTablesBanquet` para rechazar actualizaciones corruptas.

### 3. Investigar createTableFromType (15 minutos)

Verificar si está retornando referencias compartidas.

### 4. Test E2E Automatizado (30 minutos)

```javascript
describe('Seating Plan - Move Table', () => {
  it('should maintain unique positions after moving a table', () => {
    // Generar 25 mesas
    cy.visit('/seating-plan');
    cy.contains('Generar automáticamente').click();

    // Verificar 25 posiciones únicas
    cy.get('[data-testid="table-item"]').should('have.length', 25);

    // Mover una mesa
    cy.get('[data-testid="table-item"]')
      .first()
      .trigger('pointerdown')
      .trigger('pointermove', { clientX: 500, clientY: 300 })
      .trigger('pointerup');

    // Verificar que sigue habiendo 25 posiciones únicas
    cy.window().then((win) => {
      const tables = win.store.getState().seating.tablesBanquet;
      const uniquePos = new Set(tables.map((t) => `${t.x},${t.y}`));
      expect(uniquePos.size).to.equal(25);
    });
  });
});
```

---

## 📝 NOTAS ADICIONALES

### Archivos Relevantes

- `/apps/main-app/src/hooks/_useSeatingPlanDisabled.js:1281-1308` - moveTable()
- `/apps/main-app/src/hooks/_useSeatingPlanDisabled.js:502-537` - setTablesBanquet wrapper
- `/apps/main-app/src/hooks/_useSeatingPlanDisabled.js:1575-1597` - applyBanquetTables()
- `/apps/main-app/src/components/TableItem.jsx:180-219` - Drag handlers

### Logs Relevantes

```
[setupSeatingPlanAutomatically] Invitados encontrados: 250
[applyBanquetTables] Recibiendo: 25 mesas
[setTablesBanquet] Direct call - Total: 25 Únicas: 25 ✅
[moveTable] Click en mesa: 1763674728004
[setTablesBanquet] Function call - Total: 25 Únicas: 1 ❌
🔴 DATOS CORRUPTOS DETECTADOS!
```

---

## ✅ ESTADO DE LA INVESTIGACIÓN

- [x] Síntoma identificado
- [x] Flujo del error trazado
- [x] Hipótesis formuladas
- [ ] Pruebas ejecutadas
- [ ] Causa raíz confirmada
- [ ] Solución implementada
- [ ] Tests E2E creados
- [ ] Fix verificado en producción

---

**PRÓXIMA ACCIÓN:** Ejecutar Test 1 y Test 2 para confirmar hipótesis.

**PRIORIDAD:** 🔴 MÁXIMA - Bloquea funcionalidad completa del Seating Plan
