# 🗄️ PROPUESTA: ORGANIZACIÓN FIRESTORE

**Fecha:** 2025-10-28  
**Estado:** 📋 PROPUESTA - Pendiente aprobación

---

## 📊 ESTRUCTURA ACTUAL (ANÁLISIS)

### **Colecciones detectadas en el código:**

#### **👤 USUARIOS Y BODAS**
```
users/                          # Usuarios principales
  └─ {uid}/
      ├─ weddings/              # Bodas del usuario
      ├─ mails/                 # Emails del usuario
      ├─ notifications/         # Notificaciones
      └─ preferences/           # Preferencias

weddings/                       # Bodas globales
  └─ {weddingId}/
      ├─ guests/                # Invitados
      ├─ tasks/                 # Tareas
      ├─ suppliers/             # Proveedores contratados
      ├─ finance/               # Finanzas
      ├─ emailConfig/           # Configuración email
      ├─ emailHistory/          # Historial emails
      ├─ scheduledEmails/       # Emails programados
      ├─ automationRules/       # Reglas de automatización
      └─ modules/               # Métricas por módulo
```

#### **📧 EMAIL Y COMUNICACIÓN**
```
mails/                          # Emails globales
  └─ {mailId}/
      └─ attachments/           # Adjuntos

emailTemplates/                 # Plantillas de email
emailDrafts/                    # Borradores
emailEvents/                    # Eventos de email (bounces, etc.)
```

#### **🎯 PROVEEDORES**
```
suppliers/                      # Catálogo de proveedores
  └─ {supplierId}/
      ├─ budgets/               # Presupuestos
      └─ reviews/               # Reseñas

supplier_events/                # Eventos de proveedores (clicks, views)
```

#### **💰 PAGOS Y SUSCRIPCIONES**
```
payments/                       # Pagos
subscriptions/                  # Suscripciones
discountLinks/                  # Enlaces de descuento
partnerPayouts/                 # Pagos a partners
invoices/                       # Facturas
```

#### **🤖 AUTOMATIZACIÓN Y JOBS**
```
automationQueue/                # Cola de automatización
automationHistory/              # Historial de automatización
emailTrashRetention_audit/      # Auditoría de limpieza
```

#### **📊 ANALÍTICA Y MÉTRICAS**
```
projectMetrics_events/          # Eventos de métricas
projectMetrics/                 # Métricas agregadas
  └─ {weddingId}/
      └─ modules/
          └─ {module}/
              └─ daily/         # Métricas diarias

searchAnalytics/                # Analítica de búsquedas
userFeedback/                   # Feedback de usuarios
```

#### **⚙️ CONFIGURACIÓN Y ADMIN**
```
admin/                          # Configuración global admin
health/                         # Health checks
```

---

## 🎯 PROBLEMAS DETECTADOS

### **1. DUPLICACIÓN DE DATOS**
- ❌ `users/{uid}/weddings` + `weddings/` → **Datos duplicados**
- ❌ `users/{uid}/mails` + `mails/` → **Dos ubicaciones para emails**

### **2. ESTRUCTURA MIXTA**
- ⚠️ Algunas colecciones son subcolecciones, otras globales
- ⚠️ No hay un patrón consistente

### **3. FALTA DE NAMESPACING**
- ⚠️ `projectMetrics_events` vs `emailTrashRetention_audit` → **Inconsistente**
- ⚠️ Mezclado guiones bajos y camelCase

### **4. COLECCIONES HUÉRFANAS**
- ⚠️ `health` solo para health checks → **Innecesario**
- ⚠️ `automationQueue` podría ser subcollection

---

## ✅ PROPUESTA: ESTRUCTURA LIMPIA

### **🏗️ PRINCIPIOS DE DISEÑO**

1. **Single Source of Truth** - Un solo lugar por tipo de dato
2. **Jerarquía lógica** - Datos relacionados agrupados
3. **Naming consistente** - camelCase para colecciones
4. **Seguridad por diseño** - Fácil aplicar reglas de seguridad
5. **Escalabilidad** - Preparado para crecimiento

---

## 📋 ESTRUCTURA PROPUESTA

