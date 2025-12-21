# 🤖 Feature Futuro: IA Extrae Planes de Pago desde Emails

## **Visión General**

Sistema de IA que analiza automáticamente los emails de proveedores para extraer condiciones de pago y crear el plan de pagos automáticamente.

---

## **🎯 Flujo Automático vs Manual**

### **ACTUAL (Manual)**
```
1. Usuario recibe email del proveedor
2. Lee condiciones de pago manualmente
3. Va a Proveedores → Edita proveedor
4. Click "Definir plan de pagos"
5. Introduce cada cuota manualmente
6. Guarda
```

### **FUTURO (Automático con IA)**
```
1. Usuario recibe email del proveedor
2. IA detecta email con condiciones de pago
3. IA extrae automáticamente:
   - Porcentajes (25%, 50%, 25%)
   - Montos (2,500€, 5,000€, 2,500€)
   - Fechas ("al firmar", "30 días antes", "día de la boda")
4. Sistema crea plan de pagos automáticamente
5. Usuario recibe notificación: "✨ Plan de pagos creado para Catering Deluxe"
6. Usuario revisa y confirma (o edita si necesita ajustes)
```

---

## **📧 Ejemplos de Emails que IA Puede Procesar**

### **Ejemplo 1: Plan Estándar**
```
Asunto: Confirmación Catering - 15 julio 2025

Condiciones de pago:
- 25% (2,500€) al firmar el contrato
- 50% (5,000€) 30 días antes del evento  
- 25% (2,500€) el día del evento

Total: 10,000€
```

**IA extrae y crea:**
- Cuota 1: 25% (2,500€) - "Al firmar contrato" - Fecha manual
- Cuota 2: 50% (5,000€) - "30 días antes" - Calculado: 15 jun 2025
- Cuota 3: 25% (2,500€) - "Día del evento" - 15 jul 2025

### **Ejemplo 2: Fechas Específicas**
```
Forma de pago:
- 3,000€ antes del 15/01/2025
- 6,000€ antes del 01/06/2025
- 1,000€ el día de la boda
```

**IA extrae y crea:**
- Cuota 1: 3,000€ (30%) - 15 ene 2025
- Cuota 2: 6,000€ (60%) - 01 jun 2025  
- Cuota 3: 1,000€ (10%) - 15 jul 2025

### **Ejemplo 3: Lenguaje Natural**
```
Para reservar tu fecha necesitamos:
- Un primer pago del 20% ahora
- Otro 40% tres meses antes
- Y el resto el día de tu boda
```

**IA extrae y crea:**
- Cuota 1: 20% - "Reserva" - Hoy
- Cuota 2: 40% - "Tres meses antes" - 15 abr 2025
- Cuota 3: 40% - "Día de la boda" - 15 jul 2025

---

## **🛠️ Implementación Técnica**

### **Stack Tecnológico**

**IA/LLM:**
- OpenAI GPT-4 para extracción de información
- Prompts especializados en análisis de condiciones de pago
- Validación con múltiples passes

**Email Processing:**
- Integración con Gmail API / Outlook API
- Webhooks para emails nuevos
- Clasificación automática (¿es un email de proveedor?)

**Backend:**
- Cloud Function para procesar emails
- Firestore para almacenar extracciones
- Cola de revisión humana para casos ambiguos

### **Prompt de IA (Ejemplo)**

```
Eres un experto extrayendo condiciones de pago de emails de proveedores de bodas.

CONTEXTO:
- Fecha de la boda: {weddingDate}
- Proveedor: {providerName}
- Servicio: {service}

EMAIL:
{emailContent}

EXTRAE:
1. Total del servicio
2. Cada cuota de pago con:
   - Porcentaje o monto
   - Descripción
   - Fecha (específica o relativa a la boda)
   - Trigger (qué evento dispara el pago)

FORMATO JSON:
{
  "totalAmount": number,
  "paymentSchedule": [
    {
      "percentage": number,
      "amount": number,
      "description": string,
      "dueDate": "YYYY-MM-DD" | null,
      "daysBeforeWedding": number | null,
      "trigger": "contract_signature" | "date_specific" | "date_relative" | "wedding_day"
    }
  ],
  "confidence": number (0-100)
}

REGLAS:
- Si suma porcentajes != 100%, marca confidence bajo
- Si hay ambigüedad en fechas, marca para revisión
- Convierte lenguaje natural a estructurado
```

### **Flujo de Procesamiento**

```
1. EMAIL RECIBIDO
   ↓
2. CLASIFICACIÓN
   ¿Es de un proveedor? ¿Tiene condiciones de pago?
   ↓
3. EXTRACCIÓN (IA)
   - Parsear con GPT-4
   - Extraer estructura JSON
   - Calcular fechas relativas
   ↓
4. VALIDACIÓN
   - ¿Suma 100%?
   - ¿Fechas coherentes?
   - ¿Confidence > 80%?
   ↓
5A. ALTA CONFIANZA (>80%)
    → Crear plan automáticamente
    → Notificar usuario
    → Permitir edición
    
5B. BAJA CONFIANZA (<80%)
    → Guardar en "Pendiente revisión"
    → Notificar usuario
    → Pedir confirmación manual
```

---

## **🎨 UI/UX Propuesta**

### **Notificación de Plan Creado**

```
┌─────────────────────────────────────┐
│ ✨ Plan de pagos creado             │
│                                     │
│ Catering Deluxe                     │
│ 3 cuotas • 10,000€ total            │
│                                     │
│ [Ver Plan]  [Editar]  [Descartar]  │
└─────────────────────────────────────┘
```

