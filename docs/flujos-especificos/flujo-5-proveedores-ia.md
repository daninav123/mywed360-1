# 5. Flujo de GestiÃ³n de Proveedores con IA (Detallado)

## 5.1 Mini-Tutorial IA para Proveedores
**Objetivo:** Guiar al usuario en la selecciÃ³n de servicios necesarios

### Tutorial Conversacional Inicial
**Pasos detallados:**
- [ ] **Bienvenida contextual**
  -  â€“ Â¡Perfecto! Vamos a organizar los proveedores para tu boda â€“ 
  - AnÃ¡lisis de datos existentes (tipo de boda, presupuesto, fecha)
  -  â€“ BasÃ¡ndome en tu boda [tipo] del [fecha], estos son los servicios esenciales â€“ 

- [ ] **IdentificaciÃ³n de servicios necesarios**
  - IA pregunta:  â€“ Â¿QuÃ© servicios crees que vas a necesitar? â€“ 
  - Lista de servicios esenciales vs opcionales
  - PriorizaciÃ³n segÃºn presupuesto disponible
  - Sugerencias basadas en tipo de boda

- [ ] **Servicios esenciales identificados**
  - **Obligatorios:** Lugar/venue, catering, fotografÃ­a
  - **Muy importantes:** MÃºsica/DJ, flores, transporte
  - **Opcionales:** VideografÃ­a, wedding planner, animaciÃ³n
  - **EspecÃ­ficos:** SegÃºn tipo (religiosa: mÃºsica sacra, civil: oficiante)

- [ ] **ConfiguraciÃ³n de tarjetas de servicios**
  - GeneraciÃ³n automÃ¡tica de tarjetas vacÃ­as
  - Una tarjeta por cada servicio identificado
  - Estado inicial:  â€“ Sin contratar â€“  (transparente)
  - InformaciÃ³n bÃ¡sica: presupuesto estimado, prioridad

## 5.2 Dashboard de Proveedores con Tarjetas VacÃ­as
**Objetivo:** Visualizar servicios pendientes y contratados

### Sistema de Tarjetas DinÃ¡micas
**Pasos detallados:**
- [ ] **Tarjetas vacÃ­as/transparentes**
  - DiseÃ±o semitransparente para servicios sin contratar
  - Icono del tipo de servicio
  - TÃ­tulo del servicio
  -  â€“ Buscar proveedor â€“  como acciÃ³n principal
  - Presupuesto estimado por IA

- [ ] **Estados de tarjetas**
  - **VacÃ­a:** Sin proveedor asignado (transparente)
  - **En proceso:** Contactando proveedores (amarillo)
  - **Presupuestos recibidos:** Esperando decisiÃ³n (azul)
  - **Contratado:** Proveedor confirmado (verde)
  - **Rechazado:** Servicio descartado (gris)

- [ ] **InformaciÃ³n por tarjeta**
  - Nombre del servicio
  - Presupuesto asignado vs gastado
  - Fecha lÃ­mite para contratar
  - Estado del proceso
  - Proveedor actual (si existe)
  - PrÃ³xima acciÃ³n requerida

### GestiÃ³n Visual de Servicios
**Pasos detallados:**
- [ ] **Filtros y vistas**
  - Ver todos los servicios
  - Solo servicios pendientes
  - Solo servicios contratados
  - Filtrar por presupuesto
  - Ordenar por prioridad/fecha lÃ­mite

- [ ] **Acciones rÃ¡pidas**
  -  â€“ Buscar proveedor â€“  â†’ BÃºsqueda con IA
  -  â€“ No necesito este servicio â€“  â†’ Marcar como descartado
  -  â€“ Ya tengo proveedor â€“  â†’ AÃ±adir proveedor externo
  -  â€“ Cambiar presupuesto â€“  â†’ Ajustar asignaciÃ³n

## 5.3 BÃºsqueda de Proveedores con IA
**Objetivo:** Encontrar proveedores adecuados segÃºn criterios especÃ­ficos

### BÃºsqueda Inteligente
**Pasos detallados:**
- [ ] **Criterios de bÃºsqueda**
  - UbicaciÃ³n (radio desde venue)
  - Presupuesto disponible
  - Fecha de la boda (disponibilidad)
  - Estilo de boda (clÃ¡sico, moderno, rÃºstico)
  - Valoraciones mÃ­nimas
  - Servicios especÃ­ficos requeridos

- [ ] **Base de datos de proveedores**
  - Directorio integrado de proveedores locales
  - InformaciÃ³n verificada: precios, disponibilidad, portfolio
  - Sistema de valoraciones y reseÃ±as
  - IntegraciÃ³n con APIs de proveedores externos

- [ ] **Resultados personalizados**
  - Lista ordenada por compatibilidad
  - PuntuaciÃ³n IA basada en criterios
  - Comparativa rÃ¡pida de precios
  - Disponibilidad en tiempo real
  - Recomendaciones especiales

