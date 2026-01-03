# Integración: Documentos Legales y Firmas

## Endpoints
- Legal Docs: `/api/legal-docs/*` → `templates`, `generate`, `list`
- Signature: `/api/signature/*` → `request`, `status`

## Frontend
- Servicios: `src/services/LegalDocsService.js`, `src/services/DigitalSignatureService.js`
- Página: `/protocolo/documentos-legales` con formularios por tipo (contrato proveedor, cesión de imagen, T&C)
- Prefill: navegación desde Proveedores con `location.state.prefill`

## Fallback y Estado
- Si el backend no responde: PDF placeholder (Base64) y persistencia por boda en `localStorage`
- Seguimiento de firmas: polling cada 15s para solicitudes pendientes

## Accesos Rápidos
- Proveedores → botón “Crear contrato en Documentos” (lista y detalle)

## Tests
- `src/__tests__/DigitalSignatureService.test.js` valida `request` y `status` con `fetch` mockeado

