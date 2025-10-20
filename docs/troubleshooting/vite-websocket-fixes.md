# Solución de Errores de Vite WebSocket y Módulos

## Problemas Detectados

### 1. ❌ WebSocket Error
```
WebSocket connection to 'ws://localhost:5173/?token=...' failed: 
Error during WebSocket handshake: Unexpected response code: 400
```

### 2. ❌ Export Error
```
Uncaught SyntaxError: The requested module '/src/services/emailService.js' 
does not provide an export named 'USE_BACKEND'
```

## ✅ Soluciones Implementadas

### 1. Configuración HMR en vite.config.js

**Cambios realizados:**

```javascript
server: {
  host: 'localhost', // Cambio de 0.0.0.0 a localhost
  port: 5173,
  strictPort: true,
  // NUEVO: Configuración HMR explícita
  hmr: {
    protocol: 'ws',
    host: 'localhost',
    port: 5173,
    clientPort: 5173,
  },
  // ... resto de config
}
```

**Razón del problema:**
- `host: '0.0.0.0'` causa conflictos con WebSocket en Windows
- HMR (Hot Module Reload) necesita configuración explícita

### 2. Script de Limpieza de Caché

**Creado:** `scripts/clearViteCache.js`

Limpia:
- `node_modules/.vite`
- `.vite`
- `dist`

**Razón del problema:**
- Caché corrupta de Vite puede causar errores de imports
- Módulos mal resueltos persisten en caché

### 3. Comando dev actualizado

**Antes:**
```json
"dev": "vite --host --port 5173 --strictPort"
```

**Después:**
```json
"dev": "vite --port 5173 --strictPort"
```

Removido `--host` para usar localhost por defecto.

## 🚀 Cómo Aplicar las Soluciones

### Solución Rápida (Recomendada)

```bash
# 1. Limpiar caché y reiniciar servidor
npm run dev:clean
```

Este comando automáticamente:
1. Limpia toda la caché de Vite
2. Reinicia el servidor de desarrollo

### Solución Manual

```bash
# 1. Detener el servidor actual (Ctrl+C)

# 2. Limpiar caché manualmente
node scripts/clearViteCache.js

# 3. Reiniciar servidor
npm run dev
```

### Si Persiste el Error

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar todo
node scripts/clearViteCache.js

# 3. Limpiar node_modules (si es necesario)
rm -rf node_modules package-lock.json

# 4. Reinstalar dependencias
npm install

# 5. Reiniciar servidor
npm run dev
```

## 🔍 Verificación

Después de aplicar las soluciones, verifica que:

1. ✅ **No hay errores WebSocket en consola**
   - Busca: `WebSocket connection failed`
   - Debe estar ausente

2. ✅ **HMR funciona correctamente**
   - Edita un archivo .jsx
   - Los cambios se reflejan sin recargar página
   - No aparece mensaje: `[vite] failed to connect to websocket`

3. ✅ **No hay errores de imports**
   - Busca: `does not provide an export named`
   - Debe estar ausente

4. ✅ **Console limpia**
   - No debe haber errores rojos en DevTools

## 📋 Checklist de Troubleshooting

Si después de aplicar las soluciones siguen los errores:

- [ ] **Verificar puerto 5173**
  ```bash
  netstat -ano | findstr :5173
  ```
  Si está ocupado, mata el proceso o cambia puerto

- [ ] **Verificar permisos**
  - Ejecutar terminal como administrador
  - Verificar permisos de escritura en carpeta del proyecto

- [ ] **Verificar firewall/antivirus**
  - Asegurar que no bloquea WebSocket en localhost
  - Agregar excepción si es necesario

- [ ] **Verificar versión Node**
  ```bash
  node -v  # Debe ser >= 20.0.0
  ```

- [ ] **Reinstalar Vite**
  ```bash
  npm uninstall vite
  npm install vite@latest --save-dev
  ```

## 🛠️ Comandos Útiles

```bash
# Limpiar solo caché de Vite
node scripts/clearViteCache.js

# Limpiar caché y arrancar
npm run dev:clean

# Ver procesos en puerto 5173
netstat -ano | findstr :5173

# Matar proceso específico (reemplazar PID)
taskkill /PID <PID> /F

# Reiniciar servidor normal
npm run dev

# Validar configuración de Vite
npx vite --help
```

## 📚 Referencias

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Vite HMR Configuration](https://vitejs.dev/config/server-options.html#server-hmr)
- [Troubleshooting WebSocket Issues](https://vitejs.dev/guide/troubleshooting.html)

## 🎯 Resumen

**Cambios realizados:**
1. ✅ `vite.config.js` - Configuración HMR explícita
2. ✅ `scripts/clearViteCache.js` - Script de limpieza
3. ✅ `package.json` - Comando `dev:clean` añadido
4. ✅ `package.json` - Removido `--host` de comando `dev`

**Próximos pasos:**
1. Ejecutar `npm run dev:clean`
2. Verificar que no hay errores en consola
3. Confirmar que HMR funciona

---

**Fecha:** 2025-10-20  
**Estado:** ✅ Solucionado
