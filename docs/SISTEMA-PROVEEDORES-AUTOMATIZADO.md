# 🤖 Sistema de Proveedores Automatizado con Firebase

**Última actualización:** 2025-01-28  
**Estado:** Diseñado (Pendiente de implementación)

---

## 📋 ÍNDICE

Este documento describe el sistema de base de datos automática de proveedores alimentada por internet.

### Documentación por secciones:

1. **[Schema Firebase](./proveedores/FIREBASE-SCHEMA.md)** - Estructura de datos en Firestore
2. **[Cron Jobs](./proveedores/CRON-JOBS.md)** - Sistema de actualización automática
3. **[API Endpoints](./proveedores/API-ENDPOINTS.md)** - Endpoints de búsqueda y métricas
4. **[Sistema Claim](./proveedores/CLAIM-SYSTEM.md)** - Perfiles editables por proveedores
5. **[Plan de Implementación](./proveedores/PLAN-IMPLEMENTACION.md)** - Pasos para implementar

---

## 🎯 VISIÓN GENERAL

### **Problema actual:**
- ❌ Cada búsqueda hace llamada a Tavily API (coste por búsqueda)
- ❌ No hay persistencia de datos entre búsquedas
- ❌ No se pueden rastrear métricas de proveedores
- ❌ Proveedores duplicados en resultados
- ❌ Resultados irrelevantes (marketplaces, compraventa)

### **Solución propuesta:**
Base de datos centralizada en **Firebase Firestore** que:
- ✅ Almacena proveedores verificados
- ✅ Se actualiza automáticamente con cron jobs
- ✅ Registra métricas de uso sin registro de proveedores
- ✅ Permite búsquedas ultrarrápidas (sin llamadas API externas)
- ✅ **Tavily solo para descubrir nuevos proveedores** (búsqueda programada)
- ✅ Permite que proveedores reclamen y editen su perfil en el futuro

---

## 🏗️ ARQUITECTURA SIMPLIFICADA

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Frontend)                        │
│  Busca: "fotógrafo boda valencia"                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Backend (Express + Firebase)                │
│                                                              │
│  1. Buscar en Firestore (cache local) ⚡ RÁPIDO             │
│     - Filtros: categoría, ubicación, keywords               │
│     - Sort: matchScore, rating                              │
│                                                              │
│  2. Si < 3 resultados → Tavily Fallback                     │
│     - Buscar en tiempo real                                 │
│     - Guardar nuevos proveedores en Firestore              │
│                                                              │
│  3. Registrar métricas                                      │
│     - views++, clicks++, conversions++                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 FIREBASE FIRESTORE                          │
│                                                              │
│  Collection: suppliers                                      │
│  ├── alfonso-calza-valencia                                 │
│  ├── bodas-palacio-alicante                                 │
│  ├── dj-music-madrid                                        │
│  └── ...                                                     │
│                                                              │
│  Indexes:                                                    │
│  - category + location.city + metrics.matchScore           │
│  - status + lastUpdated                                     │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│       CRON JOBS (Node-cron o Cloud Functions)               │
│                                                              │
│  📅 Daily (02:00):    Verificar URLs activas                │
│  📅 Weekly (03:00):   Buscar nuevos proveedores (Tavily)   │
│  📅 Monthly (04:00):  Limpiar proveedores inactivos         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 COSTES ESTIMADOS

| Servicio | Uso | Coste Mensual |
|----------|-----|---------------|
| **Tavily API** | Búsquedas semanales programadas (~200/mes) | ~$30 |
| **Firebase Firestore** | Almacenamiento < 1GB, ~10K lecturas/día | Gratis (tier gratuito) |
| **Cloud Functions** | Cron jobs (3 funciones × 4 ejecuciones/mes) | Gratis (tier gratuito) |
| **Firebase Storage** | Imágenes de proveedores (~5GB) | ~$0.50 |
| **TOTAL** | | **~$30-35/mes** |

**Ahorro vs. sistema actual:** ~$115/mes (de $150/mes a $35/mes)

---

## 🚀 BENEFICIOS

