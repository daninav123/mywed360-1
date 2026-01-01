# 🔍 AUDITORÍA COMPLETA DE BASE DE DATOS

**Fecha:** 30 Diciembre 2025  
**Objetivo:** Verificar que TODA la funcionalidad de la app esté bien organizada en PostgreSQL

---

## 📊 **ESTADO ACTUAL DE LA BD**

### ✅ **LO QUE YA ESTÁ EN POSTGRESQL**

```
TABLAS ACTUALES (11):
├── users               (2 registros)
├── weddings            (16 registros)
├── guests              (251 registros)
├── wedding_access      (16 registros)
├── suppliers           (registros)
├── wedding_suppliers   (registros)
├── craft_webs          (registros)
├── rsvp_responses      (0 registros)
├── supplier_portfolio  (0 registros)
├── planners            (0 registros)
└── refresh_tokens      (registros)
```

### ✅ **DATOS CONSOLIDADOS EN WEDDING (JSON)**

```javascript
model Wedding {
  budgetData  Json?  // ✅ Presupuesto completo
  seatingData Json?  // ✅ Plan de mesas completo
}
```

---

## ❌ **LO QUE FALTA EN LA BD (Crítico)**

Basado en el análisis del código frontend, estas funcionalidades EXISTEN en la app pero NO están en PostgreSQL:

### 🔴 **1. TAREAS / CHECKLIST** (Muy usado)
```
Archivos encontrados: 36 componentes
Hooks: useChecklist.js, useWeddingTasksHierarchy.js
Servicios: taskTemplateService.js, defaultWeddingTasks.js

¿Dónde se guarda ahora?
- ❌ NO está en schema.prisma
- ⚠️ Probablemente en Firebase o localStorage
```

**Necesita tabla:**
```prisma
model Task {
  id          String
  weddingId   String
  title       String
  description String?
  category    String    // checklist, timeline, custom
  status      String    // pending, in_progress, completed
  dueDate     DateTime?
  priority    String?   // high, medium, low
  assignedTo  String?
  completedAt DateTime?
  order       Int       // Para ordenar
  
  wedding     Wedding @relation(...)
}
```

---

### 🔴 **2. TIMELINE / CRONOGRAMA DEL DÍA** (Muy usado)
```
Archivos encontrados: 68 referencias
Hooks: useTimeline.js, useCeremonyTimeline.js
Componentes: 13 componentes de timeline

¿Dónde se guarda ahora?
- ❌ NO está en schema.prisma
- ⚠️ Probablemente en Firebase o localStorage
```

**Necesita tabla o JSON en Wedding:**
```prisma
model Wedding {
  // Opción 1: Campo JSON
  timelineData Json?  // { events: [...], timing: {...} }
  
  // Opción 2: Tabla separada (mejor para búsquedas)
  timelineEvents TimelineEvent[]
}

model TimelineEvent {
  id          String
  weddingId   String
  eventType   String    // ceremony, cocktail, dinner, dance, etc.
  title       String
  startTime   DateTime
  duration    Int       // minutos
  location    String?
  notes       String?
  order       Int
  
  wedding     Wedding @relation(...)
}
```

---

### 🔴 **3. MÚSICA / CANCIONES ESPECIALES** (Muy usado)
```
Archivos encontrados: 296 referencias
Servicios: musicPreferencesService.js
Componentes: MusicPlayerWithAuth, SongSelectorModal, etc.

¿Dónde se guarda ahora?
- ❌ NO está en schema.prisma
- ⚠️ Probablemente en Firebase
```

**Necesita tabla:**
```prisma
model SpecialMoment {
  id          String
  weddingId   String
  momentType  String    // entrance, first_dance, cake, bouquet, etc.
  songTitle   String?
  artist      String?
  spotifyId   String?
  startTime   String?   // "HH:mm" para sincronizar con timeline
  duration    Int?      // segundos
  notes       String?
  
  wedding     Wedding @relation(...)
}

// O más genérico:
model WeddingMusic {
  id          String
  weddingId   String
  category    String    // special_moments, playlist, background
  songs       Json      // [{title, artist, spotifyId, timing}, ...]
  
  wedding     Wedding @relation(...)
}
```

---

### 🟡 **4. FINANZAS - Mejorar estructura**

```
Hook: useFinance.js
Estado actual: budgetData: Json en Wedding
```

