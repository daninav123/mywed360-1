# 🏗️ PROPUESTA DE ESTRUCTURA - SISTEMA DE ROLES Y PERMISOS

**Fecha:** 30 Diciembre 2025  
**Estado:** Propuesta para revisión (NO implementado)

---

## 📋 REQUISITOS IDENTIFICADOS

### **Tipos de Usuario**
1. **Owner** (Dueño de boda)
   - ✅ Puede tener **1 sola boda**
   - ✅ Control total sobre su boda
   - ✅ Puede invitar assistants/planners

2. **Assistant** (Asistente)
   - ✅ Acceso a **múltiples bodas**
   - ✅ Permisos delegados por owner
   - ✅ No puede crear bodas

3. **Planner** (Planificador profesional)
   - ✅ Acceso a **múltiples bodas**
   - ✅ Gestiona bodas de clientes
   - ✅ Perfil profesional público

4. **Supplier** (Proveedor)
   - ✅ Acceso **solo a panel de suppliers**
   - ✅ Sin acceso a datos de bodas (salvo contrataciones)
   - ✅ Perfil público de negocio

5. **Admin** (Administrador)
   - ✅ **Solo tú**
   - ✅ Acceso total al panel admin
   - ✅ Sin restricciones

### **Lógica de Asociación**
```
Emails → User (cada usuario tiene sus emails)
Boda data → Wedding (datos específicos de cada boda)
Acceso → WeddingAccess (quién puede ver/editar cada boda)
```

---

## 🎯 PROPUESTA DE ESTRUCTURA

### **1. Tabla `users` (Refactorizada)**

```javascript
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?
  
  // Información personal
  displayName   String?
  firstName     String?
  lastName      String?
  phoneNumber   String?
  photoURL      String?
  
  // Rol del usuario
  role          UserRole  @default(OWNER)  // ⭐ NUEVO
  
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
  supplierProfile Supplier?       // ⭐ Perfil de proveedor (si role=SUPPLIER)
  plannerProfile  Planner?        // ⭐ Perfil de planner (si role=PLANNER)
  emails        Email[]           // ⭐ Emails del usuario
  refreshTokens RefreshToken[]
  
  @@index([email])
  @@index([role])
  @@map("users")
}

// ⭐ NUEVO: Enum de roles
enum UserRole {
  OWNER      // Dueño de boda (1 boda)
  ASSISTANT  // Asistente (N bodas)
  PLANNER    // Planificador (N bodas)
  SUPPLIER   // Proveedor (sin acceso a bodas)
  ADMIN      // Admin (tú)
}
```

---

### **2. Tabla `wedding_access` (NUEVA)**

```javascript
// ⭐ TABLA NUEVA: Control de acceso a bodas
model WeddingAccess {
  id          String        @id @default(uuid())
  userId      String
  weddingId   String
  
  // Rol en esta boda específica
  role        WeddingRole   @default(VIEWER)
  
  // Permisos específicos (opcional, por si necesitas granularidad)
  permissions Json?         // { canEditGuests, canEditBudget, canInviteOthers }
  
  // Estado
  status      String        @default("active") // active, revoked
  
  // Metadata
  invitedBy   String?       // userId del que invitó
  invitedAt   DateTime      @default(now())
  
  // Relaciones
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  wedding     Wedding       @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  
  // Un usuario solo puede tener un rol por boda
  @@unique([userId, weddingId])
  @@index([weddingId])
  @@index([userId])
  @@map("wedding_access")
}

// ⭐ NUEVO: Roles dentro de una boda
enum WeddingRole {
  OWNER       // Creador de la boda (control total)
  PLANNER     // Planificador asignado
  ASSISTANT   // Asistente con permisos
  VIEWER      // Solo lectura
}
```

---

### **3. Tabla `weddings` (Refactorizada)**

