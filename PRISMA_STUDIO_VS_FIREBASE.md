# 🔍 PRISMA STUDIO = TU NUEVA "FIREBASE CONSOLE"

## ❓ Tu pregunta:
> "Antes en Firebase veía los invitados, usuarios con acceso, datos de la boda... ¿Ahora qué pasa?"

---

## ✅ **RESPUESTA: Lo ves IGUAL o MEJOR**

### **Firebase Console (antes):**
```
weddings/
  └── abc123/
      ├── coupleName: "Ana & Carlos"
      ├── weddingDate: "2025-06-15"
      ├── guests/
      │   ├── guest1: { name: "María", status: "confirmed" }
      │   └── guest2: { name: "Juan", status: "pending" }
      └── access/
          ├── user1: { role: "OWNER", email: "ana@..." }
          └── user2: { role: "OWNER", email: "carlos@..." }
```

✅ Clickeabas en "guests" → Veías la lista  
✅ Clickeabas en "access" → Veías quién tiene acceso  
✅ Todo visual y navegable  

---

### **Prisma Studio (ahora):**

```
📊 TABLA: weddings
┌─────────┬────────────────┬──────────────┐
│ id      │ coupleName     │ weddingDate  │
├─────────┼────────────────┼──────────────┤
│ abc123  │ Ana & Carlos   │ 2025-06-15   │
└─────────┴────────────────┴──────────────┘
        │
        ├─→ 🔗 guests (200)  ← CLICKEAS AQUÍ
        ├─→ 🔗 access (3)    ← CLICKEAS AQUÍ
        ├─→ 🔗 craftWebs (1) ← CLICKEAS AQUÍ
        └─→ 🔗 suppliers (5) ← CLICKEAS AQUÍ
```

✅ Clickeas en "guests (200)" → Ves los 200 invitados  
✅ Clickeas en "access (3)" → Ves los 3 usuarios con acceso  
✅ Clickeas en "craftWebs (1)" → Ves la web  
✅ **TODO IGUAL** que en Firebase Console  

---

## 📸 **CÓMO SE VE PRISMA STUDIO**

### **Paso 1: Abrir Prisma Studio**
```bash
cd backend
npx prisma studio
```
→ Se abre en http://localhost:5555

---

### **Paso 2: Click en "weddings"**
```
📋 Lista de bodas:
┌─────────┬────────────────┬──────────────┬───────────┐
│ id      │ coupleName     │ weddingDate  │ numGuests │
├─────────┼────────────────┼──────────────┼───────────┤
│ abc123  │ Ana & Carlos   │ 2025-06-15   │ 200       │
│ def456  │ María & Juan   │ 2025-07-20   │ 150       │
└─────────┴────────────────┴──────────────┴───────────┘
```

---

### **Paso 3: Click en una boda específica**
```
📄 Wedding: abc123

Información básica:
  coupleName:     "Ana & Carlos"
  weddingDate:    "2025-06-15"
  numGuests:      200
  status:         "active"
  
Datos consolidados:
  budgetData:     { totalBudget: 25000, items: [...] }
  seatingData:    { layout: {...}, tables: [...] }

Relaciones: (CLICKEABLES)
  → guests        (200 registros) ← CLICK AQUÍ
  → access        (3 registros)   ← CLICK AQUÍ
  → craftWebs     (1 registro)    ← CLICK AQUÍ
  → suppliers     (5 registros)   ← CLICK AQUÍ
```

---

### **Paso 4: Click en "guests (200)"**
```
👥 Invitados de "Ana & Carlos"

┌──────┬────────┬──────────────┬────────────┬───────────┐
│ id   │ name   │ email        │ status     │ confirmed │
├──────┼────────┼──────────────┼────────────┼───────────┤
│ g1   │ María  │ maria@...    │ confirmed  │ ✅ true   │
│ g2   │ Juan   │ juan@...     │ pending    │ ❌ false  │
│ g3   │ Pedro  │ pedro@...    │ confirmed  │ ✅ true   │
│ ...  │ ...    │ ...          │ ...        │ ...       │
└──────┴────────┴──────────────┴────────────┴───────────┘

Total: 200 invitados
Filtros: [Por nombre] [Por status] [Por confirmación]
```

