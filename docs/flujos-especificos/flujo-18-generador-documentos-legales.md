# 18. Generador de Documentos Legales (estado 2025-10-07)

> Implementado: modulo base en `LegalDocuments.jsx`, plantillas iniciales (`contracts/provider`, `cesion-imagen`, `terminos`), servicio `legalDocumentService.js`, integracion con `documentService` para almacenamiento.
> Pendiente: automatizacion completa con IA, firma electronica certificada, flujos por region/jurisdiccion y dashboard de compliance.

## 1. Objetivo y alcance
- Generar automaticamente contratos, cesiones de imagen, terminos y otros documentos legales adaptados a la boda.
- Reducir costos legales ofreciendo plantillas validadas y personalizables.
- Gestionar ciclo completo: creacion, revision, firma y archivado seguro.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Protocolo** → “Documentos” (`/protocolo/documentos`, `LegalDocuments.jsx`).
- También accesible desde Proveedores, Invitados, Tareas y Gamificación cuando se requieren documentos legales.
- API interna `/api/legal-documents/*` reservada para futuras integraciones.

## 3. Paso a paso UX
1. Seleccion de documento
   - Catalogo por categoria (contratos proveedor, cesion imagen, terminos invitados, permisos especiales).
   - Wizard solicita datos clave (proveedor, servicios, fechas, importes, roles, jurisdiccion).
   - Previsualizacion del documento con secciones editables.
2. Generacion y personalizacion
   - Plantillas usan variables JSON (eventData, provider, participantes, clausulas).
   - IA opcional (pendiente) para sugerir clausulas segun contexto.
   - Validaciones legales basicas (campos obligatorios, formato, vencimientos).
3. Firma y seguimiento
   - Envio a firma digital (depende del flujo 15) o descarga PDF.
   - Estado del documento (draft, review, signed, archived) con timeline de acciones.
   - Tareas automaticas para seguimiento (renovaciones, recordatorios, vencimientos).

## 4. Persistencia y datos
- Firestore `weddings/{id}/legalDocuments/{docId}`: tipo, sub-tipo, datos dinamicos, estado, version, relaciones.
- `legalTemplates` (repositorio global) con clausulas y variantes por region.
- `legalGenerators/{runId}` logs de generacion (inputs, outputs, modelo IA utilizado).
- Archivos en Storage con metadata (`hash`, `encryptionKey`, `retentionPolicy`).

## 5. Reglas de negocio
- Plantillas validadas por legal deben marcarse `approved` antes de estar disponibles.
- Documentos generados no se publican sin confirmacion del owner/planner.
- Firma requiere doble autenticacion (email + codigo) hasta integrar proveedor certificado.
- Retencion estandar 5 anos, con opciones de borrado anticipado segun GDPR.

## 6. Estados especiales y errores
- Falta de datos obligatorios -> wizard indica secciones pendientes.
- Error de generacion -> fallback a plantilla estandar con campos manuales.
- Clausulas incompatibles (ej. region vs tipo) -> mostrar alerta y sugerir alternativa.
- Documento vencido -> notificacion y tarea de renovacion.

## 7. Integracion con otros flujos
- Flujo 5/15 usa contratos generados para proveedores y seguimiento.
- Flujo 11 incorpora documentos a protocolo de ceremonia.
- Flujo 3/9 genera cesiones de imagen para invitados.
- Flujo 14 crea tareas de revision y auditoria.
- Flujo 16 obtiene prompts para IA y respuestas de soporte.

## 8. Metricas y monitorizacion
- Eventos: `legal_doc_generated`, `legal_doc_signed`, `legal_doc_expired`, `legal_doc_error`.
- Indicadores: tiempo medio de generacion, tasa de adopcion por tipo, porcentaje de firmas completadas.
- Logs legales con versionado y auditoria (usuario, timestamps, IP).

## 9. Pruebas recomendadas
- Unitarias: merge de plantillas, validacion de variables, generacion de clausulas condicionadas.
- Integracion: generar contrato -> enviar a firma -> actualizar estado -> archivar.
- E2E: owner genera documentos clave (contrato proveedor, cesion imagen), completa firmas y valida accesos.

## 10. Checklist de despliegue
- Reglas Firestore para `legalDocuments`, `legalTemplates`, `legalGenerators`.
- Libreria de plantillas revisada por legal/compliance antes del release.
- Configurar almacenamiento cifrado y politicas de retencion.
- Variables `DOCUSIGN_*`/`HELLOSIGN_*`/`MAILGUN_*` listas para notificaciones y firmas.

## 11. Roadmap / pendientes
- Motor IA que transforme requisitos en clausulas personalizadas.
- Panel de cumplimiento con alertas por region y checklist legal.
- Integracion con registros oficiales (matrimonio civil) para descarga de documentos.
- Versionado colaborativo con comentarios y aprobaciones por rol.
- Automatizacion de renovaciones y recordatorios por periodo.
