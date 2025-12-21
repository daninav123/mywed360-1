# 1. Registro y Autenticación (estado 2025-10-08)



> Implementado: `Signup.jsx`, `Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, `useAuth.jsx`, `SessionManager.jsx`, `src/context/UserContext.jsx`, componentes `SocialLoginButtons.jsx`, `RegisterForm.jsx`, `PasswordStrengthMeter.jsx`.

> Pendiente: refactor de formularios legacy fuera de uso y auditoría de accesibilidad manual sobre flows secundarios.



## 1. Objetivo y alcance

- Permitir que usuarios `owner`, `planner` y `assistant` creen una cuenta, inicien sesión y gestionen la recuperación de acceso.

- Garantizar verificación de correo antes de habilitar accesos sensibles.

- El proceso RSVP de invitados (aceptar o declinar invitaciones con token) se documenta en el **Flujo 9** y no forma parte de este flujo.

- El rol `admin` utiliza `/admin/login` y se describe en el **Flujo 0**; queda fuera del alcance de este documento.

- Requisito: ofrecer registro rápido mediante redes sociales soportadas (Google, Facebook u otras equivalentes) además del flujo por email y contraseña.



## 2. Trigger y rutas

- `/signup` (`Signup.jsx`) desde botones “Crear cuenta”.

- `/login` (`Login.jsx`) acceso directo o redirección tras logout.

- `/verify-email` (`VerifyEmail.jsx`) tras registro.

- `/reset-password` (`ResetPassword.jsx`) vía enlace en correo.
- Intentos de acceso admin en `/login` deben redirigir a `/admin/dashboard`; el login oficial admin se encuentra en `/admin/login`.



## 3. Paso a paso UX

1. **Signup.jsx**

   - Layout dividido (`md:grid-cols-2`) con panel informativo y tarjeta de formulario sobre `bg-surface`.

   - Formulario gestionado por `RegisterForm.jsx`: campos `email`, `password`, selector `role` (`particular`, `planner`, `assistant`) y barra `PasswordStrengthMeter` con sugerencias en tiempo real.

   - Botón principal `Registrarse` invoca `useAuth().register(email, password, role)` (alias `authSignup`) y redirige a `/home` tras el alta exitosa.

   - Validaciones: HTML5 + control mínimo de 8 caracteres, indicador de fuerza y recomendaciones contextuales.

   - Errores: se guardan en estado local y se renderizan dentro del formulario, manteniendo los requisitos de accesibilidad (ARIA) para lectores de pantalla.

   - Roles: el valor seleccionado se persiste en el perfil generado por `useAuth` (`userProfile.role`), lo que habilita flujos diferenciados (planner vs owner) tras el login.

   - Telemetría activa: `signup_view`, `signup_submit`, `signup_completed`, `signup_failed` con propiedades (`role`, `source`, `error_code`) registradas en `PerformanceMonitor`.

2. **Login.jsx**

   - Layout espejo de Signup con panel informativo y formulario principal.

   - Campo de email (`username`) precargado con `localStorage.maloveapp_login_email` cuando el usuario marcó “Recuérdame”.

   - Checkbox `remember` controla la persistencia del correo; al desactivarlo elimina la clave en `localStorage`.

   - `handleSubmit` invoca `useAuth().login(username, password, remember)` y gestiona estados de error locales.
	   - Telemetría activa: `login_view`, `login_submit`, `login_success`, `login_failed` con props `remember_me` y `redirect_to`.

	   - Redirección post-login: utiliza `location.state.from` y evita bucles (`/login` o `/`) redirigiendo a `/home`.

	   - Errores de Firebase se traducen vía `mapAuthErrorMessage` (ej. `auth/wrong-password`, `auth/too-many-requests`).

   - Social login: botones renderizados por `SocialLoginButtons.jsx` para Google, Facebook y Apple, con fallback a `signInWithRedirect` cuando el popup se bloquea.

3. **VerifyEmail.jsx**

   - Sólo se renderiza si `useAuth().isAuthenticated` es verdadero; en caso contrario retorna `null`.

   - Usa `getFirebaseAuth()` para leer `auth.currentUser` y enviar `sendEmailVerification`; se muestra feedback en `status` o `error`.

   - Botón secundario “Ya verifiqué” ejecuta `auth.currentUser.reload()` para refrescar el flag `emailVerified`.

   - Desde 2025-10-08 importa directamente el hook unificado (`useAuth`), cerrando la deuda mencionada en `AUDITORIA-FLUJO-FIREBASE.md`.

4. **ResetPassword.jsx**

   - Formulario de un campo (`email`) que llama a `useAuth().sendPasswordReset(email)`; renderiza mensajes de estado (`status`) y error (`error`) dentro de la tarjeta.

   - No hay loading spinner; se recomienda añadirlo cuando se refactorice con `react-hook-form`.

   - El hook unificado expone `sendPasswordReset`, por lo que ya no depende de un wrapper legacy.

5. **SessionManager y rutas protegidas**

	   - `SessionManager.jsx` se monta dentro de `AuthProvider` y gestiona sesiones expiradas, reautenticaciones y notificaciones (`toast`). Expone modales con iconografía `lucide-react`.

   - `ProtectedRoute` (en `App.jsx`) usa `useAuth()` para bloquear acceso mientras `isLoading` o `!isAuthenticated`, mostrando `Loader` mientras se resuelve el estado.

   - `AuthProvider` encapsula `onAuthStateChanged`, sincroniza `userProfile` (incluyendo `providerData`) con `localStorage.MaLoveApp_user_profile` y registra contexto para servicios (`emailService`, `notificationService`, `whatsappService`).



## 4. Persistencia y datos

- Firestore: `users/{uid}` (nombre, roles, `activeWedding`), `users/{uid}/profile`.

- Invitaciones de colaboradores: `weddings/{weddingId}/invitations/{code}` con metadatos (`role`, `email`, `expiresAt`, `status`).

- Tokens de Firebase Auth gestionados por `SessionManager.jsx` y expuestos vía `useAuth().getIdToken()`.

- LocalStorage:

  - `MaLoveApp_user_profile`: snapshot del perfil completo gestionado por `useAuth`.

  - `maloveapp_login_email`: email recordado en `Login.jsx`.

  - Claves heredadas (`maloveapp_active_wedding`, `auth_debug_last_error`) se limpian en logout por compatibilidad.



## 5. Reglas de negocio

- Contraseña mínima de 8 caracteres; email único por entorno. El medidor recomienda longitud ≥ 12, caracteres mixtos y símbolos, pero la validación dura recae en Firebase (`auth/weak-password`).

- Invitaciones a colaboradores válidas una sola vez; el consumo del token actualiza `weddings/{weddingId}/invitations/{code}.status`.

- Usuarios sin `emailVerified` restringidos en vistas sensibles (control en hooks y rutas protegidas).

- `role` por defecto `particular`; planners o assistants se asignan sólo cuando el selector lo indica o cuando se acepta una invitación.

- El perfil persistido incluye `providerData` para soportar vínculos multi-proveedor y auditoría de accesos.



## 6. Estados especiales y errores

- `VerifyEmail` muestra instrucciones si ya está verificado y permite reenvío.

- Errores comunes (`auth/email-already-in-use`, `auth/wrong-password`, `auth/invalid-action-code`) se traducen a mensajes amigables. `auth/account-exists-with-different-credential` consulta métodos previos para sugerir el proveedor correcto.

- Se gestionan casos `auth/too-many-requests`, `auth/popup-blocked`, `auth/popup-closed-by-user`, `auth/network-request-failed` con mensajes específicos.

- `SessionManager` detecta desconexión (`navigator.onLine`) y muestra `WifiOff`; fuerza reautenticación cuando Firebase expira el token.



## 7. Integración con otros flujos

- Flujo 2 (creación de boda) se dispara en el primer login del owner.

- Flujo 9 (RSVP) opera de manera independiente; solo comparte la capa de autenticación básica cuando un invitado decide crear cuenta.



## 8. Métricas y monitorización

- Registrar eventos `signup_view`, `signup_submit`, `signup_completed`, `signup_failed` con propiedades (`role`, `error_code`, `has_planner_invite`).

- `login_view`, `login_submit`, `login_success`, `login_failed` con `remember_me` y `redirect_to`.

- `password_reset_requested`, `password_reset_completed`, `verification_email_resent`.

- Métricas de `SessionManager`: contador de reautenticaciones, sesiones caducadas y reconexiones (`wifi_offline`, `token_refresh_failed`).

- Integrar con `performanceMonitor` para medir tiempo desde `register` hasta `activeWeddingId` (flujo 2).



## 9. Plan de pruebas

**E2E (Cypress)**

- `flow1-signup-happy`: alta de usuario nuevo por email; verifica redirección a `/verify-email`, creación de `users/{uid}` y mensaje de confirmación.

- `flow1-signup-duplicated-email`: intenta registrar un correo existente; espera error traducido y mantiene foco en email.

- `flow1-social-login-happy`: simula login con Google/Facebook mediante stub del callback; comprueba sesión activa y persistencia de perfil.

- `flow1-social-login-error`: fuerza error del proveedor (credenciales revocadas) y muestra mensaje controlado.

- `flow1-login-happy`: credenciales válidas, remember-me marcado, redirección a `/home`, presencia de sesión en storage, logout correcto.

- `flow1-login-remember-me`: marca/deselecciona el checkbox y verifica que `localStorage.maloveapp_login_email` se cree y elimine correctamente.

- `flow1-login-wrong-password`: contraseña incorrecta, muestra error y evita bloqueo de interfaz.

- `flow1-login-unverified-email`: email sin verificar intentando ingresar a `/home`; espera aviso y redirección a `/verify-email`.

- `flow1-login-rate-limit`: simula múltiples intentos fallidos y valida respuesta de `too-many-requests`.

- `flow1-password-reset-request`: usuario solicita reset y recibe feedback positivo.

- `flow1-password-reset-complete`: abre enlace de restablecimiento simulado, establece nueva contraseña y confirma login posterior.

- `flow1-verify-email-resend`: reenvío exitoso, feedback en pantalla y estado actualizado al refrescar.

- `flow1-protected-route-guest`: accede a ruta protegida sin login y verifica redirección a `/login`.

- `flow1-session-expired`: manipula reloj para forzar expiración de token, valida modal de reautenticación en `SessionManager` y flujo completo de reingreso.



**Unitarias / integración**

- Hook `useAuth`: happy path de `signupWithEmail`, `loginWithEmail`, `signupWithProvider`, reintentos, propagación de errores de Firebase.

- `SessionManager`: persistencia y limpieza de tokens en `localStorage`/`sessionStorage`.

- Utilidades de validación (`validateEmail`, `evaluatePasswordStrength`).

- Guards de rutas protegidas (`RequireAuth`, `RequireVerifiedEmail`).



**Regresión manual / smoke**

- Confirmar configuración UI de botones sociales tras cambios de branding.

- Revisar traducciones y accesibilidad (lectores de pantalla, foco) después de cada refactor.


## Cobertura E2E implementada

- `cypress/e2e/auth/flow1-signup.cy.js`: cubre altas por correo, validación de duplicados y redirección a verificación.
- `cypress/e2e/auth/flow1-social-login.cy.js`: valida inicio de sesión con proveedores externos y manejo de errores comunes.
- `cypress/e2e/auth/flow1-password-reset.cy.js`: ejecuta la solicitud y el completado del restablecimiento de contraseña.
- `cypress/e2e/auth/flow1-verify-email.cy.js`: asegura reenvío del correo y refresco del estado `emailVerified`.
- `cypress/e2e/auth/auth-flow.cy.js`: smoke de rutas protegidas, sesión persistente y manipulación de `remember me`.

## 10. Checklist de despliegue

- Variables Firebase (`VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY`).

- Configurar correo transactional (Mailgun) para reset/verify.

- Alta de credenciales OAuth (Google, Facebook, etc.) en Firebase Console y `.env`.



## 11. Roadmap / pendientes

- Instrumentar métricas (`signup_submit`, `social_signup`, `login_failed`, etc.) y revisar dashboards.

- Completar auditoría de accesibilidad y focus management en formularios y botones sociales.

- Retirar formularios legacy (`RegisterForm`/`SocialLogin` antiguos) y limpiar dependencias en rutas no utilizadas.

- 2025-10-08: `VerifyEmail`, `ResetPassword`, `CreateWeddingAI` y `GamificationPanel` usan el hook unificado (`useAuth`) y este expone `sendPasswordReset`.

- Homogeneizar manejo de errores Firebase → UI (mapa centralizado en `authErrorMapper`).
