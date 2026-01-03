# Claves i18n Faltantes

**Identificadas:** 28 de Octubre de 2025

---

## 📌 Actualización 28/10/2025 05:40 UTC+1

Ejecución de `npm run validate:i18n` → `scripts/validateI18n.js`

- **Claves faltantes detectadas:** 261 en `es/common.json`
- **Namespaces más afectados:** `protocol.specialMoments.*`, `common.suppliers.overview.*`, `chat.*`
- **Claves extra detectadas:** 19 en `es/common.json` (pendientes de depuración o expedientes legacy)

**Acciones sugeridas inmediatas**

1. Exportar las 261 claves desde `en/common.json` hacia un sheet compartido para traducción.
2. Depurar las 19 claves “extra” y confirmar si siguen referenciadas en la app (ej. `accion_cancelada`, `anade_una_cancion`).
3. Priorizar namespaces críticos:
   - `protocol.specialMoments.*` → funcionalidad nueva sin traducciones.
   - `common.suppliers.*` → ya en producción (impacto UX alto).
   - `chat.*` → bloquea experiencia asistente en otros idiomas.
4. Registrar avance en `docs/PROGRESO-I18N-SESION-ACTUAL.md` tras cada sincronización parcial.

> Nota: El validador también puede ejecutarse con `TARGET_LANG=fr npm run validate:i18n` para comprobar los otros idiomas antes de sincronizar.

---

## ✅ Sincronización automática aplicada (28/10/2025 05:55 UTC+1)

Se ejecutó `node scripts/syncLocales.js es fr` para completar las claves faltantes tomando `en` como referencia.

- `common.json`, `auth.json`, `tasks.json`, etc. de **es** y **fr** ahora incluyen las 261 claves marcadas previamente.
- `npm run validate:i18n` vuelve a pasar (solo quedan las 19 claves extra que ya estaban controladas).
- Muchas claves nuevas mantienen el texto en inglés como _fallback_; quedan pendientes revisiones manuales.

**Siguientes pasos sugeridos**

1. Traducir manualmente los bloques copiados del inglés (especialmente `suppliers.*`, `whatsapp.*`, `admin.*`).
2. Validar de nuevo tras cada lote (`npm run validate:i18n` o `TARGET_LANG=fr npm run validate:i18n`).
3. Depurar las claves “extra” que no se usan para limpiar el inventario.

---

## ✅ Avance 28/10/2025 06:10 UTC+1

- `fr/common.json` actualizado con traducciones completas para `wedding.*`, `common.suppliers.*`, `rfqModal`, `mergeWizard`, `tracking`, `kanban`, `aiSearchModal` y `aiSearch`.
- Bloque duplicado `common.suppliers` eliminado para evitar divergencias entre versiones antiguas/nuevas.
- Validación general (`npm run validate:i18n`) sigue pasando; solo permanecen las claves extra históricas en `es/common.json`.

### 06:25 UTC+1
- Se tradujeron también `supplierPortal.*`, `weddingSite.*`, `publicWedding.*`, `compose.*` y se pulieron mensajes de disponibilidad/errores relacionados.
- Validación i18n repetida tras los cambios (sin nuevas alertas).

### 06:40 UTC+1
- `GuestList.jsx` migra textos pendientes a `t('guests.*')` (estadísticas, estados vacíos y accesibilidad).
- Nuevas claves añadidas en `en/es/fr` (`guests.stats.totalAttendees`, `guests.empty.*`, `guests.actions.selectAll`).

### 06:55 UTC+1
- `ContactsImporter.jsx` ya usa traducciones para picker y CSV (mensajes de error, etiquetas, placeholders).
- Se añadieron bloques `guests.status`, `guests.fields`, `guests.examples` y `guests.contacts` en `en/es/fr`.
- Validación i18n ejecutada nuevamente (`npm run validate:i18n`) sin nuevas faltantes.

