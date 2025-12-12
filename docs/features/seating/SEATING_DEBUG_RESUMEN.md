# 🎯 Resumen Completo del Debug - Seating Plan

## ✅ PROBLEMA IDENTIFICADO

**Síntoma:** Todas las mesas desaparecen (se apilan en la misma posición) al hacer click en una.

**Diagnóstico:**

- ❌ NO es problema de la función `generateAutoLayout` (tests pasados ✅)
- ❌ NO es problema de `createTableFromType` (bug corregido ✅)
- ❌ NO es problema del click (las mesas ya están apiladas antes del click)
- ✅ ES problema de **gestión del estado en React**

---

## 🔧 CAMBIOS REALIZADOS

### 1. Bug Corregido en `createTableFromType`

**Archivo:** `apps/main-app/src/utils/seatingTables.js` líneas 148-149

```javascript
// ❌ ANTES (bug con valores falsy):
x: Number(overrides.x) || 120,  // Si x=0, usa 120
y: Number(overrides.y) || 120,  // Si y=0, usa 120

// ✅ AHORA (correcto):
x: overrides.x != null ? Number(overrides.x) : 120,
y: overrides.y != null ? Number(overrides.y) : 120,
```

### 2. Sistema de Detección de Datos Corruptos

**Archivo:** `apps/main-app/src/hooks/_useSeatingPlanDisabled.js` líneas 502-536

Wrapper que detecta cuando >70% de las mesas tienen la misma posición:

- ✅ Muestra error en consola con stack trace
- ✅ Registra total de mesas y posiciones únicas
- ✅ Muestra las primeras 5 posiciones

### 3. Logs de Debug Detallados

**Archivos modificados:**

- `_useSeatingPlanDisabled.js` línea 1149-1151: logs en `handleSelectTable`
- `_useSeatingPlanDisabled.js` línea 1569-1584: logs en `applyBanquetTables`
- `_useSeatingPlanDisabled.js` línea 503-535: logs en `setTablesBanquet`

### 4. Listener de Firebase Deshabilitado

**Archivo:** `apps/main-app/src/hooks/_useSeatingPlanDisabled.js` líneas 681-733

- ⚠️ Temporalmente comentado
- ⚠️ NO hay sincronización en tiempo real
- ⚠️ Debe re-habilitarse después de limpiar datos corruptos

### 5. Tests Automatizados Creados

**Archivos:**

- `test-seating-positions.js` (raíz del proyecto)
- `apps/main-app/src/__tests__/seatingPlan.tablePositions.test.jsx`

**Resultados:**

```
✅ Layout columns: 25 mesas, 100.0% únicas
✅ Layout circular: 25 mesas, 100.0% únicas
✅ Todas las coordenadas son válidas
✅ No hay apilamiento de mesas
✅ Posiciones por defecto: 0.0%
```

---

## 🔍 PRÓXIMOS PASOS

### Paso 1: Probar en el Navegador con Logs

1. Abrir http://127.0.0.1:52390
2. Navegar a Seating Plan
3. Abrir consola del navegador (F12)
4. Generar plan automático
5. Copiar TODOS los logs que aparecen:
   - `[applyBanquetTables] 📥 Recibiendo:`
   - `[applyBanquetTables] 📍 Primeras 3 posiciones ANTES:`
   - `[applyBanquetTables] 📍 Primeras 3 posiciones DESPUÉS:`
   - `[setTablesBanquet] 🔄 Actualizando estado`
   - `[setTablesBanquet] 📊 Direct call`
   - `[setTablesBanquet] 📍 Primeras 5:`

### Paso 2: Identificar Dónde se Corrompe

Con los logs podremos ver **exactamente** en qué punto las posiciones se corrompen:

**Opción A:** Se corrompen en `applyBanquetTables` (entre ANTES y DESPUÉS)

- Problema: `sanitizeTable` o `createTableFromType`
- Solución: Ya corregido, verificar si aún ocurre

**Opción B:** Se corrompen en `setTablesBanquet`

- Problema: Lectura de Firebase o localStorage
- Solución: Limpiar datos corruptos de Firebase

**Opción C:** Se corrompen después de `setTablesBanquet`

- Problema: Otro useEffect o función modificando el estado
- Solución: Buscar con los logs del stack trace

### Paso 3: Limpiar Datos Corruptos de Firebase

Si el problema es que Firebase tiene datos corruptos guardados:

```javascript
// Ejecutar en consola del navegador:
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const db = getFirestore();
const activeWedding = 'TU_WEDDING_ID'; // Obtener del estado
const ref = doc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');

await deleteDoc(ref);
console.log('✅ Datos de Firebase limpiados');

// Recargar página
location.reload();
```

### Paso 4: Re-habilitar Listener de Firebase

Una vez limpiados los datos:

1. Descomentar el listener en `_useSeatingPlanDisabled.js` líneas 688-732
2. Agregar validación para prevenir corrupción futura
3. Probar sincronización en tiempo real

---

## 📊 MÉTRICAS DE DEBUG

### Estado Actual

- ✅ **Generación de layouts:** Funcionando perfectamente
- ✅ **Tests automatizados:** 6/6 pasados
- ✅ **Bug de x=0/y=0:** Corregido
- ⚠️ **Sincronización Firebase:** Deshabilitada temporalmente
- ❓ **Origen de corrupción:** Por identificar con logs del navegador

### Archivos Modificados

1. `apps/main-app/src/utils/seatingTables.js` (bug corregido)
2. `apps/main-app/src/hooks/_useSeatingPlanDisabled.js` (logs + detección + listener deshabilitado)
3. `test-seating-positions.js` (tests automatizados)
4. `apps/main-app/src/__tests__/seatingPlan.tablePositions.test.jsx` (tests vitest)
5. `SEATING_PLAN_DEBUG.md` (documentación inicial)
6. `SEATING_DEBUG_RESUMEN.md` (este documento)

### Comandos Útiles

```bash
# Ejecutar tests automatizados
node test-seating-positions.js

# Levantar servidor
cd apps/main-app && npm run dev

# Ver logs en tiempo real (en navegador)
# 1. Abrir consola (F12)
# 2. Filtrar por "[setTablesBanquet]" o "[applyBanquetTables]"
```

---

## 🎓 APRENDIZAJES

### Bug Clásico de JavaScript

```javascript
// ❌ Incorrecto:
x: Number(overrides.x) || 120; // 0 es falsy → usa 120

// ✅ Correcto:
x: overrides.x != null ? Number(overrides.x) : 120; // 0 es válido
```

### Detección de Datos Corruptos

```javascript
// Detectar cuando >70% de las mesas están apiladas
const uniquePos = new Set(tables.map((t) => `${t.x},${t.y}`)).size;
const isCorrupted = uniquePos < tables.length * 0.3;
```

### Tests Automatizados

- ✅ Permiten verificar el código sin interfaz gráfica
- ✅ Detectan regresiones automáticamente
- ✅ Documentan el comportamiento esperado
- ✅ Se ejecutan en CI/CD

---

## 📝 NOTAS FINALES

1. **El problema NO está en la generación de layouts** - esto está confirmado por los tests
2. **El problema está en la gestión del estado de React** - entre la generación y el render
3. **Los logs están listos** - solo falta ejecutar en el navegador y copiar la salida
4. **La solución está cerca** - con los logs del stack trace identificaremos la causa exacta

---

**Fecha:** 17 Nov 2025
**Estado:** Esperando logs del navegador para identificar punto exacto de corrupción
**Tests:** ✅ 6/6 pasados
**Bug x=0/y=0:** ✅ Corregido
**Siguiente acción:** Probar en navegador y copiar logs de consola
