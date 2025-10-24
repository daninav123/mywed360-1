# 28. Dashboard Wedding Planner (estado 2025-10-13)

> Implementado: `HomePage.jsx` (deriva a `PlannerDashboard.jsx` para planners), `PlannerDashboard.jsx`, `WeddingContext.jsx`, `useFirestoreCollection.js`, `useWeddingCollection.js`, navegaci�n planner en `Nav.jsx`, portfolio multi-boda en `Bodas.jsx`.
> Pendiente: poblar m�tricas de alertas/inspiraci�n/blog, sincronizar recuentos con Firestore en tiempo real y reforzar UX cuando no exista boda activa.

## 1. Objetivo y alcance
- Entregar a usuarios con rol planner un panel inicial centrado en la gesti�n simult�nea de varias bodas.
- Mostrar m�tricas r�pidas (bodas activas, tareas, proveedores) con accesos directos a los m�dulos clave.
- Servir como hub para inspiraci�n y contenido editorial enfocado a profesionales.

## 2. Trigger y rutas
- Login con perfil planner � `/home` renderiza `PlannerDashboard` (`src/components/HomePage.jsx`, condicional `role === 'planner'`).
- Men� inferior planner (`Nav.jsx`) mantiene accesos a `/home`, `/tasks`, `/bodas`, `/more`.
- Tarjetas del panel enlazan a `/bodas`, `/alertas`, `/tasks`, `/proveedores`.

## 3. Paso a paso UX actual
1. **Carga inicial**
   - `WeddingContext` asegura listado de bodas (`users/{uid}/weddings`) y selecciona `activeWedding` desde localStorage (`maloveapp_active_wedding_user_{uid}`) o primer resultado.
   - El dashboard se presenta en contenedor centrado con t�tulo Panel de Wedding Planner.
2. **Tarjetas m�tricas**
   - `DashCard` (componente inline) muestra cuatro KPIs:
   - Bodas activas = `weddings.length`.
   - Alertas = `usePlannerAlerts` contabiliza notificaciones sin leer (`payload.weddingId` asociado) obtenidas v�a `/api/notifications`, mostrando `'!'` si falla la consulta.
   - Tareas = n� de documentos `meetings` sin `completed`.
   - Proveedores = n� de documentos en `suppliers`.
   - Cada tarjeta orienta a m�dulo relevante mediante `<Link>`.
3. **Inspiraci�n reciente**
   - Carga inicial (`useEffect`) que consulta `fetchWall` para las categor�as `decoracion`, `ceremonia`, `banquete`, `flores`, `vestidos`; se muestra skeleton accesible mientras llega la respuesta.
   - Cada mosaico usa `ExternalImage` + degradado, emite `planner_inspiration_clicked` al pulsar y enlaza con `/inspiracion`.
4. **Blogs destacados**
   - Obtiene las �ltimas noticias con `fetchWeddingNews(page=1,pageSize=10,lang)` y muestra 3 entradas (link externo + fuente). Skeletons en carga, mensaje claro en caso de error.

## 4. Persistencia y datos
- **Listado de bodas**: `WeddingContext.jsx` suscribe `users/{uid}/weddings` (Firestore) y normaliza permisos con `ensureWeddingAccessMetadata`. Cachea resultado en localStorage `maloveapp_cached_weddings`.
- **Boda activa**: se persiste en `maloveapp_active_wedding` + clave por usuario; al cambiarla se sincroniza `users/{uid}` y `users/{uid}/weddings/{id}` (`lastAccessedAt`).
- **Subcolecciones**: `useFirestoreCollection('meetings')` y `'suppliers'` delegan en `useWeddingCollection` para leer `weddings/{activeWedding}/meetings|suppliers`, con fallback offline localStorage (`maloveapp_{wid}_{sub}`) y suscripci�n `onSnapshot`.
- **Alertas**: `usePlannerAlerts` agrega notificaciones sin leer para las bodas del planner filtrando `payload.weddingId`; escucha `window` `mywed360-notif` para refrescos r�pidos.
- **Notificaciones**: `notifications` (colecci�n global + cach� local) guarda `payload` enriquecido (weddingId, category, severity, source). Opci�n: contadores agregados `weddings/{id}/counters/alerts` para evitar agregados costosos.