```javascript
model Wedding {
  id                  String    @id @default(uuid())
  
  // ⭐ CAMBIO: Ya NO tiene userId directo
  // El owner se determina por wedding_access con role=OWNER
  
  // Información básica
  coupleName          String
  weddingDate         DateTime
  
  // Ubicaciones (consolidado)
  venues              Json?     // { ceremony, reception, banquet }
  
  // Configuración
  numGuests           Int       @default(0)
  weddingStyle        String?
  colorScheme         String?
  rsvpDeadline        DateTime?
  
  // Información adicional
  giftAccount         String?
  transportation      String?
  importantInfo       String?
  
  // ⭐ NUEVO: Presupuesto y seating consolidados
  budgetData          Json?     // Presupuesto completo
  seatingData         Json?     // Plan de mesas
  
  // Estado
  status              String    @default("active")
  
  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relaciones
  access              WeddingAccess[]     // ⭐ Usuarios con acceso
  guests              Guest[]
  suppliers           WeddingSupplier[]
  websites            WeddingWebsite[]    // ⭐ Renombrado de craft_webs
  rsvpResponses       RsvpResponse[]      // ⭐ Ahora relacionado directamente
  
  @@index([weddingDate])
  @@index([status])
  @@map("weddings")
}
```

---

### **4. Tabla `emails` (NUEVA)**

```javascript
// ⭐ TABLA NUEVA: Emails asociados a usuarios
model Email {
  id          String    @id @default(uuid())
  userId      String
  
  // Información del email
  from        String
  to          String[]  // Array de destinatarios
  cc          String[]?
  bcc         String[]?
  
  subject     String
  body        String    // HTML content
  bodyText    String?   // Plain text version
  
  // Metadata
  status      String    @default("draft") // draft, sent, failed
  sentAt      DateTime?
  
  // Tracking
  opens       Int       @default(0)
  clicks      Int       @default(0)
  
  // Relación con boda (opcional)
  weddingId   String?
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relaciones
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([sentAt])
  @@map("emails")
}
```

---

### **5. Tabla `suppliers` (Refactorizada)**

```javascript
model Supplier {
  id              String    @id @default(uuid())
  userId          String    @unique  // ⭐ Ahora UNIQUE (1 perfil por usuario)
  
  // Información del negocio
  businessName    String
  category        String
  description     String?
  
  // Contacto
  email           String
  phone           String?
  website         String?
  
  // Ubicación
  address         String?
  city            String?
  country         String?
  
  // Redes sociales
  instagram       String?
  facebook        String?
  
  // Portfolio (consolidado)
  portfolioImages Json[]    // ⭐ Array de { url, title, description }
  
  // Servicios
  services        Json?
  priceRange      String?
  
  // Rating
  rating          Float     @default(0)
  reviewCount     Int       @default(0)
  
  // Estado
  verified        Boolean   @default(false)
  featured        Boolean   @default(false)
  active          Boolean   @default(true)
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relaciones
  user            User      @relation(fields: [userId], references: [id])
  contracts       WeddingSupplier[]  // ⭐ Renombrado de weddings
  
  @@index([userId])
  @@index([category])
  @@index([city])
  @@index([verified])
  @@map("suppliers")
}
```

---

### **6. Tabla `planners` (Refactorizada)**

```javascript
model Planner {
  id              String    @id @default(uuid())
  userId          String    @unique  // ⭐ Ahora UNIQUE (1 perfil por usuario)
  
  // Información profesional
  businessName    String
  description     String?
  bio             String?
  
  // Contacto
  email           String
  phone           String?
  website         String?
  
  // Ubicación
  city            String?
  country         String?
  
  // Portfolio
  portfolioImages Json[]    // ⭐ Igual que suppliers
  
  // Experiencia
  yearsExperience Int?
  specialties     String[]? // Array de especialidades
  
  // Rating
  rating          Float     @default(0)
  reviewCount     Int       @default(0)
  
  // Estado
  verified        Boolean   @default(false)
  active          Boolean   @default(true)
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relaciones
  user            User      @relation(fields: [userId], references: [id])
  // ⭐ Acceso a bodas mediante WeddingAccess
  
  @@index([userId])
  @@index([city])
  @@index([verified])
  @@map("planners")
}
```

---

### **7. Tabla `guests` (Sin cambios mayores)**

