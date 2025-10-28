# 🔍 Sistema de Búsqueda Híbrida de Proveedores - Estado Actual

**Fecha de actualización:** 2025-10-28  
**Versión:** 2.0  
**Estado:** ✅ Implementado y funcionando

---

## 📋 RESUMEN EJECUTIVO

El sistema de búsqueda híbrida combina:
- **Base de datos propia (Firestore)** con proveedores registrados y en caché
- **Búsqueda por nombre** (no por categoría rígida)
- **Internet en tiempo real (Tavily)** como complemento inteligente
- **Lógica de 5 proveedores** para optimizar costes y relevancia

---

## 🎯 FUNCIONAMIENTO ACTUAL

### **Búsqueda por NOMBRE, no por categoría**

```javascript
// ✅ AHORA: Búsqueda flexible por nombre
Usuario busca: "ReSona valencia"
         ↓
Sistema busca en Firestore:
  - name LIKE "resona"
  - description LIKE "resona"
  - tags LIKE "resona"
         ↓
Encuentra: "ReSona - Fotografía Bodas"
```

**NO** se filtra por `category`. Se busca en:
- Nombre del proveedor
- Descripción del negocio
- Tags asociados

---

## 🧮 LÓGICA DE 5 PROVEEDORES (MIN_RESULTS = 5)

### **Escenario 1: ≥5 Proveedores Registrados Reales**

```
Usuario busca → Firestore encuentra 7 registrados reales
         ↓
Sistema: "Tengo suficientes registrados"
         ↓
Muestra SOLO los 7 registrados
❌ NO busca en Tavily
❌ NO muestra caché
```

**Logs esperados:**
```
✅ [FIRESTORE] 7 proveedores encontrados
   - Registrados reales: 7
🌐 [TAVILY] 7 proveedores registrados (≥5). No es necesario buscar en internet.
📊 [RESULTADO FINAL] ≥5 registrados. Mostrando solo registrados: 7
```

---

### **Escenario 2: 1-4 Proveedores Registrados Reales**

```
Usuario busca → Firestore encuentra 2 registrados reales
         ↓
Sistema: "Tengo pocos, voy a complementar"
         ↓
Busca en Tavily para completar
         ↓
Muestra: [2 registrados] + [3-4 de internet]
```

**Logs esperados:**
```
✅ [FIRESTORE] 2 proveedores encontrados
   - Registrados reales: 2
🌐 [TAVILY] Solo 2 proveedores registrados (mínimo: 5). Buscando en internet...
✅ [TAVILY] 3 proveedores encontrados en internet
📊 [RESULTADO FINAL] <5 registrados. Mostrando registrados (2) + internet (3)
```

---

### **Escenario 3: 0 Proveedores Registrados**

```
Usuario busca → Firestore NO encuentra registrados reales
         ↓
Sistema: "No tengo registrados"
         ↓
Busca en Tavily
         ↓
Muestra: [Caché de Firestore] + [Internet]
```

**Logs esperados:**
```
✅ [FIRESTORE] 0 proveedores registrados reales
🌐 [TAVILY] Solo 0 proveedores registrados (mínimo: 5). Buscando en internet...
✅ [TAVILY] 5 proveedores encontrados en internet
📊 [RESULTADO FINAL] Sin registrados. Mostrando caché (0) + internet (5)
```

---

## 🗃️ ESTRUCTURA DE DATOS EN FIRESTORE

### **Campo clave: `registered`**

```javascript
{
  id: "resona-valencia",
  name: "ReSona",
  category: "photography",  // ⚠️ Ya no se usa para filtrar búsquedas
  
  // 🔑 CAMPO CRÍTICO
  registered: true,  // o false
  // true  = Proveedor registrado oficialmente ✅
  // false = Proveedor de caché (scraping) ❌
  
  status: "active",           // active | discovered | inactive
  source: "registration",     // registration | tavily | bodas-net
  
  location: {
    city: "Valencia",
    province: "Valencia",
    country: "España"
  },
  
  contact: {
    email: "info@resona.es",
    phone: "+34123456789",
    website: "https://resona.es"
  },
  
  business: {
    description: "Fotografía profesional de bodas...",
    minBudget: 1500,
    maxBudget: 3500
  },
  
  metrics: {
    matchScore: 95,
    views: 42,
    clicks: 12,
    conversions: 2
  },
  
  tags: ["fotografia", "bodas", "valencia"],
  
  createdAt: Timestamp,
  lastUpdated: Timestamp
}
```

