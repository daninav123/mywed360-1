# 🔍 ANÁLISIS: Datos de Finanzas que Necesitan Sincronización

## 📊 DATOS GESTIONADOS EN FINANZAS

La página de Finanzas (`/finanzas`) gestiona estos datos en `weddings/{id}/finance/main`:

| Campo                        | Ubicación Actual             | Usado Por                         | ¿Sincronizado?              |
| ---------------------------- | ---------------------------- | --------------------------------- | --------------------------- |
| `budget.total`               | `finance/main`               | Presupuestos, IA scoring          | ✅ **ARREGLADO**            |
| `budget.categories`          | `finance/main`               | Finanzas, AI Advisor              | ⚠️ Parcial (wantedServices) |
| `contributions.guestCount`   | `finance/main`               | Presupuestos, Benchmarks, Seating | ❌ **NO**                   |
| `contributions.initA/B`      | `finance/main`               | Solo Finanzas                     | ✅ N/A                      |
| `contributions.monthlyA/B`   | `finance/main`               | Solo Finanzas                     | ✅ N/A                      |
| `contributions.giftPerGuest` | `finance/main`               | Solo Finanzas                     | ✅ N/A                      |
| `contributions.extras`       | `finance/main`               | Solo Finanzas                     | ✅ N/A                      |
| `settings`                   | `finance/main`               | Solo Finanzas                     | ✅ N/A                      |
| `transactions`               | `weddings/{id}/transactions` | Solo Finanzas                     | ✅ Subcolección             |

---

## ⚠️ PROBLEMAS DETECTADOS

### **1. NÚMERO DE INVITADOS (guestCount)** - 🔴 CRÍTICO

#### **Ubicaciones:**

- **Finanzas:** `weddings/{id}/finance/main/contributions.guestCount`
- **Resto del proyecto:** `weddings/{id}/guestCount` (raíz)

#### **Dónde se usa:**

```javascript
// 1. Sistema de Presupuestos (useWeddingBasicInfo.js)
const numeroInvitados = activeWeddingData.guestCount || ...

// 2. Benchmarks de presupuesto (useBudgetBenchmarks.js)
guestCount: contributions?.guestCount || activeWeddingData?.guestCount

// 3. Seating Plan (layoutTemplates.js)
const estimatedTables = Math.ceil(guestCount / 8)

// 4. Bulk RFQ Automation
wi.guestCount || wi.invitados || ...

// 5. Proveedor search filters
guests: smartFilters?.guests ?? weddingProfile?.guestCount

// 6. Analytics
trackLayoutSaved(userId, weddingId, layoutType, tableCount, guestCount)

// 7. Wizard de creación de boda
guestCountRange: form.guestCountRange
```

#### **Problema:**

Si el usuario actualiza el número de invitados en `/finanzas` (Configuración de Aportaciones):

- ✅ Se guarda en `finance/main/contributions.guestCount`
- ❌ NO se sincroniza con `weddings/{id}/guestCount`
- ❌ Sistema de presupuestos lee 0 o valor antiguo
- ❌ Benchmarks son incorrectos
- ❌ Seating plan calcula mal el número de mesas
- ❌ RFQ automation envía datos incorrectos

---

### **2. CATEGORÍAS DE PRESUPUESTO (budget.categories)** - 🟡 MEDIO

#### **Ubicaciones:**

- **Finanzas:** `weddings/{id}/finance/main/budget.categories`
- **Servicios:** `weddings/{id}/wantedServices` (raíz)

#### **Estado actual:**

- ⚠️ **Parcialmente sincronizado**: Solo los nombres de categorías se sincronizan a `wantedServices`
- ❌ **NO sincroniza**: Los montos de cada categoría NO se sincronizan

#### **Dónde se usa:**

```javascript
// 1. Finanzas (useFinance.js)
budget.categories.map(cat => ({ name, amount, spent, ... }))

// 2. Servicios deseados (syncProviderTemplatesWithCategories)
await saveData('wantedServices', categoryNames, ...)

// 3. AI Advisor
payload.budget.categories = categories.map(cat => ({
  name: cat.name,
  amount: Number(cat.amount) || 0
}))

// 4. Budget Snapshots (captura completa)
categories: normalizedCategories  // {key, name, amount}
```

#### **Problema:**

Actualmente solo sincroniza nombres, no montos:

- ✅ `wantedServices` tiene nombres de categorías
- ❌ Otros sistemas no pueden saber cuánto presupuesto hay por categoría
- ⚠️ AI Advisor usa datos correctos (lee directamente de finance/main)

---

## ✅ SOLUCIONES PROPUESTAS

### **SOLUCIÓN 1: Sincronizar guestCount** - 🔴 PRIORITARIO

Similar al fix del presupuesto total, sincronizar cuando se actualiza:

```javascript
const updateContributions = useCallback(
  async (updates) => {
    setContributions((prev) => {
      const next = { ...prev, ...updates };

      // 1. Persistir en finance/main (como antes)
      persistFinanceDoc({ contributions: next });

      // 2. SINCRONIZACIÓN: Si actualiza guestCount, sincronizar en raíz
      if (updates.guestCount !== undefined && activeWedding && db && firebaseUid) {
        try {
          const weddingRef = doc(db, 'weddings', activeWedding);
          await setDoc(weddingRef, {
            guestCount: next.guestCount,
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log(`[useFinance] GuestCount sincronizado: ${next.guestCount}`);
        } catch (error) {
          console.warn('[useFinance] No se pudo sincronizar guestCount:', error);
        }
      }

      return next;
    });
  },
  [persistFinanceDoc, activeWedding, firebaseUid]
);
```

