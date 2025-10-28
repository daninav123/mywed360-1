# 🎯 PROPUESTA: DASHBOARD COMPLETO PARA PROVEEDORES

**Fecha:** 2025-10-28  
**Estado:** 📋 PROPUESTA

---

## 🎯 OBJETIVO

Crear un **dashboard completo** donde los proveedores puedan:
- ✅ Ver solicitudes de presupuesto de parejas
- ✅ Responder automáticamente con plantillas
- ✅ Gestionar su perfil y portfolio
- ✅ Ver estadísticas y analítica
- ✅ Comunicarse con las parejas

---

## 🏗️ ARQUITECTURA PROPUESTA

### **Ruta del dashboard:**
```
/supplier/dashboard/:supplierId
```

### **Backend API:**
```
/api/supplier-dashboard/
  ├─ /auth/login          → POST (login con email/password)
  ├─ /auth/verify-token   → GET (verificar sesión)
  ├─ /profile             → GET/PUT (ver/editar perfil)
  ├─ /portfolio           → GET/POST/DELETE (gestionar portfolio)
  ├─ /requests            → GET (ver solicitudes de presupuesto)
  ├─ /requests/:id        → GET (ver detalle)
  ├─ /requests/:id/respond → POST (responder presupuesto)
  ├─ /templates           → GET/POST/PUT/DELETE (plantillas de respuesta)
  ├─ /analytics           → GET (estadísticas)
  └─ /settings            → GET/PUT (configuración)
```

---

## 📊 MÓDULOS DEL DASHBOARD

### **1. 🏠 INICIO / RESUMEN**

**Vista principal con métricas:**
```
┌─────────────────────────────────────────────┐
│  Dashboard - Nombre del Proveedor           │
├─────────────────────────────────────────────┤
│                                             │
│  📊 MÉTRICAS RÁPIDAS                        │
│  ┌─────────┬─────────┬─────────┬─────────┐│
│  │ Vistas  │ Clicks  │Solicitudes│ Tasa  ││
│  │   245   │   52    │    12    │  23%  ││
│  └─────────┴─────────┴─────────┴─────────┘│
│                                             │
│  📬 SOLICITUDES PENDIENTES (3)              │
│  ┌───────────────────────────────────────┐ │
│  │ 🆕 María & Juan - Boda Valencia       │ │
│  │    Fecha: 15/06/2026                  │ │
│  │    [Ver] [Responder]                  │ │
│  ├───────────────────────────────────────┤ │
│  │ 🆕 Laura & Pedro - Boda Madrid        │ │
│  │    Fecha: 20/08/2026                  │ │
│  │    [Ver] [Responder]                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📈 ACTIVIDAD RECIENTE                      │
│  • Hoy: 12 vistas en tu perfil             │
│  • Ayer: 3 clicks en "Contactar"          │
│  • Esta semana: 2 solicitudes nuevas       │
└─────────────────────────────────────────────┘
```

**Datos mostrados:**
- Total de vistas de perfil
- Clicks en contacto
- Solicitudes de presupuesto (pendientes/respondidas)
- Tasa de conversión
- Actividad reciente

---

### **2. 📬 SOLICITUDES DE PRESUPUESTO**

