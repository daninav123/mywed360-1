# Sistema de Autenticación (estado 2025-10-07)

Este documento describe la autenticación real del proyecto tras la revisión manual de octubre de 2025.

## Arquitectura actual

- **Hook principal**: `src/hooks/useAuth.jsx` expone `useAuth()` con Firebase Auth.
- **Contexto**: `src/context/UserContext.jsx` envuelve la aplicación (`App.jsx`) y expone usuario, loading, wedding actual y helpers.
- **SessionManager**: `src/components/auth/SessionManager.jsx` sincroniza tokens, refrescos y dispara toasts.
- **Rutas protegidas**: `src/components/ProtectedRoute.jsx` (o guards en `App.jsx`).
- **Páginas**: `Login.jsx`, `Signup.jsx`, `VerifyEmail.jsx`, `ResetPassword.jsx`, `AcceptInvitation.jsx`.

## Flujo principal
1. `App.jsx` monta `AuthProvider` (Firebase), `UserProvider` y `WeddingProvider`.
2. `SessionManager.jsx` escucha `onAuthStateChanged`, escribe en contexto y localStorage.
3. Las pantallas consumen `useAuth()` para obtener usuario/acciones (`loginWithEmail`, `signup`, `logout`).
4. `AcceptInvitation.jsx` maneja invitaciones de colaboradores/invitados con tokens.

## Persistencia y datos
- Firestore `users/{uid}`: roles, activeWedding, preferencias.
- Colección `invitations/{code}` para invitaciones colaborador.
- Tokens manejados por Firebase Auth; refrescos automáticos en `SessionManager`.

## Reglas de negocio
- Email único, contraseña >=8 caracteres.
- Invitaciones válidas solo una vez; roles asignados según invitación.
- Usuarios sin email verificado tienen acceso limitado.

## Estados y errores
- Pantallas muestran mensajes claros (email ya registrado, contraseña incorrecta, token inválido).
- `VerifyEmail` permite reenviar y confirma estado actual.

## Integraciones
- Flujo 2 (creación de boda) se dispara tras primer login owner.
- Flujo 9 (RSVP) reutiliza AcceptInvitation.

## Pendiente
- Social login (Google/Apple), medidor de contraseña, controles de sesión forzada.
- Registro de métricas (eventos login/signup error).

## Pruebas
- Unitarias: hook `useAuth.jsx` (mock Firebase).
- E2E: login, signup, reset password, invitación colaborador.
