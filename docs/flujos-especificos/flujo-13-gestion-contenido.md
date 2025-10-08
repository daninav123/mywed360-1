# 13. Gestión de Contenido (estado 2025-10-07)

> Implementado: `Inspiration.jsx`, `Ideas.jsx`, `Blog.jsx`, `DocumentosLegales.jsx` (MVP), `InspirationGallery.jsx`, `SearchBar`, servicios `inspirationService`, `SyncService`, `blogService.js`.
> Pendiente: editores avanzados (ContentEditor, WeddingStories), automatización IA de contenidos largos y dashboards de engagement.

## 1. Objetivo y alcance
- Ofrecer espacios de inspiración visual, ideas/notas, artículos y documentos legales.
- Guardar favoritos, sincronizar contenido entre dispositivos y generar documentos básicos.
- Servir como repositorio creativo y legal para la boda.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Extras** expone “Diseño Web”, “Diseños”, “Ideas”, “Galería de Inspiración” y “Blog” (rutas `/diseno-web`, `/disenos`, `/ideas`, `/inspiracion`, `/blog`).
- El bloque **Protocolo** dentro de `Más` incluye “Documentos” (`/protocolo/documentos` → `DocumentosLegales.jsx`).

## 3. Paso a paso UX
1. Inspiración visual
   - `Inspiration.jsx` carga feed (wallService) con infinite scroll y filtros por tag.
   - `InspirationGallery` ofrece favoritos, lightbox, tags sugeridos y sincronización local/Firestore.
2. Ideas/Notas
   - `Ideas.jsx` soporta CRUD de notas, categorías y orden manual.
   - Sync con `SyncService` para persistencia offline.
3. Blog y documentos
   - `Blog.jsx` edita y publica posts con `blogService`.
   - `DocumentosLegales.jsx` genera PDF de consentimiento de imagen (jsPDF) y sienta base para otros documentos.

## 4. Persistencia y datos
- Firestore `weddings/{id}/ideas`, `.../blog`, `.../legalDocuments` (MVP) y `users/{uid}/favorites`.
- `SyncService` gestiona almacenamiento local (IndexedDB/localStorage) y sincronización.
- Contenido externo (inspiración) cacheado en `localStorage` `ideasPhotos`.

## 5. Reglas de negocio
- Owners/planners editan; assistants lectura (salvo notas compartidas).
- Documentos legales deben revisarse antes de compartir; MVP solo consentimiento imagen.
- Favoritos sincronizados se comparten entre dispositivos del mismo usuario.

## 6. Estados especiales y errores
- Galería sin resultados → mensaje y CTA cambiar búsqueda/tag.
- Error fetch inspiración → fallback contenido local.
- Generador legal sin datos → validaciones de formulario.
- Modo offline → banner informando almacenamiento local.

## 7. Integración con otros flujos
- Flujo 8 reutiliza assets para sitio web.
- Flujo 9/21 usan contenidos (galería, historias) para RSVP y sitio público.
- Flujo 15/18 compartirán generador legal avanzado.
- Flujo 17 otorga puntos por creación de contenido que se publica.

## 8. Métricas y monitorización
- Eventos: `inspiration_favorite_saved`, `idea_created`, `blog_post_published`, `legal_doc_generated`.
- Indicadores: tiempo en galería, tags populares, nº de notas activas.
- Logs de sincronización y errores de fetch.

## 9. Pruebas recomendadas
- Unitarias: `InspirationGallery` filtros/favoritos, `SyncService` sincronización, generador PDF.
- Integración: guardar favorito → sync → ver en otro dispositivo → usar en sitio web.
- E2E: flujo inspiración → crear nota → publicar blog → generar documento legal.

## 10. Checklist de despliegue
- Reglas Firestore para colecciones de contenido.
- Revisar límites de almacenamiento local y limpieza (sync).
- Asegurar clave API para servicios externos de imágenes.
- Validar licencias/fuentes de contenidos.

## 11. Roadmap / pendientes
- Editor rico (ContentEditor) y historias colaborativas (WeddingStories).
- IA para curar contenido, captions y resúmenes.
- Estadísticas de engagement (visitas, favoritos).
- Integración con proveedores (portafolios) y sitio público.
- Biblioteca de plantillas de documentos legales ampliada.
