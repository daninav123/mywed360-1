# 🔧 Fix: Persistencia de Presupuesto - Solucionado

## **Problema**

Al recargar la página, las categorías de presupuesto mostraban **0,00 € asignado** en todas ellas, perdiendo los datos del wizard.

```
Antes de recargar:
Catering:    8,100 € ✓
Lugares:     5,940 € ✓
Fotografía:  3,240 € ✓

Después de recargar:
Catering:    0,00 € ❌
Lugares:     0,00 € ❌
Fotografía:  0,00 € ❌
```

## **Causa Raíz**

**Flujo incompleto de datos:**

1. ✅ **Guardar funcionaba:** `setBudgetCategories()` → `persistFinanceDoc()` → Firestore
2. ❌ **Cargar NO funcionaba:** Al recargar, el estado se inicializaba vacío y nunca se sincronizaba desde Firestore

**Código problemático:**
```javascript
// Estado inicial siempre vacío
const [budget, setBudget] = useState({
  total: 0,
  categories: [], // ← Siempre vacío al recargar
});

// ❌ NO había listener de Firestore para cargar datos
// Solo se guardaban, nunca se recuperaban
```

## **Solución Implementada**

### **Añadido: useEffect con onSnapshot**

Ahora hay un **listener en tiempo real** de Firestore que:
1. Se conecta al documento `weddings/{weddingId}/finance/main`
2. Sincroniza automáticamente los datos al estado local
3. Se actualiza en tiempo real si cambian desde otro dispositivo

**Código añadido:**
```javascript
useEffect(() => {
  if (!activeWedding || !db) return;

  const financeRef = doc(db, 'weddings', activeWedding, 'finance', 'main');
  
  const unsubscribe = onSnapshot(
    financeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Sincronizar budget (total + categories)
        if (data.budget) {
          setBudget({
            total: Number(data.budget.total) || 0,
            categories: data.budget.categories.map(cat => ({
              name: cat.name,
              amount: Number(cat.amount),
              muted: cat.muted || false,
            })),
          });
        }
        
        // Sincronizar contributions, settings, advisor...
      }
    },
    (error) => {
      console.warn('[useFinance] Error:', error);
    }
  );

  return () => unsubscribe();
}, [activeWedding]);
```

## **Flujo Completo Ahora**

### **1. Completar Wizard:**
```
Usuario completa wizard
  ↓
handleCompleteWizard(wizardData)
  ↓
setBudgetCategories([
  {name: "Catering", amount: 8100},
  {name: "Lugares", amount: 5940},
  ...
])
  ↓
persistFinanceDoc({
  budget: {
    total: 30000,
    categories: [...]
  }
})
  ↓
Firestore: weddings/{id}/finance/main
```

### **2. Recargar Página:**
```
useEffect se ejecuta
  ↓
onSnapshot conecta a weddings/{id}/finance/main
  ↓
Lee documento de Firestore
  ↓
data.budget.categories = [
  {name: "Catering", amount: 8100},
  {name: "Lugares", amount: 5940},
  ...
]
  ↓
setBudget({
  total: 30000,
  categories: [...] ✓
})
  ↓
UI muestra amounts correctos ✓
```

### **3. Sincronización en Tiempo Real:**
```
Usuario edita en Dispositivo A:
  Catering: 8,100€ → 10,000€
  ↓
persistFinanceDoc() guarda en Firestore
  ↓
onSnapshot detecta cambio en Dispositivo B
  ↓
Actualiza estado automáticamente en Dispositivo B
  ↓
UI se actualiza sin recargar ✓
```

## **Datos Sincronizados**

El listener sincroniza **todos** los datos de finance/main:

1. ✅ **Budget:**
   - `total`: Presupuesto total
   - `categories`: Array de categorías con amounts

2. ✅ **Contributions:**
   - `initA`, `initB`
   - `monthlyA`, `monthlyB`
   - `extras`, `giftPerGuest`
   - `guestCount`

3. ✅ **Settings:**
   - `alertThresholds`: { warn: 75, danger: 90 }

4. ✅ **AI Advisor:**
   - Escenarios, tips, etc.

## **Estructura en Firestore**

