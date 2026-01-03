# Automatización del Blog desde el panel de admin

Este documento resume todo lo implementado para que el panel de administración de Lovenda pueda generar, programar y publicar noticias de manera autónoma con IA. Incluye flujo, dependencias y tareas pendientes para operación en producción.

---

## 1. Flujo general

1. **Plan editorial**
   - Se mantiene en Firestore (`blogEditorialPlan`) un registro diario con tema, enfoque, tono y palabras clave.
   - Si faltan días planificados, se solicita a OpenAI un plan mensual; si falla, se usa un plan base (fallback).

2. **Investigación**
   - Para cada tema se lanza una búsqueda en Tavily (`backend/services/blogResearchService.js`).
   - Se obtienen resumen y enlaces relevantes (se guardan en el post para revisión).

3. **Redacción del artículo**
   - `generateBlogArticle` (OpenAI) usa el prompt + la investigación para construir título, markdown, secciones, CTA y tags.
   - Si OpenAI no responde, se devuelve un borrador listo con el fallback local.

4. **Imagen de portada**
   - Se genera automáticamente con OpenAI Images (modelo configurable).
   - El estado (`pending`/`ready`/`failed`) y la URL se guardan en el documento.

5. **Persistencia**
   - Todo se guarda en `blogPosts` con contenido, referencias, metadatos de automatización y planes (`automation` y `research`).
   - Los posts programados se actualizan al publicarse o al archivar desde el panel.

6. **Panel de admin**
   - `src/pages/admin/AdminBlog.jsx` muestra lista filtrable, plan programado y detalle del post.
   - Permite editar contenido, cambiar estado, reprogramar, publicar o archivar manualmente.

7. **Worker automático**
   - `backend/workers/blogAutomationWorker.js` ejecuta cada hora (configurable).
   - Genera el artículo del plan más cercano y lo deja programado según la hora deseada.

---

## 2. Datos clave en Firestore

### `blogEditorialPlan`

| campo                          | descripción                                     |
| ------------------------------ | ----------------------------------------------- |
| `date / dateKey`               | Día planificado (ISO).                          |
| `topic`, `angle`, `keywords`   | Información usada para generar el artículo.     |
| `tone`, `audience`, `language` | Parámetros adicionales para el prompt.          |
| `status`                       | `planned`, `generating`, `scheduled`, `failed`. |
| `planFocus`, `source`          | Metadatos del plan (OpenAI o fallback).         |
| `postId`                       | ID del artículo en `blogPosts` cuando se crea.  |

### `blogPosts`

Campos ya existentes más:

- `research.summary` + `research.references[]`.
- `automation` (quién generó, cuándo, estado de imagen/investigación).
- `prompt.research` (resumen + URLs utilizadas).
- `coverImage` con estado y proveedor.

---

## 3. Endpoints del admin

Todos bajo `/api/admin/blog` con middleware `ipAllowlist + requireAdmin`.

| Método                | Ruta                                                                                                | Descripción |
| --------------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `GET /`               | Lista posts filtrando por `status`, `language`, `limit`. Fallback manual si falta índice Firestore. |
| `POST /`              | Genera un nuevo artículo (invoca investigación + redacción + imagen). Devuelve borrador listo.      |
| `PUT /:id`            | Actualiza campos editables (título, excerpt, contenido, tags, estado, fechas, cover).               |
| `POST /:id/publish`   | Marca `published`, limpia `scheduledAt`, permite forzar `publishedAt`.                              |
| `POST /:id/schedule`  | Cambia estado a `scheduled` con la fecha indicada.                                                  |
| `POST /:id/archive`   | Cambia estado a `archived`.                                                                         |
| `GET /plan`           | Devuelve el plan editorial a partir de hoy (con estado, error, post asociado).                      |
| `POST /plan/generate` | Fuerza un ciclo de automatización (útil para lanzar el siguiente artículo manualmente).             |

---

## 4. Variables de entorno

| Variable                                                            | Uso                                                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                                                    | Requerida para redacción e imágenes.                                                                                                        |
| `OPENAI_MODEL_BLOG`, `OPENAI_MODEL_BLOG_PLAN`, `OPENAI_IMAGE_MODEL` | Modelos personalizados (opcional).                                                                                                          |
| `TAVILY_API_KEY`                                                    | Necesaria para la investigación externa.                                                                                                    |
| `TAVILY_API_URL`, `TAVILY_TIMEOUT_MS`                               | Ajustes opcionales de Tavily.                                                                                                               |
| `BLOG_AUTOMATION_INTERVAL_MS`, `BLOG_AUTOMATION_INITIAL_DELAY_MS`   | Frecuencia del worker.                                                                                                                      |
| `BLOG_AUTOMATION_PLAN_DAYS`                                         | Días que se preparan en el plan editorial (por defecto 120).                                                                                |
| `BLOG_AUTOMATION_LOOKAHEAD_DAYS`                                    | Margen de días hacia adelante para generar post (por defecto 2).                                                                            |
| `BLOG_AUTOMATION_PUBLISH_HOUR`                                      | Hora UTC deseada para programar la publicación automática (por defecto 9).                                                                  |
| `BLOG_AUTOMATION_DISABLED`                                          | Si se fija a `1`, el worker no arranca.                                                                                                     |
| `BLOG_COVER_STORAGE_BUCKET` (opcional)                              | Bucket de Firebase Storage donde se guardan las portadas (si no se define se usa `FIREBASE_STORAGE_BUCKET`/`VITE_FIREBASE_STORAGE_BUCKET`). |

