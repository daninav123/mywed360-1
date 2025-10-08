# 8. Diseno Web y Personalizacion (estado 2025-10-07)

> Implementado: `src/pages/DisenoWeb.jsx`, componentes `WebGenerator.jsx`, `WebTemplateGallery.jsx`, `WebsitePreview.jsx`, servicio `websiteService.js`, biblioteca IA `websitePromptBuilder.js` y postprocesador `websiteHtmlPostProcessor.js`.
> Pendiente: prompts IA editables, generacion automatica completa (`AIWebGenerator.jsx`), versionado y analytics nativos, dominios personalizados y flujos de colaboracion.

## 1. Objetivo y alcance
- Permitir que owners generen y editen un sitio publico de la boda en minutos.
- Ofrecer plantillas, prompts y contenido dinamico que se nutre de datos de la boda.
- Publicar un micrositio responsive con mapa, agenda, transporte, hospedaje y branding personalizado.

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
   - Biblioteca de prompts premium (`websitePromptBuilder.js`) combina tokens de estilo, tono y secciones expertas con el prompt libre del usuario.
   - Contenido logístico configurable: horarios de autobuses (via importación automática desde proveedores o entrada manual), hospedajes recomendados, guía de llegada y notas especiales para invitados.
3. Publicacion y comparticion
   - Vista previa responsive (`WebsitePreview.jsx`) con botones publicar/regenerar.
   - Contador regresivo opcional cuando hay fecha definida.
   - Slug público autogenerado con la fecha completa (`aaaa-mm-dd`), con verificación de disponibilidad y sugerencias para variaciones.
   - URL publica `/w/{slug}` o dominio personalizado (pendiente) + botones compartir/descargar QR.
4. Postprocesado estetico
   - `websiteHtmlPostProcessor.js` armoniza la salida IA: inyecta tipografias curadas, variables CSS, secciones hero/galeria/transporte/hospedaje/como llegar en diseño consistente y verifica que el HTML sea completo.

## 4. Persistencia y datos
- Firestore `weddings/{id}/website`: configuracion (`theme`, `colors`, `sections`, `transportationSchedule`, `lodgingOptions`, `travelGuide`), contenido generado, estado `published`.
- `publicSites/{weddingId}`: cache del HTML publicado, metadatos (subdominio, seo, ultima publicacion).
- Recursos en Storage: imagenes optimizadas, favicon, archivos descargables.
- Logs de generacion IA (cuando se active) en `ai/websites/{runId}` con prompt, tokens y version de postprocesado aplicado.

## 5. Reglas de negocio
- Solo owner/planner pueden publicar; assistants pueden editar borradores si tienen permiso.
- Datos sensibles (direcciones exactas) se muestran solo si el owner los marca como publicos.
- El módulo logístico se alimenta tanto de importaciones automáticas (correo del proveedor de autobuses→Flow 7) como de captura manual; los owners pueden activar/desactivar cada bloque.
- Si no hay fecha de boda el contador regresivo y los horarios dependientes se ocultan automaticamente.
- Regenerar sitio mantiene misma URL y publica version mas reciente tras confirmacion.

## 6. Estados especiales y errores
- Sin datos minimos (nombres, fecha) -> banner pidiendo completarlos en Perfil.
- Error de generacion IA -> fallback a plantilla base y mensaje "No pudimos generar contenido, edita manualmente".
- Publicacion fallida -> rollback al ultimo HTML correcto y log en consola/notificacion.
- Vista previa offline -> deshabilitar boton publicar y mostrar aviso de sin conexion.

## 7. Integracion con otros flujos
- Flujo 2 provee datos iniciales (fecha, ubicacion, estilo) y slug de la boda.
- Flujo 5 (proveedores) y 15 (documentos) pueden publicar secciones destacadas en la web.
- Flujo 7 (comunicación) detecta horarios de transporte en correos y los sugiere como contenido logístico.
- Flujo 21 reutiliza el mismo contenido para landing publica general.

## 8. Metricas y monitorizacion
- Eventos: `website_generated`, `website_published`, `website_regenerated`, `website_theme_changed`.
- Metricas planeadas: visitas unicas, tiempo entre generacion y publicacion, clics en secciones logísticas y descargas de QR.
- Dashboard futuro con top secciones vistas y conversiones por canal.

## 9. Pruebas recomendadas
- Unitarias: parseo de prompts, normalizacion de secciones, helpers de slug/domino.
- Integracion: generar sitio -> guardar en Firestore -> previsualizar -> publicar -> confirmar cache publica.
- E2E: usuario crea sitio, revisa información logística, visita URL pública y verifica contenido.

## 10. Checklist de despliegue
- `OPENAI_API_KEY` y limites `RATE_LIMIT_AI_MAX` configurados antes de habilitar generacion IA.
- CDN/hosting para contenido estatico (`publicSites`) con cache invalido tras publicar.
- Revisar politicas de privacidad y consentimiento antes de exponer datos publicos.
- Validar compresion de imagenes y peso total < 2 MB para mejorar performance.

## 11. Roadmap / pendientes
- Editor de prompts avanzado con versionado y biblioteca compartida.
- Historial de versiones y undo/redo de secciones publicadas.
- Analitica integrada (visitas, fuentes, conversiones de CTA logísticas) y alertas.
- Dominio personalizado, SEO (metatags, sitemap) y generacion de OG images.
- Colaboracion multirol (comentarios, sugerencias, aprobaciones).

## 12. Motor IA premium
- **Prompt framework**: plantilla base con identidad visual curada, tokens de paleta y tipografia por estilo, descripción de secciones obligatorias y microinteracciones (hero, historia, timeline, galería, transporte, hospedaje, guía de llegada, contacto), combinable con instrucciones libres del usuario.
- **Postprocesador HTML**: asegura `<!doctype html>`, inyecta `<style>` con variables (`--color-primary`, etc.), aplica layout responsive basado en grid/flex, genera fallback de galerías y tarjetas logísticas y añade scripts ligeros (contador regresivo) cuando hay fecha valida.
- **Extensibilidad**: nuevos estilos o bloques logísticos se añaden registrando tokens en `websitePromptBuilder.js` y reglas de transformación en `websiteHtmlPostProcessor.js` sin tocar la interfaz principal; admite enriquecimiento desde correos de proveedores o entrada manual.
