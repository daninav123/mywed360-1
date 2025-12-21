# 29. Upgrade de Rol (Owner → Assistant → Planner) (estado 2025-10-13)

> Implementado: selector de rol en registro (`src/components/auth/RegisterForm.jsx:56`), persistencia local del rol en `useAuth` (`src/hooks/useAuth.jsx:180`, `src/hooks/useAuth.jsx:593`), navegación y dashboard condicionados por rol (`src/components/Nav.jsx:29`, `src/components/HomePage.jsx:77`), vínculos de bodas por rol en `WeddingService` (`src/services/WeddingService.js:144`, `src/services/WeddingService.js:487`, `src/services/WeddingService.js:510`), invitaciones desde `WeddingAccountLink.jsx:59` y aceptación `WeddingAccountLink.jsx:79`.
> Pendiente: flujo unificado de upgrade con checkout de plan, sincronización Firestore/localStorage del nuevo rol, límites de bodas por plan, degradación automática al expirar el plan y panel de gestión para revertir cambios.

## 1. Objetivo y alcance
- Permitir que cualquier cuenta comience como owner (rol `particular`/`owner`) y pueda subir de plan a `assistant` (apoya una boda) o `planner` (gestiona portafolio).
- Orquestar la actualización de rol en UI, perfil (`users/{uid}`), subcolecciones `users/{uid}/weddings` y arrays `weddings/{id}` (`ownerIds`, `assistantIds`, `plannerIds`).
- Garantizar que la navegación, dashboards y permisos reflejan el nuevo rol inmediatamente tras el upgrade, incluyendo acceso al mapa de preferencias y salud del perfil para planners/assistants.

## 2. Trigger y rutas
- **Inicio**: botón “Mejorar mi plan” desde Perfil (`src/pages/Perfil.jsx:282`) o CTA en `More` → sección planes (pendiente añadir).
- **Registro**: selección inicial de rol en `RegisterForm.jsx` sigue funcionando, pero el upgrade debe permitir cambiarlo a posteriori desde la misma cuenta.
- **Automático**: al aceptar invitación de otra boda como planner/assistant (`WeddingAccountLink.jsx:79`) se notifica al usuario que requiere upgrade si su plan actual no cumple.

## 3. Paso a paso UX
### 3.1 Owner → Assistant
1. Usuario owner abre Perfil > bloque de suscripción y elige “Plan Ayudante”.
2. Modal `RoleUpgradeModal` muestra beneficios, precio y detalla que podrá ayudar en 1 boda ajena. CTA “Continuar” inicia checkout (Stripe/RevenueCat TBD).
3. Tras pago exitoso, `updateUserProfile` escribe `{ role: 'assistant', subscription: { tier: 'assistant', renewedAt } }` y se sincroniza a Firestore (`users/{uid}`) y localStorage (`MaLoveApp_user_profile`).
4. El dashboard muestra resumen rápido del perfil de la boda (`stylePrimary`, `specialInterests`, `profileGaps`) para que el assistant conozca el contexto antes de aceptar invitaciones.
5. El usuario recibe instrucciones para solicitar invitación; `WeddingAccountLink` añade campo “Código de invitación” visible para assistants.
6. Al introducir código, se llama `acceptInvitation(code)` (`src/services/WeddingService.js:510`) y se agrega el uid a `assistantIds`. Se crea/actualiza enlace en `users/{uid}/weddings/{weddingId}` con rol `assistant`.
7. `WeddingContext` detecta la nueva entrada y actualiza `activeWedding`. Nav pasa a layout assistant (`src/components/Nav.jsx:69`), sin acceso a finanzas.

### 3.2 Assistant → Planner (o Owner → Planner)
1. Desde Perfil, el usuario elige “Plan Wedding Planner” (tier `wedding_planner_*` de `docs/planes-suscripcion.md:55`).
2. Modal muestra límites del plan (5/10/8 bodas según tier) y acceso al `PlannerDashboard`.
3. Tras checkout, se persiste `{ role: 'planner', subscription: { tier: 'wedding_planner_1|2|teams' } }`. También se inicializa `plannerWeddingIds` en `users/{uid}`.
4. `WeddingContext` recarga la subcolección `users/{uid}/weddings` (se necesitará migración para incluir bodas actuales como planner). Nav cambia al esquema planner (`src/components/Nav.jsx:29`) y `/home` monta `PlannerDashboard` (`src/components/HomePage.jsx:293`).
5. El planner ve widgets adicionales: mapa de preferencias consolidado, salud del perfil por boda y alertas de contraste para priorizar follow-ups.
6. El planner puede:
   - Crear nuevas bodas con `createWedding(uid, extraData)` (`src/services/WeddingService.js:144`), que añade el id a `plannerWeddingIds` y `users/{uid}/weddings`.
   - Conectarse a bodas existentes vía `addPlannerToWedding` (`src/services/WeddingService.js:616`) o invitaciones.
6. Cada boda nueva marca `creatorRole: 'planner'` para habilitar permisos de archivo, administración y métricas multi boda.

### 3.3 Downgrade / Reversión (pendiente)
- UI debe ofrecer “Volver a Owner” una vez cancelada la suscripción. Al confirmar, se valida que no tenga bodas adicionales activas; se limpia `plannerWeddingIds`/`assistant` enlaces y se deja una sola boda como owner.
- Expiración automática: job (backend) reduce el rol si `subscription.renewedAt` supera periodo de gracia.

## 4. Persistencia y datos
- `users/{uid}`:
  - Campos `role`, `subscription.tier`, `activeWeddingId`, `plannerWeddingIds`, `hasActiveWedding`, `personalizationSummary` (snapshot del mapa de preferencias para planners/assistants).
