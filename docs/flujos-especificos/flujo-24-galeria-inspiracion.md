# 24. Inspiracion Visual Unificada (estado 2025-10-12)

> Consolidado (2025-10-12): Unifica los flujos 24 (galeria) y 25 (inspiracion personalizada) en la pagina unica `/inspiracion`.
> Implementado (codigo 2025-10-12):
> - `Inspiration.jsx` controla el scroll infinito, la personalizacion por tags y el tracking de interacciones.
> - `InspirationGallery.jsx` renderiza el grid responsivo, el lightbox y la sincronizacion de favoritos.
> - Servicios `wallService`, `inspirationService` y `SyncService` coordinan el fetch externo, la normalizacion y el almacenamiento local/Firestore.
> - Prefetch desde `PlannerDashboard`, eventos custom (`MaLove.App-important-note`) y accesibilidad basica (aria-labels, key handlers).
> - Conector oficial Pinterest/Instagram (`backend/services/socialFeeds.js`) con cache LRU reutilizado por `/api/instagram-wall`.

> Pendiente o incompleto:
> - Motor de recomendaciones con IA / clustering avanzado y colecciones curatoriales.
> - Agrupar imagenes relacionadas y sugerir colecciones automaticas (favoritos, temporada).
> - Modo offline completo (cache de feed) y reporting centralizado de errores de imagen.
> - Instrumentar metricas completas (tiempo en pantalla, conversion a acciones) y UI de errores visibles.

Este flujo describe la experiencia completa de inspiracion visual: desde la previsualizacion en la home hasta la vista dedicada con feed personalizado, gestion de favoritos y analitica.

## 1. Objetivo y alcance
- Presentar ideas visuales relevantes segun preferencias y datos previos (favoritos, tags, historial).
- Permitir busqueda libre, filtrado por categorias y pestaña de favoritos sincronizada entre dispositivos.
- Servir como fuente de contenido para el blog interno, el sitio publico y comunicacion con invitados.\n- Reflejar el weddingProfile (estilo core, contrastes, no-go) ofreciendo bloques etiquetados y packs sorpresa alineados con la personalización continua.
- Registrar interacciones para nutrir metricas y futuros modelos de recomendacion.

## 2. Trigger y rutas
- Home: bloque **Galeria de inspiracion** en la parte inferior con carrusel por categoria y CTA `Ver mas` que abre `/inspiracion`.
- Planner Dashboard: tarjeta destacada con CTA `Ver inspiracion` que deep-linkea a la etiqueta detectada como mas relevante.
- Deep-links contextuales desde checklist, timeline o proveedores (`/inspiracion?tag=decoracion`) y enlaces compartidos.

## 3. Arquitectura y piezas clave
- **UI principal** (`InspirationGallery.jsx`): grid responsivo, lightbox, toggles de favoritos, chips de tags dinamicos y gestion de accesibilidad basica.
- **Controlador de pagina** (`Inspiration.jsx`): gestiona estado global, fetch paginado (`fetchWall`), almacenamiento de favoritos, tags preferidos y eventos de sincronizacion (`StorageEvent`).
- **Servicios**:
  - `wallService`: orquesta llamadas a fuentes externas (Pinterest boards, Instagram hashtags) y normaliza `{id, url, thumb, tags, origin}`.
  - `inspirationService`: calcula scores por preferencia, registra interacciones (`trackInteraction`) y expone helpers para merge sin duplicados.
  - Personalización: utiliza `weddingProfile` (vibeKeywords, specialInterests, noGoItems) y `weddingInsights.styleWeights` para etiquetar contenidos como Core o Contraste y ajustar su score.
  - `SyncService`: sincroniza favoritos por boda entre `localStorage inspirationFavorites_{weddingId}` y el documento compartido `weddings/{id}/inspiration/favorites` (campo `items`), limitando a 200 elementos.
- **Prefetch**: `PlannerDashboard` invoca `prefetchModule('inspiration')` y precarga la primera pagina para mejorar tiempo de apertura.

