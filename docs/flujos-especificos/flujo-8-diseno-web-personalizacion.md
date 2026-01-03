# 8. Diseno Web y Personalizacion (estado 2025-10-08)

> Implementado (oct-2025): `DisenoWeb.jsx` con generacion IA condicionada por `VITE_ENABLE_DIRECT_OPENAI`, fallback postprocesado (`websiteHtmlPostProcessor.js`), editor logistico (`LogisticsEditor`), galeria de plantillas (`WebTemplateGallery.jsx`), tabla de versiones ligada a Firestore y servicios `websiteService.js` / `websitePromptBuilder.js`.
> Pendiente inmediato: mover la llamada a OpenAI al backend (evitar exponer `VITE_OPENAI_API_KEY`), corregir el guard de publicacion (`ProfileSummary`/`publishDisabled`), habilitar biblioteca de prompts editable, exponer configuracion de dominio personalizado y superficie de analitica consumible.
> Backlog: colaboracion multirol, SEO avanzado (OG/sitemap), dashboard de metricas, historial con diff/undo y biblioteca de prompts compartida.

## 1. Objetivo y alcance
- Permitir que owners, planners y assitants generen y editen un micrositio publico de la boda en minutos.
- Ofrecer plantillas, prompts y contenido dinamico alimentado por la ficha de la boda.
- Publicar un sitio responsive con mapa, agenda, transporte, hospedaje y branding personalizado.

## 2. Trigger y rutas
- Menu inferior -> `Mas` -> bloque **Extras** -> enlace **Diseno Web** (`/diseno-web`, `DisenoWeb.jsx`).
- El módulo puede abrirse desde `/diseno-web` con `state.focus="generator"` para posicionar al usuario en el generador.
- Acceso directo a la vista previa: `/diseno-web/preview` (usa `location.state.focus` para hacer scroll).

## 3. Paso a paso UX
1. Seleccion y edicion de base  
   - Galeria de plantillas (`WebTemplateGallery.jsx`) por estilo (clasica, moderna, rustica, playa, romantica, personalizada).  
   - Biblioteca de prompts IA con variables `{nombres}`, `{fecha}`, `{ubicacion}` mostrada en modal solo lectura (`PromptLibraryModal`, sin CRUD aun).  
   - Campos de branding: colores, tipografia, hero y copy principal cargados desde `ProfileSummary` y editables via prompt.
2. Generacion y personalizacion  
   - `WebGenerator.jsx` arma el mensaje usando `websitePromptBuilder.js` (tokens de estilo + datos de `weddingInfo`).  
- Botón **Generar Página Web** hace `fetch` directo a `https://api.openai.com/v1/chat/completions` cuando `VITE_ENABLE_DIRECT_OPENAI === 'true'` o en modo dev; si no hay clave o la bandera está deshabilitada, usa `buildFallbackHtml` + `enhanceWeddingHtml`.  
   - Editor logistico lateral (`LogisticsEditor`) permite ajustar historia, transporte, hospedajes, guia de viaje y FAQs antes de publicar; los datos previos se toman del mapa `weddingInfo` si existe.  
   - Contenido logistico 100 % manual por ahora (las sugerencias de Flow 7 llegan solo si ya viven en Firestore).
3. Publicacion y comparticion  
   - Vista previa responsive (`WebsitePreview.jsx`) con acciones: publicar, editar logistica, abrir en nueva pestaña, descargar HTML, copiar enlace y mostrar QR.  
   - Contador regresivo opcional en el hero cuando existe fecha (`websiteHtmlPostProcessor` inyecta script).  
   - Slug publico sugerido por `buildSlugSuggestions` + verificacion asincrona (`checkSlugAvailability`).  
   - URL final `/p/{slug}`; si se define `PUBLIC_SITES_BASE_DOMAIN` el backend devuelve `https://{slug}.{dominio}`. No hay UI para dominios personalizados.  
   - Tabla de versiones (`VersionsTable`) permite reabrir HTML/prompt de publicaciones anteriores.
4. Postprocesado estetico  
   - `websiteHtmlPostProcessor.js` asegura `<html>`, fuentes coherentes, variables CSS, secciones hero/galeria/transporte/hospedaje/faq/mapa y contador regresivo cuando aplica.

## 4. Persistencia y datos
- Firestore `weddings/{id}`: mapa `publicSite` (slug, flags, expiracion) y subcoleccion `publicSite/site` para el HTML vigente; el editor logistico escribe en `weddingInfo.transportation*`, `lodgingOptions`, `travelGuide`, `story`, `additionalInfo`, `faqs`.
- Historial de publicaciones en `weddings/{id}/generatedPages` + `users/{uid}/generatedPages`; el ultimo HTML tambien se guarda en `users/{uid}.generatedHtml`.
- Eventos operativos en `analytics/websiteEvents` (`website_generated`, `website_logistics_saved`, `website_publish_started`, `website_published`, `website_publish_failed`).  
- Logs IA en `ai/websites/runs` con prompt, template y estimacion de tokens.
- Assets en Storage (imagenes optimizadas, favicon, adjuntos) sin cambios en este flujo.

## 5. Reglas de negocio
- Solo owners o planners pueden publicar; asistentes editan borradores si tienen permiso (el backend verifica `ownerIds`/`plannerIds`).  
- Direcciones exactas solo se muestran si el owner las marca como publicas en la ficha.  
- Contenido logistico depende de lo que exista en `weddingInfo` o se capture manualmente en `LogisticsEditor`.  
- Sin fecha = se ocultan contador y secciones que dependen de ella.  
- Al regenerar y publicar se respeta el mismo slug (el backend actualiza la misma entrada).

