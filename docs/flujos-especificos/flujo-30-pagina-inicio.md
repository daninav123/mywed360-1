# 30. Página de inicio (estado 2025-10-13)

> Implementado: `src/pages/HomeUser.jsx`, `src/components/HomePage.jsx`, `Nav.jsx`, `ProviderSearchModal.jsx`, `useFinance`, servicios en `src/services/blogService.js` y `src/services/wallService.js`.
> Pendiente: reemplazar datos mock/localStorage por orígenes reales, unificar con `Dashboard.jsx`, instrumentar telemetría de interacción y ocultar helpers de desarrollo en producción.

## 1. Objetivo y alcance
- Entregar una vista de inicio accionable que resuma el estado del evento y ofrezca accesos rápidos a tareas críticas.
- Componer un escaparate de inspiración y contenidos (galería + blog) para mantener engagement recurrente.
- Prefetchear los módulos más usados para reducir el tiempo hasta primer uso tras iniciar sesión.

## 2. Trigger y rutas
- Ruta protegida `/home` renderiza `src/pages/HomeUser.jsx` dentro del `MainLayout`.
- El router redirige `"/"` y rutas desconocidas a `/home` tras autenticación (`Navigate to="/home"` en `App.jsx`).
- Tabs de navegación (`Nav active="home"`) destacan esta pantalla cuando el usuario selecciona el icono Inicio.

## 3. Paso a paso UX
1. **Montaje y prefetch**  
   - `HomeUser.jsx` ejecuta `prefetchModule` para `UnifiedEmail`, `Proveedores` e `Invitados`.
   - `HomePage` consulta `useAuth` para personalizar saludo (nombre boda + usuario) y resolver el rol.
2. **Hero principal**  
   - Encabezado muestra mensaje "Bienvenidos" junto al nombre de la boda.
   - Muestra el logotipo cargado desde `maloveapp-logo.png` (assets públicos).
3. **Progreso**  
   - Card `Progress` consulta `GamificationService.getSummary` (puntos totales de la boda) y traduce el resultado a un porcentaje 0-100 (`maloveapp_progress`) que se guarda como snapshot en `localStorage`.
   - La barra se colorea según el desfase respecto al plan temporal de la boda (adelantado -> verde, en ritmo -> ámbar, por detrás -> rojo) y muestra el porcentaje esperado para la fecha actual.
4. **Acciones rápidas**  
   - Tarjetas clicables abren modales para buscar proveedor, añadir invitado, registrar movimiento o crear nota.
   - Cada modal ejecuta la acción principal sin abandonar la Home (crea proveedor en el buscador, inserta invitado, registra movimiento o guarda nota).
   - Cada modal incluye un botón secundario que redirige al módulo completo correspondiente (`/proveedores`, `/invitados`, `/finance`, `/ideas`) para continuar la gestión desde la página dedicada.
   - Persisten en `localStorage` (`lovendaProviders` vía modal, `MaLove.AppGuests`, `quickMovements`, `lovendaNotes`).
5. **Métricas clave**  
   - Cuatro cards resumen invitados confirmados, gasto vs presupuesto, proveedores contratados y tareas completadas (o asignadas para planners).
   - Datos combinan `useFinance().stats`, arrays guardados en `localStorage` (`lovendaProviders`, `tasksCompleted`, `MaLove.AppMeetings`, `lovendaLongTasks`) y calculos memorizados.
6. **Inspiración**  
   - Carrusel horizontal precargado vía `fetchWall(page=1, tag)` para ocho categorías (decoración, banquete, etc.), enlaza a `/inspiracion?tag=...`.
   - Al hacer click en cada tarjeta se navega a la página de inspiración con el query `tag` seleccionado, activando el filtro correspondiente dentro de la vista de inspiración.
   - Botones de flecha desplazan el carrusel mediante `scrollBy`.
