# WhatsApp — Healthcheck del Proveedor

Objetivo: exponer y monitorizar el estado del proveedor de WhatsApp desde el backend.

## Endpoint sugerido

- Ruta: `GET /api/whatsapp/provider-status`
- Seguridad: pública (sin detalles sensibles) o protegida por rol admin; decidir según despliegue.

Respuesta (ejemplo)

```json
{
  "provider": "twilio",
  "configured": true,
  "ok": true,
  "message": "Webhook verificado y credenciales presentes"
}
```

## Implementación mínima

- Detectar si `TWILIO_AUTH_TOKEN` y remitente están configurados.
- Si hay ping/SDK disponible, realizar verificación ligera; si no, retornar `configured` y un `ok` heurístico.
- Registrar métricas (counter de eventos entrantes) para paneles en Grafana.

## Monitorización

- Añadir job en `prometheus.yml` para scrapear métricas del backend.
- Crear panel simple en Grafana con estados y tasa de eventos.

## CI/CD

- Añadir smoke test que verifique `200` y estructura de respuesta.
- Documentar fallback en `docs/api/OPENAPI_NEXT.md`.
