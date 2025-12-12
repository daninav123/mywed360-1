# 🔧 Fix Temporal - Corrupción Seating Plan

**Fecha:** 2025-11-20 22:45 UTC+01:00  
**Tipo:** Prevención Temporal + Debugging  
**Estado:** ✅ IMPLEMENTADO

---

## 🚨 PROBLEMA

**Bug Crítico:** Al mover cualquier mesa, TODAS las 25 mesas terminan en la MISMA posición.

**Impacto:**

- 🔴 Pérdida de datos del usuario
- 🔴 Seating Plan inutilizable
- 🔴 100% reproducible

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Prevención de Corrupción** (Líneas 501-541)

Modificado `setTablesBanquet` para **RECHAZAR** actualizaciones corruptas:

```javascript
// ANTES: Detectaba pero permitía la corrupción
if (result.length > 3 && uniquePos < result.length * 0.3) {
  console.error('🔴 DATOS CORRUPTOS DETECTADOS!');
  console.trace('Stack trace:');
}
return result; // ❌ Permitía la corrupción

// DESPUÉS: Detecta Y rechaza
if (result.length > 3 && uniquePos < result.length * 0.3) {
  console.error('🔴 DATOS CORRUPTOS DETECTADOS - RECHAZANDO UPDATE!');
  console.trace('Stack trace:');
  console.warn('⚠️ Manteniendo estado anterior');
  return prev; // ✅ PREVIENE la corrupción
}
return result;
```

**Resultado:**

- ✅ Los datos corruptos NO se guardan
- ✅ Se mantiene el estado anterior (correcto)
- ✅ Usuario puede continuar trabajando

---

### 2. **Logs de Debugging Detallados** (Líneas 1297-1333)

Agregado logging exhaustivo en `moveTable`:

```javascript
const apply = (prev) => {
  // 🔧 DEBUG: Estado antes
  console.log('[moveTable] 🔧 DEBUG:', {
    tableId,
    pos,
    totalMesas: prev.length,
    prevIds: prev.map((t) => t.id).slice(0, 5),
    prevPosiciones: prev.map((t) => `(${t.x},${t.y})`).slice(0, 5),
  });

  // Track matches
  let matchCount = 0;
  const result = prev.map((t) => {
    const match = String(t.id) === String(tableId);
    if (match) {
      matchCount++;
      console.log('[moveTable] ✅ Match encontrado:', {
        id: t.id,
        oldPos: { x: t.x, y: t.y },
        newPos: pos,
      });
      return { ...t, x: pos.x, y: pos.y };
    }
    return t;
  });

  // 📊 RESULT: Validar integridad
  const uniquePos = new Set(result.map((t) => `${t.x},${t.y}`)).size;
  console.log('[moveTable] 📊 RESULT:', {
    matchCount,
    posicionesUnicas: uniquePos,
    totalMesas: result.length,
    resultPosiciones: result.map((t) => `(${t.x},${t.y})`).slice(0, 5),
  });

  // 🔴 Detectar corrupción temprano
  if (result.length > 3 && uniquePos < result.length * 0.3) {
    console.error('🔴 [moveTable] CORRUPCIÓN DETECTADA EN APPLY!');
    console.error('  - Mesas totales:', result.length);
    console.error('  - Posiciones únicas:', uniquePos);
    console.error('  - Matches encontrados:', matchCount);
  }

  return result;
};
```

**Información que ahora tenemos:**

1. ✅ Cuántas mesas hay antes del update
2. ✅ Qué mesa se está moviendo (ID)
3. ✅ Posición origen y destino
4. ✅ Cuántos matches se encuentran (debe ser 1)
5. ✅ Posiciones únicas antes y después
6. ✅ Stack trace si hay corrupción

---

## 📊 COMPORTAMIENTO ESPERADO

### Caso Normal (Sin Bug)

```
[moveTable] 🔧 DEBUG:
  - tableId: 1763674728001
  - totalMesas: 25
  - prevIds: [1763674728001, 1763674728002, ...]
  - prevPosiciones: ['(460,220)', '(680,220)', ...]

[moveTable] ✅ Match encontrado:
  - id: 1763674728001
  - oldPos: {x: 460, y: 220}
  - newPos: {x: 500, y: 250}

[moveTable] 📊 RESULT:
  - matchCount: 1                    ← ✅ Solo 1 mesa actualizada
  - posicionesUnicas: 25             ← ✅ Todas en pos diferentes
  - totalMesas: 25
  - resultPosiciones: ['(500,250)', '(680,220)', ...]

[setTablesBanquet] Function call - Total: 25 Únicas: 25 ← ✅ OK
```

