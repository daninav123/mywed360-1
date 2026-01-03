# 27. Momentos (Álbum Compartido) — estado 2025-10-24

> Estatus del producto (2025-10-24): **Sí (en curso)**. Se ejecuta la experiencia anfitrión/invitados en código (`/momentos`), rebautizada en UI como **Galería de recuerdos**, con generación de código QR descargable, ventana de aportaciones acotada (hasta 30 días posteriores al evento) y compresión automática tras superar 30&nbsp;GB. Desde octubre 2025 aplicamos **límite técnico suave**: al superar el umbral se recomprimen las fotos (JPEG 80 %), se bloquean vídeos de más de 120 s y se generan miniaturas dedicadas para acelerar la galería. Cada subida queda identificada por hash SHA-1 (anti duplicados) y se prepara para cache CDN. Siguen pendientes evoluciones sobre gamificación, slideshow público y automatización de moderación.
>
> Alcance: Experiencia anfitrión e invitados para capturar, moderar y compartir fotos del evento mediante una página dedicada (`/momentos`) vinculada a cada boda. Incluye subida multi-dispositivo, revisión, slideshow en vivo, descarga masiva y distribución del enlace/QR listo para imprimir.
> Pendiente: reforzar métricas y observabilidad, además de endurecer la experiencia QR pública.

## 1. Objetivo y alcance
- Centralizar todas las fotos generadas por invitados y equipo en un único álbum colaborativo vinculado a la boda.
- Permitir que el anfitrión configure reglas (moderación manual vs automática, quién puede subir, duración de disponibilidad).
- Facilitar la contribución de invitados con fricción mínima (QR/código), incluso sin cuenta previa.
- Habilitar experiencias adicionales: slideshow en vivo, selección de destacados, exportación en ZIP y métricas de participación.
- Permitir a la pareja anfitriona generar un código QR descargable/imprimible y compartir el enlace con antelación.
- Controlar la ventana de aportaciones (antes de la boda y hasta 30 días después) y optimizar el almacenamiento en Firebase con compresión progresiva (umbral 30 GB, recompresión automática, bloqueo de vídeos largos).
- Minimizar coste de media generando miniaturas ligeras, evitando duplicados por hash y utilizando CDN para descargas.
- Garantizar cumplimiento legal (privacidad), seguridad de subidas y trazabilidad de cada foto y autor.

## 2. Usuarios y roles
- **Anfitrión (planner / pareja)**: crea y administra álbumes, ajusta permisos, revisa/curate fotos, destaca favoritos, lanza slideshow y descarga contenido.
- **Invitado autenticado**: accede desde el portal o app, sube fotos ilimitadas dentro de cuotas, puede comentar y reaccionar si lo permite el anfitrión.
- **Invitado visitante (token/QR)**: flujo express vía enlace firmado o código, sin cuenta completa; sube fotos y añade nombre opcional.
- **Colaborador (fotógrafo / staff)**: recibe acceso extendido (sin límites, puede gestionar metadatos y aprobar automáticamente).
- **Admins internos**: monitorizan incidentes, gestionan abusos y aplican políticas globales.

## 3. Rutas y navegación
- **Planner web**: `Dashboard -> Momentos` (nueva tarjeta) abre `/momentos`. Cada boda activa añade CTA “Comparte el QR” y estado de subidas.
- **Menú Más**: bloque “Extras” se amplía con “Momentos” para anfitriones y colaboradores.
- **Sitio público del evento**: nueva sección opcional “Galería Momentos” con botón `Sube tus fotos` (enlace al flujo público).
- **Enlace/QR público**: `https://maloveapp.app/momentos/{weddingSlug}?token=<signed>`; detecta rol y redirige a versión invitado responsive.
- **Slideshow**: `https://maloveapp.app/momentos/{weddingSlug}/slideshow?token=<host>` vista full-screen.

