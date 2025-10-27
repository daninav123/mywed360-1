# 🚀 Setup Rápido: Tavily + OpenAI para Búsqueda Real

## ⚡ Configuración en 2 Minutos

### 1. Backend (`.env` en carpeta `backend/`)

```env
# Tavily Search API (GRATIS - 1000 búsquedas/mes)
TAVILY_API_KEY=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

# OpenAI (ya deberías tenerla)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

### 2. Frontend (`.env` en raíz del proyecto)

```env
# Activar Tavily
VITE_SEARCH_PROVIDER=tavily
```

### 3. Reiniciar

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd ..
npm run dev
```

## ✅ Probar

1. Ve a http://localhost:5173
2. Página de Proveedores
3. Busca: `"fotógrafo de bodas en Madrid"`
4. Verás proveedores **REALES** con URLs verificables 🎉

---

## 📚 Documentación Completa

- **Guía Tavily**: `docs/CONFIGURACION-TAVILY.md`
- **Comparación**: `docs/BUSQUEDA-PROVEEDORES-RESUMEN.md`

## 🆘 ¿Problemas?

Ver sección Troubleshooting en `docs/CONFIGURACION-TAVILY.md`
