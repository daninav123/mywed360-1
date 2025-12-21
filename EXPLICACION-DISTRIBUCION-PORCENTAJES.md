# 📊 Cómo Funciona la Distribución de Porcentajes en el Wizard

## **Resumen Ejecutivo**

La distribución inteligente asigna presupuesto según **porcentajes estándar de la industria** y luego los **normaliza** para que sumen exactamente el 90% (el 10% restante se reserva para imprevistos).

---

## **Paso a Paso del Algoritmo**

### **1. Porcentajes Base (Industria)**

Tenemos porcentajes predefinidos para servicios comunes:

```javascript
const industryPercentages = {
  'catering': 30,      // El más alto
  'lugares': 22,
  'restaurantes': 20,
  'fotografia': 12,
  'video': 10,
  'musica': 8,
  'dj': 8,
  'flores-decoracion': 6,
  'decoracion': 4,
  'vestidos-trajes': 5,
  'belleza': 1.5,
  'joyeria': 3,
  'tartas': 2,
  'invitaciones': 1.5,
  'detalles': 1,
  'transporte': 1,
  'animacion': 2,
  'fuegos-artificiales': 1,
  'organizacion': 4,
  'ceremonia': 1,
  'luna-miel': 5,
};
```

### **2. Asignación Inicial**

Para cada servicio seleccionado:

**Caso A: Servicio conocido**
- Se usa su porcentaje predefinido
- Ejemplo: Catering → 30%

**Caso B: Servicio desconocido/personalizado**
- Se calcula cuánto porcentaje ya está usado por servicios conocidos
- El resto se reparte equitativamente entre servicios desconocidos

**Ejemplo con servicio desconocido:**
```javascript
// Seleccionados: Catering (30%) + Fotografía (12%) + "Pirotecnia Custom"
// Servicios conocidos usan: 30 + 12 = 42%
// Resto disponible: 100 - 42 = 58%
// Servicios desconocidos: 1 ("Pirotecnia Custom")
// → "Pirotecnia Custom" recibe: 58% / 1 = 58%
```

### **3. Normalización**

Los porcentajes se normalizan para que sumen **exactamente 90%** (dejando 10% para reserva).

**Fórmula:**
```javascript
porcentajeNormalizado = (porcentajeOriginal / totalPorcentajes) * 90
```

**Ejemplo completo:**

#### **Escenario 1: Solo 2 servicios seleccionados**

```
Seleccionados:
- Catering (base: 30%)
- Fotografía (base: 12%)

Total base: 30 + 12 = 42%

Normalización:
- Catering:    (30 / 42) * 90 = 64.3%
- Fotografía:  (12 / 42) * 90 = 25.7%
- Imprevistos: 10%

Total: 100% ✓
```

**Con presupuesto de 30,000€:**
```
- Catering:    19,290€
- Fotografía:   7,710€
- Imprevistos:  3,000€
Total:         30,000€
```

---

#### **Escenario 2: Todos los servicios seleccionados**

```
Seleccionados: 21 servicios
Total base: 30 + 22 + 12 + 10 + 8 + 6 + 5 + ... = ~150%

Normalización:
- Catering:    (30 / 150) * 90 = 18%
- Lugares:     (22 / 150) * 90 = 13.2%
- Fotografía:  (12 / 150) * 90 = 7.2%
...
- Imprevistos: 10%

Total: 100% ✓
```

**Con presupuesto de 30,000€:**
```
- Catering:     5,400€
- Lugares:      3,960€
- Fotografía:   2,160€
...
- Imprevistos:  3,000€
Total:         30,000€
```

---

#### **Escenario 3: Mix de conocidos y personalizados**

```
Seleccionados:
- Catering (conocido: 30%)
- "Animación infantil" (personalizado)
- "Barra de cócteles" (personalizado)

Paso 1: Calcular base
- Servicios conocidos: 30%
- Resto disponible: 100 - 30 = 70%
- Servicios desconocidos: 2
- Cada desconocido: 70 / 2 = 35%

Distribución base:
- Catering: 30%
- Animación infantil: 35%
- Barra de cócteles: 35%
Total base: 100%

Paso 2: Normalizar a 90%
- Catering:           (30 / 100) * 90 = 27%
- Animación infantil: (35 / 100) * 90 = 31.5%
- Barra de cócteles:  (35 / 100) * 90 = 31.5%
- Imprevistos:        10%

Total: 100% ✓
```

**Con presupuesto de 30,000€:**
```
- Catering:            8,100€
- Animación infantil:  9,450€
- Barra de cócteles:   9,450€
- Imprevistos:         3,000€
Total:                30,000€
```

