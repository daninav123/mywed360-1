# Mejoras al Buscador IA de Proveedores

## Cambios Implementados (27 Oct 2025)

### 1. Backend Mejorado (`backend/routes/ai-suppliers.js`)

**Cambios principales:**

✅ **Modelo actualizado**: `gpt-3.5-turbo` → `gpt-4-turbo-preview`
- Mayor capacidad de razonamiento
- Mejores resultados contextuales

✅ **Prompt mejorado**: 
- Solicita proveedores **reales con presencia web verificable**
- Requiere URLs reales (web oficial, bodas.net, Instagram profesional)
- Prioriza proveedores en la ubicación especificada
- Busca diversidad (estilos y precios)

✅ **Response format estructurado**:
- Usa `response_format: { type: 'json_object' }`
- Devuelve JSON válido garantizado
- Estructura: `{"providers": [array de 6 proveedores]}`

✅ **Campos adicionales**:
- `phone`: Teléfono si está disponible
- `email`: Email de contacto
- `tags`: Etiquetas descriptivas

✅ **Mejor logging**:
- Registra cantidad de resultados
- Muestra preview de errores
- Facilita debugging

---

## ⚠️ Limitaciones Actuales

### GPT-4 NO tiene acceso a internet en tiempo real

❌ **Lo que GPT-4 NO puede hacer:**
- Buscar en Google en tiempo real
- Verificar si una web está activa ahora
- Obtener información posterior a su fecha de corte (Oct 2023)

✅ **Lo que GPT-4 SÍ puede hacer:**
- "Recordar" proveedores conocidos de su entrenamiento
- Generar nombres y detalles realistas basados en patrones
- Sugerir tipos de proveedores comunes en una zona

---

## 🚀 Solución Completa: Búsqueda Web REAL

Para búsquedas web en tiempo real, necesitas integrar una API especializada:

### Opciones recomendadas:

**1. Tavily AI** ⭐ RECOMENDADO
- API especializada en búsqueda web con IA
- $0.001 por búsqueda (1000 búsquedas = $1)
- Plan gratuito: 1000 búsquedas/mes
- Devuelve resultados estructurados y filtrados
- https://tavily.com

**2. Perplexity API**
- Motor de búsqueda con IA conversacional
- Actualizado en tiempo real
- $0.002 por búsqueda
- https://www.perplexity.ai/api

**3. SerpAPI**
- Scraping de resultados de Google
- $50/mes por 5000 búsquedas
- Resultados muy actualizados
- https://serpapi.com

---

## 📋 Configuración Requerida

### Variables de entorno necesarias:

```bash
# En backend/.env
OPENAI_API_KEY=sk-proj-...      # OBLIGATORIO
OPENAI_MODEL=gpt-4-turbo-preview  # Recomendado (o gpt-4o)

# OPCIONAL: Para búsquedas web reales
TAVILY_API_KEY=tvly-...
```

### Costos estimados:

**Opción 1: Solo GPT-4** (actual)
- GPT-4-turbo: $0.01 por búsqueda (~1000 tokens)
- 100 búsquedas = $1
- Resultados: Buenos, pero basados en conocimiento hasta 2023

**Opción 2: GPT-4 + Tavily** (recomendado)
- GPT-4: $0.01
- Tavily: $0.001
- Total: $0.011 por búsqueda
- 100 búsquedas = $1.10
- Resultados: REALES y actualizados

---

## 🛠️ Próximos Pasos

### Para ti (usuario):

1. **Verifica que tienes OPENAI_API_KEY configurada**
   ```bash
   # En backend/.env
   OPENAI_API_KEY=sk-proj-...
   ```

2. **Reinicia el backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Prueba el buscador mejorado**
   - Ve a Proveedores
   - Busca: "fotógrafo bodas Barcelona"
   - Deberías ver mejores resultados

### Si quieres búsqueda web REAL:

1. **Regístrate en Tavily**
   - https://tavily.com
   - Plan gratuito: 1000 búsquedas/mes
   - Copia tu API key

2. **Configura la variable**
   ```bash
   TAVILY_API_KEY=tvly-...
   ```

3. **Dime y te implemento la integración** (30 min)

---

## 📊 Resultados Esperados

### Con GPT-4 mejorado (actual):
- ✅ Proveedores con nombres realistas
- ✅ URLs de tipo correcto (bodas.net, webs comerciales)
- ⚠️ Algunos enlaces pueden ser genéricos
- ⚠️ Info basada en conocimiento hasta 2023

### Con Tavily integrado:
- ✅ Proveedores 100% reales y verificados
- ✅ URLs activas y operativas
- ✅ Info actualizada (2024-2025)
- ✅ Reviews y datos recientes
- ✅ Teléfonos y emails verificables

---

## 🎯 Recomendación Final

**Para MVP/Demo**: El sistema actual (GPT-4 mejorado) es suficiente
- Resultados realistas
- Funciona sin costos adicionales
- Buena UX

**Para Producción**: Integrar Tavily
- Proveedores reales y verificables
- Mejor experiencia de usuario
- Costo muy bajo ($0.001/búsqueda)
- Diferenciador competitivo

¿Quieres que implemente la integración con Tavily para tener búsquedas 100% reales?
