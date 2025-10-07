# 2. Creacion de Evento con IA (bodas y eventos afines) · estado 2025-10-07

> Implementado: `src/pages/CreateWeddingAI.jsx`, `src/pages/AyudaCeremonia.jsx`, `src/pages/BodaDetalle.jsx`, `src/context/WeddingContext.jsx`, servicios `createWedding` y `seedDefaultTasksForWedding`.
> Pendiente: aislar el wizard para owners, introducir selector de tipo de evento, reemplazar el campo `budget` por `eventProfile`, habilitar opt-in a planner desde perfil y telemetria completa.

## 1. Objetivo y alcance
- Guiar a owners sin evento activo desde el onboarding hasta su primer hub operacional.
- Permitir organizar tanto bodas como celebraciones similares (cumpleaños, aniversarios, baby showers) reutilizando la misma infraestructura.
- Crear `weddings/{id}` (renombrado internamente como "eventos") con seeds basicos (tareas, finanzas, contexto) y enlazarlos con el perfil del usuario.
- Recoger datos clave para IA (tipo de evento, fecha, ubicacion, estilo, dimension) sin exponer el flujo a planners/assistants.

## 2. Trigger y rutas
- Redireccion automatica tras registro/verificacion del owner cuando `activeWeddingId` es falsy.
- Acceso manual a `/create-wedding-ai` (requiere sesion valida); planners/assistants deberian ver bloqueo de permisos.
- CTA discreto "Crear nuevo evento" planificado para owners con multiples eventos (no ejecutar todavia).

## 3. Paso a paso UX
1. `CreateWeddingAI.jsx` (paso actual)
   - Form con `eventType` (radio: `boda`, `evento`), `eventName` (placeholder cambia segun tipo), `eventDate`, `location`, `style`.
   - Etiquetas y textos se adaptan: cuando `eventType = evento` se muestra "Fecha del evento" y "Nombre de anfitriones".
   - Acciones: llama a `useCreateEvent` (alias de `createWedding`) y muestra banner de exito antes de redirigir a `/bodas/:id` (pendiente renombrar ruta a `/eventos/:id`).
   - Validaciones: `eventType` y `eventDate` obligatorios; mensajes toast en errores Firebase.
2. Paso 2 - perfil del evento (proxima iteracion)
   - Sustituir `budget` por capturas de `guestCountRange`, `ceremonyType` (solo para bodas), eventos relacionados, nivel de formalidad y notas.
   - Guardar datos bajo `weddings/{id}.eventProfile` y `users/{uid}/weddings/{id}.eventProfileSummary`.
   - Para eventos no boda, ocultar campos no aplicables (por ejemplo `ceremonyType`).
3. Creacion en servicio (`createWedding`)
   - Genera UUID, crea documento principal con `eventType`, inicializa `finance/main`, seeds de tareas (`seedDefaultTasksForWedding`).
   - Ajustar seeds para cambiar copy (por ejemplo "Ceremonia" se convierte en "Evento principal") cuando `eventType !== 'boda'`.
   - Actualiza `users/{uid}` (`activeWeddingId`, `hasActiveWedding`) y subcoleccion `weddings`.
4. Onboarding posterior
   - `WeddingContext` refresca estado y lleva al hub (`BodaDetalle.jsx`), que deberia usar copy neutro ("Evento") segun `eventType`.
   - `AyudaCeremonia.jsx` muestra ayuda inicial; necesita versión genérica (p. ej. "Guion del evento") cuando no sea boda.

## 4. Persistencia y datos
- Firestore `weddings/{id}`: ownerIds, `eventType`, `eventProfile`, subscription, fechas, datos de ubicacion/estilo.
- `eventProfile` incluye `guestCountRange`, `formalityLevel`, `relatedEvents` y campos especificos (`ceremonyType` solo para bodas).
- `users/{uid}` y `users/{uid}/weddings/{id}`: resumen de evento, roles, `eventProfileSummary` y `eventType`.
- Seeds: `weddings/{id}/tasks`, `.../finance`, `.../timelineDraft` creados de forma idempotente con copy condicionado por `eventType`.
- Metadatos `_seed_meta` guardan la ultima version de plantilla utilizada (`templateVersion: 'wedding' | 'generic_event'`).

## 5. Reglas de negocio
- Solo owners con email verificado y sin evento activo pueden acceder.
- `eventType` y `eventDate` obligatorios; `eventProfile.guestCountRange` y `formalityLevel` requeridos tras nuevo paso.
- Seeds deben ejecutarse una vez; reintentos usan marcadores `_seed_meta.status` y respetan el tipo de evento.
- Planners/assistants no ven `/create-wedding-ai`; al crear eventos adicionales se solicitará confirmacion explicita.

## 6. Estados especiales y errores
- Falta de fecha muestra validacion inline "Selecciona la fecha del evento".
- Error `auth/permission-denied` al cargar la pagina deberia redirigir a `/home`.
- Fallos de seeds logueados en consola y en coleccion `weddingSeedErrors`; UI mantiene mensaje de espera.
- Manejo de desconexion: mostrar fallback "No pudimos crear el evento, reintenta" y distinguir copy segun `eventType`.

