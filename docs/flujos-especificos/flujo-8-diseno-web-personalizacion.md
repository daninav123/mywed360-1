# 8. Diseno Web y Personalizacion (estado 2025-10-07)

> Implementado: `src/pages/DisenoWeb.jsx`, `src/components/web/WebGenerator.jsx`, `WebTemplateGallery.jsx`, `WebsitePreview.jsx`, servicios `websiteService.js` y assets compartidos.
> Pendiente: prompts IA editables, generacion automatica completa (`AIWebGenerator.jsx`), versionado y analytics nativos, dominios personalizados y flujos de colaboracion.

## 1. Objetivo y alcance
- Permitir que owners generen y editen un sitio publico de la boda en minutos.
- Ofrecer plantillas, prompts y contenido dinamico que se nutre de datos de la boda.
- Publicar un micrositio responsive con formulario RSVP, mapa, agenda y branding personalizado.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Extras** → “Diseño Web” (`/diseno-web`, `DisenoWeb.jsx`).
- CTA en Home (“Publica tu sitio”) preselecciona el generador (`WebGenerator.jsx`).
- Acceso directo al preview: `/diseno-web/preview` permite validar cambios antes de publicar.

## 3. Paso a paso UX
1. Seleccion y edicion de base
   - Galeria de plantillas (`WebTemplateGallery.jsx`) por estilo (clasica, moderna, rustica, tematizada).
   - Biblioteca de prompts IA con variables `{nombres}`, `{fecha}`, `{ubicacion}`, editable en modal.
   - Campos de branding: colores, tipografia, portada hero, copy principal.
2. Generacion y personalizacion
   - `WebGenerator.jsx` rellena estructura con datos de la boda (agenda, invitados, historia, FAQs).
   - Boton "Generar sitio" dispara servicio IA (cuando se habilite) o plantilla estatica actual.
   - Panel lateral para editar secciones (Historia, Cronograma, Recomendaciones, Preguntas frecuentes).
3. Publicacion y comparticion
   - Vista previa responsive (`WebsitePreview.jsx`) con botones publicar/regenerar.
   - Opcion de activar formulario RSVP y contador regresivo.
   - URL publica `/w/{slug}` o dominio personalizado (pendiente) + botones compartir/descargar QR.

## 4. Persistencia y datos
- Firestore `weddings/{id}/website`: configuracion (`theme`, `colors`, `sections`), contenido generado, estado `published`.
- `publicSites/{weddingId}`: cache del HTML publicado, metadatos (subdominio, seo, ultima publicacion).
- Recursos en Storage: imagenes optimizadas, favicon, archivos descargables.
- Logs de generacion IA (cuando se active) en `ai/websites/{runId}` con prompt y tokens.

## 5. Reglas de negocio
- Solo owner/planner pueden publicar; assistants pueden editar borradores si tienen permiso.
- Datos sensibles (direcciones exactas) se muestran solo si el owner los marca como publicos.
- Si no hay fecha de boda el contador regresivo se oculta automaticamente.
- Regenerar sitio mantiene misma URL y publica version mas reciente tras confirmacion.

## 6. Estados especiales y errores
- Sin datos minimos (nombres, fecha) -> banner pidiendo completarlos en Perfil.
- Error de generacion IA -> fallback a plantilla base y mensaje "No pudimos generar contenido, edita manualmente".
- Publicacion fallida -> rollback al ultimo HTML correcto y log en consola/notificacion.
- Vista previa offline -> deshabilitar boton publicar y mostrar aviso de sin conexion.

## 7. Integracion con otros flujos
- Flujo 2 provee datos iniciales (fecha, ubicacion, estilo) y slug de la boda.
- Flujo 3 y 9 rellenan RSVP y listas de invitados visibles en el sitio.
- Flujo 5 (proveedores) y 15 (documentos) pueden publicar secciones destacadas en la web.
- Flujo 21 reutiliza el mismo contenido para landing publica general.

## 8. Metricas y monitorizacion
- Eventos: `website_generated`, `website_published`, `website_regenerated`, `website_theme_changed`.
- Metricas planeadas: visitas unicas, RSVPs recibidos desde sitio publico, tiempo entre generacion y publicacion.
- Dashboard futuro con top secciones vistas y conversiones por canal.

## 9. Pruebas recomendadas
- Unitarias: parseo de prompts, normalizacion de secciones, helpers de slug/domino.
- Integracion: generar sitio -> guardar en Firestore -> previsualizar -> publicar -> confirmar cache publica.
- E2E: usuario crea sitio, activa RSVP, visita URL publica y envia confirmacion.

## 10. Checklist de despliegue
- `OPENAI_API_KEY` y limites `RATE_LIMIT_AI_MAX` configurados antes de habilitar generacion IA.
- CDN/hosting para contenido estatico (`publicSites`) con cache invalido tras publicar.
- Revisar politicas de privacidad y consentimiento antes de exponer datos publicos.
- Validar compresion de imagenes y peso total < 2 MB para mejorar performance.

## 11. Roadmap / pendientes
- Editor de prompts avanzado con versionado y biblioteca compartida.
- Historial de versiones y undo/redo de secciones publicadas.
- Analitica integrada (visitas, fuentes, conversion RSVP) y alertas.
- Dominio personalizado, SEO (metatags, sitemap) y generacion de OG images.
- Colaboracion multirol (comentarios, sugerencias, aprobaciones).
