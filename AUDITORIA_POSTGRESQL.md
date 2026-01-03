# 🔍 AUDITORÍA: Páginas que usan PostgreSQL

**Fecha:** 3 de enero de 2026, 20:30
**Estado:** En progreso

---

## ✅ PÁGINAS QUE USAN POSTGRESQL

### **Core - Datos de boda:**
- ✅ **InfoBoda.jsx** → `useWeddingData` (PostgreSQL vía `weddingInfoAPI`)
- ✅ **Invitaciones.jsx** → `useWeddingData`, `useGuests` (PostgreSQL)

### **Invitados:**
- ✅ **Invitados.jsx** → `useGuests` (PostgreSQL vía `guestsAPI`)

### **Finanzas:**
- ✅ **Finance.jsx** → `useFinance` (PostgreSQL)
- ✅ **ProveedoresNuevo.jsx** → `useFinance`, `useWeddingData` (PostgreSQL)

### **Checklist:**
- ✅ **Checklist.jsx** → API `/api/checklist/*` (PostgreSQL) - RECIÉN MIGRADO

### **Tareas:**
- ✅ **Tasks.jsx** → Usa PostgreSQL (ya migrado según memoria)

---

## ⚠️ CONTEXTO CRÍTICO - WeddingContext

**Problema identificado:**
- ✅ `WeddingContext.jsx` **ahora carga desde PostgreSQL** (endpoint `/api/user/weddings`)
- ⚠️ Pero puede que no esté funcionando correctamente

**Necesita verificación:**
- Ver logs de `[WeddingContext]` en consola del navegador
- Ver logs de `[user-weddings]` en backend

---

## 📋 HOOKS QUE USAN POSTGRESQL

1. ✅ `useWeddingData` → `weddingInfoAPI` → PostgreSQL
2. ✅ `useGuests` → `guestsAPI` → PostgreSQL
3. ✅ `useFinance` → PostgreSQL
4. ✅ `useChecklist` → `/api/checklist/*` → PostgreSQL (nuevo)
5. ✅ `useTasks` → PostgreSQL (según memoria)

---

## 🔴 PENDIENTE DE VERIFICAR

1. **WeddingContext logs** - ¿Por qué no aparecen bodas en la interfaz?
2. **Endpoint `/api/user/weddings`** - ¿Responde correctamente?
3. **Creación automática de boda al registrarse** - Actualmente NO implementado

---

## 📊 RESUMEN

- **Páginas principales:** ✅ Todas usan PostgreSQL
- **WeddingContext:** ✅ Modificado para usar PostgreSQL (pero necesita debugging)
- **Backend endpoints:** ✅ Creados y configurados
- **Base de datos:** ✅ Tiene 1 boda (Dani & Partner)

**Problema actual:** Las bodas están en PostgreSQL pero no aparecen en la interfaz.
**Causa probable:** WeddingContext no se ejecuta o falla silenciosamente.

**Acción requerida:** Logs del navegador para diagnosticar.
