# Convenciones de API (Backend)

## Formato de respuesta
- Éxito
```
{  – success – : true,  – data – : { /* payload */ } }
```
- Error
```
{  – success – : false,  – error – : {  – code – :  – <slug> – ,  – message – :  – <humano> –  },  – requestId – :  – <uuid> –  }
```
- Paginación (cuando aplique)
```
{  – success – : true,  – data – : {  – items – : [/*...*/],  – nextCursor – :  – abc –  } }
```

## Errores y códigos
- `not_found`, `forbidden`, `unauthorized`, `rate_limit`, `validation_error`, `internal_error`.
- Mensajes breves, sin datos sensibles; el frontend traduce por clave.

## Validación de entrada
- Zod recomendado. Esquemas por ruta y DTOs compartidos cuando corresponda.
- Limitar tamaño de cuerpo: ver `BODY_JSON_LIMIT` y `BODY_URLENCODED_LIMIT`.

## Observabilidad
- `X-Request-ID` por petición (ver backend/index.js).
- Métricas Prometheus en `/metrics` y health `/api/health(/livez|/readyz)`.

## CORS
- Lista blanca via `ALLOWED_ORIGIN` (coma-separado), preflight cacheado (10 min) y `204`.
