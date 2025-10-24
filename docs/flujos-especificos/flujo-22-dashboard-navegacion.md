# 22. Navegacion y Panel General (estado 2025-10-07)

> Implementado: `HomeUser.jsx`, `Dashboard.jsx`, `More.jsx`, `Perfil.jsx`, widgets `WidgetContent.jsx`, utilidades de diagnostico (`DevEnsureFinance.jsx`, `DevSeedGuests.jsx`).
> Pendiente: unificar dashboard con metricas en vivo, proteger herramientas internas y agregar actividad reciente + estado de sincronizacion.

## 1. Objetivo y alcance
- Ofrecer panel de control central con accesos rapidos a modulos y resumen de estado.
- Gestionar navegacion global, perfil del usuario y recursos de soporte.
- Facilitar diagnostico en ambientes internos con herramientas de seed (solo dev).
- Mostrar la “Salud del perfil” y mapa de preferencias (core vs contrastes) aprovechando datos del flujo 2C, guiando a la pareja con CTA proactivos.

## 2. Trigger y rutas
- Menú inferior → pestaña **Inicio** (`/home`, `Dashboard.jsx`) como landing por defecto.
- Menú inferior → `Más` (`/more`, `More.jsx`) muestra accesos a invitados, proveedores, protocolo y extras.
- Menú de usuario → `/perfil` (`Perfil.jsx`) para preferencias, idioma, plan y seguridad.

## 3. Paso a paso UX
1. Dashboard principal
   - Widgets configurables (progreso checklist, presupuesto, invitados, timeline, comunicacion) más nuevos módulos `Mapa de preferencias` y `Salud del perfil` (StyleMeter, alertas de contraste, gaps).
   - CTA destacados (crear boda, invitar colaboradores, personalizar sitio, configurar email) complementados con sugerencias IA contextuales (“Confirmar speakeasy”, “Completar perfil”).
   - Estado del plan (free/premium) y banners de actualizacion.
   - Tarjetas numéricas de resumen (ver detalle más abajo) para invitados confirmados, presupuesto, proveedores y tareas.
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
- Widget `Mapa de preferencias` solo aparece si existe `weddingInsights.styleWeights`; de lo contrario muestra CTA para completar el perfil.
- Herramientas dev visibles solo en entornos autorizados (flag `VITE_ENABLE_DEV_TOOLS`).
- Perfil solo editable por owner/planner; assistants ven informacion limitada.
- Cambios de plan requieren confirmacion y sincronizacion con billing.

## 6. Estados especiales y errores
- Sin boda activa -> mostrar wizard onboarding (Flujo 2).
- Faltan permisos -> ocultar modulos y mostrar mensaje "No tienes acceso a...".
- Error al cargar widgets -> fallback cards con opcion de reintentar.
- Carga inicial muestra skeletons para evitar flash de contenido.

## 7. Integracion con otros flujos
- Consume estadísticas de flujos 2C,3,4,5,6,7,9,14,17 para widgets (mapa de preferencias, checklist, presupuesto, comunicación).
- Accesos directos disparan wizards (Crear boda, Configurar email, Generar sitio web).
- Widget “Salud del perfil” abre directamente el flujo 2C para resolver `profileGaps`, `style_balance_alert` y contrastes pendientes.
- Perfil sincroniza preferencias de notificacion (Flujo 12) y gamificacion (Flujo 17).
- Herramientas dev ayudan a testear flujos de invitados/finanzas.

### Tarjetas de metricas en Home (`HomePage.jsx`)

| Tarjeta | Que muestra | Fuente de datos actual | Destino final esperado | Notas |
|---------|-------------|------------------------|------------------------|-------|
| Invitados confirmados | Numero de invitados con `status/response = "confirmado"` | `localStorage.mywed360Guests` (seed de QA) | `weddings/{id}/guests` (Firestore) con agregados `guestsStats.confirmed` | Para planner/assistant aparece en 3.er lugar; para owners es la primera tarjeta. |
| Presupuesto gastado | `totalSpent` y, si existe, `totalBudget` (`gastado / presupuesto`) | `useFinance().stats` (lee `weddings/{id}/finance/main`) | Mismo hook, pero con datos en vivo post migraciones (CSV/Excel, contribuciones) | Formatea con `toLocaleString`; cuando no hay presupuesto, solo muestra el monto gastado. |
| Proveedores contratados | Proveedores habilitados frente a objetivo (`asignados / totalNecesario`) | `localStorage.lovendaProviders` (seed) con total fijo `8` | Subcoleccion `weddings/{id}/suppliers` + metas configurables por plan | Ordenada segundo para owners; planners ven "Proveedores asignados" (solo numero). |
| Tareas completadas | Tareas marcadas como hechas frente al total (`completadas / totales`) | `localStorage.tasksCompleted`, `localStorage.mywed360Meetings`, `localStorage.lovendaLongTasks` | `weddings/{id}/tasks` con agregados (`tasksStats.completed/total`) | Los planners ven "Tareas asignadas" (totales) + esta tarjeta en puesto cuarto. |

