# 📚 Documentación del Sistema de Proveedores

**Actualizado:** 2025-10-28  
**Estado:** ✅ Sistema implementado y funcionando

---

## 🎯 INICIO RÁPIDO

Si eres nuevo en el sistema de proveedores, empieza por aquí:

1. **[BUSQUEDA-HIBRIDA-ACTUAL.md](./BUSQUEDA-HIBRIDA-ACTUAL.md)** ⭐
   - Estado actual completo del sistema
   - Lógica de 5 proveedores
   - Búsqueda por nombre
   - Ejemplos y troubleshooting

2. **[ENFOQUE-HIBRIDO.md](./ENFOQUE-HIBRIDO.md)**
   - Estrategia general del sistema
   - Evolución planificada
   - Flujo de búsqueda detallado

3. **[FIREBASE-SCHEMA.md](./FIREBASE-SCHEMA.md)**
   - Estructura de datos en Firestore
   - Campos importantes (`registered`, `status`, etc.)

---

## 📖 DOCUMENTACIÓN POR TEMA

### **Búsqueda y Lógica de Negocio**

- **[BUSQUEDA-HIBRIDA-ACTUAL.md](./BUSQUEDA-HIBRIDA-ACTUAL.md)** - Estado actual completo ⭐
- **[BUSQUEDA-AJUSTADA.md](./BUSQUEDA-AJUSTADA.md)** - Evolución de la lógica de búsqueda
- **[ENFOQUE-HIBRIDO.md](./ENFOQUE-HIBRIDO.md)** - Estrategia híbrida BD + Internet

### **API y Endpoints**

- **[API-ENDPOINTS.md](./API-ENDPOINTS.md)** - Documentación completa de endpoints
- **[RUTAS-PROVEEDORES.md](./RUTAS-PROVEEDORES.md)** - Rutas del backend

### **Base de Datos**

- **[FIREBASE-SCHEMA.md](./FIREBASE-SCHEMA.md)** - Esquema de Firestore
- **[INSTRUCCIONES-INDICES-FIRESTORE.md](./INSTRUCCIONES-INDICES-FIRESTORE.md)** - Crear índices

### **Implementación y Plan**

- **[FASE-2-IMPLEMENTADA.md](./FASE-2-IMPLEMENTADA.md)** - Fase 2 completada
- **[PLAN-IMPLEMENTACION.md](./PLAN-IMPLEMENTACION.md)** - Plan general de implementación

### **Features Adicionales**

- **[CLAIM-SYSTEM.md](./CLAIM-SYSTEM.md)** - Sistema de reclamación de perfiles
- **[FASE-3-PANEL-PROVEEDOR.md](./FASE-3-PANEL-PROVEEDOR.md)** - Panel para proveedores
- **[CRON-JOBS.md](./CRON-JOBS.md)** - Tareas programadas

---

## 🔑 CONCEPTOS CLAVE

### **Campo `registered`**

El campo más importante del sistema:

```javascript
{
  registered: true,   // ✅ Proveedor registrado oficialmente
  registered: false,  // ❌ Proveedor de caché (scraping/internet)
}
```

**Impacto:**
- ✅ `true`: Aparece primero, badge "Verificado", perfil completo
- ❌ `false`: Aparece después, badge "Internet", info limitada

### **Lógica de 5 Proveedores (MIN_RESULTS = 5)**

```javascript
const MIN_RESULTS = 5;

if (trueRegistered.length >= 5) {
  // Solo mostrar registrados, NO buscar en internet
} else if (trueRegistered.length > 0) {
  // Mostrar registrados + buscar en internet para complementar
} else {
  // Mostrar caché + buscar en internet
}
```

### **Búsqueda por Nombre**

El sistema **NO filtra por categoría rígida**. Busca coincidencias en:
- `name` - Nombre del proveedor
- `business.description` - Descripción
- `tags[]` - Etiquetas

```javascript
// ✅ Funcionará:
{ "service": "ReSona" }
{ "service": "Alfonso" }
{ "service": "fotograf" }

// ❌ NO filtrará por esto:
{ "service": "photography" }  // category ya no se usa para filtrar
```

---

## 🚀 CONFIGURACIÓN INICIAL

### **1. Variables de entorno (backend/.env)**

```bash
# Tavily API (búsqueda en internet)
TAVILY_API_KEY=tvly-xxx...

# Firebase Admin
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### **2. Iniciar el backend**

```bash
cd backend
npm install
npm run dev
```

**Puerto:** `http://localhost:4004`

### **3. Endpoint de búsqueda**

