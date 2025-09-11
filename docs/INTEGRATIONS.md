# Integraciones — Servicios Externos

## Firebase
- Uso: Auth + Firestore
- Vars: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, (y las habituales de app)
- Reglas: acceso por roles (propietario/colaborador); minimizar exposición de PII

## Mailgun
- Uso: envío de emails (notificaciones/boletines)
- Vars: `VITE_MAILGUN_API_KEY` (solo en backend si es posible), dominio `mg.mywed360.com`
- Región EU habilitada en pruebas

## OpenAI
- Uso: IA para diseño web, prompts y sugerencias
- Vars: `VITE_OPENAI_API_KEY` (ideal: consumir desde backend para ocultar claves)
- Considerar límites de coste y trazabilidad

## WhatsApp Business API
- Uso: envío y estado de mensajes de invitación/seguimiento
- Acceso vía backend (`/api/whatsapp/...`), nunca directo desde cliente

## PDF/Impresión
- Uso: generación de PDF para invitaciones/planos
- Proveedor: por definir (placeholder en flujos)

## Recomendaciones
- Claves solo en backend siempre que sea viable
- Rotación de API keys y scopes mínimos
- Logs de error sin PII

