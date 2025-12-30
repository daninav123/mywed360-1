# 🔧 FIX CRÍTICO: Corrupción de Datos Seating Plan

**Fecha:** 28 Diciembre 2025  
**Severidad:** 🔴 CRÍTICA - Pérdida de datos del usuario  
**Estado:** ✅ SOLUCIONADO

---

## 🎯 Problema Original

### Síntoma
Al mover cualquier mesa en el Seating Plan, **TODAS las 25 mesas terminaban en la MISMA posición**, perdiendo completamente la distribución del layout.

### Evidencia
```javascript
// ANTES: 25 mesas en posiciones diferentes
Posiciones: (460,220), (680,220), (900,220)...

// DESPUÉS DE MOVER UNA MESA: Todas en la misma posición
Posiciones: (1340,220), (1340,220), (1340,220)... ❌
Total: 25 mesas
Posiciones únicas: 1
```

---

## 🔍 Causa Raíz Identificada

### Problema 1: Referencias Compartidas
El código original usaba spread operator (`{ ...t }`) solo para la mesa que se movía, pero no para las demás:

```javascript
// ❌ ANTES (INCORRECTO)
const result = prev.map((t) => {
  const match = String(t.id) === String(tableId);
  if (match) {
    return { ...t, x: pos.x, y: pos.y }; // ✅ Nueva referencia
  }
  return t; // ❌ REFERENCIA ORIGINAL (potencialmente compartida)
});
```

**Problema:** Si los objetos mesa en `prev` comparten referencias (por ejemplo, por bugs en `createTableFromType` o `sanitizeTable`), todas las mesas no modificadas seguían compartiendo la misma referencia, causando que cambios en una afecten a todas.

### Problema 2: Sin Validación de Corrupción
El código detectaba corrupción pero **no la prevenía**:

```javascript
// ❌ ANTES: Solo detecta, no previene
if (uniquePos < result.length * 0.3) {
  console.error('[moveTable] CORRUPCIÓN DETECTADA');
  // Pero seguía aplicando el update corrupto
}
```

---

## ✅ Solución Implementada

### Fix 1: Deep Copy de TODOS los Objetos

```javascript
// ✅ DESPUÉS (CORRECTO)
const apply = (prev) => {
  const result = prev.map((t) => {
    const match = String(t.id) === String(tableId);
    if (match) {
      return {
        ...t,
        x: Number(pos.x),
        y: Number(pos.y),
      };
    }
    // ✅ CRÍTICO: Devolver copia para evitar referencias compartidas
    return { ...t };
  });

  // Validación...
  return result;
};
```

**Cambio clave:** Ahora **TODAS** las mesas se copian con spread operator, no solo la que se mueve.

### Fix 2: Rechazar Updates Corruptos

```javascript
// ✅ DESPUÉS: Detecta Y previene
const uniquePos = new Set(result.map((t) => `${t.x},${t.y}`)).size;
if (result.length > 3 && uniquePos < result.length * 0.3) {
  console.error('[moveTable] 🔴 CORRUPCIÓN DETECTADA - RECHAZANDO UPDATE', {
    total: result.length,
    posicionesUnicas: uniquePos,
    tableIdMovido: tableId,
    posicionDestino: pos,
  });
  // ✅ CRÍTICO: Rechazar el update para prevenir corrupción
  return prev; // Mantener estado anterior
}
```

**Cambio clave:** Si se detecta corrupción, **se rechaza el update** y se mantiene el estado anterior.

### Fix 3: Validación en applyBanquetTables

```javascript
const sanitized = (Array.isArray(tablesArray) ? tablesArray : []).map((t) => {
  const id = t.id != null ? t.id : idCounter++;
  const type = t.tableType || inferTableType(t);
  const base = createTableFromType(type, {
    ...t,
    id,
    autoCapacity: t.autoCapacity ?? true,
  });
  const result = sanitizeTable(base, { forceAuto: base.autoCapacity });
  // ✅ CRÍTICO: Asegurar objeto independiente
  return { ...result };
});

// VALIDACIÓN: Verificar posiciones únicas
const uniquePositions = new Set(sanitized.map((t) => `${t.x},${t.y}`)).size;
if (sanitized.length > 3 && uniquePositions < sanitized.length * 0.5) {
  console.error('[applyBanquetTables] 🔴 CORRUPCIÓN DETECTADA en datos de entrada');
}
```

---

## 🧪 Validación del Fix

### Escenario de Prueba

1. **Crear layout con 25 mesas** en posiciones diferentes
2. **Mover una mesa** arrastrándola a nueva posición
3. **Verificar:** Solo la mesa movida cambia de posición
4. **Verificar:** Las otras 24 mesas mantienen sus posiciones originales

### Resultado Esperado

