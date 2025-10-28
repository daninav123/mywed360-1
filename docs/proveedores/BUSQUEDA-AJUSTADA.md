# ✅ Búsqueda Ajustada - Solo Internet si BD vacía

**Fecha:** 2025-01-28  
**Cambio:** Buscar en internet SOLO si NO hay resultados en BD

---

## 🔧 **Cambio realizado:**

### **ANTES:**
```javascript
if (registeredResults.length < 10) {
  // Buscar en internet si hay menos de 10
}
```

### **AHORA:**
```javascript
if (registeredResults.length === 0) {
  // Buscar en internet SOLO si NO hay ningún resultado
}
```

---

## 📊 **Nuevo flujo:**

```
Usuario busca "fotógrafo bodas Valencia"
         ↓
  1. Buscar en FIRESTORE
     - Filtrar por service="fotografia"
     - Filtrar por location="Valencia"
     - Aplicar filtros de presupuesto, rating, etc.
         ↓
  2. ¿Cuántos resultados?
     
     > 0 resultados → DEVOLVER SOLO BD ✅
     
     = 0 resultados → BUSCAR EN TAVILY 🌐
         ↓
  3. Si buscó en Tavily:
     - Filtrar duplicados
     - Combinar resultados
         ↓
  4. Devolver al usuario
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
