# 7. Flujo de Comunicación y Gestión de Emails (Detallado)

## 7.1 Sistema de Email Personalizado
**Objetivo:** Proporcionar email dedicado para toda la comunicación de la boda

### Generación Automática de Email de Boda
**Pasos detallados:**
- [ ] **Creación automática durante tutorial IA**
  - Formato: `[nombre].[pareja].boda[año]@mywed360.com`
  - Ejemplo: `ana.carlos.boda2024@mywed360.com`
  - Verificación de disponibilidad
  - Si no disponible: añadir número secuencial
  - Configuración automática de buzón

- [ ] **Configuración inicial**
  - NO redirección automática a emails personales
  - Configuración de respuesta automática
  - Firma personalizada con datos de la boda
  - Integración con calendario para eventos

### Acceso al Buzón de Emails
**Pasos detallados:**
- [ ] **Múltiples puntos de acceso**
  - Menú principal:  – Buzón de Emails – 
  - Perfil de usuario: opción  – Buzón – 
  - URL directa: `/buzon`
  - Notificación de nuevos emails

- [ ] **Interfaz del buzón**
  - Lista de emails con remitente, asunto, fecha
  - Filtros: leídos/no leídos, por remitente, por fecha
  - Búsqueda en contenido de emails
  - Vista previa sin abrir email completo

## 7.2 Funcionalidades de Email
**Objetivo:** Proporcionar todas las funciones de un cliente de email completo

### Composición y Envío
**Pasos detallados:**
- [ ] **Editor de emails**
  - Botón  – Nuevo Email –  prominente
  - Editor WYSIWYG con formato básico
  - Campos: Para, CC, CCO, Asunto, Cuerpo
  - Autocompletado de direcciones frecuentes
  - Guardado automático como borrador

- [ ] **Gestión de adjuntos**
  - Drag & drop de archivos
  - Límite de 25MB por email
  - Vista previa de imágenes
  - Validación de tipos de archivo
  - Barra de progreso de subida

- [ ] **Programación de envío**
  - Opción  – Enviar más tarde – 
  - Selector de fecha y hora
  - Confirmación antes del envío programado
  - Lista de emails programados

### Respuestas y Reenvíos
**Pasos detallados:**
- [ ] **Responder**
  - Botón  – Responder –  en vista de email
  - Citado automático del mensaje original
  - Mantenimiento del hilo de conversación
  - Autocompletado del campo  – Para – 

- [ ] **Responder a todos**
  - Inclusión automática de todos los destinatarios
  - Advertencia si hay muchos destinatarios
  - Opción de excluir destinatarios específicos

- [ ] **Reenviar**
  - Preservación de adjuntos originales
  - Prefijo  – Fwd: –  en asunto
  - Opción de añadir comentarios

## 7.3 Sistema de Plantillas para IA
**Objetivo:** Proporcionar plantillas que la IA puede usar para comunicarse con proveedores

### Plantillas para Uso de IA
**Pasos detallados:**
- [ ] **Plantillas base para IA**
  - **Solicitud de presupuesto**: Template que la IA usa para contactar proveedores automáticamente
  - **Seguimiento de propuestas**: Template para hacer seguimiento de presupuestos pendientes
  - **Confirmación de servicios**: Template para confirmar servicios contratados
  - **Solicitud de información**: Template para pedir detalles adicionales

- [ ] **Plantillas específicas por categoría**
  ```
  Solicitud Automática de Presupuesto (para uso de IA):
   – Estimado/a {{nombre_proveedor}},
  
  Nos ponemos en contacto desde MyWed360 en nombre de {{nombre_novios}} 
  para solicitar un presupuesto para su boda del {{fecha_boda}} en {{ubicacion_boda}}.
  
  Detalles del evento:
  - Fecha: {{fecha_boda}}
  - Número de invitados: {{num_invitados}}
  - Tipo de servicio: {{tipo_servicio}}
  - Presupuesto aproximado: {{rango_presupuesto}}
  
  Por favor, envíe su propuesta a este mismo email.
  
  Saludos cordiales,
  Equipo MyWed360 en nombre de {{nombre_novios}} – 
  ```

