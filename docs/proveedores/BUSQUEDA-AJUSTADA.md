# ✅ Búsqueda Inteligente - Lógica de 5 Proveedores

**Fecha:** 2025-10-28  
**Estado:** ✅ Implementado  
**Cambio:** Sistema inteligente que busca en internet según cantidad de proveedores registrados

---

## 🔧 **EVOLUCIÓN DEL SISTEMA:**

### **VERSIÓN 1:**
```javascript
if (registeredResults.length < 10) {
  // Buscar en internet si hay menos de 10
}
```

### **VERSIÓN 2:**
```javascript
if (registeredResults.length === 0) {
  // Buscar en internet SOLO si NO hay ningún resultado
}
```

### **VERSIÓN 3 (ACTUAL):**
```javascript
const MIN_RESULTS = 5;

if (trueRegistered.length < MIN_RESULTS) {
  // Buscar en internet si hay menos de 5 REGISTRADOS REALES
  // Distingue entre registered=true y registered=false
}
```

---

## 📊 **Flujo actual (con búsqueda por NOMBRE):**

```
Usuario busca "ReSona valencia"
         ↓
  1. Buscar en FIRESTORE POR NOMBRE
     - NO filtrar por category (campo ignorado)
     - Buscar coincidencias en: name, description, tags
     - Traer hasta 100 documentos
         ↓
  2. Filtrar en MEMORIA
     - searchTerm = "resona" (lowercase)
     - Match: supplierName.includes(searchTerm)
     - Match: supplierDesc.includes(searchTerm)
     - Match: supplierTags.includes(searchTerm)
         ↓
  3. Separar REGISTRADOS de CACHÉ
     - registered === true  → trueRegistered[]
     - registered === false → cachedResults[]
         ↓
  4. ¿Cuántos registrados REALES?
     
     ≥ 5 registrados → SOLO MOSTRAR REGISTRADOS ✅
                       NO buscar en Tavily
     
     1-4 registrados → REGISTRADOS + TAVILY 🌐
                       Complementar con internet
     
     = 0 registrados → CACHÉ + TAVILY 🌐
                       Mostrar todo disponible
         ↓
  5. Si buscó en Tavily:
     - Filtrar duplicados (por email/URL)
     - Separar bodas.net de otros
     - Combinar resultados
         ↓
  6. Devolver al usuario
     Orden: [Registrados] → [Internet]
```

---

## 🎯 **Mejoras adicionales:**

### **1. Query de Tavily mejorada:**
```javascript
// ANTES:
`${query} ${location} ${service} contacto`

// AHORA:
`${service} bodas ${location} ${query} profesional contacto -"buscar" -"listado"`
```

**Beneficio:** Busca explícitamente "fotografia bodas Valencia" en lugar de solo "fotografia Valencia"

---

### **2. Orden de prioridad claro:**
```
1º → Proveedores REGISTRADOS (verified)
2º → Proveedores EN CACHÉ (discovered)
3º → Internet (SOLO si BD vacía)
```

---

## 🧪 **Cómo verificar:**

### **Caso 1: HAY proveedores en BD**
```bash
curl -X POST http://localhost:3001/api/suppliers/search \
  -H "Content-Type: application/json" \
  -d '{
    "service": "fotografia",
    "location": "Valencia"
  }'
```

**Logs esperados:**
```
🔍 [HYBRID-SEARCH] fotografia en Valencia
📊 [FIRESTORE] Buscando proveedores registrados...
✅ [FIRESTORE] 5 proveedores encontrados
   - Registrados: 1
   - En caché: 4

✅ [FIRESTORE] 5 resultados en BD. No es necesario buscar en internet.

📊 [RESULTADO] Total: 5 proveedores
   🟢 Registrados: 1
   🔵 En caché: 4
   🌐 Internet: 0
```

**Resultado:** Solo devuelve los de BD, NO busca en Tavily ✅

---

### **Caso 2: NO HAY proveedores en BD**
```bash
curl -X POST http://localhost:3001/api/suppliers/search \
  -H "Content-Type: application/json" \
  -d '{
    "service": "helicoptero",
    "location": "Cuenca"
  }'
```

