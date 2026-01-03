# 🤖 Guía: Nueva Página de Tareas con IA

## 📍 Acceso

**URL:** `/tareas-ia`

**Navegación:** 
- Sidebar → "Tareas con IA" 
- O directamente: `https://tu-app.com/tareas-ia`

---

## ✨ Características Implementadas

### **1️⃣ Panel de Análisis IA**

Muestra el análisis personalizado de la boda con:

- **Resumen inteligente** del contexto de la boda
- **Contador de tareas críticas** (alta prioridad)
- **Contador de tareas opcionales** (pueden omitirse)
- **Recomendación de ritmo** según tiempo disponible
- **Fases urgentes** destacadas

**Ubicación:** Parte superior de la página

---

### **2️⃣ Botón "Regenerar con IA"**

Permite actualizar el plan cuando cambian las circunstancias:

**Casos de uso:**
- ✅ Cambió la fecha de la boda (más/menos tiempo)
- ✅ Cambió el presupuesto
- ✅ Contrataron wedding planner
- ✅ Cambió el tipo de ceremonia
- ✅ Cambió número de invitados

**Cómo funciona:**
1. Click en "Regenerar" en el panel IA
2. Se abre modal con formulario
3. Ajusta los campos necesarios
4. Click "Regenerar plan"
5. IA analiza y adapta las tareas
6. Plan actualizado automáticamente

---

### **3️⃣ Exportar Análisis**

Descarga el análisis IA como archivo JSON.

**Contenido del export:**
```json
{
  "boda": {
    "nombre": "Mi Boda",
    "fecha": "2025-08-15",
    "tipo": "destino",
    "invitados": 50
  },
  "analisis": {
    "resumen": "...",
    "tareasCriticas": [...],
    "tareasOpcionales": [...],
    "recomendaciones": [...]
  }
}
```

**Casos de uso:**
- 📤 Compartir con pareja/familia
- 📤 Enviar a wedding planner
- 📤 Backup del análisis
- 📤 Importar a otras herramientas

---

## 🎨 Componentes Creados

### **AIAnalysisPanel.jsx**
Panel visual con el análisis IA completo.

**Props:**
- `analysis`: Objeto con análisis IA
- `weddingContext`: Contexto de la boda
- `onRegenerate`: Función para regenerar
- `onExport`: Función para exportar
- `isRegenerating`: Estado de carga

---

### **RegenerateModal.jsx**
Modal interactivo para actualizar contexto.

**Campos:**
- Tipo de ceremonia (civil, religiosa, simbólica, destino)
- Presupuesto (low, medium, high, luxury)
- Tiempo hasta la boda (slider 1-36 meses)
- Número de invitados (slider 10-500)
- Estilo de la boda (texto libre)
- Ubicación (local/destino)
- ¿Tiene wedding planner? (checkbox)

---

### **TasksAI.jsx**
Página principal con toda la integración.

**Características:**
- ✅ Carga automática del análisis guardado
- ✅ Regeneración de plan con nuevo contexto
- ✅ Exportación de análisis
- ✅ Integración con TasksRefactored
- ✅ Vista responsive
- ✅ Manejo de errores
- ✅ Loading states

---

## 🔄 Flujo Completo

### **Primera vez que accede el usuario:**

```
1. Usuario crea boda → WeddingService personaliza automáticamente
2. Usuario entra a /tareas-ia
3. Ve panel con análisis IA ya generado
4. Tareas ya están personalizadas
```

### **Cuando quiere regenerar:**

```
1. Click "Regenerar" en panel IA
2. Modal se abre con contexto actual
3. Ajusta campos (ej: cambió fecha, ahora 8 meses en vez de 12)
4. Click "Regenerar plan"
5. Backend llama a GPT-4o con nuevo contexto
6. IA devuelve análisis actualizado
7. Tareas se regeneran con nueva plantilla
8. UI se actualiza automáticamente
```

---

## 🎯 Diferencias vs Página Antigua

