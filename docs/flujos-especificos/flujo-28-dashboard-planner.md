# 28. Dashboard Wedding Planner (estado 2025-10-13)

> Implementado: `HomePage.jsx` (deriva a `PlannerDashboard.jsx` para planners), `PlannerDashboard.jsx`, `WeddingContext.jsx`, `useFirestoreCollection.js`, `useWeddingCollection.js`, navegación planner en `Nav.jsx`, portfolio multi-boda en `Bodas.jsx`.
> Pendiente: poblar métricas de alertas/inspiración/blog, sincronizar recuentos con Firestore en tiempo real y reforzar UX cuando no exista boda activa.

## 1. Objetivo y alcance
- Entregar a usuarios con rol planner un panel inicial centrado en la gestión simultánea de varias bodas.
- Mostrar métricas rápidas (bodas activas, tareas, proveedores) con accesos directos a los módulos clave.
- Servir como hub para inspiración y contenido editorial enfocado a profesionales.

## 2. Trigger y rutas
- Login con perfil planner → `/home` renderiza `PlannerDashboard` (`src/components/HomePage.jsx`, condicional `role === 'planner'`).
- Menú inferior planner (`Nav.jsx`) mantiene accesos a `/home`, `/tasks`, `/bodas`, `/more`.
- Tarjetas del panel enlazan a `/bodas`, `/alertas`, `/tasks`, `/proveedores`.

## 3. Paso a paso UX actual
1. **Carga inicial**
   - `WeddingContext` asegura listado de bodas (`users/{uid}/weddings`) y selecciona `activeWedding` desde localStorage (`maloveapp_active_wedding_user_{uid}`) o primer resultado.
   - El dashboard se presenta en contenedor centrado con título “Panel de Wedding Planner”.
2. **Tarjetas métricas**
   - `DashCard` (componente inline) muestra cuatro KPIs:
   - Bodas activas = `weddings.length`.
   - Alertas = `usePlannerAlerts` contabiliza notificaciones sin leer (`payload.weddingId` asociado) obtenidas vía `/api/notifications`, mostrando `'!'` si falla la consulta.
   - Tareas = nº de documentos `meetings` sin `completed`.
   - Proveedores = nº de documentos en `suppliers`.
   - Cada tarjeta orienta a módulo relevante mediante `<Link>`.
3. **Inspiración reciente**
   - Carga inicial (`useEffect`) que consulta `fetchWall` para las categorías `decoracion`, `ceremonia`, `banquete`, `flores`, `vestidos`; se muestra skeleton accesible mientras llega la respuesta.
   - Cada mosaico usa `ExternalImage` + degradado, emite `planner_inspiration_clicked` al pulsar y enlaza con `/inspiracion`.
4. **Blogs destacados**
   - Obtiene las últimas noticias con `fetchWeddingNews(page=1,pageSize=10,lang)` y muestra 3 entradas (link externo + fuente). Skeletons en carga, mensaje claro en caso de error.

## 4. Persistencia y datos
- **Listado de bodas**: `WeddingContext.jsx` suscribe `users/{uid}/weddings` (Firestore) y normaliza permisos con `ensureWeddingAccessMetadata`. Cachea resultado en localStorage `maloveapp_cached_weddings`.
- **Boda activa**: se persiste en `maloveapp_active_wedding` + clave por usuario; al cambiarla se sincroniza `users/{uid}` y `users/{uid}/weddings/{id}` (`lastAccessedAt`).
- **Subcolecciones**: `useFirestoreCollection('meetings')` y `'suppliers'` delegan en `useWeddingCollection` para leer `weddings/{activeWedding}/meetings|suppliers`, con fallback offline localStorage (`maloveapp_{wid}_{sub}`) y suscripción `onSnapshot`.
- **Alertas**: `usePlannerAlerts` agrega notificaciones sin leer para las bodas del planner filtrando `payload.weddingId`; escucha `window` `mywed360-notif` para refrescos rápidos.
- **Notificaciones**: `notifications` (colección global + caché local) guarda `payload` enriquecido (weddingId, category, severity, source). Opción: contadores agregados `weddings/{id}/counters/alerts` para evitar agregados costosos.