**Bandeja de entrada de solicitudes:**
```
┌─────────────────────────────────────────────┐
│  Solicitudes de Presupuesto                 │
├─────────────────────────────────────────────┤
│  [🆕 Nuevas] [⏳ Pendientes] [✓ Respondidas]│
├─────────────────────────────────────────────┤
│                                             │
│  🆕 NUEVA - María & Juan                    │
│  ┌───────────────────────────────────────┐ │
│  │ 📅 Fecha boda: 15/06/2026             │ │
│  │ 📍 Ubicación: Valencia                │ │
│  │ 💰 Presupuesto: 1,500 - 2,000€       │ │
│  │ 👥 Invitados: 120                     │ │
│  │                                       │ │
│  │ 📝 Mensaje:                           │ │
│  │ "Buscamos fotógrafo para nuestra     │ │
│  │ boda en Valencia. Nos gusta el        │ │
│  │ estilo natural y reportaje..."        │ │
│  │                                       │ │
│  │ 📧 contacto@pareja.com                │ │
│  │ 📱 +34 600 123 456                    │ │
│  │                                       │ │
│  │ Recibido: Hace 2 horas                │ │
│  │                                       │ │
│  │ [📝 Responder] [⏰ Recordar] [🗑️ Archivar]│
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- ✅ Ver todas las solicitudes
- ✅ Filtrar por estado (nuevas, pendientes, respondidas)
- ✅ Ver detalle completo de cada solicitud
- ✅ Datos de la pareja y la boda
- ✅ Responder directamente
- ✅ Programar recordatorios
- ✅ Archivar solicitudes

**Estructura en Firestore:**
```javascript
suppliers/{supplierId}/requests/{requestId}
{
  weddingId: "abc123",
  coupleName: "María & Juan",
  weddingDate: "2026-06-15",
  location: "Valencia",
  budget: { min: 1500, max: 2000, currency: "EUR" },
  guestCount: 120,
  message: "Buscamos fotógrafo...",
  contactEmail: "contacto@pareja.com",
  contactPhone: "+34 600 123 456",
  status: "new", // new, pending, responded, archived
  receivedAt: timestamp,
  respondedAt: timestamp,
  sourceUrl: "/proveedores?q=fotografo+valencia"
}
```

---

### **3. 💬 RESPONDER CON PLANTILLAS**

**Sistema de respuestas automáticas:**
```
┌─────────────────────────────────────────────┐
│  Responder a: María & Juan                  │
├─────────────────────────────────────────────┤
│                                             │
│  📝 Usar plantilla:                         │
│  [▼ Seleccionar plantilla ]                 │
│     • Respuesta estándar                    │
│     • Consulta disponibilidad               │
│     • Presupuesto detallado                 │
│     • Solicitar más información             │
│     • Crear nueva plantilla...              │
│                                             │
│  ✉️ Asunto:                                 │
│  [Presupuesto para boda - Valencia        ]│
│                                             │
│  📄 Mensaje:                                │
│  ┌───────────────────────────────────────┐ │
│  │ Hola María y Juan,                    │ │
│  │                                       │ │
│  │ Gracias por contactarme para vuestra │ │
│  │ boda en Valencia. Me encantaría ser   │ │
│  │ parte de vuestro día especial.        │ │
│  │                                       │ │
│  │ Os adjunto mi presupuesto:            │ │
│  │ • Paquete básico: 1,500€             │ │
│  │ • Paquete premium: 2,500€            │ │
│  │                                       │ │
│  │ Variables reemplazadas:               │ │
│  │ {coupleName} → María & Juan           │ │
│  │ {location} → Valencia                 │ │
│  │ {date} → 15/06/2026                   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📎 Adjuntar:                               │
│  [+ Añadir archivo] (PDF de presupuesto)   │
│                                             │
│  💰 Presupuesto propuesto:                  │
│  Desde [1500] hasta [2500] EUR              │
│                                             │
│  🔔 Seguimiento:                            │
│  □ Crear recordatorio para seguimiento     │
│    en [3] días si no responden             │
│                                             │
│  [📧 Enviar] [💾 Guardar borrador]          │
└─────────────────────────────────────────────┘
```

**Variables automáticas disponibles:**
```javascript
{
  {coupleName}     → "María & Juan"
  {weddingDate}    → "15 de junio de 2026"
  {location}       → "Valencia"
  {budget}         → "1,500 - 2,000€"
  {guestCount}     → "120 invitados"
  {supplierName}   → "Tu nombre"
  {phone}          → "Tu teléfono"
  {website}        → "Tu web"
}
```

**Plantillas predefinidas:**
```javascript
// 1. Respuesta estándar
"Hola {coupleName},
Gracias por contactarme para vuestra boda en {location}. 
Me encantaría saber más sobre vuestros planes.
¿Cuándo podríamos hablar? Saludos, {supplierName}"

// 2. Consulta disponibilidad
"Hola {coupleName},
He visto que vuestra boda es el {weddingDate}.
Déjame confirmar mi disponibilidad y os envío 
presupuesto en breve."

// 3. Presupuesto detallado
"Hola {coupleName},
Os adjunto mi presupuesto para {weddingDate} en {location}.
Paquetes disponibles:
• Básico: Desde X€
• Premium: Desde Y€
¿Os interesa alguno?"

