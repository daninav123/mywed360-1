# 30. Pagina de inicio (estado 2025-10-13)

> Implementado: `src/pages/HomeUser.jsx`, `src/components/HomePage.jsx`, `Nav.jsx`, `ProviderSearchModal.jsx`, `useFinance`, servicios `fetchWeddingNews` y `fetchWall`.
> Pendiente: reemplazar datos mock/localStorage por origenes reales, unificar con `Dashboard.jsx`, instrumentar telemetria de interaccion y ocultar helpers de desarrollo en produccion.

## 1. Objetivo y alcance
- Entregar una vista de inicio accionable que resuma el estado del evento y ofrezca accesos rapidos a tareas criticas.
- Componer un escaparate de inspiracion y contenidos (galeria + blog) para mantener engagement recurrente.
- Prefetchear los modulos mas usados para reducir el tiempo hasta primer uso tras iniciar sesion.

## 2. Trigger y rutas
- Ruta protegida `/home` renderiza `src/pages/HomeUser.jsx` dentro del `MainLayout`.
- El router redirige `"/"` y rutas desconocidas a `/home` tras autenticacion (`Navigate to="/home"` en `App.jsx`).
- Tabs de navegacion (`Nav active="home"`) destacan esta pantalla cuando el usuario selecciona el icono Inicio.

## 3. Paso a paso UX
1. **Montaje y prefetch**  
   - `HomeUser.jsx` ejecuta `prefetchModule` para `UnifiedEmail`, `Proveedores` e `Invitados`.
   - `HomePage` consulta `useAuth` para personalizar saludo (nombre boda + usuario) y resolver el rol.
2. **Hero principal**  
   - Encabezado muestra mensaje "Bienvenidos" junto al nombre de la boda.
   - Muestra el logotipo cargado desde `logo-app.png` (assets públicos).
3. **Progreso**  
   - Card `Progress` consulta `GamificationService.getSummary` (puntos totales de la boda) y traduce el resultado a un porcentaje 0-100 (`mywed360_progress`) que se guarda como snapshot en `localStorage`.
   - La barra se colorea según el desfase respecto al plan temporal de la boda (adelantado -> verde, en ritmo -> ámbar, por detrás -> rojo) y muestra el porcentaje esperado para la fecha actual.
4. **Acciones rapidas**  
   - Tarjetas clicables abren modales para buscar proveedor, anadir invitado, registrar movimiento o crear nota.
   - Cada modal ejecuta la accion principal sin abandonar la Home (crea proveedor en el buscador, inserta invitado, registra movimiento o guarda nota).
   - Cada modal incluye un boton secundario que redirige al modulo completo correspondiente (`/proveedores`, `/invitados`, `/finance`, `/ideas`) para continuar la gestion desde la pagina dedicada.
   - Persisten en `localStorage` (`lovendaProviders` via modal, `mywed360Guests`, `quickMovements`, `lovendaNotes`).
5. **Metricas clave**  
   - Cuatro cards resumen invitados confirmados, gasto vs presupuesto, proveedores contratados y tareas completadas (o asignadas para planners).
   - Datos combinan `useFinance().stats`, arrays guardados en `localStorage` (`lovendaProviders`, `tasksCompleted`, `mywed360Meetings`, `lovendaLongTasks`) y calculos memorizados.
6. **Inspiracion**  
   - Carrusel horizontal precargado via `fetchWall(page=1, tag)` para ocho categorias (decoracion, banquete, etc.), enlaza a `/inspiracion?tag=...`.
   - Al hacer click en cada tarjeta se navega a la pagina de inspiracion con el query `tag` seleccionado, activando el filtro correspondiente dentro de la vista de inspiracion.
   - Botones de flecha desplazan el carrusel mediante `scrollBy`.
