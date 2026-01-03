# 2. Creación de Evento con IA (bodas y eventos afines) · estado 2025-10-08

> Referencia principal del descubrimiento personalizado: `docs/flujos-especificos/flujo-2-descubrimiento-personalizado.md`.
> Este documento cubre el wizard legacy de creación rápida. Mantén ambos sincronizados hasta completar la migración.

> Implementado: `src/pages/CreateWeddingAI.jsx` (wizard dos pasos), `src/pages/AyudaCeremonia.jsx` (copy dinámico), `src/pages/BodaDetalle.jsx` (perfil de evento), `src/context/WeddingContext.jsx`, servicios en `src/services/WeddingService.js` (createWedding, seedDefaultTasksForWedding), catálogo `src/config/eventStyles.js`.
> Pendiente: habilitar opt-in a planner desde Perfil, paneles/alertas para la telemetría del funnel, refactor de rutas `/bodas`→`/eventos`, integración IA contextual y despliegue del flujo multi-evento para planners.

## 1. Objetivo y alcance
- Guiar a owners sin evento activo desde el onboarding hasta su primer hub operacional.
- Permitir organizar bodas y celebraciones afines (cumpleaños, aniversarios, baby showers) reutilizando infraestructura y seeds automáticos.
- Crear `weddings/{id}` con datos base + perfil ampliado (`eventType`, `eventProfile`) vinculados al usuario y listos para IA.
- Proteger el flujo para owners/parejas, evitando accesos de planners o asistentes hasta contar con opt-ins explícitos.

## 2. Trigger y rutas
- Redirección automática tras registro/verificación cuando `activeWeddingId` es falsy.
- Acceso manual a `/create-wedding-ai` para owners (roles `owner`/`pareja`). Planners y asistentes reciben bloqueo con CTA a inicio.
- CTA «Crear nuevo evento» en la cabecera y en el menú contextual fueron retirados; no debe existir este botón en la navegación superior para ningún rol. Los accesos multi-evento quedan limitados a flujos dedicados (wizard, onboarding, enlaces profundos aprobados).

## 3. Paso a paso UX (wizard multi-evento)
1. **Paso 1 · Datos base**
   - Card central (`max-w-3xl mx-auto`) con encabezado y contador `Paso 1 de 2`.
   - Campos: `Nombre del evento o pareja`, `Fecha del evento`, `Ubicación`, selector `Tipo de evento` (`boda` | `evento`) y `Estilo deseado` (catálogo centralizado).
   - Validaciones: fecha y ubicación obligatorias; mensajes inline en rojo (`fieldErrors`) antes de avanzar.
   - CTA: `Cancelar`, `Siguiente` (bloquea submit si faltan datos).

2. **Paso 2 · Perfil del evento**
   - Campos perfil IA: `Tamaño estimado` (`guestCountRange`), `Nivel de formalidad`, `Tipo de ceremonia` (solo bodas), checkboxes `Eventos relacionados`, `Notas`.
   - Se muestra resumen de selección y se permite volver al paso anterior sin perder datos.
   - CTA primaria dinámica: `Crear boda` / `Crear evento` (spinner `"Creando…"`) con fallback a `Volver`.

3. **Flujo final**
   - Guardas por rol vía `useAuth` (owners/parejas/admin). Usuarios no autorizados ven Card de aviso y botón “Volver al inicio”.
   - Al enviar: se construye payload con `eventType`, `eventProfile`, `preferences.style` y fallback de nombre (`Mi Boda` / `Mi Evento`), se llama a `createWedding` y se navega a `/bodas/{id}`.

## 4. Persistencia y datos
- `weddings/{id}`:
  - Campos base: `ownerIds`, `plannerIds`, `subscription`, `createdAt`, `name`, `weddingDate`, `location`, `preferences.style`.
  - Nuevos: `eventType` (`boda` | `evento`), `eventProfile` (`guestCountRange`, `formalityLevel`, `ceremonyType|null`, `relatedEvents[]`, `notes`).
- `users/{uid}` (merge):
  - `weddingId`, `activeWeddingId`, `hasActiveWedding`, `lastWeddingCreatedAt`.
- `users/{uid}/weddings/{id}`:
  - Resumen: `id`, `name`, `weddingDate`, `location`, `progress`, `active`, `createdAt`.
  - Nuevos: `eventType`, `eventProfileSummary` (mismos campos clave + `style`).
- Seeds:
  - `weddings/{id}/tasks/_seed_meta` registra `seededAt`, `version`, `eventType`, `guestCountRange`, `formalityLevel`.
  - `finance/main` inicializado (movements vacíos).

## 5. Reglas de negocio
- Acceden solo roles `owner`/`pareja` (owner-like) o admin; planners/assistants bloqueados hasta flujo de invitación.
- `weddingDate` y `location` obligatorios para continuar; `eventType` requerido (default `boda`).
- `createWedding` normaliza `eventType` (lowercase) y `eventProfile` (arrays y notas sanitizadas).
- Idempotencia seeds: `_seed_meta` evita duplicados; `fixParentBlockDates` se ejecuta solo cuando hay fecha.
- `WeddingContext` actualiza `activeWeddingId` y escribe `lastActiveWeddingAt` al cambiar de evento.

## 6. Estados especiales y errores
- Validaciones por paso con mensajes inline (`Selecciona la fecha`, `Indica la ubicación`); no se delega en HTML5 silencioso.
- Errores de servicio: mensaje genérico `Error creando la boda` bajo el formulario; botón permanece habilitado para reintento.
- Usuarios no autorizados: Card informativa + CTA `Volver al inicio`.
- Desconexión network: captura `catch` y muestra mensaje; no hay retry automático.

