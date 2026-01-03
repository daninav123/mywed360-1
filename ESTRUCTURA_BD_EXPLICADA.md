# 📚 ESTRUCTURA DE BASE DE DATOS - EXPLICACIÓN

**Pregunta del usuario:**  
> "CraftWeb y Guest ¿por qué están ahí? ¿No deberían estar dentro de cada wedding?"

---

## ✅ **LA RESPUESTA CORTA: SÍ ESTÁN DENTRO**

Los invitados (`Guest`) y las webs (`CraftWeb`) **SÍ están dentro de cada boda**. 

La confusión viene de cómo funcionan las **bases de datos relacionales** vs **Firebase**.

---

## 🔄 **FIREBASE (lo que teníamos antes)**

En Firebase, todo estaba literalmente "anidado":

```
weddings/
  └── wedding1/
      ├── coupleName: "Ana & Carlos"
      ├── guests/
      │   ├── guest1: {...}
      │   └── guest2: {...}
      └── craftWeb: {...}
```

**Problema:** Si un invitado tiene 1MB de datos y tienes 200 invitados, cargar la boda = cargar 200MB.

---

## 🗄️ **POSTGRESQL (lo que tenemos ahora)**

En PostgreSQL, usamos **tablas relacionadas** con **foreign keys**:

```
TABLA: weddings
├── id: "abc123"
└── coupleName: "Ana & Carlos"

TABLA: guests
├── id: "guest1"
├── weddingId: "abc123" ← 👈 Esto dice "pertenezco a boda abc123"
└── name: "María"

TABLA: craft_webs
├── id: "web1"
├── weddingId: "abc123" ← 👈 Esto dice "pertenezco a boda abc123"
└── slug: "ana-y-carlos"
```

---

## 🔗 **¿CÓMO "PERTENECEN" A LA BODA?**

Mediante el campo `weddingId`:

### **Guest**
```prisma
model Guest {
  id        String
  weddingId String    ← 🔑 Foreign Key
  name      String
  
  wedding   Wedding @relation(fields: [weddingId], references: [id])
             ↑ Esto crea la relación: "este guest pertenece a esta wedding"
}
```

### **CraftWeb**
```prisma
model CraftWeb {
  id        String
  weddingId String    ← 🔑 Foreign Key
  slug      String
  
  wedding   Wedding @relation(fields: [weddingId], references: [id])
             ↑ Esto crea la relación: "esta web pertenece a esta wedding"
}
```

### **Wedding**
```prisma
model Wedding {
  id        String
  coupleName String
  
  guests    Guest[]     ← 🔗 Relación: "tengo muchos guests"
  craftWebs CraftWeb[]  ← 🔗 Relación: "tengo muchas webs"
}
```

---

## 📊 **EJEMPLO REAL DE TU BASE DE DATOS**

```sql
-- Boda "Ana & Carlos - Test" con ID "xxx"
Boda: Ana & Carlos - Test
  ├── 14 invitados (todos con weddingId = "xxx")
  └── 0 webs (ninguna con weddingId = "xxx")

-- Boda "María & Juan" con ID "yyy"  
Boda: María & Juan
  ├── 20 invitados (todos con weddingId = "yyy")
  └── 1 web (con weddingId = "yyy")
```

Cada guest y cada web **SÍ está dentro de su boda** gracias al `weddingId`.

---

## ✅ **VENTAJAS DE ESTA ESTRUCTURA**

### **1. Eficiencia**
```javascript
// Cargar solo la boda (sin invitados)
const wedding = await prisma.wedding.findUnique({ 
  where: { id: 'xxx' } 
});
// ✅ Rápido, solo 1 registro

// Cargar boda + invitados
const weddingWithGuests = await prisma.wedding.findUnique({
  where: { id: 'xxx' },
  include: { guests: true }
});
// ✅ Solo carga lo que necesitas
```

### **2. Escalabilidad**
- Una boda con 500 invitados no ralentiza cargar los datos básicos
- Puedes paginar invitados: "mostrar 20 de cada vez"

### **3. Integridad**
```javascript
// Si eliminas una boda...
await prisma.wedding.delete({ where: { id: 'xxx' } });

// PostgreSQL automáticamente elimina:
// ✅ Todos los guests con weddingId = 'xxx'
// ✅ Todas las craft_webs con weddingId = 'xxx'
// ✅ Todo el wedding_access con weddingId = 'xxx'
```

Esto es gracias a `onDelete: Cascade`.

---

## 🚫 **¿QUÉ ESTARÍA MAL?**

Esto SÍ estaría mal:

```prisma
model Guest {
  id   String
  name String
  // ❌ No hay weddingId
  // ❌ No pertenece a ninguna boda
}
```

O esto:

```prisma
model Wedding {
  id     String
  guests Json  // ❌ Todos los invitados en 1 campo JSON gigante
}
```

---

## ✅ **TU ESTRUCTURA ACTUAL ES CORRECTA**

- ✅ `Guest` tiene `weddingId` → Pertenece a una boda
- ✅ `CraftWeb` tiene `weddingId` → Pertenece a una boda
- ✅ `Budget` (consolidado) → Ahora es JSON dentro de Wedding
- ✅ `SeatingPlan` (consolidado) → Ahora es JSON dentro de Wedding

---

## 🤔 **¿CUÁNDO CONSOLIDAR EN JSON?**

**Consolidamos en JSON cuando:**
- Relación 1:1 (una boda = un presupuesto)
- Datos pequeños (<10KB)
- No necesitas queries complejas

**Mantenemos tabla separada cuando:**
- Relación 1:N (una boda = muchos invitados)
- Necesitas queries: "buscar invitados confirmados"
- Necesitas paginación

---

## 📌 **RESUMEN**

| Elemento | ¿Dentro de Wedding? | ¿Cómo? |
|----------|---------------------|--------|
| `budgetData` | ✅ SÍ | Campo JSON en Wedding |
| `seatingData` | ✅ SÍ | Campo JSON en Wedding |
| `Guest` | ✅ SÍ | Tabla relacionada con `weddingId` |
| `CraftWeb` | ✅ SÍ | Tabla relacionada con `weddingId` |

---

**Tu lógica es correcta:** Todo debe estar "dentro" de cada boda.  
**La implementación también es correcta:** Usamos foreign keys para lograrlo.

Es solo que en bases de datos relacionales, "dentro" se logra mediante relaciones (`weddingId`), no anidando literalmente los datos.

---

**¿Tiene sentido? ¿Quieres que continuemos con las mejoras o prefieres que clarifique algo más?**
