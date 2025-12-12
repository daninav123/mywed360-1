# 👑 PROPUESTAS - MESA PRESIDENCIAL

**Fecha:** 2025-11-21 16:16 UTC+01:00  
**Objetivo:** Mejorar la gestión y visualización de la mesa presidencial

---

## 🔍 **SITUACIÓN ACTUAL**

### **Lo que ya existe:**

```javascript
// seatingTables.js
{
  id: 'imperial',
  label: 'Mesa imperial',
  shape: 'rectangle',
  defaults: {
    width: 320,  // 3.2 metros
    height: 100, // 1 metro
    seats: 12
  }
}
```

### **Cálculo de capacidad:**

- Lados: `Math.floor(width / 60cm) * 2`
- Cabeceras: `2` (si height >= 90cm)
- Total: Lados + cabeceras (mínimo 6)

### **Visualización:**

- Color: `#fca5a5` (rojo claro)
- Forma: Rectangular con bordes redondeados
- Etiqueta: Nombre personalizable
- Asientos: Puntos azules distribuidos en los lados

---

## 🎯 **PROPUESTAS DE MEJORA**

---

## 🔴 **PROPUESTA 1: Modo "Mesa Presidencial" Dedicado** ⭐

### **Problema:**

La mesa presidencial es especial en bodas pero se trata como cualquier otra mesa rectangular.

### **Solución:**

Un modo específico que:

1. **Marca visual especial:**

   ```jsx
   // Icono de corona en la mesa
   👑 Mesa Presidencial

   // Borde dorado/plateado
   border: '4px solid #fbbf24' // Dorado

   // Sombra más destacada
   boxShadow: '0 8px 20px rgba(251,191,36,0.5)'

   // Background gradient
   background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
   ```

2. **Propiedades especiales en sidebar:**

   ```jsx
   <Section title="👑 Mesa Presidencial">
     <Toggle label="Decoración especial" />
     <Select label="Estilo">
       - Imperial (rectangular larga) - En forma de U - En forma de T - Semicircular
     </Select>
     <Slider label="Elevación" hint="0-30cm sobre el resto" />
     <Toggle label="Mantel especial" />
   </Section>
   ```

3. **Auto-posicionamiento inteligente:**
   - Siempre en posición superior central
   - Orientada mirando al resto de mesas
   - Espacio extra delante (para pista de baile o área principal)

4. **Asignación VIP:**
   ```jsx
   <Section title="Invitados VIP">
     <List>- Novios (centro) 💑 - Padrinos - Padres - Testigos</List>
     <Button>Asignar automáticamente</Button>
   </Section>
   ```

**Tiempo:** 3-4 horas  
**Impacto:** ⭐⭐⭐⭐ Alto

---

## 🟡 **PROPUESTA 2: Generador de Layouts con Mesa Presidencial**

### **Problema:**

Al generar automáticamente, no se considera la importancia de la mesa presidencial.

### **Solución:**

1. **Wizard mejorado:**

   ```jsx
   <Step title="¿Tendrás mesa presidencial?">
     ✅ Sí, mesa tradicional (novios + padrinos) ✅ Sí, mesa amplia (incluye padres) ✅ Sí, mesa
     imperial (12+ personas) ❌ No, los novios se sientan con invitados
   </Step>
   ```

2. **Layouts específicos:**

   ```javascript
   // Layout "Imperial Clásico"
   {
     presidentialTable: {
       position: { x: centerX, y: 100 }, // Superior central
       width: 400,
       height: 120,
       seats: 14,
       vip: true,
       invitados: ['Novios', 'Padrinos', 'Padres']
     },

     guestTables: {
       arrangement: 'semicircle', // Semicírculo mirando a la mesa
       excludeZone: { // Zona libre delante de la presidencial
         x: centerX - 300,
         y: 100,
         width: 600,
         height: 200
       }
     }
   }
   ```

3. **Previsualización especial:**
   - SVG preview destacando la mesa presidencial en dorado
   - Indicación de pista de baile/área principal
   - Líneas de visión desde mesas hacia la presidencial

**Tiempo:** 2-3 horas  
**Impacto:** ⭐⭐⭐⭐ Alto

