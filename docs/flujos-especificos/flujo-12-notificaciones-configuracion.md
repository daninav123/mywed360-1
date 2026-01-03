# 12. Notificaciones y Configuración (estado 2025-10-07)

> Implementado: `Notificaciones.jsx`, `NotificationPreferences.jsx`, `NotificationWatcher.jsx`, `NotificationCenter.jsx` (scaffold), servicios `notificationService.js`, `notificationPreferencesService.js`, rutas backend `/api/notification-preferences`.
> Pendiente: automatizaciones avanzadas (AutomationRules UI), notificaciones push/SMS completas y centro de notificaciones final.

## 1. Objetivo y alcance
- Mostrar el centro de notificaciones in-app e indicar qué acciones requieren revisión.
- Permitir que cada usuario configure canales (email, push, WhatsApp) y categorías que desea recibir.
- Ejecutar watchers (`NotificationWatcher`, `TaskNotificationWatcher`) que disparan eventos periódicos.

## 2. Trigger y rutas
- Icono de campana en la barra superior -> `/notificaciones` (`Notificaciones.jsx`) por ahora listado sencillo + `NotificationSettings`.
- Menú del avatar → “Preferencias de notificación” (`/perfil/notificaciones`, `NotificationPreferences.jsx` con toggles por canal/categoría).
- API `/api/notification-preferences` para integraciones externas.

## 3. Paso a paso UX
1. Centro de notificaciones (`Notificaciones.jsx`)
   - Lista cronológica con filtros “Todas/Sin leer”.
   - Botones para marcar como leída y eliminar.
   - Botones de push (activar/desactivar/probar) mediante `PushService`.
2. Preferencias (vista legacy)
   - `NotificationSettings` en la misma página: toggles por categoría (email/AI/tareas/proveedores/finanzas), horas de silencio (`quietHours`) y preview del estado.
3. Preferencias (nueva)
   - `NotificationPreferences.jsx`: switches por canal y categoría; persiste en `notificationPreferencesService`.
4. Watchers
   - `NotificationWatcher` (en `MainLayout`) consulta periódicamente el backend.
   - `TaskNotificationWatcher` dispara recordatorios de tareas (flujo 14).

## 4. Persistencia y datos
- Firestore `weddings/{id}/notifications/{notificationId}`: payload básico, estado leído.
- `users/{uid}/notificationPreferences`: canales y categorías + horario silencioso.
- LocalStorage (`MaLove.App-notifications`) usado para evitar duplicidades en modo offline.
- Logs backend (Mailgun/Twilio) para fallos push/email.

## 5. Reglas de negocio
- Eventos críticos (pagos, seguridad) se fuerzan vía email aunque se deshabilite canal.
- Assistants sólo ven notificaciones de bodas con acceso.
- Horario silencioso bloquea notificaciones push (`isQuietHoursActive`).
- Las preferencias se guardan en local y backend; se audita `updatedAt`.

## 6. Estados especiales y errores
- Sin notificaciones → mensaje “No hay notificaciones”.
- Error guardando → toast + rollback (`saveNotificationPrefs`).
- Push deshabilitado → banner/alerta indicando configurar en navegador.
- Watcher sin permisos → log `console.warn`, no rompe UI.

## 7. Integración con otros flujos
- Flujo 5 y 15 (proveedores/contratos): envían alertas de presupuesto/estado.
- Flujo 6 (finanzas): pagos/pendientes generan avisos.
- Flujo 9/11 (RSVP/ceremonia): recordatorios.
- Flujo 14 (tareas): integra con `TaskNotificationWatcher`.
- Flujo 17 (gamificación) usa preferencias para no saturar con avisos.
- Flujo 16 (automatizaciones) previsto para respetar configuraciones.

## 8. Métricas y monitorización
- Eventos básicos: `notification_sent`, `notification_read`, `notification_preferences_saved`.
- Indicadores: ratio de lectura, uso de push, categorías más activas.
- Logs Mailgun/Twilio/FCM para errores.

## 9. Pruebas recomendadas
- Unitarias: servicios (`notificationService`, `notificationPreferencesService`).
- Integración: Notificaciones + PushService (activar/desactivar).
- E2E: marcar como leída/borrar, cambiar preferencias, verificar persistencia.


## Cobertura E2E implementada
- `cypress/e2e/notifications/preferences-flow.cy.js`: prueba la edición de preferencias, canales disponibles y persistencia de configuraciones.

## 10. Checklist de despliegue
- Reglas Firestore `notifications` y `notificationPreferences`.
- Configurar Mailgun/Twilio/FCM; validar push en navegadores.
- Revisar traducciones (todas las opciones en `NotificationSettings` y `NotificationPreferences`).

## 11. Roadmap / pendientes
- Centro de notificaciones completo (agrupaciones, búsqueda).
- Automation rules UI (if-this-then-that).
- Integración multi-canal (SMS/push con configuración avanzada).
- Panel de auditoría y métricas ( CTR, canal favorito/efectividad ).
