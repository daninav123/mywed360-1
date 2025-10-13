# 22. Navegacion y Panel General (estado 2025-10-07)

> Implementado: `Home.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnostico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
> Pendiente: unificar dashboard con metricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronizacion.

## 1. Objetivo y alcance
- Ofrecer panel de control central con accesos rapidos a modulos y resumen de estado.
- Gestionar navegacion global, perfil del usuario y recursos de soporte.
- Facilitar diagnostico en ambientes internos con herramientas de seed (solo dev).

## 2. Trigger y rutas
- Menú inferior → pestaña **Inicio** (`/home`, `Dashboard.jsx`) como landing por defecto.
- Menú inferior → `Más` (`/more`, `More.jsx`) muestra accesos a invitados, proveedores, protocolo y extras.
- Menú de usuario → `/perfil` (`Perfil.jsx`) para preferencias, idioma, plan y seguridad.

## 3. Paso a paso UX
1. Dashboard principal
   - Widgets configurables (progreso checklist, presupuesto, invitados, timeline, comunicacion).
   - CTA destacados (crear boda, invitar colaboradores, personalizar sitio, configurar email).
   - Estado del plan (free/premium) y banners de actualizacion.
2. Navegacion secundaria
   - Menu lateral/encabezado con accesos a todos los flujos.
   - `More.jsx` agrupa enlaces secundarios: soporte, tutoriales, FAQ, comunidad.
   - Buscador global (pendiente). Nota 2025-10-12: el componente `GlobalSearch` solo aparece en desktop (header) y se abre con botón, sin atajos (Ctrl/Cmd+K).
3. Perfil y configuraciones
   - Actualizar datos personales, idioma, zona horaria y opciones de privacidad.
   - Gestion de sesiones activas y cierre de sesion forzado.
   - Opt-in para planner/assistant (pendiente) y preferencias de notificaciones.

## 4. Persistencia y datos
- Firestore `users/{uid}`: perfil, roles, preferencias, estado de plan.
- `userSettings/{uid}` (plan) para configuraciones adicionales.
- Configuracion de widgets en `users/{uid}/dashboardConfig`.
- Logs de actividad en `weddings/{id}/activityFeed` mostrados en dashboard (cuando se habilite).

## 5. Reglas de negocio
- Dashboard debe reflejar boda activa (`WeddingContext.activeWeddingId`).
- Herramientas dev visibles solo en entornos autorizados (flag `VITE_ENABLE_DEV_TOOLS`).
- Perfil solo editable por owner/planner; assistants ven informacion limitada.
- Cambios de plan requieren confirmacion y sincronizacion con billing.

## 6. Estados especiales y errores
- Sin boda activa -> mostrar wizard onboarding (Flujo 2).
- Faltan permisos -> ocultar modulos y mostrar mensaje "No tienes acceso a...".
- Error al cargar widgets -> fallback cards con opcion de reintentar.
- Carga inicial muestra skeletons para evitar flash de contenido.

## 7. Integracion con otros flujos
- Consume estadisticas de flujos 3,4,6,9,14,17 para widgets.
- Accesos directos disparan wizards (Crear boda, Configurar email, Generar sitio web).
- Perfil sincroniza preferencias de notificacion (Flujo 12) y gamificacion (Flujo 17).
- Herramientas dev ayudan a testear flujos de invitados/finanzas.

## 8. Metricas y monitorizacion
- Eventos: `dashboard_widget_clicked`, `dashboard_widget_hidden`, `profile_updated`, `more_menu_opened`.
- Indicadores: recurrencia de visitas al dashboard, widgets mas usados, tasa de conversion de CTA.
- Monitoreo de errores de carga de widgets y latencia en agregados.

## 9. Pruebas recomendadas
- Unitarias: composicion de widgets, permisos de menu, hooks de perfil.
- Integracion: cambio de boda -> dashboard refleja datos correctos.
- E2E: onboarding -> dashboard -> configurar perfil -> acceder a more menu.


## Cobertura E2E implementada
- No hay pruebas end-to-end específicas implementadas para este flujo.

## 10. Checklist de despliegue
- Reglas Firestore para `dashboardConfig`, `activityFeed` (cuando se publique).
- Asegurar que herramientas dev esten desactivadas en produccion (`VITE_ENV` check).
- Revisar copy, links de soporte y recursos externos.
- Probar skeleton/loading states con datos grandes.

## 11. Roadmap / pendientes
- Dashboard modular con edicion drag-and-drop y biblioteca de widgets.
- Activity feed en tiempo real con filtros.
- Buscador global y comandos rapidos.
- Integracion con analytics para recomendaciones personalizadas.
- Panel de salud del sistema (sincronizacion, errores recientes).

## 12. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- `HomePage.jsx` muestra el progreso de checklist y la información de `GamificationPanel` dentro de la misma tarjeta, ocultando el panel cuando no hay datos de gamificación disponibles; aún carece de widgets configurables o métricas en vivo.
- `Dashboard.jsx` funciona con widgets drag-and-drop pero la aplicación no navega a este layout por defecto (landing usa `HomePage`).
- `GlobalSearch` requiere click manual; no hay shortcuts ni resultados mockeados para tests.
- Herramientas de diagnóstico (`DevEnsureFinance`, `DevSeedGuests`) están ocultas en builds por defecto; no hay panel único ni métricas UI visibles.

### Experiencia mínima a construir
- Definir vista principal (Home vs Dashboard) y asegurar ruta con contenido testable (widgets con `data-testid`).
- Exponer menú o botón para abrir herramientas de diagnóstico con métricas básicas (ej. totales finance/guests) visibles en DOM.
- Añadir shortcut accesible (`Ctrl/Cmd+K`) para `GlobalSearch` y resultados deterministas en modo E2E.
- Identificar breadcrumbs o breadcrumbs virtuales (`data-testid="breadcrumb"`) en cada navegación crítica (Home, Tasks, Finance, More).

### Criterios de prueba E2E propuestos
1. `main-navigation`: tocar botones Home → Tasks → Finance → More comprobando highlight activo y breadcrumb actualizado.
2. `global-search-shortcuts`: enviar `cy.realPress(['ctrl','k'])`, escribir término mock y navegar al primer resultado asegurando ruta correcta.
3. `diagnostic-panel`: abrir panel dev, validar presencia de métricas (`data-testid="diag-total-guests"` etc.) y cerrarlo.

### Dependencias técnicas
- Helper Cypress (`cy.openGlobalSearch()`) que simule atajo; requiere listeners en `GlobalSearch`.
- Fixtures o MSW para popular `GlobalSearch` y widgets sin depender de Firestore real.
- Flag `VITE_ENABLE_DEV_TOOLS` expuesto en entorno de prueba para mostrar panel de diagnóstico.
