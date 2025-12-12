# 🔧 Solución de Imports

## Problema
Los imports con alias `@/` no funcionan porque el alias apunta a la carpeta src de cada app individual.

## Solución Rápida
Cambiar todos los imports de `@/` a rutas relativas:

### Ejemplo:
```javascript
// Antes (no funciona)
import ExternalImage from "@/components/ExternalImage";

// Después (funciona)
import ExternalImage from "../components/ExternalImage";
```

## Script para arreglar todos los imports:
```bash
# En apps/main-app/src
find . -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|from "@/components/|from "../components/|g'
find . -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|from "@/utils/|from "../utils/|g'
find . -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|from "@/hooks/|from "../hooks/|g'
find . -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|from "@/services/|from "../services/|g'
```

## Alternativa: Ajustar vite.config.js
Si prefieres mantener el alias @, elimina la configuración actual y usa:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```
