# 🎯 Panel de Admin - Sistema de Crowdsourcing

## ✅ Implementado

Panel completo de administración para revisar y gestionar sugerencias de opciones especiales de proveedores.

## 📍 Acceso

**URL:** `/admin/supplier-options`

**Ubicación en menú:** Configuración > Opciones Crowdsourcing

**Permisos:** Solo administradores

## 🎨 Características del Panel

### **1. Dashboard de Estadísticas**
Muestra en tiempo real:
- **Total de sugerencias** recibidas
- **En revisión** (score 60-80)
- **Aprobadas** automática o manualmente
- **Score promedio** de todas las sugerencias

### **2. Filtros de Estado**
Permite filtrar sugerencias por:
- `review` - En revisión manual (score 60-80)
- `pending` - Pendientes de validación IA
- `approved` - Aprobadas
- `rejected` - Rechazadas
- `duplicate` - Duplicadas

### **3. Vista Detallada de Sugerencias**

Cada sugerencia muestra:
- **Nombre** de la opción sugerida
- **Badge de estado** con color
- **Score de IA** (0-100) con código de colores
- **Categoría** del proveedor
- **Descripción** proporcionada por el usuario
- **Usuario** que sugirió (nombre + email)
- **Fecha** de creación

### **4. Análisis de IA**

Panel azul que muestra:
- **Razonamiento** completo de la IA
- **Relevancia** (high/medium/low)
- **Claridad** (high/medium/low)
- **Duplicado** (si aplica, indica de qué opción)

### **5. Acciones de Revisión**

Botones para cada sugerencia:
- ✅ **Aprobar** - Añade la opción al catálogo inmediatamente
- ❌ **Rechazar** - Rechaza y notifica al usuario

Ambas acciones permiten añadir un **comentario opcional** explicando la decisión.

### **6. Top Contribuidores**

Ranking de usuarios con más sugerencias aprobadas:
- Nombre del usuario
- Total de sugerencias enviadas
- Número de aprobadas

## 🔄 Flujo de Trabajo

### **Sugerencias con Score 60-80 (Revisión Manual)**

1. Usuario accede a `/admin/supplier-options`
2. Selecciona filtro "En Revisión"
3. Ve lista de sugerencias que requieren atención
4. Revisa cada una:
   - Lee el análisis de IA
   - Evalúa relevancia y utilidad
   - Decide aprobar o rechazar
5. Click en "Revisar" para expandir opciones
6. Escribe razón (opcional para aprobar, requerido para rechazar)
7. Click en ✅ Aprobar o ❌ Rechazar
8. Sistema ejecuta la acción:
   - **Si aprueba:** Añade al catálogo + notifica usuario
   - **Si rechaza:** Notifica usuario con razón

### **Sugerencias Automáticas (Score > 80)**

Estas se aprueban automáticamente por el cron job, pero se pueden ver en:
- Filtro "Aprobadas" para auditoría
- Ver qué opciones se añadieron automáticamente

## 📊 API Endpoints Utilizados

El panel consume estos endpoints:

### GET `/api/supplier-options/review-queue`
**Query params:**
- `status` (default: 'review')

**Response:**
```json
{
  "suggestions": [...],
  "total": 5
}
```

### GET `/api/supplier-options/stats`
**Response:**
```json
{
  "stats": {
    "total": 125,
    "byStatus": { ... },
    "byCategory": { ... },
    "avgScore": 78,
    "topContributors": [...],
    "totalDynamicOptions": 23
  }
}
```

### POST `/api/supplier-options/approve/:suggestionId`
**Body:**
```json
{
  "reason": "Opción muy útil y común en la industria"
}
```

### POST `/api/supplier-options/reject/:suggestionId`
**Body (reason es requerido):**
```json
{
  "reason": "Demasiado específica, no aplicable a mayoría de usuarios"
}
```

## 🎯 Casos de Uso

### **Caso 1: Aprobar Sugerencia Buena**

**Escenario:** Usuario sugiere "Time-lapse del montaje" para Fotografía
- Score IA: 75 (requiere revisión)
- Relevancia: medium (no esencial pero útil)
- Claridad: high

**Acción:**
1. Admin revisa
2. Decide que es útil para algunos usuarios
3. Aprueba con razón: "Opción interesante para bodas con decoración especial"
4. Sistema añade automáticamente al catálogo
5. Usuario recibe notificación de aprobación

