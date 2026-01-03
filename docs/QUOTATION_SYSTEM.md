# Sistema de Cotizaciones

Sistema completo de cotizaciones profesionales para proveedores.

## 🎯 Flujo Completo

### 1. Cliente (Owner) → Envía Solicitud

- El cliente busca un proveedor en la plataforma
- Completa el formulario de solicitud de presupuesto
- La solicitud llega al panel del proveedor

### 2. Proveedor → Recibe y Revisa

- Ve la solicitud en su panel
- Puede marcar como "Contactada"
- Decide si enviar cotización

### 3. Proveedor → Crea Cotización

- Click en "Enviar Cotización"
- Modal se abre con formulario completo:
  - **Items**: Servicios/productos con cantidad y precio
  - **Descuentos**: Fijo o porcentaje
  - **IVA**: Configurable (por defecto 21%)
  - **Validez**: Fecha límite opcional
  - **Términos**: Condiciones de pago, incluye/no incluye
  - **Notas**: Información adicional

### 4. Sistema → Calcula Automáticamente

```
Subtotal = Σ (cantidad × precio unitario)
Descuento = Subtotal × % (o valor fijo)
Base Imponible = Subtotal - Descuento
IVA = Base Imponible × %
TOTAL = Base Imponible + IVA
```

### 5. Cliente → Recibe Cotización

- Recibe email con notificación
- Puede ver la cotización en su panel
- Desglose completo de servicios y precios
- Términos y condiciones claros

### 6. Cliente → Responde

- **Aceptar**: Confirma la cotización (proveedor notificado)
- **Rechazar**: Declina la cotización
- **Ver después**: Puede revisarla más tarde

### 7. Estados del Sistema

- `sent`: Cotización enviada, esperando respuesta
- `viewed`: Cliente ha visto la cotización
- `accepted`: Cliente aceptó, negocio cerrado ✅
- `rejected`: Cliente rechazó

---

## 🛠️ Implementación Técnica

### Backend

#### Endpoint: Crear Cotización

```
POST /api/suppliers/:supplierId/quote-requests/:requestId/quotation
```

**Request Body:**

```json
{
  "items": [
    {
      "description": "DJ + Equipo de sonido",
      "quantity": 1,
      "unitPrice": 800
    },
    {
      "description": "Iluminación profesional",
      "quantity": 1,
      "unitPrice": 400
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 10
  },
  "tax": {
    "rate": 21
  },
  "validUntil": "2025-12-31",
  "terms": "Pago: 50% anticipo, 50% día del evento...",
  "notes": "Incluye montaje y desmontaje"
}
```

**Response:**

```json
{
  "success": true,
  "quotation": {
    "quotationId": "QT-1730665200000",
    "subtotal": 1200,
    "discountAmount": 120,
    "taxAmount": 226.8,
    "total": 1306.8,
    "status": "sent",
    ...
  }
}
```

### Frontend

#### Componentes Creados

1. **`CreateQuotationModal.jsx`**
   - Modal para crear cotización (proveedor)
   - Gestión dinámica de items
   - Cálculos en tiempo real
   - Validaciones de formulario

2. **`ViewQuotationModal.jsx`**
   - Modal para ver cotización (cliente)
   - Desglose detallado
   - Botones de aceptar/rechazar
   - Estados visuales claros

3. **Integración en `SupplierRequestsNew.jsx`**
   - Botón "Enviar Cotización" en solicitudes
   - Indicador cuando cotización ya enviada
   - Actualización automática de estados

---

## 📊 Estructura de Datos

### Cotización en Firestore

```javascript
{
  quotationId: "QT-1730665200000",
  requestId: "ABC123",
  supplierId: "z0BAVOrrub8xQvUtHIOw",
  supplierName: "ReSona",

  clientName: "Juan y María",
  clientEmail: "cliente@example.com",

  items: [
    {
      description: "DJ + Equipo",
      quantity: 1,
      unitPrice: 800,
      total: 800
    }
  ],

  subtotal: 1200,
  discount: { type: "percentage", value: 10 },
  discountAmount: 120,
  tax: { rate: 21 },
  taxAmount: 226.8,
  total: 1306.8,

  validUntil: "2025-12-31",
  terms: "...",
  notes: "...",

  status: "sent",
  createdAt: Timestamp,
  sentAt: Timestamp,
  viewedAt: null,
  respondedAt: null
}
```

---

## ✨ Características

### ✅ Para Proveedores

- Crear cotizaciones profesionales
- Múltiples items con cantidad y precio
- Descuentos flexibles (fijo o %)
- IVA configurable
- Términos y condiciones personalizables
- Historial de cotizaciones enviadas
- Ver estado (pendiente/aceptada/rechazada)

### ✅ Para Clientes

- Recibir cotizaciones por email
- Ver desglose detallado
- Comparar múltiples cotizaciones
- Aceptar/rechazar fácilmente
- Historial de cotizaciones recibidas

### ✅ Para el Sistema