```javascript
model Guest {
  id                  String    @id @default(uuid())
  weddingId           String
  
  // ⭐ REMOVIDO: userId (invitados no son usuarios del sistema)
  
  // Información del invitado
  name                String
  email               String?
  phone               String?
  
  // RSVP
  confirmed           Boolean   @default(false)
  status              String    @default("pending")
  companions          Int       @default(0)
  dietaryRestrictions String?
  notes               String?
  
  // Seating
  tableNumber         Int?
  seatNumber          Int?
  
  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relaciones
  wedding             Wedding   @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  rsvpResponses       RsvpResponse[]  // ⭐ Relación actualizada
  
  @@index([weddingId])
  @@index([email])
  @@map("guests")
}
```

---

### **8. Tabla `rsvp_responses` (Refactorizada)**

```javascript
model RsvpResponse {
  id          String    @id @default(uuid())
  weddingId   String    // ⭐ CAMBIADO: Ahora apunta a wedding directamente
  guestId     String?   // Opcional (puede ser invitado no registrado)
  
  // Información de la respuesta
  name        String
  email       String
  status      String    // confirmed, declined
  companions  Int       @default(0)
  dietaryRestrictions String?
  notes       String?
  
  // Metadata
  createdAt   DateTime  @default(now())
  
  // Relaciones
  wedding     Wedding   @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  guest       Guest?    @relation(fields: [guestId], references: [id])
  
  @@index([weddingId])
  @@index([email])
  @@map("rsvp_responses")
}
```

---

## 📊 RESUMEN DE CAMBIOS

### **Tablas NUEVAS** ⭐
1. `wedding_access` - Control de acceso multi-usuario a bodas
2. `emails` - Emails asociados a usuarios

### **Tablas ELIMINADAS** ❌
1. `budgets` → Consolidado en `weddings.budgetData`
2. `seating_plans` → Consolidado en `weddings.seatingData`
3. `supplier_portfolio` → Consolidado en `suppliers.portfolioImages`

### **Tablas REFACTORIZADAS** 🔄
1. `users` - Agregado `role` enum
2. `weddings` - Removido `userId`, agregado `budgetData` y `seatingData`
3. `suppliers` - `userId` ahora UNIQUE, portfolio como JSON
4. `planners` - `userId` ahora UNIQUE, relacionado via `wedding_access`
5. `guests` - Removido `userId` (invitados ≠ usuarios)
6. `rsvp_responses` - `weddingId` en lugar de `webId`

### **Tablas RENOMBRADAS** 🏷️
1. `craft_webs` → `wedding_websites`
2. `wedding_suppliers` → `wedding_supplier_contracts`

---

## 🎯 LÓGICA DE ROLES

### **Owner (Dueño de boda)**
```javascript
// Crear boda
const user = await prisma.user.findUnique({ where: { id: userId } });

// Verificar que no tenga ya una boda
const existingWeddings = await prisma.weddingAccess.count({
  where: { 
    userId: user.id,
    role: 'OWNER'
  }
});

if (existingWeddings > 0 && user.role === 'OWNER') {
  throw new Error('Owners solo pueden tener 1 boda');
}

// Crear boda y acceso
const wedding = await prisma.wedding.create({ data: {...} });
await prisma.weddingAccess.create({
  data: {
    userId: user.id,
    weddingId: wedding.id,
    role: 'OWNER'
  }
});
```

### **Assistant/Planner (Múltiples bodas)**
```javascript
// Invitar asistente a una boda
await prisma.weddingAccess.create({
  data: {
    userId: assistantId,
    weddingId: weddingId,
    role: 'ASSISTANT', // o 'PLANNER'
    invitedBy: ownerId
  }
});
```

### **Supplier (Sin acceso a bodas)**
```javascript
// Los suppliers NO tienen registros en wedding_access
// Solo acceden a:
// 1. Su perfil (suppliers)
// 2. Sus contrataciones (wedding_supplier_contracts)

const supplierDashboard = await prisma.supplier.findUnique({
  where: { userId: user.id },
  include: {
    contracts: {
      include: {
        wedding: {
          select: { 
            coupleName: true,
            weddingDate: true
            // Solo info básica, no detalles sensibles
          }
        }
      }
    }
  }
});
```

