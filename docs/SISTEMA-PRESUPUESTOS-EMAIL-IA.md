# 🤖 Sistema de Respuestas de Presupuestos por Email con IA

## 📋 Resumen

Sistema automático que permite a los proveedores responder solicitudes de presupuesto **directamente por email** (texto libre o PDF adjunto), procesando la respuesta con IA para extraer datos estructurados y guardarlos automáticamente en el sistema.

## 🔄 Flujo Completo

### 1. **Solicitud de Presupuesto** (Ya existente)
```
Usuario → Solicita presupuesto a proveedor
Sistema → Envía email al proveedor con enlace
```

### 2. **Respuesta del Proveedor** (NUEVO - 2 opciones)

#### Opción A: Email directo (NUEVO) ✨
```
Proveedor → Responde al email directamente
  - Escribe presupuesto en el cuerpo del email
  - O adjunta PDF con presupuesto detallado
  - Puede incluir ambos

Sistema automático →
  1. Detecta que es respuesta de presupuesto
  2. Busca solicitud correspondiente
  3. Extrae texto del PDF si hay adjunto
  4. Analiza con IA (GPT-4o-mini)
  5. Extrae datos estructurados
  6. Guarda en Firestore
  7. Notifica al usuario
```

#### Opción B: Formulario web (Existente)
```
Proveedor → Click en link del email
Sistema → Muestra formulario estructurado
Proveedor → Completa campos
```

## 🧠 ¿Qué Extrae la IA?

La IA analiza el email + PDF y extrae:

```json
{
  "totalPrice": 2500,
  "priceBreakdown": [
    { "concept": "Fotógrafo 8 horas", "amount": 1800 },
    { "concept": "300 fotos editadas", "amount": 500 },
    { "concept": "Álbum premium", "amount": 200 }
  ],
  "servicesIncluded": [
    "Cobertura 8 horas",
    "300 fotos editadas profesionalmente",
    "Álbum 30x30cm",
    "Entrega online"
  ],
  "extras": [
    "Sesión pre-boda: +400€",
    "Vídeo resumen: +800€"
  ],
  "paymentTerms": "30% adelanto, 40% día boda, 30% entrega",
  "deliveryTime": "45 días tras la boda",
  "cancellationPolicy": "Reembolso 100% hasta 60 días antes",
  "warranty": "Garantía 2 años en álbum",
  "additionalNotes": "Disponible fecha solicitada",
  "confidence": 95
}
```

## 📁 Estructura de Datos en Firestore

### Colección: `quote-responses`

```javascript
{
  // IDs de referencia
  id: "abc123",
  requestId: "req456",            // ID de la solicitud original
  supplierId: "sup789",           // ID del proveedor (si registrado)
  mailId: "mail101",              // ID del email en colección mails
  
  // Info del proveedor
  supplierEmail: "proveedor@example.com",
  supplierName: "Fotografía Perfecta",
  
  // Info del cliente
  clientEmail: "pareja@example.com",
  clientName: "Ana & Juan",
  userId: "user123",
  weddingId: "wedding456",
  
  // Datos extraídos por IA
  totalPrice: 2500,
  priceBreakdown: [...],
  servicesIncluded: [...],
  extras: [...],
  paymentTerms: "...",
  deliveryTime: "45 días",
  cancellationPolicy: "...",
  warranty: "...",
  additionalNotes: "...",
  confidence: 95,
  
  // Email original
  emailSubject: "Re: Solicitud presupuesto fotografía",
  emailBody: "...",
  hasAttachments: true,
  attachmentCount: 1,
  
  // Metadatos
  status: "received",              // received, reviewed, accepted, rejected, negotiating
  source: "email_auto",            // email_auto o form_manual
  analyzedAt: "2024-...",
  model: "gpt-4o-mini",
  
  // Timestamps
  createdAt: Timestamp,
  receivedAt: "2024-..."
}
```

## 🔍 Detección Automática

El sistema detecta automáticamente que un email es respuesta de presupuesto si contiene:

**Palabras clave de presupuesto:**
- presupuesto, cotización, precio, tarifa, coste, oferta, propuesta
- quote, budget, estimate (inglés)

**Indicadores de respuesta:**
- `Re:` o `Fwd:` en el subject
- Palabras: respuesta, adjunto, attached, pdf

## 🔗 Matching de Solicitudes

El sistema busca la solicitud correspondiente por:

1. **Email del proveedor** - Busca en proveedores registrados
2. **Email en proveedores de internet** - Busca en `quote-requests-internet`
3. **Subject del email** - Analiza Re: ... para encontrar referencias
4. **Collation group** - Busca en todas las solicitudes pendientes

## 📡 API Endpoints

### GET `/api/quote-responses`
Lista presupuestos recibidos

**Query params:**
- `userId` - Filtrar por usuario
- `weddingId` - Filtrar por boda
- `supplierId` - Filtrar por proveedor
- `status` - Filtrar por estado

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "responses": [...]
}
```

### GET `/api/quote-responses/:id`
Obtener detalles de un presupuesto

### PATCH `/api/quote-responses/:id/status`
Actualizar estado de un presupuesto

**Body:**
```json
{
  "status": "accepted",
  "notes": "Confirmado para el 15 de junio"
}
```

**Estados válidos:**
- `received` - Recién recibido
- `reviewed` - Revisado por el usuario
- `accepted` - Aceptado
- `rejected` - Rechazado
- `negotiating` - En negociación

### GET `/api/quote-responses/request/:requestId`
Obtener todos los presupuestos para una solicitud específica

## 🧪 Cómo Probar

### 1. Crear solicitud de presupuesto
```bash
# Desde la app, solicitar presupuesto a un proveedor
# El proveedor recibirá un email
```

### 2. Simular respuesta del proveedor

**Opción A: Enviar email directamente**

```
De: proveedor@example.com
Para: respuestas@mg.malove.app (o el email de donde vino)
Asunto: Re: Nueva solicitud de presupuesto de Ana & Juan

