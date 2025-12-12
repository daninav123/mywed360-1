# 🔍 Diagnóstico Completo - Seating Plan

## 🔴 PROBLEMA PRINCIPAL

**Las mesas desaparecen al hacer click en una**

- Se renderizan 25 mesas correctamente
- Al hacer click en una mesa, todas se colapsan en la misma posición
- El problema persiste incluso después de deshabilitar el listener de Firebase

## 📋 HALLAZGOS

### 1. Listener de Firebase Deshabilitado ✅

- **Archivo:** `_useSeatingPlanDisabled.js` línea 681-733
- **Estado:** Comentado temporalmente
- **Razón:** Estaba sobrescribiendo el estado con datos corruptos

### 2. Logs de Posiciones Eliminados ✅

- **Archivo:** `SeatingCanvas.jsx`
- **Estado:** Logs de debug eliminados
- Los logs mostraban que las mesas se generaban bien pero se colapsaban después

### 3. Posibles Causas del Problema

#### A. Auto-guardado Sobrescribiendo Estado

**Archivo:** `_useSeatingPlanDisabled.js` línea 886-937

```javascript
useEffect(() => {
  // Auto-guardado cada 800ms
  banquetSaveTimerRef.current = setTimeout(async () => {
    const payload = {
      tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
      // ...
    };
    await setDoc(ref, payload, { merge: true });
  }, 800);
}, [tablesBanquet, ...]);
```

**Problema:** Si `tablesBanquet` tiene datos corruptos, los guarda en Firebase cada 800ms.

#### B. Selección Múltiple Accidental

**Archivo:** `SeatingPlanCanvas.jsx` línea 549, 663

```javascript
tables.filter(Boolean).forEach((t) => onSelectTable && onSelectTable(t.id, true));
```

**Problema:** Al seleccionar múltiples mesas, podría estar moviendo todas a la misma posición.

#### C. Snapshot Apply

**Archivo:** `_useSeatingPlanDisabled.js` línea 1019-1027

```javascript
const applySnapshot = (snap) => {
  if (Array.isArray(snap.tablesBanquet))
    setTablesBanquet(snap.tablesBanquet.map((t) => sanitizeTable(t)));
};
```

**Problema:** Si el snapshot (undo/redo) tiene datos corruptos, los aplica directamente.

### 4. Estado de las Mesas

#### Renderizado Inicial ✅

- Las mesas se generan correctamente con `generateAutoLayout`
- Posiciones distribuidas en grid: (460, 220), (680, 220), etc.

#### Después del Click ❌

- Todas las mesas se colapsan en la misma posición
- Ejemplo: todas en (460, 220) o (1340, 600)

## 🔧 SOLUCIONES PROPUESTAS

### Solución 1: Agregar Validación de Posiciones

```javascript
// En handleSelectTable
const handleSelectTable = (id, multi = false) => {
  console.log('[handleSelectTable] Seleccionando mesa:', id, 'multi:', multi);
  console.log(
    '[handleSelectTable] Tables antes:',
    tables.map((t) => ({ id: t.id, x: t.x, y: t.y }))
  );

  const table = tables.find((t) => String(t.id) === String(id));
  if (!multi) {
    setSelectedIds(id == null ? [] : [id]);
    setSelectedTable(table || null);
    return;
  }
  // ...
};
```

### Solución 2: Prevenir Auto-guardado si Datos Corruptos

```javascript
const payload = {
  tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
  // ...
};

// Validar que las mesas no estén apiladas
const uniquePositions = new Set(payload.tables.map((t) => `${t.x},${t.y}`));
if (uniquePositions.size < payload.tables.length * 0.8) {
  console.error('⚠️ DATOS CORRUPTOS DETECTADOS - No se guarda');
  return;
}

await setDoc(ref, payload, { merge: true });
```

### Solución 3: Limpiar Firebase

```javascript
// Ejecutar en consola del navegador
const db = getFirestore();
const ref = doc(db, 'weddings', 'WEDDING_ID', 'seatingPlan', 'banquet');
await deleteDoc(ref);
console.log('✅ Datos de Firebase limpiados');
```

## 📊 PRÓXIMOS PASOS

1. ✅ **Agregar logs detallados** en `handleSelectTable` para rastrear el problema
2. ⏳ **Verificar si el problema es CSS o JavaScript**
3. ⏳ **Limpiar datos corruptos de Firebase**
4. ⏳ **Re-habilitar listener con validación**
5. ⏳ **Agregar tests para prevenir regresión**

## 🐛 OTROS PROBLEMAS ENCONTRADOS

### 1. Listener de Firebase Comentado

- **Impacto:** NO hay sincronización en tiempo real
- **Solución:** Re-habilitar después de limpiar datos corruptos

### 2. Console.warn en Modo Desarrollo

- **Archivo:** `_useSeatingPlanDisabled.js` línea 685
- **Mensaje:** "Listener de Firebase deshabilitado temporalmente"
- **Impacto:** Informativo, no afecta funcionalidad

### 3. Falta Favicon

- **Error:** `GET http://localhost:5173/favicon.ico 404 (Not Found)`
- **Impacto:** Menor, solo visual

## 🔍 DEBUGGING ACTIVO

### Log del Navegador

```javascript
// Para verificar posiciones en tiempo real
setInterval(() => {
  const mesas = Array.from(document.querySelectorAll('[data-testid^="table-item-"]'));
  const posiciones = mesas.map((el) => ({
    id: el.dataset.testid,
    x: el.style.left,
    y: el.style.top,
  }));
  const unicas = new Set(posiciones.map((p) => `${p.x},${p.y}`)).size;
  if (unicas < posiciones.length) {
    console.error('⚠️ MESAS APILADAS DETECTADAS:', posiciones);
  }
}, 1000);
```

---

**Fecha:** 17 Nov 2025, 18:17
**Estado:** Investigación en curso
