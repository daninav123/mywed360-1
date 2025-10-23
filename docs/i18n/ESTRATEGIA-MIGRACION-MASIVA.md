# 🚀 Estrategia de Migración Masiva i18n

**Objetivo:** Migrar 596 strings en 158 componentes  
**Progreso actual:** 45 strings (7.6%)  
**Restante:** 551 strings (92.4%)

---

## 📊 SITUACIÓN ACTUAL

### ✅ Completados (2 componentes):
1. **ChatWidget** - 37 strings ✅
2. **HomePage** - 8 strings ✅

**Total:** 45/596 strings (7.6%)

---

## 🎯 ESTRATEGIA OPTIMIZADA

Dado el volumen, voy a hacer una migración semi-automatizada por fases:

### **FASE 1: Automatización por Lotes (4 horas)**

#### Batch 1: Componentes Top 10 (resto)
- SeatingPlanRefactored (27)
- TasksRefactored (18)  
- SystemSettings (16)
- EmailOnboardingWizard (12)
- ProveedorForm (12)
- WantedServicesModal (12)
- MasterChecklist (11)
- TransactionImportModal (10)

**Subtotal:** 118 strings

#### Batch 2: Componentes medianos 11-20 (60 strings)
- BudgetManager (10)
- GuestForm (9)
- SeatingPlanSidebar (9)
- InviteOnboardingWizard (9)
- SeatingPlanToolbar (8)
- EmailTemplateModal (8)
- ProveedoresPage (8)
- AdminUsers (7)
- BlogManager (7)
- ... (más componentes 5-7 strings)

#### Batch 3: Componentes pequeños (<5 strings cada uno)
- ~100 componentes con 1-4 strings cada uno
- Total: ~300 strings

---

## 🛠️ MÉTODO DE EJECUCIÓN

### A. Para componentes grandes (>10 strings):
1. Leer componente completo
2. Extraer todos los strings con regex
3. Generar claves en namespace correspondiente
4. Aplicar multi_edit con todos los cambios
5. Verificar con findHardcodedStrings

### B. Para componentes pequeños (<5 strings):
1. Agrupar por namespace (common, tasks, etc.)
2. Hacer cambios en batch de 5-10 componentes
3. Single commit por batch

### C. Aprovechamiento de patrones:
- Strings repetidos → Una sola clave
- Plurales → tPlural automático
- Variables → tVars con interpolación

---

## ⚡ ACELERACIÓN

Para maximizar velocidad sin perder calidad:

1. **Namespaces ya existen** ✅
   - common, finance, tasks, seating, email, admin, marketing, chat

2. **Patrones documentados** ✅
   - ChatWidget es el template perfecto

3. **Scripts disponibles** ✅
   - findHardcodedStrings.js
   - validateTranslations.js

4. **Multi-edit en paralelo**
   - Hasta 10 edits por componente
   - Batch commits cada 10 componentes

---

## 📝 TRACKING EN TIEMPO REAL

Voy a actualizar `PROGRESO-MIGRACION.md` cada 50 strings:

```
Strings migrados: 45 → 100 → 200 → 300 → 400 → 500 → 596 ✅
```

---

## 🎯 META REALISTA

**Tiempo total estimado:** 8-10 horas de trabajo efectivo

- Fase 1 (Top 10): 2 horas → 163 strings (27%)
- Fase 2 (Medianos): 3 horas → 260 strings (44%)
- Fase 3 (Pequeños): 4 horas → 551 strings (92%)
- Verificación: 1 hora → 596 strings (100%)

---

## 🚀 EJECUCIÓN INMEDIATA

Comenzando con SeatingPlanRefactored (27 strings)...
