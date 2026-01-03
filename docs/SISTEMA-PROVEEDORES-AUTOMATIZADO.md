# 🔄 Sistema de Proveedores Híbrido con Firebase

**Última actualización:** 2025-01-28  
**Estrategia:** Internet → Transición Progresiva → Plataforma Propia

---

## 📋 ÍNDICE

Sistema que evoluciona desde búsquedas en internet hacia una plataforma propia de proveedores registrados.

### Documentación por secciones:

1. **[Enfoque Híbrido](./proveedores/ENFOQUE-HIBRIDO.md)** ⭐ **LEER PRIMERO** - Estrategia completa
2. **[Plan de Implementación](./proveedores/PLAN-IMPLEMENTACION.md)** - Pasos progresivos (4 fases)
3. **[Schema Firebase](./proveedores/FIREBASE-SCHEMA.md)** - Estructura de datos en Firestore
4. **[API Endpoints](./proveedores/API-ENDPOINTS.md)** - Endpoints de búsqueda híbrida
5. **[Sistema Claim](./proveedores/CLAIM-SYSTEM.md)** - Perfiles editables (futuro)
6. **[Cron Jobs](./proveedores/CRON-JOBS.md)** - Actualización automática (futuro)

---

## 🎯 NUEVA ESTRATEGIA: ENFOQUE HÍBRIDO

### **Problema actual:**
- ❌ Cada búsqueda hace llamada a Tavily API ($150/mes)
- ❌ No hay persistencia entre búsquedas
- ❌ No se rastrean métricas
- ❌ Proveedores duplicados
- ❌ No hay incentivo para que proveedores se registren

### **Solución híbrida progresiva:**

**FASE 1 (Inmediata):** Tavily + Cache silencioso
- ✅ Sistema funciona igual que ahora
- ✅ Guarda resultados en Firestore automáticamente
- ✅ Usuario NO nota cambios
- ✅ Construye base de datos en background

**FASE 2 (1-2 semanas):** Búsqueda híbrida
- ✅ Busca primero en proveedores REGISTRADOS (Firestore)
- ✅ Complementa con INTERNET (Tavily) si hay pocos
- ✅ Registrados aparecen primero (badge verde ✓)
- ✅ Internet aparece después (badge gris)

**FASE 3 (1-2 meses):** Registro de proveedores
- ✅ Proveedores pueden registrarse en plataforma
- ✅ Actualiza perfil de "discovered" → "registered"
- ✅ Aparecen destacados en búsquedas

**FASE 4 (Futuro):** Plataforma madura
- ✅ 90% proveedores registrados
- ✅ Tavily solo fallback
- ✅ Ahorro 80% costes ($150 → $30/mes)

---

## 🏗️ EVOLUCIÓN DEL SISTEMA

```
═══════════════════════════════════════════════════════════════
FASE 1: CACHE SILENCIOSO (Ahora)
═══════════════════════════════════════════════════════════════

Usuario busca → Tavily API → Resultados
                     ↓
            Guardar en Firestore (background)
                     ↓
              Cache construido

───────────────────────────────────────────────────────────────
FASE 2: BÚSQUEDA HÍBRIDA (1-2 semanas)
───────────────────────────────────────────────────────────────

Usuario busca → 1️⃣ Firestore (registrados) ✓
                2️⃣ Tavily (complemento)
                     ↓
              [VERIFICADOS] primero
              [Internet] después

───────────────────────────────────────────────────────────────
FASE 3: REGISTRO (1-2 meses)
───────────────────────────────────────────────────────────────

Proveedores se registran → registered: true
                                ↓
                    Aparecen destacados
                    Badge verde ✓

───────────────────────────────────────────────────────────────
FASE 4: PLATAFORMA MADURA (6+ meses)
───────────────────────────────────────────────────────────────

90% registrados → Tavily solo fallback → Ahorro 80% costes
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
**Repositorio:** https://github.com/Daniel-Navarro-Campos/MaLove.App  
**Contacto:** Ver equipo en README.md

---

## 🗺️ PRÓXIMOS PASOS

1. ✅ Revisar documentación completa
2. ⏳ Crear schema en Firebase (Fase 1)
3. ⏳ Implementar API de búsqueda (Fase 1)
4. ⏳ Implementar cron jobs (Fase 2)
5. ⏳ Sistema de claim (Fase 3)

**Lee el [Plan de Implementación](./proveedores/PLAN-IMPLEMENTACION.md) para comenzar.**
