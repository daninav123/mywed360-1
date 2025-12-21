# 🔧 Fix: Modal de Rebalanceo No Aparecía

## **Problema**

Cuando el usuario editaba una categoría y aumentaba el amount excediendo el presupuesto total, **el modal de rebalanceo NO se mostraba** para elegir de dónde reducir.

```
Usuario:
1. Click en ✏️ editar Catering
2. Cambiar de 8,100€ a 12,000€ (excede presupuesto)
3. Click "Actualizar"
4. ❌ Modal de rebalanceo NO aparece
5. ❌ Cambio se aplica directamente sin redistribuir
```

## **Causa Raíz**

**Flujo incorrecto en `handleSaveCategory`:**

El flujo debería ser:
```
handleSaveCategory
  ↓
handleUpdateCategory (detecta exceso)
  ↓
setShowRebalanceModal(true) ← Modal de rebalanceo
```

Pero estaba haciendo:
```
handleSaveCategory
  ↓
onUpdateCategory (directo al padre) ← Saltaba la detección
  ↓
❌ No detecta exceso, no muestra modal
```

**Código problemático:**
```javascript
const handleSaveCategory = () => {
  // ...validaciones...
  
  if (editingCategory) {
    onUpdateCategory(editingCategoryIndex, { name, amount }); // ❌ DIRECTO
  }
  
  setShowCategoryModal(false);
};
```

## **Solución**

Cambiar `handleSaveCategory` para que use `handleUpdateCategory` (la función interna que detecta excesos) en vez de `onUpdateCategory` (la función del padre).

**Código corregido:**
```javascript
const handleSaveCategory = () => {
  const amount = Number(newCategory.amount);
  
  // Validaciones...
  if (!newCategory.name.trim()) {
    toast.error(t('finance.budget.errors.nameRequired'));
    return;
  }
  if (isNaN(amount) || amount < 0) {
    toast.error(t('finance.budget.errors.amountInvalid'));
    return;
  }
  
  if (editingCategory) {
    const updatedCategory = { name: newCategory.name.trim(), amount };
    handleUpdateCategory(editingCategoryIndex, updatedCategory); // ✅ USA LA FUNCIÓN INTERNA
    setShowCategoryModal(false);
    setNewCategory({ name: '', amount: '' });
  } else {
    // Nueva categoría...
    const result = onAddCategory(newCategory.name.trim(), amount);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', amount: '' });
  }
};
```

## **Flujo Correcto Ahora**

### **Caso 1: Edición que NO excede presupuesto**
```
1. Usuario edita Catering: 8,100€ → 7,000€
2. handleSaveCategory llama a handleUpdateCategory
3. handleUpdateCategory detecta: NO excede (disminuyó)
4. Aplica cambio directo: onUpdateCategory()
5. ✓ Cierra modal de edición
```

### **Caso 2: Edición que SÍ excede presupuesto**
```
1. Usuario edita Catering: 8,100€ → 12,000€
2. handleSaveCategory llama a handleUpdateCategory
3. handleUpdateCategory detecta:
   - oldAmount: 8,100€
   - newAmount: 12,000€
   - Diferencia: +3,900€
   - Total después: 33,900€ > 30,000€ (presupuesto total)
4. ✓ Abre modal de rebalanceo
5. Usuario elige opción (Imprevistos, proporcional, etc.)
6. ✓ Aplica rebalanceo
7. ✓ Cierra ambos modales
```

## **Diferencia Clave**

### **handleUpdateCategory (Función interna de BudgetManager)**
```javascript
const handleUpdateCategory = (index, updatedCategory) => {
  const oldAmount = categories[index].amount;
  const newAmount = updatedCategory.amount;
  
  // ✓ DETECTA SI EXCEDE
  if (newAmount > oldAmount && totalAfterChange > totalBudget) {
    setShowRebalanceModal(true); // ← Muestra modal
  } else {
    onUpdateCategory(index, updatedCategory); // ← Directo
  }
};
```

### **onUpdateCategory (Función del padre - Finance.jsx)**
```javascript
const updateBudgetCategory = (index, updates) => {
  // Solo actualiza, NO detecta excesos
  const nextCategories = budget.categories.map((cat, idx) => {
    if (idx !== index) return cat;
    return { ...cat, ...updates };
  });
  persistFinanceDoc({ budget: { categories: nextCategories } });
};
```

## **Archivo Modificado**

**`BudgetManager.jsx`** (líneas ~447-470)
- Cambio en `handleSaveCategory`
- Ahora usa `handleUpdateCategory` para ediciones
- Mantiene `onAddCategory` para nuevas categorías