**Mejora propuesta:**
```prisma
model Wedding {
  budgetData Json?  // Mantener para datos básicos
  
  // AÑADIR tabla para transacciones individuales
  transactions Transaction[]
}

model Transaction {
  id          String
  weddingId   String
  category    String
  description String
  amount      Float
  type        String    // income, expense
  status      String    // pending, paid, overdue
  dueDate     DateTime?
  paidDate    DateTime?
  supplier    String?
  notes       String?
  
  wedding     Wedding @relation(...)
}
```

---

### 🟡 **5. DOCUMENTOS / CONTRATOS**

```
Componentes: Legal timeline, document management
```

**Necesita tabla:**
```prisma
model Document {
  id          String
  weddingId   String
  type        String    // contract, invoice, permit, other
  title       String
  fileUrl     String?
  supplierId  String?   // Si es de un proveedor
  status      String    // pending, signed, completed
  dueDate     DateTime?
  notes       String?
  
  wedding     Wedding @relation(...)
  supplier    Supplier? @relation(...)
}
```

---

### 🟢 **6. EMAILS / INVITACIONES (Opcional)**

```
Componentes: Email templates, email service
```

**Necesita tabla:**
```prisma
model Email {
  id          String
  weddingId   String
  recipientId String?   // Guest ID si aplica
  type        String    // invitation, reminder, thank_you
  subject     String
  body        String
  status      String    // draft, sent, delivered, opened
  sentAt      DateTime?
  
  wedding     Wedding @relation(...)
  guest       Guest?  @relation(...)
}
```

---

## 📋 **RESUMEN DE LO QUE FALTA**

| Funcionalidad | ¿En BD? | Criticidad | Acción |
|---------------|---------|------------|--------|
| **Tareas/Checklist** | ❌ NO | 🔴 ALTA | Crear tabla `Task` |
| **Timeline día** | ❌ NO | 🔴 ALTA | Crear tabla `TimelineEvent` o JSON |
| **Canciones** | ❌ NO | 🔴 ALTA | Crear tabla `SpecialMoment` |
| **Transacciones** | ⚠️ JSON | 🟡 MEDIA | Crear tabla `Transaction` |
| **Documentos** | ❌ NO | 🟡 MEDIA | Crear tabla `Document` |
| **Emails** | ❌ NO | 🟢 BAJA | Crear tabla `Email` (opcional) |

---

## 🎯 **PROPUESTA DE ACCIÓN**

### **FASE 1: CRÍTICO (Implementar YA)**

1. **Crear tabla `Task`**
   - Migrar tareas desde Firebase/localStorage
   - Checklist de boda completo

2. **Crear tabla `TimelineEvent`**
   - Cronograma del día de la boda
   - Timing de ceremonia, cóctel, banquete, baile

3. **Crear tabla `SpecialMoment` o `WeddingMusic`**
   - Canciones de momentos especiales
   - Playlists

### **FASE 2: MEJORAS (Siguiente paso)**

4. **Crear tabla `Transaction`**
   - Mejor control de gastos
   - Historial de pagos

5. **Crear tabla `Document`**
   - Contratos con proveedores
   - Permisos y documentos legales

### **FASE 3: OPCIONAL (Si hace falta)**

6. **Crear tabla `Email`**
   - Solo si necesitas historial de emails
   - Por ahora puede ser servicio externo

---

## 🔍 **VERIFICACIÓN NECESARIA**

Necesito verificar dónde se guardan estos datos actualmente:

```bash
# ¿Están en Firebase?
# ¿Están en localStorage?
# ¿Se pierden al cerrar sesión?
```

---

## ✅ **CONCLUSIÓN**

**La BD actual tiene lo básico:**
- ✅ Usuarios y autenticación
- ✅ Bodas y acceso multi-usuario
- ✅ Invitados y plan de mesas
- ✅ Proveedores
- ✅ Webs personalizadas

**Pero FALTAN funcionalidades críticas:**
- ❌ Sistema de tareas/checklist
- ❌ Timeline del día de la boda
- ❌ Gestión de música/canciones
- ⚠️ Mejor sistema de finanzas

**Esto significa que probablemente:**
1. Todavía se usa Firebase para algunas cosas
2. Se pierde data al migrar
3. La experiencia no es completa en PostgreSQL

---

## 🎯 **¿QUÉ HACEMOS?**

**Opción 1: Implementar TODO ahora** (3-4 tablas nuevas)
- Task
- TimelineEvent
- SpecialMoment
- Transaction

**Opción 2: Ir por prioridad**
1. Primero Task (las tareas son críticas)
2. Luego Timeline
3. Luego Music
4. Luego Transaction

**Opción 3: Verificar primero**
- Ver dónde se guardan esos datos ahora
- Migrar lo que esté en Firebase
- Implementar lo que falte

---

**¿Qué prefieres hacer?**
