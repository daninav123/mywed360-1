# Sistema de Plantillas de Tareas

## Descripción General

Sistema que permite a los administradores modificar desde el panel admin el seed de tareas (bloques y subtareas) que se aplica automáticamente a cada nueva boda creada en MaLoveApp.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     PANEL ADMINISTRADOR                      │
│                  AdminTaskTemplates.jsx                      │
│  - Crear/editar plantillas en JSON                          │
│  - Sistema de versiones (draft/published/archived)          │
│  - Vista previa de plantillas                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ POST/GET /api/admin/dashboard/task-templates
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                        │
│             Colección: adminTaskTemplates                    │
│  {                                                           │
│    id: "abc123",                                             │
│    version: "1",                                             │
│    status: "published",  // draft | published | archived    │
│    name: "Plantilla Base 2025",                             │
│    blocks: [...],        // Array de bloques de tareas      │
│    updatedAt: Timestamp,                                     │
│    publishedAt: Timestamp                                    │
│  }                                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │ GET /api/task-templates/active (público)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   CREACIÓN DE BODAS                          │
│              WeddingContext / useWedding                     │
│  1. Usuario crea nueva boda                                 │
│  2. Se obtiene plantilla activa desde Firebase              │
│  3. Se transforman fechas relativas a absolutas             │
│  4. Se crean tareas en subcolección wedding/tasks           │
└─────────────────────────────────────────────────────────────┘
```

## Formato de Datos

### Estructura de Plantilla en Firebase

```json
{
  "id": "template_v1",
  "version": "1",
  "status": "published",
  "name": "Plantilla Base 2025",
  "notes": "Primera versión migrada desde defaultWeddingTasks.js",
  "updatedAt": "2025-10-20T19:30:00Z",
  "publishedAt": "2025-10-20T19:30:00Z",
  "updatedBy": "admin@maloveapp.com",
  "totals": {
    "blocks": 9,
    "subtasks": 42
  },
  "blocks": [
    {
      "id": "fundamentos",
      "name": "Fundamentos",
      "category": "FUNDAMENTOS",
      "startPct": 0,
      "endPct": 20,
      "items": [
        {
          "id": "difundir",
          "name": "Difundir la noticia y organizar la planificación",
          "daysBeforeWedding": 148,
          "durationDays": 7,
          "category": "FUNDAMENTOS",
          "assigneeSuggestion": "both",
          "checklist": []
        }
      ]
    }
  ]
}
```

### Transformación: Template → Tareas Reales

La plantilla usa **días relativos** a la fecha de boda. Al crear una boda:

```javascript
// Plantilla dice: "148 días antes de la boda"
daysBeforeWedding: 148

// Si la boda es el 2026-06-15:
startDate = weddingDate - 148 días = 2026-01-18
endDate = startDate + durationDays
```

## API Endpoints

### Endpoints Admin (Autenticación requerida)

#### `GET /api/admin/dashboard/task-templates`
Lista todas las plantillas (con filtros opcionales)

**Query params:**
- `status`: `draft` | `published` | `archived`
- `limit`: número (max 200)

**Response:**
```json
{
  "templates": [...],
  "meta": {
    "limit": 50,
    "status": "all",
    "latestPublished": {
      "id": "abc123",
      "version": "3",
      "updatedAt": "..."
    }
  }
}
```

#### `POST /api/admin/dashboard/task-templates`
Crear/actualizar plantilla (borrador)

**Body:**
```json
{
  "id": "abc123",  // opcional para update
  "name": "Plantilla 2025",
  "version": "1",
  "notes": "Cambios realizados...",
  "blocks": [...]
}
```

#### `POST /api/admin/dashboard/task-templates/:id/publish`
Publicar plantilla (archiva otras publicadas automáticamente)

**Response:**
```json
{
  "success": true
}
```

#### `POST /api/admin/dashboard/task-templates/:id/preview`
Obtener vista previa de plantilla con fechas de ejemplo

**Body:**
```json
{
  "weddingDate": "2026-06-15"  // opcional
}
```

### Endpoint Público (Sin autenticación)

#### `GET /api/task-templates/active`
Obtiene la plantilla actualmente publicada

**Response:**
```json
{
  "template": {
    "id": "abc123",
    "version": "3",
    "blocks": [...],
    "totals": {
      "blocks": 9,
      "subtasks": 42
    }
  }
}
```

## Servicios Frontend

### `taskTemplateService.js`

```javascript
// Obtener plantilla activa
await getActiveTaskTemplate()

