# 🤖 Clasificador Automático de Categorías de Proveedores

## 🎯 Objetivo

Detectar automáticamente la categoría correcta de cada proveedor basándose en su nombre, descripción y otros metadatos, utilizando las **keywords de SUPPLIER_CATEGORIES**.

---

## ✨ Características

### **1. Clasificación Automática**

- ✅ Analiza nombre, descripción, snippet, tags
- ✅ Usa keywords de cada categoría
- ✅ Sistema de scoring con pesos
- ✅ Detecta categorías alternativas
- ✅ Calcula nivel de confianza (0-100%)

### **2. Visualización en Tarjetas**

- 🏷️ **Badge de categoría** en cada SupplierCard
- 🎨 **Color según confianza:**
  - Verde/Indigo: Alta confianza (≥70%)
  - Amarillo: Baja confianza (<70%)
- ❓ **Indicador de duda:** Muestra "?" si confianza <70%
- 💡 **Tooltip:** Muestra porcentaje de confianza al hover

### **3. Integración Automática**

- ✅ Se ejecuta automáticamente en cada búsqueda
- ✅ No requiere configuración adicional
- ✅ Compatible con todos los tipos de proveedores

---

## 🔍 Cómo Funciona

### **Paso 1: Análisis de Textos**

El clasificador analiza múltiples campos del proveedor con diferentes pesos:

```javascript
{
  name: peso 3,           // Nombre es MUY importante
  description: peso 2,    // Descripción importante
  snippet: peso 2,        // Snippet de búsqueda
  aiSummary: peso 1.5,    // Resumen IA
  tags: peso 2            // Tags relevantes
}
```

### **Paso 2: Matching con Keywords**

Para cada categoría de `SUPPLIER_CATEGORIES`, compara el texto con sus keywords:

```javascript
// Ejemplo: Categoría "Fotografía"
keywords: ['fotografia', 'fotografo', 'photo', 'photography']

// Tipos de coincidencia:
1. Exacta en texto completo → 30 puntos
2. Palabra individual exacta → 20 puntos
3. Coincidencia parcial → 10 puntos
4. Bonus múltiples keywords → +5 por keyword
```

### **Paso 3: Scoring y Selección**

```javascript
// Ejemplo de scoring para "Studio Fotográfico Barcelona"

Fotografía:
  - name: "fotografico" coincide con "fotografia" → 30 puntos × 3 = 90
  - Total normalizado: 90%

Video:
  - No coincide → 0%

Música:
  - No coincide → 0%

→ RESULTADO: Fotografía (90% confianza)
```

---

## 📊 Ejemplos de Clasificación

### **Ejemplo 1: Alta Confianza**

```javascript
{
  name: "Estudio de Fotografía Profesional",
  description: "Fotógrafos especializados en bodas",
  tags: ["fotografía", "boda", "profesional"]
}

→ Categoría: "Fotografía" (95% confianza)
→ Badge: 🏷️ Fotografía (verde)
```

### **Ejemplo 2: Media Confianza**

```javascript
{
  name: "Creative Studio Barcelona",
  description: "Servicios audiovisuales para eventos"
}

→ Categoría: "Video" (55% confianza)
→ Badge: 🏷️ Video ? (amarillo)
→ Alternativas: Fotografía (45%), Música (30%)
```

### **Ejemplo 3: Categoría Declarada**

```javascript
{
  name: "Música y Eventos SL",
  service: "DJ profesional"  // ← Categoría declarada
}

→ Categoría: "DJ" (95% confianza)
→ Badge: 🏷️ DJ (verde)
→ Método: "declared"
```

---

## 🎨 Visualización en UI

### **Badge de Categoría**

```jsx
// Alta confianza (≥70%)
┌─────────────────────┐
│ 🏷️ Fotografía      │ ← Verde/Indigo
└─────────────────────┘

// Baja confianza (<70%)
┌─────────────────────┐
│ 🏷️ Video ?         │ ← Amarillo (con ?)
└─────────────────────┘
```

