# 🔧 Fix: Porcentajes del Paso 3 No Funcionaban

## **Problema Identificado**

Los porcentajes de distribución inteligente mostraban **6.7% para todos los servicios** excepto Catering (30%), cuando deberían mostrar porcentajes diferenciados según el tipo de servicio.

### **Causa Raíz**

**Desajuste entre las claves usadas en diferentes partes del sistema:**

1. **Paso 2 (BudgetWizardStep2):** Guardaba servicios con labels en español usando keys en inglés
   ```javascript
   { key: 'venue', label: 'Local/Finca' }  // Se guardaba "Local/Finca"
   { key: 'photography', label: 'Fotografía' }  // Se guardaba "Fotografía"
   ```

2. **Paso 3 (BudgetWizardStep3):** Buscaba en `industryPercentages` usando keys normalizados
   ```javascript
   industryPercentages = {
     'venue': 22%,      // ❌ No coincidía con "Local/Finca" normalizado
     'photography': 12% // ❌ No coincidía con "Fotografía" normalizado
   }
   ```

3. **Sistema de categorías (SUPPLIER_CATEGORIES):** Usa IDs en español
   ```javascript
   { id: 'lugares', name: 'Lugares', keywords: ['salon', 'finca', ...] }
   { id: 'fotografia', name: 'Fotografía', keywords: ['fotografia', ...] }
   ```

### **Resultado**
- "Catering" → normalizaba a `catering` → ✅ encontraba 30%
- "Local/Finca" → normalizaba a `local-finca` o `local/finca` → ❌ NO encontraba en `industryPercentages`
- "Fotografía" → normalizaba a `fotografia` → ❌ NO encontraba `photography`
- Todos los no encontrados → recibían el porcentaje restante (100 - 30) / 5 = 14% → pero normalizado daba 6.7%

---

## **Solución Implementada**

### **1. Actualizar Paso 2: Usar nomenclatura del sistema**

**Antes:**
```javascript
const commonServices = [
  { key: 'catering', label: 'Catering', icon: '🍽️' },
  { key: 'venue', label: 'Local/Finca', icon: '🏰' },      // ❌ Inglés
  { key: 'photography', label: 'Fotografía', icon: '📸' }, // ❌ Inglés
  { key: 'music', label: 'Música/DJ', icon: '🎵' },        // ❌ Inglés
  // ...
];
```

**Ahora:**
```javascript
const commonServices = [
  { key: 'catering', label: 'Catering', icon: '🍽️' },
  { key: 'lugares', label: 'Lugares', icon: '🏰' },              // ✅ Español
  { key: 'fotografia', label: 'Fotografía', icon: '📸' },        // ✅ Español
  { key: 'video', label: 'Vídeo', icon: '🎥' },                  // ✅ Español
  { key: 'musica', label: 'Música', icon: '🎵' },                // ✅ Español
  { key: 'dj', label: 'DJ', icon: '🎧' },                        // ✅ Español
  { key: 'flores-decoracion', label: 'Flores y Decoración', icon: '💐' },
  { key: 'decoracion', label: 'Decoración', icon: '✨' },
  { key: 'vestidos-trajes', label: 'Vestidos y Trajes', icon: '👗' },
  { key: 'belleza', label: 'Belleza', icon: '💄' },
  { key: 'joyeria', label: 'Joyería', icon: '💍' },
  { key: 'tartas', label: 'Tartas de Boda', icon: '🎂' },
  { key: 'invitaciones', label: 'Invitaciones', icon: '💌' },
  { key: 'detalles', label: 'Detalles de Boda', icon: '🎁' },
  { key: 'transporte', label: 'Transporte', icon: '🚗' },
  { key: 'animacion', label: 'Animación', icon: '🎪' },
  { key: 'organizacion', label: 'Organización', icon: '📋' },
];
```

**Beneficio:** Ahora los labels coinciden con los IDs de `SUPPLIER_CATEGORIES`

### **2. Actualizar Paso 3: Claves en español del sistema**

**Antes:**
```javascript
const industryPercentages = {
  'catering': 30,
  'venue': 22,           // ❌ Inglés
  'photography': 12,     // ❌ Inglés
  'music': 8,            // ❌ Inglés
  'flowers': 6,          // ❌ Inglés
  // ...
};
```

**Ahora:**
```javascript
const industryPercentages = {
  'catering': 30,
  'lugares': 22,         // ✅ Coincide con SUPPLIER_CATEGORIES
  'restaurantes': 20,
  'fotografia': 12,      // ✅ Coincide con SUPPLIER_CATEGORIES
  'video': 10,
  'musica': 8,           // ✅ Coincide con SUPPLIER_CATEGORIES
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

---

## **Flujo Corregido**

### **Paso 2: Usuario selecciona servicios**
```
Usuario selecciona:
☑ Catering
☑ Lugares
☑ Fotografía
☑ Música
☑ Decoración

Se guarda: ["Catering", "Lugares", "Fotografía", "Música", "Decoración"]
```

### **Paso 3: Distribución inteligente**
```javascript
// Para cada servicio:
"Catering" → normalizeBudgetCategoryKey("Catering") 
  → normaliza a "catering"
  → busca en industryPercentages['catering'] 
  → ✅ encuentra 30%