Hola Ana y Juan,

Adjunto presupuesto detallado para vuestra boda.

Precio total: 2.500€
Incluye:
- Cobertura fotográfica 8 horas
- 300 fotos editadas profesionalmente
- Álbum premium 30x30cm

Condiciones:
- Anticipo: 30% (750€)
- Resto: 40% día boda, 30% a la entrega
- Entrega: 45 días tras la boda

Saludos,
Fotografía Perfecta

[Adjunto: Presupuesto_Boda_Ana_Juan.pdf]
```

**Opción B: Usar formulario web**
```
1. Click en link del email
2. Completar formulario
3. Enviar
```

### 3. Verificar procesamiento

**Logs del backend:**
```
🎯 [QuoteResponse] Email detectado como posible respuesta de presupuesto
✅ [QuoteResponse] Solicitud encontrada: req123
🎉 [QuoteResponse] Presupuesto analizado - Precio: 2500€
💾 [QuoteResponse] Presupuesto guardado exitosamente: abc123
📧 [QuoteResponse] Notificación enviada al usuario
```

**Firestore:**
- Buscar en colección `quote-responses`
- Verificar datos extraídos

**Email al usuario:**
- Usuario recibe notificación: "¡Nuevo presupuesto de Fotografía Perfecta!"

### 4. Verificar en API

```bash
# Listar presupuestos
curl http://localhost:4004/api/quote-responses?weddingId=wedding123 \
  -H "Authorization: Bearer TOKEN"

# Ver detalles
curl http://localhost:4004/api/quote-responses/abc123 \
  -H "Authorization: Bearer TOKEN"

# Actualizar estado
curl -X PATCH http://localhost:4004/api/quote-responses/abc123/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted", "notes": "Confirmado"}'
```

## 🎯 Ventajas del Nuevo Sistema

### Para Proveedores
- ✅ **Respuesta rápida** - Simplemente responden el email
- ✅ **Formato libre** - Escriben como quieran
- ✅ **PDFs profesionales** - Pueden enviar su presupuesto habitual
- ✅ **Sin registro** - No necesitan cuenta en la plataforma

### Para Usuarios (Parejas)
- ✅ **Presupuestos estructurados** - IA extrae los datos
- ✅ **Fácil comparación** - Todos en el mismo formato
- ✅ **Notificaciones automáticas** - Saben cuando llega presupuesto
- ✅ **Historial completo** - Email original + datos extraídos

### Para el Sistema
- ✅ **Menor fricción** - Más proveedores responden
- ✅ **Datos estructurados** - IA normaliza la información
- ✅ **Backup del formulario** - Opción tradicional sigue disponible
- ✅ **Escalable** - Procesa cualquier formato

## 🔒 Seguridad

- **Verificación Mailgun** - Todos los webhooks verifican firma
- **Matching inteligente** - Solo procesa emails de proveedores conocidos
- **Auth en API** - Endpoints protegidos con `requireAuth`
- **Validación de datos** - IA extrae solo datos válidos

## 🚀 Próximas Mejoras

- [ ] **Interfaz frontend** - Página para ver presupuestos recibidos
- [ ] **Comparador** - Vista lado a lado de múltiples presupuestos
- [ ] **Negociación** - Chat integrado proveedor-pareja
- [ ] **Contratación directa** - Botón "Contratar" desde el presupuesto
- [ ] **Historial de versiones** - Si proveedor envía versión actualizada
- [ ] **Extracción de imágenes** - Del PDF para mostrar en la app

## 📝 Notas Técnicas

### Librerías Usadas
- `pdf-parse` - Extracción de texto de PDFs
- `OpenAI` (gpt-4o-mini) - Análisis inteligente
- `Mailgun` - Recepción de emails

### Variables de Entorno
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # o gpt-4o para mayor precisión
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.malove.app
```

### Performance
- Análisis IA: ~2-5 segundos
- Extracción PDF: ~1-2 segundos
- Total procesamiento: <10 segundos

### Limitaciones
- PDFs de máx 5MB (configurable)
- Texto extraído limitado a 15.000 caracteres
- Requiere OPENAI_API_KEY activa

## 📞 Soporte

Si un presupuesto no se procesa correctamente:

1. **Revisar logs del backend** - Buscar `[QuoteResponse]`
2. **Verificar Firestore** - Colección `mails` tiene el email
3. **Verificar matching** - Email del proveedor en base de datos
4. **Verificar PDF** - Que tenga texto (no imágenes escaneadas)
5. **Fallback** - Proveedor puede usar formulario web

---

**Implementado:** 16 Diciembre 2024  
**Versión:** 1.0  
**Archivos clave:**
- `backend/services/quoteResponseAnalysis.js`
- `backend/routes/mailgun-inbound.js` (líneas 209-347)
- `backend/routes/quote-responses.js`
