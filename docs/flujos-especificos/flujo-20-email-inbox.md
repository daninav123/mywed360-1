# 20. Buzon Interno y Estadisticas (estado 2025-10-07)

> Implementado: `Buzon_fixed_complete.jsx` (legacy), `EmailInbox.jsx`, `EmailStatistics.jsx`, componentes `UnifiedInbox/InboxContainer.jsx`, `EmailComposer.jsx`, `EmailSetupForm.jsx`.
> Pendiente: consolidar experiencia unica, documentar APIs backend, onboarding centralizado y telemetry completa.

## 1. Objetivo y alcance
- Centralizar comunicaciones internas y seguimiento de emails enviados/recibidos desde la plataforma.
- Proveer bandeja de entrada, estadisticas y herramientas de composicion.
- Sustituir gradualmente el buzón legacy por la experiencia unificada.

## 2. Trigger y rutas
- Menú de usuario (avatar superior derecho) → “Buzón de Emails” (`/email`, `EmailInbox.jsx`).
- Desde el mismo menú se accede a `/email/estadisticas` (`EmailStatistics.jsx`) y `/email/setup` (`EmailSetup.jsx`).
- Enlaces contextuales (notificaciones, proveedores, invitados) deep-linkean a hilos específicos dentro de `/email`.

## 3. Paso a paso UX
1. Configuracion
   - Wizard `EmailSetupForm` valida dominio, remitente y pruebas de envio.
   - Seleccion de proveedor (Mailgun, SMTP personalizado) y almacenamiento de credenciales.
2. Uso diario
   - Bandeja principal con filtros por carpeta, busqueda avanzada, lectura rapida y etiquetas.
   - Composer con plantillas, adjuntos, variables (nombre invitado, enlace RSVP).
   - Integracion con RSVP y proveedores para enviar mensajes contextuales.
3. Analitica
   - `EmailStatistics.jsx` muestra envios, aperturas, rebotes y tendencias.
   - Segmentacion por campañas y tipos de mensaje.
   - Exportacion CSV para marketing/soporte (pendiente).

## 4. Persistencia y datos
- Firestore `weddings/{id}/emails/{emailId}`: headers, cuerpo, adjuntos, estado, etiquetas.
- `weddings/{id}/emailSettings`: configuracion SMTP, dominios verificados, estados de pruebas.
- `weddings/{id}/emailTemplates`: plantillas personalizadas.
- Logs en backend (`emailEvents`) para entregas, aperturas y rebotes.

## 5. Reglas de negocio
- Envio masivo requiere remitente verificado y limite diario configurado.
- Emails criticos (reset, invitaciones) no se pueden borrar hasta 30 dias.
- Adjuntos limitados a 5MB y formatos permitidos (PDF, JPG, PNG, DOCX).
- Roles: assistants pueden usar plantillas aprobadas; owner/planner gestiona settings.

## 6. Estados especiales y errores
- Sin configuracion -> banner "Configura el correo" con CTA al wizard.
- Error de envio -> mensaje en composer y reintento automatico si es `temporary_failure`.
- API sin respuesta -> mostrar modo solo lectura y cachear ultimos mensajes.
- Diferencias legacy/unified -> toggle temporal para usuarios migrando.

## 7. Integracion con otros flujos
- Flujo 3/9 para enviar recordatorios RSVP y seguimiento.
- Flujo 5 (proveedores) permite intercambio de propuestas y actualizaciones.
- Flujo 12 usa preferencias de notificacion.
- Flujo 20 se conecta con gamificacion (logros de comunicacion) y dashboard general.
- Flujo 21 reutiliza plantillas para sitio publico (contacto) cuando aplique.

## 8. Metricas y monitorizacion
- Eventos: `email_sent`, `email_failed`, `email_opened`, `email_bounced`.
- Indicadores: tasa de apertura, rebote, tiempo de respuesta, volumen por canal.
- Logs en observabilidad (Grafana/BigQuery) para latencia y errores por proveedor.

## 9. Pruebas recomendadas
- Unitarias: filtro de bandeja, parser de cabeceras, plantilla.
- Integracion: enviar email -> registrar evento -> actualizar estadisticas.
- E2E: configurar cuenta, enviar masivo, recibir respuesta simulada, revisar bandeja.


## Cobertura E2E implementada
- `cypress/e2e/email_inbox_smoke.cy.js`: smoke general de bandeja, sincronización y navegación.
- `cypress/e2e/email/read-email.cy.js y cypress/e2e/email/send-email.cy.js`: cubren lectura, respuestas y reenvío.
- `cypress/e2e/email/folders-management.cy.js y cypress/e2e/email/tags-filters.cy.js`: validan organización avanzada, carpetas y filtros.
- `cypress/e2e/compose_quick_replies.cy.js y cypress/e2e/email/smart-composer.cy.js`: prueban asistentes y respuestas rápidas integrados en la bandeja.

## 10. Checklist de despliegue
- Reglas Firestore para `emails`, `emailSettings`, `emailTemplates`.
- Configurar webhooks en Mailgun/SMTP y credenciales seguras.
- Revisar limites y politicas anti-spam (DKIM, SPF, DMARC).
- Plan de migracion desde buzón legacy con backups.

## 11. Roadmap / pendientes
- Unificar experiencia (retirar `Buzon_fixed_complete` una vez completado).
- Automatizaciones (drip campaigns, journeys multicanal) y IA de respuesta.
- Estadisticas avanzadas con comparativas por segmento.
- Plantillas compartidas y biblioteca colaborativa.
- Integracion con WhatsApp/Push para comunicaciones omnicanal.
