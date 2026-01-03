# 🔍 ANÁLISIS DE ESTRUCTURA DE BASE DE DATOS

**Fecha:** 30 Diciembre 2025  
**Base de Datos:** PostgreSQL (post-migración desde Firebase)  
**ORM:** Prisma

---

## 📋 RESUMEN EJECUTIVO

**Problema detectado:** Estructura creció orgánicamente sin arquitectura clara.  
**Impacto:** ⚠️ Medio - Funciona pero dificulta mantenimiento y escalabilidad.  
**Recomendación:** Refactorizar moderadamente para mejorar organización lógica.

---

## 📊 ESTRUCTURA ACTUAL (12 Tablas)

### **Módulo 1: Autenticación y Usuarios** ✅
```
users                 (👤 Usuarios del sistema)
├── refresh_tokens    (🔑 Tokens JWT)
```

**Diseño:** ✅ **Correcto**
- Separación clara entre usuarios y autenticación
- Relación 1:N correcta
- Cascade delete apropiado

---

### **Módulo 2: Bodas (Core)** ⚠️
```
weddings              (💒 Bodas)
├── guests            (👥 Invitados)
├── budget            (💰 Presupuesto) [1:1]
├── seating_plans     (🎨 Plan de mesas) [1:1]
├── craft_webs        (🌐 Webs personalizadas) [1:N]
└── wedding_suppliers (📋 Proveedores contratados) [N:M]
```

**Diseño:** ⚠️ **Mejorable**

#### **Problemas detectados:**

1. **`budget` y `seating_plans` como tablas separadas (1:1)**
   - ❌ Deberían ser campos JSON en `weddings`
   - 🔴 **Impacto:** 2 queries adicionales innecesarias
   - 💡 **Solución:** Migrar a `budgetData: Json?` y `seatingData: Json?`

2. **`craft_webs` sin relación clara**
   - ⚠️ Tiene `weddingId` Y `userId` (redundante)
   - ⚠️ Mezcla concepto de "web" con "boda"
   - 💡 **Solución:** Debería llamarse `wedding_websites` y eliminar `userId`

3. **Campos inconsistentes en `weddings`**
   ```javascript
   celebrationPlace    // Lugar ceremonia
   celebrationAddress  // Dirección ceremonia
   banquetPlace        // Lugar banquete
   receptionAddress    // Dirección recepción
   ```
   ❌ Mezclados sin estructura clara
   
   💡 **Mejor estructura:**
   ```javascript
   venues: Json {
     ceremony: { name, address, time },
     reception: { name, address, time },
     banquet: { name, address, time }
   }
   ```

---

### **Módulo 3: Invitados** ✅
```
guests                (👥 Invitados)
└── rsvp_responses    (📨 Respuestas RSVP públicas)
```

**Diseño:** ⚠️ **Problemático**

#### **Problema CRÍTICO:**
- `guests` vinculado a `weddings` ✅
- `rsvp_responses` vinculado a `craft_webs.slug` ❌

**Inconsistencia:**
```javascript
// guests (tabla principal)
weddingId: String     // FK a weddings ✅

// rsvp_responses (tabla secundaria)
webId: String         // FK a craft_webs.slug ❌
guestId: String?      // FK opcional a guests ⚠️
```

🔴 **Problema:** RSVP no relaciona directamente con `weddings`

💡 **Solución:**
```javascript
rsvp_responses {
  weddingId: String   // FK a weddings ✅
  guestId: String?    // FK opcional a guests
  // Eliminar webId
}
```

---

### **Módulo 4: Proveedores** ⚠️
```
suppliers                (🏢 Proveedores)
├── supplier_portfolio   (📸 Portfolio)
└── wedding_suppliers    (📋 Relación N:M con bodas)
```

**Diseño:** ⚠️ **Mejorable**

#### **Problemas:**

1. **`supplier_portfolio` como tabla separada**
   - ❌ Portfolio podría ser `images: Json[]`
   - 🔴 1 query adicional por cada proveedor
   
2. **`wedding_suppliers` tiene campos redundantes**
   ```javascript
   status: String      // contacted, quoted, hired
   budget: Float?
   notes: String?
   ```
   💡 Debería llamarse `wedding_supplier_contracts` para claridad

---

### **Módulo 5: Planners** ⚠️
```
planners              (👨‍💼 Wedding planners)
```

**Diseño:** ⚠️ **Aislado**

#### **Problema:**
- No se relaciona con `weddings` ❌
- No se relaciona con `users` más allá de `userId`
- Parece agregado a último momento sin integración

