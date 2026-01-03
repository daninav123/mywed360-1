# 📋 Propuesta de Campos para Perfil de Boda

## 🔍 Análisis Actual

### ✅ Campos Existentes en `weddingInfo`

1. **coupleName** - Nombre de la pareja ✅
2. **celebrationPlace** - Lugar de la celebración ✅
3. **celebrationAddress** - Dirección de la celebración ✅
4. **banquetPlace** - Lugar del banquete ✅
5. **receptionAddress** - Dirección del banquete ✅
6. **schedule** - Horario (ceremonia/recepción) ✅
7. **weddingDate** - Fecha de la boda ✅
8. **rsvpDeadline** - Fecha límite RSVP ✅
9. **giftAccount** - Cuenta de regalos ✅
10. **transportation** - Transporte / alojamiento ✅
11. **weddingStyle** - Estilo de la boda ✅
12. **colorScheme** - Paleta de colores ✅
13. **numGuests** - Número de invitados (auto) ✅

### ❌ Campos que FALTAN

## 📝 Componentes y Campos Necesarios

### 1️⃣ **Historia de la Pareja** (CraftStorySection)

**Campo Necesario:**

- `story` (textarea) - Historia de la pareja
  - Ej: "Nos conocimos en el verano de 2018..."

---

### 2️⃣ **Menú del Evento** (CraftMenuSection)

**Campos Necesarios:**

- `menuDescription` (textarea) - Descripción general del menú
- `menuItems` (JSON/array) - Platos del menú
  ```json
  [
    {
      "tipo": "Entrante",
      "nombre": "Ensalada César",
      "descripcion": "Con pollo y queso parmesano"
    },
    {
      "tipo": "Principal",
      "nombre": "Solomillo de ternera",
      "descripcion": "Con patatas y verduras"
    },
    { "tipo": "Postre", "nombre": "Tarta nupcial", "descripcion": "Chocolate y frutos rojos" }
  ]
  ```

**Alternativa Simple:**

- `menu` (textarea) - Texto libre con el menú completo

---

### 3️⃣ **Preguntas Frecuentes** (CraftFAQSection)

**Campo Necesario:**

- `faqs` (JSON/array) - Lista de preguntas y respuestas
  ```json
  [
    { "pregunta": "¿Habrá parking?", "respuesta": "Sí, hay parking gratuito para 100 coches" },
    { "pregunta": "¿Puedo llevar niños?", "respuesta": "Por supuesto, los niños son bienvenidos" }
  ]
  ```

---

### 4️⃣ **Código de Vestimenta** (CraftDressCodeSection)

**Campos Necesarios:**

- `dressCode` (select) - Tipo de código
  - Opciones: Formal, Semi-formal, Casual, Etiqueta, Black Tie
- `dressCodeDescription` (textarea) - Descripción adicional
  - Ej: "Sugerimos tonos pastel y evitar el blanco"

---

### 5️⃣ **Regalos** (CraftGiftRegistrySection)

**Campos Necesarios:**

- `giftMessage` (textarea) - Mensaje personalizado sobre regalos
  - Ej: "Lo más importante es vuestra asistencia"
- `giftRegistryLinks` (JSON/array) - Enlaces a tiendas
  ```json
  [
    { "tienda": "Amazon", "url": "https://...", "codigo": "ABC123" },
    { "tienda": "El Corte Inglés", "url": "https://..." }
  ]
  ```

---

### 6️⃣ **Transporte y Autobuses** (CraftTravelInfoSection)

**Campos Necesarios:**

#### Autobuses:

- `busInfo` (JSON/array) - Información de autobuses
  ```json
  [
    {
      "tipo": "Ida",
      "lugarSalida": "Plaza Mayor",
      "hora": "16:00",
      "paradas": "Plaza Mayor, Estación de tren"
    },
    {
      "tipo": "Vuelta",
      "lugarSalida": "Finca La Rosaleda",
      "hora": "02:00",
      "paradas": "Directo a Plaza Mayor"
    }
  ]
  ```