### AnÃ¡lisis de Compatibilidad
**Pasos detallados:**
- [ ] **Algoritmo de matching**
  - AnÃ¡lisis de estilo vs portfolio del proveedor
  - Compatibilidad de presupuesto
  - Experiencia en tipo de boda similar
  - Proximidad geogrÃ¡fica
  - Disponibilidad confirmada

- [ ] **PuntuaciÃ³n compuesta**
  - Calidad del servicio (40%)
  - Ajuste al presupuesto (30%)
  - Disponibilidad (20%)
  - Proximidad (10%)
  - Bonificaciones por recomendaciones

## 5.4 Contacto AutomÃ¡tico con IA
**Objetivo:** Automatizar el proceso de solicitud de presupuestos

### GeneraciÃ³n AutomÃ¡tica de Emails
**Pasos detallados:**
- [ ] **Plantilla personalizada por IA**
  - AnÃ¡lisis del proveedor y su estilo de comunicaciÃ³n
  - PersonalizaciÃ³n segÃºn informaciÃ³n de la boda
  - Tono apropiado (formal/informal segÃºn proveedor)
  - InformaciÃ³n relevante incluida automÃ¡ticamente

- [ ] **Contenido del email generado**
  - Saludo personalizado
  - PresentaciÃ³n de los novios
  - Detalles de la boda (fecha, lugar, tipo)
  - Servicios especÃ­ficos requeridos
  - Presupuesto aproximado (opcional)
  - Solicitud de disponibilidad y presupuesto
  - InformaciÃ³n de contacto

- [ ] **Ejemplo de email generado:**
```
Asunto: Consulta para fotografÃ­a de boda - Ana & Carlos - 15 Junio 2024

Estimado/a [Nombre FotÃ³grafo],

Mi nombre es Ana y junto con mi pareja Carlos estamos organizando nuestra boda 
para el 15 de junio de 2024 en el Hotel Majestic de Madrid.

Hemos visto su trabajo y nos encanta su estilo [natural/clÃ¡sico/artÃ­stico]. 
Estamos buscando un fotÃ³grafo para cubrir tanto la ceremonia (17:00h) como 
el banquete posterior.

Detalles de nuestra boda:
- Fecha: 15 de junio de 2024
- Ceremonia: 17:00h en Iglesia San Miguel
- Banquete: 20:00h en Hotel Majestic
- Invitados aproximados: 120 personas
- Estilo: clÃ¡sico elegante

Â¿EstarÃ­a disponible para esa fecha? Nos gustarÃ­a conocer sus paquetes y 
precios para poder tomar una decisiÃ³n informada.

Quedamos a la espera de su respuesta.

Un saludo cordial,
Ana GarcÃ­a y Carlos LÃ³pez
TelÃ©fono: [telÃ©fono]
Email: [email]
```

### EnvÃ­o y Seguimiento
**Pasos detallados:**
- [ ] **EnvÃ­o automÃ¡tico**
  - RevisiÃ³n previa del email por el usuario
  - OpciÃ³n de editar antes del envÃ­o
  - EnvÃ­o desde email personal del usuario
  - Copia oculta al sistema para seguimiento

- [ ] **Seguimiento automÃ¡tico**
  - DetecciÃ³n de respuestas recibidas
  - AnÃ¡lisis del contenido de la respuesta
  - ExtracciÃ³n de informaciÃ³n clave (precios, disponibilidad)
  - NotificaciÃ³n al usuario de respuestas recibidas

- [ ] **Recordatorios automÃ¡ticos**
  - Si no hay respuesta en 3 dÃ­as â†’ recordatorio suave
  - Si no hay respuesta en 7 dÃ­as â†’ segundo recordatorio
  - Si no hay respuesta en 14 dÃ­as â†’ marcar como no disponible

## 5.5 AnÃ¡lisis AutomÃ¡tico de Respuestas
**Objetivo:** Procesar y analizar automÃ¡ticamente las respuestas de proveedores

### Procesamiento con IA
**Pasos detallados:**
- [ ] **AnÃ¡lisis de contenido**
  - ExtracciÃ³n de precios mencionados
  - IdentificaciÃ³n de disponibilidad
  - Servicios incluidos/excluidos
  - Condiciones especiales
  - Tono y profesionalidad de la respuesta

- [ ] **EstructuraciÃ³n de datos**
  - ConversiÃ³n de texto libre a datos estructurados
  - NormalizaciÃ³n de precios (por hora, por evento, etc.)
  - IdentificaciÃ³n de paquetes ofrecidos
  - ExtracciÃ³n de fechas y horarios

