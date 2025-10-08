# 15. Contratos y Documentos (estado 2025-10-07)

> Implementado: `ContractTemplates.jsx`, `ContractEditor.jsx`, `DocumentManager.jsx`, `DigitalSignatureModal.jsx`, servicios `documentService.js`, `signatureService.js` (stub), OCR basico en backend.
> Pendiente: firma digital integrada (DocuSign/HelloSign), workflows de aprobacion, analitica legal y compliance automatizado.

## 1. Objetivo y alcance
- Administrar contratos con proveedores y documentos legales clave de la boda.
- Facilitar edicion, versionado, firma y almacenamiento seguro de documentos.
- Garantizar cumplimiento legal y trazabilidad de cambios y aprobaciones.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Proveedores** → “Contratos” (`/proveedores/contratos`, `Contratos.jsx`).
- Desde las fichas de proveedor (`ProveedorDetail.jsx`) y el módulo de presupuesto se enlaza al mismo flujo para subir/firmar documentos.
- Notificaciones legales llevan al listado de contratos pendientes de firma.

## 3. Paso a paso UX
1. Creacion y edicion
   - Biblioteca de plantillas por tipo de proveedor con clausulas editables.
   - Editor enriquecido con variables dinamicas (fechas, importes, nombres) y control de versiones.
   - Generacion automatica a partir de datos del proveedor y presupuesto.
2. Negociacion y aprobacion
   - Comentarios en linea, sugerencias y comparacion de versiones.
   - Flujo de aprobacion configurable (owner, planner, proveedor) con notificaciones y recordatorios.
   - Registro de decisiones, rechazos y motivos.
3. Firma y archivo
   - Envio a firma digital (integracion pendiente) con orden de firmantes.
   - Seguimiento de estado, recordatorios e historial de acciones.
   - Almacenamiento cifrado, metadatos extraidos (OCR) y relacion con tareas/pagos.

## 4. Persistencia y datos
- Firestore `weddings/{id}/documents/{docId}`: metadata (tipo, categoria, proveedor, estado), version, enlaces storage.
- `weddings/{id}/documentWorkflows`: aprobaciones, firmantes, trazabilidad.
- `weddings/{id}/documentTemplates`: plantillas personalizadas y clausulas.
- Logs de firma en `weddings/{id}/signatureLogs` (cuando se active integracion externa).

## 5. Reglas de negocio
- Solo owner/planner pueden aprobar o enviar a firma; assistants con permisos limitados.
- Cambios en documento aprobado crean nueva version draft, nunca sobrescriben la firmada.
- Documentos marcados como obligatorios bloquean cierre de checklist si no estan firmados.
- Acceso a documentos sensibles requiere rol con `document:read` explicito y se registra en auditoria.

## 6. Estados especiales y errores
- Documento sin plantilla -> sugerir seleccion desde biblioteca o subir archivo existente.
- Subidas con OCR fallido -> mostrar alerta y permitir edicion manual de metadatos.
- Firma rechazada -> documento vuelve a estado `changes_requested` y notifica interesados.
- Lotes grandes (>25 MB) se dividen y se advierte al usuario.

## 7. Integracion con otros flujos
- Flujo 5 (Proveedores) y 6 (Presupuesto) sincronizan importes y pagos.
- Flujos 11C/11D consumen documentos legales y enlaces a plantillas de ceremonia.
- Flujo 14 crea tareas automaticas para seguimiento de contratos.
- Flujo 16/18 consumen datos para IA y generador de documentos legales.
- Flujo 20/7 notifican cambios o firmas completadas.

## 8. Metricas y monitorizacion
- Eventos: `document_created`, `document_uploaded`, `document_signed`, `document_overdue`.
- Indicadores: tiempo medio de firma, porcentaje de contratos aprobados vs generados, incidencias de rechazo.
- Alertas por proximidad de vencimiento y cumplimiento de hitos legales.

## 9. Pruebas recomendadas
- Unitarias: merge de variables, versionado, permisos por rol.
- Integracion: crear contrato -> aprobar -> enviar a firma -> actualizar estado -> registrar pago.
- E2E: owner crea contrato, planner revisa, proveedor firma, documento se archiva y actualiza tareas.

## 10. Checklist de despliegue
- Reglas Firestore para `documents`, `documentWorkflows`, `documentTemplates`, `signatureLogs`.
- Configurar almacenamiento seguro (Cloud Storage) con buckets separados y KMS.
- Variables de firma (`DOCUSIGN_*`, `HELLOSIGN_*`) y webhooks configuradas antes de activar.
- Revisar plantillas por region y mantener repositorio de versiones legales.

## 11. Roadmap / pendientes
- Integracion completa con proveedores de firma digital y verificacion de identidad.
- Analitica de clausulas (riesgos, montos, vencimientos) con IA.
- Workflows dinamicos segun tipo de contrato y jurisdiccion.
- Portal colaborativo para proveedores con comentarios y adjuntos.
- Archivado inteligente y retencion automatica segun politicas legales.
