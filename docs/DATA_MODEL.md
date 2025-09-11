# Modelo de Datos — Firestore

Nota: Este documento consolida estructuras observadas en el código. Ajustar si hay cambios en colecciones reales.

## Convenciones
- Todas las rutas están bajo el contexto de usuario/boda activos.
- Identificadores en minúsculas; fechas en ISO 8601; números normalizados.

## Colecciones y Documentos

### 1. Perfiles de Usuario
- Colección: `userProfiles`
- Documento (por UID):
  - `id`: string (UID)
  - `name`: string
  - `email`: string
  - `preferences`: objeto (notificaciones email, firma, theme, recordatorios)
  - `weddingInfo` (opcional): objeto con datos agregados de la boda

### 2. Bodas
- Colección: `weddings`
- Documento (por boda):
  - `id`: string (UUID)
  - `name`: string
  - `weddingDate`: date/string
  - `location`: string
  - `ownerIds`: string[] (UIDs)
  - `plannerIds`: string[] (opcional)
  - `weddingInfo`: objeto (resumen)

Subcolecciones (por boda, según módulos):
- `guests`: invitados
  - `id`, `name`, `email`, `phone`, `group`, `allergens`, `companions`, `notes`, `rsvpStatus`
- `tasks`: tareas
  - `id`, `title`, `dueDate`, `assignedTo`, `status`, `category`, `notes`
- `meetings` (opcional): reuniones/eventos de calendario
- `designs` (opcional): diseños web/invitaciones
- `seating` (opcional): layouts de mesas/ceremonia

Invitaciones (recomendado):
- `weddingInvitations`: subcolección `weddings/{weddingId}/weddingInvitations/{code}`
  - `code`, `weddingId`, `email`, `role`, `createdBy`, `createdAt`

### 3. Estados Auxiliares
- `tasksCompleted` (documento por boda o por usuario/boda): mapa de ids de tareas completadas
- `weddingInfo` (documento de agregados) accesible vía `loadData('weddingInfo', { docPath })`

### 4. Datos por usuario (root)
- `users/{uid}`: perfil y subcolecciones del usuario (solo acceso propio)
- `onboarding/{uid}`: datos de onboarding del usuario
- `config/{doc}`: configuraciones leíbles por usuarios autenticados
- `diagnosis/{doc}` y colecciones públicas `_conexion_prueba`, `_test_connection`, `_test` para healthchecks
- Colecciones auxiliares por usuario: `userGuests/{uid}`, `userData/{uid}`, `userSuppliers/{uid}`, `userTasksCompleted/{uid}`
- Colecciones financieras: `transactions/{uid}` (+ subcolecciones), `finance/{uid}` (+ subcolecciones)

## Índices y Reglas

### Reglas (según firestore.rules)
- Lectura de bodas: owner/planner/assistant.
- Escritura en bodas/subcolecciones: owner/planner, con validaciones específicas para seating (`seatingPlan/banquet|ceremony`).
- Auto‑adición a `plannerIds` permitida si la operación modifica solo ese campo (aceptación de invitación).
- Datos por usuario: lectura/escritura solo del propio `uid`.

### Índices (ejemplos)
- `weddings.ownerIds` array-contains
- `guests.email`, `guests.group` compuestos para filtros
- `tasks.status`, `tasks.dueDate`

## Versionado y Migraciones
- Añadir campos con compatibilidad retroactiva.
- Mantener scripts de migración para cambios de estructura relevantes.
