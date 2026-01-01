# 🏗️ PROPUESTA DE ESTRUCTURA V2 - ACLARACIONES

**Fecha:** 30 Diciembre 2025  
**Versión:** 2.0 (con aclaraciones del usuario)

---

## ✅ ACLARACIONES RECIBIDAS

### 1. **Tabla `wedding_access`**
**Pregunta:** ¿Estará dentro de cada wedding?  
**Respuesta:** NO. Es una **tabla independiente** que relaciona usuarios con bodas.

```
wedding_access (tabla propia)
├── userId → users.id
└── weddingId → weddings.id

Es una tabla de relación N:M (muchos usuarios, muchas bodas)
```

---

### 2. **Owners por boda**
**Cambio importante:** Una boda puede tener **2 owners máximo** (la pareja)

**Validación actualizada:**
```javascript
// Al agregar owner a una boda:
const ownersCount = await prisma.weddingAccess.count({
  where: { 
    weddingId: weddingId,
    role: 'OWNER'
  }
});

if (ownersCount >= 2) {
  throw new Error('Una boda solo puede tener máximo 2 owners');
}
```

**Lógica:**
- Owner 1 crea la boda → automáticamente es OWNER
- Owner 1 invita a Owner 2 (su pareja) → también OWNER
- Ambos tienen control total sobre la boda
- Ninguno de los 2 puede crear otra boda (límite de 1 boda por usuario owner)

---

### 3. **Tabla `emails`**
**Pregunta:** ¿No estaba ya en users?  
**Respuesta:** Revisando schema actual... **NO existe tabla `emails` en el schema actual**.

**Campo actual en `users`:**
```javascript
model User {
  email String @unique  // ⚠️ Solo 1 email por usuario
}
```

**Propuesta:**
- ❌ **NO crear** tabla `emails` nueva
- ✅ Mantener `email` en `users` (1 email por usuario)
- ✅ Si necesitas múltiples emails → agregar campo `alternativeEmails: String[]`

**O si realmente necesitas historial de emails enviados:**
- Crear tabla `sent_emails` para tracking (no confundir con emails de usuario)

---

## 🎯 PROPUESTA ACTUALIZADA

### **1. Tabla `wedding_access` - INDEPENDIENTE** ⭐

```javascript
// ✅ Tabla PROPIA (no dentro de wedding)
model WeddingAccess {
  id          String        @id @default(uuid())
  userId      String        // FK → users.id
  weddingId   String        // FK → weddings.id
  
  // Rol en esta boda
  role        WeddingRole   @default(VIEWER)
  // OWNER, PLANNER, ASSISTANT, VIEWER
  
  // Permisos opcionales granulares
  permissions Json?         
  // Ej: { canEditGuests: true, canEditBudget: false }
  
  // Estado
  status      String        @default("active")
  
  // Auditoría
  invitedBy   String?       // userId del que invitó
  invitedAt   DateTime      @default(now())
  
  // Relaciones
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  wedding     Wedding       @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  
  // Un usuario solo puede tener un rol por boda
  @@unique([userId, weddingId])
  @@index([weddingId])
  @@index([userId])
  @@index([role])
  @@map("wedding_access")
}

enum WeddingRole {
  OWNER       // Máximo 2 por boda
  PLANNER     // Planificador profesional
  ASSISTANT   // Asistente con permisos
  VIEWER      // Solo lectura
}
```

**Cómo funciona:**
```javascript
// Ejemplo: Boda con 2 owners y 1 assistant

WeddingAccess:
├── { userId: "user1", weddingId: "boda1", role: "OWNER" }
├── { userId: "user2", weddingId: "boda1", role: "OWNER" }    // Pareja
└── { userId: "user3", weddingId: "boda1", role: "ASSISTANT" } // Invitado
```

---

### **2. Tabla `users` (Actualizada)**

```javascript
model User {
  id            String    @id @default(uuid())
  email         String    @unique // ✅ Mantener como está
  passwordHash  String?
  
  // ⭐ NUEVO: Emails alternativos (opcional)
  alternativeEmails String[]  // Array: ["email2@..", "email3@.."]
  
  // Información personal
  displayName   String?
  firstName     String?
  lastName      String?
  phoneNumber   String?
  photoURL      String?
  
  // ⭐ NUEVO: Rol global del usuario
  role          UserRole  @default(OWNER)
  
  // Auth
  emailVerified Boolean   @default(false)
  provider      String    @default("email")
  lastLogin     DateTime?
  
  // Estado
  active        Boolean   @default(true)
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relaciones
  weddingAccess WeddingAccess[]   // ⭐ Bodas a las que tiene acceso
  supplierProfile Supplier?       // Si role=SUPPLIER
  plannerProfile  Planner?        // Si role=PLANNER
  refreshTokens RefreshToken[]
  
  @@index([email])
  @@index([role])
  @@map("users")
}

enum UserRole {
  OWNER      // Usuario que crea bodas (1 boda máximo)
  ASSISTANT  // Asistente (N bodas, invitado)
  PLANNER    // Planificador profesional (N bodas)
  SUPPLIER   // Proveedor (sin acceso a bodas)
  ADMIN      // Admin (solo tú)
}
```

