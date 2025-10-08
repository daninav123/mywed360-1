# 10. Gestión de Bodas Múltiples (estado 2025-10-07)

> Implementado: `Bodas.jsx`, `BodaDetalle.jsx`, `WeddingSelector.jsx`, `WeddingFormModal.jsx`, `useWedding` context, seeding inicial (finanzas/tareas) al crear boda desde planner.
> Pendiente: dashboards multi-boda avanzados, permisos granulares por módulo y vistas cruzadas consolidadas.

## 1. Objetivo y alcance
- Permitir que planners/owners gestionen varias bodas, creando nuevas y alternando entre ellas.
- Ofrecer hub de detalle con KPIs clave y navegación contextual.
- Sincronizar seeds iniciales (finanzas, timeline) cuando se crea boda nueva.

## 2. Trigger y rutas
- Menú inferior (rol planner) → pestaña **Bodas** (`/bodas`, `Bodas.jsx`) lista bodas activas y archivadas.
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
   - `BodaDetalle` resume invitados confirmados, presupuesto, tareas, comunicación y enlaces rápidos.
   - Acciones: archivar/restaurar, abrir módulos clave (RSVP, seating, presupuesto).

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
- Sin bodas → card onboarding con CTA crear primera boda.
- Error al crear boda → toast y rollback; se intenta reintentar seeds.
- Cambiar a boda sin permisos → fallback a boda anterior + mensaje.
- Archivos/actividades sin datos → placeholders en detalle.

## 7. Integración con otros flujos
- Flujo 2 usa `activeWeddingId` para onboarding.
- Flujo 6, 14, 17 cargan stats según boda activa.
- Flujo 12 usa lista de bodas para preferencias de notificaciones.
- Flujo 21 condiciona sitio público por boda seleccionada.

## 8. Métricas y monitorización
- Eventos: `wedding_created`, `wedding_switched`, `wedding_archived`, `wedding_restored`.
- Indicadores: nº de bodas activas por planner, tiempo medio para crear boda, ratio archivado/restaurado.

## 9. Pruebas recomendadas
- Unitarias: context `useWedding`, reducers, creación/archivado.
- Integración: crear boda → seeds en finanzas/tareas → switch → verificar dashboards cargan.
- E2E: planner crea segunda boda, alterna, archiva y restaura.

## 10. Checklist de despliegue
- Reglas Firestore para `weddings`, `users/{uid}` (permisos por rol).
- Seeds y Cloud Functions idempotentes para nuevas bodas.
- Validar UI con >10 bodas (scroll, selector).
- QA de traducciones y copy en wizard.

## 11. Roadmap / pendientes
- Dashboard multi-boda (resúmenes cruzados, comparativas).
- Permisos granulares por módulo/colección.
- Filtro de bodas por estado/fecha/owner.
- Sincronización con planner CRM externo.
- Activity feed y alertas multi-boda.