## 4. Arquitectura y piezas clave
- **Frontend (React)**:
  - `pages/Momentos.jsx`: controlador principal, tabs `Resumen`, `Moderación`, `Slideshow`, `Descargas` y sincronización con la fecha de la boda para cerrar/aperturar la galería.
  - `pages/MomentosPublic.jsx`: experiencia pública mobile-first con tarjetas de momentos y subida directa (foto/video) por escena.
  - `components/momentos/AlbumOverview.jsx`: totales, actividad reciente, QR descargable/imprimible y estado de almacenamiento (umbral 30&nbsp;GB).
  - `components/momentos/HighlightRail.tsx`: carrusel con auto-highlights sugeridos y botones aprobar/descartar rápidos.
  - `components/momentos/UploadWidget.jsx`: dropzone, preview, extracción de metadatos (hash SHA-1, duración de vídeo) y compresión cliente automática cuando la boda supera 30&nbsp;GB (JPEG 80 %, bloqueo vídeo >120 s).
  - `components/momentos/SceneSelector.tsx`: selector de escenas configurables (`Ceremonia`, `Banquete`, `Fiesta`, etc.) aplicado al lote de fotos.
  - `components/momentos/ModerationBoard.tsx`: columnas `Pendientes`, `Aprobadas`, `Rechazadas`, drag & drop (`react-beautiful-dnd`), filtros por invitado/label.
  - `components/momentos/LiveWall.tsx`: feed masonry + toggle slideshow; escucha canal realtime.
  - `components/momentos/GuestWelcome.tsx`: onboarding QR/código, disclaimers privacidad, límite peso.
  - `components/momentos/DownloadBundle.tsx`: petición de ZIP, estado de preparación (polling).
- **Backend / Firebase**:
  - **Firestore**: control de álbumes, fotos, sesiones invitado, acciones moderación.
  - **Storage**: `weddings/{weddingId}/albums/{albumId}/{photoId}/{original|optimized|thumb}.jpg`.
  - **Cloud Functions**:
    - `generateGuestToken`: crea token firmado (`albumAccessToken`) y QR.
    - `processMomentUpload`: trigger `onFinalize` optimiza (resize 2560px, 720p video), genera thumb y actualiza Firestore.
    - `momentosModerationWorker`: job recurrente que usa Cloud Vision SafeSearch para etiquetar contenido sensible (`moderation.auto.status`) y rechazar automáticamente fotos que superen el umbral configurado.
    - `computeHighlights`: programa que recalcula `highlight.score` y motivos cada X minutos según heurísticas (nitidez, sonrisas, escena prioritaria, engagement temprano).
    - `queueZipExport`: arma ZIP en bucket temporal, firma URL de descarga.
  - **Callable APIs**: `createAlbum`, `updateAlbumSettings`, `submitPhoto`, `updateModeration`, `requestDownload`.
  - **Realtime updates**: `Firestore onSnapshot` sobre `photos` y `albumActivity`.

## 4.1 Ventana de aportaciones y almacenamiento
- La fecha de la boda (`weddingDate`) marca el calendario de la galería. Las subidas están permitidas desde la planificación y se cierran automáticamente **30 días después del evento** (`uploadWindow.closesAt`). El cierre se refleja en la UI y bloquea nuevas subidas.
- `createGuestToken` recorta la caducidad de cada enlace/QR a la fecha de cierre efectiva. Si la ventana expiró no se generan nuevos tokens y los invitados visualizan un estado “Galería cerrada”.
- Se controlan los volúmenes mediante `counters.totalBytes` y `counters.optimizedBytes`. A partir de **30 GB** se activa compresión cliente (JPEG 80 %, máx. 2560 px) antes de subir a Firebase Storage; también se bloquean vídeos de más de 120 s y se generan miniaturas (`thumb`) independientes. Cada subida queda asociada a un hash SHA-1 para evitar duplicados.
- Hosts e invitados ven un contador con los **días restantes** para aportar fotos; cuando la ventana está activa, la vista anfitrión muestra la fecha límite más el contador, y el portal público recuerda a los invitados cuánto tiempo queda.
- Tras **365 días** desde la fecha del evento, la plataforma automatiza la limpieza: se elimina el contenido del álbum de Firebase Storage y se archiva el registro manteniendo un resumen mínimo.
- Hosts e invitados reciben mensajes contextuales: progreso de almacenamiento, activación de compresión y fecha límite de aportaciones. Los hosts pueden reabrir la galería ajustando la fecha del evento.
- Todos los recursos se almacenan en Firebase Storage bajo `weddings/{weddingId}/albums/momentos/`. La retención mínima cubre desde la fecha del evento; la purga definitiva queda supeditada a las políticas legales/contractuales vigentes.
- **Servicios compartidos**:
  - `momentosService` (frontend): abstrae fetch, agrupación, estado offline, colas de subida.
  - `imageKit.ts` (nuevo util) para compresión y extracción EXIF.
  - `highlightEngine.ts`: aplica scoring heurístico local para priorizar fotos mientras llega cálculo backend.
  - `qrService` reutiliza `qrcode` para generar PNG/SVG embebible.

