# Guía de Usuario: Plantillas de Tareas

## Descripción

El sistema de **Plantillas de Tareas** permite a los administradores de MaLoveApp modificar el conjunto de tareas (bloques y subtareas) que se aplica automáticamente a cada nueva boda creada en la plataforma.

## Acceso al Panel

1. Inicia sesión como administrador
2. Navega a **Panel Admin** → **Plantillas de Tareas**
3. URL directa: `/admin/task-templates`

## Conceptos Clave

### Versiones

Cada plantilla tiene una **versión** numérica (1, 2, 3, etc.). Puedes tener múltiples versiones simultáneamente.

### Estados

- **📝 Borrador (draft)**: Versión en edición, no afecta a bodas nuevas
- **✅ Publicado (published)**: Versión activa que se aplica a nuevas bodas (solo puede haber 1)
- **📦 Archivado (archived)**: Versión antigua guardada por historial

### Bloques e Items

- **Bloque**: Tarea padre que agrupa subtareas relacionadas (ej: "Fundamentos", "Proveedores Clave")
- **Item/Subtarea**: Tarea específica dentro de un bloque (ej: "Contratar fotógrafo")

## Cómo Crear/Editar una Plantilla

### 1. Crear Nuevo Borrador

```
1. Clic en "Nuevo borrador"
2. Rellenar:
   - Nombre interno (ej: "Plantilla 2025 Q1")
   - Versión (se sugiere automáticamente)
   - Notas (opcional)
```

### 2. Editar el JSON de Bloques

La plantilla se define en formato JSON. Estructura básica:

```json
[
  {
    "id": "fundamentos",
    "name": "Fundamentos",
    "category": "FUNDAMENTOS",
    "startPct": 0,
    "endPct": 0.2,
    "daysBeforeWedding": 150,
    "durationDays": 30,
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
```

#### Propiedades de Bloque

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | Identificador único del bloque |
| `name` | string | Nombre visible del bloque |
| `category` | string | Categoría (FUNDAMENTOS, PROVEEDORES, etc.) |
| `startPct` | number | % de inicio en timeline (0 = inicio, 1 = día boda) |
| `endPct` | number | % de fin en timeline |
| `daysBeforeWedding` | number | Días antes de la boda para iniciar |
| `durationDays` | number | Duración en días del bloque |
| `items` | array | Array de subtareas |

#### Propiedades de Item (Subtarea)

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | Identificador único del item |
| `name` | string | Nombre de la subtarea |
| `daysBeforeWedding` | number | Días antes de la boda |
| `durationDays` | number | Duración en días |
| `category` | string | Categoría heredada del bloque |
| `assigneeSuggestion` | string | `"bride"`, `"groom"`, `"both"` |
| `checklist` | array | Lista de pasos (opcional) |

### 3. Vista Previa

Antes de publicar, puedes generar una **vista previa**:

```
1. Guardar borrador
2. Clic en "Vista previa"
3. Se genera ejemplo con fechas calculadas
```

La vista previa muestra cómo se aplicarían las fechas a una boda real.

### 4. Guardar Borrador

```
1. Clic en "Guardar borrador"
2. La plantilla se guarda en Firebase con status: "draft"
3. No afecta a bodas existentes ni nuevas
```

### 5. Publicar Plantilla

```
1. Seleccionar borrador a publicar
2. Clic en "Publicar"
3. Confirmación: Esta versión pasa a "published"
4. Automáticamente: Otras plantillas "published" pasan a "archived"
```

⚠️ **Importante**: Solo puede haber 1 plantilla publicada a la vez.

## Flujo de Trabajo Recomendado

### Edición Segura

```
1. Clonar plantilla actual → Crear borrador v2
2. Editar borrador v2
3. Guardar y probar con vista previa
4. Cuando esté lista: Publicar v2
5. La v1 pasa a archived automáticamente
```

### Rollback

Si necesitas volver a una versión anterior:

```
1. Buscar versión archivada
2. Clonar contenido (copiar JSON)
3. Crear nuevo borrador con ese contenido
4. Publicar
```

## Cómo Afecta a las Bodas

### Bodas Nuevas

- ✅ **Usan plantilla publicada activa**
- Las fechas se calculan automáticamente basándose en la fecha de boda
- Ejemplo: Si `daysBeforeWedding: 150`, se crea tarea 150 días antes

