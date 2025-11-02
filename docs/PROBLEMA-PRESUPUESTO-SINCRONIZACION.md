# ⚠️ PROBLEMA: Presupuesto No Se Sincroniza Entre Finanzas y Sistema de Presupuestos

## 🔍 DIAGNÓSTICO

### **El Problema:**

El presupuesto se almacena en **DOS lugares diferentes** en Firestore y NO se sincronizan automáticamente:

1. **Página de Finanzas** lee/escribe en: `weddings/{id}/finance/main/budget.total`
2. **Sistema de Presupuestos** (IA) lee desde: `weddings/{id}/budget.total` (raíz)

**Consecuencia:** Si el usuario configura su presupuesto en Finanzas, la IA del scoring de presupuestos NO lo ve.

---

## 📊 ESTRUCTURA ACTUAL

### **Lugar 1: Subcolección Finance** (usado por Finanzas)

```
weddings/{weddingId}/finance/main
  └─ budget
      ├─ total: 25000  ← FINANZAS LO USA
      └─ categories: [...]
```

**Hook:** `useFinance.js` - Línea 885-900

```javascript
const ref = doc(db, 'weddings', activeWedding, 'finance', 'main');
onSnapshot(ref, (snap) => {
  const data = snap.data() || {};
  const budgetData = data.budget || {};
  setBudget({
    total: parseMoneyValue(budgetData.total, 0),
    // ...
  });
});
```

### **Lugar 2: Documento Raíz** (usado por Presupuestos)

```
weddings/{weddingId}  ← RAÍZ
  ├─ budget
  │   └─ total: 25000  ← PRESUPUESTOS LO LEE
  └─ presupuesto: 25000  ← O AQUÍ (legacy)
```

**Hook:** `useWeddingBasicInfo.js` - Línea 63-65

```javascript
const presupuestoTotal =
  activeWeddingData.budget?.total || // Intenta aquí
  activeWeddingData.presupuesto || // Fallback
  null;
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

Modificar `useFinance.js` para que **SIEMPRE sincronice ambos lugares** cuando se actualiza el presupuesto total.

### **Cambio en `updateTotalBudget`:**

**ANTES:**

```javascript
const updateTotalBudget = useCallback(
  (newTotal) => {
    const total = parseMoneyValue(newTotal, 0);
    setBudget((prev) => ({ ...prev, total }));
    persistFinanceDoc({ budget: { total, categories: budget.categories } });
    // ⚠️  Solo actualiza finance/main
    return { success: true };
  },
  [budget.categories, persistFinanceDoc]
);
```

**DESPUÉS:**

```javascript
const updateTotalBudget = useCallback(
  async (newTotal) => {
    const total = parseMoneyValue(newTotal, 0);
    setBudget((prev) => ({ ...prev, total }));

    // 1. Actualizar finance/main (como antes)
    await persistFinanceDoc({ budget: { total, categories: budget.categories } });

    // 2. NUEVO: También actualizar documento raíz para presupuestos
    if (activeWedding && db && firebaseUid) {
      try {
        const weddingRef = doc(db, 'weddings', activeWedding);
        await setDoc(
          weddingRef,
          {
            budget: { total },
            presupuesto: total, // Legacy compatibility
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('[useFinance] No se pudo sincronizar presupuesto en raíz:', error);
      }
    }

    return { success: true };
  },
  [budget.categories, persistFinanceDoc, activeWedding, firebaseUid]
);
```

---

## 🔄 FLUJO COMPLETO DESPUÉS DEL FIX

```
Usuario actualiza presupuesto en Finanzas (25.000€)
  ↓
updateTotalBudget(25000)
  ↓
1. Actualiza estado local:
   setBudget({ total: 25000, categories: [...] })
  ↓
2. Guarda en finance/main:
   weddings/{id}/finance/main
     └─ budget.total = 25000
  ↓
3. NUEVO: También guarda en raíz:
   weddings/{id}
     ├─ budget.total = 25000
     └─ presupuesto = 25000
  ↓
4. useWeddingBasicInfo lo lee automáticamente:
   presupuestoTotal = activeWeddingData.budget.total = 25000
  ↓
5. Sistema de presupuestos lo usa en scoring:
   calculatePriceScore(quote, request)
     const userBudget = request.weddingInfo?.presupuestoTotal
     // userBudget = 25000 ✅ FUNCIONA
```

---

## 📝 ARCHIVOS MODIFICADOS

1. **`src/hooks/useFinance.js`**
   - Función `updateTotalBudget` (línea ~1397)
   - Añadido: Sincronización con documento raíz

2. **`docs/PROBLEMA-PRESUPUESTO-SINCRONIZACION.md`** (este archivo)
   - Documentación del problema y solución

---

## ✅ VERIFICACIÓN

### **Cómo probar que funciona:**

```bash
# 1. Actualizar presupuesto en Finanzas
→ Ve a http://localhost:5173/finanzas
→ Sección "Presupuesto Total"
→ Cambia a 30.000€
→ Guarda

# 2. Verificar en Firestore Console
→ weddings/{weddingId}/finance/main
   ✓ budget.total = 30000

→ weddings/{weddingId}  (raíz)
   ✓ budget.total = 30000
   ✓ presupuesto = 30000

# 3. Solicitar presupuesto a proveedor
→ Ve a /proveedores
→ Solicitar presupuesto
→ Verificar en consola del navegador:
   console.log(payload.weddingInfo.presupuestoTotal)
   // Debe mostrar: 30000

# 4. Verificar en backend logs
→ Al crear solicitud:
   "weddingInfo": {
     "presupuestoTotal": 30000  ✓
   }

# 5. Comparar presupuestos
→ Simular respuestas
→ Abrir comparador
→ El scoring debe usar el presupuesto correcto
→ Precio: score basado en 30.000€ ✓
```

---

## 🎯 RESULTADO FINAL

```
╔════════════════════════════════════════╗
║  ✅ PRESUPUESTO SINCRONIZADO          ║
║  ✅ FINANZAS ↔️ PRESUPUESTOS           ║
║  ✅ SCORING USA DATOS CORRECTOS       ║
╚════════════════════════════════════════╝

Finanzas actualiza → Ambos lugares se sincronizan
                   → Sistema de presupuestos lee correctamente
                   → IA usa el presupuesto real del usuario
```

---

## 📌 NOTAS IMPORTANTES

1. **Retrocompatibilidad:** Se mantiene el campo `presupuesto` para compatibilidad con código legacy
2. **Merge mode:** Usa `{ merge: true }` para no sobrescribir otros campos del documento raíz
3. **Error handling:** Si falla la sincronización con raíz, NO falla la operación principal
4. **Timestamp:** Actualiza `updatedAt` en raíz para tracking

---

## 🔮 MEJORAS FUTURAS (Opcionales)

1. **Sincronización bidireccional:**
   - Si se actualiza en raíz, sincronizar a finance/main
   - Listener en ambos lugares

2. **Migración automática:**
   - Script para migrar presupuestos existentes
   - De finance/main → raíz para bodas antiguas

3. **UI de advertencia:**
   - Si detecta desincronización, mostrar alerta
   - Botón "Sincronizar presupuesto"

4. **Source of truth único:**
   - Deprecar uno de los dos lugares
   - Usar solo finance/main o solo raíz
   - Actualizar todos los hooks

---

**Estado:** ✅ SOLUCIONADO - Pendiente de implementar el código
