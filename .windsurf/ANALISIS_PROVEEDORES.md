# 🔍 ANÁLISIS COMPLETO: Página /proveedores

**Fecha:** 2025-10-30 4:42am  
**Estado:** ❌ PROBLEMAS CRÍTICOS DETECTADOS

---

## ❌ PROBLEMA 1: Backend no asigna categoría correcta

### **EVIDENCIA:**

```javascript
// Console log actual:
🔍 DEBUG FOTOGRAFÍA - Categorías guardadas:
  [0] "Sin categoría" - Paula Román Fotografía    ❌
  [1] "Sin categoría" - Fotógrafo de bodas        ❌
  [2] "Sin categoría" - Maribel Server           ❌
  [6] "audioprobe" - Audioprobe                  ❌ (categoría incorrecta)
```

### **CAUSA RAÍZ:**

El backend `/api/suppliers/search` devuelve suppliers sin la propiedad `category` correctamente mapeada.

**Archivo afectado:** `backend/routes/suppliersRoutes.js` (probablemente)

### **IMPACTO:**

- ❌ Los favoritos se guardan con `category: "Sin categoría"`
- ❌ No aparecen en las tarjetas de servicios
- ❌ El filtro `serviceFavorites.length` siempre devuelve 0
- ❌ El botón "Ver favoritos (X)" nunca aparece

### **FLUJO ACTUAL (ROTO):**

```
1. Usuario busca "fotografia"
   ↓
2. Backend devuelve: { name: "...", category: undefined }
   ↓
3. Frontend muestra proveedor
   ↓
4. Usuario guarda favorito
   ↓
5. Se guarda: { supplier: { category: undefined } }
   ↓
6. Firebase guarda como: category: "Sin categoría"
   ↓
7. ❌ Filtro falla: "Sin categoría" !== "fotografia"
   ↓
8. ❌ Botón "Ver favoritos" no aparece
```

### **SOLUCIÓN REQUERIDA:**

```javascript
// backend/routes/suppliersRoutes.js
// Asegurar que TODOS los suppliers tengan category mapeada

const mapSupplierCategory = (supplier) => {
  // Prioridad: category > service > "otros"
  if (supplier.category) return supplier.category;
  if (supplier.service) return normalizeCategory(supplier.service);
  return 'otros';
};

// Al devolver resultados:
suppliers.map((s) => ({
  ...s,
  category: mapSupplierCategory(s),
}));
```

---

## ❌ PROBLEMA 2: Hook `useFavoritesWithAutoCategory` no se usa

### **ARCHIVO:** `src/components/suppliers/SupplierCard.jsx`

**LÍNEA 33:**

```javascript
// ❌ ACTUAL (incorrecto):
const { isFavorite, toggleFavorite } = useFavorites();

// ✅ DEBERÍA SER:
const { isFavorite, toggleFavorite } = useFavoritesWithAutoCategory();
```

### **CAUSA:**

Se importa `useFavorites` directamente en lugar del wrapper que auto-añade categorías.

### **IMPACTO:**

- Aunque el supplier tuviera categoría correcta, no se añadiría automáticamente a los servicios activos
- El sistema de auto-añadir categorías no funciona

### **SOLUCIÓN:**

```javascript
// src/components/suppliers/SupplierCard.jsx
import { useFavoritesWithAutoCategory } from '../../hooks/useFavoritesWithAutoCategory';

export default function SupplierCard({ supplier, ...props }) {
  const { isFavorite, toggleFavorite } = useFavoritesWithAutoCategory();
  // ... resto del código
}
```

---

## ✅ NO ES PROBLEMA: Botón "Gestionar servicios" único

**EVIDENCIA:**
Solo hay UN lugar donde se renderiza:

- `WeddingServicesOverview.jsx` línea 101

**CONCLUSIÓN:** No hay duplicación. Si el usuario ve dos, es un problema de renderizado del componente padre.

