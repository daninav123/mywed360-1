# 11B. Timeline Global del D�a B

> Componentes clave: `src/pages/protocolo/Timing.jsx`, `src/components/protocolo/CeremonyTimeline.jsx`, `src/hooks/useCeremonyTimeline.js`
> Persistencia actual: campo `timing` dentro de `weddings/{id}` y subcolecci�n `weddings/{id}/ceremonyTimeline/main` (migraci�n a doc dedicado pendiente)
> Pendiente: migrar la persistencia a subcoleccion propia, exponer estado editable, habilitar drag&drop y alertas automaticas.

## 1. Objetivo y alcance
- Definir el cronograma completo del evento (preparativos, ceremonia, c�ctel, banquete, fiesta).  
- Permitir a planners y asistentes comprobar en tiempo real si cada bloque va en hora.  
- Integrar el timeline espec�fico de la ceremonia dentro del plan general.

## 2. Triggers y rutas
- Navegaci�n: `M�s � Protocolo � Timing`.  
- Accesos r�pidos desde tareas con palabras clave timing, cronograma, ensayo (`src/components/tasks/TasksRefactored.jsx:238`).  
- Notificaciones internas pueden abrir la vista cuando un bloque entra en estado retrasado.

## 3. Estado actual

### Implementado hoy
- `Timing.jsx` escucha el documento principal `weddings/{id}` y lee el campo `timing` (`src/pages/protocolo/Timing.jsx:35-44`).  
- Inicializa bloques por defecto cuando no existe informaci�n (`Timing.jsx:47-64`).  
- Permite editar nombre, horas, a�adir/eliminar momentos y reordenarlos con botones.  
- `CeremonyTimeline` gestiona secciones pre/ceremonia/post, con alta/baja de hitos y cambios de responsable/estado (`src/components/protocolo/CeremonyTimeline.jsx`).  
- Selector de estado por bloque (`on-time | slightly-delayed | delayed`) directamente desde la cabecera del bloque.

## Roadmap / pendientes
- Mover la persistencia de `timing` a una subcolecci�n separada (`weddings/{id}/timing`).  
- Editar el estado del bloque (on-time/slightly-delayed/delayed) desde la UI.  
- Reordenamiento drag&drop, l�mites de 30 hitos y validaciones de coherencia horaria.  
- Alertas autom�ticas seg�n retraso.

## 4. Datos y modelo
- Documento `weddings/{id}/timing`: array de bloques con `id`, `name`, `startTime`, `endTime`, `status`, `moments`.  
- Subcolecci�n `weddings/{id}/ceremonyTimeline/main`: `sections` (pre, ceremonia, post) con hitos detallados (`title`, `time`, `responsible`, `status`, `notes`).  
- Hook `useCeremonyTimeline` normaliza datos y asegura ids �nicos (`crypto.randomUUID` fallback).  
- Los cambios se guardan con `setDoc(..., { merge: true })` y se reflejan en la UI mientras se sincronizan.

## 5. Reglas de negocio (vigentes)
- No hay validaciones autom�ticas de coherencia entre `startTime` y `endTime`.  
- El estado del bloque siempre permanece en `on-time` (sin controles).  
- Sin l�mites de hitos ni drag&drop en la versi�n actual.

## 6. Estados especiales
- **Carga lenta / sin datos**: se muestra placeholder Cargando timing& (`Timing.jsx:115`).  
- **Retrasos**: planner puede marcar bloques como Ligero retraso o Retrasado; esto habilitar� notificaciones push en futuras iteraciones.  
- **Modo compacto**: cuando `CeremonyTimeline` se incrusta en contenedores secundarios (ej. extractos del dashboard), se limita a los tres primeros hitos de cada secci�n.

## 7. Integraciones
- **Flujo 11A**: consume momentos para poblar la secci�n `moments` de cada bloque.  
- **Flujo 11C**: checklist valida que hitos cr�ticos tengan responsables asignados.  
- **Flujo 21**: la web p�blica puede mostrar solo ciertos bloques/hitos (seg�n permisos).  
- **Seating Plan**: el bot�n Configurar ceremonia puede abrir el modal de layout con tiempos asociados al acceso de invitados.

## 8. M�tricas y eventos
- Evento `ceremony_timeline_updated` al guardar el timeline de ceremonia (incluye n� secciones/hitos).  
- Indicadores propuestos: desviaci�n media, n� hitos completados, horas bloqueadas vs libres.  
- Logging de auditor�a detallado contin�a en backlog.

## 9. Pruebas recomendadas
- Unitarias: `useCeremonyTimeline` (merge de secciones, ids), helpers de `Timing`.  
- Integraci�n: mover momento desde Momentos Especiales � verificar reflejo en timeline y persistencia.  
- E2E: planner marca bloque como retrasado, ajusta hora y observa actualizaci�n en checklist/tareas.


## Cobertura E2E implementada
- `cypress/e2e/protocolo/protocolo-flows.cy.js`: verifica que el timeline se inicializa con los bloques por defecto y que la interfaz permite a�adir nuevos momentos.

## 10. Checklist de despliegue
- Asegurar reglas Firestore para `timing` y `ceremonyTimeline`.  
- Revisar traducciones de estados y mensajes en UI.  
- Validar que seeds carguen timeline demo (`scripts/seedTestDataForPlanner.js:266`).