// 4. Solicitar más info
"Hola {coupleName},
Me interesa mucho vuestra boda en {location}.
Para enviaros un presupuesto ajustado, 
¿podríais contarme más sobre vuestro estilo 
y expectativas?"
```

---

### **4. 📸 GESTIÓN DE PORTFOLIO**

**Subir y gestionar fotos:**
```
┌─────────────────────────────────────────────┐
│  Mi Portfolio                               │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Subir fotos] [🗂️ Álbumes] [⚙️ Ordenar]  │
│                                             │
│  ┌─────┬─────┬─────┬─────┬─────┐          │
│  │ 📷  │ 📷  │ 📷  │ 📷  │ 📷  │          │
│  │Foto1│Foto2│Foto3│Foto4│Foto5│          │
│  │[✏️][🗑️]│[✏️][🗑️]│[✏️][🗑️]│[✏️][🗑️]│[✏️][🗑️]│          │
│  └─────┴─────┴─────┴─────┴─────┘          │
│                                             │
│  Álbumes:                                   │
│  • Bodas 2024 (23 fotos)                   │
│  • Prebodas (12 fotos)                     │
│  • Detalles (8 fotos)                      │
│                                             │
│  Total: 43 fotos                            │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- ✅ Subir múltiples fotos
- ✅ Organizar en álbumes
- ✅ Añadir descripciones
- ✅ Reordenar (drag & drop)
- ✅ Foto de portada
- ✅ Optimización automática

---

### **5. 📊 ANALÍTICA Y ESTADÍSTICAS**

**Métricas detalladas:**
```
┌─────────────────────────────────────────────┐
│  Analítica                                  │
├─────────────────────────────────────────────┤
│                                             │
│  📈 ÚLTIMOS 30 DÍAS                         │
│                                             │
│  Vistas de perfil                           │
│  ████████████████░░░░░░ 245                │
│  +15% vs mes anterior                       │
│                                             │
│  Clicks en contacto                         │
│  ████████░░░░░░░░░░░░░░ 52                 │
│  +8% vs mes anterior                        │
│                                             │
│  Solicitudes de presupuesto                 │
│  ███░░░░░░░░░░░░░░░░░░░ 12                 │
│  +3% vs mes anterior                        │
│                                             │
│  Tasa de conversión                         │
│  23% (solicitudes / vistas)                 │
│                                             │
│  📊 DESGLOSE POR DÍA                        │
│  [Gráfico de líneas con vistas diarias]    │
│                                             │
│  🔍 BÚSQUEDAS QUE TE ENCONTRARON            │
│  • "fotógrafo valencia" (45 veces)         │
│  • "fotografo boda natural" (23 veces)     │
│  • "wedding photographer spain" (12 veces) │
│                                             │
│  📍 UBICACIONES DE BÚSQUEDA                 │
│  • Valencia: 60%                            │
│  • Alicante: 25%                            │
│  • Castellón: 15%                           │
└─────────────────────────────────────────────┘
```

---

### **6. ⚙️ CONFIGURACIÓN Y PERFIL**

**Gestión completa del perfil:**
```
┌─────────────────────────────────────────────┐
│  Configuración                              │
├─────────────────────────────────────────────┤
│                                             │
│  👤 PERFIL PÚBLICO                          │
│  • Nombre: [________________]               │
│  • Categoría: [Fotógrafo ▼]                │
│  • Descripción: [_______________]           │
│  • Ubicación: [Valencia, España]            │
│  • Teléfono: [+34 600 000 000]             │
│  • Email: [info@proveedor.com]             │
│  • Website: [www.proveedor.com]            │
│                                             │
│  💰 PRECIOS                                 │
│  • Desde: [1500] EUR                        │
│  • Hasta: [3000] EUR                        │
│                                             │
│  📅 DISPONIBILIDAD                          │
│  □ Disponible fines de semana              │
│  □ Disponible entre semana                 │
│  □ Viajo a otras provincias                │
│  • Radio de servicio: [50] km              │
│                                             │
│  📧 NOTIFICACIONES                          │
│  ☑ Email cuando reciba solicitud           │
│  ☑ Resumen semanal de actividad            │
│  □ SMS para solicitudes urgentes           │
│                                             │
│  🔐 SEGURIDAD                               │
│  • Cambiar contraseña                       │
│  • Sesiones activas                         │
│  • Verificación en dos pasos               │
│                                             │
│  [💾 Guardar cambios]                       │
└─────────────────────────────────────────────┘
```

---

### **7. 💬 CHAT / MENSAJERÍA (FUTURO)**

**Sistema de chat integrado:**
```
┌─────────────────────────────────────────────┐
│  Conversaciones                             │
├─────────────────────────────────────────────┤
│  Lista:          │  Chat con María & Juan   │
│  ┌──────────────┤  ┌────────────────────────┐
│  │ María & Juan││  │ Hola, ¿disponible?    │
│  │ Hace 2h  🔴 ││  │ 14:20                 │
│  ├──────────────┤│  │                       │
│  │ Laura & Pedro││  │ Sí, os envío info     │
│  │ Hace 1 día  ││  │ 14:25                 │
│  ├──────────────┤│  │                       │
│  │ Ana & Carlos ││  │ [Adjunto: budget.pdf] │
│  │ Hace 3 días ││  │ 14:30                 │
│  └──────────────┘│  └────────────────────────┘
│                  │  [Escribe un mensaje...  ]│
│                  │  [📎] [😊] [Enviar ➤]      │
└─────────────────────────────────────────────┘
```

