# 12. Notificaciones y Configuración (estado 2025-10-07)

> Implementado: `Notificaciones.jsx`, `NotificationPreferences.jsx`, `NotificationWatcher.jsx`, `NotificationCenter.jsx` (scaffold), servicios `notificationService.js`, `notificationPreferencesService.js`, rutas backend `/api/notification-preferences`.
> Pendiente: automatizaciones avanzadas (AutomationRules UI), notificaciones push/SMS completas y centro de notificaciones final.

## 1. Objetivo y alcance
- Centralizar notificaciones del sistema y preferencias por usuario/canal.
- Configurar qué eventos generan alertas y cómo se entregan.
- Ofrecer watcher que detecta eventos relevantes y dispara notificaciones.

## 2. Trigger y rutas
- Icono de campana (barra superior) abre el centro de notificaciones (`/notificaciones`, `Notificaciones.jsx`).
- Menú de usuario → “Preferencias de notificación” (`/perfil/notificaciones`, `NotificationPreferences.jsx`).
- API pública `/api/notification-preferences` expuesta para integraciones y apps móviles.

## 3. Paso a paso UX
1. Centro de notificaciones
   - `Notificaciones.jsx` muestra lista cronológica, filtros (tipo, leídas), acciones marcar/archivar.
   - `NotificationCenter.jsx` sirve como scaffold para entornos dev.
2. Preferencias
   - `NotificationPreferences.jsx` permite toggles por canal (email, push, WhatsApp) y categorías (tareas, RSVP, finanzas, sistema).
   - Soporta digest diario/semanal (en backend).
3. Watcher y automatizaciones
   - `NotificationWatcher.jsx` escucha eventos (Firestore/automation) y encola notificaciones.
   - Integrado con hooks de tareas, RSVP, proveedores.

## 4. Persistencia y datos
- Firestore `weddings/{id}/notifications/{notificationId}`: tipo, payload, estado, metadata.
- `users/{uid}/notificationPreferences`: canales y digest.
- Log de envíos en backend (`notification_logs`).

## 5. Reglas de negocio
- Notificaciones críticas (pagos, seguridad) siempre envían email aunque se deshabilite canal.
- Assistants reciben notificaciones solo de bodas donde tienen acceso.
- Cambiar preferencias requiere autenticación (token) y se audita.
- Digest respeta frecuencia configurada; se almacena timestamp último envío.

## 6. Estados especiales y errores
- Sin notificaciones → mensaje "No tienes notificaciones nuevas".
- Error al guardar preferencia → toast y rollback estado toggle.
- Canal inhabilitado (ej. WhatsApp sin proveedor) → UI muestra aviso.
- Watcher sin permisos → log en consola y modo no intrusivo.

## 7. Integración con otros flujos
- Flujo 5/15 generan notificaciones por contratos y proveedores.
- Flujo 6 envía alertas de presupuesto.
- Flujo 9/11 informan confirmaciones y ensayos.
- Flujo 14/17 se integran para recordatorios de tareas/gamificación.
- Flujo 7 respeta preferencias de canal; el [Flujo 24](./flujo-24-orquestador-automatizaciones.md) aplica la configuración al ejecutar automatizaciones.

## 8. Métricas y monitorización
- Eventos: `notification_sent`, `notification_read`, `notification_preference_updated`, `digest_generated`.
- Indicadores: ratio de apertura, tiempos de respuesta, top categorías.
- Logs de fallos por canal (Mailgun/Twilio) y backlog del watcher.

## 9. Pruebas recomendadas
- Unitarias: guardado de preferencias, mapeo de reglas del watcher.
- Integración: disparar evento (tarea vencida) → verificar notificación generada y preferencia aplicada.
- E2E: usuario actualiza preferencias, recibe digest/alertas, revisa centro y marca como leído.

## 10. Checklist de despliegue
- Reglas Firestore para `notifications`, `notificationPreferences`.
- Credenciales `MAILGUN_*`, `TWILIO_*`, `WHATSAPP_PROVIDER` según canales.
- Cron jobs/digest configurados en backend.
- Revisar copy/translations.

## 11. Roadmap / pendientes
- AutomationRules UI (if-this-then-that) para usuarios avanzados.
- Centro de notificaciones con agrupación y búsqueda.
- Push notifications (FCM) y SMS avanzados.
- Insights de efectividad (CTR, canales preferidos).
- Modo silencio programable por usuario.
