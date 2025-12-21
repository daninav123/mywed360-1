# 🔍 Debug: Verificar Amounts del Wizard

## **Problema Actual**

Las tarjetas de categorías se crean correctamente pero muestran **0,00 € asignado** en todas ellas.

```
Catering:      Asignado: 0,00 €  ❌
Video:         Asignado: 0,00 €  ❌
DJ:            Asignado: 0,00 €  ❌
Flores:        Asignado: 0,00 €  ❌
```

## **Lógica Implementada**

### ✅ **1. BudgetCategoryCard**
El componente está correctamente implementado y muestra:
- **Asignado:** `assignedAmount` (viene del presupuesto de la categoría)
- **Comprometido:** `committedAmount` (proveedores con presupuesto asignado)
- **Gastado:** `spentAmount` (transacciones pagadas)
- **Restante:** `assignedAmount - max(spentAmount, committedAmount)`

### ✅ **2. BudgetManager**
Pasa correctamente los datos a cada card:
```javascript
<BudgetCategoryCard
  assignedAmount={rawCategory?.amount ?? category.amount ?? 0}
  spentAmount={Number(category.spent) || 0}
  committedAmount={committedMap.get(categoryKey) || 0}
  ...
/>
```

### ❓ **3. handleCompleteWizard**
Mapea la distribución del wizard:
```javascript
const categories = wizardData.distribution.map(item => ({
  name: item.name,
  amount: item.amount || 0,  // ← Este amount debería tener el valor
  muted: false,
}));
```

### ❓ **4. Paso 3 del Wizard**
Genera la distribución con amounts:
```javascript
const normalizedDistribution = distribution.map(item => {
  const normalizedPercentage = (item.percentage / totalPercentage) * 100;
  const amount = Math.round((normalizedPercentage / 100) * data.totalBudget * 100) / 100;
  
  return {
    ...item,
    percentage: Math.round(normalizedPercentage * 10) / 10,
    amount,  // ← Debería calcular el amount aquí
  };
});
```

## **Posibles Causas**

1. **data.totalBudget es 0 o undefined** en el Paso 3
2. **La distribución no se actualiza** cuando se genera
3. **wizardData.distribution llega vacío** a handleCompleteWizard
4. **El amount se pierde** en algún punto del flujo

## **Debug Añadido**

He añadido `console.log` en puntos clave:

### **Finance.jsx - handleCompleteWizard:**
```javascript
console.log('[Wizard] Datos recibidos:', wizardData);
console.log('[Wizard] Distribución:', wizardData.distribution);
console.log('[Wizard] Categorías creadas:', categories);
```

### **BudgetWizardStep3.jsx - generateSmartDistribution:**
```javascript
console.log('[Step3] Distribución generada:', normalizedDistribution);
console.log('[Step3] Total presupuesto:', data.totalBudget);
```

## **Cómo Verificar**

1. **Abre la consola del navegador** (F12 → Console)
2. **Abre el wizard** y completa los 3 pasos
3. **En el Paso 3**, cuando generes la distribución, busca:
   ```
   [Step3] Distribución generada: Array(5)
   [Step3] Total presupuesto: 30000
   ```
4. **Al finalizar el wizard**, busca:
   ```
   [Wizard] Datos recibidos: {guestCount: 100, totalBudget: 30000, ...}
   [Wizard] Distribución: Array(5)
   [Wizard] Categorías creadas: Array(5)
   ```

## **Resultados Esperados**

### ✅ **Si funciona correctamente:**
```javascript
[Step3] Distribución generada: [
  {name: "Catering", percentage: 30, amount: 9000},
  {name: "Lugares", percentage: 22, amount: 6600},
  {name: "Fotografía", percentage: 12, amount: 3600},
  ...
]
[Step3] Total presupuesto: 30000

[Wizard] Distribución: [
  {name: "Catering", percentage: 30, amount: 9000},
  ...
]
[Wizard] Categorías creadas: [
  {name: "Catering", amount: 9000, muted: false},
  {name: "Lugares", amount: 6600, muted: false},
  ...
]
```

### ❌ **Si NO funciona:**
```javascript
[Step3] Total presupuesto: 0  // ← PROBLEMA
[Step3] Distribución generada: [
  {name: "Catering", percentage: 30, amount: 0},  // ← amounts en 0
  ...
]
```

O:

```javascript
[Wizard] Distribución: []  // ← PROBLEMA: array vacío
```

## **Soluciones según el problema**

### **Caso 1: data.totalBudget es 0 en el Paso 3**
- El Paso 1 no está actualizando correctamente `wizardData.totalBudget`
- Verificar que `calculateTotalIncome()` llame a `onUpdate({ totalBudget: ... })`

### **Caso 2: La distribución no se genera**
- El usuario no hizo click en ningún método de distribución
- Añadir distribución por defecto al entrar al Paso 3

### **Caso 3: wizardData.distribution llega vacío**
- El Paso 3 no llama a `onUpdate({ distribution: ... })`
- Verificar que `setLocalDistribution` también llame a `onUpdate`

## **Próximos Pasos**

1. **Ejecuta el wizard completo** con la consola abierta
2. **Copia los logs** que aparezcan
3. **Comparte los resultados** para identificar dónde está el problema
4. **Aplicar el fix** según el caso identificado