### Bodas Existentes

- ❌ **NO se modifican**
- Las tareas ya creadas permanecen intactas
- Solo afecta a bodas creadas DESPUÉS de publicar

## Cálculo de Fechas

El sistema convierte fechas relativas a absolutas:

```
Plantilla dice: "148 días antes de la boda"
Boda es: 15 de junio de 2026

Cálculo:
startDate = 2026-06-15 - 148 días = 2026-01-18
endDate = startDate + durationDays
```

## Validación Automática

Al guardar, el sistema valida:

- ✅ JSON válido
- ✅ Array de bloques
- ✅ Campos obligatorios presentes
- ✅ No duplicados de IDs

Si hay errores, aparece mensaje en rojo.

## Ejemplos de Uso

### Añadir Nuevo Bloque

```json
{
  "id": "documentacion-legal",
  "name": "Documentación Legal",
  "category": "LEGAL",
  "startPct": 0.5,
  "endPct": 0.95,
  "daysBeforeWedding": 90,
  "durationDays": 60,
  "items": [
    {
      "id": "certificado-matrimonio",
      "name": "Solicitar certificado de matrimonio",
      "daysBeforeWedding": 85,
      "durationDays": 7
    }
  ]
}
```

### Modificar Fechas de Bloque

```json
// Antes
"daysBeforeWedding": 150,
"durationDays": 30

// Después (empezar antes, durar más)
"daysBeforeWedding": 180,
"durationDays": 45
```

### Añadir Checklist a Item

```json
{
  "id": "fotografia",
  "name": "Contratar fotógrafo",
  "checklist": [
    "Investigar fotógrafos locales",
    "Ver portfolios",
    "Solicitar presupuestos",
    "Reunión con favoritos",
    "Firmar contrato"
  ]
}
```

## Troubleshooting

### Las bodas nuevas no usan la plantilla

**Causa**: No hay plantilla publicada

**Solución**:
1. Ir a `/admin/task-templates`
2. Seleccionar plantilla
3. Clic en "Publicar"

### Error: "No se pudo interpretar el JSON"

**Causa**: JSON mal formado

**Solución**:
1. Validar JSON en https://jsonlint.com
2. Verificar comas, llaves, corchetes
3. Copiar ejemplo válido y modificar

### Fechas incorrectas en tareas

**Causa**: `daysBeforeWedding` mal configurado

**Solución**:
1. Usar vista previa para validar
2. Recordar: número positivo = días ANTES
3. Ejemplo: 30 días antes = `"daysBeforeWedding": 30`

### No aparecen cambios después de publicar

**Causa**: Caché activa

**Solución**:
- Esperar 5 minutos (TTL de caché)
- O invalidar caché manualmente (solo admin)

## Mejores Prácticas

### 1. Versionado Claro

```
v1 - Plantilla Base 2025
v2 - Ajustes Q1: Más tiempo para vestuario
v3 - Nuevos bloques legales añadidos
```

### 2. Notas Descriptivas

```
"notes": "Cambios: 
- Aumentado plazo fotógrafo a 120 días
- Añadido bloque documentación legal
- Ajustado timing florista"
```

### 3. Categorías Consistentes

Usa las mismas categorías en toda la plantilla:
- FUNDAMENTOS
- PROVEEDORES
- VESTUARIO
- DETALLES
- LOGISTICA
- EVENTOS
- BELLEZA
- ANILLOS
- VIAJE
- POST_EVENTO

### 4. IDs Únicos y Descriptivos

```
✅ "id": "fotografia-contrato"
❌ "id": "item1"
```

### 5. Durations Realistas

```
// Tareas simples
"durationDays": 1

// Tareas con decisión
"durationDays": 7

// Procesos largos
"durationDays": 30
```

## Soporte

Para dudas o problemas:
1. Consultar documentación técnica: `docs/admin/task-templates-system.md`
2. Revisar logs del sistema
3. Contactar equipo de desarrollo

## Changelog

### v1.0.0 (2025-10-20)
- ✅ Sistema inicial implementado
- ✅ Editor JSON en panel admin
- ✅ Migración desde seed hardcodeado
- ✅ Vista previa de plantillas
- ✅ Versionado y estados
