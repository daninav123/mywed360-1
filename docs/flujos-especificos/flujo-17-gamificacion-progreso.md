# 17. Gamificacion y Progreso (estado 2025-10-07)

> Implementado: widgets iniciales en `Dashboard.jsx`, `ProgressTracker.jsx`, `useGamification` hook (beta), asignacion de puntos basicos por tareas completadas.
> Pendiente: niveles completos, logros, desafios semanales, recompensas y panel de analytics.

## 1. Objetivo y alcance
- Motivar a usuarios a completar tareas y usar modulos clave mediante mecanicas de juego.
- Visualizar progreso global de la boda y categorias principales.
- Incrementar retencion y frecuencia de uso con objetivos claros y recompensas.

## 2. Trigger y rutas
- Menú inferior → pestaña **Inicio** (`/home`, `Dashboard.jsx`) con barra de progreso y objetivos.
- Seccion dedicada `/gamificacion` (pendiente) para ver logros y retos.
- Notificaciones push/email cuando se desbloquea un logro o hay desafios nuevos.

## 3. Paso a paso UX
1. Puntos y niveles
   - Acciones otorgan puntos (crear tarea, confirmar invitado, actualizar presupuesto, publicar sitio).
   - Tabla de niveles (Novato -> Maestro Wedding) con beneficios planeados.
   - Barra de experiencia visible en dashboard y perfil.
2. Logros y retos
   - Logros por progreso (primer RSVP, 100 invitados, checklist completa) y velocidad (racha semanal).
   - Retos temporales (objetivos semanales/mensuales) con recordatorios automáticos.
   - Notificacion con animacion al desbloquear logro, opcion de compartir (pendiente).
3. Progreso de boda
   - `ProgressTracker.jsx` muestra porcentaje global y por categoria (planeacion, invitados, proveedores, presupuesto, sitio web).
   - Objetivos sugeridos segun estado actual (ej: "Confirma 10 invitados esta semana").
   - Gamificacion integra datos de tareas, finanzas, RSVP y proveedores.

## 4. Persistencia y datos
- Firestore `weddings/{id}/gamification`: puntos, nivel, progreso por categoria, rachas, ultimos retos.
- `weddings/{id}/achievements`: logros desbloqueados con metadata (fecha, origen, recompensa).
- `gamificationEvents` (collection global) para historico anonimo y analitica.
- Configuracion por usuario en `users/{uid}/gamificationSettings` (opt-in/out, notificaciones).

## 5. Reglas de negocio
- Evitar duplicidad: puntos otorgados una vez por accion idempotente (usando hashes).
- Rachas se mantienen si usuario completa objetivo diario/weekly, se reinician al fallar plazo.
- Logros especiales requieren validaciones (ej. `perfect_budget` solo si presupuesto <= planificado).
- Gamificacion respeta opt-out; sin consentimiento no se guardan datos de engagement.

## 6. Estados especiales y errores
- Si gamificacion desactivada -> mostrar mensaje y CTA para activarla.
- Datos faltantes (ej. sin tareas) -> se oculta categoria y se sugiere modulo correspondiente.
- Error al otorgar puntos -> se guarda en cola de reintentos y se muestra toast informativo.
- Cuando usuario alcanza nivel maximo -> mostrar mensaje celebratorio y roadmap de mejoras.

## 7. Integracion con otros flujos
- Flujo 14/6 actualizan progreso a partir de tareas y presupuesto.
- Flujo 3/9 suma puntos por confirmar invitados y completar RSVP.
- Flujo 5/15 otorga logros por contratos firmados y proveedores confirmados.
- Flujo 16 permite que el asistente IA sugiera metas gamificadas.
- Flujo 22 muestra resumen en panel general.

## 8. Metricas y monitorizacion
- Eventos: `gamification_points_awarded`, `achievement_unlocked`, `streak_extended`, `challenge_completed`.
- Indicadores: usuarios activos con gamificacion, puntos medios por semana, retencion vs control.
- Dashboard de producto para analizar correlacion entre gamificacion y conversion a planes de pago.

## 9. Pruebas recomendadas
- Unitarias: calculo de puntos, gestion de rachas, desbloqueo de logros.
- Integracion: accion (ej. completar tarea) -> actualiza gamificacion y notifica dashboard.
- E2E: usuario activa gamificacion, completa objetivos, desbloquea logro y recibe notificacion.

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
