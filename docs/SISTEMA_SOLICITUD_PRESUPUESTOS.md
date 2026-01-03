# 💰 Sistema de Solicitud Automática de Presupuestos

## 🎯 Objetivo

Automatizar la solicitud de presupuestos a proveedores con información **contextual inteligente** que se adapta a:

- La categoría del proveedor
- Los datos de la boda ya disponibles
- Las preferencias del usuario

---

## 🤔 ¿QUÉ NECESITA UN PROVEEDOR PARA DAR PRESUPUESTO?

### **1. INFORMACIÓN BÁSICA (Universal)**

✅ Ya tenemos en `WeddingContext`:

```javascript
{
  fecha: "2025-06-15",
  ciudad: "Barcelona",
  numeroInvitados: 120,
  presupuestoTotal: 25000
}
```

### **2. INFORMACIÓN ESPECÍFICA POR CATEGORÍA**

#### **Fotografía** 📸

```javascript
{
  horasCobertura: 8,
  album: true,
  tipoAlbum: "premium",
  fotosDigitales: "todas",
  segundoFotografo: true,
  sesionCompromiso: false,
  estilo: "natural"
}
```

#### **Video** 🎥

```javascript
{
  paquete: "completo", // corto/medio/completo
  duracion: "8-10h",
  highlightVideo: true,
  videoCeremonia: true,
  videoBanquete: true,
  dron: true,
  entregaEdicion: "2 meses"
}
```

#### **Catering** 🍽️

```javascript
{
  tipoMenu: "sentado", // sentado/buffet/cocktail
  numeroPlatos: 3,
  barralibre: true,
  horasBarraLibre: 5,
  cocteles: true,
  restriccionesAlimentarias: ["vegetariano", "celiaco"],
  tipoComida: "mediterranea"
}
```

#### **DJ / Música** 🎵

```javascript
{
  horas: 5,
  tipoMusica: ["pop", "rock", "latina"],
  equipoSonido: true,
  equipoLuces: true,
  presentacion: false,
  listaNegra: ["reggaeton"]
}
```

#### **Lugar / Venue** 🏛️

```javascript
{
  capacidad: 120,
  tipoEvento: "ceremonia+banquete", // solo_ceremonia/solo_banquete/ambos
  horaInicio: "17:00",
  horaFin: "03:00",
  espacioExterior: true,
  alojamiento: false
}
```

#### **Flores y Decoración** 🌸

```javascript
{
  tipoArreglos: ["ramo_novia", "centros_mesa", "ceremonia"],
  colores: ["blanco", "rosa_palido", "verde"],
  estilo: "romantico", // rustico/moderno/clasico/romantico
  florFavorita: "peonias",
  presupuestoFlores: 1500
}
```

---

## 🏗️ ARQUITECTURA PROPUESTA

### **Nivel 1: Detección Automática de Contexto**

```javascript
// src/services/quoteRequestContext.js

function getWeddingBasicInfo(weddingData) {
  return {
    fecha: weddingData.date,
    ciudad: weddingData.location?.city,
    numeroInvitados: weddingData.guestCount,
    presupuestoTotal: weddingData.budget?.total,

    // ✅ AUTOMÁTICO: El usuario no necesita escribir esto
    nombreContacto: weddingData.owner?.name,
    emailContacto: weddingData.owner?.email,
    telefonoContacto: weddingData.owner?.phone,
  };
}
```

### **Nivel 2: Formulario Dinámico por Categoría**