### Configuración de Plantillas IA
**Pasos detallados:**
- [ ] **Gestión de plantillas**
  - Biblioteca de plantillas predefinidas
  - Edición de plantillas por usuario
  - Variables automáticas del sistema
  - Validación de plantillas antes de uso

- [ ] **Uso automático por IA**
  - Selección automática de plantilla según contexto
  - Personalización automática con datos de la boda
  - Envío automático cuando el usuario lo solicite
  - Log de emails enviados automáticamente

## 7.4 Integración con Calendario
**Objetivo:** Convertir automáticamente emails en eventos de calendario

### Detección Automática de Eventos
**Pasos detallados:**
- [ ] **Análisis de contenido con IA**
  - Detección de fechas y horas en texto
  - Identificación de ubicaciones
  - Reconocimiento de tipos de evento (reunión, cita, entrega)
  - Extracción de participantes

- [ ] **Sugerencias de eventos**
  - Botón  – Añadir al calendario –  en emails relevantes
  - Formulario precompletado con datos detectados
  - Opción de editar antes de guardar
  - Vinculación del evento con el email original

### Gestión de Eventos Creados
**Pasos detallados:**
- [ ] **Sincronización bidireccional**
  - Cambios en calendario se reflejan en email
  - Notificaciones de cambios a participantes
  - Historial de modificaciones
  - Resolución de conflictos de horario

## 7.5 Análisis Inteligente de Emails con IA
**Objetivo:** Analizar automáticamente emails recibidos y extraer información relevante para el sistema

### Análisis Automático de Contenido
**Pasos detallados:**
- [ ] **Detección de tipos de email**
  - **Presupuestos**: Identificar propuestas económicas de proveedores
  - **Confirmaciones**: Detectar confirmaciones de servicios, citas, pagos
  - **Reuniones**: Extraer propuestas de reunión con fecha, hora y lugar
  - **Facturas**: Identificar facturas y datos de facturación
  - **Cambios**: Detectar modificaciones en servicios o fechas
  - **RSVP**: Identificar confirmaciones de asistencia de invitados

- [ ] **Extracción de datos estructurados**
  - Fechas y horarios de reuniones/eventos
  - Importes económicos y conceptos
  - Datos de contacto de proveedores
  - Direcciones y ubicaciones
  - Números de referencia y pedidos
  - Condiciones y términos importantes

### Inserción Automática en el Sistema
**Pasos detallados:**
- [ ] **Creación automática de registros**
  - Presupuestos → Nuevo proveedor en módulo de proveedores
  - Reuniones → Evento en calendario con datos extraídos
  - Confirmaciones → Actualización de estado en tareas/proveedores
  - Facturas → Registro en módulo financiero
  - RSVP → Actualización en lista de invitados

- [ ] **Validación y confirmación**
  - Sugerencias de inserción para revisión del usuario
  - Confianza del análisis IA (alta/media/baja)
  - Opción de editar datos antes de insertar
  - Historial de inserciones automáticas realizadas

## 7.6 Respuestas Automáticas
**Objetivo:** Mantener comunicación fluida incluso cuando no se puede responder inmediatamente

### Configuración de Auto-respuestas
**Pasos detallados:**
- [ ] **Respuesta automática general**
  - Activación/desactivación global
  - Mensaje personalizable
  - Exclusión de remitentes conocidos
  - Límite de una respuesta por remitente/día

- [ ] **Respuestas contextuales**
  - Diferentes mensajes según categoría del email
  - Respuesta específica para proveedores
  - Respuesta específica para invitados
  - Respuesta de emergencia para fechas cercanas

### Plantillas de Auto-respuesta
**Pasos detallados:**
- [ ] **Plantillas predefinidas**
  ```
  General:
   – Gracias por contactarnos sobre nuestra boda del {{fecha_boda}}. 
  Hemos recibido tu mensaje y te responderemos en las próximas 24-48 horas.
  
  Para consultas urgentes, puedes contactarnos al {{telefono_contacto}}.
  
  ¡Gracias por ser parte de nuestro día especial!
  {{nombre_novios}} – 
  
  Proveedores:
   – Estimado/a proveedor,
  
  Gracias por su email. Estamos revisando su propuesta y nos pondremos 
  en contacto en un plazo máximo de 3 días laborables.
  
  Saludos cordiales,
  {{nombre_novios}} – 
  ```