## 7. Integracion con otros flujos
- Flujo 1 entrega `activeWeddingId` inicial y dispara redireccion a este wizard.
- Flujos 3, 6, 10, 11, 17 deben respetar `eventType` para ajustar copy (ver notas en sus documentos).
- Recomendaciones IA (flujos 5, 8, 16) deben considerar `eventProfile.eventType` para priorizar plantillas.

## 8. Metricas y monitorizacion
- Eventos sugeridos: `event_creation_started`, `event_creation_succeeded`, `event_creation_failed` con parametro `eventType`.
- Trackear seleccion de estilo, rango de invitados y tipo para segmentar seeds.
- Registrar tiempo entre registro y evento creado para medir friccion.

## 9. Pruebas recomendadas
- **E2E – Redirecciones y acceso**
  - Owner sin evento: tras autenticarse, debe aterrizar en `/create-wedding-ai` (verifica `activeWeddingId` vacío).
  - Owner con evento activo: se omite el wizard y se llega a `/bodas/:activeWeddingId`.
  - Roles no permitidos (planner/assistant): acceso bloqueado y redireccion a `/home`.
- **E2E – Paso 1 (contexto base)**
  - Render de formulario para boda (copy "Fecha de la boda") y evento (copy "Fecha del evento").
  - Validacion dura de fecha y tipo: botón Crear deshabilitado hasta seleccionar ambos.
  - Sesion expirada: simula `currentUser` nulo y espera `Error("No autenticado")` en UI.
- **E2E – Paso 2 (dimensión del evento)**
  - Captura completa de `eventProfile` para boda (incluye `ceremonyType`) y para evento generico (omite ese campo).
  - Intercepta `createWedding` para asegurar que el payload contiene `eventType` y `eventProfile` con el esquema adecuado.
  - Validaciones cuando falta un campo obligatorio y revalidacion al volver al paso anterior.
- **E2E – Creacion y seeds**
  - Caso feliz boda: tras crear, el hub muestra copy "Boda" y seeds especificos.
  - Caso feliz evento generico: copy "Evento" y seeds adaptados (tareas sin referencias a ceremonia).
  - Caso error: forzar fallo en `seedDefaultTasksForWedding` y comprobar toast "No pudimos crear todas las tareas..." con copy generico.
  - Reintentos idempotentes: repetir la creacion con el mismo `eventType` y validar `_seed_meta.templateVersion`.
- **E2E – WeddingContext y multi-rol**
  - Persistencia en `localStorage` (`mywed360_active_wedding_user_${uid}`) tras crear evento.
  - Usuario con eventos propios y ajenos (planner): orden correcto y etiqueta `planner/assistant`.
  - Cambio de evento conserva rol activo en recarga y actualiza diagnosticos.
- **E2E – Telemetria y analitica**
  - Interceptar analytics para verificar `event_creation_*` con parametro `eventType`.
  - Cuando se habilite opt-in a planner: cubrir `planner_opt_in_requested/approved/denied`.
- **E2E – Migracion y avisos**
  - Evento existente sin `eventType` (legacy): script deberia rellenar `eventType: 'boda'` por defecto y pedir confirmacion al usuario.
  - Script `scripts/migrate-event-profile.js`: smoke test que valida que eventos legacy quedan en estado `unknown` hasta actualizacion manual.
- **Unitarias clave**
  - Validadores del wizard (`isValidEventDate`, mapping de `eventType` y `eventProfile`).
  - Servicio `createWedding` asegura escritura de `eventType`, `eventProfile`, manejo de seeds por plantilla.
  - `seedDefaultTasksForWedding` y `fixParentBlockDates` soportan plantillas `wedding` y `generic_event`.
- **Integracion**
  - `WeddingContext` carga eventos, establece `activeWedding`, sincroniza `ensureFinance` y respeta el orden owner/planner.
  - Flujo completo con Firestore emulado: creacion de boda, creacion de evento generico, seeds y navegacion a `BodaDetalle` con copy correcto.

## 10. Checklist de despliegue
- Variables Firebase (`VITE_FIREBASE_*`) y credenciales IA si se usa recomendacion.
- Reglas Firestore actualizadas para permitir `eventType` y nuevo esquema de `eventProfile`.
- Scripts de migracion para poblar `eventType` y `eventProfile` en eventos existentes.
- Revisar copy y traducciones para soportar "evento" y "boda" dinamicamente.

## 11. Roadmap / pendientes
- Dividir wizard en pasos y mover `eventProfile` a paso 2 eliminando `budget`.
- Implementar opt-in a planner/assistant desde Perfil con flujo dedicado.
- Refactorizar rutas y componentes (`/bodas` -> `/eventos`) cuando exista soporte multi-evento en toda la app.
- Instrumentar telemetria y dashboards de adopcion segmentados por `eventType`.
- Integrar asistencia IA contextual con prompts especificos por tipo de evento y fallback offline.