```javascript
// src/data/quoteFormTemplates.js

export const QUOTE_FORM_TEMPLATES = {
  fotografia: {
    fields: [
      {
        id: 'horasCobertura',
        label: '¿Cuántas horas de cobertura necesitas?',
        type: 'select',
        options: ['4h', '6h', '8h', '10h', '12h (día completo)'],
        default: '8h',
        required: true,
        weight: 'high', // Afecta mucho al precio
      },
      {
        id: 'album',
        label: '¿Quieres álbum físico?',
        type: 'boolean',
        default: true,
        required: true,
        weight: 'medium',
      },
      {
        id: 'tipoAlbum',
        label: 'Tipo de álbum',
        type: 'select',
        options: ['básico', 'premium', 'luxury'],
        dependsOn: 'album', // Solo si album = true
        default: 'premium',
        weight: 'medium',
      },
      {
        id: 'segundoFotografo',
        label: '¿Segundo fotógrafo?',
        type: 'boolean',
        default: false,
        helpText: 'Recomendado para bodas >100 invitados',
        weight: 'medium',
      },
      {
        id: 'estilo',
        label: 'Estilo de fotografía',
        type: 'select',
        options: ['natural', 'editorial', 'artístico', 'clásico'],
        default: 'natural',
        weight: 'low',
      },
    ],
  },

  catering: {
    fields: [
      {
        id: 'tipoServicio',
        label: 'Tipo de servicio',
        type: 'select',
        options: ['menú sentado', 'buffet', 'cocktail', 'mixto'],
        required: true,
        weight: 'high',
      },
      {
        id: 'numeroPlatos',
        label: 'Número de platos',
        type: 'number',
        min: 2,
        max: 5,
        default: 3,
        dependsOn: { tipoServicio: 'menú sentado' },
        weight: 'high',
      },
      {
        id: 'barralibre',
        label: '¿Barra libre?',
        type: 'boolean',
        default: true,
        weight: 'high',
      },
      {
        id: 'restricciones',
        label: 'Restricciones alimentarias',
        type: 'multi-select',
        options: ['vegetariano', 'vegano', 'celíaco', 'sin lactosa', 'halal', 'kosher'],
        required: false,
        weight: 'medium',
      },
    ],
  },

  // ... más categorías
};
```

### **Nivel 3: UI Inteligente con Progreso**

```jsx
// src/components/suppliers/RequestQuoteModal.jsx

function RequestQuoteModal({ supplier, onClose }) {
  // 1. Detectar categoría del proveedor
  const category = supplier.category;

  // 2. Cargar formulario específico
  const formTemplate = QUOTE_FORM_TEMPLATES[category] || QUOTE_FORM_TEMPLATES.default;

  // 3. Pre-rellenar con datos de la boda
  const weddingInfo = useWeddingBasicInfo();

  // 4. Mostrar solo campos relevantes
  const visibleFields = getVisibleFields(formTemplate, formData);

  // 5. Calcular progreso
  const progress = calculateProgress(formData, formTemplate);

  return (
    <Modal>
      <ProgressBar value={progress} />

      {/* Sección 1: Info Automática (NO editable) */}
      <Section title="📋 Información de tu boda">
        <InfoCard>
          ✅ Fecha: {weddingInfo.fecha}✅ Ciudad: {weddingInfo.ciudad}✅ Invitados:{' '}
          {weddingInfo.numeroInvitados}
        </InfoCard>
      </Section>

      {/* Sección 2: Info Específica (EDITABLE) */}
      <Section title="🎯 Detalles del servicio">
        {visibleFields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={handleChange}
          />
        ))}
      </Section>

      {/* Sección 3: Mensaje Personalizado (OPCIONAL) */}
      <Section title="💬 Mensaje adicional">
        <Textarea
          placeholder="Cuéntale al proveedor cualquier detalle especial..."
          value={customMessage}
          onChange={setCustomMessage}
        />
      </Section>

      <Actions>
        <Button onClick={handleSend}>Solicitar Presupuesto</Button>
      </Actions>
    </Modal>
  );
}
```

---

## 🎨 FLUJO DE USUARIO (UX)

### **Paso 1: Click en "Solicitar Presupuesto"**

```
Usuario ve en SupplierCard:
┌─────────────────────────────┐
│ Studio Fotográfico Pro      │
│ 🏷️ Fotografía (92%)         │
│ [Ver Detalles] [💰 Presupuesto] ← CLICK AQUÍ
└─────────────────────────────┘
```

### **Paso 2: Modal se abre con Progreso**

