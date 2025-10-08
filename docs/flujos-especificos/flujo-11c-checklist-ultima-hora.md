# 11C. Checklist de Última Hora

> Componentes clave: `src/components/protocolo/CeremonyChecklist.jsx`, `src/hooks/useCeremonyChecklist.js`, `src/pages/protocolo/Checklist.jsx`
> Persistencia: `weddings/{id}/ceremonyChecklist/main` y `weddings/{id}/documents` (vía `relatedCeremonyId`)

## 1. Objetivo y alcance
- Permitir al planner validar, el día antes del evento, que todos los elementos críticos están listos.  
- Resumir en un solo panel estado de proveedores, documentación, rituales y planes de contingencia.  
- Mostrar asociaciones con documentos subidos y detectar huecos (fechas límite vencidas, responsables sin asignar).

## 2. Triggers y rutas
- Navegación: `Más → Protocolo → Checklist`.  
- Acceso desde widget en Home “Checklist ceremonia” (cuando se defina).  
- Tareas categorizadas como `CEREMONIA` pueden enlazar directamente (`TasksRefactored.jsx:238`).

## 3. Estado actual vs. pendientes

**Implementado hoy**
- Widget compacto dentro de `CeremonyProtocol.jsx`.  
- Vista completa con categorías, cambios de estado, fechas y notas (`CeremonyChecklist.jsx`).  
- Recupera documentos existentes en Firestore para mostrarlos junto al ítem (`useCeremonyChecklist.js:63-101`).  
- Permite crear ítems personalizados con IDs generados (`crypto.randomUUID`).  

**Pendiente / roadmap**
- Asociar automáticamente archivos subidos desde la checklist a `weddings/{id}/documents`.  
- Límite real de 50 ítems personalizados (hoy no hay restricción).  
- Alertas visuales/sonoras cuando faltan archivos obligatorios.  
- Instrumentación (`ceremony_checklist_checked`) y sincronización con centro de notificaciones.

## 4. Datos y modelo
- Documento base (`DEFAULT_ITEMS` en `useCeremonyChecklist.js`). Campos: `id`, `label`, `category`, `status`, `dueDate`, `notes`, `relatedDocType`.  
- Hook carga documentos de `weddings/{id}/documents` y agrupa por `relatedCeremonyId`.  
- Estados soportados: `pending`, `in-progress`, `done` (colores definidos en `CeremonyChecklist.jsx`).  
- Cambios se guardan con `setDoc(..., { merge: true })` y se reflejan inmediatamente en la UI.

## 5. Reglas de negocio (vigentes)
- Ítems base se reinyectan si desaparecen, garantizando la checklist mínima.  
- No existen validaciones automáticas sobre documentos faltantes o límites de items.  
- Cambios de estado sólo impactan la propia checklist (sin automatismos).

## 6. Estados especiales
- **Sin datos**: se auto inicializa con `DEFAULT_ITEMS`.  
- **Errores de Firestore**: se captura el error y se almacenan sólo en estado local (console warn), sin bloquear la edición.  
- **Modo compacto**: oculta campos de notas y edición masiva, mostrando sólo estado y fecha objetivo.

## 7. Integraciones
- **Flujo 11B**: cuando un bloque entra en retraso se sugiere marcar el estado correspondiente en checklist.  
- **Flujo 11D**: los ítems de documentación enlazan a la guía legal y plantillas en `docs/protocolo/*`.  
- **Flujos 14/15**: las tareas y documentos heredados pueden actualizar la checklist vía `relatedCeremonyId`.  
- **Centro de notificaciones**: futura integración para enviar recordatorios según dueDate.

## 8. Métricas y eventos
- No se emiten eventos; `ceremony_checklist_checked` sigue pendiente.  
- Indicadores propuestos: % completado, recuento por categoría, días restantes.

## 9. Pruebas recomendadas
- Unitarias: merge de defaults, normalización de documentos en `useCeremonyChecklist`.  
- Integración: subir documento legal → comprobar asociación automática en checklist.  
- E2E: planner marca todos los ítems como completados, recarga y verifica persistencia.

## 10. Checklist de despliegue
- Reglas Firestore para `ceremonyChecklist`.  
- Traducciones y etiquetas de categorías (ES/EN/FR).  
- Seeds actualizados (`scripts/seedTestDataForPlanner.js:352`) para mostrar ejemplo funcional.
