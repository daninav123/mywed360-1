# 5. Proveedores con IA (estado 2025-10-07)

> Implementado: `GestionProveedores.jsx`, `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `SupplierKanban.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, `AI` modals (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
> Pendiente: scoring inteligente consolidado, portal proveedor completamente funcional, automatización de RFQ multi-proveedor y reportes comparativos.

## 1. Objetivo y alcance
- Gestionar ciclo completo de proveedores (búsqueda, comparación, negociación, contratación) con soporte IA.
- Agrupar proveedores por categoría y eventos, detectar duplicados y llevar trazabilidad de comunicaciones.
- Integrar tablero visual para estados y control presupuestario por grupo.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Proveedores** → “Gestión de proveedores” (`/proveedores`, `GestionProveedores.jsx`).
- El desplegable del mismo bloque incluye “Contratos” (`/proveedores/contratos`) y acceso a fichas individuales (`/proveedores/:id`); el portal externo vive en `/proveedores/:id/portal`.
- `ProviderSearchDrawer` puede abrirse como overlay desde otras vistas (Timeline, Home, Tasks) para alta rápida o búsqueda IA.

## 3. Paso a paso UX
1. Descubrimiento y alta
   - `ProviderSearchDrawer` y `AISearchModal` permiten buscar sugerencias IA y guardar resultados.
   - `DuplicateDetectorModal` alerta coincidencias con proveedores existentes.
   - `ProveedorForm`/`SupplierOnboardingModal` capturan datos, presupuesto y preferencias.
2. Organización y comparación
   - `SupplierKanban` visualiza pipeline (vacía ? proceso ? presupuestos ? contratado ? rechazado) con drag & drop.
   - `GroupCreateModal`, `GroupAllocationModal` y `GroupSuggestions` manejan grupos (ej. catering, fotografía) asignando objetivos de presupuesto.
   - `CompareSelectedModal` contrasta propuestas (precio, rating, notas) y `AIEmailModal` genera correos personalizados.
3. Negociación y seguimiento
   - `RFQModal`, `ReservationModal` y `ProviderEmailModal` disparan solicitudes, reservas y emails con tracking (`EmailTrackingList`).
   - `SupplierEventBridge` sincroniza eventos con timeline/tareas.
   - `GestionProveedores` integra filtros, vistas tablero, tabla y paneles de detalle.

## 4. Persistencia y datos
- Firestore `weddings/{id}/suppliers/{supplierId}`: datos base, notas, presupuesto objetivo, estado pipeline.
- Colecciones auxiliares: `supplierGroups` (agrupaciones, metas), `supplierEmails` (historial de comunicaciones), `supplierRFQ`.
- Logs IA en `weddings/{id}/ai/suppliers/{uuid}` con prompt, respuesta, proveedor, usuario.
- Integración con `finance` para reflejar gastos confirmados/estimados.

## 5. Reglas de negocio
- Estados válidos (lead/contactado/propuesta/confirmado/descartado) mapeados a columnas del kanban.
- Solo owner/planner pueden eliminar o mover a columnas críticas; assistants gestionan notas/comunicaciones.
- Duplicados detectados por email, nombre, teléfono; se requiere confirmación para guardar.
- Grupos respetan presupuesto objetivo; avisos cuando se excede.

## 6. Estados especiales y errores
- Falta de IA (sin API) ? modales muestran fallback para entrada manual.
- Tracking email deshabilitado ? panel indica Sin seguimiento activo.
- Registro bancario fallido ? se muestra alerta y se reintenta tras reautenticación.
- Conexión perdida ? tabla y kanban pasan a modo lectura.

## 7. Integración con otros flujos
- Flujo 6 sincroniza presupuestos por proveedor y pagos planificados.
- Flujo 14 crea tareas automáticas tras cambios de estado (ej. revisar propuesta).
- Flujo 15 genera contratos y documentos desde ficha del proveedor.
- Flujo 7 envía emails personalizados reutilizando plantillas.
- Flujo 17 otorga puntos al confirmar proveedores clave.

## 8. Métricas y monitorización
- Eventos: `supplier_ai_search`, `supplier_group_created`, `supplier_stage_changed`, `supplier_email_sent`.
- KPIs: ratio lead?contrato, tiempo medio por etapa, ahorro conseguido vs presupuesto objetivo.
- Tracking de uso IA (peticiones, aciertos, feedback).

## 9. Pruebas recomendadas
- Unitarias: servicio AI (`aiSuppliersService`), detectores de duplicados, reducers de grupos.
- Integración: agregar proveedor ? ubicar en kanban ? asignar grupo ? enviar RFQ ? actualizar presupuesto.
- E2E: búsqueda IA, comparación, seguimiento de emails y cierre de contrato.

## 10. Checklist de despliegue
- Credenciales `OPENAI_*` / `VITE_OPENAI_*`, `MAILGUN_*`, `SUPPLIER_TRACKING_ENDPOINT` configuradas.
- Reglas Firestore para `suppliers`, `supplierGroups`, `supplierEmails`.
- Validar límites de documentos y seguridad para narrativas IA.
- QA del tablero y filtros (performance > 500 proveedores).

## 11. Roadmap / pendientes
- Scoring IA consolidado con métricas de performance históricos.
- Portal proveedor completo con autenticación y feedback bidireccional.
- Automatización multi-proveedor (RFQ masivo, recordatorios automáticos).
- Reportes comparativos y analítica de mercado.
- Integración con marketplaces externos y recomendaciones en sitio público.
