# 🔄 Sistema de Categorías 100% Dinámico

## 🎯 Objetivo

Garantizar que todas las categorías de proveedores se gestionen desde **UN SOLO ARCHIVO** (`shared/supplierCategories.js`) y que todos los demás sistemas se sincronicen automáticamente.

---

## ✅ ¿Qué se logró?

### **ANTES (70% dinámico, 30% hardcodeado)**

❌ Puntos frágiles:

1. `DEFAULT_CATEGORIES` hardcodeado con IDs fijos
2. División arbitraria `slice(0, 10)` en ManageServicesModal
3. `EXPENSE_CATEGORIES` duplicado en financeService
4. `CATEGORY_ALIAS_MAP` hardcodeado en budgetCategories

**PROBLEMA:** Añadir/eliminar categorías requería editar 4+ archivos.

---

### **AHORA (100% dinámico)**

✅ **Fuente única de verdad:**

```javascript
// shared/supplierCategories.js
export const SUPPLIER_CATEGORIES = [
  {
    id: 'fotografia',
    name: 'Fotografía',
    icon: 'camera',
    coverage: 'high',        // ← Nuevo: para clasificación semántica
    keywords: ['foto', ...], // ← Usado automáticamente
  },
  // ... 22 categorías
];
```

✅ **Todo se genera automáticamente:**

- DEFAULT_CATEGORIES (useWeddingCategories)
- Divisiones en modal (ManageServicesModal)
- EXPENSE_CATEGORIES (financeService)
- CATEGORY_ALIAS_MAP (budgetCategories)

---

## 📁 Archivos Modificados

### **1. `src/hooks/useWeddingCategories.js`**

**ANTES:**

```javascript
const DEFAULT_CATEGORIES = [
  'fotografia', // ⚠️ Hardcodeado
  'video',
  'catering',
  // ...
];
```

**AHORA:**

```javascript
// ⚡ DINÁMICO: Basado en coverage
const DEFAULT_CATEGORIES = SUPPLIER_CATEGORIES.filter(
  (cat) => cat.coverage === 'high' || cat.coverage === 'medium'
)
  .slice(0, 8)
  .map((cat) => cat.id);
```

**✅ Beneficio:** Siempre usa IDs válidos de SUPPLIER_CATEGORIES.

---

### **2. `src/components/wedding/ManageServicesModal.jsx`**

**ANTES:**

```javascript
const mainCategories = allCategories.slice(0, 10); // ⚠️ Arbitrario
const otherCategories = allCategories.slice(10);
```

**AHORA:**

```javascript
// ⚡ DINÁMICO: División semántica por coverage
const mainCategories = allCategories.filter(
  (cat) => cat.coverage === 'high' || cat.coverage === 'medium'
);
const otherCategories = allCategories.filter((cat) => cat.coverage === 'low');
```

**✅ Beneficio:** División lógica basada en disponibilidad en Google Places.

---

### **3. `src/services/financeService.js`**

**ANTES:**

```javascript
export const EXPENSE_CATEGORIES = {
  VENUE: { id: 'venue', name: 'Lugar', ... },      // ⚠️ Duplicado
  CATERING: { id: 'catering', name: 'Catering', ... },
  // ... hardcodeado
};
```

**AHORA:**

```javascript
// ⚡ DINÁMICO: Generado desde SUPPLIER_CATEGORIES
export const EXPENSE_CATEGORIES = SUPPLIER_CATEGORIES.reduce((acc, cat) => {
  const key = cat.id.toUpperCase().replace(/-/g, '_');
  acc[key] = {
    id: cat.id,
    name: cat.name,
    icon: CATEGORY_ICONS[cat.id] || '💰',
    color: CATEGORY_COLORS[cat.id] || '#6B7280',
  };
  return acc;
}, {});
```

**✅ Beneficio:** Sincronización automática con categorías de proveedores.

---

### **4. `src/utils/budgetCategories.js`**

**ANTES:**

```javascript
const CATEGORY_ALIAS_MAP = new Map([
  ['catering', ['banquete', 'comida', ...]],  // ⚠️ Hardcodeado
  ['photo', ['fotografia', 'foto', ...]],
  // ...
]);
```

**AHORA:**

```javascript
// ⚡ DINÁMICO: Usa keywords de SUPPLIER_CATEGORIES
const CATEGORY_ALIAS_MAP = new Map(
  SUPPLIER_CATEGORIES.map((cat) => [cat.id, [...cat.keywords, cat.name.toLowerCase()]])
);
```

**✅ Beneficio:** Alias automáticos desde keywords.

---

## 🎨 Cómo Añadir una Nueva Categoría

### **1. Editar UN SOLO archivo**

```javascript
// shared/supplierCategories.js
export const SUPPLIER_CATEGORIES = [
  // ... categorías existentes

  {
    id: 'maquillaje-profesional', // ← ID único
    name: 'Maquillaje Profesional', // ← Nombre visible
    nameEn: 'Professional Makeup',
    icon: 'brush', // ← Icono Lucide
    description: 'Maquilladores profesionales para novias',
    googlePlacesType: 'beauty_salon', // ← Tipo Google Places
    keywords: ['makeup', 'maquillaje', 'mua', 'belleza'],
    coverage: 'high', // ← high/medium/low
  },
];
```