- [ ] **Ejemplo de anÃ¡lisis:**
```javascript
// Respuesta original del proveedor
 â€“ Hola Ana y Carlos, gracias por contactarnos. SÃ­ tenemos disponibilidad 
para el 15 de junio. Nuestro paquete completo incluye 8 horas de cobertura, 
300 fotos editadas y Ã¡lbum digital por 1.800â‚¬. TambiÃ©n ofrecemos Ã¡lbum 
fÃ­sico por 300â‚¬ adicionales... â€“ 

// Datos extraÃ­dos por IA
{
  availability: true,
  packages: [
    {
      name:  â€“ Paquete completo â€“ ,
      price: 1800,
      currency:  â€“ EUR â€“ ,
      includes: [
         â€“ 8 horas de cobertura â€“ ,
         â€“ 300 fotos editadas â€“ , 
         â€“ Ã¡lbum digital â€“ 
      ],
      duration: 8
    }
  ],
  addOns: [
    {
      name:  â€“ Ãlbum fÃ­sico â€“ ,
      price: 300,
      currency:  â€“ EUR â€“ 
    }
  ],
  responseTime:  â€“ 2 horas â€“ ,
  professionalismScore: 8.5,
  nextSteps: [ â€“ Solicitar portfolio â€“ ,  â€“ Programar reuniÃ³n â€“ ]
}
```

### PresentaciÃ³n al Usuario
**Pasos detallados:**
- [ ] **Dashboard de respuestas**
  - Resumen ejecutivo de cada respuesta
  - Comparativa automÃ¡tica de precios
  - PuntuaciÃ³n de cada propuesta
  - RecomendaciÃ³n de IA
  - Acciones sugeridas

- [ ] **NotificaciÃ³n inteligente**
  -  â€“ Has recibido 3 respuestas para fotografÃ­a â€“ 
  -  â€“ El presupuesto promedio es 1.650â‚¬ â€“ 
  -  â€“ Te recomiendo contactar con [Proveedor X] por su excelente relaciÃ³n calidad-precio â€“ 
  - Botones de acciÃ³n rÃ¡pida

## 5.6 Proceso de DecisiÃ³n Asistido
**Objetivo:** Ayudar al usuario a tomar la mejor decisiÃ³n

### Comparativa AutomÃ¡tica
**Pasos detallados:**
- [ ] **Tabla comparativa**
  - Precios normalizados
  - Servicios incluidos (checkmarks)
  - Valoraciones y reseÃ±as
  - Tiempo de respuesta
  - Profesionalismo percibido

- [ ] **AnÃ¡lisis de valor**
  - RelaciÃ³n calidad-precio
  - Servicios Ãºnicos ofrecidos
  - Flexibilidad en condiciones
  - Experiencia en bodas similares

### RecomendaciÃ³n Final de IA
**Pasos detallados:**
- [ ] **ConversaciÃ³n de decisiÃ³n**
  -  â€“ He analizado las 4 respuestas que recibiste para fotografÃ­a â€“ 
  -  â€“ BasÃ¡ndome en tu presupuesto de 2.000â‚¬ y estilo clÃ¡sico, te recomiendo... â€“ 
  - ExplicaciÃ³n de la recomendaciÃ³n
  - Pros y contras de cada opciÃ³n

- [ ] **ConfirmaciÃ³n de elecciÃ³n**
  - Usuario selecciona proveedor preferido
  - IA genera email de confirmaciÃ³n
  - ProgramaciÃ³n automÃ¡tica de reuniÃ³n
  - ActualizaciÃ³n de tarjeta de servicio

- [ ] **Seguimiento post-decisiÃ³n**
  - ActualizaciÃ³n automÃ¡tica de presupuesto
  - CreaciÃ³n de tareas relacionadas
  - ProgramaciÃ³n de recordatorios
  - IntegraciÃ³n con timeline general

## 5.7 Oferta de Wedding Planner
**Objetivo:** Ofrecer servicios de wedding planner en el momento apropiado

### DetecciÃ³n del Momento Ã“ptimo
**Pasos detallados:**
- [ ] **Triggers para ofrecer servicio**
  - Usuario ha contactado con 3+ proveedores
  - Presupuesto total > 15.000â‚¬
  - Fecha de boda < 6 meses
  - Usuario muestra signos de estrÃ©s/agobio
  - MÃºltiples servicios sin contratar

- [ ] **Mensaje contextual de IA**
  -  â€“ Veo que estÃ¡s gestionando muchos proveedores... â€“ 
  -  â€“ Â¿Te gustarÃ­a que un wedding planner profesional te ayude? â€“ 
  -  â€“ Puedo conectarte con planners especializados en tu zona â€“ 
  - ExplicaciÃ³n de beneficios especÃ­ficos

### IntegraciÃ³n de Wedding Planners
**Pasos detallados:**
- [ ] **Base de datos de planners**
  - Planners verificados por zona
  - Especialidades y estilos
  - Tarifas y paquetes de servicio
  - Valoraciones de clientes anteriores

