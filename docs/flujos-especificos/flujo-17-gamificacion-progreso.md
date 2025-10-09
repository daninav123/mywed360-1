# 17. Gamificacion y Progreso (estado 2025-10-07)

> Implementado: tarjeta `GamificationPanel.jsx` en Home (`Dashboard.jsx`) y servicio `GamificationService` con endpoints `award`, `stats`, `achievements` (stub).  
> Pendiente: niveles, logros, retos semanales, recompensas y panel de analytics completo.

## 1. Objetivo y alcance
- Motivar a usuarios a completar tareas y usar modulos clave mediante mecanicas de juego.
- Visualizar progreso global de la boda y categorias principales.
- Incrementar retencion y frecuencia de uso con objetivos claros y recompensas.

## 2. Trigger y rutas
- Menú inferior → pestaña **Inicio** (`/home`, `Dashboard.jsx`) donde se renderiza `GamificationPanel`.
- No existe aún `/gamificacion`; se mantiene como roadmap.
- No hay notificaciones automáticas (requiere backend futuro).

## 3. Paso a paso UX
1. **Panel de progreso (MVP)**
   - `GamificationPanel` muestra nivel, puntos y progreso al siguiente nivel usando `getSummary`.
   - El servicio `GamificationService` devuelve datos mock/stub si no hay backend.
   - En caso de error se muestra mensaje en rojo y el panel sigue cargando Home.
2. **Futura experiencia**
   - Niveles, logros, retos y objetivos semanales están en diseño (no implementados).
   - `ProgressTracker.jsx` y avisos personalizados se activarán con datos reales.
   - Notificaciones push/email sólo se describen como roadmap.

## 4. Persistencia y datos
- No hay persistencia propia en el cliente; se depende de endpoints `/api/gamification/*` cuando existan.
- El servicio retorna `{ points, level, progressToNext }` y se guarda sólo en memoria.
- Colecciones `gamification`, `achievements` y `gamificationEvents` aún no existen en Firestore.

## 5. Reglas de negocio
- No hay reglas aplicadas en frontend: se muestra lo que devuelve el servicio.
- Opt-in/opt-out y deduplicación son parte del backend futuro.

## 6. Estados especiales y errores
- Sin datos → panel muestra 0 puntos y “Nivel 1”.
- Error API → mensaje “No se pudo obtener el progreso” (texto rojo) y se mantiene Home usable.
- No hay CTA para activar/desactivar (se añadirá cuando exista opt-in real).

## 7. Integración con otros flujos (roadmap)
- Se planea sumar puntos al completar tareas (Flujo 14), confirmar invitados (Flujo 3/9) y cerrar contratos (Flujo 5/15).
- El [Flujo 16](./flujo-16-asistente-virtual-ia.md) podría sugerir metas en el futuro.
- Actualmente el panel sólo refleja datos devueltos por `GamificationService`.

## 8. Métricas y monitorización
- No hay eventos instrumentados en frontend.
- Roadmap: `gamification_points_awarded`, `achievement_unlocked`, `challenge_completed` y dashboards de producto.

## 9. Pruebas recomendadas
- Unitarias: `GamificationService` (mocks `awardPoints`, `getStats`, `getAchievements`) y el render simple de `GamificationPanel`.
- Integración: simular `getSummary` devolviendo datos y comprobar render.
- E2E (pendiente de backend real).


## Cobertura E2E implementada
- No hay pruebas end-to-end específicas implementadas para este flujo.

## 10. Checklist de despliegue
- Reglas Firestore para `gamification`, `achievements`, `gamificationEvents`.
- Configurar limites de escritura y deduplicacion en Cloud Functions.
- Revisar copy motivacional y traducciones.
- Preparar comunicacion a usuarios sobre nuevo sistema y opciones de privacidad.

## 11. Roadmap / pendientes
- Desafios cooperativos (pareja vs planners) y recompensas canjeables.
- Tienda de recompensas virtuales (plantillas, upgrades) ligada a puntos.
- Comparativas opcionales (leaderboards privados) con controles de privacidad.
- Analitica avanzada de engagement y segmentacion.
- Integracion con programa de referidos y planes premium.
