# 🤖 Configurar OpenAI para Buscador Real de Proveedores

**Fecha:** 22 de Octubre de 2025  
**Objetivo:** Configurar búsqueda real de proveedores usando OpenAI (sin datos demo)

---

## 🎯 Resumen

Para que el buscador de proveedores funcione con datos reales necesitas:

1. ✅ Una API Key de OpenAI
2. ✅ Configurarla en el backend
3. ✅ Reiniciar el servidor backend

**Tiempo estimado:** 5-10 minutos

---

## 📝 Paso 1: Obtener API Key de OpenAI

### 1.1 Crear Cuenta en OpenAI

1. Ve a: https://platform.openai.com/signup
2. Crea una cuenta o inicia sesión
3. Verifica tu email

### 1.2 Obtener la API Key

1. Ve a: https://platform.openai.com/api-keys
2. Click en **"Create new secret key"**
3. Dale un nombre (ej: "MyWed360-Proveedores")
4. **Copia la key** (empieza con `sk-...`)
5. ⚠️ **IMPORTANTE:** Guárdala en un lugar seguro, solo se muestra una vez

**Ejemplo de API Key:**
```
sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 1.3 Configurar Facturación (Requerido)

OpenAI requiere que configures un método de pago:

1. Ve a: https://platform.openai.com/settings/organization/billing/overview
2. Añade una tarjeta de crédito
3. Configura un límite de gasto (recomendado: $10-20/mes para testing)

**Costos estimados:**
- Modelo: `gpt-3.5-turbo`
- Costo por búsqueda: ~$0.002 USD
- 100 búsquedas ≈ $0.20 USD
- 1000 búsquedas ≈ $2 USD

---

## ⚙️ Paso 2: Configurar el Backend

### 2.1 Crear Archivo .env

Si no existe `backend/.env`, créalo copiando el ejemplo:

```bash
# En PowerShell (desde la raíz del proyecto)
cp backend\.env.example backend\.env
```

### 2.2 Editar backend/.env

Abre `backend/.env` y busca la sección de OpenAI:

```bash
# --- OpenAI ---
OPENAI_API_KEY=sk-proj-abc123...TU_API_KEY_AQUI
VITE_OPENAI_API_KEY=sk-proj-abc123...TU_API_KEY_AQUI
OPENAI_PROJECT_ID=
```

**Pega tu API Key en ambos campos:**
```bash
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
VITE_OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Notas:**
- `OPENAI_API_KEY`: Usada por el backend
- `VITE_OPENAI_API_KEY`: Fallback para frontend (opcional)
- `OPENAI_PROJECT_ID`: Opcional, déjalo vacío

### 2.3 Verificar Configuración

Tu archivo `backend/.env` debería tener al menos:

```bash
PORT=4004
VITE_BACKEND_URL=http://localhost:4004

# OpenAI
OPENAI_API_KEY=sk-proj-...TU_KEY_REAL
VITE_OPENAI_API_KEY=sk-proj-...TU_KEY_REAL
```

---

## 🚀 Paso 3: Reiniciar el Backend

### 3.1 Detener el Backend

Si está corriendo, detenlo:
- En la terminal: `Ctrl + C`
- O cierra la ventana de terminal

### 3.2 Iniciar el Backend

```bash
# En PowerShell (desde la raíz del proyecto)
cd backend
npm start
```

**Deberías ver:**
```
[ai-suppliers] Cliente OpenAI inicializado/actualizado {
  apiKeyPrefix: 'sk-proj-',
  projectId: null
}
Backend listening on http://localhost:4004
```

✅ Si ves esto, la configuración es correcta

---

## 🧪 Paso 4: Probar el Buscador

### 4.1 Ir a la Página de Proveedores

1. Abre la app: http://localhost:3000
2. Ve a **Proveedores** en el menú
3. Busca cualquier servicio:
   - "Fotógrafo de bodas en Madrid"
   - "Catering para 100 personas"
   - "DJ profesional"

### 4.2 Verificar Resultados Reales

**Datos reales (OpenAI):**
- ✅ Proveedores con nombres reales
- ✅ Enlaces a sitios web reales
- ✅ Ubicaciones específicas
- ✅ Rangos de precios actualizados
- ✅ Descripciones personalizadas

**Datos demo (mockeados):**
- ❌ Siempre los mismos 5 proveedores
- ❌ Badge "AI-DEMO"
- ❌ Mensaje: "Mostramos sugerencias de referencia..."

---

## 🔍 Verificación del Endpoint

### Test Manual del Backend

Puedes probar el endpoint directamente:

```bash
curl -X POST http://localhost:4004/api/ai-suppliers \
  -H "Content-Type: application/json" \
  -d '{"query":"Fotógrafo de bodas","service":"Fotografía","location":"Madrid"}'
```