```
┌─────────────────────────────────────────┐
│ Solicitar Presupuesto                   │
│ Studio Fotográfico Pro                  │
│                                         │
│ [████████░░] 80% completado             │
│                                         │
│ 📋 Información de tu boda               │
│ ✅ Fecha: 15 Jun 2025 (automático)     │
│ ✅ Ciudad: Barcelona (automático)       │
│ ✅ Invitados: 120 (automático)          │
│                                         │
│ 🎯 Detalles del servicio                │
│                                         │
│ ¿Cuántas horas de cobertura? *         │
│ [▼ 8 horas                    ]         │
│                                         │
│ ¿Quieres álbum físico? *                │
│ [✓] Sí  [ ] No                          │
│                                         │
│ Tipo de álbum                           │
│ [▼ Premium                    ]         │
│                                         │
│ ¿Segundo fotógrafo?                     │
│ [ ] Sí  [✓] No                          │
│ ℹ️ Recomendado para >100 invitados     │
│                                         │
│ 💬 Mensaje adicional (opcional)         │
│ [________________________________]      │
│ [________________________________]      │
│                                         │
│ [Cancelar] [📤 Solicitar Presupuesto]  │
└─────────────────────────────────────────┘
```

### **Paso 3: Confirmación y Envío**

```
Toast: ✅ Presupuesto solicitado a Studio Fotográfico Pro

Email al proveedor:
┌─────────────────────────────────────────┐
│ Asunto: Solicitud de presupuesto        │
│                                         │
│ Hola Studio Fotográfico Pro,            │
│                                         │
│ María García te ha solicitado un        │
│ presupuesto para su boda:               │
│                                         │
│ 📅 Fecha: 15 de Junio de 2025           │
│ 📍 Ciudad: Barcelona                    │
│ 👥 Invitados: 120 personas              │
│                                         │
│ 📸 Detalles del servicio:               │
│ • Cobertura: 8 horas                    │
│ • Álbum: Sí (Premium)                   │
│ • Segundo fotógrafo: No                 │
│ • Estilo: Natural                       │
│                                         │
│ 💬 Mensaje de María:                    │
│ "Nos encantaría que cubrieras           │
│  nuestra boda..."                       │
│                                         │
│ [Responder con Presupuesto]             │
└─────────────────────────────────────────┘
```

---

## 🧠 SISTEMA INTELIGENTE DE RECOMENDACIONES

### **1. Sugerencias Basadas en Datos**

```javascript
// Si numeroInvitados > 100
→ Sugerir: segundoFotografo = true
→ Mensaje: "Para 120 invitados, recomendamos segundo fotógrafo"

// Si presupuestoTotal < 15000
→ Sugerir: paquetes básicos
→ Ocultar: opciones premium/luxury

// Si fecha en verano (Jun-Sep)
→ Sugerir: espacioExterior = true
→ Mensaje: "Perfecto para ceremonia al aire libre"
```

### **2. Pre-rellenado Inteligente**

```javascript
// Si ya solicitó presupuesto a otro fotógrafo:
const previousRequest = getPreviousQuoteRequest('fotografia');

→ Pre-rellenar con los mismos valores
→ Mensaje: "Hemos usado los mismos detalles de tu última solicitud"
→ Opción: "Usar diferentes requisitos"
```

### **3. Validación Contextual**

```javascript
// Si fecha < 6 meses
→ Warning: "Tu boda es en 4 meses. Algunos proveedores pueden no estar disponibles"

// Si horasCobertura muy bajas para numeroInvitados
→ Warning: "Para 150 invitados, 4 horas puede ser insuficiente"

// Si presupuestoTotal muy bajo para servicios solicitados
→ Warning: "El presupuesto total (15000€) puede ser ajustado para todos los servicios"
```

---

## 📊 TEMPLATES POR CATEGORÍA

### **Categorías con Templates Específicos:**

✅ Fotografía (5-8 campos)  
✅ Video (5-7 campos)  
✅ Catering (6-10 campos)  
✅ DJ/Música (4-6 campos)  
✅ Lugar/Venue (6-8 campos)  
✅ Flores (4-6 campos)  
✅ Decoración (4-5 campos)

### **Categorías con Template Genérico:**

✅ Otros (3 campos básicos)

---

## 🎯 PREGUNTAS CLAVE POR CATEGORÍA

### **Fotografía** 📸

1. ¿Cuántas horas? (crítico para precio)
2. ¿Álbum físico? (±300-800€)
3. ¿Segundo fotógrafo? (±400-600€)
4. ¿Sesión de compromiso? (±200-400€)

### **Video** 🎥

