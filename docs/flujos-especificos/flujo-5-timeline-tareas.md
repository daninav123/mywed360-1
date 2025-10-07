# 5b. Timeline y Tareas (estado 2025-10-07)

> Implementado: `Tasks.jsx`, `TaskSidePanel.jsx`, `Checklist.jsx`, `SmartChecklist.jsx`, `TaskList.jsx`, `EventsCalendar.jsx`, `LongTermTasksGantt.jsx`, `CalendarSync.jsx`, `TaskEventBridge.jsx`, `TaskNotificationWatcher.jsx`, hook `useWeddingTasksHierarchy.js`, utilidades `taskAutomations`, `CalendarComponents.jsx`.
> Pendiente: IA generadora de checklist completa, matriz de responsabilidades y sincronización bidireccional con calendarios externos (OAuth).

## 1. Objetivo y alcance
- Planificar tareas de toda la boda con vistas kanban, lista, calendario y Gantt.
- Automatizar recordatorios, dependencias y tareas derivadas de otros módulos.
- Sincronizar recordatorios con calendarios externos vía feeds iCal.

## 2. Trigger y rutas
- Menú inferior → pestaña **Tareas** (`/tareas`) con acceso a la checklist (`/checklist`) desde el mismo módulo.
- Vista calendario en `/tareas/calendario` (cuando está habilitada) y Gantt enlazado desde el panel superior.
- Widgets en Home, Invitados, Proveedores y Finanzas disparan creación rápida de tareas contextuales.

## 3. Paso a paso UX
1. Configuración inicial
   - `SmartChecklist` propone plantillas según tipo de boda, estado, temporada.
   - Usuario ajusta categorías, prioridades, fechas relativas, responsables.
2. Gestión diaria
   - `Tasks.jsx` (kanban) con columnas `todo/in_progress/done`, filtros por categoría, rol, fecha.
   - `TaskSidePanel` muestra detalles, subtareas, adjuntos, comentarios, vínculos con proveedores/contratos.
   - Checklist sincronizada mantiene toggles y progreso global.
3. Calendario y automatización
   - `EventsCalendar` y `LongTermTasksGantt` ofrecen vista temporal con arrastre/edición.
   - `CalendarSync` genera enlace iCal (webcal/https) para importar en Google/Apple/Outlook.
   - `TaskEventBridge` y `TaskNotificationWatcher` escuchan cambios de otros módulos y disparan tareas/alertas.

## 4. Persistencia y datos
- Firestore `weddings/{id}/tasks/{taskId}`: metadatos, estado, responsables, dependencias, historial.
- `weddings/{id}/checklist/{itemId}` sincroniza ítems clave y procentaje.
- `weddings/{id}/taskAutomations` y `taskTemplates` guardan reglas y plantillas.
- `calendarTokens` (backend) para feeds iCal; `taskEvents` para auditoría.

## 5. Reglas de negocio
- Dependencias `dependsOn` bloquean cambio a `done` hasta que dependencias se completen (configurable).
- Solo owner/planner pueden borrar tareas globales o editar automatizaciones; assistants completan/actualizan progreso.
- Fechas de tasks sync con timeline global; se recalculan cuando cambia la fecha de boda.
- Feeds iCal requieren sesión válida y se revocan si se desactiva enlace.

## 6. Estados especiales y errores
- Checklist vacía ? CTA "Importar plantilla recomendada".
- Exceso de tareas vencidas ? banner y sugerencia de reasignación.
- Error al generar feed iCal ? mensaje con reintento y consulta al backend.
- Modo offline ? cola local con reintento automático.

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
- Integración: crear tarea desde proveedor ? verificar en checklist ? feed iCal incluye evento.
- E2E: aplicar plantilla ? mover en kanban ? editar calendario ? validar notificación.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas (`tasks`, `checklist`, `taskAutomations`).
- Tokens de calendario protegidos (Cloud Functions) y rotación periódica.
- Configurar servicios de notificación (`MAILGUN_*`, `PUSH_PROVIDER`).
- Validar performance con >500 tareas y modo Gantt.

## 11. Roadmap / pendientes
- IA que genere checklist personalizada al vuelo según perfil.
- Matriz RACI y asignaciones múltiples con permisos.
- Sincronización bidireccional con Google/Microsoft mediante OAuth.
- Auto-priorización según proximidad y criticidad.
- Panel de riesgos con predicción de retrasos.