```
weddings/
  └─ {weddingId}/
      ├─ (documento raíz de la boda)
      ├─ finance/
      │   └─ main/  ← Este documento se sincroniza ahora
      │       ├─ budget:
      │       │   ├─ total: 30000
      │       │   └─ categories: [
      │       │       {name: "Catering", amount: 8100, muted: false},
      │       │       {name: "Lugares", amount: 5940, muted: false},
      │       │       ...
      │       │     ]
      │       ├─ contributions: {...}
      │       ├─ settings: {...}
      │       └─ aiAdvisor: {...}
      │
      └─ transactions/ (subcolección)
```

## **Ventajas de la Solución**

### ✅ **Persistencia Real**
Los datos se guardan en Firestore y se recuperan al recargar.

### ✅ **Sincronización Multi-dispositivo**
Si editas en móvil, se actualiza automáticamente en desktop.

### ✅ **Tiempo Real**
Usa `onSnapshot` en vez de peticiones manuales.

### ✅ **Offline-First**
Firestore maneja cache local automáticamente.

### ✅ **Limpieza Automática**
El `unsubscribe()` en cleanup previene memory leaks.

## **Testing**

### **Test 1: Completar Wizard y Recargar**
```
1. Completar wizard con servicios y amounts
2. Verificar que se ven en las tarjetas
3. Recargar página (F5 o Cmd+R)
4. ✓ Los amounts se mantienen
```

### **Test 2: Editar y Recargar**
```
1. Editar Catering de 8,100€ a 10,000€
2. Aplicar cambio
3. Recargar página
4. ✓ Catering sigue en 10,000€
```

### **Test 3: Multi-dispositivo (Opcional)**
```
1. Abrir app en 2 navegadores con misma cuenta
2. Editar categoría en navegador A
3. ✓ Se actualiza automáticamente en navegador B
```

### **Test 4: Eliminar Categoría**
```
1. Eliminar categoría "Imprevistos"
2. Recargar página
3. ✓ Imprevistos no aparece
```

## **Comparación Antes vs Después**

### **ANTES (Problemático):**
```javascript
// Solo estado local, se pierde al recargar
const [budget, setBudget] = useState({
  total: 0,
  categories: [], // ← Siempre vacío
});

// Guardar funcionaba
persistFinanceDoc({ budget: {...} }); ✓

// Cargar NO funcionaba
// ❌ No había listener de Firestore
```

### **DESPUÉS (Correcto):**
```javascript
// Estado local + sincronización con Firestore
const [budget, setBudget] = useState({
  total: 0,
  categories: [],
});

// useEffect carga datos al iniciar
useEffect(() => {
  onSnapshot(financeRef, (snapshot) => {
    setBudget(snapshot.data().budget); ✓
  });
}, [activeWedding]);

// Guardar funcionaba
persistFinanceDoc({ budget: {...} }); ✓

// Cargar ahora funciona
// ✓ Listener sincroniza automáticamente
```

## **Archivos Modificados**

**`useFinance.js`** (líneas ~281-327)
- Añadido useEffect con onSnapshot
- Sincroniza budget, contributions, settings, advisor
- Se ejecuta cada vez que cambia activeWedding
- Cleanup con unsubscribe()

## **Notas Técnicas**

### **Por qué onSnapshot en vez de getDoc:**
```javascript
// ❌ NO usar esto (solo carga una vez):
useEffect(() => {
  const doc = await getDoc(financeRef);
  setBudget(doc.data().budget);
}, [activeWedding]);

// ✓ Usar onSnapshot (tiempo real):
useEffect(() => {
  const unsubscribe = onSnapshot(financeRef, (snapshot) => {
    setBudget(snapshot.data().budget);
  });
  return () => unsubscribe();
}, [activeWedding]);
```

**Ventajas de onSnapshot:**
- Actualización automática en tiempo real
- No requiere llamadas manuales
- Maneja cache de Firestore automáticamente
- Se desconecta solo al desmontar

### **Manejo de Errores:**
```javascript
onSnapshot(
  financeRef,
  (snapshot) => { /* success */ },
  (error) => { 
    // Si falla (permisos, red, etc.)
    console.warn('Error:', error);
    // El estado local se mantiene
  }
);
```

## **Posibles Mejoras Futuras**

- [ ] Añadir loading state mientras carga datos iniciales
- [ ] Mostrar indicador si hay cambios sin guardar
- [ ] Implementar retry automático si falla la conexión
- [ ] Añadir versionado para detectar conflictos multi-usuario

---

**Estado:** ✅ Solucionado y funcionando  
**Impacto:** Crítico (ahora los datos persisten correctamente)  
**Archivo:** useFinance.js  
**Fecha:** 16 de diciembre de 2025