## 4. Paso a paso UX
1. **Previsualizacion en Home**
   - `HomePage.jsx` precarga la primera imagen de las categorias destacadas (`decoracion`, `coctel`, `banquete`, `ceremonia`, `flores`, `vestido`, `pastel`, `fotografia`) mediante `fetchWall(1, categoria)` y las enlaza a `/inspiracion?tag=<slug>`.
   - El carrusel muestra tarjetas en orden fijo y admite scroll horizontal en mobile; un CTA por categoria abre `/inspiracion` con la etiqueta correspondiente.
2. **Inicializacion de la vista completa**
   - `Inspiration.jsx` obtiene el usuario (`useAuth`) y la boda activa cuando aplica.
   - Determina el tag inicial a partir del deep-link, el CTA o el historial (`prefTags`).
   - Si existen `specialInterests` se priorizan tags asociados (ej. `circo`, `after-party`) y se etiqueta el feed con Core/Contraste según `nivelContraste`.
   - Prefetch de modulos y estado inicial (query `wedding`, pagina 1).
3. **Carga de preferencias y favoritos**
   - `loadData(storageKey, { docPath: weddings/{id}/inspiration/favorites, field: items })` recupera favoritos de la boda activa y sincroniza con Firestore cuando el usuario tiene acceso.
   - Calcula tags preferidos (`prefTags`) a partir de favoritos y eventos `trackInteraction`.
   - Refuerza/penaliza tags según `weddingInsights.styleWeights` y `noGoItems` (si un tag coincide con un no-go se oculta o se muestra tras confirmación).
   - Lanza `StorageEvent` para mantener la sincronizacion entre pestañas (fallback a memoria si falla).
4. **Fetch del feed**
   - `fetchWall(page, query)` trae resultados paginados; el merge evita duplicados y aplica `score` segun preferencia (Core > Contraste controlado > Inspiracional) y contextualiza cada item con badges.
   - Infinite scroll via `IntersectionObserver` (`lastItemRef`) detiene observacion cuando `loading` para evitar loops.
   - Watchers controlan el flag `loading` para limitar peticiones concurrentes.
5. **Busqueda y filtros**
   - `SearchBar` resetea pagina y query; guarda el termino para analytics (`inspiration_search_performed`).
   - Chips dinamicos combinan `BASE_TAGS` mas tags detectados en runtime; `tag=favs` muestra solo guardados (sin nuevas llamadas).
   - Cambiar tag dispara reinicio de pagina, recalcula query y actualiza `prefTags`.
6. **Interacciones con imagenes**
   - Click abre lightbox (`setLightbox`), incluye controles de teclado basicos y fallback de carga.
   - `handleSave` persiste favoritos, actualiza preferencia y emite toast opcional.
   - Guardar/descartar actualiza `weddingInsights` (`inspirationFaves`, `inspirationNope`) y genera eventos `inspiration_core_saved` o `inspiration_contrast_saved`.
   - `handleView` registra dwell time con `trackInteraction(userId, item, dwell, isFavorite)`.
7. **Fallbacks y errores**
   - Skeleton loaders (`DEFAULT_IMAGES`) cuando no hay datos.
   - Error de fetch: warn silencioso y CTA sugerido (cambiar tag, reintentar); UI visible pendiente.
   - Imagen rota: degrade progresivo (`thumb` -> `url` -> `original_url` -> placeholder).

## 5. Persistencia y datos
- `localStorage inspirationFavorites_{weddingId}`: cache de favoritos por boda y sincronizacion cross-tab.
- Firestore `weddings/{id}/inspiration/favorites` (campo `items`): favoritos compartidos entre todos los colaboradores de la boda (limit 200, respeta orden de insercion).
- `inspirationInteractions`: coleccion de analytics con `{userId, itemId, dwell, isFavorite, tags, contextTag, timestamp}`.
- Fuentes externas gestionadas por `wallService` a traves de los conectores oficiales:
  - Pinterest API (`PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_IDS`) con cache LRU 15 minutos.
  - Instagram Graph (`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ID`, `INSTAGRAM_HASHTAGS/IDS`) con cache LRU 10 minutos y resolucion automatica de hashtags.
  - Fallbacks Unsplash/Pexels/picsum solo si las fuentes oficiales devuelven menos de 12 items.
- `weddingInsights.inspiration`: resumen calculado (top tags core/contraste, items destacados) compartido con dashboard y asistente.
- Estado en memoria: lista de items normalizados, `prefTags`, pagina actual, flags `loading` y `hasMore`.

