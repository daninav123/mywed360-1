# Plan de Implementación Multilenguaje

**Proyecto:** MaLove.App  
**Fecha:** Octubre 2025  
**Estado Actual:** 30% implementado  
**Objetivo:** 100% multilenguaje en 4 idiomas principales

---

## Estado Actual

### Completado:
- [x] i18next configurado con react-i18next
- [x] Hook `useTranslations` completo con formatters
- [x] LanguageSelector con UI y persistencia
- [x] JSONs base en español (`common.json` - 1374 líneas)
- [x] Namespaces: `common`, `finance`
- [x] ~30 componentes traducidos (Finance, Guests, Auth)

### Pendiente:
- [ ] ~170 componentes sin traducciones (texto hardcodeado)
- [ ] Traducciones incompletas en inglés
- [ ] Solo 4 de 33 idiomas activos
- [ ] Falta namespace para: admin, tasks, seating, email, marketing
- [ ] Sin validación de claves faltantes
- [ ] Sin pruebas e2e multilenguaje

---

## Estrategia Recomendada

### **Opción A: Progresiva por Módulos** (RECOMENDADA)

**Ventajas:**
- Menos riesgo de bugs
- Deploy incremental
- Fácil de testear
- Equipo puede ir traduciendo en paralelo

**Fases:**
1. **Core** (Nav, Auth, Home) - 2 días
2. **Finance** (ya hecho al 80%) - 1 día
3. **Guests** (ya hecho al 70%) - 1 día
4. **Tasks** - 2 días
5. **Seating** - 2 días
6. **Email** - 1 día
7. **Marketing** - 1 día
8. **Admin** - 1 día

**Total:** ~2 semanas para español + inglés

### **Opción B: Todo de golpe**

**Ventajas:**
- Rápido si tienes herramientas de traducción automática
- Consistencia inmediata

**Desventajas:**
- Alto riesgo de bugs
- Difícil QA
- Puede romper funcionalidades

---

## Implementación por Fases

### **FASE 1: Auditora y Setup** (1 día)

#### 1.1 Script de detección de texto hardcodeado

```bash
# Crear script para encontrar strings no traducidas
node scripts/findHardcodedStrings.js
```

#### 1.2 Estructura de namespaces mejorada

```
src/i18n/locales/
“ es/
   “ common.json        (global: buttons, errors, forms)
   “ finance.json       (transacciones, presupuesto)
   “ guests.json       < (invitados, grupos, RSVP)
   “ tasks.json        < (tareas, calendario, gantt)
   “ seating.json      < (distribución mesas)
   “ email.json        < (bandeja, plantillas)
   “ marketing.json    < (landing, pricing)
    admin.json        < (panel admin)
“ en/ (igual estructura)
“ es-MX/ (igual estructura)
 es-AR/ (igual estructura)
```

#### 1.3 Priorizar idiomas

**Fase 1 (MVP):** Solo 2 idiomas
- << Español (España) - Principal
- << English - Internacional

**Fase 2 (Expansión):**
- << Español (México)
- << Español (Argentina)

**Fase 3 (Opcional):**
- << Franais
- << Italiano
- << Portugués

---

### **FASE 2: Core Components** (2 días)

#### Prioridad ALTA - Usados en TODAS las páginas:

1. **Nav.jsx**  (ya tiene useTranslations)
2. **MainLayout.jsx**
3. **PageWrapper.jsx**
4. **Modal.jsx**
5. **Toast/Notifications**
6. **ErrorBoundary**

**Patrán de migración:**

```jsx
// L ANTES:
<button>Guardar cambios</button>

//  DESPUÉS:
const { t } = useTranslations();
<button>{t('app.saveChanges')}</button>
```

---

### **FASE 3: Módulos Principales** (1 semana)

#### 3.1 Finance  (80% hecho)

**Pendiente:**
- `PaymentSuggestions.jsx`
- `BudgetBenchmarks` alerts
- Validation messages

#### 3.2 Guests (70% hecho)

**Pendiente:**
- Bulk actions messages
- Import CSV errors
- Group naming

#### 3.3 Tasks (0% - PRIORIDAD ALTA)

**Componentes:**
- `TasksRefactored.jsx`
- `TaskForm.jsx`
- `TaskList.jsx`
- `CalendarComponents.jsx`
- `GanttChart.jsx`

