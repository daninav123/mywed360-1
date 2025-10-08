# 24. Orquestador IA de Automatizaciones (estado 2025-10-08)

> Implementado: servicios base `emailAutomationService.js`, `EmailTemplateService.js`, hooks `useProviderEmail`, `useAIProviderEmail`, tracking (`EmailTrackingService.js`), conectores de tareas/proveedores.  
> Pendiente: daemon de colas programadas, unificación multicanal (chat/WhatsApp/push), panel de auditoría, reglas configurables por usuario, test E2E integrados.

## 1. Objetivo y alcance
- Centralizar la interpretación de mensajes entrantes (email, chat, WhatsApp, push) y decidir acciones automáticas.
- Reutilizar plantillas IA para generar respuestas coherentes y consistentes entre canales.
- Orquestar actualizaciones en módulos críticos (proveedores, finanzas, tareas, timeline) sin intervención manual.

## 2. Triggers y rutas
- Eventos entrantes:
  - Email nuevo: disparado por `emailAutomationService.processIncomingEmails`.
  - Mensaje chat: hook `useChatAutomation` (pendiente) + webhooks de IA conversacional.
  - Webhooks externos (Mailgun, Twilio, FCM) → endpoint `/api/automation/events`.
- UI de referencia: se monitoriza desde `EmailSettings.jsx` (cola programada) y futuros paneles en `/automation`.

## 3. Paso a paso UX (nivel sistema)
1. **Ingesta**
   - El canal (email/chat) normaliza el mensaje y lo envía a `AutomationOrchestrator.handleEvent`.
2. **Clasificación IA**
   - Se obtienen etiquetas sugeridas (`Proveedor`, `Finanzas`, `RSVP`) y prioridad.
   - Se determinan acciones candidatas: responder, crear tarea, actualizar tablero proveedor, avisar por push.
3. **Ejecución**
   - Si la acción requiere respuesta automática → usa `EmailTemplateService` o plantillas chat y envía con `useProviderEmail/sendMail`.
   - Se crean entradas en servicios: `SupplierKanban`, `Tasks`, `Finance`.
4. **Seguimiento**
   - Se registra la acción en `EmailTrackingService` u otra tabla `automationLogs`.
   - El usuario puede revisar desde el panel (pendiente) y revertir si es necesario.

## 4. Persistencia y datos
- `automationLogs` (colección) para auditar eventos, acciones tomadas, autor (IA vs humano).
- `automationRules` (por usuario/organización) define condiciones y plantillas personalizadas.
- Cola programada (`mywed360.email.automation.schedule` en localStorage/Firestore) para envíos diferidos y recordatorios.

## 5. Reglas de negocio
- Toda acción automática debe poder deshacerse (guardar `undoPayload`).
- Respuestas automáticas se limitan si el remitente aparece en `autoReply.excludeSenders`.
- IA no confirma contratos ni pagos; genera tareas de verificación o envía borradores.
- Prioridad: mensajes urgentes → notificación inmediata + registro en timeline.

## 6. Estados especiales y errores
- **Fallo IA** → se registra y se deja el mensaje en cola manual.
- **Falta de credenciales** → se notifica en `EmailSettings` (banner “Configura tu remite”).
- **Cola saturada** → se degrada a resumen diario (push/email) en lugar de acciones individuales.

## 7. Integración con otros flujos
- Flujo 7 (Emails): provee mensajes y UI de revisión; recibe etiquetas/acciones aplicadas.
- Flujo 5 (Proveedores IA): se alimenta con respuestas automáticas y actualiza kanban.
- Flujo 12 (Notificaciones): distribuye avisos generados por automatizaciones.
- Flujo 17 (Gamificación): suma puntos por acciones completadas automáticamente tras validación.
- Futuro: Flujo chat (pendiente) compatibiliza plantillas y colas.

## 8. Métricas y monitorización
- KPIs: ratio de acciones automatizadas vs manuales, tiempo medio de respuesta IA, tasa de reversión.
- Monitoreo: dashboards (BigQuery/Grafana) con breakdown por canal y módulo afectado.
- Alertas: si >10% de automatizaciones fallan en una hora → notificación a soporte.

## 9. Pruebas recomendadas
- Unitarias: `AutomationOrchestrator`, generadores de plantillas, normalizadores de eventos.
- Integración: ingestión email → creación tarea proveedor; chat → respuesta automática.
- E2E: flujo proveedor (botón “Solicitar presupuesto”) validando envío + tracking; escenario programado → envío diferido.

## 10. Checklist de despliegue
- Variables de entorno para IA (`VITE_ENABLE_DIRECT_OPENAI`, claves modelos chat/email).
- Webhooks configurados (Mailgun, Twilio, FCM) apuntando a `/api/automation/events`.
- Feature flag `ENABLE_AUTOMATION_ORCHESTRATOR` habilitado por entorno.
- Plan de rollback (desactivar flag + limpiar colas pendientes).

## 11. Roadmap / pendientes
- Panel de auditoría con filtros y opción de revertir acciones.
- Motor de reglas configurable por usuario (if/then).
- Integración con chat en tiempo real y WhatsApp bridging.
- Server worker o Cloud Function para procesar la cola sin depender del cliente.
- Aprendizaje activo: sugerir ajustes de reglas según feedback del usuario.