## 5. Modelo de datos (Firestore / Storage)
```text
weddings/{weddingId}
  albums/{albumId}
    name: "Momentos"
    slug: "momentos-principal"
    status: "active" | "archived"
    settings:
      moderationMode: "manual" | "auto"
      guestAccess: "link" | "code" | "closed"
      autoExpireHours: 72
      maxFileSizeMb: 25
      allowComments: true
      allowReactions: true
      slideshow:
        autoAdvanceSeconds: 6
        theme: "classic" | "sparkle" | "minimal"
    counters:
      totalPhotos: 128
      pendingPhotos: 5
      approvedPhotos: 120
      rejectedPhotos: 3
      guestContributors: 47
      badgesGranted: 32
    createdBy: userId
    createdAt: Timestamp
    lastActivityAt: Timestamp
    qrCode:
      latestTokenId: "tok_abc"
      expiresAt: Timestamp

    photos/{photoId}
      uploaderType: "guest" | "host" | "photographer"
      uploaderId: userId | null
      guestName: "Laura G." | null
      source: "web" | "ios" | "android" | "camera"
      scene: "ceremonia" | "banquete" | "fiesta" | "otro"
      storagePathOriginal: "weddings/.../original.jpg"
      storagePathOptimized: "weddings/.../optimized.jpg"
      storagePathThumb: "weddings/.../thumb.jpg"
      status: "pending" | "approved" | "rejected"
      labels: ["ceremonia", "recepción"]
      flagged: { nudity: false, violence: false }
      width: 4032
      height: 3024
      exif:
        takenAt: Timestamp | null
        device: "iPhone 15"
      highlight:
        score: 0.84
        reasons: ["sonrisas", "alta nitidez", "escena ceremonia"]
        surfacedAt: Timestamp | null
      reactions:
        heart: 15
        wow: 3
      commentsCount: 2
      createdAt: Timestamp
      approvedAt: Timestamp | null
      rejection:
        reason: "Desenfoque"
        rejectedBy: userId
        rejectedAt: Timestamp

    photos/{photoId}/comments/{commentId}
      authorId: userId | null
      displayName: "Carlos"
      message: "Hermoso momento"
      createdAt: Timestamp
      status: "visible" | "hidden"

    tokens/{tokenId}
      type: "guest" | "slideshow" | "moderator"
      status: "active"
      expiresAt: Timestamp
      maxUsages: 200
      usedCount: 73
      createdBy: userId
      createdAt: Timestamp

    exports/{exportId}
      status: "pending" | "processing" | "ready" | "failed"
      requestedBy: userId
      format: "zip"
      includeRejected: false
      expiresAt: Timestamp
      downloadUrl: "https://..."
      createdAt: Timestamp
      updatedAt: Timestamp

    activity/{activityId}
      type: "upload" | "approved" | "comment" | "reaction" | "download"
      actorId: userId | null
      actorName: "Invitado anónimo"
      photoId: photoId | null
      message: "Nuevo upload desde QR"
      createdAt: Timestamp

    guestProgress/{guestId}
      displayName: "Laura G."
      totalUploads: 6
      lastUploadAt: Timestamp
      badges: ["primerMomento", "topColaborador"]
      sceneBreakdown:
        ceremonia: 3
        fiesta: 2
        banquete: 1
```
- **Cloud Storage**: conserva original (hasta 25 MB, configurable) + versión optimizada (JPEG, 85% quality) y thumbnail cuadrado 512x512.
- **Indices recomendados**:
  - `photos` composite (`status`, `createdAt desc`) para moderación.
  - `photos` composite (`labels`, `approvedAt desc`) para slideshow y filtros.
  - `activity` (`createdAt desc`) limitado a últimas 500 entradas.

## 6. Seguridad y permisos
- **Firestore Rules**:
  - `albums`: lectura anfitrión/colaboradores; invitados sólo vía callable `getAlbumPublic`.
  - `photos`:
    - Invitados autenticados con token `albumAccessToken` firmado (custom claims) pueden `create` con validación de tamaño (server-side).
    - Solo anfitrión/colaboradores pueden `update status`, `delete`, `add labels`.
    - Comentarios visibles únicamente si `allowComments`.
  - `tokens`: sólo anfitrión y backend; invitados no leen colecciones.
