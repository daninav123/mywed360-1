# 🌍 Configuración de Google Places API

## 📋 **Resumen**

Google Places API se usa para buscar proveedores de bodas con datos **verificados** (teléfono, dirección, reviews). Es parte de la **estrategia híbrida** de búsqueda:

```
FIRESTORE (BD propia) → GOOGLE PLACES (verificados) → TAVILY (complemento)
```

---

## 🚀 **PASO 1: Crear proyecto en Google Cloud**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: `MaLove.App-places` o similar

---

## 🔑 **PASO 2: Habilitar APIs necesarias**

En [API Library](https://console.cloud.google.com/apis/library):

1. **Places API (New)** ⭐ RECOMENDADA
   - Buscar: "Places API (New)"
   - Click en "Enable"

2. **Places API** (Legacy - por compatibilidad)
   - Buscar: "Places API"
   - Click en "Enable"

3. **Geocoding API** (para coordenadas)
   - Buscar: "Geocoding API"
   - Click en "Enable"

---

## 🔐 **PASO 3: Crear API Key**

1. Ve a [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click en **"+ CREATE CREDENTIALS"**
3. Selecciona **"API key"**
4. Copia la API Key generada

### **⚠️ Configurar restricciones (IMPORTANTE):**

1. Click en la API Key creada para editarla
2. En **"Application restrictions"**:
   - **Para desarrollo:** Selecciona "None" (sin restricciones)
   - **Para producción:** Selecciona "IP addresses" y añade las IPs de tu servidor

3. En **"API restrictions"**:
   - Selecciona "Restrict key"
   - Marca solo:
     - ✅ Places API (New)
     - ✅ Places API
     - ✅ Geocoding API

4. Click en **"SAVE"**

---

## 🔧 **PASO 4: Configurar en tu proyecto**

### **En backend/.env:**

```bash
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSy...tu-api-key-aqui
```

### **Verificar que funciona:**

Reinicia el backend:

```bash
# En terminal del backend
Ctrl+C
npm run dev
```

Luego busca un proveedor de categoría con alta cobertura:

```bash
# Ejemplo: Buscar "fotografos" en "valencia"
```

Deberías ver en los logs del backend:

```
🌍 [GOOGLE PLACES] Buscando: fotografos en valencia
✅ [GOOGLE PLACES] 15 proveedores encontrados en 1200ms
```

---

## 💰 **PASO 5: Entender el coste**

### **Pricing de Google Places API:**

| Operación                      | Coste por 1000 llamadas | Descripción                 |
| ------------------------------ | ----------------------- | --------------------------- |
| **Text Search**                | $32 USD                 | Búsqueda inicial            |
| **Place Details (Basic)**      | $17 USD                 | Teléfono, nombre, dirección |
| **Place Details (Contact)**    | +$3 USD                 | Website adicional           |
| **Place Details (Atmosphere)** | +$5 USD                 | Rating, reviews             |

### **Nuestro uso (por búsqueda):**

1. **1x Text Search** = $0.032
2. **20x Place Details** = 20 × $0.017 = $0.34
3. **Total por búsqueda** = ~$0.37 (€0.35)

### **Cálculo mensual:**

| Usuarios/mes | Búsquedas/mes  | Coste USD | Coste EUR |
| ------------ | -------------- | --------- | --------- |
| 10 usuarios  | 200 búsquedas  | $7        | €6.50     |
| 50 usuarios  | 1000 búsquedas | $37       | €34       |
| 100 usuarios | 2000 búsquedas | $74       | €68       |

**💡 Estrategia para reducir coste:**

- Solo usamos Google Places para categorías de **alta/media cobertura**
- Para DJ, músicos, wedding planners → usamos **Tavily** (gratis)
- Si hay 10+ resultados → **no buscamos más en Tavily**

---

## 📊 **Categorías que usan Google Places**

### **✅ Alta cobertura (SIEMPRE usa Google Places):**

- `salones-banquetes`
- `restaurantes`
- `floristerias`, `floristas`
- `pasteleria`, `pastelerias`
- `joyeria`, `joyerias`
- `vestidos-novia`, `vestidos`
- `peluqueria`, `peluquerias`
- `belleza`
- `hoteles`

### **⚠️ Media cobertura (USA Google Places + Tavily):**

- `fotografos`, `fotografia`
- `videografos`, `video`
- `catering`
- `decoracion`

### **❌ Baja cobertura (SOLO Tavily, no Google Places):**

- `wedding-planners`, `planners`
- `musicos`, `musica`
- `dj`
- `cantantes`

---

## 🎯 **Flujo completo de búsqueda**

```
1. USUARIO BUSCA "fotografos valencia"
   ↓
2. FIRESTORE (BD propia)
   - Si hay ≥5 registrados → FIN
   - Si hay <5 → Continuar
   ↓
3. GOOGLE PLACES (fotografos = media cobertura)
   - Buscar en Google Maps
   - Obtener teléfono + dirección + reviews
   - Si hay ≥10 total → FIN
   - Si hay <10 → Continuar
   ↓
4. TAVILY (complementar)
   - Buscar freelancers en internet
   - Extraer email/teléfono de páginas web
   ↓
5. RESPUESTA FINAL
   - Prioridad: FIRESTORE → GOOGLE PLACES → TAVILY
   - Badge: "Registrado" → "Google verificado ✓" → "De internet 🌐"
```

---

## 🔍 **Monitorización de uso**

### **En Google Cloud Console:**

1. Ve a [Quotas & System Limits](https://console.cloud.google.com/apis/dashboard)
2. Selecciona tu proyecto
3. Busca "Places API"
4. Verás:
   - **Requests per day** (límite: 1000/día por defecto)
   - **Requests per minute** (límite: 100/min)

### **Alertas de coste:**

1. Ve a [Billing](https://console.cloud.google.com/billing)
2. Click en **"Budgets & alerts"**
3. Crea un presupuesto:
   - **Monto:** $50 USD/mes (€46/mes)
   - **Alertas:** 50%, 90%, 100%

---

## 🐛 **Troubleshooting**

### **Error: "This API key is not authorized to use this service"**

**Solución:**

1. Verifica que las APIs estén habilitadas (Paso 2)
2. Verifica las restricciones de la API Key (Paso 3)
3. Espera 1-2 minutos (propagación de cambios)

### **Error: "OVER_QUERY_LIMIT"**

**Solución:**

1. Has superado el límite gratuito de 1000 búsquedas/día
2. Opciones:
   - Habilitar facturación en Google Cloud
   - Reducir límite de resultados (`maxResults: 10` en vez de `20`)
   - Aumentar caché de resultados

### **No aparecen resultados**

**Solución:**

1. Verifica que la categoría use Google Places:
   ```javascript
   googlePlacesService.shouldUseGooglePlaces(service);
   ```
2. Prueba con una categoría de alta cobertura: `fotografos`, `restaurantes`
3. Verifica los logs del backend para ver errores

---

## 📚 **Documentación oficial**

- [Places API Overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Text Search](https://developers.google.com/maps/documentation/places/web-service/search-text)
- [Place Details](https://developers.google.com/maps/documentation/places/web-service/details)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

---

## ✅ **Checklist de configuración**

- [ ] Proyecto creado en Google Cloud
- [ ] APIs habilitadas (Places API, Geocoding API)
- [ ] API Key creada y configurada
- [ ] Restricciones aplicadas (IPs, APIs permitidas)
- [ ] Variable `GOOGLE_PLACES_API_KEY` en `.env`
- [ ] Backend reiniciado
- [ ] Prueba de búsqueda realizada
- [ ] Alertas de coste configuradas

---

## 💡 **Consejos finales**

1. **Empieza sin facturación** (1000 búsquedas gratis/día)
2. **Monitorea el uso** los primeros días
3. **Habilita facturación** solo cuando lo necesites
4. **Usa categorías específicas** para mejores resultados
5. **Combina con Tavily** para máxima cobertura

---

**🎉 ¡Listo! Ahora tienes búsqueda híbrida con datos verificados de Google Maps.**
