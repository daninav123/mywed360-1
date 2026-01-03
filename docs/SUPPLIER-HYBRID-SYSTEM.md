# 🔄 Sistema Híbrido para Proveedores - Especificación Técnica

**Fecha**: 2025-01-03  
**Objetivo**: Sistema flexible que permite a proveedores trabajar por email O usar la plataforma  
**Filosofía**: "No reemplazamos tu sistema, te traemos clientes"

---

## 🎯 PRINCIPIOS DE DISEÑO

1. **Email First**: Toda solicitud SIEMPRE se envía por email
2. **Dashboard Opcional**: El panel es un extra, no obligatorio
3. **API Abierta**: Proveedores técnicos pueden integrar
4. **Zero Lock-in**: Pueden dejar de usar el dashboard sin perder funcionalidad

---

## 🏗️ ARQUITECTURA

### Flujo de Solicitud

```
Cliente envía solicitud
    ↓
1. Guardar en DB (suppliers_requests)
    ↓
2. Sistema de Notificaciones Paralelas:
    ├─→ ✉️  Email al proveedor (SIEMPRE)
    ├─→ 📱 WhatsApp (si configurado)
    ├─→ 🔔 Push notification (si tiene app)
    ├─→ 🔗 Webhook a su URL (si configurado)
    └─→ 📊 Registro en dashboard (para stats)
    ↓
3. Proveedor ELIGE cómo responder:
    ├─→ Opción A: Responde por email directo
    ├─→ Opción B: Usa el dashboard
    └─→ Opción C: Su sistema recibe webhook y responde automático
```

---

## 📦 COMPONENTES DEL SISTEMA

### 1. Sistema de Notificaciones

**Backend**: `backend/services/SupplierNotificationService.js`

```javascript
class SupplierNotificationService {
  async notifyNewRequest(request) {
    const supplier = await this.getSupplier(request.supplierId);
    const notifications = [];

    // 1. EMAIL (SIEMPRE)
    notifications.push(
      this.sendEmail({
        to: supplier.email,
        subject: `Nueva solicitud de ${request.clientName}`,
        template: 'new-request',
        data: {
          clientName: request.clientName,
          weddingDate: request.weddingDate,
          budget: request.budget,
          message: request.message,
          replyLink: `mailto:${request.clientEmail}`,
          dashboardLink: `https://malove.app/supplier/dashboard/${supplier.id}/requests/${request.id}`,
        },
      })
    );

    // 2. WHATSAPP (si configurado)
    if (supplier.settings?.notifications?.whatsapp) {
      notifications.push(
        this.sendWhatsApp({
          to: supplier.phone,
          message: `🎉 Nueva solicitud de boda\n${request.clientName} - ${request.weddingDate}\nVer detalles: ${shortLink}`,
        })
      );
    }

    // 3. WEBHOOK (si configurado)
    if (supplier.settings?.webhook?.url) {
      notifications.push(
        this.sendWebhook({
          url: supplier.settings.webhook.url,
          method: 'POST',
          headers: {
            'X-MaLove-Signature': this.generateSignature(request),
            'Content-Type': 'application/json',
          },
          body: {
            event: 'request.created',
            data: request,
          },
        })
      );
    }

    // 4. PUSH NOTIFICATION (si tiene app móvil)
    if (supplier.settings?.pushToken) {
      notifications.push(
        this.sendPushNotification({
          token: supplier.pushToken,
          title: 'Nueva solicitud',
          body: `${request.clientName} te ha contactado`,
          data: { requestId: request.id },
        })
      );
    }

    await Promise.allSettled(notifications);
  }
}
```

---

### 2. API Pública para Proveedores

**Endpoint Base**: `https://api.malove.app/v1/suppliers`

#### Autenticación

```javascript
// Cada proveedor tiene una API Key
const headers = {
  Authorization: 'Bearer sk_live_abc123...',
  'Content-Type': 'application/json',
};
```

#### Endpoints Principales

##### **GET /api/v1/suppliers/me**