---

## 🟢 **PROPUESTA 3: Protocolo de Mesa Presidencial**

### **Problema:**

No hay ayuda sobre el protocolo tradicional de ubicación de invitados.

### **Solución:**

1. **Asistente de protocolo:**

   ```jsx
   <ProtocolAssistant table={presidentialTable}>
     <Title>👑 Protocolo de Mesa Presidencial</Title>

     <VisualGuide>
       {/* Vista desde arriba */}
       ┌─────────────────────────────────┐ │ 3 2 1 💑 1 2 3 │ ← Vista frontal │ Pad Mad Pad N+N Mad
       Pad │ │ Ella Ella Él Él Él │ └─────────────────────────────────┘ Posiciones: 1. Novios
       (centro) 💑 2. Madres (junto a novios) 3. Padres (junto a madres) 4. Padrinos 5. Testigos
     </VisualGuide>

     <AutoAssign>
       <Button>Asignar según protocolo tradicional</Button>
       <Button>Protocolo moderno (novios en el centro con amigos)</Button>
     </AutoAssign>

     <Tips>
       💡 Consejos: - Novios siempre en el centro - Madres junto a los novios (cruzadas) - Padres
       junto a las madres - Vista privilegiada hacia la pista
     </Tips>
   </ProtocolAssistant>
   ```

2. **Etiquetas de posición:**
   ```jsx
   // En los asientos de la mesa presidencial
   <SeatLabel position="center-left">
     💍 Novia
   </SeatLabel>
   <SeatLabel position="center-right">
     🤵 Novio
   </SeatLabel>
   ```

**Tiempo:** 2 horas  
**Impacto:** ⭐⭐⭐ Medio

---

## 🟢 **PROPUESTA 4: Formas Alternativas de Mesa Presidencial**

### **Problema:**

Solo hay forma rectangular, pero hay otras configuraciones populares.

### **Solución:**

1. **Nuevas formas:**

   ```javascript
   const PRESIDENTIAL_SHAPES = {
     rectangular: {
       label: 'Rectangular Clásica',
       icon: '▬',
       suitable: 'Salones tradicionales',
     },

     uShape: {
       label: 'En forma de U',
       icon: '⊃',
       suitable: 'Vista 360° de invitados',
       generate: (width) => ({
         // Mesa principal + 2 alas laterales
         tables: [
           { x: centerX, y: 100, width: 400, height: 100 }, // Centro
           { x: centerX - 250, y: 200, width: 200, height: 100, angle: 90 }, // Izq
           { x: centerX + 250, y: 200, width: 200, height: 100, angle: 90 }, // Der
         ],
       }),
     },

     tShape: {
       label: 'En forma de T',
       icon: '⊥',
       suitable: 'Espacios alargados',
       generate: (width) => ({
         tables: [
           { x: centerX, y: 100, width: 400, height: 100 }, // Horizontal
           { x: centerX, y: 250, width: 100, height: 300, angle: 90 }, // Vertical
         ],
       }),
     },

     semicircle: {
       label: 'Semicírculo',
       icon: '⌒',
       suitable: 'Vista panorámica',
       generate: (radius) => ({
         // Curva usando múltiples mesas rectangulares
         tables: generateSemicircleTables(centerX, 100, radius, 6),
       }),
     },

     elevated: {
       label: 'Escenario Elevado',
       icon: '▓',
       suitable: 'Salones grandes',
       properties: {
         platform: true,
         height: 30, // cm
         stairs: true,
         backdrop: true,
       },
     },
   };
   ```

2. **Selector visual:**
   ```jsx
   <ShapeSelector title="Forma de Mesa Presidencial">
     <Grid cols={3}>
       {PRESIDENTIAL_SHAPES.map((shape) => (
         <ShapeOption
           key={shape.id}
           icon={shape.icon}
           label={shape.label}
           preview={<SVGPreview shape={shape} />}
           hint={shape.suitable}
           onClick={() => applyPresidentialShape(shape)}
         />
       ))}
     </Grid>
   </ShapeSelector>
   ```