**Nuevas keys en `tasks.json`:**

```json
{
  "tasks": {
    "title": "Tareas",
    "newTask": "Nueva tarea",
    "editTask": "Editar tarea",
    "deleteTask": "Eliminar tarea",
    "status": {
      "pending": "Pendiente",
      "in_progress": "En progreso",
      "completed": "Completada"
    },
    "priority": {
      "low": "Baja",
      "medium": "Media",
      "high": "Alta"
    }
  }
}
```

#### 3.4 Seating (0%)

**Componentes:**
- `SeatingPlanModern.jsx`
- `SeatingPlanToolbar.jsx`
- `SeatingPlanSidebar.jsx`
- `TableEditor.jsx`

#### 3.5 Email (0%)

**Componentes:**
- `EmailInbox.jsx`
- `ComposeEmail.jsx`
- `EmailTemplates.jsx`

---

### **FASE 4: Marketing & Pblico** (2 días)

**Landing pages (CRTICO para SEO):**
- `/` - Landing.jsx
- `/precios` - Pricing.jsx
- `/acceso` - Access.jsx
- `/blog` - Blog.jsx

**Requiere:**
- SEO metadata en ambos idiomas
- URLs localizadas (`/es/precios`, `/en/pricing`)

---

### **FASE 5: Admin Panel** (1 día)

**Componentes admin:**
- Dashboard
- User Management
- Analytics
- Settings

---

## ' Herramientas y Scripts

### Script 1: Detectar strings hardcodeados

