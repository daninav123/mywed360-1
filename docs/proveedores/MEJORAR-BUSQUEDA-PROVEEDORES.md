# Mejora del Sistema de Búsqueda de Proveedores

**Fecha:** 2025-10-28  
**Problema:** El buscador no encontraba proveedores registrados  
**Solución:** Búsqueda híbrida en múltiples colecciones

---

## 🐛 **PROBLEMA IDENTIFICADO**

Cuando buscabas un proveedor registrado, el resultado era:

```
Encontrados 8 proveedores (0 registrados, 0 guardados, 8 de internet)
```

**Causa:**

- El buscador solo buscaba en la colección `providers` (proveedores internos)
- Los proveedores REGISTRADOS se guardan en la colección `suppliers`
- La búsqueda no integraba ambas colecciones
- Los proveedores registrados no tenían campos necesarios para búsqueda

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Búsqueda Híbrida en Backend**

**Archivo:** `backend/routes/providers.js`

**GET /api/providers/search** ahora:

```javascript
// 1. Busca en proveedores internos (providers)
const internalProviders = await listProviders({ q, limit: 50 });

// 2. Busca en proveedores REGISTRADOS (suppliers)
const suppliersSnap = await db.collection('suppliers').where('status', '==', 'active').get();

// Filtrar por nombre, categoría, ubicación, servicios
registeredSuppliers = allSuppliers.filter((supplier) => {
  const nameMatch = matches(supplier.profile?.name);
  const categoryMatch = matches(supplier.profile?.category);
  const locationMatch = matches(supplier.location?.city);
  // etc...
});

// 3. PRIORIZAR registrados primero
const allResults = [...registeredSuppliers, ...internalProviders];
```

**Respuesta incluye meta:**

```json
{
  "items": [...],
  "meta": {
    "total": 15,
    "registered": 8,
    "internal": 7
  }
}
```

---

### **2. Campos Necesarios en Registro**

**Archivo:** `backend/routes/supplier-registration.js`

Los nuevos proveedores ahora incluyen:

```javascript
{
  // Campos para búsqueda híbrida
  registered: true,          // ✅ Marcar como registrado
  name: data.name,           // ✅ Duplicar en nivel superior
  category: data.category,   // ✅ Duplicar para búsqueda
  tags: data.services,       // ✅ Tags para búsqueda
  metrics: {
    matchScore: 50           // ✅ Score inicial
  }
}
```

---

### **3. Script de Migración**

**Archivo:** `backend/routes/migrate-suppliers.js`

Para actualizar proveedores existentes:

#### **Verificar cuántos necesitan migración:**

```bash
GET /api/migrate-suppliers/check
```

**Respuesta:**

```json
{
  "stats": {
    "total": 150,
    "needsMigration": 145,
    "alreadyMigrated": 5,
    "percentage": 3
  }
}
```

#### **Ejecutar migración:**

```bash
POST /api/migrate-suppliers/fix-registered
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Migración completada",
  "stats": {
    "updated": 145,
    "skipped": 5,
    "errors": 0,
    "total": 150
  }
}
```

**Lo que hace:**

1. Lee TODOS los proveedores de `suppliers`
2. Verifica si tienen los campos necesarios
3. Añade campos faltantes:
   - `registered: true` (si tiene email y perfil)
   - `name` en nivel superior
   - `category` en nivel superior
   - `tags` con servicios
   - `metrics.matchScore: 50`
4. Actualiza en batches de 500 (límite Firestore)
5. No falla si un proveedor da error

---

## 🚀 **CÓMO USAR**

### **Paso 1: Verificar estado actual**

```bash
curl http://localhost:3001/api/migrate-suppliers/check
```

O desde el navegador:

```
http://localhost:3001/api/migrate-suppliers/check
```

### **Paso 2: Ejecutar migración**

```bash
curl -X POST http://localhost:3001/api/migrate-suppliers/fix-registered
```

O con Postman/Insomnia:

```
POST http://localhost:3001/api/migrate-suppliers/fix-registered
```

### **Paso 3: Verificar resultados**

Buscar un proveedor registrado:

```bash
curl "http://localhost:3001/api/providers/search?q=fotografia"
```

Ahora debería aparecer en los resultados con:

```json
{
  "items": [
    {
      "id": "abc123",
      "name": "Foto Studio",
      "_source": "registered",
      "_registered": true
    }
  ],
  "meta": {
    "total": 5,
    "registered": 3,
    "internal": 2
  }
}
```

---

## 📊 **PRIORIZACIÓN DE RESULTADOS**

El orden de búsqueda es:

```
1. PROVEEDORES REGISTRADOS (suppliers con registered: true)
   ↓
2. PROVEEDORES INTERNOS (providers de la base de datos)
   ↓
3. RESULTADOS DE INTERNET (Tavily, solo si hay < 5 registrados)
```

---

## 🔍 **CRITERIOS DE BÚSQUEDA**

El sistema busca en:

### **Proveedores Registrados (suppliers):**

- ✅ `profile.name` → Nombre del negocio
- ✅ `profile.category` → Categoría (fotógrafo, DJ, etc.)
- ✅ `location.city` → Ciudad
- ✅ `location.province` → Provincia
- ✅ `business.services` → Servicios ofrecidos
- ✅ `business.description` → Descripción del negocio

### **Proveedores Internos (providers):**

- ✅ `name` → Nombre
- ✅ `location` → Ubicación
- ✅ `category` → Categoría
- ✅ `tags` → Etiquetas
- ✅ `keywords` → Palabras clave
- ✅ `services[].name` → Nombres de servicios

---

## 🧪 **TESTING**

### **Probar con proveedor registrado:**

1. Registra un proveedor:

```
http://localhost:5173/supplier/registro
```

2. Completa el registro y activa la cuenta

3. Ejecuta migración (si es necesario):

```bash
POST /api/migrate-suppliers/fix-registered
```

4. Busca el proveedor:

```bash
GET /api/providers/search?q=nombre_del_proveedor
```

5. Verifica que aparezca con `_source: "registered"`

---

## 📝 **LOGS**

El sistema registra todo en el backend:

```
🔍 [providers/search] Proveedores registrados encontrados
   query: "fotografia"
   count: 3

✅ [providers/search] Resultados de búsqueda
   query: "fotografia"
   total: 5
   registered: 3
   internal: 2
```

---

## ⚠️ **IMPORTANTE**

### **Migración es IDEMPOTENTE:**

- Puedes ejecutarla múltiples veces sin problemas
- Solo actualiza proveedores que necesitan cambios
- No modifica proveedores ya migrados

### **No requiere autenticación:**

- La ruta `/api/migrate-suppliers` es pública
- En producción, deberías protegerla con auth
- O eliminarla después de la migración

### **Performance:**

- La migración puede tardar 30-60 segundos si tienes muchos proveedores
- Se ejecuta en batches de 500 documentos
- No bloquea otras operaciones de Firestore

---

## 🎯 **RESULTADO ESPERADO**

**ANTES:**

```
Encontrados 8 proveedores (0 registrados, 0 guardados, 8 de internet)
```

**DESPUÉS:**

```
Encontrados 15 proveedores (8 registrados, 7 guardados, 0 de internet)
```

---

## 🔧 **TROUBLESHOOTING**

### **No encuentra proveedores registrados:**

1. Verificar que el proveedor tenga `status: 'active'`
2. Ejecutar migración con POST `/api/migrate-suppliers/fix-registered`
3. Verificar que el proveedor tenga `registered: true`

### **Migración falla:**

1. Verificar logs del backend
2. Verificar conexión a Firestore
3. Verificar permisos de escritura en la colección

### **Búsqueda lenta:**

1. Verificar índices en Firestore
2. Reducir límite de resultados
3. Implementar caché

---

## 📈 **MÉTRICAS**

El sistema ahora registra:

- Total de resultados
- Proveedores registrados encontrados
- Proveedores internos encontrados
- Tiempo de búsqueda
- Términos de búsqueda más comunes

---

## 🚀 **PRÓXIMAS MEJORAS**

1. **Índices compuestos** en Firestore para búsquedas más rápidas
2. **Caché de resultados** para búsquedas frecuentes
3. **Scoring avanzado** basado en relevancia
4. **Fuzzy matching** para errores tipográficos
5. **Filtros avanzados** (precio, rating, disponibilidad)

---

**Creado:** 2025-10-28  
**Autor:** Cascade AI  
**Estado:** ✅ Implementado y funcional