### 07:10 UTC+1
- `WhatsAppModal.jsx` migrado totalmente a i18n (`whatsapp.modal.*`), incluyendo mensajes por pestaña, métricas y textos por defecto.
- Nuevas llaves agregadas en `en/es/fr` para pestañas, estados del proveedor, métricas y mensajes generados.
- Validación repetida (`npm run validate:i18n`) completada con éxito.


## Claves Faltantes por Namespace

### chat.*
- chat.open
- chat.noteMarked
- chat.messages.user
- chat.messages.assistant
- chat.messages.emptyPrompt
- chat.messages.greeting
- chat.defaults.event
- chat.defaults.wedding
- chat.defaults.yourPlanning
- chat.defaults.task
- chat.defaults.meeting
- chat.commands.taskAdded
- chat.commands.meetingAdded
- chat.commands.taskUpdated
- chat.commands.taskDeleted
- chat.commands.taskCompleted

### pages.more.sections.providers.links.*
- pages.more.sections.providers.links.providers
- pages.more.sections.providers.links.contracts

### common.suppliers.overview.* (CRÍTICO - ~40 claves)
- common.suppliers.overview.defaults.serviceGroup
- common.suppliers.overview.defaults.otherService
- common.suppliers.overview.defaults.country
- common.suppliers.overview.actions.manageServices
- common.suppliers.overview.actions.newSupplier
- common.suppliers.overview.actions.clear
- common.suppliers.overview.services.count
- common.suppliers.overview.services.confirmedCount
- common.suppliers.overview.services.pendingCount
- common.suppliers.overview.services.title
- common.suppliers.overview.services.shortlistCount
- common.suppliers.overview.services.emptyShortlist
- common.suppliers.overview.services.exploreHint
- common.suppliers.overview.title
- common.suppliers.overview.metrics.totalProviders
- common.suppliers.overview.metrics.confirmed
- common.suppliers.overview.metrics.pending
- common.suppliers.overview.metrics.shortlist
- common.suppliers.overview.exploration.title
- common.suppliers.overview.exploration.subtitle
- common.suppliers.overview.exploration.collapseAria
- common.suppliers.overview.exploration.searchPlaceholder
- common.suppliers.overview.exploration.recentSearches
- common.suppliers.overview.status.pending
- common.suppliers.overview.status.confirmed
- common.suppliers.overview.shortlist.loading
- common.suppliers.overview.shortlist.error
- common.suppliers.overview.shortlist.empty
- common.suppliers.overview.shortlist.savedAt
- common.suppliers.overview.shortlist.match
- common.suppliers.overview.modals.board.title
- common.suppliers.overview.modals.board.description
- common.suppliers.overview.modals.options.title
- common.suppliers.overview.modals.options.confirmedTitle
- common.suppliers.overview.modals.options.contactTitle
- common.suppliers.overview.modals.options.contactEmpty
- common.suppliers.overview.modals.options.shortlistTitle
- common.suppliers.overview.modals.options.shortlistEmpty
- common.suppliers.overview.drawer.title
- common.suppliers.overview.drawer.empty
- common.suppliers.overview.toasts.missingQuery
- common.suppliers.overview.toasts.noResults
- common.suppliers.overview.toasts.success
- common.suppliers.overview.toasts.error
- common.suppliers.overview.toasts.wantedServicesSaved
- common.suppliers.overview.toasts.wantedServicesError
- common.suppliers.overview.toasts.providerSaved
- common.suppliers.overview.toasts.providerError
- common.suppliers.configureServices
- common.suppliers.labels.provider
- common.suppliers.labels.service

---

## Prioridad

**CRÍTICA (App no funciona correctamente):**
- common.suppliers.overview.* (toda la sección de proveedores)
- chat.* (widget de chat)

**MEDIA:**
- pages.more.sections.providers.links.*

---

## Total

- **~70 claves** faltantes identificadas
- **Archivos afectados:** ProveedoresNuevo.jsx, ChatWidget.jsx
- **Impacto:** Alto - Funcionalidad core afectada
