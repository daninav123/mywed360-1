# Plan: Panel editorial con noticias generadas por IA

## 1. Objetivos
- Reemplazar el agregador RSS por un blog gestionado internamente.
- Permitir a admins crear, revisar y publicar artículos generados por IA con control editorial.
- Automatizar la generación diaria manteniendo posibilidad de revisar/editar antes de publicar.

## 2. Roles y permisos
- Solo usuarios con rol `admin` pueden acceder al panel (`/admin/blog`).
- Lectoras del blog (front público) no requieren autenticación.
- Audit trail básico (quién aprobó, quién editó, cuándo).

## 3. Modelo de datos (Firestore)
Colección `blogPosts` (documento por artículo):
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | string | Título visible (por idioma) |
| `slug` | string | URL única, autogenerada (se puede editar) |
| `language` | string | ISO 639-1 (`es`, `en`, …) |
| `status` | string | `draft`, `scheduled`, `published`, `archived`, `failed` |
| `generatedAt` | timestamp | Fecha de generación IA |
| `scheduledAt` | timestamp/null | Fecha prevista de publicación |
| `publishedAt` | timestamp/null | Fecha efectiva |
| `content` | object | Markdown + bloques estructurados (ver abajo) |
| `excerpt` | string | Resumen corto |
| `coverImage` | object | `{ url, prompt, source, alt }` |
| `tags` | array<string> | Temas (ej. `tendencias`, `decoracion`) |
| `seo` | object | `{ metaTitle, metaDescription, keywords }` |
| `prompt` | object | `{ system, user, variables }` |
| `audit` | object | `{ createdBy, approvedBy, updatedBy }` |
| `metrics` | object | `{ views, shares }` (se podrá llenar más adelante) |

> **Contenido estructurado**: guardar markdown principal (`content.markdown`) y bloques enriquecidos (`content.blocks[]` con tipo, subtítulo, bullet list, CTA, etc.) para render avanzado.

## 4. Flujo editorial
1. **Listar artículos**: tabla con filtros por estado/idioma, orden por fecha.
2. **Ver detalle**: preview renderizada + pestaña “raw” con markdown, prompts utilizados, logs IA.
3. **Crear nuevo artículo**:
   - Inputs: título base/tema, idioma, tono, longitud, keywords, categoría/tags, CTA opcional, idea para imagen.
   - Botón “Generar borrador” → llamada a backend IA → guarda doc con estado `draft`.
   - Permitir re-generar secciones: título, introducción, secciones individuales, CTA, imagen (con historial).
4. **Revisión humana**:
   - Edición manual (rich text/markdown).
   - Marcar check de QA (ej. “verificado por humano”).
   - Programar fecha/hora (`scheduledAt`) o publicar inmediatamente (`publishedAt`).
5. **Automatización diaria**:
   - Job (`BlogSchedulerWorker`) ejecutado cada madrugada:
     - Verifica si hay artículo `scheduled` para el día → publica (set `publishedAt`, `status = published`).
     - Si no hay, genera uno nuevo con tema/plantilla según calendario editorial (ver Sección 7).
   - Guardar logs en colección `blogAutomationLogs` (`status`, `error`, `duration`).
6. **Archivado/Corrección**:
   - Posibilidad de despublicar → `status = archived` (slug queda reservado).
   - Historial de versiones (guardar snapshots en subcolección `revisions` si es necesario).

## 5. Backend
- Nueva ruta `backend/routes/admin-blog.js`:
  - `GET /api/admin/blog/posts` → lista filtrable/paginada.
  - `POST /api/admin/blog/posts` → crear via IA → delega en `blogAiService`.
  - `PUT /api/admin/blog/posts/:id` → actualizar campos editables.
  - `POST /api/admin/blog/posts/:id/actions` → acciones (`publish`, `schedule`, `regenerate-section`, `create-image`, `archive`).
  - Usa `requireAdmin` + `ipAllowlist` como el resto del panel admin.
  - Valida entrada con zod.
- Servicio `backend/services/blogAiService.js`:
  - Conecta con modelo GPT (OpenAI/Tavily?) usando prompts base.
  - Soporta generación modular (título, outline, secciones, resumen, CTA).
  - Genera imagen (si se permite) usando pipeline existente (`ai-image`?) o fallback a stock.
  - Devuelve estructura lista para persistir (markdown + bloques).
- Worker `backend/workers/blogSchedulerWorker.js`:
  - Se inicia junto a otros workers si `ENABLE_BLOG_AI_WORKER=true`.
  - Corre cada hora (cron dentro del proceso) → si hora=03:00 y no se ha ejecutado hoy:
    - Revisa posts con `scheduledAt` <= now y `status = scheduled` → `publish`.
    - Si no hay publicados hoy y `autoGenerate=true`, invoca `blogAiService` con tema predefinido (ver Sección 7).