- **Storage Rules**:
  - Bucket segmentado por boda. Upload restringido a rutas `weddings/{weddingId}/albums/{albumId}/uploads/{uid or token}/<uuid>.tmp` transformadas por función.
  - Descarga `optimized` pública mediante URL firmada; `original` protegido para anfitriones.
- **Tokens invitados**:
  - Firmados con Firebase Custom Token + TTL (por defecto 24h).
  - Límite de peticiones por IP (Cloud Functions + `express-rate-limit`).
- **Protección abuso**:
  - Detector automático (Vision API) marca `flagged` y fuerza moderación.
  - Lista negra hash perceptual para evitar spam repetido.
  - Alertas a canal interno (`momentos-abuse`) si >20 rechazos/hora.
  - Auto-highlights solo se muestran si la foto está `approved` y sin flags activos para evitar contenido sensible en carruseles.

## 7. Flujo UX anfitrión
1. **Primer acceso**: pantalla `setup` con explicador, botón `Crear álbum Momentos`. Defaults: moderación manual, QR caduca en 24h, límite 20 MB.
2. **Configuración**: formulario `settings` (permite QR abierto, código PIN 6 dígitos, auto-publicar para fotógrafos, permitir comentarios/reacciones, recordatorio push).
   - Define escenas disponibles (máximo 6) y orden de prioridad para slideshow (`Ceremonia`, `Banquete`, `Fiesta`, `Postboda`, etc.).
   - Ajusta umbral de auto-highlight (`highlightThreshold`) y reglas de gamificación (badges activos, caducidad leaderboard).
3. **Compartir**: sección `Compartir QR` muestra QR descargable, link corto y opción “Enviar email a invitados confirmados”.
4. **Moderación en vivo**:
   - Tab `Moderación` lista tarjetas con preview, data uploader y botones `Aprobar`, `Rechazar`, `Destacar`.
   - Drag & drop entre columnas. Batch actions (`shift+click`).
   - `Destacar` añade a carrusel `Destacados` y slideshow.
   - Panel lateral `Highlights sugeridos` (alimentado por `computeHighlights`) explica motivos (`"sonrisas detectadas"`, `"mejor foto de Ceremonia"`) y permite aceptar/descartar para recalibrar puntuaciones.
5. **Participación y gamificación**:
   - Dashboard `Top colaboradores` muestra medallas por escena cubierta, número de aportes y estado del leaderboard diario.
   - Acciones rápidas para enviar agradecimientos o beneficios (cupón, mensaje personalizado) a quienes alcanzan hitos.
6. **Slideshow**:
   - Tab `Slideshow`, preview en miniatura y botón `Abrir pantalla completa`.
   - Controles: auto-advance, tema visual, mostrar pie de foto/opción borrar on-screen.
   - Playlist configurable por escenas (ej. abrir con Ceremonia y cerrar con Fiesta) y “Modo highlight” que prioriza fotos con `highlight.score` alto.
7. **Descargas**:
   - Tab `Descargas`: historial de ZIPs, botón `Generar ZIP` (seleccionar rango fechas, incluir sólo aprobadas).
   - Recibe email con enlace firmado + mensaje en app.
8. **Post-evento**:
   - Banner `Tu álbum expirará en X días`. Botón `Archivar` (mueve a `archived` y cierra nuevos uploads).
   - Resumen analytics (subidas, destacados, top colaboradores, cobertura escenas) y CTA `Compartir recopilación`.

## 8. Flujo UX invitados (público)
1. **Ingreso**:
   - Escanean QR -> `GuestWelcome`. Detectamos idioma, pedimos nombre opcional, email opcional para recibo.
   - Aceptan términos (checkbox + enlace privacidad). PIN si anfitrión lo requiere.
2. **Subida**:
   - `UploadWidget` permite arrastrar varias fotos (máx 10 por lote).
   - Validación local (peso, formato), preview y edición nombre/caption.
   - Seleccionan escena destino mediante `SceneSelector`; se sugiere automáticamente según la hora del día o el bloque de agenda (Ceremonia, Banquete, Fiesta).
   - Se aplica compresión/resizing antes de enviar.
3. **Progreso**:
   - Barra con estado por archivo; fallback a cola si offline (IndexedDB) para reintento.
   - Al completar se muestra “Tus fotos están en revisión” o “Ya están visibles” según modo.
4. **Gamificación**:
   - Pantalla de agradecimiento muestra progreso (`3/5 momentos recomendados`), medallas desbloqueadas (`Primer Momento`, `Escena Ceremonia`) y posición en leaderboard diario.
   - Cuando una foto se convierte en highlight, el invitado recibe badge especial y notificación push/email (si aceptó comunicaciones).
