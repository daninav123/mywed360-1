# 17. Gamificacion y Progreso (estado 2025-10-13)

> Reenfocado: se prioriza la capa de datos para registrar progreso sin exponer paneles visibles.
> No se mostraran tarjetas ni paneles grandes en el frontend; la informacion queda disponible solo a traves del backend y servicios internos.

## 1. Objetivo y alcance
- Registrar en backend el avance de los usuarios sobre tareas clave, hitos y logros.
- Exponer esa informacion a otros modulos (checklist, notificaciones, IA) sin crear superficies propias en UI.
- Permitir analitica y personalizacion futura usando la informacion almacenada.

## 2. Trigger y rutas
- No se agrega pantalla o ruta nueva; el flujo se activa por eventos de negocio (tareas completadas, invitados confirmados, contratos cerrados).
- El usuario final no ve paneles dedicados en `/home` ni en vistas auxiliares; cualquier consumo visual debera integrarse en componentes existentes y de forma discreta en etapas posteriores.
- Endpoints `/api/gamification/*` permanecen accesibles para lecturas y escrituras desde servicios internos o integraciones autorizadas.

## 3. Flujo tecnico
1. Servicios backend invocan `awardPoints`, `getStats`, `getAchievements` y `getEvents` para persistir, consultar y auditar el progreso.
2. El frontend no monta `GamificationPanel.jsx`; el componente queda archivado para pruebas o futuras integraciones discretas y no se incluye en `/home`.
3. Cualquier resumen mostrado en otras pantallas debe limitarse a textos breves ya existentes, sin paneles nuevos ni tarjetas prominentes.

## 4. Persistencia y datos
- Se consolida el modelo `{ points, level, progressToNext, milestonesUnlocked[] }` en colecciones backend (`gamification`, `achievements`, `gamificationEvents`).
- Las escrituras se realizan via endpoints protegidos o funciones programadas; no se cachea en el cliente.
- Los servicios internos pueden solicitar `getSummary` para alimentar otras features, pero el resultado no se renderiza directamente.

## 5. Reglas de negocio
- Opt-in, deduplicacion y reglas de elegibilidad se resuelven en backend antes de persistir registros.
- Los puntos se otorgan segun reglas de dominio (checklist, invitados, contratos) documentadas en `gamificationRules.md` (pendiente).
- Ningun cambio de estado dispara UI inmediata; se deja para futuras integraciones de notificaciones o copys discretos.

## 6. Estados especiales y errores
- Error en backend -> se registra log y se responde con mensaje generico al consumidor; no hay fallback visual para el usuario final.
- Falta de datos -> los servicios retornan objeto vacio, permitiendo a los consumidores decidir si muestran un micro indicador o nada.
- Se evita mostrar copys por defecto como "Nivel 1 / 0 puntos"; al no existir panel, el usuario final no ve placeholders.

## 7. Integracion con otros flujos
- Checklist avanzado (Flujo 14) y confirmacion de invitados (Flujo 3/9) consumen puntos desbloqueados para reglas internas.
- El asistente IA (Flujo 16) podra leer el progreso para sugerir tareas pendientes, sin mostrar panel propio.
- Dashboard y notificaciones (Flujos 20 y 22) solo tomaran contadores discretos cuando exista diseno aprobado para integrarlos en modulos ya presentes.

## 8. Metricas y monitorizacion
- Eventos instrumentados en backend: `gamification_points_awarded`, `achievement_unlocked`, `challenge_completed`.
- Dashboards de producto consumen los datos agregados sin depender de componentes visuales en la app.
- Se definen alertas para volumen anomalo de escrituras o errores de deduplicacion.

## 9. Pruebas recomendadas
- Unitarias backend sobre `awardPoints`, `getStats`, `getAchievements`, validando reglas y deduplicacion.
- Integracion de Firestore/DB: verificar permisos y estructura de colecciones.
- Contratos API: tests que aseguren que `GET /api/gamification/stats` responde con payload consistente para consumidores internos.
- No se requieren pruebas de render de paneles porque la UI permanece deshabilitada.

## Cobertura E2E implementada
- `cypress/e2e/gamification/gamification-progress-happy.cy.js`: smoke de progreso positivo (award + stats + events).
- `cypress/e2e/gamification/gamification-milestone-unlock.cy.js`: cubre lectura de logros y esquema esperado.
- `cypress/e2e/gamification/gamification-history.cy.js`: garantiza que Home no renderiza paneles ni dispara peticiones automáticas a la API.

## 10. Checklist de despliegue
- Reglas de seguridad para colecciones `gamification`, `achievements`, `gamificationEvents`.
- Limites de escritura y throttling en funciones Cloud/Firestore.
- Documentar contratos de API para consumidores internos.
- Configurar alertas y monitoreo de logs.

## 11. Roadmap / pendientes
- Disenar integraciones discretas (badges en lista de tareas, indicadores en timeline) sin recurrir a paneles grandes.
- Definir programa de recompensas intercambiables consumiendo los datos existentes.
- Preparar comunicacion a usuarios cuando exista alguna visualizacion ligera o beneficio tangible.
- Analitica avanzada y segmentacion para marketing se mantiene como trabajo futuro.

## 12. Plan de QA incremental (2025-10-13)
### Estado actual verificado
- Servicios backend disponibles para registrar y leer progreso, con autenticacion requerida.
- Feature flag por defecto desactiva cualquier panel de gamificacion en frontend.
- Datos almacenados se pueden consultar desde herramientas internas sin exponer interfaz directa al usuario.

### Experiencia minima antes de automatizar
- Configurar tests de contrato para endpoints `stats` y `achievements` usando fixtures de boda con tareas completas.
- Verificar en QA que Home y subpaginas no muestran tarjetas de gamificacion tras limpiar caches de build.
- Establecer scripts de seed para poblar logros base en entornos de prueba.

### Criterios de prueba E2E propuestos
1. `gamification-award-success`: simula evento de checklist y valida que la API incrementa correctamente los puntos.
2. `gamification-achievement-read`: consulta logros y verifica estructura sin depender de UI.
3. `gamification-event-history`: escribe un evento y confirma su registro en la coleccion `gamificationEvents` para auditoria.

### Dependencias tecnicas
- Endpoints o funciones programadas para `stats|achievements|events` accesibles desde servicios internos y QA.
- Seeds de prueba con bodas en distintos niveles de progreso para probar reglas de puntos.
- Observabilidad: tableros en DataDog/Looker con agregados de progreso y errores.