**Tiempo:** 4-5 horas  
**Impacto:** ⭐⭐⭐ Medio-Alto

---

## 🟢 **PROPUESTA 5: Decoración y Extras Visuales**

### **Problema:**

La mesa presidencial debe verse especial visualmente en el plan.

### **Solución:**

1. **Elementos decorativos:**

   ```jsx
   <PresidentialTableDecor table={presidentialTable}>
     {/* Mantel especial */}
     <Tablecloth color="#fbbf24" pattern="elegant" drapes={true} />

     {/* Arreglos florales */}
     <FloralArrangement position="center" size="large" icon="🌹" />

     {/* Telón de fondo */}
     <Backdrop type="floral-wall" width={450} height={250} position="behind" />

     {/* Iluminación especial */}
     <Lighting type="spotlight" intensity="high" icon="💡" />
   </PresidentialTableDecor>
   ```

2. **Vista 3D simplificada:**

   ```jsx
   // Toggle para ver en perspectiva
   <Toggle label="Vista 3D de mesa presidencial" onChange={setShow3D} />;

   {
     show3D && (
       <Preview3D>
         {/* Canvas con perspectiva isométrica */}
         <IsometricView
           table={presidentialTable}
           showPlatform={true}
           showBackdrop={true}
           showFlowers={true}
         />
       </Preview3D>
     );
   }
   ```

3. **Exportación especial:**
   ```jsx
   // En el PDF/PNG export
   - Mesa presidencial resaltada con marco dorado
   - Etiquetas de protocolo visibles
   - Leyenda especial: "👑 Mesa Presidencial"
   ```

**Tiempo:** 3 horas  
**Impacto:** ⭐⭐ Medio

---

## 🟢 **PROPUESTA 6: Smart Assistant para Mesa Presidencial**

### **Problema:**

No hay ayuda inteligente para decisiones sobre la mesa presidencial.

### **Solución:**

1. **Asistente IA:**

   ```jsx
   <PresidentialAssistant>
     <Question>
       "¿Cuántas personas estarán en la mesa presidencial?"
       <Input type="number" value={14} />
     </Question>

     <AISuggestion>
       💡 Para 14 personas, te recomendamos: ✅ Mesa rectangular de 4.8m x 1.2m ✅ Disposición: 7
       por lado ✅ Espacio: 68cm por persona (cómodo) O también: ✅ Mesa en U (6+4+4 personas) ✅
       Mejor visibilidad 360° ✅ Más interacción entre invitados
     </AISuggestion>

     <Validations>
       ⚠️ Advertencias: - Tu salón mide 12m de ancho - Mesa de 4.8m deja 3.6m a cada lado -
       Considera pasillo central de min 2m ✅ Todo correcto, hay espacio suficiente
     </Validations>
   </PresidentialAssistant>
   ```

2. **Cálculos automáticos:**
   - Espacio mínimo por persona (60cm estándar, 70cm VIP)
   - Proporción mesa/salón
   - Distancia óptima a primera fila de mesas
   - Área libre para fotografías

**Tiempo:** 2-3 horas (si se usa OpenAI API ya integrada)  
**Impacto:** ⭐⭐⭐ Medio-Alto

---

## 📊 **RESUMEN DE PROPUESTAS**

| #   | Propuesta                       | Tiempo | Impacto  | Prioridad |
| --- | ------------------------------- | ------ | -------- | --------- |
| 1   | Modo Mesa Presidencial Dedicado | 3-4h   | ⭐⭐⭐⭐ | 🔴 Alta   |
| 2   | Generador con Mesa Presidencial | 2-3h   | ⭐⭐⭐⭐ | 🔴 Alta   |
| 3   | Protocolo de Mesa Presidencial  | 2h     | ⭐⭐⭐   | 🟡 Media  |
| 4   | Formas Alternativas             | 4-5h   | ⭐⭐⭐   | 🟢 Baja   |
| 5   | Decoración y Extras Visuales    | 3h     | ⭐⭐     | 🟢 Baja   |
| 6   | Smart Assistant IA              | 2-3h   | ⭐⭐⭐   | 🟡 Media  |

**Total:** 16-20 horas para todo