---

## 🔄 FLUJO COMPLETO

### **1. Pareja busca proveedor:**
```
1. Pareja busca "fotógrafo Valencia"
2. Ve perfil del proveedor
3. Click en "Solicitar presupuesto"
4. Completa formulario:
   - Fecha de la boda
   - Ubicación
   - Presupuesto aproximado
   - N° de invitados
   - Mensaje
   - Email y teléfono
5. Submit
```

### **2. Proveedor recibe notificación:**
```
1. Email: "Nueva solicitud de María & Juan"
2. Notificación en dashboard
3. Badge de "Nuevas (1)" en sidebar
```

### **3. Proveedor responde:**
```
1. Entra al dashboard
2. Ve la solicitud en "Nuevas"
3. Click en "Ver detalle"
4. Lee toda la información
5. Click en "Responder"
6. Selecciona plantilla "Presupuesto detallado"
7. Personaliza el mensaje
8. Adjunta PDF con presupuesto
9. Envía
```

### **4. Seguimiento:**
```
1. Solicitud pasa a "Pendientes"
2. Si no hay respuesta en 3 días → Recordatorio
3. Proveedor puede hacer seguimiento
4. Si pareja responde → Continúa conversación
5. Si se cierra trato → Marcar como "Ganado"
```

---

## 💾 ESTRUCTURA DE DATOS

### **Colección: `suppliers/{supplierId}/`**
```javascript
{
  // Profile (ya existe)
  profile: {...},
  
  // Nuevas subcollections:
  requests/         → Solicitudes de presupuesto
  templates/        → Plantillas de respuesta
  conversations/    → Conversaciones con parejas
  analytics/        → Métricas y estadísticas
  notifications/    → Notificaciones
  settings/         → Configuración
}
```

### **Solicitud de presupuesto:**
```javascript
suppliers/{supplierId}/requests/{requestId}
{
  // Datos de la pareja
  coupleName: "María & Juan",
  weddingId: "abc123", // Si tienen cuenta
  
  // Datos de la boda
  weddingDate: "2026-06-15",
  location: {
    city: "Valencia",
    venue: "Masía El Bosque"
  },
  guestCount: 120,
  budget: {
    min: 1500,
    max: 2000,
    currency: "EUR"
  },
  
  // Mensaje
  message: "Buscamos fotógrafo...",
  
  // Contacto
  contactEmail: "pareja@email.com",
  contactPhone: "+34 600 123 456",
  
  // Estado
  status: "new", // new, viewed, responded, archived, won, lost
  priority: "normal", // high, normal, low
  
  // Timestamps
  receivedAt: timestamp,
  viewedAt: timestamp,
  respondedAt: timestamp,
  
  // Respuesta del proveedor
  response: {
    message: "Hola María y Juan...",
    quotedPrice: { min: 1500, max: 2500, currency: "EUR" },
    attachments: ["gs://bucket/quote.pdf"],
    sentAt: timestamp
  },
  
  // Seguimiento
  reminders: [
    { date: timestamp, sent: true }
  ],
  
  // Origen
  source: {
    url: "/proveedores?q=fotografo+valencia",
    searchQuery: "fotografo valencia",
    referrer: "google"
  }
}
```

### **Plantilla de respuesta:**
```javascript
suppliers/{supplierId}/templates/{templateId}
{
  name: "Respuesta estándar",
  subject: "Presupuesto para {coupleName}",
  body: "Hola {coupleName},\n\nGracias por...",
  variables: ["coupleName", "weddingDate", "location"],
  isDefault: false,
  usageCount: 23,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔔 NOTIFICACIONES

### **Email automático:**
```
De: notifications@mywed360.com
Para: proveedor@email.com
Asunto: 🆕 Nueva solicitud de presupuesto

Hola [Nombre],

Has recibido una nueva solicitud de presupuesto:

👰 Pareja: María & Juan
📅 Fecha: 15 de junio de 2026
📍 Ubicación: Valencia
💰 Presupuesto: 1,500 - 2,000€

[Ver solicitud →]

No dejes esperando a la pareja, ¡responde pronto!

---
MyWed360
```

### **Notificación push (futuro):**
```
🔔 Nueva solicitud de presupuesto
   María & Juan - Boda en Valencia
   [Responder ahora]