7. **Blog**  
   - Se consulta `fetchWeddingNews(page, pageSize, lang)` con heurística que filtra imágenes de portada y limita una noticia por dominio.
   - La sección debe renderizar exactamente cuatro noticias y todas deben tener imagen válida; se itera sobre páginas sucesivas hasta conseguir cuatro resultados cumpliendo los filtros.
   - El texto mostrado respeta `i18n.language`; si el backend solo devuelve resultados en inglés, se traducen en segundo plano antes de pintar la tarjeta.
   - Si no se alcanzan cuatro noticias que cumplan los criterios (imagen + idioma + dominio único), se oculta el grid y se muestra aviso informando que no hay suficiente contenido disponible.
   - Las tarjetas abren la noticia en nueva pestaña y muestran fuente derivada del dominio, siempre garantizando que cada fuente sea distinta.
   - En entorno local se puede forzar mock con `VITE_BLOG_FORCE_MOCK=1` o `?blogMock=1` para probar el layout con cuatro tarjetas mientras se ajusta el feed real.
8. **Navegación inferior**  
   - `Nav` permanece anclado bottom con `active="home"`.
9. **Fallback planner/assistant vs owner**  
   - Si `useAuth().hasRole('planner')` o el rol es `assistant`, `HomePage` retorna `PlannerDashboard` (flujo 28) en lugar de la vista consumer.
   - Owners (`particular`, `owner`) mantienen la vista principal descrita en este flujo; futuras iteraciones podrían introducir widgets diferenciados para owners avanzados si se requiere.
10. **Botón de rehacer tutorial**  
   - Botón flotante (visible siempre hoy) ejecuta `localStorage.clear()`, setea `forceOnboarding` y recarga la página.

## 4. Persistencia y datos
- `localStorage`
  - `maloveapp_active_wedding_name`, `maloveapp_progress` (snapshot de Gamificación + cálculo temporal): saludo y progreso.
  - `MaLove.AppGuests`: lista de invitados; cada modal de invitado incorpora registros con `id` (timestamp).
  - `lovendaProviders`: proveedores contratados; usado para conteo.
  - `tasksCompleted`, `MaLove.AppMeetings`, `lovendaLongTasks`: fuentes para tareas totales/completadas.
  - `quickMovements`: movimientos financieros rápidos (solo local).
  - `lovendaNotes`: notas rápidas.
- Servicios remotos
  - `fetchWall(page, query)` (Flujo 24) trae imágenes destacadas desde backend/Firestore.
  - `fetchWeddingNews(page, pageSize, lang)` (Flujo 26) consulta agregador de noticias; respeta idioma detectado vía `i18n`.
  - `getSummary` (Gamificación, Flujo 17) expone `totalPoints`/`level` para convertirlos en porcentaje de progreso visible en Home.
- Contextos/Hooks
  - `useAuth` expone `userProfile`, `currentUser`, `hasRole`.
  - `useFinance` aporta `stats.totalSpent`, `stats.totalBudget` y estado bancario (solo lectura en Home).

## 5. Reglas de negocio
- Planner (`role === 'planner'`) y asistentes ven `PlannerDashboard`; owners usan la Home consumer actual.
- Acciones rápidas escriben en `localStorage` pero no sincronizan con backend; se considera funcionalidad de prototipo y deben ejecutarse dentro de la Home sin navegar hasta que el usuario pulse el botón de redirección explícito.
- Carrusel de inspiración oculta categorías sin imagen disponible.
- Blog limita 1 noticia por dominio, 4 totales, requiere imagen válida HTTP y repite la solicitud hasta reunir cuatro resultados que cumplan el criterio.
- Botón de rehacer tutorial debe quedar oculto en producción (`TODO`: condicionar a flag build/dev).

## 6. Estados especiales y errores
- Sin datos en `localStorage` -> cards muestran 0 / placeholders; no hay modos vacíos personalizados.
- Falla en `fetchWall` -> se deja carrusel vacío y se loguea error en consola (sin UI fallback).
- Falla en `fetchWeddingNews` -> se permiten hasta 3 errores consecutivos; si no hay resultados suficientes para llenar los cuatro slots se muestra aviso y se oculta el grid hasta nuevo intento.
- Modal proveedor depende de `ProviderSearchModal`: errores se comunican mediante el propio modal (fuera del alcance actual).
- Tras `Rehacer tutorial`, la página se recarga para disparar onboarding (Flujo 2).

