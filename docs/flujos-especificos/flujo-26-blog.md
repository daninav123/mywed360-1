# 26. Blog IA MaLove.App (estado 2025-10-29)

> Implementado (octubre 2025)
>
> - Panel `/admin/blog` con layout consistente (`layout-container-wide`, tarjetas `bg-surface` y tipografía global) y cuatro bloques principales: generación manual, plan editorial, programados y editor de artículos.
> - Automatización diaria: servicio `blogAutomationService` + worker `blogAutomationWorker` que investiga, genera texto con OpenAI, ilustra con imagen propia y almacena en `blogPosts` / `blogEditorialPlan`.
> - Gestión de portadas: las imágenes generadas se suben a Firebase Storage (`blog/covers/...`), se intentan publicar y, si el bucket tiene acceso uniforme, se expone un signed URL de larga duración.
> - Front público sincronizado (`src/pages/Blog.jsx`, `/blog/:slug`) consumiendo `GET /api/blog` y renderizando artículos con el mismo sistema de tokens (cards `bg-surface`, `layout-container`, tags, fecha, CTA).
> - Mini widget en Home (`HomeUser.jsx`) que lista los tres artículos más recientes publicados internamente.
> - Traducción automática de cada artículo a los idiomas activos (`BLOG_SUPPORTED_LANGUAGES`, por defecto `es`, `en`, `fr`) manteniendo un tono cálido y humano.
>
> Pendiente o en curso
>
> - Métricas/observabilidad (eventos `blog_post_generated`, `blog_plan_failed`, panel analítico).
> - Moderación colaborativa (status `needs_review`, curación manual por temporada).
> - Filtros avanzados en `/blog` (categorías, búsqueda por texto) y módulo de favoritos/lectura posterior.

---

## 1. Objetivo y alcance

- Centralizar la gestión editorial dentro de MaLove.App, desde la investigación hasta la publicación y el seguimiento del plan anual.
- Garantizar coherencia visual con el estilo global (`layout-container`, `bg-surface`, `border-soft`, tipografía tokens) en todo el circuito: panel admin y blog público.
- Permitir que los artículos se generen solos cada día, con posibilidad de edición manual y programación flexible.
- Servir el contenido vía API (`/api/blog`) al front público, manteniendo paginación y multilenguaje.

## 2. Triggers y rutas