| Característica | `/tasks` (vieja) | `/tareas-ia` (nueva) |
|----------------|------------------|----------------------|
| **Análisis IA** | ❌ No | ✅ Panel completo |
| **Regeneración** | ❌ No | ✅ Con modal |
| **Exportar** | ❌ No | ✅ JSON |
| **Personalización** | ❌ Genérica | ✅ Adaptada |
| **Diseño** | Antiguo | ✨ Moderno con Tailwind |
| **Contexto visible** | ❌ Oculto | ✅ Visible y editable |

---

## 💡 Próximas Mejoras (Opcionales)

### **Short-term (si hay tiempo):**
- [ ] Exportar como PDF elegante (no solo JSON)
- [ ] Gráfico visual del timeline
- [ ] Comparación antes/después de regenerar

### **Medium-term:**
- [ ] Insights proactivos ("Llevas retraso en X")
- [ ] Sugerencias automáticas basadas en progreso
- [ ] Integración con calendario (eventos automáticos)

### **Long-term:**
- [ ] IA como asistente conversacional
- [ ] Predicción de riesgos ("Con este ritmo, no llegarás")
- [ ] Optimización automática de costes

---

## 🧪 Cómo Probar

### **Test 1: Primera carga**
```bash
1. Crear boda nueva desde /create-wedding
2. Ir a /tareas-ia
3. Verificar que aparece panel con análisis IA
4. Verificar contadores (críticas, opcionales)
```

### **Test 2: Regeneración**
```bash
1. En /tareas-ia, click "Regenerar"
2. Cambiar "Tiempo hasta boda" de 12 a 6 meses
3. Cambiar presupuesto de "medium" a "high"
4. Click "Regenerar plan"
5. Verificar que análisis se actualiza
6. Verificar que tareas críticas aumentan (menos tiempo = más urgencia)
```

### **Test 3: Exportación**
```bash
1. En /tareas-ia, click "Exportar"
2. Verificar que descarga archivo JSON
3. Abrir archivo y verificar estructura
4. Comprobar que contiene análisis completo
```

---

## 🐛 Troubleshooting

### **"No hay análisis IA"**
**Causa:** Boda creada antes de implementar IA
**Solución:** Click "Personalizar con IA" en el panel

### **"Error al regenerar"**
**Causa:** API de OpenAI no disponible o sin créditos
**Solución:** Verificar OPENAI_API_KEY en .env del backend

### **"Tareas no se actualizan"**
**Causa:** Caché del frontend
**Solución:** Refrescar página (F5)

---

## 📊 Métricas de Éxito

Puedes medir el impacto con:

```javascript
// En performanceMonitor
logEvent('tasks_ai_page_view', { weddingId });
logEvent('tasks_ai_regenerate', { 
  weddingId, 
  contextChanges: ['leadTime', 'budget']
});
logEvent('tasks_ai_export', { weddingId });
```

**KPIs esperados:**
- ✅ 70%+ usuarios usan panel IA
- ✅ 30%+ regeneran al menos 1 vez
- ✅ 15%+ exportan análisis
- ✅ Engagement +40% vs página antigua

---

## 🎓 Para Desarrolladores

### **Añadir nueva métrica al análisis:**

```javascript
// En backend/services/taskPersonalizationAI.js
const analysis = {
  ...existing,
  nuevaMetrica: calcularMetrica(weddingContext)
};
```

### **Añadir nuevo campo al modal:**

```javascript
// En components/tasks/RegenerateModal.jsx
<div>
  <label>Nuevo Campo</label>
  <input 
    value={formData.nuevoCampo}
    onChange={(e) => handleChange('nuevoField', e.target.value)}
  />
</div>
```

---

## ✅ Checklist de Implementación

- [x] Backend: Motor IA (`taskPersonalizationAI.js`)
- [x] Backend: Endpoint `/api/task-templates/personalize`
- [x] Frontend: Servicio cliente (`taskPersonalizationService.js`)
- [x] Frontend: Componente `AIAnalysisPanel`
- [x] Frontend: Componente `RegenerateModal`
- [x] Frontend: Página `TasksAI`
- [x] Routing: Ruta `/tareas-ia` en App.jsx
- [x] Integración: Auto-personalización en `WeddingService`
- [x] Docs: Esta guía

**Estado:** ✅ 100% COMPLETADO

---

**Fecha de creación:** 2025-12-28  
**Versión:** 1.0.0  
**Autor:** Cascade AI Assistant
