# Implementación: Sistema de Plantillas de Tareas Editables

## Resumen

Se ha implementado un sistema completo que permite a los administradores modificar desde el panel admin el seed de tareas (bloques y subtareas) que se aplica automáticamente a cada nueva boda creada en MaLoveApp.

## ✅ Componentes Implementados

### 1. Documentación

- ✅ `docs/admin/task-templates-system.md` - Documentación técnica completa
- ✅ `docs/admin/task-templates-user-guide.md` - Guía de usuario para admins

### 2. Backend

- ✅ `backend/routes/task-templates.js` - Endpoint público para obtener plantilla activa
- ✅ Integrado en `backend/index.js` como `/api/task-templates`
- ✅ Caché de 5 minutos para optimizar performance
- ✅ Colección Firebase: `adminTaskTemplates`

#### Endpoints

```
GET  /api/task-templates/active          (público, sin auth)
POST /api/task-templates/invalidate-cache (interno)
```

### 3. Frontend

- ✅ `src/services/taskTemplateService.js` - Servicio principal
  - `getActiveTaskTemplate()` - Obtiene plantilla desde Firebase/backend
  - `transformTemplateToTasks()` - Convierte plantilla a tareas con fechas
  - `getTasksForNewWedding()` - Función principal para creación de bodas
  - `migrateDefaultSeedToFirebase()` - Migración inicial

- ✅ `src/services/taskTemplateClient.js` - Actualizado para usar nuevo sistema
- ✅ `src/pages/admin/AdminTaskTemplates.jsx` - Panel admin YA EXISTÍA
- ✅ Integración completa con `WeddingService.js` (sin cambios necesarios)

### 4. Scripts

- ✅ `scripts/migrateTaskSeed.js` - Script de migración one-time

### 5. Tests

- ✅ `src/services/__tests__/taskTemplateService.test.js` - Tests unitarios frontend
- ✅ `backend/__tests__/task-templates-active.test.js` - Tests backend API

## 🚀 Cómo Usar el Sistema

### Primera Vez: Migración Inicial

```bash
# 1. Migrar el seed hardcodeado a Firebase
node scripts/migrateTaskSeed.js

# Esto crea la plantilla v1 en adminTaskTemplates con status: "published"
```

### Editar Plantillas desde Panel Admin

```
1. Ir a: /admin/task-templates
2. Seleccionar plantilla o crear nuevo borrador
3. Editar JSON de bloques
4. Guardar borrador
5. Vista previa (opcional)
6. Publicar
```

### Verificar que Funciona

```
1. Crear una boda de prueba
2. Verificar que se crean tareas automáticamente
3. Comprobar que las fechas son correctas
4. Editar plantilla y crear otra boda
5. Verificar que usa la nueva versión
```

## 📊 Flujo de Datos

```
┌────────────────────────────────────────────────────────┐
│         ADMIN EDITA PLANTILLA (Panel Admin)            │
│                /admin/task-templates                    │
└────────────────────┬───────────────────────────────────┘
                     │ POST /api/admin/dashboard/task-templates
                     ▼
┌────────────────────────────────────────────────────────┐
│            FIREBASE: adminTaskTemplates                 │
│  {                                                      │
│    version: "1",                                        │
│    status: "published",                                 │
│    blocks: [...]                                        │
│  }                                                      │
└────────────────────┬───────────────────────────────────┘
                     │ GET /api/task-templates/active
                     ▼
┌────────────────────────────────────────────────────────┐
│         CREACIÓN DE BODA (Usuario/Planner)             │
│         WeddingService.createWedding()                  │
└────────────────────┬───────────────────────────────────┘
                     │ getTasksForNewWedding(weddingDate)
                     ▼
┌────────────────────────────────────────────────────────┐
│      TRANSFORMACIÓN: Plantilla → Tareas Reales         │
│      transformTemplateToTasks()                         │
│      - Calcula fechas: weddingDate - daysBeforeWedding │
│      - Crea estructura padre/hijo                       │
└────────────────────┬───────────────────────────────────┘
                     │ Batch write
                     ▼
┌────────────────────────────────────────────────────────┐
│         FIREBASE: weddings/{id}/tasks                   │
│         Tareas con fechas absolutas                     │
└────────────────────────────────────────────────────────┘
```

## 🔧 Configuración Requerida

### Variables de Entorno

