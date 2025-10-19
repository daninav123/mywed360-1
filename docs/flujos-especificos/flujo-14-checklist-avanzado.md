# 14. Checklist Avanzado (estado 2025-10-07)

> Implementado: `Checklist.jsx`, `Tasks.jsx`, `TaskSidePanel.jsx`, hook `useWeddingTasksHierarchy`, servicios `automationService.js` (basico).
> Pendiente: generacion inteligente de checklists, dependencias avanzadas, gamificacion completa y plantillas compartidas por comunidad.

## 1. Objetivo y alcance
- Centralizar tareas y checklists de planeacion con vistas kanban, lista y cronograma.
- Adaptar automaticamente la lista segun tipo de boda, presupuesto, invitados y rol del usuario.
- Coordinar colaboracion multirol, seguimiento de progreso y automatizacion de recordatorios.
- Generar y mantener tareas derivadas de `specialInterests`, `noGoItems` y recomendaciones IA continuas (flujo 2C), etiquetando claramente si pertenecen al núcleo o a un contraste controlado.

## 2. Trigger y rutas
- Menú inferior → pestaña **Tareas** (`/tareas`) con acceso directo a checklist (`/checklist`).
- CTA de onboarding “Configura tu checklist” y widgets en Home.
- Accesos contextuales desde Proveedores/RSVP/Presupuesto para crear tareas relacionadas.

## 3. Paso a paso UX
1. Configuracion inicial
   - Seleccionar plantilla segun estilo de boda o crear desde cero (el módulo `SmartChecklist` permanece pendiente).
   - Ajustar categorias, prioridades, fechas relativas a la boda.
   - (Pendiente) El módulo `SmartChecklist` analizará `weddingProfile` para añadir bloques Core y generar secciones adicionales por cada `specialInterest` (p. ej. “Speakeasy circo” → tareas de logística, permits, proveedores). Las tareas de contraste incluirán badge y zona.
   - Asistente IA sugerido para usuarios que no conocen pasos clave (pendiente).
2. Ejecucion diaria
   - Vista kanban (`Tasks.jsx`) con estados `todo`, `in_progress`, `done` y filtros por categoria/responsable.
   - Checklist sincronizada que mantiene toggle con tareas principales/subtareas.
   - Panel lateral con detalles: descripciones, subtareas, adjuntos, comentarios, relacion con proveedores.
   - Las tareas generadas por contrastes muestran `contrastContext` (zona, responsable sugerido, presupuesto vinculado) y shortcuts para equilibrar o degradarlas a inspiración si se marca `requiresReview`.
3. Automatizacion y seguimiento
   - Dependencias `dependsOn`, tareas recurrentes, recordatorios programados y triggers desde otros modulos.
   - Dashboard de progreso (completado por categoria, responsables, fechas criticas).
   - Objetivos semanales y rachas para gamificacion (en construccion).

## 4. Persistencia y datos
- Firestore `weddings/{id}/tasks/{taskId}`: estado, categoria, prioridad, fechas, asignados, dependencias, documentos, `contrastContext?` (zona, nivel, sourceInterestId) cuando proviene de un contraste.
- `weddings/{id}/checklist/{itemId}`: items simplificados sincronizados con tareas principales.
- `weddings/{id}/taskTemplates` y (pendiente) `taskAutomations` para plantillas y reglas.
- Estadisticas agregadas en `weddings/{id}/checklistStats` para dashboards.

## 5. Reglas de negocio
- Solo owner/planner pueden eliminar tareas globales; assistants solo marcan progreso.
- Dependencias impiden marcar `done` si tareas previas no completadas (configurable).
- Plantillas compartidas requieren aprobacion antes de publicarse globalmente.
- Automatizaciones deben registrar idempotencia para evitar duplicados.
- Tareas con `contrastContext` no pueden cambiar de categoría/zona sin confirmación; si se elimina un contraste en flujo 2C deben archivarse o trasladarse a inspiración.

## 6. Estados especiales y errores
- Checklist vacio -> CTA para importar plantilla sugerida.
- Si tareas vencidas > umbral se muestra alerta y sugiere reasignar.
- Errores guardando tareas -> rollback y mensaje toast.
- Conflictos de edicion simultanea -> ultima escritura gana, se registra en `activity` para auditoria.

## 7. Integracion con otros flujos
- Flujo 2 crea seeds iniciales tras onboarding y el flujo 2C inyecta/actualiza tareas cuando aparecen nuevos specialInterests o se ajustan contrastes.
- Flujo 5/15 generan tareas al aprobar contratos o proveedores.
- Flujo 6 produce tareas de pagos y seguimiento presupuestario.
- Flujo 9/11 añaden hitos de RSVP y ensayos.
- Flujo 17 usa estadísticas para puntos/logros; Flujo 12 respeta horarios silenciados.

## 8. Metricas y monitorizacion
- Eventos: `task_created`, `task_completed`, `task_overdue`, `template_applied`, `automation_triggered`.
- Nuevos eventos sugeridos: `task_contrast_created`, `task_contrast_resolved`, `task_contrast_rejected`.
- Medir porcentaje de tareas completadas por categoria, tiempo promedio y rachas activas.
- Telemetria para comparar checklists inteligentes vs manuales.

## 9. Pruebas recomendadas
- Unitarias: reducers de tareas/checklist, validacion de dependencias, plantillas.
- Integracion: crear tarea -> sincroniza con checklist -> dispara automatizacion.
- E2E: aplicar plantilla, reasignar tareas, completar racha semanal, revisar dashboard.


## Cobertura E2E implementada
- `cypress/e2e/tasks/all_subtasks_modal.cy.js`: verifica la gestión de checklist avanzado, subtareas y estados.

## 10. Checklist de despliegue
- Reglas Firestore para `tasks`, `checklist`, `taskTemplates`, `checklistStats` y preparación para `taskAutomations`.
- Revisar limites de escritura masiva (batch) en seeds y automatizaciones.
- Configurar notificaciones (`MAILGUN_*`, `PUSH_PROVIDER`) para recordatorios.
- Actualizar traducciones y onboarding segun nuevas plantillas.

## 11. Roadmap / pendientes
- Motor de recomendaciones IA que genere checklist dinamico segun perfil de boda.
- Editor de plantillas colaborativas y marketplace de workflows.
- Dependencias visuales (gantt, grafo) y pronostico de riesgo.
- Gamificacion completa (streaks, objetivos semanales, recompensas).
- Sync bidireccional con calendarios externos (Google/Microsoft).


