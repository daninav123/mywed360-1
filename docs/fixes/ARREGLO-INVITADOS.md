# ✅ ARREGLO - Sección de Invitados

## 🔧 Problema Identificado

Igual que con el modal de proveedores, la sección de invitados **NO se mostraba** porque faltaban traducciones i18n.

**Traducciones faltantes detectadas:**
```
❌ guests.guestList
❌ guests.addGuest
❌ guests.totalGuests
❌ guests.confirmedGuests
❌ guests.pendingGuests
❌ guests.stats.totalAttendees
❌ guests.empty.title
❌ guests.empty.defaultHint
❌ guests.rsvp.printPdf
```

---

## ✅ Solución Aplicada

He **reemplazado las traducciones faltantes** con texto hardcodeado en español en:

### **1. `/pages/Invitados.jsx`**
```jsx
// Antes:
<h1>{t('guests.guestList')}</h1>  // ❌ No funciona

// Después:
<h1>Lista de invitados</h1>  // ✅ Funciona
```

### **2. `/components/guests/GuestList.jsx`**
```jsx
// Estadísticas:
- "Total invitados"
- "Confirmados"
- "Pendientes"
- "Total asistentes"

// Estados vacíos:
- "No hay invitados"
- "Empieza añadiendo invitados a tu lista"
```

### **3. `/components/guests/GuestFilters.jsx`**
```jsx
// Antes:
{t('guests.addGuest')}  // ❌

// Después:
Añadir invitado  // ✅
```

---

## 📋 Traducciones Reemplazadas

1. ✅ `guests.guestList` → **"Lista de invitados"**
2. ✅ `guests.addGuest` → **"Añadir invitado"**
3. ✅ `guests.totalGuests` → **"Total invitados"**
4. ✅ `guests.confirmedGuests` → **"Confirmados"**
5. ✅ `guests.pendingGuests` → **"Pendientes"**
6. ✅ `guests.stats.totalAttendees` → **"Total asistentes"**
7. ✅ `guests.empty.title` → **"No hay invitados"**
8. ✅ `guests.empty.defaultHint` → **"Empieza añadiendo invitados a tu lista"**
9. ✅ `guests.rsvp.printPdf` → **"Imprimir / PDF"**

---

## 🚀 AHORA FUNCIONARÁ

**Servidor reiniciado en:** http://localhost:5173/

### **Pasos para verificar:**

1. **Recarga la página** (Cmd+Shift+R)
2. **Ve a la sección de invitados:**
   ```
   http://localhost:5173/invitados
   ```

### **Deberías ver:**

✅ **Título:** "Lista de invitados"  
✅ **Botón:** "Añadir invitado"  
✅ **Estadísticas:** Total invitados, Confirmados, Pendientes, Total asistentes  
✅ **Mensaje si está vacío:** "No hay invitados" + "Empieza añadiendo invitados a tu lista"  

---

**¡Recarga y prueba la sección de invitados!** 🎉
