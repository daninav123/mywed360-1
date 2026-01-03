# 📊 Índices Necesarios en Firestore

**Importante:** Debes crear estos índices antes de usar el sistema híbrido (Fase 2)

---

## 🔗 Acceso directo

**Firebase Console → Firestore → Indexes**  
https://console.firebase.google.com/project/_/firestore/indexes

---

## 📋 ÍNDICES REQUERIDOS

### **Índice 1: Búsqueda por categoría y ubicación**

```
Collection: suppliers
Fields:
  - status (Ascending)
  - category (Ascending)
  - location.city (Ascending)
  - metrics.matchScore (Descending)

Query scope: Collection
```

**Para qué sirve:**  
Buscar proveedores registrados por servicio y ciudad, ordenados por relevancia.

---

### **Índice 2: Top proveedores por conversiones**

```
Collection: suppliers
Fields:
  - status (Ascending)
  - metrics.conversions (Descending)

Query scope: Collection
```

**Para qué sirve:**  
Dashboard admin - mostrar proveedores más contactados.

---

### **Índice 3: Proveedores por registered status**

```
Collection: suppliers
Fields:
  - registered (Ascending)
  - category (Ascending)
  - location.city (Ascending)
  - metrics.matchScore (Descending)

Query scope: Collection
```

**Para qué sirve:**  
Buscar solo proveedores registrados (Fase 2).

---

### **Índice 4: Limpieza de inactivos**

```
Collection: suppliers
Fields:
  - status (Ascending)
  - lastSeen (Ascending)

Query scope: Collection
```

**Para qué sirve:**  
Cron job - eliminar proveedores que no se han visto en X meses.

---

## ⚠️ NOTA IMPORTANTE

**POR AHORA (Fase 1):** No necesitas crear los índices todavía.

El cache silencioso **solo ESCRIBE** en Firestore, no hace búsquedas.

**CUÁNDO CREAR LOS ÍNDICES:**  
Cuando implementes la Fase 2 (Búsqueda Híbrida) y empieces a LEER de Firestore.

Si intentas hacer una query sin índice, Firebase te dará un error con un **link directo** para crear el índice automáticamente.

---

## 🔧 CREAR ÍNDICES AUTOMÁTICAMENTE

**Opción 1:** Esperar al error y usar el link

Cuando implementes Fase 2 y hagas la primera búsqueda, Firebase te mostrará:

```
Error: The query requires an index. 
Click here to create it: https://console.firebase.google.com/...
```

Haz clic y Firebase creará el índice automáticamente.

---

**Opción 2:** Crearlos manualmente ahora

1. Ve a Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Copia la configuración de arriba
4. Click "Create"

---

## ✅ VERIFICAR ÍNDICES

En Firebase Console → Firestore → Indexes, deberías ver:

| Collection | Fields | Status |
|-----------|---------|--------|
| suppliers | status, category, location.city, metrics.matchScore | Building... → Enabled |
| suppliers | status, metrics.conversions | Building... → Enabled |
| suppliers | registered, category, location.city, metrics.matchScore | Building... → Enabled |
| suppliers | status, lastSeen | Building... → Enabled |

**Tiempo de creación:** ~5 minutos si la colección está vacía, ~1 hora si tiene muchos documentos.

---

## 🚀 SIGUIENTE PASO

Una vez que tengas proveedores cacheados (Fase 1 funcionando):

1. Espera 1-2 semanas para acumular cache
2. Implementa Fase 2 (Búsqueda Híbrida)
3. Crea los índices cuando Firebase te lo pida

**¡La Fase 1 NO requiere índices!** Solo guarda datos. 🎉
