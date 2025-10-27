# Módulo de Pagos Comerciales (Diseño Propuesto)

> Objetivo general: Automatizar el ciclo completo de comisiones para comerciales, jefes de comerciales e influencers — desde el cálculo mensual hasta el pago automático en Revolut, incluyendo notificaciones e ingestión de facturas.

---

## 1. Alcance y piezas del sistema

| Bloque | Descripción | Artefactos iniciales |
| --- | --- | --- |
| **Cálculo de comisiones** | Generar liquidaciones mensuales por rol (comercial, manager, influencer). Fuente primaria: `discountLinks` + reglas de comisión. | Servicio backend `commercePayouts` (Firestore) + endpoint `/admin/commerce/payouts/preview`. |
| **Gestión de liquidaciones** | Persistir estados (calculado → notificado → facturado → aprobado → pagado). Permitir recalcular, aprobar manualmente, dejar notas. | Colección `commercePayouts/{yearMonth}/{beneficiaryId}` con subdocumentos de auditoría. |
| **Notificaciones** | Enviar email/slack automáticamente con el importe esperado de la factura y fecha límite. | Worker o job programado (`jobs/notifyCommercePayouts`). Plantillas Mailgun. |
| **Ingestión de facturas** | Ingestar la factura que sube el comercial (upload o correo) y extraer importe + metadatos. | Bucket `commerce-invoices`, Cloud Function extractor (OCR/LLM opcional), UI de verificación. |
| **Validación y pago automático** | Comparar importe factura vs cálculo. Si coincide y hay fondos → ejecutar pago vía Revolut. | Integración Revolut Transfer API (`backend/integrations/revolut.js`). |
| **Panel Admin** | Página dedicada (p.ej. `/admin/finance/payouts`) con filtros, estados y acciones (aprobar, reprocesar, forzar pago). | `src/pages/admin/AdminPayouts.jsx` + componentes modales/tabla. |
| **Auditoría** | Registro de cualquier cambio manual o pago ejecutado. | Uso de `adminAuditLogs` + guardado en cada `commercePayout`. |

---

## Estado actual

- ✅ Endpoint `/api/admin/dashboard/commerce/payouts/preview` disponible y conectado a `AdminPayouts.jsx`.
- ✅ Endpoint `/api/admin/dashboard/commerce/payouts/commit` que persiste la liquidación mensual en `commercePayouts/{periodId}` con versión, advertencias y auditoría.
- ✅ UI básica en `/admin/finance/payouts` con acción “Guardar liquidación” que dispara el commit manual.
- ⏳ Persistencia de estados granulares por beneficiario (notified, invoice_received, paid).
- ⏳ Flujo de notificaciones, ingestión de facturas y pagos automáticos (iteraciones posteriores).

---

## 2. Modelo de datos propuesto

### 2.1. Colección `commercePayouts`

```
commercePayouts (collection)
 └─ {periodId} (document) // e.g. "2025-09"
     ├─ summary: { currency, totalGross, totalToPay, generatedAt, generatedBy }
     └─ payouts (subcollection)
         └─ {beneficiaryId} (document)
             ├─ beneficiary: { id, name, email, role, managerId? }
             ├─ totals: {
                   revenue,
                   commission,
                   adjustments: [{ type, amount, note, author, createdAt }],
                   currency
               }
             ├─ status: 'calculated' | 'notified' | 'invoice_received' | 'approved' | 'paid' | 'disputed'
             ├─ invoice: { filePath, parsedAmount, uploadedAt, checksum, parserVersion }
             ├─ payment: { revolutTransferId, executedAt, confirmationUrl }
             ├─ notes: [{ authorId, message, createdAt }]
             └─ audit: [{ type, actor, payload, at }]
```

### 2.2. Configuración de beneficiarios

- Ampliar `salesCommercials` y `salesManagers` con campos:
  - `role`: `"commercial" | "manager" | "influencer"`
  - `payoutChannel`: `"invoice" | "self-billing"`
  - `bankInfo`: { iban, swift, revolutCounterpartyId? }
  - `invoiceEmail`
- Para influencers, reutilizar `discountLinks.assignedTo` + `role = influencer`.

---

## 3. Flujo principal

1. **Calcular** (cron mensual o manual)  
   - Endpoint `POST /api/admin/dashboard/commerce/payouts/preview?period=2025-09`.
   - Usa reglas de comisión (si no hay, aplicar fallback/flag).  
   - Resumen + detalles por beneficiario (agrupar por currency).

2. **Persistir**  
   - `POST /api/admin/dashboard/commerce/payouts/commit` con payload del preview + overrides.  
   - Guarda documentos y marca estado `calculated`.

3. **Notificar**  
   - Job que recorre `status = calculated` y envía email con importe + instrucciones.  
   - Marca `status = notified`.