---

## **Ventajas del Algoritmo**

✅ **Flexible:** Funciona con 1 o 20+ servicios  
✅ **Inteligente:** Prioriza servicios importantes (catering > detalles)  
✅ **Justo:** Servicios desconocidos reciben parte proporcional  
✅ **Preciso:** Siempre suma exactamente 100%  
✅ **Seguro:** Reserva automática del 10%  

---

## **Código Completo**

```javascript
const generateSmartDistribution = () => {
  const count = data.selectedServices.length;
  if (count === 0 || data.totalBudget <= 0) return;

  const RESERVE_PERCENTAGE = 10;
  const AVAILABLE_PERCENTAGE = 100 - RESERVE_PERCENTAGE;
  const reserveAmount = Math.round((RESERVE_PERCENTAGE / 100) * data.totalBudget * 100) / 100;
  const availableBudget = data.totalBudget - reserveAmount;

  // Paso 1: Asignar porcentajes base
  const distribution = data.selectedServices.map(service => {
    const key = normalizeBudgetCategoryKey(service);
    let percentage = industryPercentages[key];
    
    if (!percentage) {
      // Servicio desconocido: calcular dinámicamente
      const categorizedServices = data.selectedServices.filter(s => {
        const k = normalizeBudgetCategoryKey(s);
        return industryPercentages[k];
      });
      
      const usedPercentage = categorizedServices.reduce((sum, s) => {
        const k = normalizeBudgetCategoryKey(s);
        return sum + (industryPercentages[k] || 0);
      }, 0);
      
      const remainingPercentage = Math.max(0, 100 - usedPercentage);
      const unknownServicesCount = data.selectedServices.length - categorizedServices.length;
      percentage = unknownServicesCount > 0 ? remainingPercentage / unknownServicesCount : 5;
    }
    
    return {
      name: service,
      percentage,
      amount: 0,
    };
  });

  // Paso 2: Normalizar a 90%
  const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0);
  
  const servicesDistribution = distribution.map(item => {
    const normalizedPercentage = (item.percentage / totalPercentage) * AVAILABLE_PERCENTAGE;
    const amount = Math.round((normalizedPercentage / 100) * data.totalBudget * 100) / 100;
    
    return {
      ...item,
      percentage: Math.round(normalizedPercentage * 10) / 10,
      amount,
    };
  });

  // Paso 3: Añadir reserva
  const reserveItem = {
    name: 'Imprevistos',
    percentage: RESERVE_PERCENTAGE,
    amount: reserveAmount,
  };

  const normalizedDistribution = [...servicesDistribution, reserveItem];

  // Paso 4: Ajustar redondeo
  const totalAmount = normalizedDistribution.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(totalAmount - data.totalBudget) > 0.01) {
    const diff = data.totalBudget - totalAmount;
    normalizedDistribution[0].amount = Math.round((normalizedDistribution[0].amount + diff) * 100) / 100;
  }

  setLocalDistribution(normalizedDistribution);
  onUpdate({ distribution: normalizedDistribution });
};
```

---

## **Casos Especiales**

### **¿Qué pasa si solo selecciono 1 servicio?**
```
Servicio: Catering
Base: 30%
Normalizado: (30 / 30) * 90 = 90%
Resultado:
- Catering: 90% (27,000€)
- Imprevistos: 10% (3,000€)
```

### **¿Qué pasa si todos son personalizados?**
```
Servicios: "Custom 1", "Custom 2", "Custom 3"
Base cada uno: 100 / 3 = 33.33%
Normalizado cada uno: (33.33 / 100) * 90 = 30%
Resultado:
- Custom 1: 30% (9,000€)
- Custom 2: 30% (9,000€)
- Custom 3: 30% (9,000€)
- Imprevistos: 10% (3,000€)
```

---

## **Comparación Visual**

### **2 servicios vs 20 servicios**

```
┌─────────────────────────────────────────┐
│ 2 SERVICIOS SELECCIONADOS               │
├─────────────────────────────────────────┤
│ Catering:     ████████████████ 64.3%   │
│ Fotografía:   ██████ 25.7%              │
│ Imprevistos:  ██ 10%                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 20 SERVICIOS SELECCIONADOS              │
├─────────────────────────────────────────┤
│ Catering:     ████ 18%                  │
│ Lugares:      ███ 13%                   │
│ Fotografía:   ██ 7%                     │
│ ... (17 más) ████████████████ 52%      │
│ Imprevistos:  ██ 10%                    │
└─────────────────────────────────────────┘
```

**Conclusión:** Cuantos menos servicios, más presupuesto para cada uno. Cuantos más servicios, más se reparte.