**Resultado:** Opción disponible en Info Boda > Fotografía para todos

### **Caso 2: Rechazar Sugerencia Muy Específica**

**Escenario:** Usuario sugiere "Fotos submarinas en piscina"
- Score IA: 65 (requiere revisión)
- Relevancia: low (muy nicho)

**Acción:**
1. Admin revisa
2. Decide que es demasiado específica
3. Rechaza con razón: "Opción muy específica para casos muy limitados. No aplica a la mayoría de bodas"
4. Sistema notifica al usuario explicando el rechazo

**Resultado:** Sugerencia archivada, usuario informado

### **Caso 3: Detectar y Prevenir Duplicados**

**Escenario:** Usuario sugiere "Drone aéreo"
- Ya existe opción "Dron para fotos aéreas"
- IA detecta: duplicate: true, duplicateOf: "drone"
- Score: 45 (rechazo automático)

**Acción:** Sistema rechaza automáticamente sin intervención del admin

## 🔍 Monitoreo y Auditoría

### **Métricas Clave a Vigilar**

1. **Score promedio:** Si baja mucho (<60), revisar calidad de sugerencias
2. **Tasa de revisión manual:** Si >30%, ajustar umbral de aprobación
3. **Sugerencias pendientes:** No dejar acumular más de 10
4. **Top contribuidores:** Identificar usuarios power (gamificación futura)

### **Frecuencia de Revisión Recomendada**

- **Diaria:** Revisar cola de sugerencias en revisión
- **Semanal:** Analizar estadísticas y tendencias
- **Mensual:** Evaluar uso de opciones dinámicas (usageCount)

## 🚨 Alertas y Notificaciones

El sistema notifica al usuario automáticamente cuando:
- ✅ Su sugerencia es **aprobada** (por IA o admin)
- ❌ Su sugerencia es **rechazada** (con razón explicada)

Las notificaciones se almacenan en:
```
notifications/{notificationId}
  userId: "uid123"
  type: "option_approved" | "option_rejected"
  title: "..."
  message: "..."
  data: { suggestionId, category, optionLabel, reasoning }
```

## 🎨 Código de Colores

### **Badges de Estado**
- 🟡 **Pendiente** (pending) - Gris
- 🔵 **Validando** (validating) - Azul
- 🟡 **En Revisión** (review) - Amarillo
- 🟢 **Aprobada** (approved) - Verde
- 🔴 **Rechazada** (rejected) - Rojo
- 🟣 **Duplicada** (duplicate) - Púrpura

### **Score de IA**
- 🟢 **80-100** - Verde (aprobación automática)
- 🟡 **60-79** - Amarillo (revisión manual)
- 🔴 **0-59** - Rojo (rechazo automático)

## 🔧 Configuración

### **Ajustar Umbral de Aprobación**

Editar `backend/jobs/processOptionSuggestions.js`:
```javascript
// Línea ~50
if (score >= 85) {  // Cambiar de 80 a 85 para ser más estricto
  newStatus = 'approved';
}
```

### **Cambiar Límite de Revisión Manual**

Editar `backend/routes/supplier-options.js`:
```javascript
// Línea ~195
.limit(50)  // Cambiar para mostrar más/menos sugerencias
```

## 📱 Responsive

El panel es completamente responsive:
- **Desktop:** Layout completo con sidebar
- **Tablet:** Grid adaptativo
- **Mobile:** Vista en columna

## ✅ Checklist de Uso Diario

- [ ] Acceder a `/admin/supplier-options`
- [ ] Revisar contador "En Revisión"
- [ ] Si hay sugerencias (>0):
  - [ ] Filtrar por "En Revisión"
  - [ ] Revisar cada sugerencia
  - [ ] Leer análisis de IA
  - [ ] Aprobar o rechazar con razón
- [ ] Verificar score promedio (objetivo: >70)
- [ ] Revisar top contribuidores

## 🎯 Resultado Final

Panel completamente funcional que permite:
- ✅ Revisar sugerencias manualmente
- ✅ Ver estadísticas en tiempo real
- ✅ Aprobar/rechazar con comentarios
- ✅ Auditar decisiones automáticas
- ✅ Identificar top contribuidores
- ✅ Monitorear calidad del sistema

**Tiempo estimado de revisión:** 5-10 minutos/día