Obtener información del proveedor autenticado

```json
Response 200:
{
  "id": "sup_123",
  "name": "Flores & Sueños",
  "email": "info@flores.com",
  "category": "flowers",
  "location": {
    "city": "Madrid",
    "province": "Madrid"
  },
  "stats": {
    "profileViews": 342,
    "requests": 12,
    "conversions": 3
  }
}
```

##### **GET /api/v1/suppliers/requests**

Listar solicitudes recibidas

```javascript
GET /api/v1/suppliers/requests?status=pending&limit=20&page=1

Response 200:
{
  "data": [
    {
      "id": "req_456",
      "clientName": "Ana y Luis",
      "clientEmail": "ana@email.com",
      "weddingDate": "2026-07-15",
      "budget": "2000-3000",
      "message": "Buscamos flores para decoración...",
      "status": "pending",
      "createdAt": "2025-01-03T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}
```

##### **PATCH /api/v1/suppliers/requests/:id**

Actualizar estado de solicitud

```javascript
PATCH /api/v1/suppliers/requests/req_456
{
  "status": "contacted",
  "notes": "Enviado presupuesto por email"
}

Response 200:
{
  "id": "req_456",
  "status": "contacted",
  "updatedAt": "2025-01-03T11:00:00Z"
}
```

##### **GET /api/v1/suppliers/products**

Listar productos/servicios del proveedor

```javascript
GET /api/v1/suppliers/products

Response 200:
{
  "data": [
    {
      "id": "prod_789",
      "name": "Ramo de novia Premium",
      "description": "Ramo personalizado con rosas y peonías",
      "price": 150.00,
      "currency": "EUR",
      "available": true,
      "category": "bouquets"
    }
  ]
}
```

##### **POST /api/v1/suppliers/products**

Crear nuevo producto

```javascript
POST /api/v1/suppliers/products
{
  "name": "Centros de mesa rústicos",
  "description": "Pack de 10 centros de mesa estilo rústico",
  "price": 350.00,
  "currency": "EUR",
  "category": "centerpieces",
  "images": ["https://..."],
  "available": true
}

Response 201:
{
  "id": "prod_790",
  "name": "Centros de mesa rústicos",
  ...
}
```

##### **GET /api/v1/suppliers/availability**

Consultar disponibilidad

```javascript
GET /api/v1/suppliers/availability?from=2026-06-01&to=2026-08-31

Response 200:
{
  "dates": [
    {
      "date": "2026-07-15",
      "status": "booked",
      "note": "Boda en Ritz"
    },
    {
      "date": "2026-07-22",
      "status": "available"
    },
    {
      "date": "2026-07-29",
      "status": "blocked",
      "note": "Vacaciones"
    }
  ]
}
```

##### **POST /api/v1/suppliers/availability**

Actualizar disponibilidad

```javascript
POST /api/v1/suppliers/availability
{
  "dates": [
    {
      "date": "2026-08-15",
      "status": "booked",
      "note": "Boda Marta y Pedro"
    }
  ]
}

Response 200:
{
  "updated": 1,
  "dates": [...]
}
```

##### **POST /api/v1/suppliers/availability/sync**

Sincronizar con calendario externo

```javascript
POST /api/v1/suppliers/availability/sync
{
  "provider": "google",
  "calendarId": "primary",
  "syncMode": "import" // o "bidirectional"
}

Response 200:
{
  "synced": 23,
  "imported": 23,
  "exported": 0
}
```

---

### 3. Webhooks para Integraciones

#### Configuración de Webhooks

**Backend**: `backend/routes/supplier-settings.js`

```javascript
// Configurar webhook del proveedor
POST /api/v1/suppliers/webhooks
{
  "url": "https://mi-sistema.com/webhook/malove",
  "events": ["request.created", "request.updated"],
  "secret": "mi_secreto_para_verificar_firma"
}
```

#### Eventos Disponibles