---

## ✅ RESUELTO: Tarjetas se actualizan al editar servicios

**COMMIT:** `0c7a8c0b`

**CAMBIOS:**

- `getActiveCategoriesDetails` convertido a `useCallback`
- `activeCategories` añadido como dependencia en `useMemo`

**FLUJO ARREGLADO:**

```
1. Usuario abre "Gestionar servicios"
   ↓
2. Activa/desactiva servicios
   ↓
3. activeCategories cambia
   ↓
4. useCallback detecta cambio
   ↓
5. useMemo recalcula weddingServices
   ↓
6. ✅ Tarjetas se actualizan automáticamente
```

---

## 📋 PRIORIDAD DE FIXES:

### **🔴 URGENTE (Bloquea funcionalidad principal):**

1. **Backend: Asignar `category` correctamente en `/api/suppliers/search`**
   - Archivo: `backend/routes/suppliersRoutes.js`
   - Mapear `category` desde `service` o campo existente

2. **Frontend: Usar `useFavoritesWithAutoCategory` en `SupplierCard`**
   - Archivo: `src/components/suppliers/SupplierCard.jsx`
   - Línea 33

### **🟡 MEDIO (Mejoras de UX):**

3. Añadir validación de categoría en `FavoritesContext`
4. Normalizar categorías al guardar favoritos

### **🟢 BAJO (Nice to have):**

5. Añadir fallback visual si no hay categoría
6. Toast de error si categoría es inválida

---

## 🧪 PLAN DE TESTING:

### **Test 1: Verificar backend devuelve category**

```bash
# En terminal:
curl -X POST http://localhost:4004/api/suppliers/search \
  -H "Content-Type: application/json" \
  -d '{"service":"fotografia","location":"españa","query":""}'

# Verificar que TODOS los suppliers tengan:
# { ..., "category": "fotografia" }
```

### **Test 2: Verificar favoritos se guardan correctamente**

```javascript
// En consola del navegador:
// 1. Buscar "fotografia"
// 2. Guardar un favorito
// 3. Ver log:
🔍 [SupplierCard] Guardando favorito con: {
  category: "fotografia"  // ✅ Debe ser "fotografia", NO "Sin categoría"
}
```

### **Test 3: Verificar botón aparece**

```javascript
// En consola:
// 1. Recargar página
// 2. Ver tarjeta de Fotografía
// 3. Debe mostrar botón: "Ver favoritos (X)"
```

---

## 📊 FLUJO COMPLETO ESPERADO:

```
┌─────────────────────────────────────────────┐
│ 1. Usuario busca "fotografia"              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 2. Backend devuelve suppliers              │
│    ✅ CON category: "fotografia"           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 3. SupplierCard renderiza con categoría   │
│    supplier.category = "fotografia"        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 4. Usuario click ⭐ favorito               │
│    useFavoritesWithAutoCategory           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 5. Se guarda favorito                      │
│    { supplier: { category: "fotografia" }} │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 6. Auto-añade categoría a servicios       │
│    if (!isCategoryActive("fotografia"))   │
│      addCategory("fotografia")            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 7. WeddingServiceCard filtra favoritos    │
│    serviceFavorites = favorites.filter(   │
│      fav => fav.supplier.category ===     │
│              "fotografia"                  │
│    )                                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 8. ✅ Botón aparece                        │
│    "Ver favoritos (3)"                     │
└─────────────────────────────────────────────┘
```

---

## 🎯 PRÓXIMOS PASOS:

1. **Arreglar backend:** Mapear `category` correctamente
2. **Arreglar frontend:** Usar hook correcto
3. **Probar flujo completo:** Desde búsqueda hasta botón
4. **Commit y deploy:** Una vez verificado

---

**Estado actual:** ❌ Sistema ROTO - Favoritos no funcionan correctamente  
**Después del fix:** ✅ Sistema COMPLETO - Flujo end-to-end funcional