**Logs esperados:**
```
🔍 [HYBRID-SEARCH] helicoptero en Cuenca
📊 [FIRESTORE] Buscando proveedores registrados...
✅ [FIRESTORE] 0 proveedores encontrados
   - Registrados: 0
   - En caché: 0

🌐 [TAVILY] No hay resultados en BD. Buscando en internet...
✅ [TAVILY] 3 proveedores encontrados en internet
🔄 [TAVILY] 3 proveedores nuevos (no duplicados)

📊 [RESULTADO] Total: 3 proveedores
   🟢 Registrados: 0
   🔵 En caché: 0
   🌐 Internet: 3
```

**Resultado:** Busca en Tavily porque BD está vacía ✅

---

## ⚠️ **Si no aparecen resultados:**

### **Posibles causas:**

#### **1. Error de índice en Firestore**
```
Error: The query requires an index.
Click here: https://console.firebase.google.com/...
```

**Solución:** Click en el link y Firebase creará el índice automáticamente.

---

#### **2. Categoría no coincide**
Si buscas "fotografia" pero en BD está guardado como "fotógrafo" o "fotografía":

**Solución temporal:**
```javascript
// En suppliers-hybrid.js, línea ~85
.where('category', '==', service)

// Cambiar a búsqueda flexible:
.where('category', 'in', [service, service + 's', service + 'o', service + 'a'])
```

O mejor: **Normalizar todas las categorías en BD a un formato estándar.**

---

#### **3. Ciudad no coincide**
Si buscas "Valencia" pero en BD está "valencia" (minúscula):

**Solución:** Normalizar en la búsqueda:
```javascript
// En suppliers-hybrid.js, línea ~90
if (location && location !== 'España') {
  const locationNormalized = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
  firestoreQuery = firestoreQuery.where('location.city', '==', locationNormalized);
}
```

---

#### **4. No hay proveedores de ese servicio en esa ciudad**
Normal si acabas de implementar el sistema.

**Solución:** Hacer algunas búsquedas con el endpoint viejo para que se cacheen:
```bash
# Hacer búsquedas con Tavily (Fase 1) para poblar cache
curl -X POST http://localhost:3001/api/ai-suppliers-tavily \
  -d '{"service":"fotografia","location":"Valencia","query":"fotógrafo bodas"}'
```

Esto guardará proveedores en Firestore (Fase 1 - cache silencioso).

---

## 🔍 **Debug: Ver qué hay en Firestore**

### **Opción 1: Firebase Console**
1. https://console.firebase.google.com
2. Firestore Database
3. Collection: `suppliers`
4. Verificar:
   - ¿Hay documentos?
   - ¿category = "fotografia"?
   - ¿location.city = "Valencia"?
   - ¿status = "active" o "discovered"?

### **Opción 2: Query manual en backend**
```javascript
// Agregar temporalmente en suppliers-hybrid.js
const allSuppliers = await db.collection('suppliers').get();
console.log(`📊 Total proveedores en BD: ${allSuppliers.size}`);

const byCategory = {};
allSuppliers.docs.forEach(doc => {
  const cat = doc.data().category;
  byCategory[cat] = (byCategory[cat] || 0) + 1;
});
console.log('📊 Por categoría:', byCategory);
```

---

## ✅ **Resumen de cambios:**

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Umbral Tavily** | < 10 resultados | = 0 resultados |
| **Query Tavily** | Genérica | Específica para bodas |
| **Prioridad** | Registrados > Cache > Internet | Registrados > Cache > Internet |
| **Comportamiento** | Siempre complementa con Tavily | Solo usa Tavily si BD vacía |

---

## 🚀 **Beneficios:**

1. ✅ **Menos llamadas a Tavily** → Ahorro de costes
2. ✅ **Más rápido** → No espera respuesta de Tavily si hay resultados
3. ✅ **Más relevante** → Muestra primero lo que tienes en BD
4. ✅ **Construcción gradual** → A medida que se llena la BD, menos dependencia de internet

---

## 📚 **Documentación relacionada:**

- [Fase 2 Implementada](./FASE-2-IMPLEMENTADA.md) - Guía completa
- [Enfoque Híbrido](./ENFOQUE-HIBRIDO.md) - Estrategia general
- [Instrucciones Índices](./INSTRUCCIONES-INDICES-FIRESTORE.md) - Crear índices

---

## ⚡ **Próximo paso:**

**Reiniciar backend y probar:**
```bash
cd backend
npm run dev
```

Luego buscar "fotógrafo bodas Valencia" desde el frontend y verificar logs.