"Lugares" → normalizeBudgetCategoryKey("Lugares")
  → normaliza a "lugares"
  → busca en industryPercentages['lugares']
  → ✅ encuentra 22%

"Fotografía" → normalizeBudgetCategoryKey("Fotografía")
  → normaliza a "fotografia" (sin tilde)
  → busca en industryPercentages['fotografia']
  → ✅ encuentra 12%

"Música" → normalizeBudgetCategoryKey("Música")
  → normaliza a "musica"
  → busca en industryPercentages['musica']
  → ✅ encuentra 8%

"Decoración" → normalizeBudgetCategoryKey("Decoración")
  → normaliza a "decoracion"
  → busca en industryPercentages['decoracion']
  → ✅ encuentra 4%
```

### **Resultado esperado:**
```
Catering:    30% → 9,000 €
Lugares:     22% → 6,600 €
Fotografía:  12% → 3,600 €
Música:       8% → 2,400 €
Decoración:   4% → 1,200 €
─────────────────────────
Total:       76% → 22,800 € (de 30,000 €)
```

Si el usuario tiene presupuesto de 30,000€ pero solo asigna 76%, quedan 7,200€ sin asignar (reserva para imprevistos o categorías adicionales).

---

## **Compatibilidad con `normalizeBudgetCategoryKey`**

Esta función del sistema:
1. Normaliza el texto (elimina tildes, convierte a minúsculas)
2. Busca en `SUPPLIER_CATEGORIES` usando keywords
3. Devuelve el `id` de la categoría encontrada

**Ejemplo:**
```javascript
normalizeBudgetCategoryKey("Fotografía")
  → normaliza: "fotografia"
  → busca en SUPPLIER_CATEGORIES
  → encuentra: { id: 'fotografia', keywords: ['fotografia', 'fotografo', ...] }
  → devuelve: "fotografia"

normalizeBudgetCategoryKey("Lugares")
  → normaliza: "lugares"
  → busca en SUPPLIER_CATEGORIES
  → encuentra: { id: 'lugares', keywords: ['salon', 'finca', 'hacienda', ...] }
  → devuelve: "lugares"
```

Ahora `industryPercentages` usa exactamente esos IDs, por lo que el match es perfecto.

---

## **Archivos Modificados**

1. **`BudgetWizardStep2.jsx`** (líneas 9-25)
   - Actualizado `commonServices` con 17 servicios usando IDs del sistema
   - Keys cambiados de inglés a español para coincidir con `SUPPLIER_CATEGORIES`

2. **`BudgetWizardStep3.jsx`** (líneas 21-42)
   - Actualizado `industryPercentages` con claves en español
   - 20 categorías con porcentajes diferenciados

---

## **Testing**

### **Test 1: Servicios básicos**
```
Seleccionar: Catering, Lugares, Fotografía
Método: Distribución Inteligente

Resultado esperado:
✅ Catering:    30%
✅ Lugares:     22%
✅ Fotografía:  12%
✅ Total:       64% (suma correcta)
```

### **Test 2: Todos los servicios comunes**
```
Seleccionar: Todos los 17 servicios del grid
Método: Distribución Inteligente

Resultado esperado:
✅ Cada servicio tiene su % específico (no todos 6.7%)
✅ La suma se normaliza a 100%
✅ Los montos coinciden con el presupuesto total
```

### **Test 3: Servicio personalizado**
```
Seleccionar: Catering (30%), Fotografía (12%), "Pirotecnia" (personalizado)
Método: Distribución Inteligente

Resultado esperado:
✅ Catering:     30%
✅ Fotografía:   12%
✅ Pirotecnia:   58% (100 - 30 - 12, porque no está en industryPercentages)
```

---

## **Antes vs Después**

### **ANTES (incorrecto):**
```
Catering:      13889,97 €  (30.0%)  ✅
Local/Finca:   3086,67 €   (6.7%)   ❌ Debería ser ~22%
Música/DJ:     3086,67 €   (6.7%)   ❌ Debería ser ~8%
Decoración:    3086,67 €   (6.7%)   ❌ Debería ser ~4%
Invitaciones:  3086,67 €   (6.7%)   ❌ Debería ser ~1.5%
```

### **DESPUÉS (correcto):**
```
Catering:      13800,00 €  (30.0%)  ✅
Lugares:       10120,00 €  (22.0%)  ✅
Música:        3680,00 €   (8.0%)   ✅
Decoración:    1840,00 €   (4.0%)   ✅
Invitaciones:  690,00 €    (1.5%)   ✅
```

---

## **Próximos Pasos**

1. **Hacer hard refresh** en el navegador: `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows)
2. **Limpiar localStorage** si persiste: DevTools → Application → Local Storage → Clear
3. **Reiniciar el wizard** desde el botón "Rehacer Asistente"
4. **Probar la distribución inteligente** en el Paso 3

Si aún no funciona, verificar en la consola del navegador si hay errores de normalización.