### **Admin (Acceso total)**
```javascript
// Middleware de autenticación
if (user.role === 'ADMIN') {
  // Bypass de todas las restricciones
  return next();
}
```

---

## 🔒 SISTEMA DE PERMISOS

### **Verificar acceso a una boda**
```javascript
async function canAccessWedding(userId: string, weddingId: string, requiredRole?: WeddingRole) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Admin siempre tiene acceso
  if (user.role === 'ADMIN') return true;
  
  // Verificar acceso específico
  const access = await prisma.weddingAccess.findUnique({
    where: {
      userId_weddingId: { userId, weddingId }
    }
  });
  
  if (!access || access.status !== 'active') return false;
  
  // Si se requiere un rol específico, verificar
  if (requiredRole) {
    const roleHierarchy = ['VIEWER', 'ASSISTANT', 'PLANNER', 'OWNER'];
    const userRoleIndex = roleHierarchy.indexOf(access.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }
  
  return true;
}
```

---

## 📐 DIAGRAMA ENTIDAD-RELACIÓN

```
┌──────────┐
│   User   │
│          │
│ role: enum
└────┬─────┘
     │
     │1
     │
     │N
┌────┴────────────┐
│ WeddingAccess   │ [NUEVA]
│                 │
│ role: WeddingRole
└────┬────────────┘
     │
     │N
     │
     │1
┌────┴─────┐
│ Wedding  │
│          │
│ budgetData: Json
│ seatingData: Json
└──────────┘
     │
     ├──N→ Guest
     ├──N→ RsvpResponse  (✅ Ahora directo)
     ├──N→ WeddingWebsite
     └──N→ WeddingSupplierContract


User (role=SUPPLIER) ─1:1→ Supplier
User (role=PLANNER)  ─1:1→ Planner
User ─1:N→ Email  [NUEVA]
```

---

## 🚀 BENEFICIOS DE ESTA ESTRUCTURA

### ✅ **Separación clara de roles**
- Cada usuario tiene un rol definido
- Permisos granulares por boda
- Un usuario puede ser owner, assistant o planner según contexto

### ✅ **Multi-boda para assistants/planners**
- `WeddingAccess` permite acceso a N bodas
- Control fino de permisos por boda
- Auditoría de quién invitó a quién

### ✅ **Owners limitados a 1 boda**
- Validación en lógica de negocio
- Owner identificado por `WeddingAccess.role = OWNER`

### ✅ **Suppliers aislados**
- Sin acceso a `wedding_access`
- Solo ven info necesaria via contratos
- Perfil público separado

### ✅ **Emails asociados a usuario**
- Cada usuario tiene su historial de emails
- Pueden estar o no relacionados con una boda
- Tracking individual

### ✅ **Datos de boda centralizados**
- Budget, seating, venues → dentro de `wedding`
- Menos queries, más eficiencia
- Transacciones atómicas

---

## 🎬 PRÓXIMOS PASOS

**1. Revisión de propuesta**
- ¿Esta estructura cumple tus requisitos?
- ¿Falta algún caso de uso?
- ¿Algún cambio necesario?

**2. Plan de migración**
- Si apruebas, creo plan detallado de migración
- Estimo tiempo y riesgos
- Defino orden de implementación

**3. Implementación progresiva**
- Sprint 1: Tablas nuevas + migraciones de datos
- Sprint 2: Actualizar Prisma schema
- Sprint 3: Actualizar lógica de negocio
- Sprint 4: Tests y validación

---

## ❓ PREGUNTAS PARA TI

1. **¿Un owner puede invitar assistants a su boda?** → Asumo que SÍ
2. **¿Un planner puede crear bodas para sus clientes?** → Asumo que SÍ
3. **¿Los suppliers pueden ver datos básicos de bodas contratadas?** → Asumo que SÍ (nombre, fecha)
4. **¿Un usuario puede cambiar de rol (ej: de OWNER a PLANNER)?** → Asumo que NO (o con restricciones)
5. **¿Los emails se envían desde el usuario o desde el sistema?** → Asumo que desde usuario

---

**Estado:** 🟡 **Pendiente de aprobación**  
**¿Procedo con esta estructura?**
