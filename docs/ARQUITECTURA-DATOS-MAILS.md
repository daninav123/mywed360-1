# 🏗️ ARQUITECTURA DE DATOS: SISTEMA DE MAILS

**Fecha:** 23 de Octubre de 2025  
**Versión:** 1.0 DEFINITIVA  
**Estado:** 🟢 DOCUMENTO CANÓNICO

---

## 📊 RESUMEN EJECUTIVO

Este documento define la **arquitectura oficial y única** para el almacenamiento de datos del sistema de emails en MaLoveApp.

### Decisión Principal

✅ **Modelo seleccionado:** `users/{uid}/mails` + Colección global `mails`

❌ **Modelo descartado:** `weddings/{id}/emails`

---

## 🎯 JUSTIFICACIÓN DE LA DECISIÓN

### ¿Por qué `users/{uid}/mails`?

1. **Emails son personales**: Un email pertenece a un usuario, no a una boda específica
2. **Multi-boda**: Un usuario puede gestionar múltiples bodas desde un solo buzón
3. **Permisos más simples**: Firestore rules basadas en `request.auth.uid`
4. **Escalabilidad**: Queries más eficientes por usuario
5. **Consistencia**: Alineado con `users/{uid}/weddings`

### ¿Por qué NO `weddings/{id}/emails`?

1. ❌ Emails compartidos entre roles son complejos
2. ❌ Requiere duplicación para owner/planner/assistant
3. ❌ Queries lentas al buscar en múltiples bodas
4. ❌ No refleja la realidad: el email va al usuario, no a la boda

---

## 🗄️ ESTRUCTURA DE DATOS CANÓNICA

### Colección Principal: `mails` (Global)

Colección raíz para búsquedas globales y backups.

```typescript
// Ruta: mails/{emailId}
{
  id: string;                    // ID del documento
  
  // Destinatarios y remitentes
  from: string;                  // Email remitente
  to: string[];                  // Destinatarios principales
  cc?: string[];                 // Con copia
  bcc?: string[];                // Con copia oculta
  replyTo?: string;              // Responder a
  
  // Contenido
  subject: string;               // Asunto
  body: string;                  // Texto plano
  bodyText?: string;             // Texto plano explícito
  bodyHtml?: string;             // HTML del mensaje
  
  // Metadata
  folder: 'inbox' | 'sent' | 'trash' | string; // Carpeta (custom:{id} para personalizadas)
  read: boolean;                 // Leído/no leído
  important?: boolean;           // Marcado importante
  flagged?: boolean;             // Con bandera
  
  // Clasificación
  tags?: string[];               // ['provider', 'rsvp', 'contract', etc.]
  labels?: string[];             // Etiquetas visuales
  category?: string;             // Categoría IA
  
  // Adjuntos
  attachments?: Array<{
    name: string;
    filename: string;
    size: number;
    type: string;
    contentType: string;
    url?: string;
    storagePath?: string;
  }>;
  
  // Threading
  threadId?: string;             // Agrupar conversaciones
  inReplyTo?: string;            // ID del email al que responde
  references?: string[];         // Cadena de referencias
  
  // Contexto
  weddingId?: string;            // Boda relacionada (opcional)
  ownerUid: string;              // Usuario propietario
  
  // Automatización
  autoReply?: {
    applied: boolean;
    templateId?: string;
    delayMinutes?: number;
    sentAt?: Timestamp;
  };
  
  scheduled?: {
    sendAt: Timestamp;
    state: 'pending' | 'sending' | 'sent' | 'failed';
    attempts: number;
  };
  
  // Analytics (alimentado por webhooks Mailgun)
  analytics?: {
    messageId?: string;          // ID de Mailgun
    opens: number;
    clicks: number;
    bounces: number;
    complaints: number;
    lastEventAt?: Timestamp;
  };
  
  // Metadata adicional
  metadata?: Record<string, any>; // Datos custom (guestId, contractId, etc.)
  
  // Auditoría
  createdAt: Timestamp;
  updatedAt: Timestamp;
  date: string;                  // ISO string para ordenamiento
  sentAt?: Timestamp;
  via?: 'mailgun' | 'backend' | 'local' | 'record-only';
}
```

