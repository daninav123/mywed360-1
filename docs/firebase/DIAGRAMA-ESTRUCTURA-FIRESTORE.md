# 📊 DIAGRAMA: ESTRUCTURA FIRESTORE PROPUESTA

**Visual rápida de la organización propuesta**

---

## 🎯 VISTA GENERAL

```
┌└─────────────────────────────────────────────────────────────┐
│                      FIRESTORE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👤 USUARIOS                  💒 BODAS (Core Business)       │
│  ├─ users/                    ├─ weddings/                  │
│  │   └─ {uid}/                │   └─ {weddingId}/          │
│  │       ├─ profile           │       ├─ info               │
│  │       ├─ preferences       │       ├─ team               │
│  │       ├─ notifications     │       ├─ guests/            │
│  │       └─ emails/           │       ├─ tasks/             │
│  │                             │       ├─ suppliers/         │
│  🎯 CATÁLOGO PROVEEDORES      │       ├─ finance/           │
│  ├─ suppliers/                │       ├─ emailSettings/     │
│  │   └─ {supplierId}/         │       ├─ automation/        │
│  │       ├─ profile            │       ├─ metrics/           │
│  │       ├─ portfolio          │       └─ settings/          │
│  │       ├─ reviews            │                             │
│  │       └─ analytics/         │                             │
│  │                             │                             │
│  ⚙️ SISTEMA (Admin/Global)                                  │
│  ├─ payments/                                                │
│  ├─ subscriptions/                                           │
│  ├─ invoices/                                                │
│  ├─ refunds/                                                 │
│  ├─ partners/                                                │
│  ├─ discounts/                                               │
│  ├─ emailTemplates/                                          │
│  ├─ emailQueue/                                              │
│  ├─ emailEvents/                                             │
│  ├─ automationJobs/                                          │
│  ├─ automationLogs/                                          │
│  ├─ analytics/                                               │
│  ├─ feedback/                                                │
│  ├─ config/                                                  │
│  └─ audit/                                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💒 DETALLE: COLECCIÓN `weddings/`

```
weddings/{weddingId}/
│
├─ 📄 info/                     # Información básica
│   ├─ date                     # Fecha de la boda
│   ├─ location                 # Ubicación
│   ├─ style                    # Estilo
│   └─ budget                   # Presupuesto total
│
├─ 👥 team/                     # Equipo
│   ├─ owners: [uid1, uid2]     # Novios
│   ├─ planners: [uid3]         # Wedding planners
│   └─ assistants: [uid4]       # Asistentes
│
├─ 👥 guests/                   # Invitados
│   └─ {guestId}/
│       ├─ name
│       ├─ email
│       ├─ phone
│       ├─ rsvpStatus
│       ├─ companions
│       ├─ dietaryRestrictions
│       ├─ table
│       │
│       ├─ responses/           # Respuestas RSVP
│       │   └─ {responseId}/
│       │
│       └─ notes/               # Notas sobre el invitado
│           └─ {noteId}/
│
├─ ✅ tasks/                    # Tareas
│   └─ {taskId}/
│       ├─ title
│       ├─ description
│       ├─ dueDate
│       ├─ status
│       ├─ assignedTo
│       └─ category
│
├─ 🎯 suppliers/                # Proveedores CONTRATADOS
│   └─ {supplierId}/
│       ├─ name
│       ├─ service
│       ├─ status              # confirmed, pending, contacted
│       ├─ contactDate
│       │
│       ├─ contracts/          # Contratos firmados
│       │   └─ {contractId}/
│       │
│       ├─ budgets/            # Presupuestos recibidos
│       │   └─ {budgetId}/
│       │
│       └─ payments/           # Pagos realizados
│           └─ {paymentId}/
│
├─ 💰 finance/                  # Finanzas
│   └─ {transactionId}/
│       ├─ type                # income / expense
│       ├─ amount
│       ├─ category
│       ├─ supplier
│       ├─ date
│       ├─ paymentMethod
│       └─ receipt
│
├─ ⚙️ emailSettings/           # Configuración de email (no emails en sí)
│   ├─ signatures/            # Firmas personalizadas
│   │   └─ {signatureId}/
│   │
│   └─ templates/             # Templates específicos de la boda
│       └─ {templateId}/
│
├─ 🤖 automation/               # Automatización
│   ├─ rules/                  # Reglas configuradas
│   │   └─ {ruleId}/
│   │       ├─ name
│   │       ├─ trigger
│   │       ├─ conditions
│   │       ├─ actions
│   │       └─ active
│   │
│   └─ history/                # Historial de ejecuciones
│       └─ {executionId}/
│           ├─ ruleId
│           ├─ executedAt
│           ├─ success
│           └─ logs
│
├─ 📊 metrics/                  # Métricas de la boda
│   └─ daily/
│       └─ {YYYY-MM-DD}/
│           ├─ emailsSent
│           ├─ tasksCompleted
│           ├─ budgetSpent
│           ├─ guestsConfirmed
│           └─ suppliersContacted
│
└─ ⚙️ settings/                 # Configuración
    ├─ email/                  # Config de email
    │   ├─ autoReplies
    │   ├─ signatures
    │   └─ templates
    │
    ├─ notifications/          # Config notificaciones
    │   ├─ channels
    │   └─ preferences
    │
    └─ integrations/           # Integraciones externas
        ├─ calendar
        ├─ accounting
        └─ crm
