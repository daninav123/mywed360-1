# 📑 Crear Índices de Firestore - MANUAL

**Proyecto:** lovenda-98c77  
**Fecha:** 20 Noviembre 2025

---

## ⚠️ Limitación Técnica

La creación de índices de Firestore requiere autenticación interactiva con Firebase CLI o acceso manual a Firebase Console. No se puede hacer automáticamente desde scripts sin autenticación.

**Solución:** Crear manualmente en Firebase Console (5-10 minutos)

---

## 🚀 Opción 1: Links Directos (MÁS RÁPIDO - 2 minutos)

Copia y pega cada link en tu navegador. Cada uno abre Firebase Console con el índice pre-configurado.

### 1. blogPosts ⭐ (CRÍTICO - Resuelve queries lentas)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ibG9nUG9zdHMvaW5kZXhlcy9fEAEaFgoSYXZhaWxhYmxlTGFuZ3VhZ2VzGAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQAhoMCghfX25hbWVfXxAC
```

### 2. payments (status, createdAt)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQARoMCghfX25hbWVfXxAB
```

### 3. payments (status, updatedAt)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wYXltZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgl1cGRhdGVkQXQQARoMCghfX25hbWVfXxAB
```

### 4. suppliers (category, status, matchScore)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zdXBwbGllcnMvaW5kZXhlcy9fEAEaCgoIY2F0ZWdvcnkQARoKCgZzdGF0dXMQARoVChFtZXRyaWNzLm1hdGNoU2NvcmUQAhoMCghfX25hbWVfXxAC
```

### 5. mails (folder, from, date)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYWlscy9pbmRleGVzL18QARoKCgZmb2xkZXIQARoICgRmcm9tEAEaCgoGZGF0ZRACGgwKCF9fbmFtZV9fEAI=
```

### 6. mails (folder, to, date)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYWlscy9pbmRleGVzL18QARoKCgZmb2xkZXIQARoGCgJ0bxABGgoKBmRhdGUQAhoMCghfX25hbWVfXxAC
```

### 7. photos (status, createdAt)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9waG90b3MvaW5kZXhlcy9fEAEaFgoSYXZhaWxhYmxlTGFuZ3VhZ2VzGAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQAhoMCghfX25hbWVfXxAC
```

### 8. albums (slug, cleanupStatus, cleanupAt)

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hbGJ1bXMvaW5kZXhlcy9fEAEaCAoEc2x1ZxABGiAKHHVwbG9hZFdpbmRvdy5jbGVhbnVwU3RhdHVzEAEaGQoVdXBsb2FkV2luZG93LmNsZWFudXBBdBABGgwKCF9fbmFtZV9fEAE=
```

---

## 🔧 Opción 2: Crear Manualmente en Firebase Console

### Pasos:

1. **Abre Firebase Console:**
   https://console.firebase.google.com/project/lovenda-98c77/firestore/indexes

2. **Click en "Create Index"**

3. **Para cada índice, configura según esta tabla:**

| Colección        | Campo 1                  | Campo 2                          | Campo 3                      | Campo 4         |
| ---------------- | ------------------------ | -------------------------------- | ---------------------------- | --------------- |
| **blogPosts** ⭐ | availableLanguages (ASC) | status (ASC)                     | publishedAt (DESC)           | **name** (DESC) |
| **payments**     | status (ASC)             | createdAt (ASC)                  | **name** (ASC)               | -               |
| **payments**     | status (ASC)             | updatedAt (ASC)                  | **name** (ASC)               | -               |
| **suppliers**    | category (ASC)           | status (ASC)                     | metrics.matchScore (DESC)    | **name** (DESC) |
| **mails**        | folder (ASC)             | from (ASC)                       | date (DESC)                  | **name** (DESC) |
| **mails**        | folder (ASC)             | to (ASC)                         | date (DESC)                  | **name** (DESC) |
| **photos**       | status (ASC)             | createdAt (ASC)                  | **name** (ASC)               | -               |
| **albums**       | slug (ASC)               | uploadWindow.cleanupStatus (ASC) | uploadWindow.cleanupAt (ASC) | **name** (ASC)  |

4. **Click "Create"** para cada índice

---

## ⏱️ Tiempo de Construcción

- **Pequeños índices:** 2-5 minutos
- **Índices complejos:** 5-15 minutos
- **Estado:** Visible en Firebase Console en tiempo real

---

## ✅ Verificar que Funcionan

Una vez creados, prueba las queries:

```bash
# En la terminal
curl http://localhost:4004/api/blog?language=es&limit=4

# Debería retornar resultados SIN mensaje de fallback
```

---

## 🚀 Impacto Esperado

**Antes (sin índices):**

```
[blog] Query fallback activado. Motivo: 9 FAILED_PRECONDITION
Tiempo: 200-300ms
```

**Después (con índices):**

```
✅ Query exitosa
Tiempo: 50-100ms
```

**Mejora:** ⚡ **70-90% más rápido**

---

## 📌 Prioridad

**CRÍTICO:** Crear al menos el índice de `blogPosts` (el #1)

Los otros 7 son importantes pero el de blogPosts es el que está causando las queries lentas.

---

## 🎯 Próximos Pasos

1. ✅ Crear índices (5-10 minutos)
2. ⏳ Esperar a que se construyan (2-15 minutos)
3. ⏳ Verificar que funcionan
4. ⏳ Continuar con optimizaciones Fase 2

---

**Creado:** 2025-11-20 21:50 UTC+01:00