**Respuesta esperada (datos reales):**
```json
[
  {
    "title": "Fotógrafo Profesional Madrid",
    "link": "https://...",
    "snippet": "Especialistas en fotografía de bodas...",
    "service": "Fotografía",
    "location": "Madrid",
    "priceRange": "1500-3000 EUR"
  },
  ...
]
```

---

## ⚠️ Solución de Problemas

### Error: "OPENAI_API_KEY missing"

**Causa:** La API key no está configurada o el backend no la encuentra

**Solución:**
1. Verifica que `backend/.env` existe
2. Verifica que `OPENAI_API_KEY=sk-...` tiene un valor
3. Reinicia el backend
4. Verifica que no hay espacios extra en la key

### Error: "401 Unauthorized"

**Causa:** La API key es inválida

**Solución:**
1. Genera una nueva key en: https://platform.openai.com/api-keys
2. Actualiza `backend/.env`
3. Reinicia el backend

### Error: "429 Rate Limited"

**Causa:** Superaste el límite de peticiones gratuitas

**Solución:**
1. Configura método de pago en OpenAI
2. O espera unos minutos y prueba de nuevo

### Error: "Insufficient quota"

**Causa:** Se agotó el crédito o no hay método de pago

**Solución:**
1. Ve a: https://platform.openai.com/settings/organization/billing/overview
2. Añade créditos o método de pago

### El backend no se inicia

**Causa:** Puerto 4004 ocupado o dependencias faltantes

**Solución:**
```bash
cd backend
npm install
npm start
```

---

## 📊 Modelo y Costos

### Configuración Actual

**Modelo usado:** `gpt-3.5-turbo`
- Rápido
- Económico (~$0.002 por búsqueda)
- Resultados de buena calidad

**Puedes cambiar el modelo en:** `backend/routes/ai-suppliers.js` (línea 97)

```javascript
model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
```

### Modelos Alternativos

| Modelo | Velocidad | Calidad | Costo/búsqueda |
|--------|-----------|---------|----------------|
| `gpt-3.5-turbo` | ⚡⚡⚡ | ⭐⭐⭐ | $0.002 |
| `gpt-4` | ⚡⚡ | ⭐⭐⭐⭐⭐ | $0.03 |
| `gpt-4-turbo` | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | $0.01 |

**Recomendación:** Usa `gpt-3.5-turbo` para desarrollo y `gpt-4-turbo` para producción.

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

1. **Nunca comitees el archivo `.env`**
   - Ya está en `.gitignore`
   - Si lo hiciste por error, revoca la key inmediatamente

2. **Configura límites de gasto en OpenAI**
   - Ve a: Settings → Billing → Usage limits
   - Configura un máximo mensual (ej: $50)

3. **Usa variables de entorno en producción**
   - Render, Vercel, etc. tienen sección de "Environment Variables"
   - Nunca hardcodees las keys en el código

4. **Revoca keys comprometidas**
   - Si tu key se filtró, revócala en: https://platform.openai.com/api-keys
   - Genera una nueva inmediatamente

---

## ✅ Checklist Final

Antes de usar el buscador en producción:

- [ ] API Key de OpenAI obtenida
- [ ] Método de pago configurado en OpenAI
- [ ] `backend/.env` creado con `OPENAI_API_KEY`
- [ ] Backend reiniciado y logs verificados
- [ ] Test de búsqueda funciona (sin mensaje "AI-DEMO")
- [ ] Límites de gasto configurados en OpenAI
- [ ] `.env` está en `.gitignore`

---

## 🎯 Resultado Esperado

**Antes (con datos demo):**
```
DJ Sounds & Lights [AI-DEMO]
Música · Valencia
800 EUR - 1500 EUR
```

**Después (con OpenAI real):**
```
DJ ProEvents Madrid
Música · Madrid
Especialistas en bodas de lujo con más de 200 eventos...
1200 EUR - 2500 EUR
https://djproevents.es
```

---

## 📞 Soporte

**Documentación OpenAI:**
- API Reference: https://platform.openai.com/docs/api-reference
- Pricing: https://openai.com/pricing
- Status: https://status.openai.com

**Problemas comunes:**
- Revisa los logs del backend: `backend/logs/` (si existen)
- Activa modo debug: `DEBUG=* npm start` en el backend
- Verifica la consola del navegador para errores del frontend

---

## 🚀 Configuración Completada

Una vez configurado correctamente:

✅ **Buscador funciona con IA real**  
✅ **Proveedores reales con datos actualizados**  
✅ **Sin datos mockeados**  
✅ **Resultados personalizados según ubicación y presupuesto**

**¡Listo para usar!** 🎉