---

### **Paso 5: Click en "access (3)"**
```
🔐 Usuarios con acceso a "Ana & Carlos"

┌──────┬──────────────────┬───────────┬────────┐
│ id   │ user.email       │ role      │ status │
├──────┼──────────────────┼───────────┼────────┤
│ wa1  │ ana@example.com  │ OWNER     │ active │
│ wa2  │ carlos@...       │ OWNER     │ active │
│ wa3  │ planner@...      │ PLANNER   │ active │
└──────┴──────────────────┴───────────┴────────┘

Total: 3 usuarios con acceso
```

---

## 🆚 **COMPARACIÓN: Firebase Console vs Prisma Studio**

| Característica | Firebase Console | Prisma Studio |
|----------------|------------------|---------------|
| **Ver datos** | ✅ Sí | ✅ Sí |
| **Navegar relaciones** | ✅ Click en subcollections | ✅ Click en relaciones |
| **Filtrar** | ⚠️ Básico | ✅ Avanzado |
| **Buscar** | ⚠️ Limitado | ✅ Por cualquier campo |
| **Editar** | ✅ Sí | ✅ Sí |
| **Crear** | ✅ Sí | ✅ Sí |
| **Eliminar** | ✅ Sí | ✅ Sí |
| **Paginación** | ⚠️ Manual | ✅ Automática |
| **Ordenar** | ❌ No | ✅ Por cualquier columna |
| **Queries SQL** | ❌ No | ✅ Sí (desde terminal) |

---

## 🎯 **EN RESUMEN**

### **Antes (Firebase):**
1. Abres Firebase Console
2. Navegas a "weddings"
3. Clickeas en una boda
4. Ves subcollections: guests, access, etc.

### **Ahora (PostgreSQL + Prisma):**
1. Abres Prisma Studio (http://localhost:5555)
2. Navegas a "weddings"
3. Clickeas en una boda
4. Ves relaciones: guests, access, etc.

**ES EXACTAMENTE LO MISMO**, solo que:
- ✅ Más rápido
- ✅ Más potente (filtros, búsquedas, ordenación)
- ✅ Más escalable
- ✅ Queries SQL cuando las necesites

---

## 📝 **PARA TU CÓDIGO**

En tu código también lo ves igual:

### **Firebase (antes):**
```javascript
const weddingDoc = await db.collection('weddings').doc(weddingId).get();
const wedding = weddingDoc.data();

const guestsSnapshot = await weddingDoc.ref.collection('guests').get();
const guests = guestsSnapshot.docs.map(d => d.data());

const accessSnapshot = await weddingDoc.ref.collection('access').get();
const access = accessSnapshot.docs.map(d => d.data());
```

### **PostgreSQL + Prisma (ahora):**
```javascript
const wedding = await prisma.wedding.findUnique({
  where: { id: weddingId },
  include: {
    guests: true,    // ← Igual que subcollection
    access: true,    // ← Igual que subcollection
    craftWebs: true,
    suppliers: true
  }
});

// wedding.guests → Array de invitados ✅
// wedding.access → Array de accesos ✅
```

**Incluso MÁS SIMPLE** porque todo viene en 1 sola query.

---

## ✅ **NO PIERDES NADA**

Todo lo que veías en Firebase Console:
- ✅ Lo ves en Prisma Studio
- ✅ Lo accedes igual en el código
- ✅ Navegable visualmente
- ✅ Editable
- ✅ Con mejor rendimiento

**Solo cambia la herramienta, la experiencia es la misma o mejor.**

---

## 🚀 **PRUÉBALO AHORA**

```bash
# En la terminal:
cd backend
npx prisma studio
```

→ Se abre en http://localhost:5555  
→ Click en "weddings"  
→ Click en una boda  
→ Click en "guests (N)" para ver los invitados  
→ Click en "access (N)" para ver los accesos  

**Verás TODO igual que en Firebase Console.**

---

**¿Quieres que abramos Prisma Studio juntos para que lo veas en acción?**
