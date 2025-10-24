# API de Estadísticas para Partners

## Base URL

```
https://maloveapp.com/api/partner
```

## Endpoints

### 1. Obtener Estadísticas (Público)

Obtiene las estadísticas de uso de un código de descuento mediante su token único.

#### Request

```http
GET /api/partner/:token
```

**Parámetros:**
- `token` (path, required): Token único de 32 caracteres hexadecimales

**Headers:**
- Ninguno requerido (endpoint público)

#### Response

**Success (200 OK)**

```json
{
  "code": "INFLUENCER2025",
  "type": "influencer",
  "assignedTo": {
    "name": "María García",
    "email": "maria@example.com"
  },
  "stats": {
    "total": {
      "revenue": 2450.75,
      "uses": 12,
      "users": 10,
      "currency": "EUR"
    },
    "lastMonth": {
      "revenue": 580.50,
      "uses": 3,
      "currency": "EUR"
    }
  },
  "users": [
    {
      "email": "cliente1@example.com",
      "amount": 299.99,
      "date": "2025-10-15"
    },
    {
      "email": "cliente2@example.com",
      "amount": 150.25,
      "date": "2025-10-10"
    }
  ],
  "maxUses": null,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Error (404 Not Found)**

```json
{
  "error": "not_found",
  "message": "Código de descuento no encontrado o token inválido"
}
```

**Error (403 Forbidden)**

```json
{
  "error": "inactive",
  "message": "Este código de descuento está desactivado"
}
```

**Error (400 Bad Request)**

```json
{
  "error": "invalid_token"
}
```

#### Ejemplo

```bash
curl https://maloveapp.com/api/partner/a3f5b9c2d8e1f4g7h6j5k4l3m2n1
```

```javascript
// JavaScript
const response = await fetch('https://maloveapp.com/api/partner/a3f5b9c2d8e1f4g7h6j5k4l3m2n1');
const data = await response.json();
console.log(data.stats.total.revenue); // 2450.75
```

---

### 2. Generar Token (Admin)

Genera o regenera el token único para un código de descuento.

#### Request

```http
POST /api/partner/generate-token
Content-Type: application/json
```

**Body:**

```json
{
  "discountId": "abc123def456"
}
```

**Headers:**
- `Authorization: Bearer <admin-token>` (o sesión de admin activa)

#### Response

**Success (200 OK)**

```json
{
  "token": "a3f5b9c2d8e1f4g7h6j5k4l3m2n1",
  "url": "https://maloveapp.com/partner/a3f5b9c2d8e1f4g7h6j5k4l3m2n1",
  "code": "INFLUENCER2025"
}
```

**Error (404 Not Found)**

```json
{
  "error": "discount_not_found"
}
```

**Error (400 Bad Request)**

```json
{
  "error": "discount_id_required"
}
```

**Error (500 Server Error)**

```json
{
  "error": "server_error"
}
```

#### Ejemplo

```bash
curl -X POST https://maloveapp.com/api/partner/generate-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"discountId":"abc123def456"}'
```

```javascript
// JavaScript
const response = await fetch('https://maloveapp.com/api/partner/generate-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken
  },
  body: JSON.stringify({ discountId: 'abc123def456' })
});
const data = await response.json();
console.log(data.url); // URL completa para compartir
```

---

## Modelos de Datos

### StatsResponse

```typescript
interface StatsResponse {
  code: string;                    // Código de descuento
  type: 'campaign' | 'influencer' | 'partner' | 'planner';
  assignedTo: {
    name: string | null;
    email: string | null;
  } | null;
  stats: {
    total: MetricsData;
    lastMonth: MetricsData;
  };
  users: UserPayment[];           // Máximo 50
  maxUses: number | null;         // null = ilimitado
  createdAt: string | null;       // ISO 8601
}

interface MetricsData {
  revenue: number;                 // Suma de pagos
  uses: number;                    // Número de usos
  users?: number;                  // Solo en total
  currency: string;                // ISO 4217 (EUR, USD...)
}

interface UserPayment {
  email: string;
  amount: number;
  date: string;                    // YYYY-MM-DD
}
```

### TokenResponse

```typescript
interface TokenResponse {
  token: string;                   // 32 chars hex
  url: string;                     // URL completa
  code: string;                    // Código de descuento
}
```

---

## Rate Limiting

**Límites:**
- Endpoint público: 100 requests / minuto por IP
- Endpoint admin: 20 requests / minuto por usuario

**Headers de respuesta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Token inválido o falta discountId |
| 403 | Forbidden - Código de descuento desactivado |
| 404 | Not Found - Token o código no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Server Error - Error interno del servidor |

---

## Seguridad

### Generación de Token

El token se genera usando SHA-256:

```javascript
token = SHA256(code + "-mywed360-partner-" + JWT_SECRET).substring(0, 32)
```

**Características:**
- Determinístico (mismo código = mismo token)
- Irrevocable (solo regenerando)
- Criptográficamente seguro
- No reversible

### Datos Expuestos

**Incluidos:**
- ✅ Email de usuarios
- ✅ Importes de pagos
- ✅ Fechas de compra
- ✅ Métricas agregadas

**Excluidos:**
- ❌ Datos bancarios
- ❌ Direcciones físicas
- ❌ Teléfonos
- ❌ IPs o sesiones
- ❌ Otros códigos de descuento

---

## Changelog

### v1.0.0 (2025-10-21)
- ✨ Implementación inicial
- 🔐 Sistema de tokens SHA-256
- 📊 Métricas de facturación total y mensual
- 👥 Lista de últimos 50 usuarios
- 🎨 Dashboard frontend responsive

---

## Soporte

Para dudas o incidencias:
- **Email:** soporte@maloveapp.com
- **Documentación:** `/docs/partner-stats-system.md`
- **Repositorio:** https://github.com/Daniel-Navarro-Campos/mywed360
