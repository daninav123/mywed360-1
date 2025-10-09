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
   - `SmartChecklist` propone plantillas según tipo de boda, estado, temporada.
   - Usuario ajusta categorías, prioridades, fechas relativas, responsables.
2. Gestión diaria
   - `TasksRefactored` muestra la lista principal (`TaskList`) agrupada por estado con filtros por categoría, rol y fecha (sustituto del kanban legacy).
     Cada bloque expone tarjetas con chips de categoría, responsables y fecha; la cabecera mantiene filtros persistentes (categoría, rango, responsable) y buscador.
     Acciones rápidas en cada tarjeta: checkbox de completar, menú contextual `Mover a…` (cambia estado), reasignar, abrir panel lateral o crear subtarea.
   - `TaskSidePanel` muestra detalles, subtareas, adjuntos, comentarios, vínculos con proveedores/contratos.
   - Checklist sincronizada mantiene toggles y progreso global.
3. Calendario y automatización
   - `EventsCalendar` y `LongTermTasksGantt` ofrecen vista temporal con arrastre/edición.
   - `CalendarSync` genera enlace iCal (webcal/https) para importar en Google/Apple/Outlook.
   - `TaskEventBridge` y `TaskNotificationWatcher` escuchan cambios de otros módulos y disparan tareas/alertas.
   - Gantt por bloques: por defecto solo muestra tareas padre con su progreso agregado. Un interruptor global “Mostrar subtareas” expande/colapsa todos los bloques y evita que queden abiertos entre sesiones. Al hacer clic en un bloque se abre un panel lateral con el detalle de sus subtareas (línea temporal, responsables, estado) sin saturar el lienzo principal. Filtros rápidos (categoría, responsable, rango temporal) acotan las barras renderizadas antes de llegar al Gantt para mantener una vista limpia.

## 4. Persistencia y datos
- Firestore `weddings/{id}/tasks/{taskId}`: metadatos, estado, responsables, dependencias, historial.
- `weddings/{id}/checklist/{itemId}` sincroniza ítems clave y procentaje.
- `weddings/{id}/taskAutomations` y `taskTemplates` guardan reglas y plantillas.
- Plantilla semilla `src/data/tasks/masterTimelineTemplate.json` con bloques padre y subtareas base (consume el seed inicial y botón manual).
- `calendarTokens` (backend) para feeds iCal; `taskEvents` para auditoría.

## 5. Reglas de negocio
- Dependencias `dependsOn` bloquean cambio a `done` hasta que dependencias se completen (configurable).
- Solo owner/planner pueden borrar tareas globales o editar automatizaciones; assistants completan/actualizan progreso.
- Fechas de tasks sync con timeline global; se recalculan cuando cambia la fecha de boda.
- Feeds iCal requieren sesión válida y se revocan si se desactiva enlace.

## 6. Estados especiales y errores
- Checklist vacía → CTA "Importar plantilla recomendada".
- Exceso de tareas vencidas → banner y sugerencia de reasignación.
- Error al generar feed iCal → mensaje con reintento y consulta al backend.
- Modo offline → cola local con reintento automático.

## 7. Integración con otros flujos
- Flujo 2 crea seeds iniciales (onboarding).
- Flujo 5/15 generan tareas a partir de contratos/proveedores.
- Flujo 6 dispara tareas de pagos y seguimiento de aportaciones.
- Flujo 9/11 agregan hitos RSVP y ensayos.
- Flujo 17 alimenta rachas/puntos según progreso.

## 8. Métricas y monitorización
- Eventos: `task_created`, `task_completed`, `task_overdue`, `calendar_feed_generated`, `automation_triggered`.
- Indicadores: tiempo medio de cierre, ratio tareas completadas por responsable, uso de vistas calendario/Gantt.
- Logs de automatizaciones y errores en watchers para diagnóstico.

## 9. Pruebas recomendadas
- Unitarias: reducers de tareas/checklist, validadores de dependencias, generador iCal.
- Integración: crear tarea desde proveedor → verificar en checklist → feed iCal incluye evento.
- E2E: aplicar plantilla → completar tarea desde la lista (checkbox o menú `Mover a…`) → editar calendario → validar notificación.


## Cobertura E2E implementada
- `cypress/e2e/tasks/all_subtasks_modal.cy.js`: recorre creación de bloques, subtareas y actualización de estados dentro del timeline.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas (`tasks`, `checklist`, `taskAutomations`).
- Tokens de calendario protegidos (Cloud Functions) y rotación periódica.
- Configurar servicios de notificación (`MAILGUN_*`, `PUSH_PROVIDER`).
- Validar performance con >500 tareas y modo Gantt.

## 11. Roadmap / pendientes
- IA que genere plan de tareas padre/subtareas personalizado: mantener una plantilla maestra (`src/data/tasks/masterTimelineTemplate.json`) con todas las tareas padre y subtareas posibles (curada manualmente y alimentada de forma orgánica cuando otras bodas añaden bloques útiles), ingestar datos de la boda (tipo, tamaño, presupuesto, estilo, lead time) y usar un motor híbrido plantillas versionadas + LLM para descartar/adaptar nodos irrelevantes, proponer dependencias, responsables sugeridos y ventanas temporales; entregar el resultado en modo borrador con explicación por bloque y capturar feedback para mejorar los prompts, pesos y la plantilla base.
- Matriz RACI y asignaciones múltiples con permisos.
- Auto-priorización según proximidad y criticidad.
- Panel de riesgos con predicción de retrasos.
- Gamificación completa (streaks, objetivos semanales, recompensas).
- Sync bidireccional con calendarios externos (Google/Microsoft).