- Todas las tarjetas comparten el mismo tratamiento visual (`Card` con icono lucide e incremento hover).
- Actualmente no son clicables; la iteración siguiente enlazará cada tarjeta con su módulo (`/invitados`, `/finance`, `/proveedores`, `/tasks`).
- Cuando faltan datos, se renderiza `0` (o `0 / 0`). Al conectar con Firestore, se sustituirá el fallback `localStorage` por consultas reales y se añadirán estados vacíos descriptivos.

### Acciones rápidas (HomePage)

| Botón | Acción | Comportamiento actual | Persistencia provisional | Observaciones |
|-------|--------|-----------------------|--------------------------|---------------|
| Buscar proveedor | Abre `ProviderSearchModal`, permite buscar por servicio/presupuesto y seleccionar un resultado. | Guarda el proveedor elegido en `localStorage.lovendaProviders`, emite `mywed360-providers` y muestra `toast.success`. | Migrará a `weddings/{id}/suppliers` con seeds propios. | Se eliminó el CTA “Ir a proveedores”; todo sucede dentro del modal. |
| Añadir invitado | Captura nombre, parte y contacto en un formulario liviano. | Inserta el registro en `localStorage.mywed360Guests` y muestra `toast.success`. | Futuro: creación directa en `weddings/{id}/guests`. | No redirige; pensado para alta rápida. |
| Añadir movimiento | Permite registrar concepto, monto, fecha y tipo. | Guarda en `localStorage.quickMovements`, dispara `toast.success`. | Evolucionará a `finance/main.movements` o `finance/main/transactions`. | Mantiene compatibilidad con seeds de QA. |
| Nueva nota | Editor breve para ideas rápidas. | Guarda en `localStorage.lovendaNotes` y confirma con `toast.success`. | Destino futuro `weddings/{id}/ideas`/`notes`. | Sin navegación adicional. |

- Los botones ya no ofrecen atajos “Ir a …”; cada acción se resuelve en el mismo modal.  
- En caso de error de almacenamiento se lanza `toast.error` (p.ej., proveedor sin guardarse) y se deja rastro en consola para debugging.  
- Estas acciones rápidas sirven como atajos operativos; la gestión completa sigue disponible en los módulos dedicados a través de la navegación principal.

### Barra de progreso (Gamification + timeline)

- **Archivo**: `HomePage.jsx`, seccion `progressPercent` y helper `computeExpectedProgress`.
- **Datos que consume**:
  - `getGamificationSummary({ uid, weddingId })` → devuelve puntos acumulados; se normalizan dividiendo entre `PROGRESS_COMPLETION_TARGET = 2500` para obtener porcentaje (`clampPercent`).
  - Fecha objetivo de la boda (`weddingDate`, `date`, `eventDate` o `ceremonyDate`) y punto de inicio (`planningStart`, `planningStartDate`, `projectStart`, `onboardingCompletedAt`). Si no hay fechas válidas se usa `eventDate - 365 días` como inicio.
- **Persistencia**: el porcentaje calculado se guarda en `localStorage.maloveapp_progress` como fallback cuando no hay conexión (el texto “No pudimos sincronizar el avance” usa este valor).
- **Estados visuales**:
  - `success`: percent ≥ 100 o >5 puntos por encima del progreso esperado.
  - `warning`: dentro del rango ±5 del progreso esperado.
  - `destructive`: más de 5 puntos por debajo del esperado o sin referencia temporal con progreso bajo.
- **Mensajes**:
  - `Vas adelantado al plan previsto` / `Revisa tareas clave para ponerte al día` / `Progreso sin referencia temporal`.
  - Cuando `expectedProgress` es `null` (no hay fechas) se oculta la comparación “Esperado: X%”.
- **Siguientes pasos**: migrar el cálculo de puntos al backend (GamificationService) y exponer endpoints con metas diferenciadas por plan. Añadir CTA contextual (abrir checklist, sugerir tareas) cuando se detecte retraso.

## 8. Metricas y monitorizacion
- Eventos: `dashboard_widget_clicked`, `dashboard_widget_hidden`, `profile_updated`, `more_menu_opened`, `dashboard_stylemeter_alert_opened`, `dashboard_preference_pack_clicked`.
- Indicadores: recurrencia de visitas al dashboard, widgets mas usados, tasa de conversion de CTA, ratio de resolucion de `profileGaps` y tiempo medio en cerrar alertas de contraste.
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