## 7.7 Centro de Notificaciones
**Objetivo:** Mantener informados a los usuarios de toda la actividad relevante

### Tipos de Notificaciones
**Pasos detallados:**
- [ ] **Notificaciones de email**
  - Nuevos emails recibidos
  - Emails importantes (proveedores, cambios)
  - Emails con fechas próximas
  - Respuestas a emails enviados

- [ ] **Notificaciones de eventos**
  - Recordatorios de citas próximas
  - Cambios en eventos del calendario
  - Conflictos de horario detectados
  - Eventos creados automáticamente desde emails

### Gestión de Notificaciones
**Pasos detallados:**
- [ ] **Centro de notificaciones**
  - Icono de campana con contador
  - Lista cronológica de notificaciones
  - Filtrado por tipo (emails, eventos, sistema)
  - Marcar como leída/eliminar

- [ ] **Configuración de preferencias**
  - Activar/desactivar por tipo
  - Frecuencia de notificaciones
  - Horarios de no molestar
  - Canales de notificación (app, email, push)

## 7.8 Búsqueda Global
**Objetivo:** Encontrar rápidamente cualquier información en emails y eventos

### Motor de Búsqueda Unificado
**Pasos detallados:**
- [ ] **Acceso a búsqueda**
  - Icono de lupa en barra superior
  - Atajo de teclado `Ctrl/Cmd + K`
  - Campo de búsqueda siempre visible
  - Búsqueda por voz (opcional)

- [ ] **Funcionalidades de búsqueda**
  - Búsqueda en asuntos y contenido de emails
  - Búsqueda en eventos y calendario
  - Búsqueda en datos de proveedores
  - Búsqueda en documentos adjuntos

### Resultados y Navegación
**Pasos detallados:**
- [ ] **Presentación de resultados**
  - Resultados agrupados por tipo
  - Vista previa de contenido relevante
  - Resaltado de términos de búsqueda
  - Navegación por teclado (↑↓, Enter)

- [ ] **Filtros avanzados**
  - Por fecha (última semana, mes, año)
  - Por remitente/destinatario
  - Por categoría/etiqueta
  - Por estado (leído/no leído)

## Estructura de Datos

```javascript
// /weddings/{weddingId}/emails
{
  weddingEmail:  – ana.carlos.boda2024@mywed360.com – ,
  settings: {
    forwardToPersonal: false,
    personalEmails: [ – ana@email.com – ,  – carlos@email.com – ],
    autoReply: {
      enabled: true,
      general:  – Gracias por contactarnos... – ,
      providers:  – Estimado proveedor... – ,
      guests:  – Gracias por tu mensaje... – 
    },
    signature:  – Ana & Carlos\nBoda 15 Junio 2024\nana.carlos.boda2024@mywed360.com – 
  },
  emails: [
    {
      id:  – email_001 – ,
      from:  – proveedor@flores.com – ,
      to: [ – ana.carlos.boda2024@mywed360.com – ],
      subject:  – Presupuesto decoración floral – ,
      body:  – Adjunto presupuesto... – ,
      date:  – 2024-01-15T10:30:00Z – ,
      category:  – providers – ,
      read: false,
      attachments: [ – presupuesto_flores.pdf – ],
      aiSuggestions: {
        addToCalendar: {
          suggested: true,
          event: {
            title:  – Reunión flores – ,
            date:  – 2024-01-20 – ,
            time:  – 16:00 – 
          }
        }
      }
    }
  ],
  templates: [
    {
      id:  – template_001 – ,
      name:  – Solicitud presupuesto – ,
      category:  – providers – ,
      subject:  – Solicitud de presupuesto - Boda {{fecha_boda}} – ,
      body:  – Estimado/a {{nombre_proveedor}}... – 
    }
  ]
}
```

## Estado de Implementación

### ✅ Completado
- Sistema básico de emails
- Interfaz de buzón
- Composición y envío básico

### 🚧 En Desarrollo  
- Clasificación automática con IA
- Sistema de plantillas
- Integración con calendario

### ❌ Pendiente
- Respuestas automáticas
- Centro de notificaciones avanzado
- Búsqueda global
- Análisis de contenido con IA
- Programación de envíos