---

### Subcolección Usuario: `users/{uid}/mails/{emailId}`

Copia personal del email para cada usuario.

```typescript
// Ruta: users/{uid}/mails/{emailId}
{
  // INCLUYE TODOS los campos de mails/{emailId}
  
  // Campos específicos del usuario
  folder: string;                // Puede ser diferente por usuario
  read: boolean;                 // Estado de lectura personal
  important: boolean;            // Marcado personal
  
  // Carpeta original (para restaurar desde trash)
  originalFolder?: string;
  
  // Sincronización
  syncedAt?: Timestamp;
  syncSource: 'mailgun' | 'manual' | 'automation';
}
```

**Reglas:**
- Cada usuario tiene su propia copia
- El `folder` puede diferir (ej: Owner en inbox, Planner en custom:work)
- El `read` status es independiente
- Sincronización bidireccional con colección global

---

### Colección de Carpetas: `users/{uid}/emailFolders/{folderId}`

```typescript
{
  id: string;                    // custom:uuid
  name: string;                  // Nombre visible
  color?: string;                // Color hex (#FF5722)
  icon?: string;                 // Nombre del icono
  order: number;                 // Orden en sidebar
  system: boolean;               // true para inbox/sent/trash
  
  // Contadores (actualizados por Cloud Function)
  unreadCount: number;
  totalCount: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Carpetas del sistema (no editables):**
- `inbox` (orden: 1)
- `sent` (orden: 2)
- `trash` (orden: 3)

**Carpetas personalizadas:**
- ID: `custom:{uuid}`
- Completamente editables
- Se pueden eliminar (mueve emails a inbox)

---

### Colección de Etiquetas: `users/{uid}/emailTags/{tagId}`

```typescript
{
  id: string;
  name: string;
  color: string;
  
  // Automatización (opcional)
  automationRule?: {
    enabled: boolean;
    condition: 'from' | 'to' | 'subject' | 'body';
    pattern: string;             // Regex o substring
  };
  
  // Estadísticas
  usageCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### Asignación Carpeta-Email: `users/{uid}/emailFolderAssignments/{emailId}`

Preserva carpeta original para restauración desde trash.

```typescript
{
  emailId: string;
  originalFolder: string;        // Carpeta antes de mover a trash
  movedToTrashAt: Timestamp;
}
```

---

## 🔄 FLUJO DE DATOS

### 1. Envío de Email

```mermaid
Frontend → Backend POST /api/mail
    ↓
Backend: mailSendService.sendMailAndPersist()
    ↓
    ├─→ Mailgun API (envío real)
    ↓
    ├─→ Crear documento en mails/{id} (folder: 'sent')
    ├─→ Crear copia en users/{ownerUid}/mails/{id}
    ↓
    └─→ Crear documento inbox para destinatario
        └─→ users/{recipientUid}/mails/{id} (folder: 'inbox')
```

**Reglas:**
1. **Un documento en `mails/`** (global, para búsquedas)
2. **Copia en `users/{ownerUid}/mails/`** (remitente, folder: 'sent')
3. **Copia en `users/{recipientUid}/mails/`** (destinatario, folder: 'inbox')

---

### 2. Recepción de Email (Webhook Mailgun)

```mermaid
Mailgun Webhook → Backend /api/mailgun/webhooks/inbound
    ↓
Backend: Parsear email entrante
    ↓
    ├─→ Crear documento en mails/{id}
    ↓
    ├─→ Resolver destinatario (myWed360Email → uid)
    ├─→ Crear copia en users/{uid}/mails/{id} (folder: 'inbox')
    ↓
    ├─→ Clasificación IA (opcional)
    └─→ Auto-respuesta (si configurada)
```

---

### 3. Mover Email a Carpeta

```mermaid
Frontend → EmailService.moveMail(emailId, 'custom:work')
    ↓
Backend: PUT /api/mail/{emailId}/folder
    ↓
    ├─→ Actualizar users/{uid}/mails/{emailId}.folder
    ├─→ Actualizar mails/{emailId}.folder (sincronización)
    ↓
    └─→ Si carpeta === 'trash':
        └─→ Guardar originalFolder en emailFolderAssignments
```

---

### 4. Vaciar Papelera

```mermaid
Frontend → EmailService.emptyTrash()
    ↓
Backend: DELETE /api/email/trash/empty
    ↓
Query: users/{uid}/mails WHERE folder = 'trash'
    ↓
Batch delete (máx 500 por lote)
    ↓
    ├─→ Eliminar de users/{uid}/mails/
    ├─→ Eliminar de mails/ (si no hay otras referencias)
    └─→ Limpiar emailFolderAssignments
```

---

## 🔐 REGLAS DE FIRESTORE

### `mails/{emailId}`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Colección global - solo lectura por admin
    match /mails/{emailId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo backend (Admin SDK)
    }
  }
}
```

---

### `users/{uid}/mails/{emailId}`

```javascript
match /users/{userId}/mails/{emailId} {
  // Usuario puede leer sus propios emails
  allow read: if request.auth.uid == userId;
  
  // Usuario puede escribir (crear/actualizar) sus emails
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId;
  
  // Usuario puede eliminar sus emails
  allow delete: if request.auth.uid == userId;
}
```

---

### `users/{uid}/emailFolders/{folderId}`

```javascript
match /users/{userId}/emailFolders/{folderId} {
  allow read: if request.auth.uid == userId;
  
  allow create: if request.auth.uid == userId
    && !request.resource.data.system; // No crear carpetas sistema
  
  allow update: if request.auth.uid == userId
    && resource.data.system == false; // No editar carpetas sistema
  
  allow delete: if request.auth.uid == userId
    && resource.data.system == false; // No eliminar carpetas sistema
}
```

---

### `users/{uid}/emailTags/{tagId}`

```javascript
match /users/{userId}/emailTags/{tagId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

### `users/{uid}/emailFolderAssignments/{emailId}`

```javascript
match /users/{userId}/emailFolderAssignments/{emailId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### Endpoints Principales

```
GET    /api/mail                      → Listar emails (por folder)
GET    /api/mail/page                 → Paginación
GET    /api/mail/:id                  → Detalle de email
POST   /api/mail                      → Enviar email
PUT    /api/mail/:id/folder           → Mover a carpeta
POST   /api/mail/:id/read             → Marcar como leído
POST   /api/mail/:id/unread           → Marcar como no leído
DELETE /api/mail/:id                  → Eliminar (mover a trash)
DELETE /api/email/trash/empty         → Vaciar papelera

GET    /api/mail/templates            → Listar plantillas
POST   /api/mail/templates            → Crear plantilla
GET    /api/mail/stats                → Estadísticas

POST   /api/mailgun/send-test         → Test de envío
GET    /api/mailgun/domain-status     → Estado del dominio
POST   /api/mailgun/webhooks/*        → Webhooks (inbound, events, etc.)
```

---

## 📦 SINCRONIZACIÓN ONLINE/OFFLINE

### Estrategia de Caché

```javascript
// utils/EmailCache.js
{
  // Por carpeta
  'folder_inbox': {
    emails: Email[],
    lastSync: Timestamp,
    expiresAt: Timestamp,
  },
  
  'folder_sent': { ... },
  'folder_trash': { ... },
  'folder_custom:uuid': { ... },
  
  // Límites
  maxAgeMs: 5 * 60 * 1000,      // 5 minutos
  maxItemsPerFolder: 200,
}
```

### Reconciliación

```javascript
// Al volver online
async function syncOfflineChanges() {
  const pending = localStorage.getItem('maloveapp_email_pending_ops');
  
  for (const op of pending) {
    if (op.type === 'move') {
      await EmailService.moveMail(op.emailId, op.folder);
    }
    if (op.type === 'delete') {
      await EmailService.deleteMail(op.emailId);
    }
    if (op.type === 'read') {
      await EmailService.markAsRead(op.emailId, op.isRead);
    }
  }
  
  localStorage.removeItem('maloveapp_email_pending_ops');
}
```

---

## 🚨 CASOS ESPECIALES

### 1. Email con Múltiples Destinatarios

**Escenario:** Email enviado a 3 usuarios de MaLoveApp

**Implementación:**
```javascript
// 1 documento en mails/
// 3 documentos en users/{uid}/mails/ (uno por destinatario)

for (const recipient of recipients) {
  const uid = await resolveUidByEmail(recipient);
  if (uid) {
    await db.collection('users').doc(uid).collection('mails').doc(emailId).set({
      ...mailData,
      to: recipient, // Email específico
      folder: 'inbox',
      read: false,
    });
  }
}
```

---

### 2. Email Compartido entre Roles (Owner/Planner)

**Escenario:** Planner necesita ver emails del Owner

**Solución:** NO duplicar. Usar permisos.

```javascript
// Backend valida roles
if (userRole === 'planner' && weddingId) {
  // Leer emails del owner de la boda
  const ownerUid = await getWeddingOwner(weddingId);
  return getUserMails(ownerUid, folder);
}
```

---

### 3. Migración de Emails Existentes

**Si hay datos en `weddings/{id}/emails`:**

```javascript
// scripts/migrateEmailsToUsers.js
async function migrate() {
  const weddings = await db.collection('weddings').get();
  
  for (const weddingDoc of weddings.docs) {
    const weddingId = weddingDoc.id;
    const ownerUid = weddingDoc.data().ownerUid;
    
    const emails = await db.collection('weddings').doc(weddingId)
      .collection('emails').get();
    
    for (const emailDoc of emails.docs) {
      const email = emailDoc.data();
      
      // Crear en colección global
      await db.collection('mails').doc(emailDoc.id).set({
        ...email,
        weddingId,
        ownerUid,
      });
      
      // Crear en subcolección usuario
      await db.collection('users').doc(ownerUid)
        .collection('mails').doc(emailDoc.id).set({
          ...email,
          weddingId,
        });
    }
  }
}
```

---

## 📊 MÉTRICAS Y MONITOREO

### Contadores Agregados

```typescript
// users/{uid}/emailStats
{
  totalEmails: number;
  unreadCount: number;
  
  byFolder: {
    inbox: { total: number, unread: number },
    sent: { total: number, unread: 0 },
    trash: { total: number, unread: number },
    'custom:work': { total: number, unread: number },
  },
  
  lastSync: Timestamp,
}
```

**Actualización:** Cloud Function `onMailWrite`

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [x] Colección `mails` con reglas
- [x] Subcolección `users/{uid}/mails` con reglas
- [x] Endpoints CRUD completos
- [x] `mailSendService.js` usando modelo correcto
- [ ] Cloud Function `onMailWrite` para contadores
- [ ] Job de retención (eliminar trash > 30 días)
- [ ] Webhooks Mailgun configurados

### Frontend
- [x] `EmailService.js` usa backend
- [x] Fallback a Firestore con modelo correcto
- [x] Caché local implementado
- [x] Sincronización offline
- [ ] Migración de componentes legacy
- [ ] Tests actualizados

### Datos
- [ ] Migración de `weddings/{id}/emails` (si existe)
- [x] Carpetas sistema creadas por defecto
- [ ] Índices Firestore optimizados

---

## 🎯 CONCLUSIÓN

**Modelo definitivo:** `users/{uid}/mails` + Colección global `mails`

**Deprecado:** `weddings/{id}/emails`

**Próximos pasos:**
1. Actualizar toda referencia en código a modelo nuevo
2. Migrar datos existentes (si aplica)
3. Actualizar tests
4. Documentar en flujos

---

**Última actualización:** 23 de Octubre de 2025, 5:24am  
**Documento válido hasta:** Indefinido (canónico)