### **Para el Sistema:**
- ⚡ **Búsquedas 50x más rápidas** (Firestore vs API externa)
- 💰 **Reducción de costes 77%** ($150 → $35/mes)
- 📊 **Métricas históricas** de rendimiento de proveedores
- 🎯 **Rankings automáticos** (top proveedores por zona/categoría)
- 🔄 **Actualización continua** sin intervención manual

### **Para los Usuarios:**
- ⚡ Resultados instantáneos
- ✅ Proveedores verificados y actualizados
- 📈 Rankings basados en datos reales
- 🌍 Cobertura nacional automática

### **Para los Proveedores:**
- 📊 Visibilidad sin necesidad de registro inicial
- 🎯 Aparecen automáticamente si están en internet
- 👤 **Pueden reclamar su perfil** en el futuro
- ✏️ **Editar su información** una vez reclamado

---

## 📚 DOCUMENTACIÓN DETALLADA

Lee cada sección en orden para entender el sistema completo:

1. **[Schema Firebase](./proveedores/FIREBASE-SCHEMA.md)**
   - Estructura de datos de proveedores
   - Campos obligatorios y opcionales
   - Índices necesarios

2. **[Cron Jobs](./proveedores/CRON-JOBS.md)**
   - Verificación diaria de proveedores activos
   - Búsqueda semanal de nuevos proveedores
   - Limpieza mensual de inactivos

3. **[API Endpoints](./proveedores/API-ENDPOINTS.md)**
   - POST /api/suppliers/search (búsqueda híbrida)
   - POST /api/suppliers/:id/track (métricas)
   - GET /api/admin/suppliers/stats (dashboard)

4. **[Sistema Claim](./proveedores/CLAIM-SYSTEM.md)**
   - Proceso de reclamación de perfil
   - Verificación de identidad
   - Edición de perfil por proveedor

5. **[Plan de Implementación](./proveedores/PLAN-IMPLEMENTACION.md)**
   - Fase 1: Schema + API básica
   - Fase 2: Cron jobs
   - Fase 3: Sistema de claim
   - Fase 4: Dashboard admin

---

## 🔗 INTEGRACIÓN CON SISTEMA ACTUAL

El nuevo sistema convive con el actual:

```javascript
// Flujo de búsqueda híbrido
async function searchSuppliers(query, location, service) {
  // 1. Buscar en Firestore (NUEVO)
  const firestoreResults = await searchFirestore(query, location, service);
  
  // 2. Si hay suficientes resultados, devolver
  if (firestoreResults.length >= 3) {
    return firestoreResults;
  }
  
  // 3. Fallback a Tavily (ACTUAL)
  const tavilyResults = await searchTavily(query, location, service);
  
  // 4. Guardar nuevos en Firestore para próximas búsquedas
  await saveToFirestore(tavilyResults);
  
  // 5. Combinar resultados
  return [...firestoreResults, ...tavilyResults];
}
```

**Ventaja:** Transición gradual sin romper nada existente.

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Privacidad:**
- ✅ Solo datos públicos de internet
- ✅ Proveedores pueden solicitar eliminación (GDPR)
- ✅ Email/teléfono solo visible tras contacto

### **Calidad de Datos:**
- ✅ Verificación automática diaria
- ✅ Status tracking (active/inactive/pending)
- ✅ Múltiples fuentes de validación

### **Escalabilidad:**
- ✅ Firestore escala automáticamente
- ✅ Índices optimizados para búsquedas rápidas
- ✅ Paginación en consultas grandes

---

## 📞 SOPORTE

**Documentado por:** Cascade AI  
**Repositorio:** https://github.com/Daniel-Navarro-Campos/mywed360  
**Contacto:** Ver equipo en README.md

---

## 🗺️ PRÓXIMOS PASOS

1. ✅ Revisar documentación completa
2. ⏳ Crear schema en Firebase (Fase 1)
3. ⏳ Implementar API de búsqueda (Fase 1)
4. ⏳ Implementar cron jobs (Fase 2)
5. ⏳ Sistema de claim (Fase 3)

**Lee el [Plan de Implementación](./proveedores/PLAN-IMPLEMENTACION.md) para comenzar.**