---

## 🎯 **RECOMENDACIÓN: IMPLEMENTACIÓN POR FASES**

### **FASE 1 - Quick Win (5-7h)** 🔴

**Objetivo:** Mesa presidencial destacada y funcional

1. **Modo Mesa Presidencial Dedicado** (3-4h)
   - Marca visual especial (corona, dorado)
   - Toggle "Es mesa presidencial" en sidebar
   - Auto-posicionamiento superior central

2. **Generador con Mesa Presidencial** (2-3h)
   - Opción en wizard: "¿Tendrás mesa presidencial?"
   - Layout "Imperial Clásico" con mesa destacada
   - Área libre delante para pista/fotos

**Resultado:** Mesa presidencial se ve y gestiona de forma especial ✨

---

### **FASE 2 - Protocolo y UX (4h)** 🟡

3. **Protocolo de Mesa Presidencial** (2h)
   - Asistente visual de protocolo
   - Auto-asignación según tradición
   - Tips y consejos

4. **Smart Assistant IA** (2h)
   - Sugerencias de tamaño
   - Validaciones automáticas
   - Cálculos de espacio

**Resultado:** Ayuda profesional para organizar la mesa ✨

---

### **FASE 3 - Advanced (7-8h)** 🟢

4. **Formas Alternativas** (4-5h)
   - Formas: U, T, Semicírculo
   - Selector visual
   - Generadores automáticos

5. **Decoración Visual** (3h)
   - Elementos decorativos
   - Vista 3D simple
   - Export mejorado

**Resultado:** Máxima personalización y realismo ✨

---

## 💡 **MI RECOMENDACIÓN INMEDIATA**

### **Empezar con FASE 1 (5-7h):**

**Propuesta 1 + Propuesta 2**

**Por qué:**

- ✅ Máximo impacto visual inmediato
- ✅ Diferenciador clave vs competencia
- ✅ Mejora experiencia real de usuarios
- ✅ Base para todo lo demás
- ✅ Tiempo razonable (medio día)

**Funcionalidades concretas:**

```jsx
// 1. Toggle en LibraryPanel
<Button onClick={addPresidentialTable}>👑 Añadir Mesa Presidencial</Button>;

// 2. Identificación visual
{
  table.isPresidential && <Crown className="absolute top-2 right-2" size={20} color="#fbbf24" />;
}

// 3. Estilo especial
const tableColor = table.isPresidential
  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  : TABLE_TYPE_COLORS[tableType];

// 4. Sidebar mejorado
{
  table.isPresidential && (
    <Section title="👑 Mesa Presidencial">
      <Badge color="gold">VIP</Badge>
      <Toggle label="Auto-posicionar al centro superior" />
      <Slider label="Ancho" value={400} min={300} max={600} />
      <Button>Asignar novios y padrinos</Button>
    </Section>
  );
}

// 5. En generador automático
if (hasPresidentialTable) {
  tables.unshift({
    id: 'presidential-1',
    isPresidential: true,
    x: centerX,
    y: 100,
    width: 400,
    height: 120,
    seats: 14,
    displayName: '👑 Mesa Presidencial',
  });

  // Dejar espacio delante
  excludeZone = { x: centerX - 300, y: 100, width: 600, height: 200 };
}
```

---

## 🚀 **SIGUIENTE PASO**

**¿Qué te parece?**

Puedo empezar implementando la **FASE 1** (5-7h):

- Mesa presidencial con estilo especial
- Toggle "Es mesa presidencial"
- Generador automático que la incluye
- Auto-posicionamiento inteligente

**Resultado visual:**

```
┌─────────────────────────────────────────┐
│                                         │
│     ┌──────────────────────────┐       │
│     │  👑 MESA PRESIDENCIAL    │ ✨    │ ← Dorada, destacada
│     └──────────────────────────┘       │
│                                         │
│         [espacio libre]                 │ ← Pista de baile
│                                         │
│     ●      ●      ●      ●              │ ← Mesas normales
│       ●      ●      ●      ●            │
│                                         │
└─────────────────────────────────────────┘
```

**¿Empezamos con la Fase 1?** 👑✨