7. **Blog**  
   - Se consulta `fetchWeddingNews(page, pageSize, lang)` con heuristica que filtra imagenes de portada y limita una noticia por dominio.
   - La seccion debe renderizar exactamente cuatro noticias y todas deben tener imagen valida; se itera sobre paginas sucesivas hasta conseguir cuatro resultados cumpliendo los filtros.
   - El texto mostrado respeta `i18n.language`; si el backend solo devuelve resultados en ingles, se traducen en segundo plano antes de pintar la tarjeta.
   - Si no se alcanzan cuatro noticias que cumplan los criterios (imagen + idioma + dominio unico), se oculta el grid y se muestra aviso informando que no hay suficiente contenido disponible.
   - Las tarjetas abren la noticia en nueva pestana y muestran fuente derivada del dominio, siempre garantizando que cada fuente sea distinta.
   - En entorno local se puede forzar mock con `VITE_BLOG_FORCE_MOCK=1` o `?blogMock=1` para probar el layout con cuatro tarjetas mientras se ajusta el feed real.
8. **Navegacion inferior**  
   - `Nav` permanece anclado bottom con `active="home"`.
9. **Fallback planner/assistant vs owner**  
   - Si `useAuth().hasRole('planner')` o el rol es `assistant`, `HomePage` retorna `PlannerDashboard` (flujo 28) en lugar de la vista consumer.
   - Owners (`particular`, `owner`) mantienen la vista principal descrita en este flujo; futuras iteraciones podrian introducir widgets diferenciados para owners avanzados si se requiere.
10. **Boton de rehacer tutorial**  
   - Boton flotante (visible siempre hoy) ejecuta `localStorage.clear()`, setea `forceOnboarding` y recarga la pagina.

## 4. Persistencia y datos
- `localStorage`
  - `mywed360_active_wedding_name`, `mywed360_progress` (snapshot de Gamificación + cálculo temporal): saludo y progreso.
  - `mywed360Guests`: lista de invitados; cada modal de invitado incorpora registros con `id` (timestamp).
  - `lovendaProviders`: proveedores contratados; usado para conteo.
  - `tasksCompleted`, `mywed360Meetings`, `lovendaLongTasks`: fuentes para tareas totales/completadas.
  - `quickMovements`: movimientos financieros rapidos (solo local).
  - `lovendaNotes`: notas rapidas.
- Servicios remotos
  - `fetchWall(page, query)` (Flujo 24) trae imagenes destacadas desde backend/Firestore.
  - `fetchWeddingNews(page, pageSize, lang)` (Flujo 26) consulta agregador de noticias; respeta idioma detectado via `i18n`.
  - `getSummary` (Gamificación, Flujo 17) expone `totalPoints`/`level` para convertirlos en porcentaje de progreso visible en Home.
- Contextos/Hooks
  - `useAuth` expone `userProfile`, `currentUser`, `hasRole`.
  - `useFinance` aporta `stats.totalSpent`, `stats.totalBudget` y estado bancario (solo lectura en Home).

## 5. Reglas de negocio
- Planner (`role === 'planner'`) y asistentes ven `PlannerDashboard`; owners usan la Home consumer actual.
- Acciones rapidas escriben en `localStorage` pero no sincronizan con backend; se considera funcionalidad de prototipo y deben ejecutarse dentro de la Home sin navegar hasta que el usuario pulse el boton de redireccion explicito.
- Carrusel de inspiracion oculta categorias sin imagen disponible.
- Blog limita 1 noticia por dominio, 4 totales, requiere imagen valida HTTP y repite la solicitud hasta reunir cuatro resultados que cumplan el criterio.
- Boton de rehacer tutorial debe quedar oculto en produccion (`TODO`: condicionar a flag build/dev).

## 6. Estados especiales y errores
- Sin datos en `localStorage` -> cards muestran 0 / placeholders; no hay modos vacios personalizados.
- Falla en `fetchWall` -> se deja carrusel vacio y se loguea error en consola (sin UI fallback).
- Falla en `fetchWeddingNews` -> se permiten hasta 3 errores consecutivos; si no hay resultados suficientes para llenar los cuatro slots se muestra aviso y se oculta el grid hasta nuevo intento.
- Modal proveedor depende de `ProviderSearchModal`: errores se comunican mediante el propio modal (fuera del alcance actual).
- Tras `Rehacer tutorial`, la pagina se recarga para disparar onboarding (Flujo 2).