```javascript
const WEBHOOK_EVENTS = {
  'request.created': 'Nueva solicitud recibida',
  'request.updated': 'Solicitud actualizada',
  'profile.viewed': 'Alguien vio tu perfil',
  'product.ordered': 'Producto contratado',
  'review.created': 'Nueva reseña recibida',
};
```

#### Payload de Webhook

```javascript
POST https://mi-sistema.com/webhook/malove
Headers:
  X-MaLove-Event: request.created
  X-MaLove-Signature: sha256=abc123...
  Content-Type: application/json

Body:
{
  "event": "request.created",
  "timestamp": "2025-01-03T10:30:00Z",
  "data": {
    "id": "req_456",
    "supplierId": "sup_123",
    "clientName": "Ana y Luis",
    "clientEmail": "ana@email.com",
    "weddingDate": "2026-07-15",
    "budget": "2000-3000",
    "message": "Buscamos flores...",
    "status": "pending"
  }
}
```

#### Verificación de Firma

```javascript
// El proveedor verifica que el webhook viene de MaLove.App
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

---

### 4. Dashboard Opcional (Frontend)

**Componentes**:

#### A. Gestión de Productos (`SupplierProducts.jsx`)

```jsx
// Vista de productos/servicios
- Lista de productos
- Crear/Editar/Eliminar
- Subir imágenes
- Toggle disponibilidad
- Precio y descripción
- Categorías
```

#### B. Calendario de Disponibilidad (`SupplierCalendar.jsx`)

```jsx
// Calendario mensual
- Ver fechas disponibles/ocupadas
- Click para marcar ocupado/disponible
- Notas por fecha
- Importar de Google Calendar
- Vista lista (próximos eventos)
```

#### C. Solicitudes (`SupplierRequests.jsx`)

```jsx
// Lista de solicitudes
- Filtros: Pendientes, Contactadas, Archivadas
- Marcar como contactado
- Responder directo (abre email)
- Ver detalles completos
- Timeline de interacciones
```

---

## 🔐 SEGURIDAD

### API Keys

```javascript
// Generar API Key para proveedor
const apiKey = `sk_${env}_${randomString(32)}`;

// Almacenar hash en DB
const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
```

### Rate Limiting

```javascript
// Por API Key
const RATE_LIMITS = {
  tier_free: {
    requests: 100,
    window: '1h',
  },
  tier_basic: {
    requests: 1000,
    window: '1h',
  },
  tier_pro: {
    requests: 10000,
    window: '1h',
  },
};
```

### Permisos

```javascript
// Cada proveedor solo ve SUS datos
const scope = {
  read: ['own_profile', 'own_requests', 'own_products'],
  write: ['own_products', 'own_availability'],
  admin: [], // No tiene acceso a otros proveedores
};
```

---

## 📧 PLANTILLAS DE EMAIL

### Email de Nueva Solicitud

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Nueva Solicitud - MaLove.App</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #6366f1; color: white; padding: 20px; text-align: center;">
      <h1>🎉 Nueva Solicitud de Boda</h1>
    </div>

    <div style="padding: 20px; background: #f9fafb;">
      <h2>Detalles de la Pareja</h2>
      <p><strong>Nombres:</strong> {{clientName}}</p>
      <p><strong>Email:</strong> <a href="mailto:{{clientEmail}}">{{clientEmail}}</a></p>
      <p><strong>Fecha de la boda:</strong> {{weddingDate}}</p>
      <p><strong>Presupuesto estimado:</strong> {{budget}}</p>

      <h3>Mensaje:</h3>
      <p style="background: white; padding: 15px; border-left: 4px solid #6366f1;">{{message}}</p>

      <div style="margin-top: 30px; text-align: center;">
        <a
          href="mailto:{{clientEmail}}?subject=Re: Solicitud de presupuesto - {{supplierName}}"
          style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
        >
          📧 Responder por Email
        </a>

        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          O si prefieres, gestiona esta solicitud en tu panel:
        </p>

        <a href="{{dashboardLink}}" style="color: #6366f1; text-decoration: none;">
          Ver en Dashboard →
        </a>
      </div>
    </div>

    <div
      style="padding: 20px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;"
    >
      <p>Esta solicitud también está disponible en tu panel de proveedor</p>
      <p>
        <a href="{{settingsLink}}" style="color: #6366f1;">Configurar notificaciones</a> |
        <a href="{{apiDocsLink}}" style="color: #6366f1;">Documentación API</a>
      </p>
      <p>© 2025 MaLove.App - Plataforma para proveedores de bodas</p>
    </div>
  </body>
</html>
```