## 7. Integración con otros flujos
- `WeddingContext` consume `eventProfileSummary` para futuras vistas multi-evento.
- `BodaDetalle.jsx` muestra badge de tipo (`Boda`/`Evento`) y Card con perfil (tamaño, formalidad, ceremonia, eventos relacionados, estilo, notas).
- `AyudaCeremonia.jsx` adapta título (`Ayuda Ceremonia` / `Guion del evento`) y momentos sugeridos según `eventType`.
- Seeds, checklist, timeline y proveedores deberán leer `eventProfile` a medio plazo (ver flujos 3, 5, 6, 10, 11, 17).

## 8. Métricas y monitorización
- Telemetría client-side implementada (`event_creation_view`, `event_creation_step1_completed`, `event_creation_step2_completed`, `event_creation_submit`, `event_creation_succeeded`, `event_creation_failed`) con payload enriquecido (`uid`, `has_wedding_before`, `eventType`, `guestCountRange`, `formalityLevel`, `style`, `has_date`, `has_notes`, `has_related`, `error_code`).
- Servicio `createWedding` reporta `event_creation_seed_failed` cuando los seeds automáticos fallan.
- Métrica clave: tiempo desde `signup_completed` (flujo 1) hasta `event_creation_succeeded`.
- Pendiente: dashboards/funnel y alertas backend que consuman los eventos, más monitorización `_seed_meta` desde colector dedicado (hasta entonces revisar `console.warn`).

## 9. Pruebas recomendadas
- **E2E (multi-evento)**
  - Redirección owner sin eventos → `/create-wedding-ai`.
  - Paso 1: validar errores al omitir fecha o ubicación; botón `Siguiente` deshabilita submit directo.
  - Paso 2: selector `eventType` cambia copy y visibilidad de `ceremonyType`.
  - Submit feliz boda/evento: comprueba navegación, documentos en Firestore (`weddings/{id}`, `users/{uid}`, `_seed_meta`).
  - Usuario planner/assistant: asegura mensaje de acceso restringido.
- **E2E second look**
  - Navegar atrás (Paso 2 → Paso 1) conserva datos.
  - Usuario con evento existente: CTA manual crea nuevo evento y `activeWeddingId` se actualiza.
- **Seeds & contexto**
  - `_seed_meta` contiene `eventType` y `guestCountRange`.
  - `WeddingContext` persiste selección tras recarga (`localStorage`).
- **Unitarias**
  - `createWedding`: sanitiza `eventProfile`, escribe `eventProfileSummary`, actualiza `activeWeddingId`.
  - `seedDefaultTasksForWedding`: escribe metadata extendida y evita doble seed.
  - `normalizeEventType` maneja entradas irregulares (`'Boda'`, `null`).

## Cobertura E2E implementada
- `cypress/e2e/onboarding/create-event-flow.cy.js`: recorre ambos pasos del wizard multi-evento, valida persistencia de datos entre pasos y el copy condicional según tipo de evento.
- `cypress/e2e/onboarding/create-event-cta.cy.js`: asegura que el CTA «Crear nuevo evento» no aparece ni en la cabecera ni en el menú contextual.

## 10. Checklist de despliegue
- Reglas Firestore: permitir escritura de `eventType`, `eventProfile`, `eventProfileSummary` y nuevos campos en `_seed_meta`.
- Script `scripts/migrate-event-profile.js` para etiquetar eventos legacy con `eventType: 'boda'` y generar `eventProfileSummary` básico antes del switch.
  1. Obtener credenciales (`serviceAccount.json`) y ejecutar: `node scripts/migrate-event-profile.js --credentials path/to/serviceAccount.json`.
  2. Verificar en staging que `weddings/{id}` contiene `eventType/eventProfile` normalizados y que cada `users/{uid}/weddings/{id}` refleja `eventProfileSummary`.
  3. Revisar logs de consola (totales migrados) y auditar uno o dos documentos en la consola de Firestore antes de seguir a producción.
- Revisión de copy/traducciones (`Crear boda`, `Crear evento`) y estilos centralizados (`config/eventStyles.js`).
- Telemetría: preparar dashboard funnel + ratio adopción Paso 2.
- QA: actualizar suites Cypress/E2E con los casos anteriores.

## 11. Roadmap / pendientes
- Implementar opt-in a planner/assistant desde Perfil con flujo dedicado.
- Refactorizar rutas y componentes (`/bodas` → `/eventos`) cuando exista soporte multi-evento en toda la app.
- Conectar telemetría con dashboards de adopción segmentados por `eventType` y alertas de funnel.
- ✅ 2025-10-13: Asistencia IA contextual con prompts por tipo de evento y fallback offline en ChatWidget.
- ✅ 2025-10-08: Wizard multi-evento, servicios y pantallas asociados actualizados para `eventType/eventProfile`.
- ✅ 2025-10-08: Catálogo de estilos centralizado y copy adaptable (`Boda`/`Evento`).
- 🚫 2025-10-13: CTA «Crear nuevo evento» retirado del header y del menú contextual; ambos deben permanecer sin botón y mantenerse el selector multi-evento habilitado para owners.

## 12. Resumen de implementación · 2025-10-08
- Wizard dividido en dos pasos con guardas de rol, selector `eventType` y perfil ampliado (`eventProfile`).
- `createWedding` normaliza payload, actualiza `eventProfileSummary`, marca `activeWeddingId` y extiende `_seed_meta`.
- `BodaDetalle` muestra badge de tipo y Card de perfil; `AyudaCeremonia` adapta copy según `eventType`.
- Catálogo `config/eventStyles.js` agrupa estilos, tamaños, formalidad, ceremonias y eventos relacionados.
- Implementación reciente: telemetría del funnel, CTA multi-evento, selector extendido y asistencia IA contextual con fallback offline.