5. **Feedback continuo**:
   - Invitado puede ver sus fotos aprobadas en mini feed personal (si `allowGuestGallery`).
   - Reacciones y comentarios opcionales.
   - Banner dinámico `Comparte más momentos` si subió <3 fotos o falta cubrir escenas prioritarias (por ejemplo `Aún no tenemos fotos de la Fiesta`).
6. **Recordatorios**:
   - Email/SMS opcional (si anfitrión activó) con resumen, medallas ganadas y link para completar escenas faltantes o descargar favoritas.

## 9. Moderación y automatización
- **Moderación manual**: default; todas las subidas entran en `pending`. Acciones emiten eventos `moderation.updated`.
- **Moderación automática**:
  - Se habilita por boda o por rol (fotógrafo).
  - Reglas: si Vision API detecta `safe`, se aprueba; si no, queda pendiente con badge.
  - Permite auto-borrado de fotos con repetición (hash perceptual).
- **Comentarios/Reacciones**:
  - `comments` colec. por foto; tasa de comentarios limitada a 5/min por token.
  - Reacciones se guardan en campo `reactions.<emoji>++` transaccional (usando `FieldValue.increment`).
- **Destacados**:
  - Campo `labels` incluye `featured`. Slideshow usa `approved` + `featured` primero.
  - Auto-highlights incrementan `highlight.score`; si supera `settings.slideshow.highlightThreshold` se propone automáticamente como destacado y se marca como “Sugerido”.
- **Automations**:
  - Worker nocturno `momentosDigest` envía resumen diario con stats y link admin.
  - Post-evento (48h sin actividad) propone archivar y descargar.
  - `computeHighlights` recalcula scores considerando nuevas reacciones, diversidad de escenas y feedback del anfitrión (descartar highlight penaliza puntuación futura).

## 10. Analítica y métricas
- Eventos `analytics.logEvent`:
  - `momentos_album_created`, `momentos_settings_updated`, `momentos_qr_shared`.
  - `momentos_upload_started/success/failed`, `momentos_moderated`, `momentos_slideshow_opened`.
- KPIs por boda:
  - `% invitados activos` = invitados únicos/confirmados.
  - `tiempo promedio de aprobación`.
  - `ratio rechazos` y motivos (nudez, blur, duplicado).
  - `descargas ZIP generadas`.
  - `cobertura escenas` = escenas con al menos N fotos / escenas configuradas.
  - `engagement gamificación` (badges entregados, invitados en leaderboard, recompensas enviadas).
  - `efectividad highlights` (sugeridos aceptados / totales, tiempo medio hasta aprobación).
- Dashboard global (en `metrics`): heatmap de subidas hora del día, top bodas por participación, alertas de abuso.

## 11. Estados vacíos y messaging
- **Sin álbum creado**: ilustración + CTA `Activa Momentos`.
- **Sin fotos aún**: mensaje motivador + botón `Compartir QR`.
- **Sin fotos aprobadas**: highlight de modo moderación para evitar sorpresa en slideshow.
- **Slideshow sin fotos**: fallback `Estamos recopilando tus recuerdos`.
- **Sin cobertura de escenas prioritarias**: card informativa `Aún faltan fotos de la Fiesta` + CTA compartir QR con filtro de escena.
- **Invitado sin permiso**: `Token inválido o expirado` + CTA contactar anfitrión.
- **Error upload**: mensajes específicos (peso, formato, fallo red); sugerir reintento o email.

## 12. Accesibilidad e internacionalización
- Texto y labels en `i18n` (`es`, `en`, `fr`); soportar `usted/tú` según boda (config general).
- Contraste AA, focus visible en mosaico, shortcuts moderación (`a` aprobar, `r` rechazar).
- Modo slideshow: soporte teclado, lector pantalla (aria-live), auto-pausing si tab oculta.
- Subtitles al mostrar disclaimers; soporte `prefers-reduced-motion` (slideshow sin animación).

## 13. Integraciones externas
- Opcional: Vision API (SafeSearch). Toggle global desde `ENV`.
- Email/SMS (Mailgun/Twilio) para compartir QR e invitaciones a subir.
- Export ZIP usa `archiver` en Cloud Functions; almacenamiento temporal en `exports/`.
- Webhook Slack interno para abusos (`momentos-abuse-alert`).
- Futuro: integrarse con proveedores (fotógrafos) vía portal (`SupplierPortal`) entregando acceso colaborador.

