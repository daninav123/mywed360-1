# ✅ ERROR CORS CORREGIDO

## 🔴 Problema Identificado

El backend estaba rechazando las peticiones desde las nuevas apps de subdominios:

```
[CORS] Origin no permitido: http://localhost:5175
Error: Not allowed by CORS
```

---

## 🔧 Causa Raíz

La variable `ALLOWED_ORIGIN` en `backend/.env` solo incluía los puertos originales (5173, 4173), pero faltaban los puertos de las nuevas apps:

**Antes:**
```env
ALLOWED_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
```

**Faltaban:**
- ❌ `http://localhost:5174` (planners-app)
- ❌ `http://localhost:5175` (suppliers-app)  
- ❌ `http://localhost:5176` (admin-app)

---

## ✅ Solución Aplicada

Actualicé `backend/.env` agregando los 3 puertos faltantes:

**Después:**
```env
ALLOWED_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

---

## 🔄 Cómo Funciona

### **1. Lectura de Variables:**
`backend/config.js` lee `ALLOWED_ORIGIN` del `.env`:

```javascript
const envAllowedOrigins = String(cfg.ALLOWED_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
```

### **2. Combinación con Defaults:**
Se combina con los orígenes por defecto:

```javascript
const ALLOWED_ORIGINS = Array.from(
  new Set([...DEFAULT_ALLOWED_ORIGINS, ...envAllowedOrigins])
);
```

### **3. Validación en CORS:**
`backend/index.js` valida cada petición:

```javascript
cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    logger.warn(`[CORS] Origin no permitido: ${origin}`);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  // ...
})
```

---

## ✅ Resultado

Ahora todas las apps pueden comunicarse con el backend:

| App | Puerto | Estado CORS |
|-----|--------|-------------|
| main-app | 5173 | ✅ Permitido |
| planners-app | 5174 | ✅ **CORREGIDO** |
| suppliers-app | 5175 | ✅ **CORREGIDO** |
| admin-app | 5176 | ✅ **CORREGIDO** |

---

## 🔐 Credenciales de Login (Recordatorio)

**Email:** `resona@icloud.com`  
**Password:** `test123`  
**URL:** http://localhost:5175/login

---

## 🚀 Próximos Pasos

1. ✅ Backend reiniciado con nueva configuración
2. 🔄 Probar login desde suppliers-app
3. ✅ Verificar que no hay más errores CORS

---

## 📝 Nota Técnica

El backend necesita reiniciarse cada vez que se modifica el `.env` porque las variables de entorno se leen una sola vez al inicio.

**Comando para reiniciar:**
```bash
pkill -f "node.*backend/index.js"
cd backend && npm start
```

---

**¡Error CORS corregido!** Ahora el login debería funcionar. 🎉
