# 25. Planes y Suscripciones (estado 2025-10-13)

> Implementado: documentación estratégica inicial y catálogo de planes en `docs/planes-suscripcion.md`.
> Pendiente: implementación técnica del cobro único por boda, automatizaciones de upgrade/downgrade, telemetría operativa y paneles de rentabilidad.

## 1. Objetivo y alcance
- Definir cómo MaLoveApp monetiza cada boda mediante planes Gratis, Premium y Premium Plus, manteniendo una propuesta clara para planners profesionales.
- Establecer el journey completo (descubrimiento → activación → retención → cierre) y qué equipos intervienen en cada etapa.
- Servir como documento maestro para coordinar automatizaciones, métricas, pricing y materiales de soporte relacionados con suscripciones y upgrades.

## 2. Estrategia y posicionamiento
- **Modelo comercial:** pago único por boda según el plan elegido (Gratis, Premium, Premium Plus). Cada nueva boda exige seleccionar plan de nuevo; la pareja puede empezar gratis y desbloquear beneficios cuando los necesite.
- **Segmentos principales:** parejas (owner/assistants) y planners/agencias. Todo usuario autenticado debe pertenecer a un nivel concreto; marketing documenta motivadores de compra y pains por segmento.
- **Propuesta de valor:**
  - `Gratis`: planificación esencial con límites estrictos (invitados, plantillas, exportaciones) y soporte comunitario.
  - `Premium`: herramientas completas para la boda (automatizaciones, exportaciones, personalización) + asistentes adicionales.
  - `Premium Plus`: lo anterior más concierge dedicado, integraciones exclusivas y white-label.
- **KPIs estratégicos:** ratio de bodas que pasan de Gratis → Premium/Premium Plus, ticket promedio por boda, adopción Premium Plus, margen neto por boda, NPS tras el evento.
- **Gobernanza:** marketing define mensajes y funnel, producto define límites funcionales, finanzas valida pricing y márgenes, data arma dashboards. Rituales quincenales revisan métricas y backlog priorizado por bodas activas.

## 3. Adquisición y funnel inicial
- **Canales priorizados:** SEO con contenido educativo, campañas pagas, referidos, eventos/webinars y partnerships.
- **Mensajes clave:** énfasis en el pago único por boda y comparativa clara Gratis vs Premium vs Premium Plus. Mostrar beneficios concretos (automatizaciones, concierge, white-label) cuando corresponda.
- **Activos digitales:** landing de planes, comparativa interactiva y calculadoras que proyectan el valor capturado por boda según el plan.
- **Incentivos:** upgrades temporales a Premium por hitos clave, descuentos para el primer pago o bundles con planners certificados. Documentar criterios de elegibilidad y caducidad.
- **Automatizaciones CRM:** journeys diferenciados para (1) registro sin crear boda, (2) boda creada sin plan, (3) abandono en checkout de upgrade, (4) recordatorios previos a la fecha de la boda.
- **Métricas de funnel:** registro → creación de primera boda, bodas gratis → Premium, Premium → Premium Plus, conversión por canal, CAC por boda activada.

## 4. Onboarding y activación
- **Registro:** formularios mínimos (nombre, email, consentimiento) más verificación vía email y welcome screen.
- **Creación de boda:** wizard de configuración básica; la app solo funciona con bodas creadas (visitantes anónimos no acceden).
- **Selección de plan:** comparativa en onboarding y dentro del panel de cada boda; destacar límites del plan Gratis y beneficios Premium Plus.
- **Pago único:** integración con pasarela PCI (Stripe/Braintree) que liga el cobro al `weddingId`. El recibo incluye plan, importe, fecha del evento y vigencia.
- **Primer valor:** checklist guiada, tutorial interactivo y badges en features bloqueadas que se liberan con el upgrade.
- **Reglas de upgrade:** banners al alcanzar límites, emails contextuales, ofertas dinámicas según etapa de planificación y ruta directa a Premium Plus para bodas complejas.
- **Métricas de activación:** % de bodas que completan checklist inicial, tiempo al primer upgrade, upgrades dentro de X días desde creación.

## 5. Uso continuo, soporte y retención
- **Catálogo vivo:** tabla de funcionalidades y límites por plan (ver `docs/planes-suscripcion.md`). Incluir qué ocurre post-boda (acceso histórico, exportaciones).
- **Comunicación continua:** newsletters segmentadas, centro de recursos por nivel, webinars Premium y sesiones privadas Premium Plus. Roadmap público con votos para incentivar upgrades.
- **Triggers de upsell:** alcanzar 80 % de límites, interés en features avanzadas, proximidad de hitos críticos (envío de invitaciones), necesidad de soporte experto. De Premium a Premium Plus se prioriza la complejidad de la boda y presupuesto.
- **Feedback loop:** NPS tras boda, encuestas in-app después de usar features clave, entrevistas a usuarios Premium Plus. El backlog se prioriza según impacto por nivel.
- **Gestión de cambios de plan:** upgrades inmediatos pagando la diferencia; posibilidad de volver a Gratis antes del cobro; mantenimiento de configuraciones tras upgrade; bloqueo de downgrade cuando ya se consumieron beneficios Premium Plus.

