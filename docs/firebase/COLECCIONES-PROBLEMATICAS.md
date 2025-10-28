# 🔍 ANÁLISIS: COLECCIONES PROBLEMÁTICAS

**Fecha:** 2025-10-28  
**Análisis de colecciones sin sentido o erróneas**

---

## ❌ COLECCIONES PROBLEMÁTICAS DETECTADAS

### **1. `health/` - INNECESARIA**

**Ubicación en código:** `backend/services/automationService.js`
```javascript
await admin.firestore().collection('health').limit(1).get();
```

**Problema:**
- ❌ Solo se usa para hacer un health check
- ❌ No almacena ningún dato real
- ❌ Ocupa espacio en Firestore innecesariamente

**Solución:**
```javascript
// ✅ Usar colección existente
await admin.firestore().collection('system/config').limit(1).get();
```

**Acción:** ✅ **ELIMINAR** - Usar `system/config` para health checks

---

### **2. `mails/` - DUPLICADA Y CONFUSA**

**Ubicación en código:** Múltiples archivos
```javascript
db.collection('mails')  // Global
db.collection('users').doc(uid).collection('mails')  // Por usuario
db.collection('weddings').doc(wid).collection('emailHistory')  // Por boda
```

**Problema:**
- ❌ Emails en 3 lugares diferentes
- ❌ Confusión sobre cuál usar
- ❌ Duplicación de datos
- ❌ Queries complejos para obtener todos los emails

**Solución propuesta:**
- ✅ Solo: `users/{uid}/emails/`
- ✅ Eliminar: `mails/` global
- ✅ Eliminar: `weddings/{wid}/emailHistory/`

**Acción:** ✅ **CONSOLIDAR** en `users/{uid}/emails/`

---

### **3. `supplier_events/` - MAL DISEÑADA**

**Ubicación en código:** `backend/routes/suppliers-hybrid.js`
```javascript
await db.collection('supplier_events').add({
  supplierId: id,
  action,
  userId,
  timestamp
});
```

**Problema:**
- ❌ Nombre con guión bajo (inconsistente)
- ❌ Eventos globales sin estructura de usuario
- ❌ Dificulta queries por proveedor
- ❌ No sigue el patrón de subcollection

**Solución:**
```javascript
// ✅ Mejor: Como subcollection
suppliers/{id}/analytics/events/{eventId}
```

**Acción:** ✅ **MIGRAR** a `suppliers/{id}/analytics/`

---

### **4. `projectMetrics_events/` - NAMING INCORRECTO**

**Ubicación en código:** `backend/workers/metricAggregatorWorker.js`
```javascript
db.collection('projectMetrics_events').where('processed', '==', false)
```

**Problema:**
- ❌ Nombre con guión bajo (inconsistente con camelCase)
- ❌ "project" es ambiguo (¿qué proyecto?)
- ❌ Eventos sin procesar mezclados con procesados

**Solución:**
```javascript
// ✅ Mejor estructura
system/analytics/events/  // Eventos sin procesar
weddings/{wid}/metrics/daily/{date}/  // Métricas procesadas
```

**Acción:** ✅ **RENOMBRAR Y MOVER** a `system/analytics/events/`

---

### **5. `projectMetrics/` - STRUCTURE CONFUSA**

**Ubicación en código:** `backend/workers/metricAggregatorWorker.js`
```javascript
db.collection('projectMetrics')
  .doc(wid)
  .collection('modules')
  .doc(mod)
  .collection('daily')
  .doc(day)
```

**Problema:**
- ❌ 4 niveles de profundidad innecesarios
- ❌ "projectMetrics" → ¿por qué "project"?
- ❌ Difícil de navegar
- ❌ Queries complejos

**Solución:**
```javascript
// ✅ Más simple: 2 niveles
weddings/{wid}/metrics/daily/{YYYY-MM-DD}
```

**Acción:** ✅ **SIMPLIFICAR** estructura

---

### **6. `emailTrashRetention_audit/` - NAMING INCONSISTENTE**

**Ubicación en código:** `backend/jobs/emailTrashRetention.js`
```javascript
const AUDIT_COLLECTION = 'emailTrashRetention_audit';
```

**Problema:**
- ❌ Nombre con guión bajo
- ❌ Muy específico (solo para un job)
- ❌ No sigue patrón de sistema

**Solución:**
```javascript
// ✅ Mejor: Auditoría general
system/audit/emailTrashRetention/
```

**Acción:** ✅ **MOVER** a `system/audit/`

---

### **7. `automationQueue/` - MAL UBICADA**

**Ubicación en código:** `backend/services/automationOrchestrator.js`
```javascript
admin.firestore().collection('automationQueue')
```