## 7. Integracion con otros flujos
- **Flujo 2 / 2B**: al limpiar almacenamiento se reinicia onboarding de creacion de boda.
- **Flujo 3 y 4**: contadores de invitados dependen de estructuras compatibles con modulos RSVP y seating (cuando se sincronicen).
- **Flujo 5 y 6**: metrica de proveedores y finanzas reutiliza datos compartidos con timeline y presupuesto.
- **Flujo 24**: carrusel reutiliza las mismas categorias/tags de inspiracion.
- **Flujo 26**: tarjetas de blog apuntan al mismo listado `/blog`.
- **Flujo 22/28**: `Nav` inferior y `PlannerDashboard` comparten patrones de navegacion y widgets.

## 8. Metricas y monitorizacion
- No existe instrumentacion especifica; recomendado emitir eventos:
  - `home_quick_action_opened` (`action=proveedor|invitado|movimiento|nota`).
  - `home_inspiration_click` (`category`, `position`).
  - `home_blog_card_opened` (`source`, `lang`).
  - `home_progress_viewed` (`progressPercent`).
- Vigilar tasas de error de `fetchWeddingNews` y latencia de `fetchWall`.

## 9. Pruebas recomendadas
- Unitarias: memos de metricas (invitados/tareas/proveedores) con datos incompletos; rendering condicional planner vs consumer; handlers de scroll de inspiracion.
- Integracion: abrir cada modal y validar escritura en `localStorage` mockeado; verificar que `useFinance` alimente las cards.
- E2E:
  1. `home-quick-actions`: visitar `/home`, abrir modales secuenciales, crear registros, verificar que permanecen en la Home y que el boton de redireccion apunta al modulo correcto; comprobar persistencia tras recarga.
  2. `home-inspiration-carousel`: stub `fetchWall`, validar render de 8 categorias, desplazamiento y navegacion a `/inspiracion`.
  3. `home-blog-cards`: stub `fetchWeddingNews`, asegurar limite 4, filtro por dominio, presencia de imagen en cada item y apertura en nueva pestana (usar `cy.window().its('open')`).

## Cobertura E2E implementada
- `cypress/e2e/home/home-greeting-names.cy.js`: smoke de la home (saludos personalizados, quick actions y persistencia local).

## 10. Checklist de despliegue
- Envolver boton "Rehacer tutorial" tras feature flag (`VITE_ENABLE_DEV_TOOLS` o similar).
- Confirmar traducciones `i18n` para textos nuevos (progress, acciones, cards).
- Asegurar que `fetchWeddingNews` y `fetchWall` cuenten con mocks en ambientes de prueba.
- Verificar estilos CSS variables (`--color-*`) en temas claro/oscuro.

## 11. Roadmap / pendientes
- Reemplazar fuentes `localStorage` por datos sincronizados (Firestore/REST) y estados compartidos via contextos.
- Unificar Home con `Dashboard.jsx` (Flujo 22) y permitir configuracion de widgets.
- Anadir resumen de actividad reciente y proximos hitos (tareas, pagos, invitados).
- Implementar buscador global accesible (atajo Cmd/Ctrl+K) y recomendaciones IA.

## 12. Plan de QA incremental (2025-10-13)
### Estado actual verificado
- `HomePage.jsx` depende de datos en `localStorage`; al limpiar caches muchos widgets quedan en cero sin explicar al usuario.
- Carrusel de inspiracion se renderiza aun en conexiones lentas pero no muestra skeletons; errores solo se registran en consola.
- `fetchWeddingNews` se ejecuta contra backend real y puede tardar; no hay fallback offline.
- Boton "Rehacer tutorial" siempre visible (riesgo en produccion).

### Experiencia minima a construir
- Conectar contadores a fuentes reales (Firestore) y mostrar placeholders descriptivos.
- Anadir skeleton/loading states para carrusel y blog.
- Condicionar boton de rehacer tutorial a flag de entorno.
- Implementar metricas de interaccion y envio a analytics.

### Dependencias tecnicas
- API consolidada para invitados, tareas y proveedores (Flujos 3,4,5).
- Endpoints cacheados o CDN para `fetchWeddingNews`/`fetchWall`.
- Feature flag centralizado (`useFeatureFlags`) para UI experimental.