- [ ] **Matching inteligente**
  - AnÃ¡lisis de necesidades especÃ­ficas
  - Compatibilidad de estilo
  - Presupuesto disponible para planner
  - Disponibilidad para la fecha

- [ ] **Proceso de contrataciÃ³n**
  - PresentaciÃ³n de 2-3 planners recomendados
  - Contacto automÃ¡tico similar a otros proveedores
  - ReuniÃ³n de presentaciÃ³n gratuita
  - IntegraciÃ³n completa si se contrata

**Estructura de datos:**
```javascript
// /weddings/{weddingId}/vendors/{vendorId}
{
  id:  â€“ vendor_photographer_001 â€“ ,
  serviceType:  â€“ photography â€“ ,
  status:  â€“ contacted â€“ , // empty, contacted, quoted, contracted, rejected
  name:  â€“ MarÃ­a GarcÃ­a FotografÃ­a â€“ ,
  contact: {
    email:  â€“ maria@fotografiabodas.com â€“ ,
    phone:  â€“ +34600123456 â€“ ,
    website:  â€“ www.mariafotografia.com â€“ 
  },
  location: {
    city:  â€“ Madrid â€“ ,
    distance: 5.2 // km from venue
  },
  communication: [
    {
      id:  â€“ comm_001 â€“ ,
      type:  â€“ outbound_email â€“ ,
      date:  â€“ 2024-01-15T10:00:00Z â€“ ,
      subject:  â€“ Consulta para fotografÃ­a de boda â€“ ,
      content:  â€“ ... â€“ ,
      aiGenerated: true
    },
    {
      id:  â€“ comm_002 â€“ , 
      type:  â€“ inbound_email â€“ ,
      date:  â€“ 2024-01-15T12:30:00Z â€“ ,
      subject:  â€“ Re: Consulta para fotografÃ­a de boda â€“ ,
      content:  â€“ ... â€“ ,
      aiAnalyzed: {
        availability: true,
        pricing: [
          { package:  â€“ BÃ¡sico â€“ , price: 1200, currency:  â€“ EUR â€“  },
          { package:  â€“ Completo â€“ , price: 1800, currency:  â€“ EUR â€“  }
        ],
        responseTime: 2.5, // hours
        professionalismScore: 8.5,
        nextSteps: [ â€“ schedule_meeting â€“ ,  â€“ request_portfolio â€“ ]
      }
    }
  ],
  quotes: [
    {
      id:  â€“ quote_001 â€“ ,
      package:  â€“ Paquete Completo â€“ ,
      price: 1800,
      currency:  â€“ EUR â€“ ,
      includes: [ â€“ 8 horas cobertura â€“ ,  â€“ 300 fotos editadas â€“ ,  â€“ Ã¡lbum digital â€“ ],
      validUntil:  â€“ 2024-02-15 â€“ ,
      aiScore: 8.2
    }
  ],
  aiRecommendation: {
    score: 8.2,
    reasons: [ â€“ Excelente relaciÃ³n calidad-precio â€“ ,  â€“ Estilo compatible â€“ ,  â€“ Respuesta rÃ¡pida â€“ ],
    concerns: [ â€“ Portfolio limitado en bodas clÃ¡sicas â€“ ]
  },
  contracted: false,
  contractDate: null,
  finalPrice: null,
  createdAt:  â€“ 2024-01-15T10:00:00Z â€“ 
}
```

**Componentes necesarios:**
- `VendorDashboard.jsx`
- `ServiceCards.jsx`
- `VendorSearch.jsx`
- `AIEmailGenerator.jsx`
- `ResponseAnalyzer.jsx`
- `VendorComparison.jsx`
- `WeddingPlannerOffer.jsx`

**APIs/Servicios:**
- OpenAI para generaciÃ³n y anÃ¡lisis de emails
- Email service para envÃ­o automÃ¡tico
- Vendor database/API
- Calendar integration para reuniones
- Payment processing para contrataciones
## Estado de ImplementaciÃ³n

### Completado
- Documento base del flujo de proveedores con IA

### En Desarrollo
- DefiniciÃ³n de integraciones y componentes de UI

### Pendiente
- Contrastar con la implementaciÃ³n y marcar entregables por mÃ³dulo
\n\n## Nota de alcance (pagos/contratos)\n- Los pagos a proveedores y los contratos legales se gestionan en la plataforma del proveedor.\n- La aplicación no procesa pagos ni genera contratos propios.\n- Se pueden reflejar enlaces/estados (p.ej., ‘señal pagada’, ‘contrato firmado’) de forma informativa.\n- El calendario operativo se gestiona en la página de Tareas.\n- La tarjeta del proveedor muestra los correos relacionados con ese proveedor desde el buzón unificado.\n
