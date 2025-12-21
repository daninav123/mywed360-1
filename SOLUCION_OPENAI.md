# Solución Definitiva al Problema de OpenAI API Key

## Problema
La aplicación mostraba errores 401 de OpenAI porque:
1. Había **múltiples archivos `.env`** con API keys antiguas/inválidas
2. **Variable de entorno del sistema** sobrescribiendo el `.env`

## Causa Raíz
Las variables de entorno exportadas en el shell tienen **prioridad** sobre los archivos `.env`:
- `export OPENAI_API_KEY=...` (en shell) **>** `.env` (archivo)

## Solución

### 1. Limpiar Variables de Entorno del Shell

Ejecuta estos comandos en tu terminal:

```bash
# Limpiar variables de OpenAI del shell actual
unset OPENAI_API_KEY
unset OPENAI_PROJECT_ID
unset VITE_OPENAI_API_KEY
unset VITE_OPENAI_PROJECT_ID

# Verificar que están limpias
env | grep OPENAI
# (No debería mostrar nada)
```

### 2. Verificar Archivos de Configuración del Shell

Busca y elimina estas líneas de tus archivos de configuración:

```bash
# Revisar estos archivos:
~/.zshrc
~/.bashrc
~/.bash_profile
~/.zprofile

# Buscar líneas como:
export OPENAI_API_KEY=...
export OPENAI_PROJECT_ID=...
```

### 3. Credenciales Correctas (Mywed360)

**API Key:** `sk-proj-YOUR_OPENAI_API_KEY_HERE`

**Project ID:** `proj_7IWFKysvJciPmnkpqop9rrpT`

### 4. Archivos Actualizados

Todos los archivos `.env` ya tienen las credenciales correctas:
- ✅ `/backend/.env`
- ✅ `/.env`
- ✅ `/apps/main-app/.env`
- ✅ `/apps/suppliers-app/.env`
- ✅ `/apps/planners-app/.env`
- ✅ `/apps/admin-app/.env`

### 5. Validación

Después de limpiar las variables de entorno, ejecuta:

```bash
cd backend
node scripts/validate-openai-config.js
```

Deberías ver:
```
✅ OPENAI_API_KEY: sk-proj-JhA...M4sA
✅ OPENAI_PROJECT_ID: proj_7IWFKysvJciPmnkpqop9rrpT
✅ Conexión exitosa con OpenAI
```

### 6. Inicialización en Servicios Backend

Todos los servicios backend ya pasan correctamente el `project`:

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,  // ✅ CRÍTICO
  timeout: 15000
});
```

## Cómo Prevenir el Problema

### NO hagas:
❌ `export OPENAI_API_KEY=...` en tu shell  
❌ Añadir credenciales a `~/.zshrc` o `~/.bashrc`  
❌ Tener múltiples archivos `.env` con valores diferentes  

### SÍ haz:
✅ Mantener las credenciales **solo** en los archivos `.env`  
✅ Usar el script de validación antes de deployar  
✅ Verificar que `process.env.OPENAI_PROJECT_ID` esté configurado  

## Script de Validación

Usa `backend/scripts/validate-openai-config.js` para verificar:
- Que las credenciales están configuradas
- Que la API key es la correcta
- Que la conexión con OpenAI funciona

## Errores a Buscar

Si vuelves a ver errores 401:
1. Ejecuta `env | grep OPENAI` → debe estar **vacío**
2. Revisa que **todos** los `.env` tengan la misma API key
3. Verifica que los servicios pasen `project: process.env.OPENAI_PROJECT_ID`