**Impacto:**

- ✅ Número de invitados consistente en todo el proyecto
- ✅ Benchmarks correctos
- ✅ Seating plan calcula bien las mesas
- ✅ RFQ automation envía datos precisos
- ✅ Sistema de presupuestos tiene datos correctos

---

### **SOLUCIÓN 2: Sincronizar budget.categories** - 🟡 OPCIONAL

Sincronizar montos de categorías en documento raíz:

```javascript
const setBudgetCategories = useCallback(
  async (nextCategories) => {
    if (!Array.isArray(nextCategories)) return;
    const sanitized = nextCategories.map((cat) => ({
      ...cat,
      amount: parseMoneyValue(cat?.amount, 0),
    }));

    setBudget((prev) => ({ ...prev, categories: sanitized }));

    // 1. Persistir en finance/main
    await persistFinanceDoc({
      budget: { total: budget.total, categories: sanitized },
    });

    // 2. Sincronizar nombres en wantedServices (ya existe)
    await syncProviderTemplatesWithCategories(sanitized);

    // 3. NUEVO: Sincronizar también los montos en raíz
    if (activeWedding && db && firebaseUid) {
      try {
        const weddingRef = doc(db, 'weddings', activeWedding);
        const categoriesData = sanitized.map((cat) => ({
          name: cat.name,
          amount: cat.amount,
          key: normalizeBudgetCategoryKey(cat.name),
        }));

        await setDoc(
          weddingRef,
          {
            'budget.categories': categoriesData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`[useFinance] Categorías sincronizadas: ${sanitized.length}`);
      } catch (error) {
        console.warn('[useFinance] No se pudo sincronizar categorías:', error);
      }
    }
  },
  [budget.total, persistFinanceDoc, syncProviderTemplatesWithCategories, activeWedding, firebaseUid]
);
```

**Ventajas:**

- ✅ Otros sistemas podrían acceder a montos por categoría
- ✅ Análisis de presupuesto más completo
- ✅ Reporting más detallado

**Desventajas:**

- ⚠️ Actualmente NO hay sistemas que necesiten esto urgentemente
- ⚠️ Aumenta complejidad de sincronización
- ⚠️ Puede causar conflictos si se edita desde múltiples lugares

---

## 🎯 RECOMENDACIONES

### **IMPLEMENTAR AHORA:**

1. ✅ **guestCount** - CRÍTICO
   - Muchos sistemas lo usan
   - Afecta funcionalidad core (presupuestos, seating, RFQ)
   - Solución simple y directa

### **CONSIDERAR PARA FUTURO:**

2. ⚠️ **budget.categories montos** - OPCIONAL
   - Actualmente solo nombres se necesitan en otros lugares
   - AI Advisor ya lee correctamente de finance/main
   - Puede implementarse si se añaden features que lo requieran

### **NO NECESARIO:**

3. ✅ **contributions individuales** (initA, monthlyA, etc.)
   - Solo se usan en Finanzas
   - No necesitan sincronización

4. ✅ **transactions**
   - Ya están en subcolección correcta
   - Accesibles desde cualquier parte

5. ✅ **settings**
   - Solo se usan en Finanzas
   - No necesitan sincronización

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Fix Crítico (AHORA)**

```bash
✓ budget.total sincronizado (COMPLETADO)
□ guestCount sincronización (PENDIENTE - CRÍTICO)
```

### **FASE 2: Mejoras Opcionales (FUTURO)**

```bash
□ budget.categories montos (solo si se requiere)
□ Migración de datos existentes
□ Sincronización bidireccional
```

---

## 🧪 TESTING DESPUÉS DEL FIX

### **Test guestCount:**

```bash
# 1. Actualizar en Finanzas
→ /finanzas → Configuración → Número de invitados: 150
→ Guardar

# 2. Verificar Firestore
→ weddings/{id}/finance/main/contributions.guestCount = 150
→ weddings/{id}/guestCount = 150 ✓

# 3. Verificar en Presupuestos
→ Solicitar presupuesto
→ payload.weddingInfo.numeroInvitados = 150 ✓

# 4. Verificar en Seating Plan
→ /seating → Crear layout
→ Calcula: 150 / 8 = 19 mesas ✓

# 5. Verificar Benchmarks
→ /finanzas → Vista de benchmarks
→ Usa guestCount: 150 para comparaciones ✓
```

---

## 📊 RESUMEN EJECUTIVO

```
DATOS EN FINANZAS: 9 campos principales
==================

✅ SINCRONIZADOS:        2 (budget.total, wantedServices names)
❌ NECESITAN FIX:        1 (guestCount) ← CRÍTICO
⚠️  OPCIONALES:          1 (budget.categories montos)
✅ NO NECESITAN:         5 (contributions, settings, transactions)

PRIORIDAD: Implementar sincronización de guestCount YA
```

---

**Estado:** 📝 Análisis completado - Pendiente implementación de guestCount sync
