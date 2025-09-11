# Seguridad y Privacidad

## PII y Datos Sensibles
- Invitados contienen PII (nombre, email, teléfono, alergias). Tratar con políticas GDPR.
- Minimizar exposición: filtrar campos en UI y logs.

## Autenticación y Autorización
- Firebase Auth como fuente de identidad.
- Reglas Firestore: acceso por rol (propietarios/colaboradores) y por boda activa.

## Tokens y Enlaces
- Enlaces RSVP usan tokens firmados y con validez limitada.
- Revocación posible desde panel de invitados.

## Claves y Secretos
- Mantener API keys en backend cuando sea viable (Mailgun, OpenAI, WhatsApp).
- Rotación periódica y scopes mínimos.

## Respaldo y Retención
- Políticas de backup de Firestore (programadas fuera del repo).
- Retención de PII según normativa y solicitud del usuario.

## Registro de Incidentes
- Trazabilidad de errores sin PII.
- Procedimiento de comunicación y mitigación.

