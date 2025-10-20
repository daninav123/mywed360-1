# 10. Gestión de Bodas Múltiples (estado 2025-10-16)

> Implementado: Bodas.jsx, BodaDetalle.jsx, WeddingSelector.jsx, WeddingFormModal.jsx, useWedding context, seeding inicial (finanzas/tareas) al crear boda desde planner, componentes MultiWeddingSummary.jsx y WeddingPortfolioTable.jsx, tablero multi-boda con KPIs/filtros y encolado CRM (crmSyncQueue), y editor de permisos por módulo en BodaDetalle.jsx (modulePermissions).
> Pendiente: worker CRM (procesar crmSyncQueue), activity feed/alertas multi-boda y suites E2E específicas para permisos/CRM.

## 1. Objetivo y alcance
- Permitir que planners/owners gestionen varias bodas, creando nuevas y alternando entre ellas.
- Ofrecer hub de detalle con KPIs clave y navegación contextual.
- Sincronizar seeds iniciales (finanzas, timeline) cuando se crea boda nueva.

## 2. Trigger y rutas
- Menú inferior (rol planner) ? pestaña **Bodas** (`/bodas`, `Bodas.jsx`) lista bodas activas y archivadas.
- Owners acceden desde Home (widget 'Gestiona tu boda') o desde el onboarding inicial; ambos caminos aterrizan en `/bodas` con la boda actual destacada.
- `WeddingSelector` aparece cuando hay múltiples bodas y permite saltar a `/bodas/:id` (`BodaDetalle.jsx`).

## 3. Paso a paso UX
1. Listado y creación
   - `Bodas.jsx` muestra tabs "Activas"/"Archivadas", tarjetas con progreso y CTA "Crear boda".
   - `WeddingFormModal` captura nombre, fecha, ubicación; planners pueden crear bodas adicionales.
   - Al guardar se inicializa `finance/main` y seeds básicas (tareas, timeline).
2. Selección y navegación
   - `WeddingSelector` permite cambiar boda activa; al cambiar en ruta `/bodas/*` redirige a detalle.
   - Contexto `useWedding` sincroniza `activeWedding`, `weddings` y persistencia local.
3. Hub
   - BodaDetalle resume invitados confirmados, presupuesto, tareas, comunicaciones y accesos r?pidos, permite editar permisos por m?dulo y mostrar el estado de sincronizaci?n CRM.
   - Acciones: archivar/restaurar, abrir m?dulos clave (RSVP, seating, presupuesto), sincronizar con CRM y abrir el editor de permisos.

4. Invitaci?n y enlace de roles (owner ? planner/assistant)
   - CTA `Gestionar equipo` visible en `BodaDetalle.jsx` y cabecera de `Bodas.jsx`; abre `WeddingTeamModal`.
   - **Opcion A: Seleccionar planner del marketplace interno**
     - Modal muestra buscador con planners del ecosistema (nombre, ciudad, etiquetas de estilo).
     - Cada ficha incluye rating, disponibilidad y CTA `Invitar`. Al pulsarlo se rellenan email y permisos por defecto.
     - Si el planner ya gestiona la boda se muestra badge "Activo"; si tiene otra boda activa se avisa del solapamiento.
     - Los datos provienen de `users` con rol planner y flag `isDiscoverable=true`. Se puede filtrar por idioma y presupuesto medio.
   - **Opcion B: Planner externo mediante codigo**
     - Owner genera codigo unico `INV-XXXX` con caducidad (7 dias por defecto) desde el mismo modal.
     - El codigo queda visible en la tarjeta de la boda y puede copiarse para compartirlo por email/WhatsApp.
     - El planner invitado accede a `/aceptar-codigo` o al onboarding y pega el codigo; al validar se crea el vinculo con rol planner.
     - Estados del codigo: `pending`, `accepted`, `expired`. Se permite regenerar (invalida el anterior) o revocar manualmente.
   - Modal mantiene tab `Assistant` para asistentes internos, permitiendo invitar por email o compartir codigo equivalente (`AST-XXXX`).
   - Validaci?n: si el correo existe se muestra el perfil asociado; si no existe se ofrece enviar invitaci?n de alta (pendiente de template). En modo codigo se valida caducidad y que no se haya usado.
   - Confirmar (o aceptar codigo) actualiza `weddings/{id}` (`ownerIds`, `plannerIds`, `assistantIds`) y crea documentos espejo en `users/{uid}/weddings/{weddingId}` con el rol asignado.
   - Se registra evento `wedding_role_invited`, se envía correo/notificacion y se muestra toast; la invitación queda visible en Home del invitado con botones `Aceptar`/`Rechazar` cuando se usa el flujo por email.
   - Owners pueden invitar planners o assistants; planners sólo pueden sumar assistants (upgrades a planner se documentan en el [Flujo 29](./flujo-29-upgrade-roles.md)).
   - Al aceptar se marca `status=accepted`, se refrescan listas en `useWedding` y se activa seguimiento en dashboards; al rechazar o expirar el codigo se elimina la relación y se notifica al owner.