// Transformar plantilla a tareas con fechas reales
transformTemplateToTasks(template, weddingDate)

// Migración inicial (one-time)
await migrateDefaultSeedToFirebase()
```

### Uso en Creación de Bodas

```javascript
// En WeddingContext o donde se cree la boda:
import { getActiveTaskTemplate, transformTemplateToTasks } from './services/taskTemplateService';

async function createNewWedding(weddingData) {
  // 1. Crear documento de boda
  const weddingRef = await db.collection('weddings').add(weddingData);
  
  // 2. Obtener plantilla activa
  const template = await getActiveTaskTemplate();
  
  // 3. Transformar a tareas con fechas reales
  const tasks = transformTemplateToTasks(template, weddingData.date);
  
  // 4. Crear tareas en subcolección
  const batch = db.batch();
  tasks.forEach(task => {
    const taskRef = weddingRef.collection('tasks').doc();
    batch.set(taskRef, task);
  });
  await batch.commit();
}
```

## Migración Inicial

### Script: `scripts/migrateTaskSeed.js`

Pasos del script:
1. Lee `src/services/defaultWeddingTasks.js`
2. Transforma el formato legacy al nuevo formato
3. Calcula totales (bloques y subtareas)
4. Crea documento en `adminTaskTemplates` con `status: 'published'`
5. Marca como versión 1

**Ejecución:**
```bash
node scripts/migrateTaskSeed.js
```

## Reglas de Negocio

### Estados de Plantilla

- **draft**: Borrador editable, no se usa en producción
- **published**: Plantilla activa que se aplica a nuevas bodas
- **archived**: Versión antigua, mantenida por historial

### Versionado

- Solo puede haber **1 plantilla published** a la vez
- Al publicar una plantilla, las demás published pasan a archived
- Los drafts no se archivan automáticamente

### Sincronización

- **Nuevas bodas**: Usan plantilla published activa
- **Bodas existentes**: NO se modifican (mantienen sus tareas originales)
- **Sin plantilla publicada**: Fallback a `defaultWeddingTasks.js` hardcodeado

## Tests

### Tests Unitarios

```javascript
// taskTemplateService.test.js
✓ getActiveTaskTemplate retorna plantilla publicada
✓ getActiveTaskTemplate retorna null si no hay publicada
✓ transformTemplateToTasks calcula fechas correctamente
✓ transformTemplateToTasks maneja offset negativos y positivos
```

### Tests Backend

```javascript
// backend/__tests__/task-templates-active.test.js
✓ GET /api/task-templates/active retorna 404 si no hay publicada
✓ GET /api/task-templates/active retorna plantilla correcta
✓ Endpoint es público (sin auth)
```

## Seguridad

### Permisos Firestore

```javascript
// firestore.rules
match /adminTaskTemplates/{templateId} {
  // Solo admins pueden escribir
  allow write: if false;  // Solo desde Admin SDK (backend)
  
  // Lectura pública de plantillas published
  allow read: if resource.data.status == 'published';
}
```

### Backend

- Endpoints `/api/admin/dashboard/*` requieren autenticación admin
- Endpoint `/api/task-templates/active` es público (solo lectura)
- Escritura solo mediante Admin SDK

## Troubleshooting

### No se aplican tareas a bodas nuevas

**Causa**: No hay plantilla publicada
**Solución**: 
1. Ir a panel admin `/admin/task-templates`
2. Seleccionar plantilla
3. Hacer clic en "Publicar"

### Tareas con fechas incorrectas

**Causa**: Offset mal configurado en plantilla
**Solución**:
1. Revisar campo `daysBeforeWedding` en cada item
2. Usar preview para validar fechas antes de publicar

### Error al migrar seed inicial

**Causa**: Ya existe plantilla con version: "1"
**Solución**: El script detecta duplicados y los salta

## Roadmap Futuro

- [ ] Editor visual de plantillas (drag & drop timeline)
- [ ] Importar/exportar plantillas en JSON
- [ ] Templates por tipo de boda (civil, religiosa, destino)
- [ ] Clonación de plantillas
- [ ] Diff entre versiones
- [ ] Rollback a versión anterior
- [ ] Validación automática de integridad

## Referencias

- **Colección Firebase**: `adminTaskTemplates`
- **Panel Admin**: `/admin/task-templates`
- **Legacy seed**: `src/services/defaultWeddingTasks.js`
- **Documentación API**: `docs/api/openapi.yaml`
