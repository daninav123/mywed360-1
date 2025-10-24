# > Configurar OpenAI para Buscador Real de Proveedores

**Fecha:** 22 de Octubre de 2025  
**Objetivo:** Configurar b�squeda real de proveedores usando OpenAI (sin datos demo)

---

## <� Resumen

Para que el buscador de proveedores funcione con datos reales necesitas:

1.  Una API Key de OpenAI
2.  Configurarla en el backend
3.  Reiniciar el servidor backend

**Tiempo estimado:** 5-10 minutos

---

## =� Paso 1: Obtener API Key de OpenAI

### 1.1 Crear Cuenta en OpenAI

1. Ve a: https://platform.openai.com/signup
2. Crea una cuenta o inicia sesi�n
3. Verifica tu email

### 1.2 Obtener la API Key

1. Ve a: https://platform.openai.com/api-keys
2. Click en **"Create new secret key"**
3. Dale un nombre (ej: "MaLoveApp-Proveedores")
4. **Copia la key** (empieza con `sk-...`)
5. � **IMPORTANTE:** Gu�rdala en un lugar seguro, solo se muestra una vez

**Ejemplo de API Key:**
```
sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 1.3 Configurar Facturaci�n (Requerido)

OpenAI requiere que configures un m�todo de pago:

1. Ve a: https://platform.openai.com/settings/organization/billing/overview
2. A�ade una tarjeta de cr�dito
3. Configura un l�mite de gasto (recomendado: $10-20/mes para testing)

**Costos estimados:**
- Modelo: `gpt-3.5-turbo`
- Costo por b�squeda: ~$0.002 USD
- 100 b�squedas H $0.20 USD
- 1000 b�squedas H $2 USD

---

## � Paso 2: Configurar el Backend

### 2.1 Crear Archivo .env

Si no existe `backend/.env`, cr�alo copiando el ejemplo:

```bash
# En PowerShell (desde la ra�z del proyecto)
cp backend\.env.example backend\.env
```

### 2.2 Editar backend/.env

Abre `backend/.env` y busca la secci�n de OpenAI:

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
- `OPENAI_PROJECT_ID`: Opcional, d�jalo vac�o

### 2.3 Verificar Configuraci�n

Tu archivo `backend/.env` deber�a tener al menos:

```bash
PORT=4004
VITE_BACKEND_URL=http://localhost:4004

# OpenAI
OPENAI_API_KEY=sk-proj-...TU_KEY_REAL
VITE_OPENAI_API_KEY=sk-proj-...TU_KEY_REAL
```

---

## =� Paso 3: Reiniciar el Backend

### 3.1 Detener el Backend

Si est� corriendo, detenlo:
- En la terminal: `Ctrl + C`
- O cierra la ventana de terminal

### 3.2 Iniciar el Backend

```bash
# En PowerShell (desde la ra�z del proyecto)
cd backend
npm start
```

**Deber�as ver:**
```
[ai-suppliers] Cliente OpenAI inicializado/actualizado {
  apiKeyPrefix: 'sk-proj-',
  projectId: null
}
Backend listening on http://localhost:4004
```

 Si ves esto, la configuraci�n es correcta

---

## >� Paso 4: Probar el Buscador

### 4.1 Ir a la P�gina de Proveedores

1. Abre la app: http://localhost:3000
2. Ve a **Proveedores** en el men�
3. Busca cualquier servicio:
   - "Fot�grafo de bodas en Madrid"
   - "Catering para 100 personas"
   - "DJ profesional"

### 4.2 Verificar Resultados Reales

**Datos reales (OpenAI):**
-  Proveedores con nombres reales
-  Enlaces a sitios web reales
-  Ubicaciones espec�ficas
-  Rangos de precios actualizados
-  Descripciones personalizadas

**Datos demo (mockeados):**
- L Siempre los mismos 5 proveedores
- L Badge "AI-DEMO"
- L Mensaje: "Mostramos sugerencias de referencia..."

---

## = Verificaci�n del Endpoint

### Test Manual del Backend

Puedes probar el endpoint directamente:

```bash
curl -X POST http://localhost:4004/api/ai-suppliers \
  -H "Content-Type: application/json" \
  -d '{"query":"Fot�grafo de bodas","service":"Fotograf�a","location":"Madrid"}'