5. Portfolio multi-boda
   - Nueva pestaña "Resumen multi boda" en Bodas.jsx con tarjetas MultiWeddingSummary (activas, pr?ximas, progreso medio, archivadas).
   - Tabla WeddingPortfolioTable con filtros (estado, rol, búsqueda, rango de fechas) y acciones r?pidas (seleccionar/archivar).
   - Las acciones se validan según modulePermissions y el rol activo antes de archivar/restaurar o sincronizar.
## 4. Persistencia y datos
- Firestore `users/{uid}`: `activeWeddingId`, `weddings[]` con roles, progreso, estado.
- `weddings/{id}`: metadata, ownerIds/plannerIds/assistantIds, estado `active|archived`, seeds creados en subcolecciones (`finance`, `tasks`).
- `weddings/{id}/activity` (plan) para feed de eventos.

## 5. Reglas de negocio
- Owners solo ven su boda salvo invitación; planners pueden crear nuevas y alternar.
- Archivado restringido a owner/planner; assistants quedan en lectura.
- Creación sin fecha genera advertencia (impacta seeds timeline).
- Boda activa se guarda en contexto y localStorage para retomar.

## 6. Estados especiales y errores
- Sin bodas ? card onboarding con CTA crear primera boda.
- Error al crear boda ? toast y rollback; se intenta reintentar seeds.
- Cambiar a boda sin permisos ? fallback a boda anterior + mensaje.
- Archivos/actividades sin datos ? placeholders en detalle.

## 7. Integración con otros flujos
- Flujo 2 usa `activeWeddingId` para onboarding.
- Flujo 6, 14, 17 cargan stats según boda activa.
- Flujo 12 usa lista de bodas para preferencias de notificaciones.
- Flujo 21 condiciona sitio público por boda seleccionada.

## 8. Métricas y monitorización
- Eventos: `wedding_created`, `wedding_switched`, `wedding_archived`, `wedding_restored`.
- Indicadores: nº de bodas activas por planner, tiempo medio para crear boda, ratio archivado/restaurado y porcentaje de bodas sincronizadas (CRM ok vs en cola/error).

## 9. Pruebas recomendadas
- Unitarias: context `useWedding`, reducers, creación/archivado.
- Integración: crear boda �?' seeds en finanzas/tareas �?' alternar �?' verificar dashboards cargan y permisos por módulo se aplican.
- E2E: planner crea segunda boda, alterna, archiva, sincroniza CRM y valida restricciones por módulo.


## Cobertura E2E implementada
- `cypress/e2e/weddings/multi-weddings-flow.cy.js`: valida la vista de bodas activas/archivadas usando datos del stub de Cypress, comprueba la persistencia del `activeWedding` y la disponibilidad del CTA para planners.
- `cypress/e2e/weddings/wedding-team-flow.cy.js`: valida asignación de roles/miembros y navegación multi-boda.

## 10. Checklist de despliegue
- Reglas Firestore para `weddings`, `users/{uid}` (permisos por rol).
- Seeds y Cloud Functions idempotentes para nuevas bodas.
- Validar UI con >10 bodas (scroll, selector).
- QA de traducciones y copy en wizard.

## 11. Roadmap / pendientes
- Worker CRM (procesamiento y reintentos), métricas de sincronización y alertas multi-boda.
- Activity feed con timeline consolidado y avisos en vivo.
- Suites E2E específicas para permisos por módulo y flujos CRM.
