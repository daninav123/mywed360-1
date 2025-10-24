# 🚀 Plan de Migración Masiva i18n - EJECUTABLE

**Fecha:** 23 Octubre 2025  
**Objetivo:** Migrar TODOS los strings hardcodeados a i18n  
**Estado:** 🔴 CRÍTICO - 413+ strings pendientes

---

## 📊 SITUACIÓN ACTUAL

### Strings Hardcodeados Detectados

```
📁 src/pages:        413 strings
📁 src/components:   ~200 strings (estimado)
📁 src/features:     ~100 strings (estimado)
────────────────────────────────────
TOTAL ESTIMADO:      ~713 strings
```

### Top 10 Componentes Críticos

| # | Componente | Strings | Prioridad |
|---|-----------|---------|-----------|
| 1 | Invitados | 31 | 🔴 ALTA |
| 2 | DisenoWeb | 29 | 🔴 ALTA |
| 3 | MenuCatering | 27 | 🔴 ALTA |
| 4 | MomentosEspeciales | 23 | 🔴 ALTA |
| 5 | CreateWeddingAssistant | 20 | 🟡 MEDIA |
| 6 | SeatingPlanPost | 19 | 🟡 MEDIA |
| 7 | Invitaciones | 16 | 🟡 MEDIA |
| 8 | Checklist | 15 | 🟡 MEDIA |
| 9 | Menu | 15 | 🟡 MEDIA |
| 10 | MomentosGuest | 14 | 🟡 MEDIA |

---

## ⏱️ ESTIMACIÓN REALISTA

### Por Componente

- **Simple (1-10 strings):** 15-20 min
- **Mediano (11-20 strings):** 30-45 min  
- **Complejo (21+ strings):** 1-2 horas

### Total del Proyecto

```
📦 Componentes simples (~50):    15h
📦 Componentes medianos (~30):   20h
📦 Componentes complejos (~10):  15h
────────────────────────────────────
TOTAL ESTIMADO:                  50h
```

**Con automatización:** ~35-40 horas

---

## 🎯 ESTRATEGIA DE MIGRACIÓN

### Fase 1: Componentes Visibles (URGENTE)
**Tiempo:** 8-10 horas  
**Impacto:** Usuario ve cambios inmediatos

- [ ] **Tasks (Tareas)** - "Gestión de Tareas", "Nueva Tarea", etc.
- [ ] **Guests (Invitados)** - Lista de invitados completa
- [ ] **Timeline/Protocolo** - Calendario y planificación
- [ ] **Providers (Proveedores)** - Búsqueda y gestión

### Fase 2: Páginas Principales (ALTA)
**Tiempo:** 10-12 horas  
**Impacto:** Funcionalidad core

- [ ] CreateWeddingAssistant
- [ ] Menu/MenuCatering  
- [ ] DisenoWeb
- [ ] Invitaciones
- [ ] Checklist

### Fase 3: Features Secundarios (MEDIA)
**Tiempo:** 8-10 horas

- [ ] MomentosEspeciales
- [ ] SeatingPlanPost
- [ ] RSVPDashboard
- [ ] WebEditor
- [ ] AyudaCeremonia

### Fase 4: Admin y Testing (BAJA)
**Tiempo:** 8-10 horas

- [ ] Admin pages
- [ ] Test harnesses
- [ ] Portal proveedor

---

## 🛠️ PROCESO PASO A PASO

### 1. Analizar Componente
```bash
node scripts/i18n/migrateComponent.js src/pages/Tasks.jsx tasks
```

### 2. Copiar JSONs Generados

**ES:** `src/i18n/locales/es/tasks.json`
```json
{
  "title": "Gestión de Tareas",
  "newTask": "Nueva Tarea",
  "viewAll": "Ver todas las tareas"
}
```

**EN:** `src/i18n/locales/en/tasks.json`
```json
{
  "title": "Task Management",
  "newTask": "New Task",
  "viewAll": "View all tasks"
}
```

### 3. Modificar Componente

```javascript
// ANTES
<h1>Gestión de Tareas</h1>
<button>Nueva Tarea</button>

// DESPUÉS
import useTranslations from '../hooks/useTranslations';

function Tasks() {
  const { t } = useTranslations();
  
  return (
    <>
      <h1>{t('tasks.title')}</h1>
      <button>{t('tasks.newTask')}</button>
    </>
  );
}
```

### 4. Validar
```bash
node scripts/i18n/validateTranslations.js
```

---

## 📋 CHECKLIST DETALLADO

### Componentes de Tareas ✅ PRIORIDAD 1

- [ ] `src/pages/Tasks.jsx`
- [ ] `src/pages/TasksRefactored.jsx` 
- [ ] `src/components/tasks/TaskForm.jsx`
- [ ] `src/components/tasks/TaskList.jsx`
- [ ] `src/components/tasks/TaskCard.jsx`

### Componentes de Invitados ✅ PRIORIDAD 1

- [ ] `src/pages/Invitados.jsx`
- [ ] `src/components/guests/GuestForm.jsx`
- [ ] `src/components/guests/GuestList.jsx`
- [ ] `src/components/guests/GuestCard.jsx`

### Componentes de Timeline ✅ PRIORIDAD 1

- [ ] `src/pages/protocolo/Timeline.jsx`
- [ ] `src/pages/protocolo/Timing.jsx`
- [ ] `src/components/protocol/MasterChecklist.jsx`

### Componentes de Proveedores ✅ PRIORIDAD 1

- [ ] `src/pages/ProveedoresNuevo.jsx`
- [ ] `src/components/proveedores/ProveedorForm.jsx`
- [ ] `src/components/proveedores/WantedServicesModal.jsx`

---

## 🚦 SEMÁ
