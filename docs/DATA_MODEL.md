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
  - `weddingProfile`: objeto (perfil personalizado, ver abajo)
  - `weddingInsights`: objeto (resúmenes generados, tags IA)

Subcolecciones (por boda, según módulos):
- `guests`: invitados
  - `id`, `name`, `email`, `phone`, `group`, `allergens`, `companions`, `notes`, `rsvpStatus`
- `tasks`: tareas
  - `id`, `title`, `dueDate`, `assignedTo`, `status`, `category`, `notes`
- `meetings` (opcional): reuniones/eventos de calendario
- `designs` (opcional): diseños web/invitaciones
- `seating` (opcional): layouts de mesas/ceremonia
- `recommendations`: sugerencias generadas (tipo, origen IA, CTA, estado `suggested|applied|dismissed`)

Invitaciones (recomendado):
- `weddingInvitations`: subcolección `weddings/{weddingId}/weddingInvitations/{code}`
  - `code`, `weddingId`, `email`, `role`, `createdBy`, `createdAt`

#### 2.1 Perfil de boda (`weddingProfile`)
- `version`: string (semver, ej. `1.0.0`)
- `discoverySource`: `onboarding|manual|import`
- `eventType`, `stylePrimary`, `styleSecondary`
- `vibeKeywords`: string[]
- `guestCountRange`: `{ min, max }`
- `budgetRange`: `{ min, max, currency }`
- `priorityAreas`: string[] (ej. `photography`, `sustainability`)
- `mustHaveVendors`: string[]
- `accessibilityNeeds`: string[]
- `dietaryRestrictions`: string[]
- `specialMoments`: arreglo de objetos `{ id, title, notes, responsibleRole }`
- `specialInterests`: arreglo de objetos `{ id, idea, tipo, nivelEntusiasmo, contexto, nivelContraste?, relacionaConStyle?, zonaAplicacion?, requiresReview?, createdBy, createdAt }`
- `noGoItems`: arreglo de objetos `{ id, descripcion, motivo, registradoPor, createdAt }`
- `communicationPreferences`: `{ channel, language }`
- `confidenceScore`: number (0-1)
- `lastUpdatedBy`, `updatedAt`

#### 2.2 Insights y analítica (`weddingInsights`)
- `summary`: string (tono humano amigable)
- `tags`: string[]
- `nextBestActions`: arreglo (referencias a recomendaciones/CTAs)
- `lastRecalculatedAt`: timestamp
- `telemetry`: métricas agregadas (ej. `% recomendaciones aplicadas`)
- `profileGaps`: arreglo de items `{ categoria, estado, followUpId }`
- `styleWeights`: `{ coreStyleWeight, contrasteWeight, limites }`
- `trends`: arreglo de insights anonimizados por arquetipo

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