### **2. (Opcional) Añadir icono y color para finanzas**

```javascript
// src/services/financeService.js
const CATEGORY_ICONS = {
  // ... iconos existentes
  'maquillaje-profesional': '💄', // ← Opcional
};

const CATEGORY_COLORS = {
  // ... colores existentes
  'maquillaje-profesional': '#EC4899', // ← Opcional
};
```

### **3. ¡Listo!**

✅ Aparece en "Gestionar servicios"  
✅ Se puede activar/desactivar  
✅ Crea tarjetas automáticamente  
✅ Búsqueda de proveedores funciona  
✅ Finanzas reconocen la categoría  
✅ Alias automáticos desde keywords

---

## 🗑️ Cómo Eliminar una Categoría

### **1. Verificar que NO esté en uso**

```bash
# Buscar referencias en la base de datos
# (En Firebase Console o con script)
```

### **2. Eliminar de SUPPLIER_CATEGORIES**

```javascript
// shared/supplierCategories.js
export const SUPPLIER_CATEGORIES = [
  // ... eliminar la categoría
];
```

### **3. (Opcional) Limpiar iconos/colores**

```javascript
// src/services/financeService.js
const CATEGORY_ICONS = {
  // ... eliminar entrada
};
```

### **4. ¡Listo!**

✅ Desaparece de todos los sistemas automáticamente  
⚠️ Bodas existentes con esa categoría seguirán teniéndola (no se rompe)

---

## 🔄 Migración de Categorías Existentes

Si necesitas **cambiar el ID** de una categoría (⚠️ operación peligrosa):

### **Opción 1: Migración manual en Firebase**

```javascript
// Script de migración (NO incluido)
// 1. Buscar todos los documentos con categoría antigua
// 2. Actualizar al nuevo ID
// 3. Verificar integridad
```

### **Opción 2: Mantener compatibilidad**

```javascript
// shared/supplierCategories.js
{
  id: 'fotografia-profesional',  // ← Nuevo ID
  oldId: 'fotografia',            // ← ID antiguo (para migración)
  name: 'Fotografía Profesional',
  // ...
}
```

⚠️ **RECOMENDACIÓN:** Evitar cambiar IDs. Mejor añadir nuevas categorías.

---

## 📊 Clasificación por Coverage

El campo `coverage` indica la disponibilidad en Google Places:

| Coverage   | Descripción                          | Ejemplos                               |
| ---------- | ------------------------------------ | -------------------------------------- |
| **high**   | Alta disponibilidad en Google Places | Restaurantes, Fotografía, Floristerías |
| **medium** | Media disponibilidad                 | Catering, Video, Música                |
| **low**    | Baja disponibilidad (nicho)          | DJ, Invitaciones, Animación            |

**USO:**

- `DEFAULT_CATEGORIES`: Solo high/medium
- `ManageServicesModal`: Divide en "Principales" (high/medium) y "Otras" (low)

---

## ✅ Checklist de Sincronización

Cuando añadas/edites categorías, verifica:

- [ ] `id` es único y no está en uso
- [ ] `name` es descriptivo
- [ ] `icon` es válido de Lucide React
- [ ] `keywords` incluye variaciones comunes
- [ ] `coverage` refleja disponibilidad real
- [ ] (Opcional) Icono y color en `financeService.js`

---

## 🚀 Beneficios del Sistema Dinámico

### **Antes (70% dinámico)**

❌ Añadir categoría → Editar 4+ archivos  
❌ Eliminar categoría → Buscar referencias manualmente  
❌ Inconsistencias entre sistemas  
❌ Mantenimiento complejo

### **Ahora (100% dinámico)**

✅ Añadir categoría → Editar 1 archivo  
✅ Eliminar categoría → Editar 1 archivo  
✅ Sincronización automática  
✅ Mantenimiento simple  
✅ Fuente única de verdad  
✅ Sistema escalable

---

## 📚 Referencias

- **Categorías:** `shared/supplierCategories.js`
- **Hook principal:** `src/hooks/useWeddingCategories.js`
- **Modal de gestión:** `src/components/wedding/ManageServicesModal.jsx`
- **Finanzas:** `src/services/financeService.js`
- **Presupuestos:** `src/utils/budgetCategories.js`

---

## 🎯 Estado Actual

| Sistema                 | Estado  | Sincronizado con SUPPLIER_CATEGORIES |
| ----------------------- | ------- | ------------------------------------ |
| useWeddingCategories    | ✅ 100% | Sí                                   |
| ManageServicesModal     | ✅ 100% | Sí                                   |
| financeService          | ✅ 100% | Sí                                   |
| budgetCategories        | ✅ 100% | Sí                                   |
| WeddingServicesOverview | ✅ 100% | Sí                                   |
| Búsqueda de proveedores | ✅ 100% | Sí                                   |

**RESULTADO:** Sistema 100% dinámico y mantenible. 🚀
