# 26. Blog de Tendencias (estado 2025-10-12)

> Implementado (codigo 2025-10-08):
> - Seccion `Blog` dentro de `HomePage.jsx`, visible solo en la landing principal.
> - Servicio `fetchWeddingNews` en `blogService.js` que consulta un agregador RSS propio (feeds de bodas, magazines, portales de proveedores) y aplica fallback a NewsAPI si falla.
> - Pipeline de curacion: normalizacion por idioma, filtrado de palabras clave, descarte de fuentes repetidas, traduccion automatica y validacion de imagenes de portada.
> - Render en tarjetas `Card`: imagen, titulo, descripcion, fuente y apertura en nueva pestaña (`window.open`), sin afectar la navegacion de la app.

> Pendiente o incompleto:
> - Landing dedicada (`/blog`) que amplie el listado mas alla de las 4 piezas destacadas y permita paginacion.
> - Curacion manual/destacados por temporada o ubicacion especifica (editorial humana).
> - Medicion de engagement (click-through, dwell) y recomendaciones personalizadas por rol/etapa.

Este flujo cubre la experiencia de noticias/tendencias que aparece en la home y acerca articulos externos utiles para organizar una boda.

## 1. Objetivo y alcance
- Mostrar hasta 4 articulos recientes y accionables sobre bodas (tendencias, consejos, proveedores, lugares, testimonios inspiradores).
- Mantener variedad de fuentes (maximo 1 por dominio), destacar solo piezas con imagen de portada util y evitar contenido de relleno o duplicado.
- Ofrecer acceso rapido a contenido editorial desde la home sin abandonar la aplicacion principal ni mezclarlo con el blog interno colaborativo.

## 2. Trigger y rutas
- Ubicacion fija en `HomePage.jsx`, debajo del carrusel de inspiracion.
- CTA con texto `Blog`; al hacer clic en una tarjeta se abre la URL externa en una nueva pestaña (`window.open`).
- Actualmente no existe navegacion adicional (`/blog` solo muestra el mismo bloque si se enlaza manualmente).

## 3. Paso a paso UX
1. **Carga inicial**
   - `HomePage` ejecuta `fetchWeddingNews` en un `useEffect` dependiente del idioma activo (`i18n`) justo despues de montar.
   - El servicio solicita pagina 1 del agregador con `pageSize=10`, acumula resultados y los va filtrando en memoria hasta reunir 4 validos.
   - Se valida que cada post tenga:
     - URL accesible (`http/https`).
     - Imagen con extension aceptada (no SVG) y host distinto a la lista bloqueada (`news.google.com`, `gstatic.com`, `googleusercontent.com`, placeholders comunes).
     - Contenido relevante segun patrones (ver pipeline).
   - Se reinicia el proceso si la API responde vacia hasta llegar al maximo de 20 paginas o 3 errores consecutivos.
2. **Render de tarjetas**
   - Usa componente `Card` con imagen (`ExternalImage`), titulo, descripcion resumida y fuente.
   - Cuando `visualMode` esta activo exige resolucion minima mas alta (`minWidth/minHeight`).
   - No muestra placeholders: si no hay imagen adecuada, el item se omite.
3. **Interaccion**
   - Click abre la noticia en nueva pestaña manteniendo la home intacta.
   - Boton `Blog` (Link) se reserva para futuras ampliaciones; hoy redirige a la misma seccion.

## 3.1 Pipeline de curacion de contenido
1. **Agregador RSS backend**
   - Backend (`/api/wedding-news`) consulta feeds RSS/Atom de: magazines de bodas, blogs de planners, portales de venues, medios de lifestyle.
   - Devuelve posts normalizados `{id, title, description, url, image, source, published, feedSource}`.
   - Respeta parametros de paginado (`page`, `pageSize`) y idioma si el feed lo soporta.
2. **Normalizacion de idioma**
   - `normalizeLang` reduce el codigo a ISO 639-1 (ej. `es`, `en`).
   - Si el idioma del usuario no es ingles, `translateText` traduce `title` y `description` de manera asincrona (sin bloquear el resto de la app).
3. **Filtrado de contenido**
   - Se construyen expresiones (`WEDDING_PATTERNS`, `DESIGN_PATTERNS`, `PLANNING_PATTERNS`) con palabras clave de bodas, decoracion y planificacion.
   - Cada post se puntua (`valueScore`) segun coincidencias; se descartan entradas sin contexto de bodas o clasificadas como:
     - `HARD_NEGATIVE_PATTERNS`: tragedias, accidentes, conflictos.
     - `GOSSIP_PATTERNS`: farandula, rumores, divorcios sin valor inspiracional.
   - Al usar NewsAPI (fallback) se aplica la misma heuristica para evitar ruido.
4. **Validacion de imagen**
   - `hasHttpImage` comprueba que `image` sea URL absoluta HTTP(s).
   - `isLikelyCover` analiza host y path para eliminar logotipos, sprites, placeholders y se asegura de que no sea SVG.
   - Si `visualMode` esta activo, se exige resolucion mayor (`minWidth 900`, `minHeight 500`) para un layout mas visual.
5. **Control de diversidad**
   - `PER_DOMAIN_LIMIT = 1` impide que un mismo dominio aparezca mas de una vez en la seccion.
   - Se evita duplicar URLs exactas.
6. **Manejo de errores**
   - Se cuentan errores consecutivos; tras 3 fallos con resultados parciales se corta el loop y se renderiza lo disponible.
   - Si todas las fuentes fallan y hay `VITE_NEWSAPI_KEY`, se reintenta con NewsAPI; de lo contrario se devuelve lista vacia.

