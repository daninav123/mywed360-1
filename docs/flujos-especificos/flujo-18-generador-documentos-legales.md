# 18. Generador de Documentos Legales (estado 2025-10-07)

> Implementado: formulario `DocumentosLegales.jsx` (consentimiento de uso de imagen) que genera un PDF local con jsPDF.  
> Pendiente: repositorio completo de plantillas, firma electrónica, almacenamiento backend y automatización IA.

## 1. Objetivo y alcance
- Permitir al planner/owner generar rápidamente un consentimiento de uso de imagen para invitados o colaboradores.
- Servir como base para futuros documentos legales más complejos (contratos, términos, etc.).

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Protocolo** → “Documentos” (`/protocolo/documentos`, render `DocumentosLegales.jsx`).
- Accesos contextuales desde Proveedores/Invitados/Tareas sólo muestran enlaces informativos (no automatización).

## 3. Paso a paso UX
1. Selección de tipo (actualmente sólo “Consentimiento de uso de imagen”).
2. Formulario con campos nombre de los novios, firmante, fecha y lugar.
3. Botón “Generar PDF” → descarga local (`jsPDF`).
4. El documento debe compartirse manualmente (no hay envío automático ni firma digital).

## 4. Persistencia y datos
- No se escribe en Firestore ni Storage; el PDF se genera íntegramente en el navegador.
- No existe colección `legalDocuments`; cuando se añadan más plantillas habrá que definirla.

## 5. Reglas de negocio (MVP)
- El usuario es responsable de revisar y guardar el PDF generado.
- No se realiza firma digital ni validación legal; sólo se entrega un borrador editable.
- Nota 2025-10-12: el formulario **no** tiene validaciones visibles (`required`, mensajes) aunque deberían existir para impedir generar PDFs vacíos.

## 6. Estados especiales y errores
- Campos faltantes → hoy se permite generar igualmente; falta implementar validaciones y mensajes.
- Error jsPDF → se captura y se muestra un toast “No se pudo generar el documento”.

## 7. Integración con otros flujos (futuro)
- Flujo 5/15 (Contratos) y 11 (Protocolo) consumirán plantillas cuando exista repositorio backend.
- Flujo 14 (Checklist) podrá generar tareas automáticas de revisión y archivado.
- Flujo 16 (Asistente IA) podría sugerir plantillas y completar datos.

## 8. Métricas y monitorización
- No hay métricas instrumentadas; se planea registrar `legal_doc_generated` cuando exista backend.

## 9. Pruebas recomendadas
- Unitarias: función de generación jsPDF (datos de ejemplo) y validaciones del formulario.
- E2E: flujo completo (rellenar formulario, generar PDF, verificar descarga).


## Cobertura E2E implementada
- No hay pruebas end-to-end específicas implementadas para este flujo.

## 10. Checklist de despliegue
- Verificar compatibilidad jsPDF en navegadores soportados.
- Proveer plantillas actualizadas en cuanto haya repositorio legal.
- Revisar textos y traducciones.

## 11. Roadmap
- Repositorio de plantillas en Firestore/Storage (`legalTemplates`).
- Firma digital (integración con DocuSign/HelloSign) y seguimiento de estado.
- Automatización IA para rellenar cláusulas y generar contratos personalizados.
- Dashboard de cumplimiento y alertas.

## 12. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- `DocumentosLegales.jsx` genera un PDF con jsPDF pero carece de validaciones y manejo de versiones.
- Sólo existe una plantilla (`consentimiento_imagen`); selector de tipo no cambia contenido.
- No se expone historial ni confirmación visual tras la descarga; `toast` solo en caso de error.

### Experiencia mínima a construir
- Añadir validaciones obligatorias (`required`, mensajes bajo cada campo) y deshabilitar el botón hasta completar datos.
- Mostrar confirmación de éxito (`alert`/`toast`) con nombre del archivo generado.
- Registrar versiones en memoria (array local) con lista lateral o modal para “Historial”.
- Exponer `data-testid` en formulario (`legal-docs-form`), botón (`legal-docs-submit`) y lista de historial.

### Criterios de prueba E2E propuestos
1. `legal-docs-generator`: completar formulario, interceptar `jsPDF` (`cy.stub(window, 'jsPDF')`) y verificar `doc.save` con nombre esperado. Confirmar mensaje de éxito.
2. `legal-docs-validation`: intentar enviar vacío y esperar mensajes “Campo obligatorio” en nombre, fecha y lugar; el botón permanece deshabilitado.
3. `legal-docs-versioning`: generar documento, modificar valores y generar nuevamente; historial muestra dos entradas con timestamps distintos.

### Dependencias técnicas
- Wrapper sobre jsPDF que permita inyectar stub en Cypress (ej. exportar `createLegalDoc` y mockear).
- Fuente de fecha actual consistente para historial (usar `Date.now()` pero exponer `Date.now = cy.stub`).
- Fixtures de datos (`cypress/fixtures/legal-docs.json`) para reutilizar nombres y validar copy.