## 6. Frontend
- **Rutas admin**:
  - Nuevo entry en `src/pages/admin/AdminBlog.jsx` (o subpestaña dentro de `AdminDashboard`):
    - Tabs: “Noticias” (lista), “Generar” (form IA), “Automatización” (configuración).
    - Componentes reutilizables: tabla + filters (similar a `AdminUsers`), editor markdown (`react-markdown` + textarea), preview HTML.
    - Botones de acción: `Generar`, `Regenerar`, `Publicar`, `Programar`, `Descartar`, `Clonar`.
  - Hooks: `useAdminBlogPosts`, `useAiGeneration`, `useSchedulerState`.
  - Mostrar logs (últimas ejecuciones worker) y próxima ejecución programada.
- **Página pública**:
  - `src/pages/Blog.jsx` se actualiza para leer `blogPosts` publicados desde Firestore/Backend (endpoint público `GET /api/blog/posts` con paginación).
  - Soporte multi-idioma (primer release con español; escalar a inglés/francés duplicando contenido o traduciendo con IA).
  - Cartas muestran `coverImage`, `title`, `excerpt`, `publishedAt`, `tags`.
  - Detalle `/blog/:slug` nueva vista `BlogPost.jsx` renderiza markdown + bloques (CTA, quotes, etc.).

## 7. Calendario editorial automatizado
- Config Firestore `blogSettings` (document único):
  ```jsonc
  {
    "autoGenerate": true,
    "generationHour": "03:00",
    "timezone": "Europe/Madrid",
    "defaultLanguage": "es",
    "topicsCycle": [
      { "id": "tendencias", "title": "Tendencias de boda", "keywords": ["bodas 2025", "colores tendencia"] },
      { "id": "proveedores", "title": "Guías de proveedores", "keywords": ["fotografía boda", "catering"] },
      { "id": "planificacion", "title": "Planificación y presupuesto", "keywords": ["checklist boda", "presupuesto"] },
      { "id": "inspiracion", "title": "Inspiración real", "keywords": ["bodas reales", "decoración"] }
    ],
    "lastAutoRun": "2024-10-27T03:00:00Z",
    "nextTopicIndex": 0
  }
  ```
- Worker rota `topicsCycle` para evitar repeticiones consecutivas.
- Permitir pausar (`autoGenerate=false`) desde panel.

## 8. Prompts IA (v1)
**System prompt** (resumen):
```
Eres un redactor experto en bodas para la marca Lovenda. Escribe artículos útiles, cálidos y llenos de detalles prácticos para parejas. Mantén tono profesional, evita promesas exageradas, no inventes datos verificables.
```
**User prompt**:
```
Genera un artículo de {longitud} palabras en {idioma}. Tema: {tema}.
Estructura:
- Título atractivo (máx 70 caracteres)
- Introducción (2 párrafos)
- 3-4 secciones con subtítulos H2, cada una con ideas accionables
- Lista con tips clave
- Cierre con CTA (ej. descarga guía, visita Lovenda)
Incluye snippets de datos reales solo si son verificables. Devuelve JSON con campos title, outline[], sections[], tips[], conclusion, seo.
```
- Postprocesado en backend para montar markdown + bloques.
- Imagen: prompt con `tema`, `estilo`, `paleta` → IA de imágenes (opcional) o seleccionar librería (Unsplash) según tags.

## 9. Consideraciones legales y de calidad
- Chequear contenido sensible: si IA incluye marcas registradas o datos personales → marcar `status = needs_review`.
- Guardar la respuesta bruta (`rawResponse`) en subcolección para auditorías (max 30 días).
- Incluir cláusula en panel: “No publicar sin revisión humana”.
- Internacionalización: si se ofrece en varios idiomas, generar contenido nativo por idioma (no traducción literal) o traducir con revisión humana.

## 10. Roadmap incremental
1. **MVP** (2 sprints):
   - Panel admin (lista + generación manual + publicación manual).
   - Lectura pública de Firestore (`status=published`).
   - Sin automatización diaria (solo manual).
2. **Automatización básica**:
   - Worker que publica programados y genera fallback diario con 1 tema fijo.
   - Ajustes de configuración en `blogSettings`.
3. **Personalización avanzada**:
   - Ciclo de temas, traducciones, soporte multi-idioma.
   - Editor visual con bloques ricos.
   - Métricas (views, CTR) en panel.
4. **Integraciones futuras**:
   - Compartir auto en redes (Twitter/Instagram).
   - Envío a newsletter / push.
   - Feedback de lectores (likes, guardar).

## 11. Migración y fallback
- Mantener fallback actual (RSS) como plan B mientras migramos front a nuevo endpoint.
- Una vez haya >5 artículos publicados por IA, retirar fallback y deshabilitar `blogService` antiguo.
- Documentar en `docs/blog/README.md` uso del panel, campos y mejores prácticas.

---
**Checklist previa a implementación**
- [ ] Validar campos obligatorios con producto/contenido.
- [ ] Acordar calendario editorial (temas iniciales) con marketing.
- [ ] Confirmar límites de OpenAI/IA (coste mensual, modelo).
- [ ] Definir responsable de revisión diaria.