```javascript
// scripts/findHardcodedStrings.js
import fs from 'fs';
import path from 'path';

const EXCLUDED_PATTERNS = [
  /className=/,
  /style=/,
  /import .* from/,
  /console\.(log|error|warn)/,
  /<\/.*>/,
  /^\s*\/\//,
];

function findHardcodedStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    // Buscar strings en español (con acentos, , etc.)
    const spanishRegex = /['"`]([^'"`]*[ѿ][^'"`]*)['"`]/g;
    const matches = [...line.matchAll(spanishRegex)];

    matches.forEach(match => {
      const isExcluded = EXCLUDED_PATTERNS.some(pattern => pattern.test(line));
      if (!isExcluded) {
        results.push({
          line: index + 1,
          text: match[1],
          context: line.trim()
        });
      }
    });
  });

  return results;
}

// Ejecutar en todos los archivos .jsx
```

### Script 2: Validar traducciones completas

```javascript
// scripts/validateTranslations.js
import esCommon from '../src/i18n/locales/es/common.json';
import enCommon from '../src/i18n/locales/en/common.json';

function findMissingKeys(source, target, path = '') {
  const missing = [];
  
  for (const key in source) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in target)) {
      missing.push(currentPath);
    } else if (typeof source[key] === 'object') {
      missing.push(...findMissingKeys(source[key], target[key], currentPath));
    }
  }
  
  return missing;
}

const missingInEnglish = findMissingKeys(esCommon, enCommon);
console.log('Missing keys in English:', missingInEnglish);
```

### Script 3: Generar traducciones automáticas (OpenAI)

```javascript
// scripts/autoTranslate.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

async function translateObject(obj, targetLang) {
  const prompt = `Translate this JSON object to ${targetLang}. 
Keep the structure, only translate the values:

${JSON.stringify(obj, null, 2)}

Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}

// Usar SOLO como base, siempre revisar manualmente
```

---

## Checklist de Implementación

### Pre-requisitos
- [ ] Decidir idiomas prioritarios (recomiendo ES + EN)
- [ ] Crear namespaces adicionales (guests, tasks, seating, email)
- [ ] Ejecutar script de detección de hardcoded strings
- [ ] Estimar esfuerzo de traducción

### Por Componente
- [ ] Importar `useTranslations`
- [ ] Reemplazar strings hardcodeados con `t('key')`
- [ ] Añadir keys al JSON correspondiente
- [ ] Traducir a inglés (manual o con OpenAI de base)
- [ ] Probar cambio de idioma
- [ ] Verificar formateo de fechas/monedas

### Testing
- [ ] Test visual en ambos idiomas
- [ ] Test de largo de texto (alemín es +30% más largo)
- [ ] Test de RTL si soportas rabe/hebreo
- [ ] E2E test con `cy.setLanguage('en')`

### Deploy
- [ ] SEO metadata en ambos idiomas
- [ ] Sitemap multilenguaje
- [ ] `<html lang="es">` dinúmico
- [ ] Analytics por idioma

---

## Ejecución Rpida (Si tienes prisa)

### Opción Express: Auto-traducción + Revisión Manual

**Día 1-2: Setup**
1. Crear namespaces faltantes
2. Ejecutar script de detección
3. Migrar strings a JSONs (español)

**Día 3-4: Auto-traducción**
1. Usar OpenAI para traducir JSONs completos a inglés
2. Revisar y corregir traducciones críticas (auth, finance, checkout)

**Día 5-7: Migración componentes**
1. Reemplazar hardcoded strings con `t()`
2. Probar módulo por módulo

**Día 8-10: QA y ajustes**
1. Test visual completo
2. Ajustar textos largos
3. Validar formateo de monedas/fechas

---

## Estimación de Esfuerzo

### Opción A: Todo Manual
- **Core + 7 módulos:** ~80 horas (2 semanas)
- **2 idiomas (ES + EN):** +40 horas traducción
- **Total:** 120 horas (~3 semanas)

### Opción B: Semi-automática (OpenAI)
- **Migración código:** ~60 horas
- **Auto-traducción + revisión:** ~20 horas
- **QA:** ~20 horas
- **Total:** 100 horas (~2.5 semanas)

### Opción C: Solo páginas críticas
- **Auth + Nav + Finance + Guests:** ~40 horas
- **Traducción:** ~10 horas
- **Total:** 50 horas (1 semana)

---

## Mejores Prácticas

### 1. Estructura de Keys Consistente

```json
{
  "module": {
    "component": {
      "action": "Texto",
      "label": "Etiqueta"
    }
  }
}
```

**Ejemplo:**
```json
{
  "guests": {
    "form": {
      "title": "Añadir invitado",
      "name": "Nombre completo",
      "email": "Correo electrónico",
      "submit": "Guardar invitado"
    },
    "list": {
      "empty": "No hay invitados",
      "total": "Total: {{count}} invitados"
    }
  }
}
```

### 2. Pluralización

```json
{
  "guests": {
    "count_one": "{{count}} invitado",
    "count_other": "{{count}} invitados"
  }
}
```

```jsx
const { tPlural } = useTranslations();
<span>{tPlural('guests.count', guestCount)}</span>
```

### 3. Variables Interpoladas

```json
{
  "welcome": "Bienvenido, {{name}}"
}
```

```jsx
const { tVars } = useTranslations();
<h1>{tVars('welcome', { name: user.name })}</h1>
```

### 4. Formateo Automático

```jsx
const { format } = useTranslations();

<span>{format.currency(1500, 'EUR')}</span>
// ES: "1.500,00 "
// EN: "1,500.00"

<span>{format.date(new Date())}</span>
// ES: "23 de octubre de 2025"
// EN: "October 23, 2025"
```

---

## Validación Continua

### GitHub Actions CI

```yaml
# .github/workflows/i18n-check.yml
name: i18n Validation

on: [push, pull_request]

jobs:
  validate-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: node scripts/validateTranslations.js
      - run: node scripts/findHardcodedStrings.js
```

---

## Métricas de xito

- [ ] 0 strings hardcodeados en español
- [ ] Paridad 100% ES → EN en keys
- [ ] Selector de idioma en todas las páginas
- [ ] Cambio de idioma sin reload
- [ ] Persistencia en Firestore
- [ ] SEO multilenguaje
- [ ] Tests E2E pasando en ambos idiomas

---

## Recomendación Final

**Para tu proyecto, recomiendo:**

### Estrategia: **Opción A (Progresiva) + Auto-traducción OpenAI**

1. **Semana 1:** Core + Finance + Guests (lo más usado)
2. **Semana 2:** Tasks + Seating + Email
3. **Semana 3:** Marketing + Admin + QA

**Idiomas:** Solo ES + EN por ahora

**Herramientas:**
- Script detección hardcoded
- OpenAI para traducción base (revisar manualmente)
- Tests visuales manuales

**ROI:** 3 semanas de trabajo = soporte completo en 2 idiomas

---

Quieres que empiece por algún módulo específico o prefieres que cree primero los scripts de detección/validación?
