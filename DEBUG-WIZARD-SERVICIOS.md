# 🐛 Debug: Servicios Apareciendo en Step 3

## **Problema Reportado**

"Si no selecciono todos los servicios, en el paso 3 aparecen igualmente todos"

## **Análisis del Flujo**

### **Step 2 → Step 3 Flow:**

```
1. Usuario abre wizard
2. Step 1: Define presupuesto total
3. Step 2: Selecciona servicios (algunos, no todos)
4. Click "Siguiente"
5. Step 3: 🐛 BUG - Aparecen TODOS los servicios, no solo los seleccionados
```

## **Código Actual**

### **Step 2 - Selección:**
```javascript
// data.selectedServices se actualiza cuando usuario hace click
const toggleService = (serviceName) => {
  const isSelected = data.selectedServices.includes(serviceName);
  const updated = isSelected
    ? data.selectedServices.filter(s => s !== serviceName)
    : [...data.selectedServices, serviceName];
  
  onUpdate({ selectedServices: updated });
};
```

### **Step 3 - Distribución:**
```javascript
// Genera distribución SOLO para data.selectedServices
const distribution = data.selectedServices.map(service => {
  const key = normalizeBudgetCategoryKey(service);
  let percentage = industryPercentages[key];
  // ...
});
```

## **Posibles Causas**

### **Causa 1: useEffect auto-selecciona servicios**

En `BudgetWizardStep2.jsx` líneas 29-49:

```javascript
useEffect(() => {
  const preselected = commonServices
    .filter(service => 
      wantedServices.some(ws => 
        ws.toLowerCase().includes(service.key) || 
        service.label.toLowerCase().includes(ws.toLowerCase())
      )
    )
    .map(s => s.label);
  
  // 🐛 PROBLEMA: Esto podría ejecutarse en momento incorrecto
  if (data.selectedServices.length === 0 && (preselected.length > 0 || custom.length > 0)) {
    onUpdate({ selectedServices: [...preselected, ...custom] });
  }
}, [wantedServices]);
```

**Problema:** Si `wantedServices` contiene TODOS los servicios, este useEffect los preselecciona todos automáticamente.

### **Causa 2: Estado no se limpia entre pasos**

El wizard mantiene estado entre pasos. Si el usuario:
1. Selecciona servicios en Step 2
2. Va a Step 3
3. Vuelve a Step 2
4. Deselecciona algunos
5. Va a Step 3 de nuevo

El `distribution` anterior podría no actualizarse.

### **Causa 3: Dependencias del useEffect**

```javascript
// Step 3, línea 45
}, [data.selectedServices]);
```

Este useEffect se ejecuta cuando `data.selectedServices` cambia, pero `localDistribution` mantiene el estado anterior si no se limpia.

## **Test Case para Reproducir**

```javascript
// Estado inicial
wizardData = {
  selectedServices: [],
  distribution: []
}

// Usuario en Step 2 selecciona SOLO 2 servicios
toggleService('Catering')      // selectedServices = ['Catering']
toggleService('Fotografía')    // selectedServices = ['Catering', 'Fotografía']

// Click "Siguiente" → Step 3
// 🐛 BUG ESPERADO: Si aparecen MÁS de 2 servicios en la lista

// Debería mostrar:
distribution = [
  { name: 'Catering', percentage: 64.3, amount: 19290 },
  { name: 'Fotografía', percentage: 25.7, amount: 7710 },
  { name: 'Imprevistos', percentage: 10, amount: 3000 }
]

// Si muestra más servicios → BUG confirmado
```

## **Solución Propuesta**

### **Fix 1: Limpiar distribution cuando selectedServices cambia**

```javascript
// En BudgetWizardStep3.jsx
useEffect(() => {
  // Limpiar distribución anterior si servicios seleccionados cambiaron
  if (data.distribution.length > 0) {
    const distributionServices = data.distribution.map(d => d.name).filter(n => n !== 'Imprevistos');
    const servicesMatch = 
      distributionServices.length === data.selectedServices.length &&
      distributionServices.every(s => data.selectedServices.includes(s));
    
    if (!servicesMatch) {
      // Los servicios cambiaron, regenerar
      setLocalDistribution([]);
      generateSmartDistribution();
    } else {
      setLocalDistribution(data.distribution);
    }
  } else if (data.selectedServices.length > 0) {
    generateSmartDistribution();
  }
}, [data.selectedServices]);
```

### **Fix 2: Validar en BudgetWizardModal**

```javascript
// En handleNext, antes de ir a Step 3
const handleNext = () => {
  if (currentStep === 2) {
    // Limpiar distribución anterior si servicios cambiaron
    const existingServices = wizardData.distribution
      .map(d => d.name)
      .filter(n => n !== 'Imprevistos');
    
    const servicesChanged = 
      existingServices.length !== wizardData.selectedServices.length ||
      !existingServices.every(s => wizardData.selectedServices.includes(s));
    
    if (servicesChanged) {
      setWizardData(prev => ({ ...prev, distribution: [] }));
    }
  }
  
  if (currentStep < 3) {
    setCurrentStep(prev => prev + 1);
  }
};
```

### **Fix 3: Añadir logging para debug**

```javascript
// En generateSmartDistribution
const generateSmartDistribution = () => {
  console.log('[Step3] Servicios seleccionados:', data.selectedServices);
  console.log('[Step3] Total presupuesto:', data.totalBudget);
  
  const count = data.selectedServices.length;
  if (count === 0 || data.totalBudget <= 0) {
    console.warn('[Step3] No se puede generar distribución: count o budget inválido');
    return;
  }
  
  // ... resto del código
  
  console.log('[Step3] Distribución generada:', normalizedDistribution);
  console.log('[Step3] Servicios en distribución:', normalizedDistribution.map(d => d.name));
};
```

## **Verificación**

Después del fix, verificar:

1. ✅ Seleccionar 2 servicios → Step 3 muestra 2 + Imprevistos (total 3)
2. ✅ Volver a Step 2, añadir 1 más → Step 3 muestra 3 + Imprevistos (total 4)
3. ✅ Volver a Step 2, quitar 1 → Step 3 muestra 2 + Imprevistos (total 3)
4. ✅ Seleccionar todos → Step 3 muestra todos + Imprevistos
5. ✅ Deseleccionar todos menos 1 → Step 3 muestra 1 + Imprevistos (total 2)