| Ruta                | Contexto            | Detalle                                                                                                                                    |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/admin/blog`       | Admin (rol `admin`) | Panel de edición, plan y automatización. Protegido por `requireAdmin` + `ipAllowlist`.                                                     |
| `/api/admin/blog/*` | Backend             | Endpoints CRUD (lista, create, update, schedule, publish, archive) + `plan` (GET/POST).                                                    |
| `/blog`             | Público             | Listado general de artículos (`Blog.jsx`).                                                                                                 |
| `/blog/:slug`       | Público             | Detalle de artículo (`BlogPost.jsx`).                                                                                                      |
| Worker              | Backend             | `startBlogAutomationWorker()` se inicializa junto al servidor (salvo `NODE_ENV=test`). Ejecuta `runBlogAutomationCycle()` según intervalo. |

## 3. UX detallado

### 3.1 Panel admin `/admin/blog`

- **Cabecera y layout**: El contenedor principal usa `layout-container-wide space-y-8 pb-16 pt-6`. Cards y secciones respetan el estilo global (bordes suaves, `bg-surface`, sombras ligeras).
- **Generar artículo**: Formulario (tema, idioma, tono, longitud, palabras clave, toggles tips/CTA). Botón principal `Generar borrador` -> POST `/api/admin/blog`. Inputs usan `bg-surface`, `focus:ring`, y el botón de recarga reutiliza el estilo de `border-soft`.
- **Plan editorial**: Tabla en tarjeta `rounded-xl` que muestra el calendario (`planEntries`). Estados con badges (`PLAN_STATUS_BADGE`), botón `Generar siguiente artículo ahora` (POST `/plan/generate`). Hovers aplican `hover:bg-surface-muted` y botones secundarios reutilizan `bg-surface text-body`.
- **Programados**: Lista ordenada de próximos posts (planificados manual o worker). Cada ítem es clickable, `bg-surface` y `hover` suave. Incluye botón “Actualizar” que recarga desde `/api/admin/blog?status=scheduled`.
- **Listado + editor**: Layout 2 columnas (`lg:grid-cols-5`): a la izquierda tabla con filtros (estado) y buscador de texto (título, extracto, tags, research); a la derecha editor completo (título, extracto, markdown, tags, status, schedule, research, cover). La fila activa se resalta con `bg-primary-soft`. Botones de acción siguen tokens (`bg-primary` + `text-[color:var(--color-on-primary)]`, secundarios con `border-primary text-primary`).
- **Portada / Research**: Sección de investigación muestra resumen + referencias con links. Bloque de portada indica estado y `Ver imagen` (en Storage). Se despliega `storagePath` para trazabilidad.

### 3.2 Automatización

- Worker ejecuta `ensurePlanWindow()` (120 días por defecto). Si encuentra entrada `planned/failed`, lanza `generateBlogAssets()`:
  1. Investigación Tavily (`blogResearchService`) con fallback y resumen mínimo.
  2. Redacción IA (`generateBlogArticle`) integrando investigación y tags, reforzando tono cálido/humano (gancho empático, ejemplos prácticos, cierre motivador).
  3. Imagen IA (`generateCoverImageFromPrompt`) -> descarga + subida a Storage. Guarda `coverImage.url`, `storagePath`, `bucket`, `signedUrlExpiresAt`, `originalUrl`, `upload`.
  4. Traducción automática (`translateBlogArticleToLanguages`) a cada idioma configurado (`BLOG_SUPPORTED_LANGUAGES`). Cada variante se guarda en `translations.{lang}` junto con `availableLanguages`.
  5. Persistencia en Firestore `blogPosts` + actualización `blogEditorialPlan`.
- Botón manual en panel dispara este mismo ciclo vía `POST /api/admin/blog/plan/generate`.

### 3.3 Blog público (`/blog`, `/blog/:slug`, Home)

- **Home widget**: sección de 3 cards en `HomeUser.jsx` aprovechando `layout-container`, `bg-surface`, `shadow-sm`. Cada card muestra foto, título, snippet, `Link` al detalle.
- **Listado `/blog`**: Página `Blog.jsx` usa `layout-container max-w-5xl space-y-10`. Grid de cards (`md:grid-cols-2`) con imagen `object-cover`, chips de tags, fecha formateada (`formatDate`). Incluye buscador client-side (título, extracto, tags, research) y scroll infinito vía `IntersectionObserver` cuando no hay filtro activo. Cada request incluye `language` para recibir la variante traducida (`availableLanguages`).
- **Detalle `/blog/:slug`**: Renderiza markdown en `Prose` styled, muestra cover hero con `max-w-4xl`, autor/time, CTA final. Consume `/api/blog/:slug?language=xx` para cargar la versión correcta y mostrar tags/CTA traducidos. Links relacionados (tags) apuntan al listado con filtro `?tag=...` (pendiente).
- Todos los elementos reutilizan tokens (tipografía, `text-muted`, botones `primary`, `secondary`). Se respeta `ThemeToggle` (claro/oscuro).

## 4. Persistencia y datos

| Colección                  | Campos clave                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blogPosts`                | `title`, `slug`, `language`, `availableLanguages`, `status`, `excerpt`, `content.{markdown,outline,tips,conclusion,cta}`, `translations.{lang}.{status,title,excerpt,content,tags}`, `tags`, `research.summary`, `research.references`, `coverImage.{url,storagePath,bucket,...}`, `prompt` (raw IA), `automation` (metadatos), `scheduledAt`, `publishedAt`. |
| `blogEditorialPlan`        | `date`, `topic`, `angle`, `keywords`, `tone`, `language`, `status`, `planFocus`, `postId`, `automation`, `error`.                                                                                                                                                                                                                                             |
| `blogSettings` (pendiente) | Flags `autoGenerate`, `generationHour`, `timezone`, etc.                                                                                                                                                                                                                                                                                                      |
| Storage                    | Carpeta `blog/covers/AAAA-MM-DD/{uuid}.ext` con `cacheControl` 1 año.                                                                                                                                                                                                                                                                                         |

## 5. Estado visual / estilos globales

- Contenedores utilizan `layout-container` / `layout-container-wide`, `space-y-*` y padding `pt-6 pb-16` según tokens (`flujo-31-estilo-global`).
- Cards: `rounded-xl border border-soft bg-surface shadow-sm`. Listas internas adoptan `bg-surface` + `hover:bg-surface-muted`.
- Formularios: inputs `bg-surface`, `border-soft`, `focus:ring-primary`. `select` y `textarea` heredan tipografía base (`text-body`, `text-muted` para ayudas).
- Badges y chips: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold` con tokens (`bg-warning-soft`, `bg-info-soft`, `bg-success-soft`, `bg-danger-soft`) según estado.
- Tipografía: headings `text-2xl font-semibold`, subtítulos `text-sm text-muted`. Markdown en detalle usa `prose` (falta integrar `@tailwindcss/typography` si no está).
- Voz editorial: prompts reforzados para mantener un tono “experto cercano y humano”, con gancho empático, ejemplos útiles y cierre motivador en cada idioma.

## 6. Estados especiales

- **Generación**: mientras se crea un artículo, botón muestra `Generando...`, se bloquea UI. Errores -> toast `No se pudo generar el artículo` + log.
- **Plan vacío**: tabla indica “Aún no hay días planificados”. Botón manual permite generar.
- **Programados**: si no hay posts programados, mensaje informativo (sin skeletons).
- **Detalle**: sin investigación ni cover se ocultan esos bloques (status `skipped` informa en `automation`).
- **Worker fallido**: `blogEditorialPlan` queda en `failed` con `error`. Panel lo muestra en badge rojo + mensaje. Se recomienda revisar logs y reintentar manual.

## 7. Integraciones

- Gamificación/Analytics (pendiente) para medir lecturas y CTA.
- Sitio público / marketing reutiliza `GET /api/blog` (paginación 10).
- Newsletter / email templates pueden tirar de `blogPosts` publicados (falta endpoint dedicado).

## 8. Métricas y monitorización

- Eventos sugeridos: `blog_plan_generated`, `blog_post_created`, `blog_post_published`, `blog_cover_upload_failed`, `blog_plan_failed`.
- Logs existentes: `[blogAutomation]` (info, warn, error). Falta canalizar a dashboard central (Grafana).
- Health checks: programar alerta si el plan queda sin entradas >3 días o si el worker falla N veces seguidas.

## 9. QA / pruebas

- Unitarias: `blogAutomationService` (ensures slug, cover upload, fallback research), `blogAiService` (cover image).
- Integración: mock de Tavily + OpenAI (con fallback) para verificar pipeline completo.
- E2E: `cypress/e2e/blog/admin-blog.cy.js` (pendiente) cubriendo generación manual, edición, publicación y plan. `blog-public.cy.js` para navegación pública.
- Scripts locales: `backend/scripts/debugBlogAutomation.js` para disparar el ciclo completo (requiere credenciales).

## 10. Checklist de despliegue

1. Variables de entorno: `OPENAI_API_KEY`, `TAVILY_API_KEY`, `BLOG_AUTOMATION_*`, `BLOG_COVER_STORAGE_BUCKET` (opcional), `BLOG_SUPPORTED_LANGUAGES` (lista CSV, por defecto `es,en,fr`). Verificar bucket existe.
2. Reglas Firestore/Storage: permitir escritura controlada en `blogPosts`, `blogEditorialPlan`, `blog/covers/*` solo al backend admin. Lectura pública solo `status=published`.
3. Índices: `blogPosts status+generatedAt`, `blogPosts status+publishedAt`, `blogPosts availableLanguages+publishedAt`, `blogEditorialPlan status+date`.
4. Logs/monitoring: habilitar alertas de worker, revisar volumen de Tavily/OpenAI.
5. i18n: confirmar traducciones en `src/i18n/locales/*/common.json` (`blog`, `adminBlog` keys).
6. Limpieza: eliminar agregador RSS legacy (`fetchWeddingNews`), o mantener redirección temporal para Home si se desea fallback.

## 11. Roadmap / siguientes pasos

- Panel de métricas (lecturas, conversiones) y comparativa planificado vs publicado.
- Edición colaborativa con roles (`needs_review`, `approved_by`).
- Catálogo de plantillas de artículo y prompts dinámicos por categoría.
- Sistema de destacados/curación manual + portada principal.
- Integración con newsletters y campañas (seleccionar artículos para envío).
- Motor de recomendaciones personalizadas (mostrar artículos en dashboard según etapa de la boda).
