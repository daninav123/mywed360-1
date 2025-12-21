# 💰 Sistema de Rebalanceo de Presupuesto - Implementado

## **Funcionalidad**

Cuando el usuario **aumenta** el presupuesto de una categoría y **excede el total**, se abre un modal inteligente que le permite elegir de dónde reducir el presupuesto.

## **Flujo de Usuario**

### **Escenario:**
```
Presupuesto total: 30,000 €
Catering actual: 8,100 €

Usuario cambia Catering a: 10,000 €
Diferencia: +1,900 €
Nuevo total: 31,900 € ❌ (excede 30,000 €)
```

### **Paso 1: Detección Automática**
Al guardar el cambio, el sistema detecta que se excede el presupuesto y muestra el modal de rebalanceo.

### **Paso 2: Modal de Opciones**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Ajustar Presupuesto                          │
├─────────────────────────────────────────────────┤
│ Has aumentado "Catering" de 8,100€ a 10,000€   │
│ Diferencia: +1,900€                             │
│ Total presupuesto: 30,000€                      │
├─────────────────────────────────────────────────┤
│ ¿De dónde reducir?                              │
│                                                 │
│ ● Solo de Imprevistos (Recomendado)            │
│   Imprevistos: 3,000€ → 1,100€                 │
│                                                 │
│ ○ Distribuir entre todas proporcionalmente      │
│   -237€ aprox. de cada categoría                │
│                                                 │
│ ○ Elegir manualmente                            │
│   Selecciona de qué categorías reducir          │
│                                                 │
│ ○ Aumentar presupuesto total                    │
│   Nuevo total: 31,900€                          │
│                                                 │
│         [Cancelar]  [Aplicar Cambios]           │
└─────────────────────────────────────────────────┘
```

## **Opciones Disponibles**

### **1. Solo de Imprevistos** ⭐ (Recomendada)
```
✅ Aparece si:
- Existe categoría "Imprevistos"
- Tiene suficiente presupuesto para cubrir la diferencia

Funcionamiento:
- Reduce SOLO de Imprevistos
- Mantiene todas las demás categorías intactas

Ejemplo:
Imprevistos: 3,000€ → 1,100€ (-1,900€)
```

### **2. Distribuir Proporcionalmente**
```
Funcionamiento:
- Calcula cuánto debe reducir de cada categoría
- Reduce proporcionalmente según su presupuesto actual

Ejemplo con 5 categorías (1,900€ a reducir):
Lugares:     5,940€ → 5,564€ (-376€, 31.6%)
Fotografía:  3,240€ → 3,034€ (-206€, 17.0%)
Música:      2,160€ → 2,023€ (-137€, 11.4%)
Decoración:  1,080€ → 1,011€ (-69€, 5.7%)
Imprevistos: 3,000€ → 2,808€ (-192€, 15.8%)
```

**Cálculo:**
```javascript
reducción de X = (presupuesto de X / total otros) × diferencia
```

### **3. Elegir Manualmente**
```
Funcionamiento:
- Usuario introduce cuánto reducir de cada categoría
- Debe sumar exactamente la diferencia
- Validación en tiempo real

UI:
┌────────────────────────────────────┐
│ Lugares        [____] € (máx 5,940)│
│ Fotografía     [____] € (máx 3,240)│
│ Música         [____] € (máx 2,160)│
│ Decoración     [____] € (máx 1,080)│
│ Imprevistos    [1900] € (máx 3,000)│
│                                    │
│ Total: 1,900€ / 1,900€ ✓           │
└────────────────────────────────────┘
```

### **4. Aumentar Presupuesto Total**
```
Funcionamiento:
- No reduce ninguna categoría
- Aumenta el presupuesto total automáticamente
- Llama a updateTotalBudget()

Ejemplo:
Presupuesto total: 30,000€ → 31,900€
```

## **Lógica de Prioridad**

### **Opción por Defecto:**
```javascript
if (existe Imprevistos && tiene suficiente) {
  → Opción 1: Solo de Imprevistos
} else if (hay otras categorías) {
  → Opción 2: Distribuir proporcionalmente
} else {
  → Opción 4: Aumentar presupuesto
}
```

## **Casos de Uso**

### **Caso 1: Hay Imprevistos con suficiente presupuesto**
```
Usuario aumenta Catering +1,900€
Imprevistos tiene 3,000€

Modal sugiere:
✓ Solo de Imprevistos (por defecto seleccionado)
  Otras opciones disponibles

Resultado:
Catering: 10,000€ ✓
Imprevistos: 1,100€ ✓
```

### **Caso 2: Imprevistos insuficiente o no existe**
```
Usuario aumenta Lugares +2,500€
No hay Imprevistos o tiene menos de 2,500€

Modal sugiere:
✓ Distribuir proporcionalmente (por defecto)
  Otras opciones disponibles

Resultado:
Todas las categorías reducen proporcionalmente
```

### **Caso 3: Usuario elige manual**
```
Usuario quiere control total

Modal muestra:
Lista de categorías con inputs
Validación en tiempo real
"Total: 1,500€ / 1,900€ ❌" (falta 400€)

Usuario completa hasta 1,900€
"Total: 1,900€ / 1,900€ ✓"
```

### **Caso 4: Usuario cancela**
```
Usuario abre modal, click "Cancelar"