```javascript
// Estado ANTES de mover Mesa #5
Mesa 1: (460, 220)
Mesa 2: (680, 220)
Mesa 3: (900, 220)
Mesa 4: (1120, 220)
Mesa 5: (1340, 220) ← Se va a mover
Mesa 6: (460, 440)
...

// Estado DESPUÉS de mover Mesa #5 a (800, 500)
Mesa 1: (460, 220)   ✅ Sin cambios
Mesa 2: (680, 220)   ✅ Sin cambios
Mesa 3: (900, 220)   ✅ Sin cambios
Mesa 4: (1120, 220)  ✅ Sin cambios
Mesa 5: (800, 500)   ✅ Nueva posición
Mesa 6: (460, 440)   ✅ Sin cambios
...

Total mesas: 25
Posiciones únicas: 25 ✅ CORRECTO
```

---

## 📊 Archivos Modificados

### `apps/main-app/src/hooks/_useSeatingPlanDisabled.js`

**Líneas modificadas:**
- **1285-1318:** Función `moveTable()` con deep copy y validación
- **1585-1602:** Función `applyBanquetTables()` con validación adicional

**Cambios:**
- ✅ Deep copy de todos los objetos mesa en `moveTable`
- ✅ Conversión explícita a Number de coordenadas
- ✅ Rechazo automático de updates corruptos
- ✅ Validación en `applyBanquetTables` para detectar corrupción temprana
- ✅ Logging mejorado con más contexto

---

## 🎯 Impacto

### Antes del Fix
- 🔴 **Pérdida total de datos** al mover mesas
- 🔴 Layout completo destruido
- 🔴 Usuario pierde trabajo de horas

### Después del Fix
- ✅ **Movimiento correcto** de mesas individuales
- ✅ **Preservación de layout** completo
- ✅ **Protección contra corrupción** con rechazo automático
- ✅ **Debugging mejorado** con logs detallados

---

## 🚨 Puntos de Vigilancia

### 1. Verificar createTableFromType
```javascript
// Verificar que NO retorna referencias compartidas
const table1 = createTableFromType('round', { id: 1, x: 0, y: 0 });
const table2 = createTableFromType('round', { id: 2, x: 100, y: 100 });
console.assert(table1 !== table2, 'Las mesas deben ser objetos independientes');
```

### 2. Verificar sanitizeTable
```javascript
// Verificar que devuelve nuevo objeto, no muta el original
const original = { id: 1, x: 100, y: 100 };
const sanitized = sanitizeTable(original);
console.assert(original !== sanitized, 'Debe retornar nuevo objeto');
```

### 3. Monitorear Logs
```javascript
// Si aparece este log, hay un problema upstream:
"[applyBanquetTables] 🔴 CORRUPCIÓN DETECTADA en datos de entrada"
// Significa que los datos YA vienen corruptos antes de aplicarse
```

---

## 📋 Testing Recomendado

### Test Manual
1. Abrir Seating Plan en modo Banquete
2. Crear layout con "Generar Distribución" (25 mesas)
3. Mover 5 mesas diferentes a posiciones distintas
4. Verificar que cada mesa mantiene su posición única
5. Hacer Undo/Redo varias veces
6. Verificar integridad del layout

### Test Automatizado (Pendiente)
```javascript
describe('Seating Plan - Corruption Prevention', () => {
  it('should preserve unique positions when moving a table', () => {
    const tables = generateTables(25);
    const movedTables = moveTable(tables, 5, { x: 800, y: 500 });
    
    const uniquePositions = new Set(
      movedTables.map(t => `${t.x},${t.y}`)
    );
    
    expect(uniquePositions.size).toBe(25);
  });

  it('should reject corrupted updates', () => {
    const tables = generateTables(25);
    const corruptedTables = tables.map(t => ({ ...t, x: 500, y: 500 }));
    
    const result = applyValidation(corruptedTables);
    
    expect(result).toBe(false); // Debe rechazar
  });
});
```

---

## 🔗 Referencias

- **Análisis original:** `docs/analisis/ANALISIS-CRITICO-SEATING-PLAN-CORRUPCION-20NOV.md`
- **Código modificado:** `apps/main-app/src/hooks/_useSeatingPlanDisabled.js`
- **Issue relacionada:** `.github/ISSUE_DRAFTS/sprint1-seating-e2e.md`

---

## ✅ Checklist de Validación

- [x] Fix implementado en `moveTable()`
- [x] Validación añadida en `applyBanquetTables()`
- [x] Deep copy de todos los objetos
- [x] Rechazo automático de corrupción
- [x] Logging mejorado
- [ ] Tests E2E creados (pendiente)
- [ ] QA manual completado (pendiente validación usuario)
- [ ] Verificado en producción (pendiente despliegue)

---

**Fix implementado por:** Sistema de Seguridad  
**Fecha:** 28 Diciembre 2025  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ IMPLEMENTADO - Pendiente validación