## 6. Reglas de negocio
- Query default `wedding` cuando no hay tag especifico o busqueda.
- Items que coinciden con `noGoItems` se ocultan por defecto; el usuario puede mostrarlos manualmente (quedan marcados `Bloqueado`).
- Favoritos se persisten por boda y se comparten entre planners/owners/assistants con acceso; invitados sin login siguen trabajando en localStorage (se invita a migrar al iniciar sesión).
- Tags base siempre visibles aunque la API no devuelva resultados.
- Las tarjetas muestran badge `Core` o `Contraste` según `contextTag`; si el contraste está en revisión se muestra aviso y se invita a resolverlo en el flujo 2C.
- Lightbox bloquea scroll del body y respeta focus trap basico (mejoras pendientes).
- Prefetch evita repetir carga si el modulo ya fue importado en la sesion.

## 7. Estados especiales y errores
- Sin resultados: muestra CTA para ajustar filtros o volver al carrusel destacado.
- API lenta: spinner en boton de cargar mas y throttle de eventos de scroll.
- StorageEvent no soportado (Safari privado): se mantiene el estado local sin sincronizacion multi-tab.
- Usuarios sin boda activa: sin personalizacion contextual, se usa heuristica global.

## 8. Integracion con otros flujos
- **Flujo 2C (Personalización continua)** consume `inspirationInteractions` y actualiza mapa de preferencias; a su vez se alimenta de packs sorpresa generados aquí.
- **Flujo 21 (Sitio publico)** reutiliza favoritos destacados seleccionados aqui.
- **Flujo 26 (Blog)** puede insertar imagenes favoritas directamente en posts.
- **Flujo 14 (Checklist)** ofrece atajos a tags especificos tras completar tareas.
- **Flujo 5 (Proveedores)** dispara deep-links segun categoria de proveedor buscada.
- **Flujo 16 (Asistente IA)** usa los favoritos para proponer ideas en chat y envía feedback al guardar/descartar.
- Eventos `MaLove.App-important-note` permiten destacar imagenes en dashboard o comunicaciones.

## 9. Metricas y monitorizacion
- Eventos: `inspiration_gallery_view`, `inspiration_wall_loaded`, `inspiration_tag_selected`, `inspiration_search_performed`, `inspiration_item_faved`, `inspiration_item_viewed`, `inspiration_lightbox_open`, `inspiration_contrast_pack_clicked`, `inspiration_no_go_blocked`.
- KPIs: tiempo medio por sesion, ratio favoritos/hits, queries mas usadas, recurrencia semanal, conversion a acciones (agregar checklist, compartir), equilibrio Core/Contraste aplicado vs. rechazado.
- Logging: `console.warn` para fallos de fetch o sync; pendiente canalizar a Sentry y capturar errores de imagen.

## 10. Pruebas recomendadas
- Unitarias: `inspirationService` (normalizacion, scoring), utilidades de favoritos, manejo de tags dinamicos.
- Integracion: cambiar tag -> fetch -> scroll infinito -> guardar favorito -> verificar persistencia y sincronizacion -> comprobar badges Core/Contraste y eventos enviados.
- E2E: `cypress/e2e/inspiration/inspiration-flow.cy.js` y `inspiration_smoke.cy.js`.
- Resiliencia: simular API lenta/errores y verificar fallback de imagenes y estados de carga.
- Accesibilidad: navegacion por teclado en grid y lightbox, pruebas de lectores de pantalla.

## 11. Checklist de despliegue
- Verificar llaves/API keys para `wallService` y cuotas de peticiones.
- Ajustar reglas Firestore para `favorites` e `inspirationInteractions`.
- Migrar colecciones legacy (`ideasPhotos` en `users/{uid}`) al nuevo esquema `weddings/{id}/inspiration/favorites` asegurando que planners/assistants vean la misma lista.
- Asegurar headers de imagenes externas (`referrerPolicy`, `Cache-Control`).
- Revisar traducciones en `i18n/locales/*/common.json` para etiquetas dinamicas.
- Configurar dashboards de latencia/errores tanto del feed como del guardado de favoritos.