4. **Recepción factura**  
   - Comerciales suben PDF (portal o enlace).  
   - Cloud Function procesa (`invoiceParser`) → extrae importe + datos.  
   - Actualiza doc (`invoice` + `status = invoice_received`).  
   - Si no coincide ± tolerancia, marcar `status = disputed` y avisar.

5. **Aprobación & Pago**  
   - Si coincide y hay saldo: ejecutar `POST /api/admin/dashboard/finance/revolut/pay` con counterparty y amount.  
   - Guardar `payment` + `status = paid`.  
   - Audit log + email confirmación.

6. **Reconciliación**  
   - Sync con Revolut (ya existe) para validar que transfer se asentó.  
   - Tabla muestra `reconciledAt`.

---

## 4. APIs a implementar (fase 1)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/admin/dashboard/commerce/payouts/preview` | Devuelve cálculo on-demand para un periodo. |
| `POST` | `/api/admin/dashboard/commerce/payouts/commit` | Persiste la liquidación (opcionalmente sobrescribe). |
| `GET` | `/api/admin/dashboard/commerce/payouts` | Lista periodos disponibles + filtros por estado. |
| `GET` | `/api/admin/dashboard/commerce/payouts/:period/:beneficiaryId` | Detalle de liquidación. |
| `POST` | `/api/admin/dashboard/commerce/payouts/:period/:beneficiaryId/notify` | Reenvía notificación/recordatorio. |
| `POST` | `/api/admin/dashboard/commerce/payouts/:period/:beneficiaryId/invoice` | Sube o registra invoice (respuesta del parser). |
| `POST` | `/api/admin/dashboard/commerce/payouts/:period/:beneficiaryId/pay` | Ejecuta pago Revolut. |

---

## 5. Integración Revolut (pendientes)

- Reutilizar helper actual (conectar/disconnect/sync).  
- Añadir módulo `backend/integrations/revolut.js` con:
  - `listCounterparties()`, `createCounterparty(payload)`,
  - `createTransfer({ counterpartyId, amount, currency, reference })`,
  - `getTransfer(id)` para reconciliación.
- Guardar `revolutCounterpartyId` en beneficiario al resolver IBAN.
- Controlar límites diarios y duplicados (idempotency key = `period-beneficiary`).

---

## 6. UI / UX

1. **Nuevo item en navegación**  
   - `finance` → añadir `Pagos Comerciales` (`/admin/finance/payouts`).
2. **Pantalla principal**  
   - Tabs por periodo (últimos 6 meses).  
   - Totales (por estado) + filtros (rol, manager, estado).  
   - Tabla con acciones: ver detalle, notificar, aprobar, pagar manual/auto, ver invoice.
3. **Detalle**  
   - Cronología de estados.  
   - Links con breakdown de revenue + comisión (por wedding/código).  
   - Adjuntos (factura, comprobante pago).  
   - Botón “Recalcular” (si cambian reglas).

---

## 7. Roadmap incremental

1. **Iteración 1 (backend cálculo + preview)**  
   - Endpoint preview con cálculo en memoria.  
   - Documento guardado manualmente (sin notificaciones).  
   - UI simple con tabla por beneficiario.
2. **Iteración 2 (persistencia + estados)**  
   - Guardar en Firestore, manejar cambios manuales.  
   - UI permite cambios de estado y notas.
3. **Iteración 3 (notificaciones e ingestión factura)**  
   - Plantilla email, job recordatorio.  
   - Upload de factura + parser básico (importe por regex).
4. **Iteración 4 (autopago Revolut + reconciliación)**  
   - Integra API Revolut, ejecuta transferencia, escribe log.  
   - Reconciliación automática vía sync.
5. **Iteración 5 (automatización completa)**  
   - Cron mensual, dashboards, métricas de cumplimiento.

---

## 8. Dependencias y consideraciones

- Validar disponibilidad de datos de revenue (`discountLinks.revenue` tiene que estar actualizado previa liquidación).
- Asegurar que `commissionRules` cubren todos los beneficiarios; fallback y alertas cuando falten.
- Necesario proceso de onboarding para recolectar datos fiscales (IBAN, holder name, etc.).
- Cumplir compliance: guardar facturas y comprobantes 5 años; cifrar IBANs en repositorio seguro.
- Testing:
  - Unit tests para cálculo (diferentes reglas, periodos).  
  - Integration tests para pipeline Revolut (usar modo sandbox).  
  - E2E manual en staging con facturas dummy.

---

## 9. Próximos pasos sugeridos

1. Implementar endpoint `/commerce/payouts/preview` (usando lógica compartida con `AdminDiscounts`).
2. Añadir nuevo servicio en `adminDataService` (`getCommercePayoutPreview`) y crear página admin básica.
3. Extender esquema Firestore con colección `commercePayouts` y mutaciones `commit`.
4. Definir plantilla Mailgun y job de notificación.
5. Investigar API Revolut para pagos programáticos y definir wrapper.

Una vez completado el paso 1, podremos validar con datos reales y ajustar reglas antes de automatizar el resto del flujo.