#### Hoteles Recomendados:

- `hotelInfo` (JSON/array) - Hoteles recomendados
  ```json
  [
    {
      "nombre": "Hotel Princesa",
      "direccion": "Calle Mayor 45",
      "telefono": "+34 91 xxx xxxx",
      "distancia": "5 km del lugar",
      "precio": "desde 80€/noche",
      "codigoDescuento": "BODA2024"
    }
  ]
  ```

#### Alojamiento General:

- `lodgingInfo` (textarea) - Información general de alojamiento

---

### 7️⃣ **Información Adicional**

**Campo Necesario:**

- `additionalInfo` (textarea) - Información general adicional
  - Para CraftEventInfoSection y otros componentes

---

## 🎯 Propuesta de Implementación

### Opción 1: Campos Simples (Texto)

**Ventajas:** Fácil de implementar, flexible
**Desventajas:** Menos estructurado

```javascript
const weddingInfo = {
  // ... campos existentes ...

  // NUEVOS CAMPOS
  story: '', // Historia de la pareja
  menu: '', // Menú (texto libre)
  dressCode: 'Formal', // Código de vestimenta
  dressCodeDetails: '', // Detalles del dress code
  giftMessage: '', // Mensaje sobre regalos
  busSchedule: '', // Horarios de autobuses
  hotelRecommendations: '', // Hoteles recomendados
  additionalInfo: '', // Info adicional
};
```

### Opción 2: Campos Estructurados (JSON)

**Ventajas:** Más potente, datos estructurados
**Desventajas:** Más complejo de implementar

```javascript
const weddingInfo = {
  // ... campos existentes ...

  // NUEVOS CAMPOS
  story: '',
  menu: {
    description: '',
    items: [],
  },
  faqs: [],
  dressCode: {
    type: 'Formal',
    description: '',
  },
  gifts: {
    message: '',
    account: '',
    registries: [],
  },
  transport: {
    buses: [],
    hotels: [],
    generalInfo: '',
  },
  additionalInfo: '',
};
```

---

## ✅ Recomendación

**FASE 1** (Inmediato): Implementar campos de texto simple

- `story` - Historia
- `menu` - Menú (texto)
- `dressCode` - Código de vestimenta
- `dressCodeDetails` - Detalles
- `giftMessage` - Mensaje de regalos
- `busInfo` - Info de autobuses
- `hotelInfo` - Info de hoteles
- `additionalInfo` - Info adicional

**FASE 2** (Futuro): Migrar a campos estructurados con interfaz visual

- Editor de FAQs (añadir/eliminar preguntas)
- Editor de menú (añadir/eliminar platos)
- Editor de hoteles (añadir/eliminar hoteles)
- Editor de autobuses (añadir/eliminar rutas)

---

## 📊 Resumen de Campos a Añadir (FASE 1)

| Campo              | Tipo     | Componente               | Descripción           |
| ------------------ | -------- | ------------------------ | --------------------- |
| `story`            | textarea | CraftStorySection        | Historia de la pareja |
| `menu`             | textarea | CraftMenuSection         | Menú del evento       |
| `dressCode`        | select   | CraftDressCodeSection    | Código de vestimenta  |
| `dressCodeDetails` | textarea | CraftDressCodeSection    | Detalles del código   |
| `giftMessage`      | textarea | CraftGiftRegistrySection | Mensaje sobre regalos |
| `busInfo`          | textarea | CraftTravelInfoSection   | Horarios de autobuses |
| `hotelInfo`        | textarea | CraftTravelInfoSection   | Hoteles recomendados  |
| `additionalInfo`   | textarea | Multiple                 | Información adicional |
| `faqs`             | textarea | CraftFAQSection          | FAQs (formato texto)  |

**Total: 9 campos nuevos**