💡 **Solución:**
- Agregar `WeddingPlanner` (N:M) si los planners gestionan bodas
- O eliminar si no se usa

---

## 🔴 PROBLEMAS CRÍTICOS DETECTADOS

### 1. **Relaciones 1:1 innecesarias**
```
❌ budget (1:1)         → Debería ser budgetData: Json en weddings
❌ seating_plans (1:1)  → Debería ser seatingData: Json en weddings
```

**Impacto:**
- 2 queries adicionales por cada boda
- Mayor complejidad en migraciones
- Dificulta transacciones atómicas

---

### 2. **Inconsistencia en relaciones RSVP**
```
❌ rsvp_responses.webId → craft_webs.slug
✅ Debería ser: rsvp_responses.weddingId → weddings.id
```

**Problema:** Si se elimina la web, se pierden los RSVP

---

### 3. **Campos JSON sin validación**
```javascript
services: Json?        // En suppliers - sin estructura
items: Json            // En budgets - sin schema
tables: Json           // En seating_plans - sin validación
```

⚠️ **Riesgo:** Datos inconsistentes, difícil de consultar

💡 **Solución:** Definir Zod schemas o tipos TypeScript estrictos

---

### 4. **Duplicación de datos de ubicación**
```javascript
// En Guest
userId: String?       // Opcional, pero ¿para qué?

// En CraftWeb  
userId: String        // Redundante si ya tiene weddingId
```

---

### 5. **Tabla `planners` huérfana**
```
❌ Sin relación con weddings
❌ Sin casos de uso claros
❌ Mismos campos que suppliers
```

💡 **Opción 1:** Fusionar con `suppliers` como categoría  
💡 **Opción 2:** Eliminar si no se usa

---

## ✅ ACIERTOS EN EL DISEÑO

### 1. **Separación User/Guest** ✅
```
User → Usuario del sistema (cuenta)
Guest → Invitado a una boda (sin cuenta necesaria)
```

### 2. **Cascade Deletes bien implementados** ✅
```
users → weddings → guests (CASCADE)
weddings → budget (CASCADE)
```

### 3. **Índices en campos frecuentes** ✅
```
@@index([email])
@@index([weddingDate])
@@index([category])
```

---

## 🎯 PROPUESTA DE REFACTORIZACIÓN

### **Prioridad ALTA** 🔴

#### 1. Consolidar budget y seating_plans en weddings
```javascript
model Wedding {
  // ... campos existentes
  
  // Consolidar:
  budgetData    Json?  // Presupuesto completo
  seatingData   Json?  // Plan de mesas
  
  // Eliminar relaciones:
  // budget       Budget?
  // seatingPlan  SeatingPlan?
}
```

**Beneficio:**
- -2 tablas
- -2 queries por boda
- Transacciones más simples

---

#### 2. Arreglar relación RSVP
```javascript
model RsvpResponse {
  id         String   @id
  weddingId  String   // ✅ Nuevo: FK directo a weddings
  guestId    String?  // Mantener opcional
  
  // Eliminar:
  // webId   String   // ❌ Quitar
  
  wedding    Wedding  @relation(fields: [weddingId], references: [id])
  guest      Guest?   @relation(fields: [guestId], references: [id])
}
```

---

#### 3. Renombrar tablas para claridad
```
craft_webs         → wedding_websites
wedding_suppliers  → wedding_supplier_contracts
supplier_portfolio → supplier_images (o Json en supplier)
```

---

### **Prioridad MEDIA** 🟡

#### 4. Restructurar campos de ubicación
```javascript
model Wedding {
  // ANTES:
  celebrationPlace    String?
  celebrationAddress  String?
  banquetPlace        String?
  receptionAddress    String?
  
  // DESPUÉS:
  venues Json? {
    ceremony: { name, address, time, coordinates },
    reception: { name, address, time, coordinates },
    banquet: { name, address, time, coordinates }
  }
}
```

---

#### 5. Portfolio como JSON
```javascript
model Supplier {
  // ...
  portfolioImages Json[]  // Array de { url, title, category }
  
  // Eliminar tabla:
  // portfolio SupplierPortfolio[]
}
```

---

### **Prioridad BAJA** 🟢

#### 6. Decidir sobre tabla `planners`
**Opción A:** Fusionar con `suppliers`
```javascript
model Supplier {
  category String  // "planner", "photographer", etc.
}
```

**Opción B:** Relacionar con weddings
```javascript
model WeddingPlanner {
  weddingId  String
  plannerId  String
  role       String  // coordinator, assistant
}
```

**Opción C:** Eliminar si no se usa

---

## 📐 DIAGRAMA ENTIDAD-RELACIÓN PROPUESTO

