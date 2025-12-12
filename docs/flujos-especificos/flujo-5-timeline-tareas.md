# 5b. Timeline y Tareas (estado 2025-10-07)

> Implementado: `Tasks.jsx`, `TaskSidePanel.jsx`, `Checklist.jsx`, `SmartChecklist.jsx`, `TaskList.jsx`, `EventsCalendar.jsx`, `LongTermTasksGantt.jsx`, `CalendarSync.jsx`, `TaskEventBridge.jsx`, `TaskNotificationWatcher.jsx`, hook `useWeddingTasksHierarchy.js`, utilidades `taskAutomations`, `CalendarComponents.jsx`, plantilla `src/data/tasks/masterTimelineTemplate.json`, indicadores de riesgo en el Gantt y comentarios colaborativos con menciones y notificaciones en `TaskSidePanel.jsx`.
> Pendiente: Motor IA que personaliza un plan de tareas padre/subtareas a partir de una plantilla maestra y matriz de responsabilidades.

## 1. Objetivo y alcance
- Planificar tareas de toda la boda con vistas lista, calendario y Gantt (la vista kanban legacy se deprecó tras el refactor 2025-10).
- Automatizar recordatorios, dependencias y tareas derivadas de otros módulos.
- Sincronizar recordatorios con calendarios externos vía feeds iCal.

## 2. Trigger y rutas
- Menú inferior → pestaña **Tareas** (`/tasks`, alias legacy `/tareas` cuando se habilite i18n de rutas) con acceso a la checklist (`/checklist`) desde el mismo módulo.
- Vista calendario en `/tasks/calendar` (cuando está habilitada) y Gantt enlazado desde el panel superior.
- Widgets en Home, Invitados, Proveedores y Finanzas disparan creación rápida de tareas contextuales.

## 3. Paso a paso UX
1. Configuración inicial
   - `SmartChecklist` propone plantillas según tipo de boda, estado y temporada.
   - El usuario ajusta categorías, prioridades, fechas relativas y responsables. Categorías base: `FUNDAMENTOS`, `PROVEEDORES`, `VESTUARIO`, `DETALLES`, `LOGISTICA`, `EVENTOS`, `BELLEZA`, `ANILLOS`, `VIAJE`, `POST_EVENTO`.
2. Gestión diaria
   - `TasksRefactored` muestra la lista principal (`TaskList`) agrupada por estado con filtros persistentes (categoría, responsable, rango de fechas) y buscador.
   - Acciones rápidas por tarjeta: checkbox de completar (bloqueada si hay dependencias), botón `+` para subtareas, menú `…` con `Mover a`, `Asignar`, `Duplicar`, `Convertir en evento`, `Eliminar`, además de chips clicables de responsable/categoría.
   - Barra superior del módulo: `Nueva tarea`, `Aplicar plantilla`, `Ver calendario`, `Ver Gantt`. `Nueva tarea` abre modal compacto (título, fecha, responsable) preseleccionando la categoría activa.
   - `TaskSidePanel` reúne resumen, subtareas, historial, adjuntos y comentarios con menciones (`@usuario`); acciones principales: `Marcar completada`, `Renombrar`, `Asignar`, `Añadir comentario`, `Crear subtarea`, `Adjuntar archivo`.