---

### **3. Tabla `weddings` (Actualizada)**

```javascript
model Wedding {
  id                  String    @id @default(uuid())
  
  // ❌ Ya NO tiene userId directo
  // ✅ Owners se identifican via wedding_access con role=OWNER
  
  // Información básica
  coupleName          String
  weddingDate         DateTime
  
  // ⭐ Ubicaciones consolidadas
  venues              Json?     
  // { 
  //   ceremony: { name, address, time, coordinates },
  //   reception: { name, address, time, coordinates },
  //   banquet: { name, address, time, coordinates }
  // }
  
  // Configuración
  numGuests           Int       @default(0)
  weddingStyle        String?
  colorScheme         String?
  rsvpDeadline        DateTime?
  
  // Información adicional
  giftAccount         String?
  transportation      String?
  importantInfo       String?
  
  // ⭐ Presupuesto consolidado (en lugar de tabla separada)
  budgetData          Json?     
  // {
  //   totalBudget: 20000,
  //   items: [
  //     { category: "venue", budget: 5000, spent: 4500 },
  //     { category: "catering", budget: 8000, spent: 0 }
  //   ]
  // }
  
  // ⭐ Seating plan consolidado (en lugar de tabla separada)
  seatingData         Json?     
  // {
  //   layout: {...},
  //   tables: [
  //     { number: 1, capacity: 8, guests: ["guest1", "guest2"] }
  //   ]
  // }
  
  // Estado
  status              String    @default("active")
  
  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relaciones
  access              WeddingAccess[]     // ⭐ Usuarios con acceso
  guests              Guest[]
  suppliers           WeddingSupplier[]
  websites            WeddingWebsite[]    // Renombrado de craft_webs
  rsvpResponses       RsvpResponse[]      // ⭐ Directo (no via webId)
  
  @@index([weddingDate])
  @@index([status])
  @@map("weddings")
}
```

---

## 🔒 LÓGICA DE NEGOCIO ACTUALIZADA

### **Crear una boda (con 1 owner)**

```javascript
async function createWedding(userId, weddingData) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // 1. Verificar que sea OWNER
  if (user.role !== 'OWNER') {
    throw new Error('Solo usuarios OWNER pueden crear bodas');
  }
  
  // 2. Verificar que no tenga ya una boda como OWNER
  const existingWeddingsAsOwner = await prisma.weddingAccess.count({
    where: { 
      userId: userId,
      role: 'OWNER'
    }
  });
  
  if (existingWeddingsAsOwner > 0) {
    throw new Error('Ya tienes una boda. Los OWNER solo pueden tener 1 boda.');
  }
  
  // 3. Crear boda y acceso
  const wedding = await prisma.$transaction(async (tx) => {
    // Crear la boda
    const newWedding = await tx.wedding.create({
      data: weddingData
    });
    
    // Crear acceso para el creator como OWNER
    await tx.weddingAccess.create({
      data: {
        userId: userId,
        weddingId: newWedding.id,
        role: 'OWNER'
      }
    });
    
    return newWedding;
  });
  
  return wedding;
}
```

---

### **Invitar al segundo owner (pareja)**

```javascript
async function invitePartner(currentUserId, weddingId, partnerEmail) {
  // 1. Verificar que currentUser es OWNER de esta boda
  const access = await prisma.weddingAccess.findUnique({
    where: {
      userId_weddingId: { userId: currentUserId, weddingId }
    }
  });
  
  if (!access || access.role !== 'OWNER') {
    throw new Error('Solo un owner puede invitar a su pareja');
  }
  
  // 2. Verificar que no haya ya 2 owners
  const ownersCount = await prisma.weddingAccess.count({
    where: { 
      weddingId: weddingId,
      role: 'OWNER'
    }
  });
  
  if (ownersCount >= 2) {
    throw new Error('Esta boda ya tiene 2 owners');
  }
  
  // 3. Buscar o crear usuario partner
  let partner = await prisma.user.findUnique({ 
    where: { email: partnerEmail }
  });
  
  if (!partner) {
    // Crear cuenta para la pareja
    partner = await prisma.user.create({
      data: {
        email: partnerEmail,
        role: 'OWNER',
        // Enviar email de invitación...
      }
    });
  }
  
  // 4. Verificar que partner no tenga ya otra boda
  const partnerWeddings = await prisma.weddingAccess.count({
    where: { 
      userId: partner.id,
      role: 'OWNER'
    }
  });
  
  if (partnerWeddings > 0) {
    throw new Error('Tu pareja ya tiene una boda registrada');
  }
  
  // 5. Agregar como segundo OWNER
  await prisma.weddingAccess.create({
    data: {
      userId: partner.id,
      weddingId: weddingId,
      role: 'OWNER',
      invitedBy: currentUserId
    }
  });
  
  return partner;
}
```

---