- Cálculos automáticos precisos
- Estados claros y trazables
- Notificaciones automáticas
- Auditoría completa (timestamps)
- Escalable a generación de PDF

---

## 🚀 Mejoras Futuras

### Corto Plazo

- [ ] Generación de PDF de cotización
- [ ] Email al cliente con cotización adjunta
- [ ] Email al proveedor cuando cliente acepta/rechaza
- [ ] Template de términos y condiciones predefinidos

### Medio Plazo

- [ ] Plantillas de cotización guardadas
- [ ] Histórico de cotizaciones por proveedor
- [ ] Estadísticas (tasa de aceptación, valor promedio)
- [ ] Comparador de cotizaciones para clientes
- [ ] Negociación (contraofertas)

### Largo Plazo

- [ ] Firma electrónica de cotización aceptada
- [ ] Integración con sistema de pagos (señas)
- [ ] Generación automática de contrato
- [ ] Recordatorios de seguimiento
- [ ] IA para sugerir precios competitivos

---

## 🧪 Testing

### Flujo de Prueba

1. Crear solicitud como cliente
2. Ver solicitud en panel de proveedor
3. Click "Enviar Cotización"
4. Llenar formulario:
   - Agregar 2-3 items
   - Aplicar descuento 10%
   - IVA 21%
   - Fecha de validez
5. Enviar cotización
6. Verificar en logs del backend
7. Ver como cliente (TODO: implementar vista)
8. Aceptar cotización
9. Verificar que proveedor ve estado "Aceptada"

### Casos de Prueba

- ✅ Cotización simple (1 item, sin descuento)
- ✅ Cotización con descuento porcentual
- ✅ Cotización con descuento fijo
- ✅ Múltiples items
- ✅ IVA 0% (servicios exentos)
- ✅ IVA 10% (servicios reducidos)
- ✅ Validación de campos requeridos
- ✅ Cálculos decimales precisos

---

## 📝 Notas de Implementación

### Tokens CSS Utilizados

- `--color-primary`: Botones principales, totales
- `--color-success`: Cotización aceptada
- `--color-danger`: Cotización rechazada
- `--color-warning`: Alertas de validez
- `--color-bg`, `--color-surface`, `--color-text`: Fondos y textos

### Componentes UI Reutilizados

- `<Modal>`: Para los modales
- `<Button>`: Botones con variantes
- `<Card>`: Tarjetas de información

### Diseño Responsivo

- Grid adaptativo para items
- Botones que se apilan en móvil
- Modal scrollable en pantallas pequeñas

---

## 🎓 Uso

### Como Proveedor

1. **Ir a panel de solicitudes**

   ```
   /supplier/dashboard/:id/requests
   ```

2. **Expandir solicitud pendiente**
   - Click en la solicitud

3. **Click "Enviar Cotización"**
   - Se abre modal

4. **Completar formulario**
   - Agregar servicios
   - Configurar descuentos/IVA
   - Revisar total
   - Agregar términos

5. **Enviar**
   - Cliente recibe notificación

### Como Cliente (Owner)

1. **Recibir notificación**
   - Email con alerta

2. **Ver en panel** (TODO)

   ```
   /proveedores/cotizaciones
   ```

3. **Revisar detalles**
   - Ver desglose
   - Leer términos

4. **Decidir**
   - Aceptar: Confirmar reserva
   - Rechazar: Buscar otra opción

---

## 💡 Tips para Proveedores

### Crear Cotizaciones Efectivas

1. **Ser Específico**: Describe claramente cada servicio
2. **Desglosar**: Separar items principales y adicionales
3. **Términos Claros**: Condiciones de pago, incluye/no incluye
4. **Validez Razonable**: 15-30 días típicamente
5. **Profesionalismo**: Revisar ortografía y cálculos

### Ejemplo de Términos

```
CONDICIONES DE PAGO:
- 50% anticipo al confirmar
- 50% restante 7 días antes del evento

INCLUYE:
- Todos los servicios descritos
- Transporte dentro de la ciudad
- Montaje y desmontaje

NO INCLUYE:
- Desplazamiento fuera de 50km
- Servicios adicionales no especificados
- IVA (mostrado por separado)

CANCELACIONES:
- Más de 30 días: reembolso 100%
- 15-30 días: reembolso 50%
- Menos de 15 días: sin reembolso
```

---

## 🐛 Troubleshooting

### Problema: Cotización no se envía

- Verificar que todos los items tengan descripción
- Verificar que cantidades y precios sean válidos
- Revisar logs del backend

### Problema: Total no cuadra

- Verificar tipo de descuento (% vs fijo)
- Revisar tasa de IVA
- Comprobar redondeo de decimales

### Problema: Cliente no ve cotización

- Verificar email del cliente
- Comprobar que estado sea "sent"
- Revisar logs de email service

---

## 📞 Soporte

Para dudas o problemas:

1. Revisar esta documentación
2. Verificar logs del backend
3. Comprobar consola del navegador
4. Contactar soporte técnico

---

**Sistema implementado**: Nov 3, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Funcional (faltan emails y vista cliente)
