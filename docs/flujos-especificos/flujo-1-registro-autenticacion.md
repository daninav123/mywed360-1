# 1. Registro y Autenticación (estado 2025-10-07)

> Implementado: `Signup.jsx`, `Login.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx`, hook `useAuth.jsx`, `SessionManager.jsx`, `src/context/UserContext.jsx`.
> Pendiente: conectores de social login (Google, Facebook, Apple), formularios legacy (`RegisterForm` y `SocialLogin` ideas legacy) e indicadores de fuerza de contraseña.

## 1. Objetivo y alcance
- Permitir que usuarios `owner`, `planner` y `assistant` creen una cuenta, inicien sesión y gestionen la recuperación de acceso.
- Garantizar verificación de correo antes de habilitar accesos sensibles.
- El proceso RSVP de invitados (aceptar o declinar invitaciones con token) se documenta en el **Flujo 9** y no forma parte de este flujo.
- Requisito: ofrecer registro rápido mediante redes sociales soportadas (Google, Facebook u otras equivalentes) además del flujo por email y contraseña.

## 2. Trigger y rutas
- `/signup` (`Signup.jsx`) desde botones “Crear cuenta”.
- `/login` (`Login.jsx`) acceso directo o redirección tras logout.
- `/verify-email` (`VerifyEmail.jsx`) tras registro.
- `/reset-password` (`ResetPassword.jsx`) vía enlace en correo.

## 3. Paso a paso UX
1. **Signup.jsx**
   - Campos: nombre, email, contraseña, confirmación, aceptación términos.
   - Botón `Crear cuenta` → `useAuth().signupWithEmail`.
   - Botones de social login (Google, Facebook, redes equivalentes) → `useAuth().signupWithProvider`.
   - Validaciones: email con formato válido, contraseña ≥ 8 caracteres y coincidencia con confirmación.
   - Errores: mensajes toast vía `toast.error`.
2. **Login.jsx**
   - Campos email/contraseña, recordar sesión.
   - Acción `useAuth().loginWithEmail`.
   - Botones de acceso rápido por redes sociales → `useAuth().loginWithProvider`.
   - Link “¿Olvidaste contraseña?” → `/reset-password`.
3. **VerifyEmail.jsx**
   - Estado actual de verificación (`currentUser.emailVerified`).
   - Botón `Reenviar` → `useAuth().sendVerificationEmail`.
4. **ResetPassword.jsx**
   - Formulario email → `useAuth().sendPasswordReset`.
   - Confirmación mediante toast.

## 4. Persistencia y datos
- Firestore: `users/{uid}` (nombre, roles, `activeWedding`).
- Invitaciones de colaboradores: `weddings/{weddingId}/invitations/{code}` con metadatos (`role`, `email`, `expiresAt`, `status`).
- Tokens de Firebase Auth gestionados por `SessionManager.jsx`.

## 5. Reglas de negocio
- Contraseña mínima de 8 caracteres; email único por entorno.
- Invitaciones a colaboradores válidas una sola vez; el consumo del token actualiza `weddings/{weddingId}/invitations/{code}.status`.
- Usuarios sin `emailVerified` restringidos en vistas sensibles (control en hooks y rutas protegidas).

## 6. Estados especiales y errores
- `VerifyEmail` muestra instrucciones si ya está verificado y permite reenvío.
- Errores comunes (`auth/email-already-in-use`, `auth/wrong-password`, `auth/invalid-action-code`) se traducen a mensajes amigables.

## 7. Integración con otros flujos
- Flujo 2 (creación de boda) se dispara en el primer login del owner.
- Flujo 9 (RSVP) opera de manera independiente; solo comparte la capa de autenticación básica cuando un invitado decide crear cuenta.

## 8. Métricas y monitorización
- Registrar eventos `signup_completed`, `login_failed`, `social_signup_clicked` (pendiente instrumentar en analytics).

## 9. Plan de pruebas
**E2E (Cypress)**
- `flow1-signup-happy`: alta de usuario nuevo por email; verifica redirección a `/verify-email`, creación de `users/{uid}` y mensaje de confirmación.
- `flow1-signup-duplicated-email`: intenta registrar un correo existente; espera error traducido y mantiene foco en email.
- `flow1-social-login-happy`: simula login con Google/Facebook mediante stub del callback; comprueba sesión activa y persistencia de perfil.
- `flow1-social-login-error`: fuerza error del proveedor (credenciales revocadas) y muestra mensaje controlado.
- `flow1-login-happy`: credenciales válidas, remember-me marcado, redirección a `/home`, presencia de sesión en storage, logout correcto.
- `flow1-login-wrong-password`: contraseña incorrecta, muestra error y evita bloqueo de interfaz.
- `flow1-login-unverified-email`: email sin verificar intentando ingresar a `/home`; espera aviso y redirección a `/verify-email`.
- `flow1-login-rate-limit`: simula múltiples intentos fallidos y valida respuesta de `too-many-requests`.
- `flow1-password-reset-request`: usuario solicita reset y recibe feedback positivo.
- `flow1-password-reset-complete`: abre enlace de restablecimiento simulado, establece nueva contraseña y confirma login posterior.
- `flow1-verify-email-resend`: reenvío exitoso, feedback en pantalla y estado actualizado al refrescar.
- `flow1-protected-route-guest`: accede a ruta protegida sin login y verifica redirección a `/login`.

**Unitarias / integración**
- Hook `useAuth`: happy path de `signupWithEmail`, `loginWithEmail`, `signupWithProvider`, reintentos, propagación de errores de Firebase.
- `SessionManager`: persistencia y limpieza de tokens en `localStorage`/`sessionStorage`.
- Utilidades de validación (`validateEmail`, `validatePasswordStrength`).
- Guards de rutas protegidas (`RequireAuth`, `RequireVerifiedEmail`).

**Regresión manual / smoke**
- Confirmar configuración UI de botones sociales tras cambios de branding.
- Revisar traducciones y accesibilidad (lectores de pantalla, foco) después de cada refactor.

## 10. Checklist de despliegue
- Variables Firebase (`VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY`).
- Configurar correo transactional (Mailgun) para reset/verify.
- Alta de credenciales OAuth (Google, Facebook, etc.) en Firebase Console y `.env`.

## 11. Roadmap / pendientes
- Completar social login (conectores en frontend + configuración OAuth).
- Añadir medidor de fuerza de contraseña y tips de seguridad.
- Auditar accesibilidad en formularios y mensajes de error.
