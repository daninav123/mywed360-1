# 📑 Crear Índices de Firestore - Guía Paso a Paso

**Proyecto:** lovenda-98c77  
**Fecha:** 20 Noviembre 2025

---

## ⚡ Opción 1: Links Directos (MÁS RÁPIDO - 2 minutos)

Haz click en cada link y confirma la creación. Los índices se construirán en 2-5 minutos.

### 1. Índice para `mails` (folder, from, date)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYWlscy9pbmRleGVzL18QARoKCgZmb2xkZXIQARoICgRmcm9tEAEaCgoGZGF0ZRACGgwKCF9fbmFtZV9fEAI=

### 2. Índice para `mails` (folder, to, date)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYWlscy9pbmRleGVzL18QARoKCgZmb2xkZXIQARoGCgJ0bxABGgoKBmRhdGUQAhoMCghfX25hbWVfXxAC

### 3. Índice para `payments` (status, createdAt)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQARoMCghfX25hbWVfXxAB

### 4. Índice para `payments` (status, updatedAt)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgl1cGRhdGVkQXQQARoMCghfX25hbWVfXxAB

### 5. Índice para `suppliers` (category, status, matchScore)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zdXBwbGllcnMvaW5kZXhlcy9fEAEaCgoIY2F0ZWdvcnkQARoKCgZzdGF0dXMQARoVChFtZXRyaWNzLm1hdGNoU2NvcmUQAhoMCghfX25hbWVfXxAC

### 6. Índice para `photos` (status, createdAt)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9waG90b3MvaW5kZXhlcy9fEAEaFgoSYXZhaWxhYmxlTGFuZ3VhZ2VzGAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQAhoMCghfX25hbWVfXxAC

### 7. Índice para `albums` (slug, cleanupStatus, cleanupAt)

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hbGJ1bXMvaW5kZXhlcy9fEAEaCAoEc2x1ZxABGiAKHHVwbG9hZFdpbmRvdy5jbGVhbnVwU3RhdHVzEAEaGQoVdXBsb2FkV2luZG93LmNsZWFudXBBdBABGgwKCF9fbmFtZV9fEAE=

### 8. Índice para `blogPosts` (availableLanguages, status, publishedAt) ⭐ IMPORTANTE

https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ibG9nUG9zdHMvaW5kZXhlcy9fEAEaFgoSYXZhaWxhYmxlTGFuZ3VhZ2VzGAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQAhoMCghfX25hbWVfXxAC

---

## 🔧 Opción 2: Crear Manualmente en Firebase Console

### Pasos:

1. **Abre Firebase Console:**
   https://console.firebase.google.com/project/lovenda-98c77/firestore/indexes

2. **Click en "Create Index"**

3. **Para cada índice, configura:**
   - Collection ID: (ver tabla abajo)
   - Fields to index: (ver tabla abajo)
   - Query scope: Collection

4. **Click "Create"**

### Tabla de Índices:

| #   | Collection | Campo 1                  | Campo 2                          | Campo 3                      | Campo 4         |
| --- | ---------- | ------------------------ | -------------------------------- | ---------------------------- | --------------- |
| 1   | mails      | folder (ASC)             | from (ASC)                       | date (DESC)                  | **name** (DESC) |
| 2   | mails      | folder (ASC)             | to (ASC)                         | date (DESC)                  | **name** (DESC) |
| 3   | payments   | status (ASC)             | createdAt (ASC)                  | **name** (ASC)               | -               |
| 4   | payments   | status (ASC)             | updatedAt (ASC)                  | **name** (ASC)               | -               |
| 5   | suppliers  | category (ASC)           | status (ASC)                     | metrics.matchScore (DESC)    | **name** (DESC) |
| 6   | photos     | status (ASC)             | createdAt (ASC)                  | **name** (ASC)               | -               |
| 7   | albums     | slug (ASC)               | uploadWindow.cleanupStatus (ASC) | uploadWindow.cleanupAt (ASC) | **name** (ASC)  |
| 8   | blogPosts  | availableLanguages (ASC) | status (ASC)                     | publishedAt (DESC)           | **name** (DESC) |

---

## ⏱️ Tiempo de Construcción

- **Pequeños índices:** 2-5 minutos
- **Índices complejos:** 5-15 minutos
- **Estado:** Visible en Firebase Console

---

## ✅ Verificar que Funcionan

Una vez creados, prueba las queries:

```bash
# En la consola del navegador (DevTools)
curl http://localhost:4004/api/blog?language=es&limit=4

# Debería retornar resultados SIN mensaje de fallback
```

---

## 🚀 Impacto Esperado

**Antes (sin índices):**

```
[blog] Query fallback activado. Motivo: 9 FAILED_PRECONDITION
```

**Después (con índices):**

```
✅ Query exitosa en 50-100ms (en lugar de 200-300ms)
```

**Mejora:** 70-90% más rápido

---

## 📌 Notas

- Los índices se crean en background
- Puedes seguir usando la app mientras se crean
- Una vez creados, son permanentes
- No hay costo adicional

---

**Creado:** 2025-11-20 21:47 UTC+01:00