Resultado:
- Cambio NO se aplica
- Categoría vuelve a su valor anterior
- Modal se cierra
```

## **Archivos Implementados**

### **1. BudgetRebalanceModal.jsx** (NUEVO)
Componente modal con toda la lógica de rebalanceo.

**Props:**
```javascript
{
  open: boolean,
  onClose: () => void,
  categoryName: string,
  oldAmount: number,
  newAmount: number,
  categories: Array,
  totalBudget: number,
  onApply: (rebalancedCategories) => void,
  t: function,
}
```

**Estados internos:**
- `selectedMode`: 'imprevistos' | 'proportional' | 'manual' | 'increase'
- `manualSelection`: { [categoryName]: amount }

**Funciones clave:**
- `getProportionalReduction()`: Calcula distribución proporcional
- `getTotalManualReduction()`: Suma selección manual
- `handleApply()`: Aplica los cambios según modo seleccionado

### **2. BudgetManager.jsx** (MODIFICADO)

**Nuevos estados:**
```javascript
const [showRebalanceModal, setShowRebalanceModal] = useState(false);
const [rebalanceData, setRebalanceData] = useState(null);
```

**Función modificada: `handleUpdateCategory()`**
```javascript
// Antes:
onUpdateCategory(index, updatedCategory);

// Ahora:
if (excede presupuesto total) {
  → Mostrar modal de rebalanceo
} else {
  → Aplicar cambio directo
}
```

**Nueva función: `handleRebalanceApply()`**
```javascript
const handleRebalanceApply = (rebalancedCategories) => {
  onReallocateCategories(rebalancedCategories);
  // Cerrar modal y limpiar estado
};
```

## **Integración con el Sistema**

### **Detección de Excesos:**
```javascript
const currentTotal = sum(otras categorías);
const totalAfterChange = currentTotal + newAmount;

if (newAmount > oldAmount && totalAfterChange > totalBudget) {
  // Mostrar modal
}
```

### **Aplicación de Cambios:**
```javascript
// 1. Actualizar categoría editada
categories[index] = updatedCategory;

// 2. Aplicar reducciones según modo
if (modo === 'imprevistos') {
  categories['Imprevistos'].amount -= diferencia;
} else if (modo === 'proportional') {
  // Reducir proporcionalmente
} else if (modo === 'manual') {
  // Aplicar selección manual
}

// 3. Guardar
onReallocateCategories(categories);
```

## **UI/UX**

### **Diseño del Modal:**
- **Header:** Icono de advertencia + título
- **Card de información:** Resumen del cambio
- **Opciones:** Radio buttons con descripciones claras
- **Preview:** Vista previa según opción seleccionada
- **Acciones:** Cancelar (outline) + Aplicar (primary)

### **Estados Visuales:**
```
Opción seleccionada:
- Border azul
- Background azul claro
- Radio button relleno

Opción no seleccionada:
- Border gris
- Background blanco
- Radio button vacío

Validación manual:
- Total correcto: ✓ verde
- Total incorrecto: ❌ rojo + mensaje
- Botón "Aplicar" deshabilitado si incorrecto
```

## **Ejemplos Completos**

### **Ejemplo 1: Flujo Completo con Imprevistos**
```
Estado inicial:
Catering: 8,100€
Lugares: 5,940€
Imprevistos: 3,000€
Total: 30,000€

1. Usuario edita Catering → 12,000€
2. Sistema detecta: 12,000 + 5,940 + 3,000 = 20,940€ 
   (solo otras 2, no cuenta Catering en el cálculo)
   + Catering nuevo 12,000€ = 32,940€ > 30,000€
3. Modal se abre:
   - Diferencia: +3,900€
   - Opción sugerida: Imprevistos (tiene 3,000€, NO alcanza)
   - Opción por defecto: Proporcional
4. Usuario selecciona "Manual":
   - Imprevistos: -3,000€
   - Lugares: -900€
   - Total: 3,900€ ✓
5. Click "Aplicar"

Resultado:
Catering: 12,000€
Lugares: 5,040€
Imprevistos: 0€
Total: 30,000€ ✓
```

### **Ejemplo 2: Aumentar Presupuesto**
```
Usuario aumenta Fotografía +5,000€
Excede presupuesto

Modal:
Usuario selecciona "Aumentar presupuesto total"

Resultado:
Fotografía aumentada
Presupuesto total: 35,000€
Sin cambios en otras categorías
```

## **Ventajas del Sistema**

✅ **Inteligente:** Sugiere la mejor opción automáticamente  
✅ **Flexible:** 4 modos diferentes según necesidad  
✅ **Educativo:** Explica cada opción claramente  
✅ **Seguro:** Validación en tiempo real  
✅ **UX clara:** Previews y feedback visual  
✅ **Reversible:** Cancelar en cualquier momento  

## **Testing Sugerido**

### **Test 1: Reducir de Imprevistos**
1. Aumentar cualquier categoría +1,500€
2. Verificar que sugiere "Solo de Imprevistos"
3. Aplicar
4. Verificar que Imprevistos se redujo 1,500€

### **Test 2: Distribución Proporcional**
1. Eliminar categoría Imprevistos
2. Aumentar Catering +2,000€
3. Seleccionar "Distribuir proporcionalmente"
4. Verificar preview muestra reducciones correctas
5. Aplicar
6. Verificar que suma 30,000€

### **Test 3: Manual**
1. Aumentar categoría +1,000€
2. Seleccionar "Elegir manualmente"
3. Introducir 500€ en una, 500€ en otra
4. Verificar "Total: 1,000€ / 1,000€ ✓"
5. Aplicar

### **Test 4: Cancelar**
1. Aumentar categoría
2. Modal abierto
3. Click "Cancelar"
4. Verificar que NO se aplicó el cambio

### **Test 5: Aumentar Presupuesto**
1. Aumentar categoría +3,000€
2. Seleccionar "Aumentar presupuesto total"
3. Aplicar
4. Verificar nuevo total es 33,000€

---

**Estado:** ✅ Implementado y listo  
**Archivos:** BudgetRebalanceModal.jsx (nuevo), BudgetManager.jsx (modificado)  
**Versión:** 1.0  
**Fecha:** 16 de diciembre de 2025