---

## 📡 ENDPOINT: `/api/suppliers/search`

### **Request:**

```bash
POST http://localhost:4004/api/suppliers/search
Content-Type: application/json

{
  "service": "ReSona",           # Término de búsqueda (nombre)
  "location": "España",           # Ciudad o país
  "query": "ReSona valencia",     # Query adicional (opcional)
  "budget": 2000                  # Presupuesto (opcional)
}
```

### **Response:**

```json
{
  "success": true,
  "count": 3,
  "breakdown": {
    "registered": 1,
    "cached": 0,
    "internet": 2
  },
  "source": "firestore+tavily",
  "minResults": 5,
  "showingInternetComplement": true,
  "suppliers": [
    {
      "id": "resona-valencia",
      "name": "ReSona",
      "registered": true,
      "priority": "registered",
      "badge": "Verificado ✓",
      "badgeType": "success",
      "...": "..."
    },
    {
      "name": "Contacta con Bodas.net",
      "registered": false,
      "priority": "internet",
      "badge": "Bodas.net 💒",
      "badgeType": "info",
      "source": "bodas-net",
      "...": "..."
    }
  ]
}
```

---

## 🔧 CÓDIGO IMPLEMENTADO

### **Backend: `backend/routes/suppliers-hybrid.js`**

```javascript
const MIN_RESULTS = 5;  // 🔑 Umbral de proveedores

// 1. Buscar por NOMBRE (no categoría)
let firestoreQuery = db.collection('suppliers')
  .limit(100);  // Traer más para filtrar en memoria

const snapshot = await firestoreQuery.get();

// 2. Filtrar por nombre en memoria
let results = snapshot.docs
  .map(doc => doc.data())
  .filter(supplier => {
    const searchTerm = service.toLowerCase();
    const supplierName = (supplier.name || '').toLowerCase();
    const supplierDesc = (supplier.business?.description || '').toLowerCase();
    const supplierTags = (supplier.tags || []).join(' ').toLowerCase();
    
    return supplierName.includes(searchTerm) || 
           supplierDesc.includes(searchTerm) ||
           supplierTags.includes(searchTerm);
  });

// 3. Separar registrados de caché
const trueRegistered = results.filter(r => r.registered === true);
const cachedResults = results.filter(r => r.registered !== true);

// 4. Decidir si buscar en internet
if (trueRegistered.length < MIN_RESULTS) {
  // Buscar en Tavily
  const tavilyResults = await searchTavilySimple(query, location, service);
  internetResults = tavilyResults;
}

// 5. Lógica de mezcla inteligente
let allResults;

if (trueRegistered.length >= MIN_RESULTS) {
  // Solo registrados
  allResults = [...trueRegistered];
} else if (trueRegistered.length > 0) {
  // Registrados + internet
  allResults = [...trueRegistered, ...internetResults];
} else {
  // Caché + internet
  allResults = [...cachedResults, ...internetResults];
}
```

---

## 🎨 DIFERENCIACIÓN VISUAL EN UI

### **Proveedor Registrado Real (`registered: true`)**

```
┌─────────────────────────────────────────────┐
│ ✅ ReSona                   [Verificado ✓]  │ ← Badge verde
│ ⭐⭐⭐⭐⭐ 4.8 (42 valoraciones)              │
│ Fotografía profesional de bodas             │
│ 📍 Valencia • 💰 €€€                        │
│ [💬 Contactar]  [👁️ Ver perfil]             │
└─────────────────────────────────────────────┘
```

### **Proveedor de Internet (`registered: false`)**

```
┌─────────────────────────────────────────────┐
│ 🌐 Contacta con Bodas.net  [Bodas.net 💒]  │ ← Badge azul/gris
│ Sin valoraciones                            │
│ Reserva tu proveedor de bodas con ReSona   │
│ 📍 España                                   │
│ [🌐 Ver web]  [📧 Contactar]                │
└─────────────────────────────────────────────┘
```

---

## 💾 CACHÉ DE PROVEEDORES

El sistema guarda automáticamente en Firestore los proveedores encontrados en internet:

```javascript
// Al buscar en Tavily, se guardan automáticamente con:
{
  registered: false,
  source: 'tavily' | 'bodas-net',
  status: 'discovered',
  lastSeen: Timestamp
}
```