## 7. Integración con otros flujos
- **Flujo 2 / 2B**: al limpiar almacenamiento se reinicia onboarding de creación de boda.
- **Flujo 3 y 4**: contadores de invitados dependen de estructuras compatibles con módulos RSVP y seating (cuando se sincronicen).
- **Flujo 5 y 6**: métrica de proveedores y finanzas reutiliza datos compartidos con timeline y presupuesto.
- **Flujo 24**: carrusel reutiliza las mismas categorías/tags de inspiración.
- **Flujo 26**: tarjetas de blog apuntan al mismo listado `/blog`.
- **Flujo 22/28**: `Nav` inferior y `PlannerDashboard` comparten patrones de navegación y widgets.

## 8. Métricas y monitorización
- No existe instrumentación específica; recomendado emitir eventos:
  - `home_quick_action_opened` (`action=proveedor|invitado|movimiento|nota`).
  - `home_inspiration_click` (`category`, `position`).
  - `home_blog_card_opened` (`source`, `lang`).
  - `home_progress_viewed` (`progressPercent`).
- Vigilar tasas de error de `fetchWeddingNews` y latencia de `fetchWall`.

## 9. Pruebas recomendadas
- Unitarias: memos de métricas (invitados/tareas/proveedores) con datos incompletos; rendering condicional planner vs consumer; handlers de scroll de inspiración.
- Integración: abrir cada modal y validar escritura en `localStorage` mockeado; verificar que `useFinance` alimente las cards.
- E2E:
  1. `home-quick-actions`: visitar `/home`, abrir modales secuenciales, crear registros, verificar que permanecen en la Home y que el botón de redirección apunta al módulo correcto; comprobar persistencia tras recarga.
  2. `home-inspiration-carousel`: stub `fetchWall`, validar render de 8 categorías, desplazamiento y navegación a `/inspiracion`.
  3. `home-blog-cards`: stub `fetchWeddingNews`, asegurar límite 4, filtro por dominio, presencia de imagen en cada item y apertura en nueva pestaña (usar `cy.window().its('open')`).

## Cobertura E2E implementada
- `cypress/e2e/home/home-greeting-names.cy.js`: smoke de la home (saludos personalizados, quick actions y persistencia local).

## 10. Checklist de despliegue
- Envolver botón "Rehacer tutorial" tras feature flag (`VITE_ENABLE_DEV_TOOLS` o similar).
- Confirmar traducciones `i18n` para textos nuevos (progress, acciones, cards).
- Asegurar que `fetchWeddingNews` y `fetchWall` cuenten con mocks en ambientes de prueba.
- Verificar estilos CSS variables (`--color-*`) en temas claro/oscuro.

## 11. Roadmap / pendientes
- Reemplazar fuentes `localStorage` por datos sincronizados (Firestore/REST) y estados compartidos vía contextos.
- Unificar Home con `Dashboard.jsx` (Flujo 22) y permitir configuración de widgets.
- Añadir resumen de actividad reciente y próximos hitos (tareas, pagos, invitados).
- Implementar buscador global accesible (atajo Cmd/Ctrl+K) y recomendaciones IA.

## 12. Plan de QA incremental (2025-10-13)
### Estado actual verificado
- `HomePage.jsx` depende de datos en `localStorage`; al limpiar caches muchos widgets quedan en cero sin explicar al usuario.
- Carrusel de inspiración se renderiza aún en conexiones lentas pero no muestra skeletons; errores solo se registran en consola.
- `fetchWeddingNews` se ejecuta contra backend real y puede tardar; no hay fallback offline.
- Botón "Rehacer tutorial" siempre visible (riesgo en producción).

### Experiencia mínima a construir
- Conectar contadores a fuentes reales (Firestore) y mostrar placeholders descriptivos.
- Añadir skeleton/loading states para carrusel y blog.
- Condicionar botón de rehacer tutorial a flag de entorno.
- Implementar métricas de interacción y envío a analytics.

### Dependencias técnicas
- API consolidada para invitados, tareas y proveedores (Flujos 3,4,5).
- Endpoints cacheados o CDN para `fetchWeddingNews`/`fetchWall`.
- Feature flag centralizado (`useFeatureFlags`) para UI experimental.
