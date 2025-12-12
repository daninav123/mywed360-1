# 🚨 ACCIÓN INMEDIATA - Renovación de API Keys

**Fecha:** 12 de Diciembre de 2025  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo Estimado:** 30-45 minutos

---

## ⚠️ Problemas Detectados

### 1. OpenAI API Key - EXPIRADA
```
Error: 401 Incorrect API key provided: sk-proj-****...
Timestamp: 2025-12-12 00:21:53
Status: ❌ NO FUNCIONAL
```

**Impacto:**
- ❌ Generación de contenido con IA no funciona
- ❌ Búsqueda inteligente de proveedores no funciona
- ❌ Asistente de IA no responde
- ❌ Recomendaciones automáticas no disponibles

### 2. Tavily API Key - NO CONFIGURADA
```
Warning: Tavily API key missing, returning empty research payload
Timestamp: 2025-12-12 00:21:53
Status: ⚠️ NO DISPONIBLE
```

**Impacto:**
- ❌ Búsqueda de investigación no disponible
- ⚠️ Funcionalidad degradada

---

## ✅ Pasos para Resolver (Ahora Mismo)

### Paso 1: Renovar OpenAI API Key (5 minutos)

1. **Ir a:** https://platform.openai.com/account/api-keys
2. **Iniciar sesión** con tu cuenta de OpenAI
3. **Crear nueva API key:**
   - Click en "Create new secret key"
   - Copiar la key completa (ej: `sk-proj-...`)
   - Guardar en lugar seguro

4. **Actualizar en `.env` local:**
   ```bash
   # Abrir archivo .env
   nano .env
   
   # Buscar línea OPENAI_API_KEY y reemplazar
   OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
   
   # Guardar (Ctrl+X, Y, Enter)
   ```

5. **Actualizar en producción** (si aplica):
   - Si usas Vercel: Settings → Environment Variables
   - Si usas Render: Environment
   - Si usas Firebase: Cloud Functions → Environment variables
   - Si usas Docker: `.env` en servidor

6. **Reiniciar servicios:**
   ```bash
   # Backend
   npm run backend
   
   # O todos los servicios
   npm run dev:all
   ```

7. **Verificar:**
   ```bash
   # Ejecutar verificador
   node scripts/check-api-keys-status.js
   
   # Debería mostrar: ✅ OpenAI: VÁLIDA
   ```

---

### Paso 2: Configurar Tavily API Key (10 minutos)

1. **Registrarse en:** https://tavily.com
2. **Crear cuenta** (si no tienes)
3. **Obtener API key:**
   - Dashboard → API Keys
   - Copiar la key
   - Guardar en lugar seguro

4. **Actualizar en `.env` local:**
   ```bash
   nano .env
   
   # Agregar o actualizar
   TAVILY_API_KEY=tvly-YOUR_KEY_HERE
   
   # Guardar
   ```

5. **Actualizar en producción** (mismo proceso que OpenAI)

6. **Reiniciar servicios:**
   ```bash
   npm run backend
   npm run dev:all
   ```

7. **Verificar:**
   ```bash
   node scripts/check-api-keys-status.js
   
   # Debería mostrar: ✅ Tavily: VÁLIDA
   ```

---

### Paso 3: Verificar Todas las API Keys (5 minutos)

```bash
# Ejecutar verificador completo
node scripts/check-api-keys-status.js
```

**Resultado esperado:**
```
═══════════════════════════════════════════════════════
  VERIFICACIÓN DE API KEYS - MaLoveApp
═══════════════════════════════════════════════════════

Verificando OpenAI... ✅ VÁLIDA
Verificando Tavily... ✅ VÁLIDA
Verificando Stripe (Secret)... ✅ VÁLIDA
Verificando Stripe (Publishable)... ✅ VÁLIDA
Verificando Mailgun... ✅ CONFIGURADA
Verificando Firebase... ✅ CONFIGURADA
Verificando Twilio... ✅ CONFIGURADA
Verificando Google Places... ✅ CONFIGURADA

═══════════════════════════════════════════════════════
RESUMEN
═══════════════════════════════════════════════════════

Total de APIs: 8
✅ Válidas: 2
✅ Configuradas: 6
⚠️ Faltantes: 0
❌ Inválidas: 0

✅ TODAS LAS API KEYS ESTÁN CONFIGURADAS
```