**Problema:**
- ⚠️ Cola global mezclada con datos de negocio
- ⚠️ Debería estar en área de sistema

**Solución:**
```javascript
// ✅ Mejor ubicación
system/automationJobs/
```

**Acción:** ✅ **MOVER** a `system/automationJobs/`

---

### **8. `partnerPayouts/`, `discountLinks/`, `payments/` - SIN NAMESPACE**

**Problema:**
- ⚠️ Colecciones de administración en raíz
- ⚠️ Sin agrupación lógica
- ⚠️ Dificulta permisos

**Solución:**
```javascript
// ✅ Agrupar bajo system/
system/payments/
system/partners/
system/discounts/
```

**Acción:** ✅ **MOVER** a `system/`

---

## 🗑️ COLECCIONES A ELIMINAR

### **Eliminar completamente:**

1. **`health/`**
   - Solo usada para health checks
   - No almacena datos reales
   - **Acción:** Eliminar, usar `system/config` para checks

---

## 🔄 COLECCIONES A MIGRAR/RENOMBRAR

### **Alta prioridad:**

1. **`mails/` → `users/{uid}/emails/`**
   - Consolidar todos los emails en un solo lugar
   - Eliminar duplicación

2. **`supplier_events/` → `suppliers/{id}/analytics/events/`**
   - Eventos como subcollection del proveedor
   - Más lógico y eficiente

3. **`projectMetrics_events/` → `system/analytics/events/`**
   - Renombrar con camelCase
   - Namespace correcto

4. **`projectMetrics/` → `weddings/{wid}/metrics/daily/{date}/`**
   - Simplificar estructura
   - Reducir niveles de anidación

### **Media prioridad:**

5. **`emailTrashRetention_audit/` → `system/audit/emailTrash/`**
   - Namespace consistente
   - Patrón de sistema

6. **`automationQueue/` → `system/automationJobs/`**
   - Agrupar en sistema

7. **`partnerPayouts/`, `discountLinks/`, etc. → `system/*`**
   - Agrupar administración

---

## 📊 RESUMEN

### **Problemas detectados:**

| Colección | Problema | Severidad | Acción |
|-----------|----------|-----------|--------|
| `health/` | Innecesaria | 🔴 Alta | Eliminar |
| `mails/` | Duplicada | 🔴 Alta | Consolidar |
| `supplier_events/` | Mal diseñada | 🟡 Media | Migrar |
| `projectMetrics_events/` | Naming inconsistente | 🟡 Media | Renombrar |
| `projectMetrics/` | Estructura confusa | 🟡 Media | Simplificar |
| `emailTrashRetention_audit/` | Sin namespace | 🟡 Media | Mover |
| `automationQueue/` | Sin namespace | 🟢 Baja | Mover |
| `payments/`, `partners/`, etc. | Sin agrupar | 🟢 Baja | Mover |

---

## 🎯 PRIORIDADES DE LIMPIEZA

### **FASE 1: Eliminar innecesarias**
1. ✅ Eliminar `health/`
2. ✅ Usar `system/config` para health checks

### **FASE 2: Consolidar críticas**
1. ✅ Consolidar `mails/` → `users/{uid}/emails/`
2. ✅ Eliminar `weddings/{wid}/emailHistory/`

### **FASE 3: Migrar mal diseñadas**
1. ✅ Migrar `supplier_events/` → `suppliers/{id}/analytics/`
2. ✅ Simplificar `projectMetrics/`

### **FASE 4: Renombrar inconsistentes**
1. ✅ Renombrar `projectMetrics_events/`
2. ✅ Renombrar `emailTrashRetention_audit/`

### **FASE 5: Agrupar en system**
1. ✅ Mover todas las colecciones de admin a `system/`

---

## 💡 SCRIPT DE LIMPIEZA

Crear script que:
1. Analice cuántos documentos hay en cada colección problemática
2. Liste colecciones vacías (candidatas a eliminar)
3. Detecte colecciones no usadas en el código

```javascript
// Ejemplo de análisis
const problematicCollections = [
  'health',
  'mails',
  'supplier_events',
  'projectMetrics_events',
  'emailTrashRetention_audit'
];

for (const collection of problematicCollections) {
  const snapshot = await db.collection(collection).count().get();
  console.log(`${collection}: ${snapshot.data().count} documentos`);
}
```

---

## ❓ SIGUIENTE PASO

**¿Quieres que cree un script que:**

1. **Analice** cuántos documentos hay en cada colección problemática
2. **Detecte** colecciones vacías (seguras de eliminar)
3. **Identifique** colecciones no referenciadas en el código

**O prefieres que empiece directamente con la limpieza de las críticas?** 🧹