### Caso con Bug (Detectado y Prevenido)

```
[moveTable] 🔧 DEBUG:
  - tableId: 1763674728001
  - totalMesas: 25

[moveTable] ✅ Match encontrado: ...
[moveTable] ✅ Match encontrado: ...  ← ⚠️ Múltiples matches!
[moveTable] ✅ Match encontrado: ...

[moveTable] 📊 RESULT:
  - matchCount: 25                    ← 🔴 TODAS las mesas!
  - posicionesUnicas: 1               ← 🔴 Solo 1 posición!
  - totalMesas: 25

🔴 [moveTable] CORRUPCIÓN DETECTADA EN APPLY!
  - Mesas totales: 25
  - Posiciones únicas: 1
  - Matches encontrados: 25

[setTablesBanquet] DATOS CORRUPTOS DETECTADOS - RECHAZANDO UPDATE!
⚠️ Manteniendo estado anterior para prevenir corrupción
```

---

## 🔬 PRÓXIMOS PASOS PARA INVESTIGACIÓN

### Con los logs ahora podemos determinar:

**Hipótesis 1: Bug en comparación de IDs**

```
Si matchCount > 1:
  → String(t.id) === String(tableId) da true para múltiples mesas
  → Posible que todas tengan el mismo ID
  → O problema con conversión a String
```

**Hipótesis 2: Referencias compartidas**

```
Si matchCount == 1 pero uniquePos < 25:
  → El .map() está creando objetos correctamente
  → Pero las referencias internas están compartidas
  → Problema en createTableFromType() o sanitizeTable()
```

**Hipótesis 3: Race condition / Closures**

```
Si múltiples moveTable se ejecutan simultáneamente:
  → Closures capturan el mismo tableId/pos
  → React batching aplica todos con el último valor
  → Necesita debouncing o useCallback mejorado
```

---

## 📝 ARCHIVOS MODIFICADOS

### Modificados

```
/apps/main-app/src/hooks/_useSeatingPlanDisabled.js
  - Líneas 501-541: setTablesBanquet con prevención
  - Líneas 1297-1333: moveTable con logs detallados
```

### Documentación Creada

```
ANALISIS-CRITICO-SEATING-PLAN-CORRUPCION-20NOV.md - Análisis completo
FIX-SEATING-PLAN-CORRUPCION-20NOV-2245.md - Este documento
```

---

## ✅ RESULTADO

### Inmediato

- ✅ **Corrupción prevenida** - Los datos no se pierden
- ✅ **Debugging habilitado** - Logs detallados activos
- ✅ **Usuario puede continuar** - El move simplemente no se aplica si está corrupto

### Temporal

- ⚠️ **UX degradada** - La mesa puede no moverse suavemente
- ⚠️ **Causa raíz sin resolver** - Necesita más investigación
- ⚠️ **Performance** - Muchos logs pueden afectar

### A Largo Plazo

- 🎯 Identificar causa raíz con logs
- 🎯 Implementar fix permanente
- 🎯 Agregar tests E2E para prevenir regresión
- 🎯 Remover logs de debugging

---

## 🚀 PARA PROBAR

### 1. Refrescar el navegador

```
http://localhost:5173/invitados/seating
```

### 2. Generar layout automático

- Click en "Generar automáticamente"
- Verificar que se crean 25 mesas

### 3. Intentar mover una mesa

- Arrastrar cualquier mesa
- Observar logs en consola
- Verificar que otras mesas NO se mueven

### 4. Analizar logs

```
[moveTable] 🔧 DEBUG: {...}
[moveTable] ✅ Match encontrado: {...}
[moveTable] 📊 RESULT: {...}
[setTablesBanquet] 📊 Function call: {...}
```

**Si matchCount > 1:** Problema de IDs  
**Si matchCount == 1 pero uniquePos < 25:** Problema de referencias  
**Si todo se ve bien pero still corrupts:** Race condition

---

## 📞 SOPORTE ADICIONAL

Si el problema persiste:

1. Copiar todos los logs de consola
2. Verificar el valor de `matchCount`
3. Revisar los `prevIds` para ver si hay duplicados
4. Buscar en `createTableFromType` y `sanitizeTable`

---

**Estado:** ✅ PREVENCIÓN ACTIVA - Sistema protegido temporalmente  
**Próximo paso:** Probar y analizar logs para identificar causa raíz