**Ventajas:**
- Búsquedas futuras más rápidas
- Reduce llamadas a Tavily
- Construye base de datos automáticamente

---

## 📊 MÉTRICAS Y LOGS

### **Logs de debug en backend:**

```bash
📊 [FIRESTORE] Buscando proveedores por nombre...
   Término de búsqueda: "ReSona"
[DEBUG] Proveedor: ReSona, registered: true, type: boolean
[DEBUG] Proveedor: Contacta con Bodas.net, registered: false, type: boolean

✅ [FIRESTORE] 1 proveedores encontrados en base de datos
   - Registrados reales: 1
   - En caché: 0

🌐 [TAVILY] Solo 1 proveedores registrados (mínimo: 5). Buscando en internet...
✅ [TAVILY] 2 proveedores encontrados en internet

📊 [RESULTADO FINAL] <5 registrados. Mostrando registrados (1) + internet (2)

📊 [RESULTADO] Total: 3 proveedores
   🟢 Registrados reales: 1
   🟡 En caché: 0
   🌐 Internet: 2
   📡 Fuente: Registrados + Internet (<5)
```

---

## 🐛 RESOLUCIÓN DE PROBLEMAS

### **Problema 1: No aparece mi proveedor registrado**

**Causa:** Búsqueda por nombre exacto.

**Solución:** Buscar por el nombre completo o parte del nombre:
```bash
# ❌ NO funcionará si buscas por categoría
{ "service": "fotografia" }

# ✅ SÍ funcionará si buscas por nombre
{ "service": "ReSona" }
{ "service": "Alfonso" }
```

---

### **Problema 2: Aparece mock de Bodas.net aunque tengo proveedores**

**Causa:** Tienes menos de 5 proveedores registrados.

**Solución:** El sistema está funcionando correctamente. Complementa con internet porque tienes < 5 registrados.

Para evitar mocks:
1. Registra al menos 5 proveedores reales, O
2. Cambia `MIN_RESULTS = 1` en `suppliers-hybrid.js` línea 193

---

### **Problema 3: Error de índice en Firestore**

**Error:**
```
9 FAILED_PRECONDITION: The query requires an index.
Click here: https://console.firebase.google.com/...
```

**Solución:** 
1. Click en el enlace del error
2. Firebase creará el índice automáticamente
3. Espera 2-5 minutos
4. Reinicia el backend

**O mejor:** Eliminamos el filtro compuesto. La query actual NO debería requerir índices.

---

## 🚀 PRÓXIMAS MEJORAS

### **1. Búsqueda Fuzzy**
```javascript
// Actualmente: coincidencia exacta
supplierName.includes('resona')

// Futuro: similitud
fuzzyMatch('resona', 'ReSona Fotografia') // 95% match
```

### **2. Ponderación por relevancia**
```javascript
// Priorizar por:
- Coincidencia exacta en nombre (100 pts)
- Coincidencia en tags (50 pts)
- Coincidencia en descripción (25 pts)
```

### **3. Caché inteligente**
```javascript
// Actualizar automáticamente proveedores "viejos"
if (lastSeen < 30 días) {
  refreshFromInternet()
}
```

---

## 📚 ARCHIVOS RELACIONADOS

**Backend:**
- `backend/routes/suppliers-hybrid.js` - Endpoint principal
- `backend/services/tavilyService.js` - Integración con Tavily

**Frontend:**
- `src/pages/ProveedoresNuevo.jsx` - UI de búsqueda
- `src/services/suppliersService.js` - Cliente API

**Documentación:**
- `docs/proveedores/ENFOQUE-HIBRIDO.md` - Estrategia general
- `docs/proveedores/FIREBASE-SCHEMA.md` - Estructura de datos
- `docs/proveedores/API-ENDPOINTS.md` - Documentación de API

---

## ✅ ESTADO DE IMPLEMENTACIÓN

| Característica | Estado |
|---------------|--------|
| Búsqueda por nombre | ✅ Implementado |
| Lógica 5 proveedores | ✅ Implementado |
| Caché automático | ✅ Implementado |
| Filtrado en memoria | ✅ Implementado |
| Sin índices compuestos | ✅ Implementado |
| Badges visuales | ✅ Implementado |
| Logs de debug | ✅ Implementado |

---

**Sistema 100% funcional y optimizado** 🚀