## **Testing**

### **Test 1: Exceder presupuesto**
```
1. Editar Catering: 8,100€ → 15,000€
2. Click "Actualizar"
3. ✓ Modal de rebalanceo aparece
4. Ver opciones:
   - Solo de Imprevistos
   - Distribuir proporcionalmente
   - Elegir manualmente
   - Aumentar presupuesto total
5. Seleccionar una opción
6. Click "Aplicar Cambios"
7. ✓ Se aplica correctamente
```

### **Test 2: NO exceder presupuesto**
```
1. Editar Catering: 8,100€ → 6,000€
2. Click "Actualizar"
3. ✓ Modal de rebalanceo NO aparece (no es necesario)
4. ✓ Cambio se aplica directamente
```

### **Test 3: Aumentar pero sin exceder**
```
Presupuesto total: 30,000€
Asignado: 28,000€
Disponible: 2,000€

1. Editar Catering: 8,100€ → 9,500€ (+1,400€)
2. Total después: 29,400€ < 30,000€
3. ✓ Modal NO aparece (no excede)
4. ✓ Cambio se aplica directamente
```

### **Test 4: Nueva categoría**
```
1. Click "Nueva categoría"
2. Nombre: "Música"
3. Amount: 2,000€
4. Click "Crear categoría"
5. ✓ Se crea sin modal de rebalanceo
   (las nuevas categorías no activan el rebalanceo)
```

## **Ejemplo Completo**

### **Escenario:**
```
Presupuesto total: 30,000€

Categorías actuales:
- Catering:    8,100€
- Lugares:     5,940€
- Fotografía:  3,240€
- Música:      2,160€
- Imprevistos: 3,000€
────────────────────────
Total:        22,440€
Disponible:    7,560€
```

### **Acción:**
```
Usuario edita Catering: 8,100€ → 12,000€
```

### **Detección:**
```javascript
oldAmount = 8,100€
newAmount = 12,000€

currentTotal = 22,440€ - 8,100€ = 14,340€ (otros servicios)
totalAfterChange = 14,340€ + 12,000€ = 26,340€

26,340€ < 30,000€ ✓ No excede
```

**Resultado:** Cambio se aplica directo, NO muestra modal.

### **Acción 2:**
```
Usuario edita Catering: 8,100€ → 18,000€
```

### **Detección:**
```javascript
oldAmount = 8,100€
newAmount = 18,000€

currentTotal = 14,340€ (otros servicios)
totalAfterChange = 14,340€ + 18,000€ = 32,340€

32,340€ > 30,000€ ❌ EXCEDE por 2,340€
```

**Resultado:** 
1. ✓ Modal de rebalanceo aparece
2. Usuario ve opciones:
   ```
   Diferencia: +2,340€
   
   ○ Solo de Imprevistos
     Imprevistos: 3,000€ → 660€
   
   ○ Distribuir proporcionalmente
     Lugares:     -936€
     Fotografía:  -515€
     Música:      -343€
     Imprevistos: -476€
   
   ○ Elegir manualmente
   
   ○ Aumentar presupuesto total
     Nuevo total: 32,340€
   ```
3. Usuario selecciona "Solo de Imprevistos"
4. Click "Aplicar Cambios"
5. ✓ Resultado:
   ```
   - Catering:    18,000€ ✓
   - Lugares:      5,940€
   - Fotografía:   3,240€
   - Música:       2,160€
   - Imprevistos:    660€ ✓
   ────────────────────────
   Total:         30,000€ ✓
   ```

## **Notas Importantes**

1. **Solo se activa al AUMENTAR:** Si disminuyes, no muestra modal
2. **Solo si EXCEDE:** Si aumentas pero no excedes el total, tampoco muestra modal
3. **Nuevas categorías:** No activan el rebalanceo (usan presupuesto disponible)
4. **Cancelar:** Cerrar el modal de rebalanceo cancela todo el cambio

## **Ventajas del Fix**

✅ **Experiencia correcta:** Usuario ve opciones cuando excede  
✅ **Previene errores:** No permite exceder sin redistribuir  
✅ **Educativo:** Muestra de dónde viene el dinero  
✅ **Flexible:** Usuario decide cómo redistribuir  

---

**Estado:** ✅ Corregido  
**Archivo:** BudgetManager.jsx (línea ~447)  
**Impacto:** Crítico (ahora el modal aparece correctamente)  
**Fecha:** 16 de diciembre de 2025