```

---

## 🎯 DETALLE: CATÁLOGO `suppliers/`

```
suppliers/{supplierId}/
│
├─ 📄 profile/                  # Perfil público
│   ├─ name
│   ├─ slug
│   ├─ category
│   ├─ description
│   ├─ location
│   │   ├─ city
│   │   ├─ province
│   │   └─ country
│   │
│   ├─ contact
│   │   ├─ email
│   │   ├─ phone
│   │   ├─ website
│   │   └─ instagram
│   │
│   ├─ business
│   │   ├─ priceRange
│   │   ├─ minBudget
│   │   ├─ maxBudget
│   │   ├─ services: []
│   │   └─ availability
│   │
│   ├─ registered             # true/false
│   ├─ status                 # active, discovered, pending
│   └─ source                 # registration, tavily, bodas-net
│
├─ 📸 portfolio/                # Portfolio de trabajos
│   └─ {imageId}/
│       ├─ url
│       ├─ title
│       ├─ category
│       └─ order
│
├─ ⭐ reviews/                  # Reseñas
│   └─ {reviewId}/
│       ├─ weddingId
│       ├─ userId
│       ├─ rating
│       ├─ comment
│       ├─ date
│       └─ verified
│
├─ 💵 pricing/                  # Precios y paquetes
│   └─ {packageId}/
│       ├─ name
│       ├─ price
│       ├─ description
│       └─ includes: []
│
└─ 📊 analytics/                # Analítica del proveedor
    ├─ views/                  # Vistas del perfil
    │   └─ {viewId}/
    │
    ├─ clicks/                 # Clicks en contacto
    │   └─ {clickId}/
    │
    └─ contacts/               # Contactos recibidos
        └─ {contactId}/
```

---

## 🔄 COMPARACIÓN: ANTES vs DESPUÉS

### **EMAILS**

#### **ANTES (Duplicado):**
```
mails/{emailId}                   # ❌ Emails globales
users/{uid}/mails/{emailId}       # ❌ Emails de usuario
weddings/{wid}/emailHistory/      # ❌ Historial separado
```

#### **DESPUÉS (Correcto - Por usuario):**
```
users/{uid}/emails/{emailId}/     # ✅ Emails del USUARIO
  └─ attachments/

weddings/{wid}/emailSettings/     # ✅ Solo config de email
  ├─ signatures/
  └─ templates/
```

---

### **PROVEEDORES**

#### **ANTES (Mezclado):**
```
suppliers/{id}                    # ❌ Catálogo + Contratados mezclados
supplier_events/{id}              # ❌ Eventos separados
```

#### **DESPUÉS (Separado):**
```
suppliers/{id}/                   # ✅ Solo CATÁLOGO
  └─ analytics/                   # ✅ Analítica integrada

weddings/{wid}/suppliers/{id}/    # ✅ CONTRATADOS por boda
  ├─ contracts/
  ├─ budgets/
  └─ payments/
```

---

### **MÉTRICAS**

#### **ANTES (Fragmentado):**
```
projectMetrics_events/{id}        # ❌ Eventos sin procesar
projectMetrics/{wid}/modules/     # ❌ Estructura compleja
  └─ {module}/
      └─ daily/{date}/
```

#### **DESPUÉS (Simple):**
```
weddings/{wid}/metrics/daily/{date}/  # ✅ Directo y simple
  ├─ emailsSent
  ├─ tasksCompleted
  └─ budgetSpent
```

---

## 🎯 BENEFICIOS VISUALES

### **ANTES:**
```
users/
├─ {uid}/
│   ├─ weddings/          ┐
│   └─ mails/             │  DUPLICACIÓN
weddings/                 │
├─ {wid}/                 ┘
mails/                    ┘
└─ {emailId}/

payments/, partners/, analytics/ → ❌ Mezclado en raíz
```

### **DESPUÉS:**
```
users/
└─ {uid}/
    ├─ profile            ✅ Solo perfil
    └─ emails/            ✅ Emails del usuario

weddings/
└─ {wid}/
    ├─ guests/            ✅ Jerarquía clara
    ├─ suppliers/         ✅ Fácil de entender
    └─ emailSettings/     ✅ Solo config

system/                    ✅ Todo admin junto
├─ payments/
├─ partners/
├─ analytics/
├─ emailQueue/
└─ ...
```

---

## 🔐 SEGURIDAD SIMPLIFICADA

### **ANTES (Complejo):**
```javascript
// Reglas para múltiples ubicaciones
match /users/{uid}/weddings/{wid} { ... }
match /weddings/{wid} { ... }
match /users/{uid}/mails/{mid} { ... }
match /weddings/{wid}/emailHistory/{mid} { ... }
```

### **DESPUÉS (Simple):**
```javascript
// Una sola regla para toda la boda
match /weddings/{weddingId}/{document=**} {
  allow read, write: if isWeddingTeamMember(weddingId);
}

// Proveedores pueden ver su analítica
match /suppliers/{supplierId}/analytics/{document=**} {
  allow read: if isSupplierOwner(supplierId);
}
```

---

## 📈 QUERIES MÁS EFICIENTES

### **ANTES:**
```javascript
// Buscar todos los emails del usuario
const userMails = await db.collection('users').doc(uid).collection('mails').get();
const globalMails = await db.collection('mails').where('userId', '==', uid).get();
// ❌ 2 queries + merge manual
```

### **DESPUÉS:**
```javascript
// Una sola query - emails del usuario
const emails = await db.collection('users').doc(uid).collection('emails').get();
// ✅ 1 query, simple y rápido

// Obtener config de email de una boda
const emailConfig = await db.collection('weddings').doc(wid).collection('emailSettings').get();
// ✅ Config separada de emails
```

---

## 🎯 CONCLUSIÓN

La nueva estructura es:
- ✅ **Más simple** - Menos duplicación
- ✅ **Más clara** - Jerarquía lógica
- ✅ **Más segura** - Reglas más fáciles
- ✅ **Más rápida** - Menos queries
- ✅ **Más escalable** - Preparada para crecer

---

**Ver propuesta completa:** `PROPUESTA-ORGANIZACION-FIRESTORE.md`