## 6. Estados especiales y errores
- Falta de datos minimos (nombres, fecha) -> `missingBasics` muestra banner con CTA a Perfil.  
- Error IA (401, rate limit, etc.) -> fallback automatico a plantilla base y mensaje "Generacion IA no disponible".  
- Publicacion fallida -> alerta, log en `analytics/websiteEvents`, se restaura ultimo HTML guardado.  
- Offline -> botón publicar debería deshabilitarse (ver bug en sección 13).  
- Slug reservado/ocupado -> mensaje de estado y sugerencias alternativas.

## 7. Integracion con otros flujos
- Flujo 2 comparte datos basicos (nombres, fecha, ubicacion, estilo) que `normalizeProfile` incorpora al prompt.  
- Flujo 5 y 15 pueden alimentar secciones destacadas si escriben en `weddingInfo` (pendiente automatizar).  
- Flujo 7 detecta horarios de transporte desde correos y los persiste en `weddingInfo.transportation` (el editor los reutiliza).  
- Flujo 21 reusa el HTML generado para la landing publica general.

## 8. Metricas y monitorizacion
- Eventos ya grabados: `website_generated`, `website_logistics_saved`, `website_publish_started`, `website_published`, `website_publish_failed`.  
- Pendiente activar `website_regenerated` y `website_theme_changed` (placeholders).  
- Falta dashboard que consuma `analytics/websiteEvents` y tracking de visitas reales a `/p/{slug}`.  
- Métricas planeadas: visitas únicas, tiempo entre generación y publicación, clicks en bloques logísticos, descargas de QR.

## 9. Pruebas recomendadas
- Unitarias: parseo de prompts (`websitePromptBuilder`), normalizacion de logistica (`sanitizeLogisticsDraft`), helpers de slug/domino (`buildSlugSuggestions`, `checkSlugAvailability`).  
- Integracion: generar sitio -> guardar -> verificar lista de versiones -> publicar -> validar HTML en backend.  
- E2E: usuario completa perfil, genera web, edita logistica, publica y visita `/p/{slug}`.


## Cobertura E2E implementada
- `cypress/e2e/web/diseno-web-flow.cy.js`: recorre el generador de sitio, personalización de secciones y publicación.

## 10. Checklist de despliegue
- Definir `OPENAI_API_KEY`, `VITE_ENABLE_DIRECT_OPENAI`, `VITE_OPENAI_PROJECT_ID` y modelo antes de habilitar IA directa.  
- Configurar hosting/CDN para publicar `weddings/{id}/publicSite/site` y limpiar cache tras cada publish.  
- Revisar consentimiento de datos publicos y clausulas de privacidad.  
- Validar peso total del HTML + assets (< 2 MB recomendado).  
- Preparar rollbacks en caso de fallo del backend `/api/public/weddings/:id/publish`.

## 11. Roadmap / pendientes
- Editor de prompts avanzado (CRUD, versionado, biblioteca compartida por rol).  
- Refactor de generacion IA: mover a backend/`AIWebGenerator` con streaming seguro, quotas y manejo centralizado de errores.  
- Historial enriquecido: diffs, etiquetas, undo/redo y soporte de borradores previos a publicar.  
- Analitica integrada (dashboard, alertas) sobre `analytics/websiteEvents` + tracking de visitas publicas.  
- Dominio personalizado y SEO avanzado (metatags dinamicos, sitemap, OG images, fallback offline).  
- Colaboracion multirol (comentarios, sugerencias, aprobaciones con permisos granulares).

## 12. Motor IA premium
- **Prompt framework**: plantilla base con identidad visual curada, tokens de paleta y tipografia por estilo, secciones obligatorias e indicaciones de tono.  
- **Postprocesador HTML**: garantiza `<!doctype html>`, inyecta estilo con variables (`--color-*`, `--font-*`), normaliza layout responsive (grid/flex), genera tarjetas logísticas y contador regresivo si hay fecha válida.  
- **Extensibilidad**: nuevos estilos/bloques se registran en `websitePromptBuilder.js` + reglas en `websiteHtmlPostProcessor.js`; admite datos enriquecidos desde correos de proveedores o entrada manual.

## 13. Pendientes detectados en codigo (2025-10-08)
- `src/pages/DisenoWeb.jsx:399`: `ProfileSummary` intenta leer `html`, `slugStatus` e `isOnline` sin recibirlos; al renderizar lanza `ReferenceError` y deja sin calcular `publishDisabled` que se pasa a `WebsitePreview`. Hay que mover el guard al componente principal o pasar props explicitas.  
- `src/pages/DisenoWeb.jsx:1247`: la generacion IA usa `fetch` directo a OpenAI exponiendo `VITE_OPENAI_API_KEY`; falta wrapper backend/`AIWebGenerator` y manejo de cuotas/errores centralizado.  
- `src/pages/DisenoWeb.jsx:528`: `PromptLibraryModal` solo lista prompts estaticos; no existe editor ni almacenamiento persistente de prompts personalizados.  
- `src/services/websiteService.js:302`: `publishWeddingSite` guarda versiones tras publicar, pero la UI no bloquea clicks repetidos ni muestra estado de "publicando"; falta estado de loading y feedback unificado.