- Guardar `roleHistory` con entradas `{ from, to, at, reason }` para auditoría.
- `users/{uid}/weddings/{weddingId}`: documento con `role`, `permissions`, `active`, `lastAccessedAt`. Generado en `upsertUserWeddingLink` (invocada desde `createWedding`, `acceptInvitation`, `addPlannerToWedding`).
- `weddings/{id}`:
  - Arrays `ownerIds`, `assistantIds`, `plannerIds`.
  - `subscription.tier` y `plannerTier` para reflejar plan del profesional si corresponde.
- LocalStorage:
  - `MaLoveApp_user_profile` (rol actual, `useAuth.jsx:180`).
  - `maloveapp_active_wedding` + claves por usuario para selección (`WeddingContext.jsx:235`).
- Analytics: `performanceMonitor.logEvent('wedding_switched', ...)` ya registra cambios de boda; añadir `role_upgraded`, `role_downgraded`, `role_personalization_summary_opened`.

## 5. Reglas de negocio
- **Owner (`particular`/`owner`)**: una boda propia (creada mediante `createWedding`), acceso completo, sin selector multi boda.
- **Assistant**: máximo 1 boda ajena activa. Solo owner/planner pueden invitarlo (`docs/sistema-roles-tecnico.md:471`). Nav restringe acceso a finanzas y configuración.
- **Planner**: límite de bodas según plan (`docs/planes-suscripcion.md:55`). Puede archivar/crear bodas (`WeddingService.js:144`, `WeddingService.js:616`). Acceso al `PlannerDashboard`.
- Cambios de rol deben validar:
  - No exceder `plannerWeddingIds.length` respecto al plan contratado.
  - Para downgrade a assistant/owner, que no existan bodas adicionales pendientes (archivar o transferir antes).
  - Invitaciones `createInvitation` sólo válidas si rol o plan permite sumar bodas.

## 6. Estados especiales y errores
- Pago fallido → mostrar banner “Tu plan no se actualizó” y mantener rol.
- Invitación aceptada sin upgrade → error `plan_required` desde backend; UI muestra CTA a upgrade.
- Exceso de bodas → bloquear `createWedding`, `addPlannerToWedding` con error descriptivo.
- Inconsistencias localStorage vs Firestore: forzar `reloadUserProfile` tras upgrade (nuevo método en `useAuth`).
- Sesiones múltiples: si el usuario abre en otro dispositivo, el rol se sincroniza gracias a `MaLoveApp_user_profile`; añadir listener `storage` para refrescar.

## 7. Integraciones y dependencias
- **Auth**: `useAuth.register` (`src/hooks/useAuth.jsx:593`) y `persistProfileForUser` (línea 180) deben aceptar actualizaciones de rol posteriores y escribir en Firestore (actualmente solo local).
- **Flujo 2C / Dashboard 22**: al completar upgrade se envía evento `role_upgraded` que refresca mapa de preferencias y StyleMeter visibles para planners/assistants.
- **WeddingContext**: hoy sólo consolida lista (`src/context/WeddingContext.jsx:221`). Debe normalizar roles con `normalizeWeddingRole` (`src/utils/weddingPermissions.js:74`) y exponer permisos para UI condicionada.
- **UI**:
  - `Perfil.jsx` necesita sección de planes con CTA upgrade/downgrade y mostrar estado del rol.
  - `PlannerDashboard.jsx` se activa al detectar rol planner.
  - `Nav.jsx` ya conmuta menús según rol (líneas 29/69); confirmar estados para assistant.
  - `RoleBadge.jsx` mapear `'particular'` → Owner visualmente.
- **Servicios**:
  - `WeddingService.createWedding` y `addPlannerToWedding` ya actualizan arrays; agregar validaciones de plan.
  - `invitePlanner`/`acceptInvitation` deben comprobar límites y actualizar `plannerWeddingIds`.
  - Integrar con facturación: `SyncService` o nuevo `BillingService` para guardar estado del checkout.

## 8. Métricas y monitorización
- Eventos: `role_upgrade_started`, `role_upgrade_completed`, `role_downgrade`, `role_upgrade_failed`, `assistant_invite_sent`, `assistant_invite_accepted`.
- Dimensiones: rol anterior, nuevo rol, plan destino, importe, nº de bodas activas, origen CTA (Perfil, More, banner).
- Alertas: porcentaje de upgrades fallidos >5%, cupones usados, planners sin bodas >30 días.

## 9. Pruebas recomendadas
- **Unitarias**: `useAuth` (persistencia de rol), `WeddingService.addPlannerToWedding` (verifica límites), util `normalizeWeddingRole`.
- **Integración**: upgrade owner→assistant→planner en entorno stub (mock checkout), aceptación de invitaciones, verificación de nav/dashboards.
- **E2E Cypress**: plan upgrade happy path, error por límites, downgrade con bodas pendientes.
- **Regression**: asegurar que owners sin upgrade continúan viendo su dashboard habitual y no aparecen CTAs erráneos.

## Cobertura E2E implementada
- `cypress/e2e/account/role-upgrade-flow.cy.js`: recorre el upgrade de roles (owner/assistant/planner), validaciones y persistencia.

## 10. Backlog inmediato
- Construir `RoleUpgradeModal` + integración con proveedor de pagos.
- API backend `POST /api/users/{uid}/upgrade-role` con validaciones y side-effects (`plannerWeddingIds`).
- Migrar `WeddingContext` para exponer `activeWeddingPermissions` y normalizar permisos (hoy pendiente).
- Automatizar degradaciones cuando expira `subscription`.
- Documentar precios y planes definitivos en `docs/planes-suscripcion.md`.