## 12. Roadmap / pendientes
- Motor de recomendaciones con IA (clustering por preferencias, estacionalidad y etapa de boda).
- Colecciones tematicas automatizadas y moodboard descargable/PDF.
- Modo offline con cache en IndexedDB/service workers.
- Favoritos colaborativos entre miembros del equipo y notificaciones proactivas.
- Mejora de accesibilidad: focus trap completo, soporte de teclado en lightbox, announcements ARIA.

## 13. Checklist de configuración pendiente
- Solicitar y cargar `PINTEREST_ACCESS_TOKEN` en `.env` (local, CI, producción) junto con la lista curada de `PINTEREST_BOARD_IDS` (IDs separados por coma).
- Configurar Instagram Graph (definir `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ID`) y mapear hashtags clave en `INSTAGRAM_HASHTAGS` / `INSTAGRAM_HASHTAG_IDS` para evitar búsquedas en frío.
- Actualizar todos los entornos con estas variables y documentar en runbook quién rota los tokens y la frecuencia recomendada.
- Validar `/api/instagram-wall` en staging con datos reales por categoría antes de habilitar el carrusel en producción; ajustar rate-limits según respuesta de Pinterest/Instagram.
- Añadir monitorización/alertas para los conectores (errores de autenticación, límites alcanzados) y procedimientos de limpieza de caché cuando cambien tableros/hashtags.

## 14. Resumen operativo de brechas detectadas
- **Personalizacion**: heuristica simple basada en favoritos; falta IA y signals colaborativos.
- **Accesibilidad**: navegacion por teclado limitada y sin announcements formales.
- **Offline**: solo favoritos persisten localmente; el feed no se cachea.
- **Error handling**: UI para fallos de fetch e imagenes pendiente; reporting centralizado no implementado.
- **Metricas**: dashboards y analitica profunda aun no consolidados.

## Cobertura E2E implementada
- `cypress/e2e/inspiration/inspiration-gallery.cy.js`: asegura filtros por categoría, scroll infinito y render del grid principal.
- `cypress/e2e/inspiration/inspiration-home-gallery.cy.js`: valida el carrusel de la home y enlaces hacia `/inspiracion`.
- `cypress/e2e/inspiration/inspiration-save-board.cy.js`: cubre favoritos, sincronización y vista dedicada de guardados.
- `cypress/e2e/inspiration/inspiration-share.cy.js`: verifica acciones de compartir/copiar enlace con feedback al usuario.

## 15. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- La vista `/inspiracion` funciona con scroll infinito real a `fetchWall`; no existen fixtures ni mocks para pruebas deterministas.
- `SyncService` depende de Firestore y `localStorage`; favoritos crean efectos secundarios que dificultan repetir escenarios.
- Componentes carecen de `data-testid`; se basan en clases dinámicas y contenido traducible.
- Acciones de compartir (link/descarga/presentación) aún no están implementadas en UI.

### Experiencia mínima a construir
- Incorporar modo demo/test: si `window.Cypress` está presente, utilizar fixtures locales (`wall.mock.json`, `favorites.mock.json`) en vez de llamadas reales.
- Añadir tooltips o banners de error cuando `fetchWall` falla, junto con elementos identificables (`data-testid="wall-error"`).
- Implementar barra de filtros (categorías, colores) con estado visible seleccionable y favorites toggle con confirmación.
- Implementar botones de compartir (copiar link, descargar imagen, modo presentación) aunque sea con stub local, y mostrar feedback textual.

### Criterios de prueba E2E propuestos
1. `inspiration-gallery`: interceptar `POST /api/instagram-wall` por slug y verificar que al seleccionar filtro se actualiza el grid (conteo y `data-testid="inspiration-card"`).
2. `inspiration-save-board`: marcar tarjeta como favorita, esperar badge "Guardado" y confirmar aparición en pestaña Favoritos (grid reducido).
3. `inspiration-share`: hacer click en "Copiar enlace" y comprobar stub de `navigator.clipboard.writeText`; verificar notificación de éxito.

### Dependencias técnicas
- Fixtures Cypress (`cypress/fixtures/inspiration-wall.json`, `inspiration-favorites.json`) para distintos escenarios.
- Helpers en frontend para detectar entorno test y usar datos mock (o MSW).
- API util `copyToClipboard` exportada para facilitar stub y verificación en Cypress.