## 5. Reglas de negocio y permisos
- Solo perfiles con `userProfile.role === 'planner'` acceden a este dashboard.
- `ensureWeddingAccessMetadata` aporta `permissions` por boda (planner hereda `manageGuests`, `manageTasks`, `manageProviders`, acceso lectura finanzas).
- Navegaci�n planner omite m�dulo de finanzas por defecto, priorizando tareas y portafolio de bodas.
- `Bodas.jsx` respeta permisos `createWedding` / `archiveWedding` provenientes del contexto.

## 6. Estados especiales y errores
- **Sin bodas disponibles**: cuando `weddings.length === 0` se muestra una tarjeta de bienvenida con copy orientado y CTA directo a `/bodas`, registrando `planner_empty_state_cta`.
- **Firebase no inicializado**: se recurre a cache local (`loadCachedWeddings`), permitiendo operar en modo offline.
- **Cambio de boda**: `setActiveWedding` dispara evento `wedding_switched` v�a `PerformanceMonitor`.
- **Falta de permisos**: si el planner pierde acceso a una boda, `useWedding` la elimina del array y limpia referencias en localStorage.

## 7. Integraci�n con otros flujos
- Tarjeta Bodas activas abre `Bodas.jsx` (Flujo 10) para gesti�n multi-evento.
- Tareas conecta con timeline del d�a B (`/tasks`, Flujos 5a/5b).
- Proveedores abre m�dulo de RFQ IA (`/proveedores`, Flujo 5a).
- Se coordina con `flujo-24` (galer�a inspiraci�n) para futuros prefetch de im�genes y con `flujo-26` (blog) para contenido editorial.

## 8. M�tricas y monitorizaci�n
- Evento `wedding_switched` registra cambios de contexto (desde `WeddingContext.setActiveWedding`).
- `PerformanceMonitor` previsto para instrumentar navegaci�n; falta telemetr�a espec�fica del dashboard planner (p.ej. clicks en tarjetas, scroll en inspiraci�n).

## Cobertura E2E implementada
- `cypress/e2e/dashboard/diagnostic-panel.cy.js`: valida el panel de diagn�stico y sus enlaces auxiliares.
- `cypress/e2e/dashboard/global-search-shortcuts.cy.js`: recorre accesos r�pidos y atajos de b�squeda global.
- `cypress/e2e/dashboard/main-navigation.cy.js`: comprueba navegaci�n principal para planners con m�ltiples bodas.
- `cypress/e2e/dashboard/planner-dashboard.cy.js`: smoke completo del dashboard (widgets, m�tricas y persistencia de selecci�n).

## 9. Pruebas recomendadas
- Unitarias: validar recuentos en `PlannerDashboard` usando mocks de `useWedding` y `useFirestoreCollection`.
- Integraci�n: asegurar que `WeddingContext` selecciona correctamente boda activa y sincroniza permisos.
- E2E: sesi�n planner con m�ltiples bodas � navegaci�n entre `/home` y `/bodas`, confirmando persistencia `localStorage`.

## 10. Backlog inmediato
- Conectar recuento de alertas a colecci�n real (`weddings/{id}/alerts`).
- Reemplazar placeholders de inspiraci�n/blog con datos remotos y skeletons reales.
- A�adir empty states con CTA (Crear boda, Vincular boda existente) cuando no haya bodas.
- Instrumentar eventos `planner_card_clicked`, `planner_inspiration_opened` para anal�tica.
- Revisar accesibilidad (focus states en `DashCard`, aria-labels en placeholders animados).
- Definir pipeline de alertas: normalizar payload `{ weddingId, severity, category }`, exponer hook `usePlannerAlerts` que consuma `/api/notifications` o contadores agregados y alimentar la tarjeta de alertas.