---

## 📊 ANALYTICS

### Métricas para Proveedores

```javascript
const SUPPLIER_METRICS = {
  // Tráfico
  profileViews: 'Número de vistas del perfil',
  uniqueVisitors: 'Visitantes únicos',
  avgTimeOnProfile: 'Tiempo promedio en perfil',

  // Engagement
  requestsReceived: 'Solicitudes recibidas',
  requestsContacted: 'Solicitudes contactadas',
  conversionRate: 'Tasa de conversión (vistas → solicitudes)',

  // Productos
  productViews: 'Vistas de productos',
  productClicks: 'Clics en productos',
  mostViewedProducts: 'Productos más vistos',

  // Disponibilidad
  availabilityChecks: 'Consultas de disponibilidad',
  bookedDates: 'Fechas reservadas',

  // Competencia
  rankingInCategory: 'Posición en categoría',
  categoryLeader: 'Líder de categoría (si tiene más solicitudes)',
};
```

---

## 🚀 FASES DE IMPLEMENTACIÓN

### **FASE 1: Sistema de Notificaciones (Sprint 1 - 2 semanas)**

**Backend**:

- [ ] `SupplierNotificationService.js` - Servicio de notificaciones
- [ ] Email templates con SendGrid/Mailgun
- [ ] Endpoint POST `/api/supplier-requests` - Crear solicitud
- [ ] Job queue para envío async (Bull/BullMQ)

**Frontend**:

- [ ] Formulario de solicitud mejorado
- [ ] Confirmación de envío al cliente

**Testing**:

- [ ] Test unitario de envío de emails
- [ ] Test E2E de flujo completo

---

### **FASE 2: API Pública (Sprint 2 - 2 semanas)**

**Backend**:

- [ ] Sistema de API Keys
- [ ] Endpoints de lectura (GET requests, products, availability)
- [ ] Rate limiting
- [ ] Documentación OpenAPI/Swagger
- [ ] Portal de desarrolladores

**Frontend**:

- [ ] Página "API para Desarrolladores"
- [ ] Generador de API Keys en dashboard
- [ ] Logs de uso de API

---

### **FASE 3: Dashboard Opcional (Sprint 3 - 3 semanas)**

**Frontend**:

- [ ] `SupplierRequests.jsx` - Lista de solicitudes
- [ ] `SupplierProducts.jsx` - CRUD de productos
- [ ] `SupplierCalendar.jsx` - Calendario de disponibilidad
- [ ] `SupplierSettings.jsx` - Configuración de notificaciones

**Backend**:

- [ ] Endpoints de escritura (POST/PATCH products, availability)
- [ ] Subida de imágenes para productos
- [ ] Sync con Google Calendar

---

### **FASE 4: Webhooks e Integraciones (Sprint 4 - 2 semanas)**

**Backend**:

- [ ] Sistema de webhooks
- [ ] Verificación de firmas
- [ ] Retry logic para webhooks fallidos
- [ ] Logs de webhooks

**Frontend**:

- [ ] Configurador de webhooks
- [ ] Testeador de webhooks
- [ ] Logs de eventos

---

## 📖 DOCUMENTACIÓN PARA PROVEEDORES

### Portal de Desarrolladores

**URL**: `https://developers.malove.app`

**Contenido**:

1. **Guía de Inicio Rápido**
   - Generar API Key
   - Primer request
   - Autenticación

2. **Referencia de API**
   - Todos los endpoints
   - Ejemplos en múltiples lenguajes (curl, JavaScript, Python, PHP)
   - Códigos de error