3. Calendario y automatización
   - `EventsCalendar` y `LongTermTasksGantt` permiten arrastrar y editar fechas.
   - `CalendarSync` genera enlace iCal para Google/Apple/Outlook.
   - `TaskEventBridge` y `TaskNotificationWatcher` sincronizan con otros módulos y automatizaciones (ver más adelante).
   - Gantt global:
     - Cada tarea padre aparece una sola vez; segmentos representan periodos activos cuando existen huecos amplios.
     - Progreso y riesgo se calculan por tarea padre y se reflejan en toda la fila.
     - Layout: cabecera doble (año/mes), columna izquierda fija (220px) con árbol interactivo, leyenda y toggle “Mostrar subtareas” en cabecera.
     - Rango visible: `[weddingDate - 12 meses, weddingDate + 1 mes]`. En resoluciones 1366/1440 px no requiere scroll; si hay overflow se muestran fades laterales.
     - Línea “Hoy” azul (#1E88E5); hito boda línea roja (#F44336) con bandera.
     - Riesgos: `riskLevel=low` verde (#43A047), `medium` ámbar (#FB8C00), `high` rojo (#E53935). Subtareas usan gradiente por estado (`planned` gris, `in_progress` azul, `done` gris claro). Progreso agregado (`completedSubtasks/totalSubtasks`) se muestra como anillo en la cabecera del bloque padre.
4. Automatizaciones y panel lateral
   - `TaskEventBridge` crea tareas a partir de eventos (`provider.contract_signed`, `finance.contribution_scheduled`, `rsvp.reminder_triggered`, `ceremony.rehearsal_scheduled`) según reglas definidas en `weddings/{id}/taskAutomations/{ruleId}` (`trigger`, `templateId`, `delayDays`, `assigneeRoles`, `priority`, `enabled`). Las tareas generadas se marcan con `automationId` y sólo planner puede eliminarlas.
   - `TaskNotificationWatcher` revisa cada 60 s las tareas con `nextReminderAt` vencido, envía notificaciones (in-app/email) mediante `NotificationService`, reintenta a 10/30/60 min y, tras 3 fallos, marca `notification_failed`. Respeta `muteNotifications` e intervalo mínimo de 4 h.
   - La checklist sincronizada refleja progreso global y se alimenta de las mismas tareas.

### CalendarSync / iCal
- Feed iCal v2.0 (`webcal://`), timezone por defecto UTC (ajustable al perfil).
- Campos por evento: `UID={taskId}@MaLove.App`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `STATUS`; la descripción incluye enlaces a la tarea.
- Tokens en `weddings/{id}/calendarTokens/{tokenId}` `{ token, createdAt, lastUsedAt, revoked }`; al revocar se genera token nuevo.
- Enlaces sin uso expiran tras 90 días; la UI ofrece acción "Regenerar".

## 4. Persistencia y datos
- Firestore `weddings/{id}/tasks/{taskId}`: metadatos, estado, responsables, dependencias, historial.
- `weddings/{id}/checklist/{itemId}`: ítems clave y porcentaje de avance.
- `weddings/{id}/taskAutomations` / `taskTemplates`: reglas y plantillas.
- `calendarTokens` (backend) para feeds iCal; `taskEvents` para auditoría.
- Plantilla maestra gestionada desde `adminTaskTemplates` (fallback local `src/data/tasks/masterTimelineTemplate.json`).

## 5. Reglas de negocio
- Dependencias `dependsOn` bloquean completar hasta cerrar tareas previas.
- Sólo owner/planner pueden borrar tareas globales o editar automatizaciones; assistants completan/actualizan.
- Cambios en fecha de boda recalculan ventanas en checklist, lista y Gantt.
- Subtareas se tratan como checklist sin fecha puntual; la programación detallada queda en la tarea padre.
- Reuniones generan tareas obligatorias con fecha/hora (seguimiento puntual).

## 6. Estados especiales y errores
- **Checklist sin tareas** → banner "No tienes tareas configuradas" con CTA "Importar plantilla" y "Crear tarea manual".
- **Muchas tareas vencidas** → banner ámbar cuando >25% de tareas activas lleva >7 días vencida; botón "Ver vencidas" aplica filtro `status=overdue` y desaparece al bajar del 15%.
- **Feed iCal fallido** → toast rojo + mensaje persistente con botón "Reintentar"; tras 3 fallos se sugiere soporte.
- **Modo offline** → aviso gris "Trabajando sin conexión"; ediciones se guardan en `tasksOfflineQueue` y se notifica que se sincronizará automáticamente.

## 7. Responsive y accesibilidad
- Lista compacta en <=1024 px (filtros colapsables, buscador modal).
- Panel lateral en móviles como bottom-sheet (≈90% altura) con botón `Cerrar` accesible.
- Gantt en <=1280 px muestra modo condensado (solo tareas padre); botón "Mostrar subtareas" abre overlay con pan/zoom táctil y controles `+/-`, `Hoy`.
- Atajos de teclado: `N` nueva tarea, `F` filtros, `Ctrl+F` buscar, `Shift+C` completar seleccionada, `G` Gantt, `L` lista.
- Paleta de riesgo cumple contraste AA; iconos cuentan con `aria-label` y tooltips.

## 8. Integración con otros flujos
- Flujo 2 crea seeds iniciales (onboarding).
- Flujo 5/15 generan tareas para contratos/proveedores.
- Flujo 6 dispara tareas de pagos y aportaciones.
- Flujo 9/11 agregan hitos RSVP y ensayos.
- Flujo 17 alimenta rachas/puntos según progreso.

## 9. Métricas y monitorización
- Eventos: `task_created`, `task_completed`, `task_overdue`, `calendar_feed_generated`, `automation_triggered`.
- Indicadores: tiempo medio de cierre, ratio de finalización por responsable, uso de vistas calendario/Gantt.
- Logs de automatizaciones y errores en watchers para diagnóstico.

## 10. Pruebas recomendadas
- Unitarias: reducers de tareas/checklist, validadores de dependencias, generador iCal.
- Integración: crear tarea desde proveedor → verificar en checklist → feed iCal incluye evento.
- E2E: aplicar plantilla → completar tarea desde la lista → editar calendario → validar notificación.

## Cobertura E2E implementada
- `cypress/e2e/tasks/all_subtasks_modal.cy.js`: recorre creación de bloques, subtareas y actualización de estados dentro del timeline.

## 11. Checklist de despliegue
- Reglas Firestore actualizadas (`tasks`, `checklist`, `taskAutomations`).
- Tokens de calendario protegidos (Cloud Functions) y rotación periódica.
- Configurar servicios de notificación (`MAILGUN_*`, `PUSH_PROVIDER`).
- Validar performance con >500 tareas y modo Gantt.

## 12. Roadmap / pendientes
- IA que genere plan de tareas padre/subtareas personalizado (plantilla maestra + reglas LLM).
- Matriz RACI y asignaciones múltiples con permisos.
- Auto-priorización según proximidad y criticidad.
- Panel de riesgos con predicción de retrasos.
- Gamificación completa (streaks, objetivos semanales, recompensas).
- Sync bidireccional con calendarios externos (Google/Microsoft).