### **Cola de Revisión**

```
┌─────────────────────────────────────┐
│ 📋 Planes pendientes de revisión    │
├─────────────────────────────────────┤
│ Fotógrafo Ana Lens                  │
│ Confianza: 75%                      │
│ Posible problema: Fechas ambiguas  │
│ [Revisar]                           │
├─────────────────────────────────────┤
│ DJ Sonido Pro                       │
│ Confianza: 65%                      │
│ Posible problema: Suma != 100%     │
│ [Revisar]                           │
└─────────────────────────────────────┘
```

### **Modal de Revisión**

```
┌─────────────────────────────────────┐
│ Revisar plan extraído               │
├─────────────────────────────────────┤
│ EMAIL ORIGINAL:                     │
│ "30% al reservar, 70% un mes antes" │
│                                     │
│ PLAN EXTRAÍDO:                      │
│ ✓ Cuota 1: 30% (3,000€)            │
│   ↳ Fecha: [15/01/2025] ✏️         │
│ ✓ Cuota 2: 70% (7,000€)            │
│   ↳ Fecha: [15/06/2025] ✏️         │
│                                     │
│ Total: 10,000€ ✓                    │
│                                     │
│ [✓ Aprobar]  [✏️ Editar]  [✗ Rechazar] │
└─────────────────────────────────────┘
```

---

## **🚀 Roadmap de Implementación**

### **Fase 1: Prototipo (2-3 semanas)**
- [ ] Integrar OpenAI API
- [ ] Crear prompts de extracción
- [ ] Procesar emails de prueba manualmente
- [ ] Validar accuracy (objetivo: >85%)

### **Fase 2: MVP (4-6 semanas)**
- [ ] Integrar Gmail API
- [ ] Sistema de webhooks para emails nuevos
- [ ] UI de notificaciones
- [ ] Cola de revisión manual

### **Fase 3: Refinamiento (2-4 semanas)**
- [ ] Aprendizaje de patrones comunes
- [ ] Mejora de prompts con ejemplos reales
- [ ] Soporte para múltiples idiomas
- [ ] Detección de cambios en condiciones

### **Fase 4: Automatización Completa (4-6 semanas)**
- [ ] Auto-aprobación para alta confianza
- [ ] Integración con calendario
- [ ] Recordatorios automáticos
- [ ] Reportes de accuracy

---

## **💰 Casos Especiales a Manejar**

### **Caso 1: Descuentos**
```
"10% descuento si pagas todo antes de marzo"
```
→ IA crea dos opciones de plan para que usuario elija

### **Caso 2: Condiciones Variables**
```
"20% reserva, resto según avance del trabajo"
```
→ Marcar para revisión + permitir cuotas variables

### **Caso 3: Moneda Extranjera**
```
"$1,000 deposit, $4,000 one month before"
```
→ Detectar moneda + convertir a EUR

### **Caso 4: Penalizaciones**
```
"Si cancelas con menos de 3 meses: pierdes el 50%"
```
→ Extraer como nota/advertencia en el plan

---

## **📊 Métricas de Éxito**

**KPIs:**
- **Accuracy**: >85% de planes extraídos correctamente
- **Coverage**: >70% de emails procesables automáticamente  
- **Time saved**: Reducir de 5 min → 30 seg por plan
- **User satisfaction**: >4.5/5 en feedback

**Monitoreo:**
- % de planes aprobados sin edición
- % de planes rechazados
- Tiempo promedio de revisión
- Patrones comunes de error

---

## **🔒 Consideraciones de Privacidad**

1. **Consentimiento explícito** para leer emails
2. **Procesamiento local** cuando sea posible
3. **Encriptación** de emails en tránsito
4. **No almacenar** contenido completo de emails
5. **Cumplir GDPR** - derecho a borrar datos

---

## **🎓 Aprendizaje Continuo**

El sistema mejora con el uso:

```
Ciclo de mejora:
1. IA extrae plan
2. Usuario aprueba/edita/rechaza
3. Sistema aprende del feedback
4. Prompts se refinan automáticamente
5. Accuracy mejora con el tiempo
```

**Ejemplos de aprendizaje:**
- Si "reserva" siempre requiere fecha manual → Ajustar prompt
- Si "30 días antes" a veces significa 1 mes → Detectar ambigüedad
- Si ciertos proveedores usan formato específico → Crear reglas

---

## **🔮 Futuro Avanzado**

### **IA Proactiva**
```
IA detecta: "El proveedor cambió las condiciones de pago"
→ Notifica al usuario
→ Sugiere actualizar plan
```

### **Negociación Asistida**
```
IA sugiere: "Otros proveedores similares ofrecen 50-50, 
podrías negociar mejores condiciones"
```

### **Predicción de Problemas**
```
IA alerta: "Con este plan de pagos, te quedarás sin 
saldo el 1 de junio. ¿Quieres ajustar fechas?"
```

---

## **📝 Resumen Ejecutivo**

**Problema:** Entrada manual de planes de pago es tediosa y propensa a errores

**Solución:** IA lee emails de proveedores y crea planes automáticamente

**Beneficios:**
- ⏱️ Ahorra 5 minutos por proveedor
- ✅ Reduce errores de transcripción  
- 🚀 Mejora experiencia de usuario
- 📊 Datos más completos y actualizados

**Inversión estimada:** 8-12 semanas de desarrollo

**ROI:** Alta - Feature diferenciador que mejora retención

---

**Estado:** 💡 **Propuesta / Diseño**  
**Prioridad:** 🔶 **Media-Alta**  
**Dependencias:** Sistema de pagos programados (✅ Completado)