1. ¿Paquete? (corto/medio/completo)
2. ¿Highlight video? (3-5 min)
3. ¿Dron? (±300-500€)
4. ¿Ceremonia + banquete?

### **Catering** 🍽️

1. ¿Tipo servicio? (sentado/buffet)
2. ¿Número de platos? (2-5)
3. ¿Barra libre? (crítico)
4. ¿Restricciones alimentarias?

### **Música/DJ** 🎵

1. ¿Cuántas horas?
2. ¿Qué tipo de música?
3. ¿Equipo de luces?
4. ¿Hay temas prohibidos?

---

## 🚀 IMPLEMENTACIÓN SUGERIDA

### **Fase 1: MVP (2-3 días)**

✅ Formulario básico con info automática  
✅ Templates para top 5 categorías  
✅ Envío por email

### **Fase 2: Inteligente (1 semana)**

✅ Pre-rellenado con solicitudes previas  
✅ Validaciones contextuales  
✅ Sugerencias basadas en datos

### **Fase 3: Avanzado (2 semanas)**

✅ Templates para todas las categorías  
✅ Presupuestos comparativos  
✅ Seguimiento de respuestas  
✅ Chat directo con proveedor

---

## 💾 ESTRUCTURA DE DATOS

```javascript
// Firestore: users/{uid}/weddings/{weddingId}/quoteRequests/{requestId}
{
  id: "req_abc123",
  supplierId: "sup_xyz789",
  supplierName: "Studio Fotográfico Pro",
  supplierCategory: "fotografia",

  // Info automática
  weddingInfo: {
    date: "2025-06-15",
    city: "Barcelona",
    guestCount: 120,
    budgetTotal: 25000
  },

  // Info específica
  serviceDetails: {
    horasCobertura: "8h",
    album: true,
    tipoAlbum: "premium",
    segundoFotografo: false,
    estilo: "natural"
  },

  // Mensaje personalizado
  customMessage: "Nos encantaría...",

  // Metadatos
  status: "sent", // sent/responded/accepted/rejected
  sentAt: "2025-01-15T10:30:00Z",
  respondedAt: null,
  estimatedPrice: null,

  // Respuesta del proveedor
  response: {
    price: 2500,
    message: "Encantados de trabajar con vosotros...",
    availability: true,
    validUntil: "2025-02-15",
    attachments: ["presupuesto.pdf"]
  }
}
```

---

## 🎯 BENEFICIOS DEL SISTEMA

### **Para el Usuario:**

✅ **No escribir lo obvio:** Info automática desde WeddingContext  
✅ **Guiado inteligente:** Solo preguntas relevantes  
✅ **Rápido:** 2-3 minutos por presupuesto  
✅ **Reutilizable:** Mismos datos para múltiples proveedores  
✅ **Comparación:** Todos los presupuestos en un lugar

### **Para el Proveedor:**

✅ **Info completa:** Todo lo necesario para presupuestar  
✅ **Profesional:** Solicitud estructurada  
✅ **Contexto:** Sabe qué busca el cliente  
✅ **Respuesta fácil:** Botón directo en email

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear QUOTE_FORM_TEMPLATES para top 5 categorías
- [ ] Hook useWeddingBasicInfo() para info automática
- [ ] Componente DynamicField para campos adaptables
- [ ] Lógica de visibilidad condicional (dependsOn)
- [ ] Cálculo de progreso del formulario
- [ ] Validaciones contextuales
- [ ] Sistema de pre-rellenado
- [ ] Envío de email al proveedor
- [ ] Almacenamiento en Firestore
- [ ] UI de seguimiento de presupuestos
- [ ] Notificaciones de respuestas

---

## 🤔 SIGUIENTE PASO

**¿Qué prefieres implementar primero?**

**Opción A: MVP Rápido**

- Formulario básico con 3-4 campos genéricos
- Info automática de la boda
- Envío por email
- 1 día de desarrollo

**Opción B: Sistema Inteligente Completo**

- Templates específicos por categoría
- Pre-rellenado y sugerencias
- Validaciones contextuales
- 3-5 días de desarrollo

**Mi recomendación:** Empezar con Opción A para que funcione YA, y luego iterar a Opción B.

---

¿Qué opción prefieres? O te ayudo a diseñar otra variante?