```
┌─────────┐         ┌──────────┐
│  User   │1───────N│ Wedding  │
│         │         │          │
│ - email │         │ budgetData: Json
│ - name  │         │ seatingData: Json
└─────────┘         │ venues: Json
     │              └──────────┘
     │                   │
     │1                  │1
     │                   │
     │N                  │N
┌─────────┐         ┌──────────┐
│Supplier │         │  Guest   │
│         │         │          │
│ portfolio:Json[]  │          │
└─────────┘         └──────────┘
     │                   │
     │N                  │N
     │         ┌─────────┴─────────┐
     │         │                   │
     └────N:M──┤ WeddingSupplier   │
               │                   │
               │ RsvpResponse      │
               └───────────────────┘
```

---

## 📊 MÉTRICAS DE MEJORA

### Antes (Actual)
```
Tablas:        12
Relaciones 1:1: 2 (budget, seating_plan)
Queries/boda:   4-5 queries
Complejidad:    Alta (estructura dispersa)
```

### Después (Propuesto)
```
Tablas:        8 (-4)
Relaciones 1:1: 0 (todo en weddings)
Queries/boda:   1-2 queries
Complejidad:    Media (estructura consolidada)
```

**Mejora:** ~40% menos tablas, ~50% menos queries

---

## 🛠️ PLAN DE MIGRACIÓN

### Fase 1: Preparación (Sin downtime)
```bash
# 1. Crear columnas nuevas en weddings
ALTER TABLE weddings ADD COLUMN budgetData jsonb;
ALTER TABLE weddings ADD COLUMN seatingData jsonb;
ALTER TABLE weddings ADD COLUMN venues jsonb;

# 2. Migrar datos existentes
UPDATE weddings w SET 
  budgetData = (SELECT row_to_json(b) FROM budgets b WHERE b.weddingId = w.id),
  seatingData = (SELECT row_to_json(s) FROM seating_plans s WHERE s.weddingId = w.id);
```

### Fase 2: Validación
```bash
# Verificar que todos los datos se migraron
SELECT COUNT(*) FROM weddings WHERE budgetData IS NOT NULL;
```

### Fase 3: Limpieza (Requiere downtime breve)
```bash
# Eliminar tablas antiguas
DROP TABLE budgets CASCADE;
DROP TABLE seating_plans CASCADE;
```

### Fase 4: Actualizar Prisma Schema
```bash
cd backend
npx prisma migrate dev --name consolidate_wedding_data
npx prisma generate
```

**Tiempo estimado:** 2-3 horas  
**Downtime requerido:** 5-10 minutos

---

## 🎓 MEJORES PRÁCTICAS RECOMENDADAS

### 1. **Normalización vs Desnormalización**
✅ **Usar tablas separadas cuando:**
- Relación N:M (wedding_suppliers)
- Entidades independientes (suppliers, users)
- Alta cardinalidad (guests)

❌ **NO usar tablas para:**
- Relaciones 1:1 simples (budget → usar JSON)
- Datos que siempre se consultan juntos (venues → usar JSON)

---

### 2. **Campos JSON**
✅ **Usar JSON para:**
- Datos semi-estructurados (presupuesto items)
- Configuraciones variables (seating layout)
- Arrays simples (portfolio images)

❌ **NO usar JSON para:**
- Datos que necesitan queries complejas
- Relaciones entre entidades
- Datos con alta frecuencia de búsqueda

---

### 3. **Nombres de tablas**
✅ **Consistencia:**
```
users, weddings, guests  (plural, snake_case)
wedding_suppliers        (unión N:M con contexto)
```

---

## 📝 CONCLUSIÓN

**Estado actual:** ⚠️ Funcional pero mejorable

**Problemas principales:**
1. 🔴 Relaciones 1:1 innecesarias (budget, seating_plans)
2. 🔴 RSVP mal relacionado (webId en lugar de weddingId)
3. 🟡 Tabla planners sin integración
4. 🟡 Campos de ubicación dispersos

**Recomendación:**
Aplicar refactorización en fases durante un sprint de mantenimiento. La estructura actual funciona, pero la refactorización mejorará significativamente el mantenimiento y performance.

**Prioridad sugerida:**
1. **Sprint 1:** Consolidar budget y seating_plans (ALTA)
2. **Sprint 2:** Arreglar relaciones RSVP (ALTA)
3. **Sprint 3:** Limpiar tabla planners (MEDIA)
4. **Sprint 4:** Restructurar venues (BAJA)

---

**Última actualización:** 30 Diciembre 2025  
**Próxima revisión:** Tras migración Fase 1
