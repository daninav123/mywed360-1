# Índices de Firestore Pendientes

## Problema Identificado

El backend está mostrando errores repetitivos indicando que faltan índices en Firestore para las consultas de blog. Esto causa consultas lentas y puede afectar el rendimiento.

## Índice Requerido para Blog Posts

**Error en logs:**

```
[blog] Query fallback activado. Motivo: 9 FAILED_PRECONDITION: The query requires an index.
```

**URL para crear el índice:**

```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ibG9nUG9zdHMvaW5kZXhlcy9fEAEaFgoSYXZhaWxhYmxlTGFuZ3VhZ2VzGAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQAhoMCghfX25hbWVfXxAC
```

**Colección:** `blogPosts`

**Campos del índice compuesto:**

1. `availableLanguages` (Array)
2. `status` (Ascending)
3. `publishedAt` (Ascending)
4. `__name__` (Ascending)

## Acción Requerida

1. Accede a la URL proporcionada arriba
2. Inicia sesión en Firebase Console con las credenciales del proyecto `lovenda-98c77`
3. Confirma la creación del índice
4. Espera a que el índice se construya (puede tardar varios minutos dependiendo del tamaño de los datos)

## Impacto

- **Antes de crear el índice:** Las consultas de blog usan un fallback menos eficiente
- **Después de crear el índice:** Las consultas serán más rápidas y eficientes

## Estado

⚠️ **PENDIENTE** - El índice necesita ser creado manualmente en Firebase Console