```
firestore/
│
├─ 👤 USUARIOS
│   └─ users/
│       └─ {uid}/
│           ├─ profile/           # Perfil del usuario
│           ├─ preferences/       # Preferencias
│           ├─ notifications/     # Notificaciones
│           ├─ sessions/          # Sesiones activas
│           │
│           └─ emails/            # 📧 EMAILS DEL USUARIO
│               └─ {emailId}/
│                   └─ attachments/
│
├─ 💒 BODAS (CORE)
│   └─ weddings/
│       └─ {weddingId}/
│           ├─ info/              # Información básica
│           ├─ team/              # Equipo (owners, planners, assistants)
│           │
│           ├─ guests/            # 👥 INVITADOS
│           │   └─ {guestId}/
│           │       ├─ responses/ # Respuestas RSVP
│           │       └─ notes/     # Notas
│           │
│           ├─ tasks/             # ✅ TAREAS
│           │   └─ {taskId}/
│           │
│           ├─ suppliers/         # 🎯 PROVEEDORES CONTRATADOS
│           │   └─ {supplierId}/
│           │       ├─ contracts/ # Contratos
│           │       ├─ budgets/  # Presupuestos
│           │       └─ payments/  # Pagos
│           │
│           ├─ finance/           # 💰 FINANZAS
│           │   └─ {transactionId}/
│           │
│           ├─ emailSettings/     # ⚙️ Configuración de email para esta boda
│           │   ├─ signatures
│           │   └─ templates
│           │
│           ├─ automation/        # 🤖 AUTOMATIZACIÓN
│           │   ├─ rules/         # Reglas
│           │   └─ history/       # Historial
│           │
│           ├─ metrics/           # 📊 MÉTRICAS
│           │   └─ daily/
│           │       └─ {date}/
│           │
│           └─ settings/          # ⚙️ CONFIGURACIÓN
│               ├─ email/         # Config email
│               ├─ notifications/ # Config notificaciones
│               └─ integrations/  # Integraciones
│
├─ 🎯 CATÁLOGO PROVEEDORES
│   └─ suppliers/
│       └─ {supplierId}/
│           ├─ profile/           # Perfil del proveedor
│           ├─ portfolio/         # Portfolio (imágenes)
│           ├─ reviews/           # Reseñas
│           ├─ pricing/           # Precios
│           └─ analytics/         # Analítica del proveedor
│               ├─ views/         # Vistas
│               ├─ clicks/        # Clicks
│               └─ contacts/      # Contactos
│
└─ ⚙️ SISTEMA (Todo lo administrativo y global)
    │
    ├─ 💰 payments/               # Pagos
    │   └─ {paymentId}/
    │
    ├─ 💳 subscriptions/          # Suscripciones
    │   └─ {subscriptionId}/
    │       └─ history/
    │
    ├─ 📄 invoices/               # Facturas
    │   └─ {invoiceId}/
    │
    ├─ 💸 refunds/                # Devoluciones
    │   └─ {refundId}/
    │
    ├─ 🔗 partners/               # Partners y afiliados
    │   └─ {partnerId}/
    │       ├─ stats/
    │       └─ payouts/
    │
    ├─ 🎟️ discounts/              # Descuentos
    │   └─ {discountId}/
    │       └─ usage/
    │
    ├─ 📧 emailTemplates/         # Plantillas globales de email
    │   └─ {templateId}/
    │
    ├─ 📤 emailQueue/             # Cola de envío
    │   └─ {queueId}/
    │
    ├─ 📨 emailEvents/            # Eventos de email (bounces, etc.)
    │   └─ {eventId}/
    │
    ├─ 🤖 automationJobs/         # Jobs de automatización
    │   └─ {jobId}/
    │
    ├─ 📝 automationLogs/         # Logs de automatización
    │   └─ {logId}/
    │
    ├─ 📊 analytics/              # Analítica del sistema
    │   ├─ searches/
    │   ├─ userActivity/
    │   └─ performance/
    │
    ├─ 💬 feedback/               # Feedback de usuarios
    │   └─ {feedbackId}/
    │
    ├─ ⚙️ config/                 # Configuración global
    │   └─ {key}/
    │
    └─ 🔍 audit/                  # Auditoría de cambios
        └─ {auditId}/
```

---

## 🔄 MIGRACIÓN: MAPEO ANTIGUO → NUEVO

### **USUARIOS Y BODAS**
```javascript
// ANTES
users/{uid}/weddings/{weddingId}  →  weddings/{weddingId}
users/{uid}/mails/{mailId}        →  weddings/{weddingId}/emails/{emailId}

// DESPUÉS
users/{uid}/                      →  Solo perfil y preferencias
weddings/{weddingId}/             →  Todo relacionado con la boda
```

### **PROVEEDORES**
```javascript
// ANTES
suppliers/{id}                    →  Mezclado catálogo y contratados
supplier_events/{id}              →  Eventos separados

// DESPUÉS
suppliers/{id}/                   →  Solo catálogo
weddings/{wid}/suppliers/{sid}/   →  Proveedores contratados por boda
suppliers/{id}/analytics/         →  Analítica integrada
```

### **EMAIL**
```javascript
// ANTES
mails/{id}                        →  Emails globales
users/{uid}/mails/{id}            →  Emails de usuario
weddings/{wid}/emailHistory/      →  Historial separado

// DESPUÉS
users/{uid}/emails/{id}/          →  Emails DEL USUARIO (no por boda)
  └─ attachments/
weddings/{wid}/emailSettings/     →  Solo configuración de email
system/emailTemplates/{id}/       →  Plantillas globales
system/emailQueue/{id}/           →  Cola de envío
```

### **AUTOMATIZACIÓN**
```javascript
// ANTES
automationQueue/{id}              →  Cola global
weddings/{wid}/automationRules/   →  Reglas por boda

// DESPUÉS
weddings/{wid}/automation/rules/  →  Reglas de la boda
weddings/{wid}/automation/history/→  Historial de ejecuciones
automationJobs/{id}/              →  Jobs globales del sistema
```

