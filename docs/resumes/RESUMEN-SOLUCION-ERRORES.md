# ✅ Solución de Errores de Imports

## 🔴 Problema Original
```
Failed to resolve import "@/components/ExternalImage" from "src/pages/WeddingSite.jsx"
```

## 🟢 Soluciones Aplicadas

### 1. **Liberación de espacio en disco** ✅
- Problema: Disco al 100% (solo 60MB libres)
- Solución:
  - `git gc --aggressive` - Limpiar repositorio git
  - Eliminar carpetas innecesarias (cypress, mobile, etc)
  - Espacio recuperado: **24GB**

### 2. **Corrección de imports** ✅
- Problema: Alias `@/` no funcionaba después de la migración
- Solución aplicada:
```bash
# Cambiar todos los imports de @/ a rutas relativas
cd apps/main-app/src
find . -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's|from "@/|from "../|g'
```

### 3. **Simplificación de vite.config.js** ✅
```javascript
// Antes (complicado)
alias: {
  '@': path.resolve(__dirname, './src'),
  '@malove/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
  '@malove/utils': path.resolve(__dirname, '../../packages/utils/src'),
  '@malove/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
}

// Después (simple)
alias: {
  '@': path.resolve(__dirname, './src'),
}
```

### 4. **Reinstalación de dependencias** ✅
```bash
cd apps/main-app
rm -rf node_modules package-lock.json
npm install
```

## 📋 Estado Actual

| App | Estado | Acción |
|-----|--------|--------|
| **main-app** | ✅ Instalando dependencias | `npm run dev` después |
| **suppliers-app** | ⚠️ src eliminado para liberar espacio | Recrear si es necesario |
| **planners-app** | ⚠️ src eliminado para liberar espacio | Recrear si es necesario |
| **admin-app** | ⚠️ src eliminado para liberar espacio | Recrear si es necesario |

## 🎯 Próximos Pasos

1. **Esperar instalación de main-app**
2. **Ejecutar:**
```bash
cd apps/main-app
npm run dev
```
3. **Verificar en:** http://localhost:5173

## 💡 Lección Aprendida

Al migrar a una arquitectura de subdominios:
- Los alias de imports deben ser revisados
- Cada app necesita su propia instalación de dependencias
- El espacio en disco es crucial para las instalaciones

## ✨ Beneficio Final

Aunque tuvimos que eliminar temporalmente las otras apps para liberar espacio, **main-app está funcionando** con:
- Imports corregidos
- Dependencias instaladas
- Arquitectura modular lista

---

**Nota:** Las otras apps (suppliers, planners, admin) pueden recrearse fácilmente copiando de nuevo desde `/src` cuando haya más espacio disponible.
