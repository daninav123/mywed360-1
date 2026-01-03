# Despliegue y CI

## Despliegue Frontend

- Build: `npm run build` (Vite)
- Hosting: cualquier CDN/hosting estático (configurar `VITE_*` en entorno)

## Backend (referencia)

- Render u otro PaaS expuesto como `VITE_BACKEND_BASE_URL`
- Variables seguras: claves Mailgun, OpenAI, WhatsApp

## CI (propuesta)

Pasos mínimos:

1. Instalar dependencias
2. Lint y typecheck (si aplica)
3. Ejecutar tests unitarios (cuando existan)
4. Ejecutar E2E seating smoke (modo headless) contra preview
5. Build

### Webhook de pagos (Stripe) en CI/tests
- Validación lógica del webhook sin firma: STRIPE_TEST_DISABLE_SIGNATURE=true y POST /api/payments/webhook con un JSON que siga la forma del evento de Stripe.
- En producción no activar este flag; requerir STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET con verificación de firma.


## Cypress en CI

- Usar `CYPRESS_BASE_URL` contra la URL del preview
- Bypass de auth habilitado (ver `TESTING.md`)

## Versionado/Entornos

- Ramas: `main` (prod), `windows` (desarrollo activo)
- Entornos: dev/staging/prod con proyectos Firebase separados

## Gates de calidad (PR)

- Lint + unit + seating smoke + build.
- Checks sugeridos en PR:
  - `npm ci`
  - `npm run lint`
  - `npm run test:unit` (cuando existan)
  - `npm run cypress:run:seating` (usar `CYPRESS_BASE_URL` de preview)
  - `npm run build`

Ejemplo (GitHub Actions)

```yaml
name: CI
on: [pull_request]
jobs:
  pr-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit --if-present
      - run: npm run cypress:run:seating
        env:
          CYPRESS_BASE_URL: ${{ secrets.PREVIEW_URL }}
      - run: npm run build
```



