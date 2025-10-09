# 21. Sitio Publico (estado 2025-10-07)

> Implementado: `WeddingSite.jsx` (ruta `/w/:uid`), `PublicWedding.jsx`, articulos auxiliares (`SeatingPlanPost.jsx`, `MomentosEspeciales.jsx`), integracion con `websiteService` y contenido Firestore.
> Pendiente: personalizacion avanzada desde panel, dominios personalizados, SEO/analytics y medicion de conversion.

## 1. Objetivo y alcance
- Publicar una landing publica de la boda compartible con invitados y proveedores.
- Mostrar informacion relevante (historia, agenda, ubicaciones, RSVP, media) y reflejar branding.
- Servir como canal principal para confirmaciones y seguimiento.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Extras** → “Diseño Web”; desde ahí se publica el sitio (`/diseno-web`, sección Publicar sitio).
- Sitio público disponible en `/w/{slug}` (`WeddingSite.jsx`).
- Comunicaciones y notificaciones comparten el enlace público una vez publicado.

## 3. Paso a paso UX
1. Preparacion
   - Owner selecciona secciones a mostrar (agenda, alojamientos, recomendados, galeria).
   - Configura copy, imagenes, enlaces a redes y CTA RSVP.
   - Opcional: activar secciones de blog/articulos (SeatingPlanPost, MomentosEspeciales).
2. Publicacion
   - `WeddingSite.jsx` construye pagina con datos de Firestore (`website` + `publicContent`).
   - Boton compartir genera enlace corto y codigo QR.
   - Banner de estado informa si la web esta publicada, privada o en revision.
3. Seguimiento
   - Registro de visitas y acciones (RSVP, descargas) para analytics (pendiente).
   - Opcion de actualizar contenido y republish sin cambiar URL.
   - Boton "Despublicar" para volver a modo privado.

## 4. Persistencia y datos
- Firestore `publicSites/{weddingId}`: configuracion, secciones activas, copy, enlaces, estado, ultima publicacion.
- `weddings/{id}/website`: contenido base reutilizado (Flujo 8).
- `publicSiteAnalytics/{weddingId}` (plan) para visitas y conversiones.
- Assets en Storage (`public-sites/{weddingId}`) optimizados para CDN.

## 5. Reglas de negocio
- Solo owner/planner pueden publicar o despublicar; asistentes con permiso de lectura.
- Datos sensibles (direcciones exactas, emails) requieren confirmacion antes de exponerse.
- Formularios (RSVP, contacto) validan uso de reCAPTCHA/anti spam.
- Limite de un sitio publico por boda (multiples bodas se manejan via slug distinto).

## 6. Estados especiales y errores
- Contenido incompleto -> banner pidiendo completar datos basicos.
- Error de publicacion -> mantener version anterior y mostrar mensaje.
- Desfase entre panel y publicacion -> mostrar timestamp de ultima sincronizacion.
- Acceso sin permisos -> pagina muestra mensaje de boda privada.

## 7. Integracion con otros flujos
- Flujo 8 provee herramientas de generacion de contenido.
- Flujo 9 permite RSVPs directamente desde sitio.
- Flujo 12 gestiona notificaciones cuando se publica o actualiza.
- Flujo 21 se integra con comunicaciones (emails contienen enlace al sitio).
- Flujo 20/22 muestran resumen de actividad publica en dashboard.

## 8. Metricas y monitorizacion
- Eventos: `public_site_published`, `public_site_unpublished`, `public_site_visit`, `public_site_rsvp`.
- KPIs: visitas unicas, tasa de conversion RSVP, origen de trafico (pendiente).
- Logs de errores y latencia en CDN para diagnostico.

## 9. Pruebas recomendadas
- Unitarias: rendering de secciones, sanitizacion de contenido.
- Integracion: actualizar contenido -> publicar -> verificar en URL publica.
- E2E: crear sitio, compartir enlace, confirmar RSVP desde visitante anonimo.


## Cobertura E2E implementada
- `cypress/e2e/inspiration/inspiration-flow.cy.js y cypress/e2e/inspiration_smoke.cy.js`: validan la navegación pública de inspiración y bloques reutilizados en el sitio.
- `cypress/e2e/news/news-flow.cy.js`: cubre la sección de noticias/blog asociada al sitio público.

## 10. Checklist de despliegue
- Reglas Firestore para `publicSites`, `publicSiteAnalytics`.
- Configurar CDN/hosting estatico y invalidacion tras cada publicacion.
- Revisar cumplimiento legal (cookies, privacidad) y agregar banner si aplica.
- Preparar redireccion 404/410 para bodas archivadas.

## 11. Roadmap / pendientes
- Editor dedicado en panel con vista previa y control de secciones.
- Dominios personalizados y configuracion automatica de SSL.
- Analytics en tiempo real y panel de conversion.
- Integracion con comentarios/libro de visitas.
- Experiencia para bodas multiples (selector en header publico).
