# 9. RSVP y Confirmaciones (estado 2025-10-07)

> Implementado: `RSVPConfirm.jsx`, `AcceptInvitation.jsx`, `RSVPDashboard.jsx`, hooks `useGuests`, servicios `rsvpService.js` y `emailAutomationService.js`.
> Pendiente: confirmaciones grupales avanzadas, recordatorios automaticos multi-canal, analytics detallados y integracion directa con catering.

## 1. Objetivo y alcance
- Gestionar el ciclo completo de confirmacion de asistencia para invitados y colaboradores.
- Permitir control de acompanantes, restricciones dieteticas y comentarios.
- Sincronizar el estado RSVP con listas de invitados, seating y comunicaciones.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Invitados** → "Gestión de invitados" (`/invitados`, render `Invitados.jsx`), desde donde se abre el modal "Resumen RSVP" (`RSVPDashboard.jsx`).
- Emails/WhatsApp a invitados contienen el enlace único `/rsvp/{token}` (renderiza `RSVPConfirm.jsx`).
- Invitaciones de colaboradores llegan por `/accept-invitation/:code` (`AcceptInvitation.jsx`).

## 3. Paso a paso UX
1. Envio de invitaciones
   - Generacion de tokens unicos para cada invitado o grupo familiar.
   - Plantillas de email con CTA "Confirmar asistencia" y codigo QR opcional.
   - Programacion de recordatorios segun fecha limite establecida.
2. Formulario de confirmacion (`RSVPConfirm.jsx`)
   - Carga datos del invitado desde token y muestra estado actual.
   - Campos: asistencia (si/no), acompanantes, nombres, restricciones dieteticas, comentarios, datos de contacto.
   - Validaciones: limite de acompanantes, formato email/telefono, token vigente.
3. Seguimiento interno (`RSVPDashboard.jsx`)
   - Widgets con totales confirmados, pendientes, declinados y acompanantes.
   - Tabla con filtros por estado, etiquetas y recordatorios enviados.
   - Acciones masivas: reenviar recordatorio, marcar manual, exportar CSV.

## 4. Persistencia y datos
- Firestore `weddings/{id}/rsvp/{rsvpId}`: estado, token, respuesta, metadata (timestamps, ip, canal).
- `weddings/{id}/guests/{guestId}`: sincroniza `status`, `companions`, restricciones, comentarios.
- `weddings/{id}/rsvpLogs`: historial de recordatorios y acciones manuales.
- Invitaciones de colaboradores en `weddings/{id}/invitations/{code}` con roles y expiracion.

## 5. Reglas de negocio
- Cada token solo puede usarse una vez; permite editar hasta la fecha limite configurada.
- Invitados corporativos o familiares pueden representar a varios asistentes (grupo controlado).
- Owners, planners y assistants pueden ajustar manualmente el estado RSVP desde la gestión interna; cada cambio queda auditado con usuario y timestamp.
- Colaboradores requieren email verificado antes de aceptar invitacion.

## 6. Estados especiales y errores
- Token invalido o expirado -> mensaje "Invitacion no valida" con CTA de contacto.
- Límite de acompanantes superado -> validacion inline.
- Error de red al enviar confirmacion -> mantener datos en memoria y permitir reintento.
- Dashboard sin datos -> CTA "Invita a tus primeros invitados".

## 7. Integracion con otros flujos
- Flujo 3 (Gestion de invitados) consume y actualiza estados RSVP.
- Flujo 4 (Seating) recibe listas de confirmados y acompanantes; cuando un invitado pasa a "declined"/"rejected", se libera automáticamente cualquier asiento asignado en los planos de banquete o ceremonia.
- Flujo 6 (Presupuesto) ajusta conteo de menus y estimaciones.
- Flujo 7/20 usan resultados para segmentar emails/buzon interno; el [Flujo 16](./flujo-16-asistente-virtual-ia.md) convierte confirmaciones en acciones automáticas.
- Flujos 11A/11B sincronizan aforo y orden de ceremonia; Flujo 11C ajusta checklist según confirmaciones, además de las tareas del flujo 14.

## 8. Metricas y monitorizacion
- Eventos: `rsvp_invitation_sent`, `rsvp_completed`, `rsvp_declined`, `rsvp_reminder_sent`.
- Indicadores: tasa de respuesta, tiempo medio de confirmacion, recordatorios necesarios por invitado.
- Logs para detectar tokens no entregados o altas tasas de error por canal.

## 9. Pruebas recomendadas
- Unitarias: validadores de acompanantes, generacion de token, servicios de recordatorio.
- Integracion: confirmar invitado -> verificar actualizacion en `guests` y dashboard.
- E2E: flujo completo desde envio de invitacion, confirmacion web, verificacion en seating.


## Cobertura E2E implementada
- `cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js, cypress/e2e/rsvp/rsvp_invalid_token.cy.js y cypress/e2e/rsvp/rsvp_reminders.cy.js`: prueban confirmaciones por enlace, manejo de tokens inválidos y recordatorios automatizados.
- `cypress/e2e/rsvp/rsvp_confirm.cy.js y cypress/e2e/invitaciones_rsvp.cy.js`: validan la experiencia completa de RSVP y envío de invitaciones digitales.

## 10. Checklist de despliegue
- Reglas Firestore para colecciones `rsvp`, `rsvpLogs`, `invitations` con seguridad por rol.
- Configurar `MAILGUN_*`, `WHATSAPP_PROVIDER` (si aplica) y plantillas de email con enlaces tracking.
- Revisar copy y traducciones para formulario y estados.
- Validar expiraciones de token y reintentos en ambientes de staging.

## 11. Roadmap / pendientes
- Confirmaciones grupales mas flexibles (familias, corporate) con panel dedicado.
- Recordatorios multi-canal automáticos y programacion inteligente por segmentos.
- Tablero de analytics con conversion por canal y motivos de declinacion.
- Integracion directa con proveedores de catering para menus y alergias.
- Automatizar mensajes de follow-up tras la boda (agradecimientos).