## 14. Plan de QA y testing
- **Unit tests**:
  - `momentosService` (colas upload, retry offline).
  - Reducer de moderación (acciones batch).
  - Validadores (peso, formatos permitidos).
- **Integration/Vitest**:
  - Mock Storage upload + callable `submitPhoto`.
  - Render `ModerationBoard` con `react-beautiful-dnd` (usar `@testing-library/user-event`).
- **Cypress E2E**:
  1. `momentos-guest-upload`: flujo QR -> subida -> ver estado pend/approved (usar mocks Storage).
  2. `momentos-host-moderation`: aprobar lote, verificar counters y feed host.
  3. `momentos-slideshow`: marcar destacados, abrir slideshow, asegurar orden y modo highlight.
  4. `momentos-scenes`: seleccionar escena al subir, filtrar por escena y comprobar cobertura mostrada al host.
  5. `momentos-gamification`: desbloquear badges, ver leaderboard y recibir notificación/agradecimiento.
  6. `momentos-download`: generar ZIP, validar estado `ready` y descarga.
- **Performance**:
  - Lighthouse en `GuestWelcome` (target TTI < 2.5s).
  - Stress test subidas 50 concurrentes (Cloud Function concurrency).
- **Security**:
  - Test tokens expirados, PIN incorrecto, IP rate-limit.
  - Intentos de subir archivo >límite, no imagen, ratio.

## 15. Roadmap / pendientes
1. **MVP interno (Sprint 1-2)**:
   - Crear álbum único `momentos` por boda.
   - Flujo invitado con token + subida foto + moderación manual + aprobación.
   - Feed anfitrión básico + download simple (lista enlaces).
2. **Release público (Sprint 3-4)**:
   - QR dinamico, slideshow, export ZIP, reacciones, analytics básicos.
   - Vision API para flag + email diarios.
   - Escenas configurables + selector en flujo invitado + filtros host.
   - Gamificación base (badges, leaderboard diario, mensajes de agradecimiento).
3. **Optimización (Sprint 5+)**:
   - App nativa offline, subida video corto, stories automáticas.
   - Auto-highlights con heurística avanzada + experimentos IA ligera (detección emociones, nitidez).
   - Álbumes múltiples (Preboda, Postboda), integraciones fotógrafo.
   - Automatizaciones marketing (`compartir con invitados` + plantillas email).

## 16. Dependencias y riesgos
- Necesario revisar límites Storage (costes) y definir política retención (archivar + borrar tras 12 meses).
- Coordinación con equipo legal para consentimiento invitados y cláusulas (actualizar `terms`).
- Ajustar reglas Firestore/Storage; requiere PR conjunto con `FIRESTORE_RULES.md`.
- Compresión cliente debe balancear calidad vs velocidad; fallback server-side.
- Videos implican transcodificación (FFmpeg) -> posponer a fase futura o usar proveedor externo.
- Disponibilidad: si Cloud Functions tarda, fallback a colas reintento y UI de `procesando`.

## 17. Checklist implementación
- [ ] Definir componentes base y rutas en `src/pages/Momentos.jsx`.
- [ ] Añadir servicios `momentosService`, `momentosApi`.
- [ ] Crear colecciones Firestore y migraciones iniciales (`setup` script).
- [ ] Actualizar reglas de seguridad y tests.
- [ ] Implementar flujos de subida y moderación.
- [ ] Configurar Vision API (opcional) + variables entorno.
- [ ] Añadir métricas (`analytics`) y dashboards.
- [ ] Documentar en runbook operaciones (`incidents/momentos.md`).
- [ ] Desplegar selector de escenas (`SceneSelector`) y persistencia `scene` en Firestore.
- [ ] Implementar motor de auto-highlights (`highlightEngine`, `computeHighlights`) y UI `HighlightRail`.
- [ ] Diseñar badges/leaderboard (gamificación) y métricas asociadas.

---

> Contacto responsable: Equipo Producto Moments (pendiente asignar). Coordinación técnica con squads Frontend (MaLoveApp App) y Backend Firebase.
## Cobertura E2E implementada
- `cypress/e2e/moments/moments-empty-state.cy.js`: valida el estado de acceso cuando no existe una boda activa antes de cargar Momentos, garantizando que el usuario reciba la guía adecuada antes de habilitar la colaboración.
