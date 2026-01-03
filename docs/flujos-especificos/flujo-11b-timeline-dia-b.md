# 11B. Timeline Global del Día B

> Componentes clave: `src/pages/protocolo/Timing.jsx`, `src/components/protocolo/CeremonyTimeline.jsx`, `src/hooks/useCeremonyTimeline.js`
> Persistencia actual: campo `timing` dentro de `weddings/{id}` y subcolección `weddings/{id}/ceremonyTimeline/main` (migración a doc dedicado pendiente)
> Pendiente: migrar la persistencia a subcolección propia, exponer estado editable, habilitar drag&drop y alertas automáticas.

## 1. Objetivo y alcance
- Definir el cronograma completo del evento (preparativos, ceremonia, cóctel, banquete, fiesta).  
- Permitir a planners y asistentes comprobar en tiempo real si cada bloque va “en hora”.  
- Integrar el timeline específico de la ceremonia dentro del plan general.

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Timing`.  
- Accesos rápidos desde tareas con palabras clave “timing”, “cronograma”, “ensayo” (`src/components/tasks/TasksRefactored.jsx:238`).  
- Notificaciones internas pueden abrir la vista cuando un bloque entra en estado “retrasado”.

## 3. Estado actual

### Implementado hoy
- `Timing.jsx` escucha el documento principal `weddings/{id}` y lee el campo `timing` (`src/pages/protocolo/Timing.jsx:35-44`).  
- Inicializa bloques por defecto cuando no existe información (`Timing.jsx:47-64`).  
- Permite editar nombre, horas, añadir/eliminar momentos y reordenarlos con botones.  
- `CeremonyTimeline` gestiona secciones pre/ceremonia/post, con alta/baja de hitos y cambios de responsable/estado (`src/components/protocolo/CeremonyTimeline.jsx`).  
- Selector de estado por bloque (`on-time | slightly-delayed | delayed`) directamente desde la cabecera del bloque.

## Roadmap / pendientes
- Mover la persistencia de `timing` a una subcolección separada (`weddings/{id}/timing`).  
- Editar el estado del bloque (on-time/slightly-delayed/delayed) desde la UI.  
- Reordenamiento drag&drop, límites de 30 hitos y validaciones de coherencia horaria.  
- Alertas automáticas según retraso.

## 4. Datos y modelo
- Documento `weddings/{id}/timing`: array de bloques con `id`, `name`, `startTime`, `endTime`, `status`, `moments`.  
- Subcolección `weddings/{id}/ceremonyTimeline/main`: `sections` (pre, ceremonia, post) con hitos detallados (`title`, `time`, `responsible`, `status`, `notes`).  
- Hook `useCeremonyTimeline` normaliza datos y asegura ids únicos (`crypto.randomUUID` fallback).  
- Los cambios se guardan con `setDoc(..., { merge: true })` y se reflejan en la UI mientras se sincronizan.

## 5. Reglas de negocio (vigentes)
- No hay validaciones automáticas de coherencia entre `startTime` y `endTime`.  
- El estado del bloque siempre permanece en `on-time` (sin controles).  
- Sin límites de hitos ni drag&drop en la versión actual.

## 6. Estados especiales
- **Carga lenta / sin datos**: se muestra placeholder “Cargando timing...” (`Timing.jsx:115`).  
- **Retrasos**: planner puede marcar bloques como “Ligero retraso” o “Retrasado”; esto habilitará notificaciones push en futuras iteraciones.  
- **Modo compacto**: cuando `CeremonyTimeline` se incrusta en contenedores secundarios (ej. extractos del dashboard), se limita a los tres primeros hitos de cada sección.

## 7. Integraciones
- **Flujo 11A**: consume momentos para poblar la sección `moments` de cada bloque.  
- **Flujo 11C**: checklist valida que hitos críticos tengan responsables asignados.  
- **Flujo 21**: la web pública puede mostrar solo ciertos bloques/hitos (según permisos).  
- **Seating Plan**: el botón “Configurar ceremonia” puede abrir el modal de layout con tiempos asociados al acceso de invitados.

## 8. Métricas y eventos
- Evento `ceremony_timeline_updated` al guardar el timeline de ceremonia (incluye nº secciones/hitos).  
- Indicadores propuestos: desviación media, nº hitos completados, horas bloqueadas vs libres.  
- Logging de auditoría detallado continúa en backlog.

## 9. Pruebas recomendadas
- Unitarias: `useCeremonyTimeline` (merge de secciones, ids), helpers de `Timing`.  
- Integración: mover momento desde Momentos Especiales → verificar reflejo en timeline y persistencia.  
- E2E: planner marca bloque como retrasado, ajusta hora y observa actualización en checklist/tareas.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/protocolo-flows.cy.js`: verifica que el timeline se inicializa con los bloques por defecto y que la interfaz permite añadir nuevos momentos.

## 10. Checklist de despliegue
- Asegurar reglas Firestore para `timing` y `ceremonyTimeline`.  
- Revisar traducciones de estados y mensajes en UI.  
- Validar que seeds carguen timeline demo (`scripts/seedTestDataForPlanner.js:266`).