No se requieren nuevas variables. Usa las existentes:

```env
# Backend
VITE_BACKEND_URL=https://maloveapp-backend.onrender.com

# Firebase (ya configurado)
VITE_FIREBASE_PROJECT_ID=...
```

### Firestore Rules

Las reglas ya permiten lectura pública de plantillas published:

```javascript
match /adminTaskTemplates/{templateId} {
  allow write: if false;  // Solo Admin SDK
  allow read: if resource.data.status == 'published';
}
```

## 🧪 Testing

### Frontend

```bash
npm run test:unit -- taskTemplateService.test.js
```

### Backend

```bash
cd backend
npm test -- task-templates-active.test.js
```

## 📈 Performance

- **Caché Backend**: 5 minutos (reduce llamadas a Firestore)
- **Caché Frontend**: 60 segundos (reduce llamadas al backend)
- **Fallback**: Si falla todo, usa `defaultWeddingTasks.js` hardcodeado

## 🔒 Seguridad

- ✅ Escritura solo desde Admin SDK (backend)
- ✅ Lectura pública solo de plantillas `status: "published"`
- ✅ Panel admin protegido con autenticación
- ✅ Endpoints admin protegidos con middleware `requireAdmin`

## 🐛 Troubleshooting

### Problema: Bodas nuevas no usan plantilla editada

**Solución**:
1. Verificar que la plantilla está publicada (`status: "published"`)
2. Invalidar caché: `POST /api/task-templates/invalidate-cache`
3. Esperar 5 minutos para que caché expire naturalmente

### Problema: Error en migración inicial

**Solución**:
1. Verificar ruta de serviceAccount.json
2. Verificar permisos de Firebase Admin
3. Ver logs del script para detalles

### Problema: JSON inválido en panel admin

**Solución**:
1. Validar JSON en https://jsonlint.com
2. Ver mensaje de error específico en panel
3. Consultar guía de usuario para estructura correcta

## 📝 Notas Importantes

### Compatibilidad con Legacy

El sistema mantiene compatibilidad con:
- ✅ Seed hardcodeado `defaultWeddingTasks.js` (fallback)
- ✅ Sistema anterior de `config/taskTemplate` (deprecado)
- ✅ Bodas existentes (no se modifican)

### Versionado

- Solo puede haber **1 plantilla published** a la vez
- Al publicar, las demás published pasan a `archived`
- Los drafts no se archivan automáticamente

### Bodas Existentes

- ⚠️ Las bodas YA creadas **NO se modifican**
- Solo afecta a bodas creadas DESPUÉS de publicar
- No hay migración retroactiva de tareas

## 🎯 Próximos Pasos

### Recomendado

1. ✅ Ejecutar migración inicial: `node scripts/migrateTaskSeed.js`
2. ✅ Probar creación de boda de prueba
3. ✅ Verificar en panel admin que la plantilla es editable
4. ✅ Hacer backup de plantilla actual antes de editar

### Opcional (Futuro)

- [ ] Editor visual de plantillas (drag & drop timeline)
- [ ] Importar/exportar plantillas en JSON
- [ ] Templates por tipo de boda (civil, religiosa, destino)
- [ ] Diff entre versiones
- [ ] Rollback con un clic
- [ ] Validación avanzada de integridad

## 📚 Referencias

- **Documentación Técnica**: `docs/admin/task-templates-system.md`
- **Guía de Usuario**: `docs/admin/task-templates-user-guide.md`
- **Panel Admin**: `/admin/task-templates`
- **Colección Firebase**: `adminTaskTemplates`
- **Endpoint Público**: `GET /api/task-templates/active`

## ✅ Checklist de Validación

- [x] Documentación creada
- [x] Servicio frontend implementado
- [x] Endpoint backend implementado
- [x] Integración con creación de bodas
- [x] Script de migración creado
- [x] Tests implementados
- [x] Panel admin ya existía
- [ ] Migración inicial ejecutada (pendiente de ejecutar)
- [ ] Boda de prueba creada (pendiente de validar)

## 🎉 Estado

**✅ IMPLEMENTACIÓN COMPLETA**

El sistema está listo para usar. Solo falta:
1. Ejecutar migración inicial
2. Validar con boda de prueba

---

**Fecha**: 2025-10-20
**Versión**: 1.0.0
**Autor**: Sistema Cascade
