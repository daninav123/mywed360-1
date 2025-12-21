# Diagnóstico: Problema con Joyería y Categorías con Acentos

## Problema Reportado

- ❌ Botón rechazar presupuesto no funciona
- ❌ Favoritos de Joyería no se cuentan correctamente
- ⚠️ Posible problema en otras categorías con acentos

## Investigación

### Categorías con Acentos

```javascript
// En supplierCategories.js
{
  id: 'joyeria',        // ✅ Sin acento
  name: 'Joyería',      // ⚠️ Con acento
  keywords: ['joyeria'] // ✅ Sin acento
}

{
  id: 'musica',         // ✅ Sin acento
  name: 'Música',       // ⚠️ Con acento
  keywords: ['musica']  // ✅ Sin acento
}

{
  id: 'video',          // ✅ Sin acento
  name: 'Vídeo',        // ⚠️ Con acento
  keywords: ['video']   // ✅ Sin acento
}
```

### Flujo de Datos

**1. Búsqueda de Proveedores**
```
Usuario busca "Joyería" → 
Backend busca con keyword "joyeria" →
Proveedores encontrados →
mapSupplierCategory() clasifica cada proveedor →
Devuelve ID: 'joyeria' ✅
```

**2. Guardar Favorito**
```
Usuario hace clic en corazón →
toggleFavorite(supplier) →
supplier.category = 'joyeria' ✅ (viene del backend) →
Se guarda en Firestore con category: 'joyeria' ✅
```

**3. Filtrar Favoritos por Categoría**
```
card.key = normalizado del nombre del presupuesto
  - Si viene de "Joyería" → "joyería" ⚠️ (con acento)
  - Si viene de "Joyeria" → "joyeria" ✅ (sin acento)

getCategoryIdFromKey(card.key) busca en SUPPLIER_CATEGORIES
  - Compara con cat.name.toLowerCase() → "joyería" ⚠️
  - NO encuentra match porque:
    removeAccents("joyería") = "joyeria" ✅
    removeAccents("Joyería") = "joyeria" ✅
    PERO card.key YA viene normalizado del presupuesto

fav.supplier.category = 'joyeria' ✅ (del backend)

Comparación:
  normalizedFavCategory = removeAccents('joyeria') = 'joyeria' ✅
  normalizedCategoryId = removeAccents(???) = ???
  
  SI categoryId === 'joyeria' → MATCH ✅
  SI categoryId === 'joyería' → NO MATCH ❌
```

### Problema Identificado

**El problema está en `getCategoryIdFromKey`:**

1. Recibe `card.key` que puede venir con o sin acentos del presupuesto
2. Normaliza con `removeAccents()` correctamente
3. Compara con `cat.name` normalizado y `cat.id` normalizado
4. PERO si el presupuesto guardó "Joyería" (con acento), entonces:
   - `card.key = "joyería"` (normalizado a minúsculas)
   - `removeAccents("joyería") = "joyeria"`
   - Busca categoría que coincida con "joyeria"
   - Encuentra la categoría y devuelve `id: 'joyeria'` ✅

**ENTONCES el problema NO está en getCategoryIdFromKey** ✅

**El problema está en el PRESUPUESTO:**
- Si el usuario añadió manualmente "Joyería" al presupuesto
- Se guarda con acento
- `card.label = "Joyería"`
- `card.key = normalizeServiceKey("Joyería") = "joyería"` (con acento)

### Solución

**Opción 1: Normalizar en normalizeServiceKey**
```javascript
const normalizeServiceKey = (value) => {
  if (!value) return 'otros';
  return removeAccents(String(value).trim().toLowerCase());
};
```

**Opción 2: Mejorar getCategoryIdFromKey**
Ya está bien con removeAccents ✅

**Opción 3: Normalizar en el filtrado**
Ya está bien con removeAccents ✅

## Logging Añadido

He añadido logging detallado en MyServicesSection para categorías problemáticas:
- joyeria
- musica  
- video

**Para diagnosticar:**
1. Abre la consola (F12)
2. Recarga la página
3. Busca logs `[MyServicesSection]`
4. Verifica:
   - ¿Qué card.key tiene?
   - ¿Qué categoryId se mapea?
   - ¿Qué fav.supplier.category tienen los favoritos?
   - ¿Por qué no hace match?

## Próximos Pasos

1. **Ejecutar con logs** y ver qué valores exactos hay
2. **Normalizar normalizeServiceKey** en ProveedoresNuevo.jsx
3. **Verificar presupuestos** existentes en Firestore

## Test Manual

```javascript
// En consola del navegador:
const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Test 1: normalización
console.log(removeAccents("joyería")); // "joyeria" ✅
console.log(removeAccents("Música"));  // "Musica"  ✅

// Test 2: comparación
const cat1 = removeAccents("joyería".toLowerCase()); // "joyeria"
const cat2 = removeAccents("joyeria".toLowerCase()); // "joyeria"
console.log(cat1 === cat2); // true ✅
```