## 6. Operación y cumplimiento
- **Facturación y cobro:** flujo para pago único por boda, recibo con datos de la boda, reintentos automáticos (máximo 7 días) y dashboard de cobros pendientes por evento.
- **Soporte financiero:** políticas de reembolso parcial/total según progreso del evento; conciliación bancaria diaria y trazabilidad por boda.
- **Legal/compliance:** términos y condiciones que explican vigencia por boda, política de reembolsos y tratamiento de datos (especialmente cuando se comparte con terceros/planners).
- **Cancelaciones:** flujo self-service con confirmación, encuesta de salida obligatoria, opciones de rescate (ej. upgrade Premium Plus con concierge) y bloqueo automático de acceso premium al superar la fecha del evento.
- **Observabilidad:** tablero con métricas diarias (upgrades, monto medio pagado, ratio Premium Plus, tickets abiertos, NPS) y responsables por área con rituales semanales.
- **Prevención de usos indebidos:** cada pago genera `purchaseId` ligado a `weddingId`, fecha del evento y plan. Al archivar/duplicar bodas se marca como `consumido` y queda sólo lectura 12 meses; una nueva boda requiere un pago nuevo.

## 7. Persistencia y datos
- **Firestore**
  - `weddings/{id}/subscription`: `{ plan, tier, status, purchaseId, price, currency, purchasedAt, expiresAt, upgradedBy, source }`.
  - `users/{uid}/weddingPlans/{weddingId}`: duplicado de plan y permisos para owners/assistants/planners.
  - `subscriptionInvoices/{purchaseId}`: información financiera y trazabilidad del cobro.
- **Backend**
  - Endpoint `POST /api/billing/checkout` (genera sesión de pago ligada a `weddingId`).
  - Webhook `/api/billing/webhook` registra `purchaseId`, actualiza Firestore y notifica al CRM.
  - Servicio `PlanLimitsService` expone límites por plan para el frontend.
- **CRM / Marketing automation**
  - Segmentos `segment=free|premium|premium_plus` con atributos adicionales (fecha boda, presupuesto, planner asignado).
  - Campos para journeys (`upgradeIntent`, `abandonedCheckout`, `hasConcierge`).
- **Analytics**
  - Eventos: `subscription_plan_selected`, `subscription_checkout_started`, `subscription_upgrade_completed`, `subscription_refund_requested`, `subscription_plan_downgraded`.
  - Dashboards Looker/GA4 con cohortes por fecha de boda y plan.

## 8. Mapa resumido del journey
1. Descubrimiento → visita contenidos públicos y registro.
2. Registro → creación de cuenta y acceso al dashboard (sin boda no hay app).
3. Creación de boda → configuración inicial con plan Gratis por defecto.
4. Activación → primeros pasos guiados, detección de límites y prompts de upgrade.
5. Conversión → pago único para pasar a Premium o Premium Plus.
6. Retención → uso recurrente del plan adquirido, comunicaciones segmentadas, soporte.
7. Extensión → upgrade Premium → Premium Plus, referidos, compra para nuevas bodas.
8. Cierre → encuesta pos-boda, documentación histórica, posible reembolso según política.

## 9. Roles y herramientas recomendadas
- **Marketing/Growth:** HubSpot o Customer.io para journeys, GA4/Looker para analytics, ownership de mensajes de valor.
- **Producto:** Jira/Linear para backlog, LaunchDarkly para experimentos, definición de límites y flags de features.
- **Soporte/Éxito:** Zendesk/Intercom con playbooks por plan, seguimiento de NPS y concierge Premium Plus.
- **Finanzas/Operaciones:** Stripe/Braintree para cobros, herramientas contables para conciliación, gestión de reembolsos y reporting legal.
- **Data:** dashboards de upgrades, rentabilidad por boda, cohortes y alertas de anomalías.

## 10. Métricas y monitorización
- **Lag measures:** % de bodas que pagan upgrade, ticket promedio por boda, ratio Premium Plus, margen neto, NPS post-boda.
- **Lead measures:** alcance de límites en Gratis, sesiones del comparador de planes, abandono en checkout, reclamaciones de cobranzas.
- **Alertas/observabilidad:** alertar si `subscription_upgrade_completed` cae >20 % semana a semana, si Stripe webhooks fallan, o si la conciliación diaria no cuadra con `subscriptionInvoices`.