### **MÉTRICAS**
```javascript
// ANTES
projectMetrics_events/{id}        →  Eventos sin procesar
projectMetrics/{wid}/modules/     →  Métricas procesadas

// DESPUÉS
weddings/{wid}/metrics/daily/{date}/  →  Métricas agregadas por día
analytics/userActivity/           →  Analítica global del sistema
```

---

## 🚀 VENTAJAS DE LA NUEVA ESTRUCTURA

### **1. CLARIDAD**
✅ Cada colección tiene un propósito claro  
✅ Jerarquía intuitiva  
✅ Fácil de navegar en Firebase Console

### **2. SEGURIDAD**
✅ Reglas de seguridad más simples:
```javascript
// Usuario solo ve sus emails
match /users/{uid}/emails/{emailId} {
  allow read, write: if request.auth.uid == uid;
}

// Solo el equipo de la boda puede ver sus datos
match /weddings/{weddingId}/{document=**} {
  allow read, write: if isWeddingTeamMember(weddingId);
}

// Solo admins acceden a sistema
match /system/{document=**} {
  allow read, write: if isAdmin();
}
```

### **3. PERFORMANCE**
✅ Queries más eficientes (menos joins)  
✅ Indexación más clara  
✅ Menos duplicación de datos

### **4. ESCALABILIDAD**
✅ Fácil agregar nuevas features  
✅ Estructura preparada para multi-tenancy  
✅ Particionado lógico por boda

### **5. MANTENIMIENTO**
✅ Código más limpio  
✅ Menos confusión sobre dónde guardar datos  
✅ Migraciones futuras más fáciles

---

## 📋 PLAN DE MIGRACIÓN

### **FASE 1: PREPARACIÓN (1 día)**
1. ✅ Crear script de análisis de datos actuales
2. ✅ Backup completo de Firestore
3. ✅ Crear índices necesarios para nueva estructura
4. ✅ Documentar todos los cambios necesarios en el código

### **FASE 2: MIGRACIÓN DE DATOS (2-3 días)**
1. 🔄 Migrar `users` → Nueva estructura
2. 🔄 Migrar `weddings` → Nueva estructura  
3. 🔄 Migrar `suppliers` → Separar catálogo vs contratados
4. 🔄 Migrar `mails` → `weddings/{wid}/emails/`
5. 🔄 Migrar métricas y automatización

### **FASE 3: ACTUALIZACIÓN DE CÓDIGO (2-3 días)**
1. 🔄 Actualizar todos los servicios backend
2. 🔄 Actualizar componentes frontend
3. 🔄 Actualizar reglas de seguridad Firestore
4. 🔄 Actualizar tests

### **FASE 4: TESTING (1-2 días)**
1. ✅ Tests unitarios
2. ✅ Tests de integración
3. ✅ Tests E2E
4. ✅ Verificación manual

### **FASE 5: DESPLIEGUE (1 día)**
1. 🚀 Desplegar cambios en staging
2. 🚀 Verificar en staging
3. 🚀 Desplegar en producción
4. 🚀 Monitorear errores

### **FASE 6: LIMPIEZA (1 día)**
1. 🧹 Eliminar colecciones antiguas (después de verificación)
2. 🧹 Limpiar código legacy
3. 📄 Actualizar documentación

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. BACKWARD COMPATIBILITY**
Durante la migración, mantener **AMBAS estructuras** funcionando:
- ✅ Código lee de estructura nueva
- ✅ Fallback a estructura antigua si no existe
- ✅ Eliminar estructura antigua solo después de 100% migrado

### **2. ROLLBACK PLAN**
- ✅ Backup completo antes de migrar
- ✅ Script de rollback preparado
- ✅ Monitoreo de errores en tiempo real

### **3. IMPACTO EN PRODUCCIÓN**
- ⚠️ Migración puede ser lenta (mucha data)
- ⚠️ Algunos queries pueden ser lentos durante migración
- ✅ **Solución:** Migrar en horarios de bajo tráfico

---

## 🎯 SIGUIENTES PASOS

### **OPCIÓN A: MIGRACIÓN COMPLETA**
**Tiempo:** 7-10 días  
**Complejidad:** Alta  
**Beneficio:** Estructura perfecta y escalable

### **OPCIÓN B: MIGRACIÓN GRADUAL**
**Tiempo:** 2-3 semanas  
**Complejidad:** Media  
**Beneficio:** Menos riesgo, más tiempo para testing

### **OPCIÓN C: SOLO NUEVAS FEATURES**
**Tiempo:** 1-2 días  
**Complejidad:** Baja  
**Beneficio:** Empezar limpio para nuevas features, mantener legacy

---

## ❓ DECISIÓN REQUERIDA

**¿Qué opción prefieres?**

1. **Migración completa ahora** → Estructura perfecta desde ya
2. **Migración gradual** → Empezar con lo crítico, migrar resto poco a poco
3. **Solo nuevas features** → Dejar legacy como está, solo limpiar hacia adelante

**¿O prefieres que te sugiera una opción basada en tu situación actual?**

---

**Documento creado:** 2025-10-28  
**Estado:** 📋 PROPUESTA  
**Siguiente paso:** Aprobar opción de migración
