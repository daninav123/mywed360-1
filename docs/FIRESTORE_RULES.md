# Firestore Rules — MaLoveApp

Este documento explica las reglas reales del proyecto (ver `firestore.rules`) y su intención. No inventa políticas nuevas: describe y aclara lo existente.

## Archivo de reglas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /weddings/{weddingId} { ... }
    match /weddings/{weddingId}/{document=**} { ... }
    match /users/{userId} { ... }
    match /onboarding/{userId} { ... }
    match /config/{document=**} { ... }
    match /diagnosis/{docId} { ... }
    match /_conexion_prueba/{docId} { ... }
    match /_test_connection/{docId} { ... }
    match /_test/{docId} { ... }
    match /users/{uid} { ... }
    match /users/{uid}/{subCollection=**} { ... }
    match /userGuests/{uid} { ... }
    match /userData/{uid} { ... }
    match /userSuppliers/{uid} { ... }
    match /userTasksCompleted/{uid} { ... }
    match /transactions/{uid} { ... }
    match /transactions/{uid}/{document=**} { ... }
    match /finance/{uid} { ... }
    match /finance/{uid}/{document=**} { ... }

    // helpers: isOwner, isPlanner, isAssistant, isOwnerOrPlanner, isCollaborator
    // seating validators: isValidConfig, isValidBanquetData, isValidCeremonyData, isValidSeatingPlanDoc
  }
}
```

Consulta el archivo completo en la raíz del repo: `firestore.rules:1`.

## Bodas (`/weddings/{weddingId}`)
- Lectura permitida a propietarios, planners y asistentes presentes en arrays `ownerIds`, `plannerIds`, `assistantIds` del documento.
- Create permitido solo si el usuario autenticado aparece en `ownerIds` o `plannerIds` del documento a crear.
- Update/Delete permitido a propietarios y planners. Caso especial: `isAddingSelfAsPlanner()` permite que un usuario autenticado se agregue a `plannerIds` si la operación modifica exclusivamente ese campo (aceptación de invitación).

### Subcolecciones de boda (`/weddings/{weddingId}/{document=**}`)
- Lectura permitida a owner/planner/assistant de esa boda (consulta al documento padre).
- Escritura permitida a owner/planner. Validación adicional para seating:
  - Si el path es `seatingPlan/banquet` o `seatingPlan/ceremony`, se aplica `isValidSeatingPlanDoc(path, data)` que valida:
    - `banquet`: listas `tables/areas` y `config` con `width/height/aisleMin` en rango (40–300) o compatibilidad con campos en raíz.
    - `ceremony`: listas `tables/areas/seats` si están presentes.

Nota: Los comentarios del archivo indican que las invitaciones se almacenan como subcolección `weddings/{weddingId}/weddingInvitations/{code}`. En pruebas unitarias hay documentos top‑level `weddingInvitations` (histórico). Se recomienda consolidar en la subcolección para consistencia con las reglas heredadas del bloque de subcolecciones.

## Usuarios y datos por usuario
- `users/{userId}`: el propio usuario puede leer/escribir su documento de perfil.
- `users/{uid}/{subCollection=**}`: acceso restringido al propietario.
- `onboarding/{userId}`: lectura/escritura del propio usuario.
- Colecciones auxiliares por usuario (`userGuests`, `userData`, `userSuppliers`, `userTasksCompleted`, `transactions`, `finance` y sus subcolecciones): lectura/escritura solo por el `uid` propietario.

Nota: Existen dos bloques `match /users/{...}` (uno con `userId` y otro con `uid`). Aunque equivalentes en intención, es recomendable mantener uno solo por consistencia en futuras refactors.

## Configuración y diagnóstico
- `config/{document=**}`: lectura permitida a usuarios autenticados.
- `diagnosis/{docId}`: lectura/escritura si autenticado.
- Colecciones públicas de diagnóstico (`_conexion_prueba`, `_test_connection`, `_test`): lectura/escritura permitida sin autenticación (solo para healthchecks/desarrollo).

## Helpers relevantes
- `isOwner(wid)`, `isPlanner(wid)`, `isAssistant(wid)`, `isOwnerOrPlanner(wid)`, `isCollaborator(wid)`: consultan arrays del doc `weddings/{wid}`.
- `isAddingSelfAsPlanner()`: habilita la auto‑adición a `plannerIds` si el write solo toca ese campo.
- Validadores de Seating: `isValidConfig`, `isValidBanquetData`, `isValidCeremonyData` aplicados según el path del documento.

## Emulador y pruebas de reglas
- Emulador configurado en `firebase.json` (Firestore puerto 8080).
- Pruebas unitarias: `src/__tests__/firestore.rules.extended.test.js:1` (requiere `FIRESTORE_EMULATOR_HOST` o `FIRESTORE_RULES_TESTS=true`).