### **Invitar assistants o planners**

```javascript
async function inviteToWedding(ownerId, weddingId, inviteEmail, role) {
  // 1. Verificar que quien invita es OWNER
  const ownerAccess = await prisma.weddingAccess.findUnique({
    where: {
      userId_weddingId: { userId: ownerId, weddingId }
    }
  });
  
  if (!ownerAccess || ownerAccess.role !== 'OWNER') {
    throw new Error('Solo owners pueden invitar assistants/planners');
  }
  
  // 2. Validar rol a invitar
  if (role === 'OWNER') {
    // Usar invitePartner() para este caso
    throw new Error('Usa invitePartner() para invitar al segundo owner');
  }
  
  if (!['ASSISTANT', 'PLANNER', 'VIEWER'].includes(role)) {
    throw new Error('Rol inválido');
  }
  
  // 3. Buscar o crear usuario
  let user = await prisma.user.findUnique({ 
    where: { email: inviteEmail }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: inviteEmail,
        role: role === 'PLANNER' ? 'PLANNER' : 'ASSISTANT',
      }
    });
  }
  
  // 4. Verificar que no tenga ya acceso
  const existingAccess = await prisma.weddingAccess.findUnique({
    where: {
      userId_weddingId: { userId: user.id, weddingId }
    }
  });
  
  if (existingAccess) {
    throw new Error('Este usuario ya tiene acceso a esta boda');
  }
  
  // 5. Crear acceso
  await prisma.weddingAccess.create({
    data: {
      userId: user.id,
      weddingId: weddingId,
      role: role,
      invitedBy: ownerId
    }
  });
  
  return user;
}
```

---

### **Verificar acceso a una boda**

```javascript
async function canAccessWedding(userId, weddingId, requiredRole = null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Admin siempre puede
  if (user.role === 'ADMIN') return true;
  
  // Suppliers NO pueden acceder a bodas
  if (user.role === 'SUPPLIER') return false;
  
  // Verificar acceso específico
  const access = await prisma.weddingAccess.findUnique({
    where: {
      userId_weddingId: { userId, weddingId }
    }
  });
  
  if (!access || access.status !== 'active') return false;
  
  // Si se requiere un rol específico, verificar jerarquía
  if (requiredRole) {
    const roleHierarchy = {
      'VIEWER': 1,
      'ASSISTANT': 2,
      'PLANNER': 3,
      'OWNER': 4
    };
    
    return roleHierarchy[access.role] >= roleHierarchy[requiredRole];
  }
  
  return true;
}

// Uso:
if (!await canAccessWedding(userId, weddingId, 'OWNER')) {
  throw new Error('Solo owners pueden hacer esto');
}
```

---

## 📊 RESUMEN DE CAMBIOS

### **Estructura final:**

```
users (mantener email único)
├── wedding_access (tabla nueva independiente)
│   └── Controla quién accede a qué boda
│
weddings (sin userId directo)
├── budgetData: Json (consolidado)
├── seatingData: Json (consolidado)
└── venues: Json (consolidado)

suppliers (userId unique)
└── portfolioImages: Json[]

planners (userId unique)
└── portfolioImages: Json[]
```

### **Validaciones clave:**

1. ✅ OWNER → Máximo 1 boda
2. ✅ Boda → Máximo 2 OWNERS
3. ✅ ASSISTANT/PLANNER → N bodas
4. ✅ SUPPLIER → Sin acceso a wedding_access
5. ✅ ADMIN → Bypass total

---

## 📐 DIAGRAMA ACTUALIZADO

```
┌─────────┐
│  User   │ (email único)
│         │
│ role    │ OWNER / ASSISTANT / PLANNER / SUPPLIER / ADMIN
└────┬────┘
     │
     │1
     │
     │N
┌────┴─────────────┐ [TABLA INDEPENDIENTE]
│ WeddingAccess    │
│                  │
│ userId           │ ─┐
│ weddingId        │  │ Relación N:M
│ role             │  │
│ (OWNER max 2)    │  │
└────┬─────────────┘  │
     │                │
     │N               │
     │                │
     │1               │
┌────┴────┐          │
│ Wedding │◄─────────┘
│         │
│ budgetData: Json
│ seatingData: Json
│ venues: Json
└─────────┘
     │
     ├─N→ Guest
     ├─N→ RsvpResponse (directo)
     └─N→ WeddingSupplier
```

---

## ✅ CONFIRMACIÓN DE ACLARACIONES

1. **`wedding_access`** → ✅ Tabla INDEPENDIENTE (no dentro de wedding)
2. **2 owners por boda** → ✅ Validación implementada
3. **Tabla `emails`** → ✅ NO crear (mantener `email` en users)

---

## ❓ ÚLTIMA CONFIRMACIÓN

**¿Esta estructura V2 es correcta?**

Si confirmas, procedo con:
1. Crear migración Prisma
2. Scripts de migración de datos
3. Actualizar lógica del backend
4. Tests de validación

---

**Estado:** 🟡 Esperando aprobación V2