```

---

## 📱 VERSIÓN MÓVIL

El dashboard debe ser **100% responsive**:
- Vista optimizada para móviles
- Menú hamburguesa
- Cards apiladas
- Touch-friendly
- Notificaciones push

---

## 🚀 FASES DE IMPLEMENTACIÓN

### **FASE 1 - MVP (2-3 días):**
- ✅ Login de proveedores
- ✅ Ver solicitudes de presupuesto
- ✅ Responder con mensaje simple
- ✅ Ver perfil

### **FASE 2 - Plantillas (1 día):**
- ✅ Sistema de plantillas
- ✅ Variables automáticas
- ✅ Plantillas predefinidas

### **FASE 3 - Portfolio (1 día):**
- ✅ Subir fotos
- ✅ Organizar en álbumes
- ✅ Gestionar portfolio

### **FASE 4 - Analítica (1 día):**
- ✅ Métricas básicas
- ✅ Gráficos de actividad
- ✅ Búsquedas que te encontraron

### **FASE 5 - Notificaciones (1 día):**
- ✅ Email al recibir solicitud
- ✅ Recordatorios automáticos
- ✅ Resumen semanal

### **FASE 6 - Chat (3-4 días):**
- ✅ Sistema de mensajería
- ✅ Chat en tiempo real
- ✅ Adjuntar archivos

---

## 💡 FUNCIONALIDADES AVANZADAS (FUTURO)

### **1. Calendario de disponibilidad:**
- Marcar fechas ocupadas
- Sincronizar con Google Calendar
- Mostrar disponibilidad en perfil

### **2. Contratos y firma electrónica:**
- Generar contratos automáticos
- Firma digital
- Gestión de pagos

### **3. CRM integrado:**
- Pipeline de ventas
- Seguimiento de leads
- Automatizaciones

### **4. Facturación:**
- Generar facturas
- Tracking de pagos
- Recordatorios de pago

### **5. Reseñas y valoraciones:**
- Solicitar reseñas a parejas
- Mostrar en perfil
- Responder a reseñas

---

## 🎨 DISEÑO UI/UX

### **Principios:**
- ✅ **Simplicidad** - Interfaz limpia y fácil de usar
- ✅ **Rapidez** - Acciones en pocos clicks
- ✅ **Mobile-first** - Diseñado para móvil primero
- ✅ **Feedback claro** - El usuario siempre sabe qué pasa
- ✅ **Accesibilidad** - Compatible con lectores de pantalla

### **Colores:**
- Primario: Indigo/Azul (profesional)
- Success: Verde (solicitudes respondidas)
- Warning: Amarillo (pendientes)
- Danger: Rojo (urgente/expiradas)
- Neutral: Grises (texto y fondos)

---

## 📊 MÉTRICAS DE ÉXITO

### **Para proveedores:**
- Tiempo promedio de respuesta < 24h
- Tasa de conversión solicitud → contratación
- Satisfacción del proveedor (encuesta)

### **Para parejas:**
- Tiempo de respuesta del proveedor
- Calidad de respuestas
- Satisfacción con el proceso

---

## ❓ FAQ

### **¿Los proveedores pagan por usar el dashboard?**
**Opción A:** Gratis para todos  
**Opción B:** Freemium (básico gratis, premium de pago)  
**Opción C:** Comisión por contrato cerrado

### **¿Cómo se notifica al proveedor?**
Email + notificación en dashboard + (opcional) SMS/WhatsApp

### **¿Las parejas pueden ver si el proveedor leyó su mensaje?**
Sí, similar a "leído" en WhatsApp

### **¿Se puede integrar con su email actual?**
Futuro: Integración con Gmail/Outlook para centralizar comunicación

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

**MVP:**
- [ ] Backend: API de autenticación proveedores
- [ ] Backend: API de solicitudes
- [ ] Backend: API de respuestas
- [ ] Frontend: Página de login
- [ ] Frontend: Dashboard básico
- [ ] Frontend: Lista de solicitudes
- [ ] Frontend: Formulario de respuesta
- [ ] Email: Notificación de nueva solicitud
- [ ] Testing: Flujo completo end-to-end

---

## 🎯 SIGUIENTE PASO

**¿Empezamos con el MVP?**

1. Backend de autenticación
2. Dashboard básico frontend
3. Sistema de solicitudes
4. Respuestas simples

**Tiempo estimado:** 2-3 días para MVP funcional

---

**Creado:** 2025-10-28  
**Estado:** 📋 PROPUESTA - Pendiente aprobación  
**¿Procedemos con la implementación?** 🚀