```bash
POST http://localhost:4004/api/suppliers/search
Content-Type: application/json

{
  "service": "ReSona",
  "location": "España",
  "query": "fotografía bodas valencia"
}
```

---

## 📊 MÉTRICAS DEL SISTEMA

### **Logs de Debug**

El backend muestra logs detallados:

```bash
📊 [FIRESTORE] Buscando proveedores por nombre...
   Término de búsqueda: "ReSona"
[DEBUG] Proveedor: ReSona, registered: true, type: boolean
[DEBUG] Proveedor: Otro, registered: false, type: boolean

✅ [FIRESTORE] 1 proveedores encontrados
   - Registrados reales: 1
   - En caché: 0

🌐 [TAVILY] Solo 1 proveedores registrados (mínimo: 5). Buscando en internet...
✅ [TAVILY] 3 proveedores encontrados

📊 [RESULTADO] Total: 4 proveedores
   🟢 Registrados reales: 1
   🟡 En caché: 0
   🌐 Internet: 3
   📡 Fuente: Registrados + Internet (<5)
```

---

## 🐛 TROUBLESHOOTING COMÚN

### **1. No aparece mi proveedor registrado**

**Causa:** Búsqueda por nombre exacto.

**Solución:** 
```javascript
// En lugar de buscar por categoría:
{ "service": "fotografia" }

// Busca por el nombre:
{ "service": "ReSona" }
{ "service": "Alfonso Calza" }
```

---

### **2. Aparecen mocks aunque tengo proveedores**

**Causa:** Tienes < 5 proveedores registrados reales.

**Solución:** 
- Normal, el sistema complementa con internet
- Para evitarlo: Registra al menos 5 proveedores reales
- O cambia `MIN_RESULTS` en `suppliers-hybrid.js` línea 193

---

### **3. Error de índice en Firestore**

```
9 FAILED_PRECONDITION: The query requires an index
```

**Solución:**
1. Click en el enlace del error
2. Firebase creará el índice automáticamente
3. Espera 2-5 minutos
4. Reinicia el backend

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
backend/
├── routes/
│   └── suppliers-hybrid.js      # ⭐ Endpoint principal de búsqueda
├── services/
│   └── tavilyService.js         # Integración con Tavily
└── index.js                     # Servidor principal

frontend/
├── src/
│   ├── pages/
│   │   └── ProveedoresNuevo.jsx # UI de búsqueda
│   └── services/
│       └── suppliersService.js  # Cliente API

docs/
└── proveedores/
    ├── README.md                # ⭐ Este archivo
    ├── BUSQUEDA-HIBRIDA-ACTUAL.md  # ⭐ Estado actual
    ├── ENFOQUE-HIBRIDO.md
    ├── API-ENDPOINTS.md
    └── ...
```

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario escribe "ReSona" en buscador                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Frontend → POST /api/suppliers/search               │
│    Body: { service: "ReSona", location: "España" }     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Backend busca en Firestore                          │
│    - Trae 100 docs                                      │
│    - Filtra por nombre en memoria                       │
│    - Encuentra: 1 con registered=true                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Backend verifica: 1 < 5 (MIN_RESULTS)               │
│    Decisión: Buscar en Tavily para complementar        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Backend → Tavily API                                 │
│    Busca: "ReSona bodas españa"                         │
│    Encuentra: 3 proveedores de internet                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Backend mezcla resultados                            │
│    [1 Registrado] + [3 Internet] = 4 total              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Response al Frontend                                 │
│    { success: true, count: 4, suppliers: [...] }        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Frontend renderiza:                                  │
│    ┌──────────────────────────────┐                     │
│    │ ✅ ReSona  [Verificado ✓]   │ ← Primero           │
│    ├──────────────────────────────┤                     │
│    │ 🌐 Bodas.net [Internet]      │                     │
│    │ 🌐 Otro 1    [Internet]      │                     │
│    │ 🌐 Otro 2    [Internet]      │                     │
│    └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

1. **Implementar búsqueda fuzzy** - Similitud de nombres (Levenshtein)
2. **Ponderación por relevancia** - Score basado en múltiples factores
3. **Caché inteligente** - Actualizar proveedores antiguos automáticamente
4. **Panel de administración** - Gestionar proveedores registrados
5. **Analytics** - Métricas de búsquedas y clics

---

## 📞 CONTACTO Y SOPORTE

Para preguntas sobre el sistema:

1. Revisa la documentación en esta carpeta
2. Busca en los logs del backend
3. Verifica la base de datos en Firebase Console
4. Revisa el código en `backend/routes/suppliers-hybrid.js`

---

**Sistema de Proveedores v2.0 - Documentación completa** ✅