3. **Webhooks**
   - Configuración
   - Eventos disponibles
   - Verificación de firma
   - Ejemplos de implementación

4. **Casos de Uso**
   - Sincronizar con CRM
   - Importar solicitudes a Excel
   - Automatizar respuestas
   - Integrar con ERP

5. **SDKs** (futuro)
   - JavaScript SDK
   - Python SDK
   - PHP SDK

---

## 💡 EJEMPLOS DE INTEGRACIÓN

### Ejemplo 1: Recibir solicitudes en Google Sheets

```javascript
// Webhook en Google Apps Script
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Solicitudes');
  const data = JSON.parse(e.postData.contents).data;

  sheet.appendRow([
    new Date(),
    data.clientName,
    data.clientEmail,
    data.weddingDate,
    data.budget,
    data.message,
  ]);

  return ContentService.createTextOutput('OK');
}
```

### Ejemplo 2: Sincronizar productos desde sistema propio

```javascript
// Script Node.js para sincronizar productos
const axios = require('axios');

async function syncProducts() {
  const localProducts = await getProductsFromMyDB();

  for (const product of localProducts) {
    await axios.post(
      'https://api.malove.app/v1/suppliers/products',
      {
        name: product.name,
        price: product.price,
        description: product.description,
        available: product.stock > 0,
      },
      {
        headers: {
          Authorization: 'Bearer sk_live_abc123...',
        },
      }
    );
  }
}

// Ejecutar cada 6 horas
setInterval(syncProducts, 6 * 60 * 60 * 1000);
```

### Ejemplo 3: Auto-respuesta con IA

```javascript
// Webhook que responde automáticamente
app.post('/webhook/malove', async (req, res) => {
  const { data } = req.body;

  // Generar respuesta con OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente de un proveedor de bodas. Responde cordialmente.',
      },
      {
        role: 'user',
        content: `Cliente pregunta: ${data.message}`,
      },
    ],
  });

  // Enviar email automático al cliente
  await sendEmail({
    to: data.clientEmail,
    subject: 'Re: Tu solicitud de presupuesto',
    body: response.choices[0].message.content,
  });

  res.status(200).send('OK');
});
```

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs del Sistema

1. **Tasa de Activación**:
   - % de proveedores que configuran notificaciones: >80%
   - % que usan dashboard al menos 1x/semana: >40%
   - % que configuran API/Webhooks: >10%

2. **Engagement**:
   - Tiempo promedio de respuesta a solicitudes: <24h
   - % de solicitudes contactadas: >60%
   - NPS de proveedores: >50

3. **Monetización**:
   - % de proveedores en plan Basic: >20%
   - % de proveedores en plan Pro: >5%
   - Churn mensual: <5%

---

## 🔄 PRÓXIMOS PASOS

1. **Implementar FASE 1**: Sistema de notificaciones por email
2. **Crear API docs**: Portal de desarrolladores
3. **Testing beta**: 5-10 proveedores early adopters
4. **Iterar**: Basado en feedback
5. **Escalar**: Onboarding masivo

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Sprint 1

- [ ] Diseñar schema de DB para requests
- [ ] Implementar SupplierNotificationService
- [ ] Crear templates de email
- [ ] Configurar SendGrid/Mailgun
- [ ] Endpoint POST /api/supplier-requests
- [ ] Tests E2E

### Sprint 2

- [ ] Sistema de API Keys
- [ ] Endpoints GET (requests, products, availability)
- [ ] Documentación Swagger
- [ ] Rate limiting
- [ ] Portal developers.malove.app

### Sprint 3

- [ ] Componentes dashboard React
- [ ] CRUD productos
- [ ] Calendario disponibilidad
- [ ] Subida imágenes

### Sprint 4

- [ ] Sistema webhooks
- [ ] Config webhooks en dashboard
- [ ] Retry logic
- [ ] Logs y monitoreo

---

**Estado**: 📝 Especificación completa  
**Próximo paso**: Implementar Sprint 1 - Sistema de Notificaciones
