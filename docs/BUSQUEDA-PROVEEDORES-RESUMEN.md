# 🔍 Búsqueda de Proveedores: Datos Reales vs Mockeados

## ❌ Problema Actual

Los resultados que ves **son ficticios/mockeados** porque OpenAI GPT **NO tiene acceso a internet**. Solo genera texto que suena realista basándose en su entrenamiento.

## ✅ Soluciones Disponibles

### Opción 1: Búsqueda Real con Tavily API (RECOMENDADA) ⭐

**Ventajas:**
- ✅ Resultados **100% reales** de internet
- ✅ **Optimizada para IA** - Mejor que Google para este caso
- ✅ 1,000 búsquedas/mes **GRATIS** (10x más que Google)
- ✅ Setup en **2 minutos** (1 sola API key)

**Configuración (2 minutos):**

1. **Obtén Tavily API Key** (gratis en https://tavily.com/)

2. **Backend** (`.env`):
```env
TAVILY_API_KEY=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
OPENAI_API_KEY=sk-proj-...  # Ya la tienes
```

3. **Frontend** (`.env`):
```env
VITE_SEARCH_PROVIDER=tavily
```

4. **Reiniciar servicios**

📖 **Guía completa**: `docs/CONFIGURACION-TAVILY.md`

---

### Opción 2: Google Custom Search 

**Ventajas:**
- ✅ Resultados **100% reales** de internet
- ✅ URLs verificables de proveedores existentes
- ✅ 100 búsquedas/día **GRATIS**

**Configuración (5 minutos):**

1. **Backend** (`.env`):
```env
# Obtener en: https://console.cloud.google.com/
GOOGLE_SEARCH_API_KEY=tu_api_key_aqui

# Obtener en: https://programmablesearchengine.google.com/
GOOGLE_SEARCH_CX=tu_search_engine_id_aqui

# Ya deberías tenerla
OPENAI_API_KEY=sk-proj-...
```

2. **Frontend** (`.env`):
```env
VITE_USE_REAL_SEARCH=true
```

3. **Reiniciar servicios**

📖 **Guía completa**: `docs/CONFIGURACION-BUSQUEDA-REAL.md`

---

### Opción 3: Seguir con Datos Generados (Actual)

**Ventajas:**
- ✅ Ya está funcionando
- ✅ Sin configuración adicional
- ✅ Sin costos extras

**Desventajas:**
- ❌ Resultados ficticios
- ❌ URLs no verificables
- ❌ Proveedores inexistentes

**Configuración:**
Ninguna. Es lo que tienes ahora.

---

### Opción 4: Base de Datos Propia

**Ventajas:**
- ✅ Sin costo por búsqueda
- ✅ Control total de datos
- ✅ Datos 100% reales

**Desventajas:**
- ❌ Requiere scrapear/importar datos manualmente
- ❌ Mantenimiento constante
- ❌ Más complejo

**Implementación:**
1. Scrapear bodas.net, bodas.com.mx, etc.
2. Almacenar en Firestore
3. Crear endpoint `/api/suppliers/search`
4. Actualizar frontend

---

## 🎯 Recomendación

**Para obtener datos reales inmediatamente:**

Usa la **Opción 1 (Tavily)** ⭐. Es la mejor opción porque:
- 1,000 búsquedas/mes **GRATIS** (10x más que Google)
- Setup en **2 minutos** (solo 1 API key)
- Optimizada específicamente para aplicaciones de IA
- Resultados más limpios y relevantes

**Costo estimado mensual:**
- Tavily: **$0** (1,000 búsquedas/mes gratis)
- OpenAI: **~$1-3** (estructurar con gpt-4o-mini)
- **Total: $1-3/mes** 🎉

**Si excedes 1,000 búsquedas/mes:**
- $1 por cada 1,000 búsquedas adicionales (5x más barato que Google)

---

## 📊 Comparación Rápida

| | Tavily ⭐ | Google | Generada | Base Propia |
|---|:---:|:---:|:---:|:---:|
| **Datos reales** | ✅ | ✅ | ❌ | ✅ |
| **Búsquedas gratis** | 1,000/mes | 100/día | ∞ | ∞ |
| **Setup** | 2 min | 5 min | 0 min | 40+ hrs |
| **Optimizado IA** | ✅ | ❌ | N/A | N/A |
| **Costo extra** | $1/1000 | $5/1000 | $0 | $0 |
| **Mantenimiento** | Ninguno | Ninguno | Ninguno | Alto |

---

## 🚀 Próximos Pasos

### Si quieres datos reales AHORA con Tavily:

1. Lee `docs/CONFIGURACION-TAVILY.md` (2 min)
2. Obtén API key en https://tavily.com/
3. Añade `TAVILY_API_KEY` en backend/.env
4. Añade `VITE_SEARCH_PROVIDER=tavily` en .env
5. Reinicia los servicios
6. ¡Prueba la búsqueda!

### Si prefieres Google Custom Search:

1. Lee `docs/CONFIGURACION-BUSQUEDA-REAL.md` (5 min)
2. Configura Google Custom Search
3. Añade las variables de entorno
4. Reinicia los servicios

### Si prefieres esperar:

Quédate con los datos generados por ahora y considera migrar a Google Search o base propia más adelante.

---

## 💡 FAQ

**P: ¿Por qué GPT inventa proveedores si le digo "busca en internet"?**  
R: Porque GPT **NO tiene acceso a internet**. Solo simula una búsqueda generando texto plausible.

**P: ¿Tavily realmente da 1,000 búsquedas gratis?**  
R: Sí, confirmado. Plan gratuito sin tarjeta de crédito. Ver: https://tavily.com/pricing

**P: ¿Por qué Tavily es mejor que Google Search?**  
R: Tavily está optimizada para aplicaciones de IA: resultados pre-procesados, más relevantes, 10x más búsquedas gratis, y 5x más barata si escalas.

**P: ¿Qué pasa si supero las 1,000 búsquedas/mes?**  
R: La API pedirá configurar billing. Cuesta solo $1 por cada 1,000 búsquedas adicionales (vs $5/1000 de Google).

**P: ¿Puedo usar otra API de búsqueda?**  
R: Sí. Google Custom Search (implementada), SerpAPI ($50/mes), Bing Search API, o base de datos propia.