```

**Respuesta esperada (datos reales):**
```json
[
  {
    "title": "Fot�grafo Profesional Madrid",
    "link": "https://...",
    "snippet": "Especialistas en fotograf�a de bodas...",
    "service": "Fotograf�a",
    "location": "Madrid",
    "priceRange": "1500-3000 EUR"
  },
  ...
]
```

---

## � Soluci�n de Problemas

### Error: "OPENAI_API_KEY missing"

**Causa:** La API key no est� configurada o el backend no la encuentra

**Soluci�n:**
1. Verifica que `backend/.env` existe
2. Verifica que `OPENAI_API_KEY=sk-...` tiene un valor
3. Reinicia el backend
4. Verifica que no hay espacios extra en la key

### Error: "401 Unauthorized"

**Causa:** La API key es inv�lida

**Soluci�n:**
1. Genera una nueva key en: https://platform.openai.com/api-keys
2. Actualiza `backend/.env`
3. Reinicia el backend

### Error: "429 Rate Limited"

**Causa:** Superaste el l�mite de peticiones gratuitas

**Soluci�n:**
1. Configura m�todo de pago en OpenAI
2. O espera unos minutos y prueba de nuevo

### Error: "Insufficient quota"

**Causa:** Se agot� el cr�dito o no hay m�todo de pago

**Soluci�n:**
1. Ve a: https://platform.openai.com/settings/organization/billing/overview
2. A�ade cr�ditos o m�todo de pago

### El backend no se inicia

**Causa:** Puerto 4004 ocupado o dependencias faltantes

**Soluci�n:**
```bash
cd backend
npm install
npm start
```

---

## =� Modelo y Costos

### Configuraci�n Actual

**Modelo usado:** `gpt-3.5-turbo`
- R�pido
- Econ�mico (~$0.002 por b�squeda)
- Resultados de buena calidad

**Puedes cambiar el modelo en:** `backend/routes/ai-suppliers.js` (l�nea 97)

```javascript
model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
```

### Modelos Alternativos

| Modelo | Velocidad | Calidad | Costo/b�squeda |
|--------|-----------|---------|----------------|
| `gpt-3.5-turbo` | ��� | PPP | $0.002 |
| `gpt-4` | �� | PPPPP | $0.03 |
| `gpt-4-turbo` | ��� | PPPPP | $0.01 |

**Recomendaci�n:** Usa `gpt-3.5-turbo` para desarrollo y `gpt-4-turbo` para producci�n.

---

## = Seguridad

###  Buenas Pr�cticas

1. **Nunca comitees el archivo `.env`**
   - Ya est� en `.gitignore`
   - Si lo hiciste por error, revoca la key inmediatamente

2. **Configura l�mites de gasto en OpenAI**
   - Ve a: Settings � Billing � Usage limits
   - Configura un m�ximo mensual (ej: $50)

3. **Usa variables de entorno en producci�n**
   - Render, Vercel, etc. tienen secci�n de "Environment Variables"
   - Nunca hardcodees las keys en el c�digo

4. **Revoca keys comprometidas**
   - Si tu key se filtr�, rev�cala en: https://platform.openai.com/api-keys
   - Genera una nueva inmediatamente

---

##  Checklist Final

Antes de usar el buscador en producci�n:

- [ ] API Key de OpenAI obtenida
- [ ] M�todo de pago configurado en OpenAI
- [ ] `backend/.env` creado con `OPENAI_API_KEY`
- [ ] Backend reiniciado y logs verificados
- [ ] Test de b�squeda funciona (sin mensaje "AI-DEMO")
- [ ] L�mites de gasto configurados en OpenAI
- [ ] `.env` est� en `.gitignore`

---

## <� Resultado Esperado

**Antes (con datos demo):**
```
DJ Sounds & Lights [AI-DEMO]
M�sica � Valencia
800 EUR - 1500 EUR
```

**Despu�s (con OpenAI real):**
```
DJ ProEvents Madrid
M�sica � Madrid
Especialistas en bodas de lujo con m�s de 200 eventos...
1200 EUR - 2500 EUR
https://djproevents.es
```

---

## =� Soporte

**Documentaci�n OpenAI:**
- API Reference: https://platform.openai.com/docs/api-reference
- Pricing: https://openai.com/pricing
- Status: https://status.openai.com

**Problemas comunes:**
- Revisa los logs del backend: `backend/logs/` (si existen)
- Activa modo debug: `DEBUG=* npm start` en el backend
- Verifica la consola del navegador para errores del frontend

---

## =� Configuraci�n Completada

Una vez configurado correctamente:

 **Buscador funciona con IA real**  
 **Proveedores reales con datos actualizados**  
 **Sin datos mockeados**  
 **Resultados personalizados seg�n ubicaci�n y presupuesto**

**�Listo para usar!** <�
