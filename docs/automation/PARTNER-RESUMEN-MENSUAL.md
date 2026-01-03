# Automatización: Resumen mensual para partners (comerciales / influencers)

## Objetivo
Enviar un resumen automático a cada partner con sus resultados del mes (nuevas parejas captadas, importe acumulado y pendiente) y, opcionalmente, iniciar el pago correspondiente. Todo debe poder gestionarse desde el panel de administración para evitar despliegues o scripts manuales.

## Datos necesarios
- **partners**  
  - `partners/{partnerId}`  
    ```json
    {
      "name": "María Influencer",
      "type": "influencer | commercial | reseller",
      "phone": "+34...",
      "email": "maria@example.com",
      "payoutMethod": "revolut | transfer | manual",
      "revolutCounterpartyId": "uuid",
      "bankAccount": {
        "iban": "...",
        "holder": "María Influencer"
      },
      "marketingOptIn": true,
      "active": true,
      "defaultLocale": "es"
    }
    ```
- **Estadísticas mensuales**  
  - `partnerStatsMonthly/{partnerId}/{yyyy-MM}` con agregados:
    ```json
    {
      "month": "2025-09",
      "totalDeals": 7,
      "newDeals": 3,
      "conversions": [
        { "weddingId": "abc", "commission": 120 },
        { "weddingId": "def", "commission": 80 }
      ],
      "totalEarned": 720,
      "totalPaid": 500,
      "pending": 220,
      "currency": "EUR",
      "notes": ["Revisión de comisión boda XYZ"]
    }
    ```
- **Historial de pagos**  
  - `partnerPayouts/{payoutId}` con estados `prepared | processing | completed | failed`.

## Flujo de automatización
1. **Configuración en el panel** (`/admin/automations`):
   - Tarjeta “Resumen mensual partners”.
   - Parámetros editables:
     - Día del mes (1–28).
     - Hora UTC.
     - Umbral mínimo `pending` (evitar avisos insignificantes).
     - Canal principal (`whatsapp`, `email`, `ambos`).
     - Plantilla de mensaje (placeholders: `{{partner_name}}`, `{{month}}`, `{{total_earned}}`, `{{pending_amount}}`, `{{deals}}`, `{{payment_link}}`).
     - Activar/Desactivar pago automático (solo si `payoutMethod === "revolut"` y la cuenta está verificada).
     - Notas legales (texto que acompaña al mensaje cuando hay pago).
2. **Job mensual** (`POST /api/automation/partner-summary/run`):
   - Se ejecuta la madrugada del día configurado.
   - Obtiene la lista de partners activos `marketingOptIn = true`.
   - Por cada partner:
     - Calcula estadísticas del mes anterior.
     - Prepara mensaje personalizado.
     - Si `pending < threshold`, registra `skipped`.
     - Envía WhatsApp con `whatsappService.sendWhatsAppText` o fallback a email si no hay teléfono.
     - Escribe log en `automationLogs` (`type: partner_monthly_summary`).
3. **Pagos con Revolut (opcional)**:
   - Si la automatización está en modo `autoPay` y:
     - `payoutMethod === "revolut"`.
     - `revolutCounterpartyId` almacenado y verificado.
     - `pending > 0`.
   - Se inserta un registro en `partnerPayouts` con estado `prepared` y se llama al worker `revolutPaymentService.createPayment`.
   - El worker:
     1. Invoca `POST /v1/payments` (API Revolut Business) con HMAC.
     2. Guarda `providerPaymentId`, estado inicial `processing`.
     3. Espera webhook de Revolut → actualiza `partnerPayouts` (`completed`/`failed`) y notifica al panel.
   - Si falla la llamada o Revolut pide autorización manual, se marca `manual_required` y el panel muestra CTA “Autorizar en Revolut”.

## Consideraciones legales y contables
- **Facturación**: requieren factura emitida por el partner (o autofactura) antes del pago. Solución: adjuntar enlace `{{payment_link}}` al mensaje con pasos para subir factura.
- **Retenciones**: si aplica IRPF/IVA, el backend debe calcular importe neto y reflejarlo en `partnerPayouts.netAmount`.
- **Consentimiento**: solo enviar si `marketingOptIn` o `operationalOptIn` es `true`.
- **Auditoría**:
  - Cada ejecución guarda:
    ```json
    {
      "partnerId": "...",
      "period": "2025-09",
      "messagePreview": "Hola María...",
      "sendChannel": "whatsapp",
      "pendingAmount": 220,
      "autoPay": true,
      "paymentPayoutId": "payout_123",
      "actor": "automation-cron"
    }
    ```
  - En el panel (tabla “Historial”) se muestran resultado y acceso directo a logs/pagos.

## Próximos pasos
1. Implementar endpoints:
   - `GET /api/automation/partner-summary/config`
   - `PUT /api/automation/partner-summary/config`
   - `POST /api/automation/partner-summary/run`
2. Crear UI (puede convivir en `AdminAutomations.jsx`) con formulario y acciones manuales (simular/enviar).
3. Completar integración Revolut:
   - Guardar credenciales en `admin/settings`.
   - Implementar `revolutPaymentService` (createPayment, webhook handler).
   - Añadir pruebas sandbox.
4. Validar compliance (facturas, retenciones) y acordar procesos internos antes de habilitar `autoPay`.