## 11. Pruebas recomendadas
- **Unitarias:** reglas de límites (`PlanLimitsService`), cálculo de prorrateos, estados `subscription.status` (pending, paid, refunded, consumed).
- **Integración:** crear boda → iniciar checkout → recibir webhook y validar actualización de Firestore y CRM; downgrade de Premium Plus con features consumidas; reembolso parcial.
- **E2E:** journeys de upgrade desde banners y desde planner, upgrade de planner agency que concede beneficios a parejas, cancelación self-service con encuesta y bloqueo post-evento.

## Cobertura E2E implementada
- `cypress/e2e/subscriptions/subscription-flow.cy.js`: recorre upgrade/downgrade de planes y validaciones principales.

## 12. Checklist de despliegue
- Configurar claves de pasarela (`STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`) y variables `VITE_DEFAULT_PLAN`.
- Asegurar reglas Firestore para `weddings/{id}/subscription`, `users/{uid}/weddingPlans` y `subscriptionInvoices`.
- Registrar dominios y webhooks en pasarela de pago (staging/producción).
- Sembrar seeds para QA (`scripts/seedSubscriptions.js`) con bodas en cada plan.
- Documentar FAQ y material de soporte para cada nivel.
- Ejecutar `scripts/aggregateRoadmap.js` tras cambios de flujo para sincronizar ROADMAP/TODO.

## 13. Roadmap / pendientes
- Validar con stakeholders la propuesta de valor y límites concretos por plan.
- Mapear el journey completo en herramientas (Miro/Lucidchart) con responsables y SLA por boda.
- Construir dashboard de métricas (upgrades, ticket medio, ratio Premium Plus) integrado con CRM y pasarela.
- Diseñar y testear journeys automáticos (alta, upgrade, rescate post-abandono) antes del lanzamiento.
- Definir estrategia de retención post-boda y cross-sell hacia nuevas bodas o planners.
- Consolidar automatizaciones de rescate (downgrade, reintentos, ofertas personalizadas).

## 14. Límites por plan y rol
### Owner (pareja)
- `Gratis`: 1 boda activa, hasta 80 invitados y un único evento (ceremonia). Checklist básica, presupuesto manual y 5 diseños web con marca MaLoveApp. Sin exportaciones ni seating avanzado, sin asistentes adicionales ni IA.
- `Premium`: 1 boda premium con invitados ilimitados y hasta 3 eventos (ceremonia, cóctel, banquete). Seating avanzado, timeline con IA, documentos legales y automatizaciones email. Hasta 3 asistentes con permisos completos, portal web con 20 diseños, exportaciones PDF/Excel y soporte chat SLA 4h. Marca MaLoveApp sigue visible. El pago queda vinculado al `weddingId`; si se archiva la boda pasa a sólo lectura.
- `Premium Plus`: todo lo anterior más white-label total (web, PDFs, seating), concierge 1:1, integraciones externas (Google Calendar, Zapier), paquetes exclusivos de plantillas y hasta 10 asistentes. Incluye sesiones periódicas con especialistas. Cada nueva boda requiere nuevo pago.
- **Propietarios compartidos:** bodas con dos owners heredan el plan contratado; ambos comparten límites y permisos. Si se degrada la cuenta principal, ambos bajan de nivel; en modo sólo lectura post-boda mantienen acceso histórico.

### Wedding planner
- **Exploratorio:** acceso con datos demo para preparar onboarding, sin crear bodas reales ni acceder a módulos sensibles.
- **Plan Studio** (hasta 5 bodas simultáneas): prioridad en marketplace de planners, plantillas duplicables, checklist multi cliente y exportaciones ilimitadas. Las parejas gratis cubiertas por este plan quedan con cobro incluido vía planner.
- **Plan Studio Plus:** añade white-label parcial, concierge de proveedores, negociaciones preferentes y sesiones con especialistas; mantiene límite de 5 bodas, hasta 7 colaboradores.
- **Plan Agency** (hasta 10 bodas): suma analytics avanzados, reportes custom y automatizaciones multi cliente. Hasta 10 colaboradores y acceso completo al marketplace pro.
- **Plan Agency Plus:** agrega white-label total, integraciones API, onboarding personalizado y soporte dedicado SLA 2h.
- **Teams** (agencias grandes): bodas ilimitadas, planners ilimitados, dominio personalizado opcional, colaboración avanzada y mesa de ayuda dedicada 24/7.

### Assistant
- Sin plan propio; hereda nivel del owner.
- Bodas `Premium`: puede editar invitados, tareas, timeline y seating; sin permisos de facturación ni re-invitaciones. Limitado a una boda activa.
- Bodas `Premium Plus`: añade acceso al concierge, control de presupuesto con tracking de cambios y plantillas premium. Mantiene restricciones de facturación y límite a una boda simultánea.

---
**Versión:** 2025-10-13 · Responsable inicial: Producto & Growth
