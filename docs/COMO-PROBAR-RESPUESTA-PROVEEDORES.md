# 🧪 CÓMO PROBAR: Sistema de Respuesta de Presupuestos por Email

## 🎯 Lo que vamos a probar

El flujo completo de:

1. ✅ Usuario solicita presupuesto
2. ✅ Backend genera token único
3. ✅ Proveedor recibe link por email (simulado)
4. ✅ Proveedor responde desde página pública
5. ✅ Usuario ve presupuesto en comparador

---

## 🚀 PRUEBA COMPLETA PASO A PASO

### **PASO 1: Solicitar un Presupuesto**

1. Abre tu app en desarrollo
2. Ve a `/proveedores`
3. Busca un proveedor (ej: "fotógrafos Barcelona")
4. Click en [💰 Solicitar Presupuesto]
5. Completa el formulario (2-3 min)
6. Click [📤 Enviar]
7. Ver toast: "✅ Presupuesto solicitado"

✅ **Checkpoint 1:** Solicitud creada

---

### **PASO 2: Obtener el Token de Respuesta**

**Opción A: Desde Firestore Console**

```
1. Ve a Firebase Console
2. Navega a Firestore Database
3. Busca: suppliers/{supplierId}/quote-requests/{requestId}
4. Encuentra el campo: responseToken
5. Copia el token (será algo como: a1b2c3d4e5f6...)
```

**Opción B: Desde logs del backend (si los tienes)**

```bash
# El backend log mostrará:
✅ Nueva solicitud presupuesto V2: req_abc123
   responseToken: a1b2c3d4e5f6g7h8...
```

✅ **Checkpoint 2:** Token obtenido

---

### **PASO 3: Acceder como Proveedor**

Simula que eres el proveedor que recibió el email:

```
http://localhost:5173/responder-presupuesto/TU_TOKEN_AQUI
```

**Ejemplo:**

```
http://localhost:5173/responder-presupuesto/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Lo que deberías ver:**

```
┌──────────────────────────────────────────────┐
│ 💰 Responder Solicitud de Presupuesto      │
│ Solicitud de: María García • Fotografía    │
├──────────────────────────────────────────────┤
│ 📋 Información del Evento                   │
│ Fecha: 15 jun 2025  Ciudad: Barcelona      │
│ Invitados: 120       Presupuesto: 25.000€  │
└──────────────────────────────────────────────┘
```

✅ **Checkpoint 3:** Página cargada correctamente

---

### **PASO 4: Completar Formulario como Proveedor**

**Sección 1: Precio**

```
Subtotal (sin IVA): 2000
IVA (21%):          420
Descuento:          100
Total:              2320  ← Calculado automáticamente
```

**Sección 2: Servicios Incluidos**

Los campos aparecen pre-rellenados con lo que el cliente solicitó:

```
horasCobertura:     10    ← Puedes modificar
album:              Sí    ← Puedes cambiar a No
tipoAlbum:          premium  ← Solo si album=Sí
fotosDigitales:     todas
segundoFotografo:   Sí    ← Puedes cambiar
```

**Extras incluidos:**

```
Pendrive USB personalizado
Galería online privada 2 años
Impresión 20x30cm regalo
```

**Sección 3: Condiciones**

```
Adelanto:           30%
Tiempo entrega:     45 días
Forma de pago:      30% adelanto, 40% día boda, 30% entrega
Cancelación:        Reembolso 100% hasta 60 días antes
Garantía:           Garantía de satisfacción 100%
```

**Sección 4: Mensaje**

```
Encantado de ser parte de tu día especial. Con más de 10 años
de experiencia fotografiando bodas, me especializo en capturar
momentos naturales y emotivos. Mi estilo es documental y
artístico, sin poses forzadas...
```

✅ **Checkpoint 4:** Formulario completo

---

### **PASO 5: Enviar Respuesta**

1. Click en [📤 Enviar Presupuesto]
2. Verás loading: "Enviando..."
3. Después success screen:

```
┌──────────────────────────────────────────────┐
│         ✅                                   │
│    ¡Presupuesto enviado!                    │
│                                              │
│ Tu presupuesto ha sido enviado a María      │
│                                              │
│ El cliente recibirá una notificación y      │
│ podrá comparar tu propuesta con otras.      │
└──────────────────────────────────────────────┘
```

✅ **Checkpoint 5:** Presupuesto enviado

---

### **PASO 6: Verificar en Firestore**

```
1. Ve a Firebase Console
2. Navega a: suppliers/{supplierId}/quote-requests/{requestId}
3. Deberías ver:
   - status: "quoted" (actualizado)
   - quotes: [...]  (array con tu presupuesto)
   - respondedAt: Timestamp