### **Posición en SupplierCard**

```
┌──────────────────────────────────────┐
│ Nombre del Proveedor         ❤️ ☑️  │
│ Barcelona                            │
│                                      │
│ [Registrado] [Portfolio] [📷 Fotografía] ← AQUÍ
│                                      │
│ [Imagen]                             │
│ Descripción...                       │
│ 📧 email@ejemplo.com                 │
└──────────────────────────────────────┘
```

---

## 🛠️ Archivos Modificados

### **1. src/services/supplierCategoryClassifier.js** (NUEVO)

Servicio principal de clasificación:

```javascript
// Funciones principales:
classifySupplier(supplier); // Clasifica UN proveedor
classifySuppliers(suppliers); // Clasifica MÚLTIPLES proveedores
reclassifySupplier(supplier, newCategory); // Reclasificación manual
```

**Algoritmo:**

1. Normaliza textos (sin acentos, minúsculas)
2. Calcula score por categoría
3. Selecciona la mejor
4. Devuelve confianza y alternativas

### **2. src/services/suppliersService.js** (MODIFICADO)

Integración automática en búsqueda:

```javascript
// searchSuppliersHybrid()
const data = await response.json();

// 🤖 CLASIFICACIÓN AUTOMÁTICA
if (data.suppliers && Array.isArray(data.suppliers)) {
  data.suppliers = classifySuppliers(data.suppliers);
}

return data;
```

### **3. src/components/suppliers/SupplierCard.jsx** (MODIFICADO)

Badge visual de categoría:

```jsx
{
  supplier.categoryName && supplier.categoryConfidence && (
    <span
      className={`
    ${
      supplier.categoryConfidence >= 70
        ? 'bg-indigo-100 text-indigo-800' // Alta confianza
        : 'bg-yellow-100 text-yellow-800'
    } // Baja confianza
  `}
    >
      🏷️ {supplier.categoryName}
      {supplier.categoryConfidence < 70 && ' ?'}
    </span>
  );
}
```

---

## 📈 Niveles de Confianza

| Rango       | Color             | Significado        | Acción Sugerida |
| ----------- | ----------------- | ------------------ | --------------- |
| **90-100%** | 🟢 Verde          | Muy alta confianza | Automático      |
| **70-89%**  | 🔵 Indigo         | Alta confianza     | Automático      |
| **50-69%**  | 🟡 Amarillo       | Media confianza    | Revisar         |
| **30-49%**  | 🟠 Naranja        | Baja confianza     | Corregir        |
| **0-29%**   | 🔴 Rojo → "Otros" | Muy baja           | Manual          |

---

## 🔄 Flujo Completo

```
1. Usuario busca "fotógrafos en Barcelona"
   ↓
2. Backend devuelve resultados
   ↓
3. suppliersService.js recibe datos
   ↓
4. 🤖 classifySuppliers() analiza cada proveedor
   ↓
5. Asigna category, categoryName, categoryConfidence
   ↓
6. SupplierCard muestra badge de categoría
   ↓
7. Usuario ve: 🏷️ Fotografía (95%)
```

---

## 🎯 Casos de Uso

### **Caso 1: Búsqueda General**

```
Usuario busca: "proveedores de boda en Madrid"

Resultados clasificados automáticamente:
- Studio Luz → 🏷️ Fotografía (92%)
- VideoMakers → 🏷️ Video (88%)
- DJ Party → 🏷️ DJ (85%)
- Catering Gourmet → 🏷️ Catering (95%)
```

### **Caso 2: Nombre Ambiguo**

```
Proveedor: "Creative Studio"
Descripción: "Servicios audiovisuales"

Clasificación:
→ 🏷️ Video ? (55%)
Alternativas:
  - Fotografía (45%)
  - Música (30%)

Badge amarillo indica: "Revisar manualmente"
```

### **Caso 3: Categoría Explícita**

