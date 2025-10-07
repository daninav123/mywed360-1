# 11. Protocolo y Ceremonias (estado 2025-10-07)

> Implementado: `CeremonyProtocol.jsx`, `CeremonyTimeline.jsx`, `CeremonyConfigModal.jsx`, `CeremonyChecklist.jsx`, plantillas en `docs/protocolo/*` y seeds de tareas relacionadas.
> Pendiente: automatizacion legal completa, integracion con registros civiles, planes de contingencia inteligentes y generacion de programas para invitados.
> Nota: cuando `eventType` = `evento` sin ceremonia formal, este flujo se convierte en opcional y el wizard mostrará copy genérico ("Programa del evento").

## 1. Objetivo y alcance
- Planificar ceremonias civiles, religiosas y simbolicas con detalle minuto a minuto.
- Definir roles, procesiones, musica, lecturas y requisitos legales asociados.
- Coordinar documentos obligatorios, tradiciones y planes alternativos.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Protocolo** → enlaces a Momentos especiales, Timing, Checklist, Ayuda Ceremonia y Documentos (render `CeremonyProtocol.jsx`).
- Accesos directos desde Home (widget “Checklist ceremonia”), notificaciones legales y recordatorios en Timeline.
- Modal rapido desde Seating Plan para configurar distribucion de ceremonia.

## 3. Paso a paso UX
1. Configuracion inicial
   - Seleccion de tipo de ceremonia (civil, religiosa, simbolica, multiples).
   - Captura de fecha, hora, ubicacion, capacidad, celebrante/oficiante.
   - Requisitos legales y documentacion por tipo.
2. Definicion de protocolo y roles
   - Orden de entrada y salida (novios, padrinos, damas, testigos, invitados especiales).
   - Asignacion de roles y responsabilidades con horarios de llegada y vestimenta.
   - Tradiciones opcionales (arras, lazo, arena, unity candle) con instrucciones.
3. Cronograma y ejecucion
   - `CeremonyTimeline.jsx` divide pre-ceremonia, ceremonia y post-ceremonia.
   - Integracion con playlist/musica, lecturas, firmas y sesiones de fotos.
   - Panel de contingencias (clima, fallos tecnicos, retrasos) y contactos de emergencia.
4. Documentacion y seguimiento
   - Checklist de documentos civiles/religiosos con fechas limite y recordatorios.
   - Registro de firmas y certificados almacenados en `documents`.
   - Generacion de tareas asociadas y sincronizacion con timeline general.

## 4. Persistencia y datos
- Firestore `weddings/{id}/ceremony`: configuracion general, protocolos, roles, tradiciones, contingencias.
- `weddings/{id}/ceremonyTimeline`: hitos con timestamp, responsable, notas.
- Documentacion legal en `weddings/{id}/documents` enlazada mediante `relatedCeremonyId`.
- Seeds de tareas en `weddings/{id}/tasks` (curso prematrimonial, tramites, ensayos).

## 5. Reglas de negocio
- Cada ceremonia requiere al menos un celebrante y dos testigos para marcarse como lista.
- Documentos con estado `pending` bloquean la generacion de programa final.
- Roles sensibles (celebrante, testigos) solo editables por owner/planner.
- Tradiciones marcadas como obligatorias deben asignar responsable antes del evento.

## 6. Estados especiales y errores
- Falta de datos esenciales -> banner "Completa fecha, lugar y celebrante".
- Documentacion vencida -> alerta roja y tarea automatica de renovacion.
- Cambios de ultima hora -> versionado con historial y control de conflictos.
- Modal de contingencia se activa si se pronostica lluvia o el venue reporta incidencias.

## 7. Integracion con otros flujos
- Flujo 2 aporta fecha y ubicacion para sincronizar timeline.
- Flujo 3 y 4 asignan asientos especiales y controlan entrada de invitados.
- Flujo 6 vincula pagos a celebrante y permisos del venue.
- Flujo 14/15 generan tareas y documentos de protocolo.
- Flujo 21 usa extractos para sitio publico y comunicacion a invitados.

## 8. Metricas y monitorizacion
- Eventos: `ceremony_configured`, `ceremony_document_added`, `ceremony_protocol_updated`, `ceremony_contingency_triggered`.
- Indicadores: porcentaje de documentos completos, tiempo restante para fecha clave, cumplimiento de ensayos.
- Logs de auditoria para cambios de roles y actualizaciones legales.

## 9. Pruebas recomendadas
- Unitarias: validadores de protocolo, manejo de tradiciones, generacion de cronograma.
- Integracion: actualizar configuracion -> tareas y checklist reflejan cambios.
- E2E: crear ceremonia completa, adjuntar documentos, simular contingencia y ejecutar plan alternativo.

## 10. Checklist de despliegue
- Reglas Firestore para `ceremony`, `ceremonyTimeline` y documentos relacionados.
- Plantillas legales actualizadas por region y almacenadas en `docs/protocolo`.
- Revisar traducciones y roles default antes de publicar.
- Validar integracion con notificaciones (recordatorios de tramites y ensayos).

## 11. Roadmap / pendientes
- Integracion con registros civiles para seguimiento de expediente.
- Generador de programas PDF para invitados con QR y seating.
- Automatizacion de line-up con IA segun preferencias culturales.
- Planes de contingencia inteligentes basados en clima y disponibilidad de proveedores.
- Dashboard de seguimiento en tiempo real para el dia del evento.