```

**Estructura del quote guardado:**

```json
{
  "quoteId": "quote_1642345678901",
  "version": 1,
  "status": "active",
  "pricing": {
    "subtotal": 2000,
    "taxes": 420,
    "discount": 100,
    "total": 2320,
    "currency": "EUR",
    "validUntil": "2025-02-15T00:00:00.000Z"
  },
  "serviceOffered": {
    "horasCobertura": "10",
    "album": true,
    "tipoAlbum": "premium",
    "fotosDigitales": "todas",
    "segundoFotografo": true,
    "extras": [
      "Pendrive USB personalizado",
      "Galería online privada 2 años",
      "Impresión 20x30cm regalo"
    ]
  },
  "terms": {
    "deposit": 30,
    "paymentTerms": "30% adelanto, 40% día boda, 30% entrega",
    "cancellationPolicy": "Reembolso 100% hasta 60 días antes",
    "deliveryTime": "45 días",
    "warranty": "Garantía de satisfacción 100%"
  },
  "message": "Encantado de ser parte de tu día especial...",
  "createdAt": "2025-01-15T20:45:00.000Z",
  "updatedAt": "2025-01-15T20:45:00.000Z"
}
```

✅ **Checkpoint 6:** Datos guardados correctamente

---

### **PASO 7: Ver Presupuesto como Usuario**

1. Vuelve a tu usuario normal
2. Ve a `QuoteRequestsTracker` (donde veas tus solicitudes)
3. Deberías ver badge: "💰 1 presupuesto"
4. Si hay múltiples proveedores con presupuestos:
   - Verás: "📊 Comparar Fotografía (2)"
5. Click en comparar
6. ¡Verás tu presupuesto en el comparador! 🎉

✅ **Checkpoint 7:** Flujo completo funcional

---

## 🧪 CASOS DE PRUEBA ADICIONALES

### **Test 1: Token Inválido**

```
http://localhost:5173/responder-presupuesto/token_falso_123
```

**Resultado esperado:**

```
┌──────────────────────────────────────────────┐
│         ⚠️                                   │
│    Link inválido o expirado                 │
│                                              │
│ El link que has usado no es válido o ya     │
│ expiró.                                      │
└──────────────────────────────────────────────┘
```

### **Test 2: Validación de Precio**

Intenta enviar con:

- Subtotal: (vacío)
- Click [Enviar]

**Resultado esperado:**

```
Alert: "Ingresa un precio válido"
```

### **Test 3: Validación de Mensaje**

Intenta enviar con:

- Mensaje: "Hola" (menos de 20 caracteres)
- Click [Enviar]

**Resultado esperado:**

```
Alert: "Añade un mensaje explicativo (mínimo 20 caracteres)"
```

### **Test 4: Cálculo Automático**

```
Subtotal: 1000
IVA:      210
Descuento: 50

Total esperado: 1160  ← Debe calcularse automáticamente
```

### **Test 5: Campos Condicionales**

```
1. Album: Sí    → tipoAlbum aparece
2. Album: No    → tipoAlbum desaparece
```

---

## 📊 CHECKLIST COMPLETO

| #   | Test                        | Estado |
| --- | --------------------------- | ------ |
| 1   | Solicitar presupuesto       | ⬜     |
| 2   | Token se genera             | ⬜     |
| 3   | responseUrl se guarda       | ⬜     |
| 4   | Página carga con token      | ⬜     |
| 5   | Info del evento visible     | ⬜     |
| 6   | Servicios pre-rellenados    | ⬜     |
| 7   | Cálculo automático funciona | ⬜     |
| 8   | Validación de precio        | ⬜     |
| 9   | Validación de mensaje       | ⬜     |
| 10  | Envío exitoso               | ⬜     |
| 11  | Success screen aparece      | ⬜     |
| 12  | Datos en Firestore          | ⬜     |
| 13  | Status actualizado          | ⬜     |
| 14  | Badge en tracker            | ⬜     |
| 15  | Comparador funciona         | ⬜     |

---

## 🐛 PROBLEMAS COMUNES

### **Error: "request_not_found"**

**Causa:** Token incorrecto o solicitud no existe

**Solución:**

1. Verifica que copiaste el token completo
2. Revisa en Firestore que la solicitud existe
3. Confirma que el responseToken coincide

### **Error: "Cannot read property 'fecha'"**

**Causa:** weddingInfo no se guardó correctamente

**Solución:**

1. Asegúrate de que el usuario completó el formulario de solicitud
2. Verifica en Firestore que weddingInfo existe

### **Página en blanco**

**Causa:** Error de compilación o import

**Solución:**

1. Revisa consola del navegador (F12)
2. Verifica que PublicQuoteResponse.jsx está en src/pages/
3. Confirma que el import está en App.jsx

---

## 🎯 RESUMEN RÁPIDO

**Para probar en 2 minutos:**

```bash
# 1. Solicita presupuesto desde la app
# 2. Copia el responseToken de Firestore
# 3. Abre en navegador:
http://localhost:5173/responder-presupuesto/TOKEN_AQUI

# 4. Completa formulario:
Subtotal: 2000
IVA: 420
Mensaje: "Test de presupuesto con al menos 20 caracteres"

# 5. Click [Enviar]
# 6. Verifica en Firestore que se guardó
```

---

## ✅ ESTADO FINAL ESPERADO

Si todo funciona correctamente:

```
✅ Página pública carga sin errores
✅ Token válido accede a solicitud
✅ Formulario pre-rellena servicios
✅ Cálculos automáticos funcionan
✅ Validaciones previenen errores
✅ Envío guarda en Firestore
✅ Status actualiza a 'quoted'
✅ Usuario ve badge de presupuesto
✅ Comparador muestra el presupuesto
```

---

## 📧 SIGUIENTE PASO: Email Template

Para completar el flujo, falta:

**Template de email para proveedores:**

```html
Asunto: Nueva solicitud de presupuesto para tu servicio Hola [Nombre Proveedor], [Nombre Cliente]
está interesado en contratar tu servicio de [Categoría] para su boda el [Fecha] en [Ciudad].
Responde con tu mejor oferta: 👉 [LINK CON TOKEN ÚNICO] Detalles de la boda: - Fecha: [Fecha] -
Ciudad: [Ciudad] - Invitados: [Número] - Presupuesto: [Cantidad]€ [Cliente] espera tu respuesta. ---
MyWed360
```

---

**¡Listo para probar!** 🚀

**Tiempo estimado de prueba:** 5-10 minutos  
**Dificultad:** Baja  
**Resultado:** Sistema completo funcional