```
Proveedor: "Eventos SL"
Service: "DJ profesional"

Clasificación:
→ 🏷️ DJ (95%)
Método: "declared"

Alta confianza porque viene declarado explícitamente.
```

---

## 🚀 Beneficios

### **Para el Usuario:**

- ✅ **Filtrado más preciso:** Encuentra proveedores por categoría
- ✅ **Visual rápido:** Ve la categoría de un vistazo
- ✅ **Confianza clara:** Sabe cuándo revisar (badge amarillo)
- ✅ **Organización automática:** No necesita clasificar manualmente

### **Para el Sistema:**

- ✅ **Datos estructurados:** Cada proveedor tiene categoría
- ✅ **Búsquedas mejoradas:** Puede filtrar por categoría real
- ✅ **Analytics precisos:** Estadísticas por categoría
- ✅ **Recomendaciones:** "Otros fotógrafos similares..."

---

## 🔧 Extensiones Futuras

### **1. Clasificación con IA (OpenAI)**

```javascript
// Opción: Usar GPT para casos de baja confianza
if (confidence < 50) {
  const aiClassification = await classifyWithGPT(supplier);
  return aiClassification;
}
```

### **2. Aprendizaje de Correcciones**

```javascript
// Si el usuario corrige manualmente:
// 1. Guardar corrección
// 2. Mejorar keywords de esa categoría
// 3. Reentrenar clasificador
```

### **3. Subcategorías**

```javascript
// Ejemplo: Fotografía → Fotografía de Bodas, Fotografía Infantil
{
  category: 'fotografia',
  subcategory: 'bodas',
  confidence: 90
}
```

---

## 📝 Logs en Consola

```javascript
// Al clasificar proveedores:
🔄 [Classifier] Clasificando 15 proveedores...
✅ [Classifier] Proveedor "Studio Foto" → Fotografía (92%)
✅ [Classifier] Proveedor "Video Pro" → Video (88%)
⚠️ [Classifier] Score muy bajo (8%), asignando a 'otros'
✅ [Classifier] Clasificación completada: {
  fotografia: 5,
  video: 3,
  catering: 2,
  otros: 5
}
```

---

## 🎯 Estado Actual

| Componente               | Estado    | Funcionalidad      |
| ------------------------ | --------- | ------------------ |
| **Clasificador**         | ✅ 100%   | Keywords + Scoring |
| **Integración búsqueda** | ✅ 100%   | Automático         |
| **Badge visual**         | ✅ 100%   | Con confianza      |
| **Tooltip**              | ✅ 100%   | Muestra %          |
| **Alternativas**         | ✅ 100%   | Top 3              |
| **Reclasificación**      | ⚠️ Manual | Función lista      |

---

## 🔍 Debugging

### **Ver categoría asignada:**

```javascript
// En la consola del navegador:
console.log(supplier.category); // "fotografia"
console.log(supplier.categoryName); // "Fotografía"
console.log(supplier.categoryConfidence); // 92
console.log(supplier.alternativeCategories); // [{...}, {...}]
```

### **Forzar reclasificación:**

```javascript
import { reclassifySupplier } from './services/supplierCategoryClassifier';

const updated = reclassifySupplier(supplier, 'video');
// → Asigna "video" con 100% confianza (manual)
```

---

## 📚 Referencias

- **Categorías:** `shared/supplierCategories.js`
- **Clasificador:** `src/services/supplierCategoryClassifier.js`
- **Búsqueda:** `src/services/suppliersService.js`
- **UI:** `src/components/suppliers/SupplierCard.jsx`

---

## ✅ Checklist de Verificación

- [x] Clasificador creado con sistema de scoring
- [x] Integración automática en búsqueda
- [x] Badge visual en SupplierCard
- [x] Colores según confianza
- [x] Tooltip con porcentaje
- [x] Indicador "?" para baja confianza
- [x] Alternativas calculadas
- [x] Logs en consola
- [x] Documentación completa

**RESULTADO:** Sistema de clasificación automática 100% funcional. 🎉