## 5. Reglas de negocio y permisos
- Solo perfiles con `userProfile.role === 'planner'` acceden a este dashboard.
- `ensureWeddingAccessMetadata` aporta `permissions` por boda (planner hereda `manageGuests`, `manageTasks`, `manageProviders`, acceso lectura finanzas).
- Navegación planner omite módulo de finanzas por defecto, priorizando tareas y portafolio de bodas.
- `Bodas.jsx` respeta permisos `createWedding` / `archiveWedding` provenientes del contexto.

## 6. Estados especiales y errores
- **Sin bodas disponibles**: cuando `weddings.length === 0` se muestra una tarjeta de bienvenida con copy orientado y CTA directo a `/bodas`, registrando `planner_empty_state_cta`.
- **Firebase no inicializado**: se recurre a cache local (`loadCachedWeddings`), permitiendo operar en modo offline.
- **Cambio de boda**: `setActiveWedding` dispara evento `wedding_switched` vía `PerformanceMonitor`.
- **Falta de permisos**: si el planner pierde acceso a una boda, `useWedding` la elimina del array y limpia referencias en localStorage.

## 7. Integración con otros flujos
- Tarjeta “Bodas activas” abre `Bodas.jsx` (Flujo 10) para gestión multi-evento.
- “Tareas” conecta con timeline del día B (`/tasks`, Flujos 5a/5b).
- “Proveedores” abre módulo de RFQ IA (`/proveedores`, Flujo 5a).
- Se coordina con `flujo-24` (galería inspiración) para futuros prefetch de imágenes y con `flujo-26` (blog) para contenido editorial.

## 8. Métricas y monitorización
- Evento `wedding_switched` registra cambios de contexto (desde `WeddingContext.setActiveWedding`).
- `PerformanceMonitor` previsto para instrumentar navegación; falta telemetría específica del dashboard planner (p.ej. clicks en tarjetas, scroll en inspiración).

## Cobertura E2E implementada
- `cypress/e2e/dashboard/diagnostic-panel.cy.js`: valida el panel de diagnóstico y sus enlaces auxiliares.
- `cypress/e2e/dashboard/global-search-shortcuts.cy.js`: recorre accesos rápidos y atajos de búsqueda global.
- `cypress/e2e/dashboard/main-navigation.cy.js`: comprueba navegación principal para planners con múltiples bodas.
- `cypress/e2e/dashboard/planner-dashboard.cy.js`: smoke completo del dashboard (widgets, métricas y persistencia de selección).

## 9. Pruebas recomendadas
- Unitarias: validar recuentos en `PlannerDashboard` usando mocks de `useWedding` y `useFirestoreCollection`.
- Integración: asegurar que `WeddingContext` selecciona correctamente boda activa y sincroniza permisos.
- E2E: sesión planner con múltiples bodas → navegación entre `/home` y `/bodas`, confirmando persistencia `localStorage`.

## 10. Backlog inmediato
- Conectar recuento de alertas a colección real (`weddings/{id}/alerts`).
- Reemplazar placeholders de inspiración/blog con datos remotos y skeletons reales.
- Añadir empty states con CTA (“Crear boda”, “Vincular boda existente”) cuando no haya bodas.
- Instrumentar eventos `planner_card_clicked`, `planner_inspiration_opened` para analítica.
- Revisar accesibilidad (focus states en `DashCard`, aria-labels en placeholders animados).
- Definir pipeline de alertas: normalizar payload `{ weddingId, severity, category }`, exponer hook `usePlannerAlerts` que consuma `/api/notifications` o contadores agregados y alimentar la tarjeta de alertas.
