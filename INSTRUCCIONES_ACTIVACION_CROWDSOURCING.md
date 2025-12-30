# 🚀 Instrucciones para Activar el Sistema de Crowdsourcing

## ✅ Checklist de Activación

### 1. Desplegar Reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

Esto desplegará las reglas de seguridad para:
- `supplier_option_suggestions`
- `supplier_dynamic_specs`

### 2. Crear Índices en Firestore
```bash
firebase deploy --only firestore:indexes
```

O crear manualmente en Firebase Console > Firestore > Índices:

**Índice 1:**
- Colección: `supplier_option_suggestions`
- Campos: `status` (ASC) + `metadata.createdAt` (DESC)

**Índice 2:**
- Colección: `supplier_option_suggestions`
- Campos: `suggestedBy.userId` (ASC) + `metadata.createdAt` (DESC)

### 3. Activar Cron Job

Añadir al archivo `backend/index.js` (después de las importaciones, antes de iniciar el servidor):

```javascript
// Importar el cron
import { setupSupplierOptionsCron } from './cron/supplier-options-cron.js';

// Activar (añadir después de configurar express)
if (!isTest && process.env.ENABLE_CRON_JOBS !== 'false') {
  setupSupplierOptionsCron();
}
```

### 4. Verificar Variables de Entorno

Asegurarse de que existe:
```env
OPENAI_API_KEY=sk-proj-... (ya configurada)
```

### 5. Reiniciar Backend
```bash
cd backend
npm run dev
```

Deberías ver en consola:
```
✅ Cron jobs de supplier options configurados:
   - Procesamiento: Cada 15 minutos
   - Limpieza: Diario a las 3:00 AM
```

## 🧪 Prueba Manual

### 1. Crear Sugerencia desde UI

1. Ir a **Info Boda**
2. Seleccionar categoría (ej: Fotografía)
3. Click en **"💡 Sugerir opción"**
4. Rellenar:
   - Nombre: "Slow motion video"
   - Descripción: "Videos en cámara lenta para momentos especiales"
5. Enviar

### 2. Ejecutar Job Manualmente

```bash
cd backend
node scripts/run-option-suggestions-job.js
```

Deberías ver:
```
🔄 Iniciando procesamiento de sugerencias de opciones...
📋 Procesando 1 sugerencias...
🔍 Validando: Slow motion video (fotografia)
✅ Procesado: Slow motion video - Status: approved (Score: 85)
✅ Procesamiento completado: 1 procesadas, 1 aprobadas, 0 rechazadas
```

### 3. Verificar en Firestore

**Verificar sugerencia procesada:**
```
supplier_option_suggestions/{id}
  status: "approved"
  aiValidation.score: 85
```

**Verificar opción dinámica añadida:**
```
supplier_dynamic_specs/fotografia
  dynamicOptions: {
    slowMotionVideo: {
      label: "Slow motion video",
      type: "boolean",
      addedAt: timestamp,
      usageCount: 0
    }
  }
```

### 4. Verificar en UI

1. Volver a **Info Boda > Fotografía**
2. Deberías ver:
   - Badge verde: "✨ 1 opción(es) sugerida(s) por la comunidad disponible(s)"
   - Nueva opción: "Slow motion video" en la lista de checkboxes

## 📊 Monitoreo

### Ver Logs del Cron

El cron ejecuta cada 15 minutos automáticamente. Ver logs:
```bash
# En producción (Render/servidor)
tail -f logs/backend.log | grep "CRON"

# En desarrollo
# Los logs aparecen en la consola del backend
```

### Estadísticas

**Sugerencias totales:**
```bash
# Firebase Console > Firestore
supplier_option_suggestions (count)
```

**Por status:**
- `pending`: Esperando validación
- `validating`: En proceso
- `approved`: Aprobadas automáticamente
- `rejected`: Rechazadas
- `duplicate`: Duplicadas
- `review`: Esperando revisión manual

### Métricas de IA

Ver `aiValidation.score` en cada sugerencia:
- `>80`: Aprobadas automáticamente
- `60-80`: Requieren revisión manual
- `<60`: Rechazadas automáticamente

## 🔧 Troubleshooting

### El cron no se ejecuta

**Verificar:**
1. El backend está corriendo
2. No hay error en logs al importar el cron
3. `ENABLE_CRON_JOBS` no está en `false`

**Ejecutar manualmente:**
```bash
node backend/scripts/run-option-suggestions-job.js
```

### Validación IA falla

**Error común:** OpenAI API key inválida o sin crédito

**Verificar:**
```bash
echo $OPENAI_API_KEY
# Debe mostrar: sk-proj-...
```

**Test manual:**
```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'test' }]
});
```

### Índices no creados

**Error:** "The query requires an index"

**Solución:**
1. Copiar el link del error de Firebase
2. Hacer click para crear el índice automáticamente
3. O ejecutar: `firebase deploy --only firestore:indexes`

### Opciones no aparecen en UI

**Verificar:**
1. El hook `useSupplierOptions` está cargando correctamente
2. La categoría coincide exactamente (ej: `fotografia`, no `fotografía`)
3. Refrescar la página con Ctrl+F5

**Debug:**
```javascript
// En DevTools Console
fetch('/api/supplier-options/dynamic/fotografia')
  .then(r => r.json())
  .then(console.log)
```

## ⚙️ Configuración Avanzada

### Cambiar frecuencia del cron

Editar `backend/cron/supplier-options-cron.js`:

```javascript
// Cada 5 minutos
cron.schedule('*/5 * * * *', ...)

// Cada hora
cron.schedule('0 * * * *', ...)

// Solo en horario laboral
cron.schedule('*/15 9-18 * * 1-5', ...)
```

### Ajustar umbral de aprobación

Editar `backend/jobs/processOptionSuggestions.js`:

```javascript
// Línea ~50
if (score >= 85) {  // Era 80, ahora más estricto
  newStatus = 'approved';
  // ...
}
```

### Límite de sugerencias por usuario

Editar `backend/routes/supplier-options.js`:

```javascript
// Línea ~30
if (userSuggestionsToday.size >= 5) {  // Era 3, ahora 5
  return res.status(429).json({...});
}
```

## 📈 Próximos Pasos

1. **Analytics:** Añadir tracking de uso de opciones dinámicas
2. **Admin Panel:** UI para revisar sugerencias con score 60-80
3. **Votación:** Permitir a usuarios votar opciones antes de aprobar
4. **Gamificación:** Badges para usuarios con sugerencias aprobadas
5. **Internacionalización:** Sugerencias en múltiples idiomas

## ✅ Sistema Listo

Una vez completados los pasos 1-5, el sistema estará completamente funcional y procesando sugerencias automáticamente cada 15 minutos.