---

## 🔄 Proceso de Actualización en Producción

### Si usas Vercel
1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto
3. Settings → Environment Variables
4. Actualizar `OPENAI_API_KEY` y `TAVILY_API_KEY`
5. Redeploy automático

### Si usas Render
1. Ir a: https://dashboard.render.com
2. Seleccionar servicio
3. Environment
4. Actualizar variables
5. Redeploy automático

### Si usas Firebase Hosting + Cloud Functions
1. Ir a: https://console.firebase.google.com
2. Project Settings → Service Accounts
3. Actualizar variables de entorno
4. Redeploy

### Si usas Docker/VPS
1. SSH a servidor
2. Editar `.env`
3. Reiniciar contenedor/servicio
4. Verificar logs

---

## 📋 Checklist de Verificación

- [ ] OpenAI API key renovada
- [ ] Tavily API key configurada
- [ ] `.env` local actualizado
- [ ] Variables de producción actualizadas
- [ ] Servicios reiniciados
- [ ] `check-api-keys-status.js` ejecutado
- [ ] Todas las keys muestran ✅ VÁLIDA o ✅ CONFIGURADA
- [ ] Logs sin errores de autenticación
- [ ] Funcionalidades de IA operativas

---

## 🧪 Pruebas de Funcionamiento

### Prueba 1: Verificar OpenAI
```bash
# Ejecutar test de OpenAI
curl -X GET https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Debería retornar lista de modelos
```

### Prueba 2: Verificar Tavily
```bash
# Ejecutar test de Tavily
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{"api_key":"'$TAVILY_API_KEY'","query":"test"}'

# Debería retornar resultados de búsqueda
```

### Prueba 3: Verificar en aplicación
1. Abrir aplicación en navegador
2. Ir a sección de IA (búsqueda de proveedores, asistente, etc.)
3. Verificar que funciona sin errores

---

## 🚨 Si Algo Falla

### Error: "Invalid API key"
- [ ] Verificar que copiaste la key completa
- [ ] Verificar que no hay espacios en blanco
- [ ] Verificar que la key no está expirada
- [ ] Crear nueva key y reintentar

### Error: "API key not found"
- [ ] Verificar que `.env` está en directorio raíz
- [ ] Verificar que la variable está correctamente nombrada
- [ ] Reiniciar servicio después de actualizar `.env`

### Error: "Network error"
- [ ] Verificar conexión a internet
- [ ] Verificar que el firewall no bloquea las APIs
- [ ] Verificar que la URL es correcta

### Error: "Rate limit exceeded"
- [ ] Esperar 1 hora
- [ ] Verificar plan de API (free/paid)
- [ ] Contactar con soporte del servicio

---

## 📞 Contactos de Soporte

| Servicio | Soporte | Documentación |
|----------|---------|---------------|
| OpenAI | [support.openai.com](https://support.openai.com) | [platform.openai.com/docs](https://platform.openai.com/docs) |
| Tavily | [tavily.com/contact](https://tavily.com/contact) | [docs.tavily.com](https://docs.tavily.com) |

---

## ⏰ Próximas Renovaciones

Después de completar esta acción inmediata, configurar recordatorios para:

- **OpenAI:** Cada 90 días
- **Tavily:** Cada 90 días
- **Stripe:** Cada 180 días
- **Otros:** Cada 180 días

Ver `docs/API_KEYS_MANAGEMENT.md` para más detalles.

---

**Tiempo Total Estimado:** 30-45 minutos  
**Dificultad:** ⭐ Fácil  
**Impacto:** 🔴 CRÍTICO

**¡Completar esta acción ahora mismo!**

---

**Generado:** 2025-12-12 18:40 UTC+01:00  
**Rama:** dev-improvements-dec-2025  
**Estado:** Acción inmediata requerida