> Las portadas se suben al bucket indicado y se hace público el objeto; si el bucket usa acceso uniforme se genera un Signed URL con caducidad larga. Se almacenan `coverImage.storagePath`, `coverImage.bucket` y la URL final para el frontend.

---

## 5. Worker de automatización

- Registrado en `backend/index.js` (solo fuera de `NODE_ENV=test`).
- Para cada ciclo:
  1. Garantiza que `blogEditorialPlan` cubra el rango solicitado (`ensurePlanWindow`).
  2. Selecciona el primer día pendiente/failed (`claimPlanEntry`).
  3. Llama a `generateBlogAssets` + `saveGeneratedBlogPost`.
  4. Actualiza el plan con `status=scheduled` y referencia al post.
  5. En caso de error, marca el plan como `failed` y guarda el mensaje.

Logs relevantes:

- `[blog-automation] Generated ...`
- Errores de Tavily/OpenAI se guardan en `automation.error` y en consola.

---

## 6. Panel de administración

### Acciones principales

- **Generar borrador**: Rellena formularios (tema, idioma, tono, keywords). Al crear, se añade a la lista y al panel.
- **Noticias programadas**: Listado ordenado ascendente por `scheduledAt`. Clic = selecciona para editar.
- **Detalle**: Permite editar campos, ver investigación y estado de la imagen. Incluye botones para guardar, publicar, programar o archivar.

### Nuevos bloques UI

- Tarjeta “Investigación IA” con resumen y referencias clicables.
- Estado rápido de la imagen de portada (y enlace cuando la URL está disponible).
- Panel del plan editorial con listado de próximos días, estado, error y acceso directo al post generado.
- Botón “Generar siguiente artículo ahora” que llama al endpoint manual del worker.

---

## 7. Checklist de despliegue

1. **Configurar entorno**
   - Añadir `OPENAI_API_KEY` y `TAVILY_API_KEY`.
   - Ajustar `BLOG_AUTOMATION_*` según horarios deseados.

2. **Reglas de seguridad**
   - Permitir lectura/escritura a `blogEditorialPlan` solo a procesos de backend/admin.
   - Verificar `blogPosts` si cambia la estructura esperada.

3. **Índices**
   - Crear (o verificar) índice compuesto: `blogPosts` `status` + `generatedAt`.
   - Revisar usos secundarios (búsqueda por idioma si se necesitan índices adicionales).

4. **Datos iniciales**
   - Lanzar worker en entorno de prueba y revisar que se cree el plan.
   - Comprobar que se generen posts programados con la hora deseada.

5. **Monitorización**
   - Revisar logs de `[blogAutomation]` y añadir alertas en caso de fallos continuos (Tavily/OpenAI).
   - Opcional: guardar métricas en Prometheus/Grafana si se desea seguimiento de producción.

6. **Testing manual sugerido**
   - `POST /api/admin/blog` con datos reales (usar admin auth).
   - Forzar fallo de Tavily (API key nula) para comprobar fallback.
   - Revisar UI: generación, edición, publicación, reprogramación, archivado.

---

## 8. Próximos pasos recomendados

- Añadir indicadores en el panel para posts con `automation.coverStatus = failed`.
- Incorporar tests automatizados (unidad/integración) que validen el fallback y el worker.
- Exponer métricas (número de posts generados, referencias utilizadas, tiempo de respuesta AI).
- Revisar cuotas de Tavily/OpenAI para evitar costes inesperados.

---

## 9. Ubicaciones en el código

- Rutas admin: `backend/routes/admin-blog.js`
- Servicios IA + automatización:
  - `backend/services/blogAiService.js`
  - `backend/services/blogResearchService.js`
  - `backend/services/blogTopicPlanner.js`
  - `backend/services/blogAutomationService.js`
- Worker: `backend/workers/blogAutomationWorker.js`
- Registro del worker/ruta: `backend/index.js`
- Panel React: `src/pages/admin/AdminBlog.jsx`

---

Con esta infraestructura el blog puede operar de forma autónoma, manteniendo siempre la posibilidad de revisión y edición manual desde el panel. Asegúrate de monitorizar las ejecuciones y ajustar el plan editorial según las necesidades de marketing/contenido.