## 4. Persistencia y datos
- `blogService.js` consulta primero el agregador backend (`/api/wedding-news`) con paginado y filtrado por idioma.
- Si el backend falla o responde vacio y hay `VITE_NEWSAPI_KEY`, emplea NewsAPI y aplica filtros semanticos.
- Traduce titulo y descripcion a la lengua del usuario mediante `translateText`.
- No se almacena estado persistente; la lista vive en memoria de la home y se refresca por sesion.

## 5. Reglas de negocio
- Solo se muestran posts con imagen de portada valida (`isLikelyCover`), host permitido y URL publica.
- Se impone un dominio por tarjeta; si un feed genera multiples notas relevantes, se prioriza la primera por fecha (`published`).
- Se descartan noticias negativas y prensa rosa mediante patrones `HARD_NEGATIVE_PATTERNS` y `GOSSIP_PATTERNS`; se priorizan las que superan `valueScore > 0`.
- El idioma se mantiene consistente con la configuracion de la app; sin fallback a ingles, aunque la API lo devuelva.
- Los resultados se ordenan por relevancia (score) y luego por orden de llegada dentro de la pagina consultada.

## 6. Estados especiales y errores
- Errores consecutivos en el fetch: se limita a 3 reintentos y se conserva lo ya obtenido.
- Si no hay resultados validos se oculta el grid (no se muestran placeholders).
- Los errores se registran en consola (`console.error`/`console.warn`), sin UI especifica aun.

## 7. Integracion con otros flujos
- Complementa la inspiracion visual (Flujo 24) ofreciendo contenido editorial relacionado.
- Puede alimentar comunicaciones externas (Sitio publico, newsletters) reutilizando `fetchWeddingNews`.
- Planner Dashboard muestra enlaces destacados pero sigue consumiendo la misma API.

## 8. Metricas y monitorizacion
- Eventos sugeridos: `home_blog_loaded`, `home_blog_card_clicked`, `home_blog_visual_mode_toggle`.
- KPIs: CTR por articulo, ratio de usuarios con noticias cargadas, diversidad de dominios, latencia media del agregador.
- Pendiente instrumentar alertas cuando el backend RSS falle o NewsAPI alcance limites.

## 9. Pruebas recomendadas
- Unitarias: filtros de `blogService` (patrones, dominio unico, validacion de imagen).
- Integracion: mockear backend con variedad de fuentes e idiomas, verificar traducciones.
- E2E: `cypress/e2e/news/news-flow.cy.js` (carga en home, scroll y aperturas).
- Resiliencia: simular backend caido y asegurar que el UI se mantiene estable.

## 10. Checklist de despliegue
- Verificar disponibilidad del agregador RSS (`/api/wedding-news`) y claves NewsAPI (opcional).
- Configurar cuotas de traduccion (`translateText`) y monitorear tiempo de respuesta.
- Revisar copy/traducciones en `i18n` para el encabezado `Blog`.
- Validar politica de CORS/Referrer de imagenes externas para evitar bloqueos.

## 11. Roadmap / pendientes
- Pagina dedicada con archivo historico y categorias filtrables.
- Favoritos o lectura posterior sincronizados con el usuario.
- Personalizacion segun ubicacion o etapa de la boda.
- Notificaciones cuando haya nuevas tendencias relevantes.
- Integracion con proveedores asociados para destacar articulos patrocinados (pendiente definir criterios).

## 12. Resumen operativo de brechas detectadas
- **Cobertura limitada**: solo 4 articulos visibles; faltan controles para explorar mas.
- **Observabilidad**: sin eventos ni dashboards implementados.
- **Fallback visual**: ausencia de placeholders cuando no hay imagen.
- **Personalizacion**: mismo feed para todos los usuarios; sin ajustes por rol ni preferencias.

## 13. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- No existe página dedicada `/blog`; la sección vive exclusivamente en `HomePage.jsx`.
- El CTA "Blog" no navega a otro módulo; se limita a un anchor dentro de la misma página.
- Las tarjetas dependen de respuestas reales del agregador RSS/NewsAPI; sin mocks, los resultados son variables e inestables para tests.
- No hay formulario de suscripción ni galería/CTA hacia proveedores desde la home.

### Experiencia mínima a construir
- Implementar ruta `/blog` con listado paginado reutilizando `fetchWeddingNews` y filtros laterales (categoría/etiqueta).
- Crear componente `BlogArticle` (detalle) que acepte slug y muestre galería + CTA a proveedores.
- Añadir formulario de suscripción (email) con validación básica y confirmación visual.
- Exponer `data-testid` en tarjetas (`blog-card`), botones de paginación (`blog-next-page`) y formulario (`blog-subscribe-form`).

### Criterios de prueba E2E propuestos
1. `blog-listing`: interceptar `GET /api/wedding-news?page=1`, visitar `/blog`, verificar render de 4 tarjetas iniciales y funcionamiento de filtros/paginación.
2. `blog-article`: desde el listado, abrir un artículo (`/blog/:slug`), comprobar título, cuerpo, galería y botón "Contactar proveedor".
3. `blog-subscription`: completar email válido, enviar formulario y esperar mensaje "Suscripción confirmada"; intentar email inválido y validar error.

### Dependencias técnicas
- Rutas frontend nuevas (`/blog`, `/blog/:slug`) con lazy loading y datos mock (pueden apoyarse en archivos JSON en `cypress/fixtures/blog`).
- Endpoint backend o mock local para `/api/wedding-news` filtrado por categoría (ampliar servicio actual).
- Servicio `subscribeToBlog` (POST) que se pueda stubear en Cypress para validar confirmaciones sin enviar correos reales.
