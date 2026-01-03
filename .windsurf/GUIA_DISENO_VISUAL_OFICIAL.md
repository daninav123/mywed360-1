# 🎨 GUÍA DE DISEÑO OFICIAL – APP DE BODAS

> **Este documento es la referencia visual y de experiencia definitiva del proyecto.**
> Cualquier desarrollo (UI, UX, componentes, pantallas, animaciones) debe seguir **estrictamente** estas directrices.

---

## 1. VISIÓN Y OBJETIVO DEL DISEÑO

**Objetivo principal:**
Crear una app de bodas que transmita **calma, ilusión y control**, evitando el estrés típico de la planificación.

La app **NO debe parecer**:
* Una app corporativa
* Una app técnica
* Una app de bodas clásica/cursi

La app **SÍ debe sentirse**:
* Emocional pero moderna
* Minimalista
* Elegante
* Muy fácil de usar

**Conceptos clave (keywords):**
* Pastel
* Calm UI
* Minimal wedding
* Emotional but functional
* Elegant simplicity

---

## 2. PALETA DE COLORES (FIJA Y CERRADA)

```txt
Color fondo principal:      #FFF7CC  (Lemon Cream)
Superficies / tarjetas:    #FFFFFF
Texto principal:           #2E2E2E
Texto secundario:           #6B6B6B
Color acento principal:    #8FAF9A  (Verde salvia)
Color acento alternativo:  #B6A6CA  (Lavanda suave – uso puntual)
Sombras:                   rgba(0,0,0,0.06)
```

### Reglas obligatorias:
* ❗ **Nunca usar más de un color acento por pantalla**
* ❗ Evitar negro puro (#000000)
* ❗ Evitar colores saturados

---

## 3. SISTEMA TIPOGRÁFICO

### 3.1 Tipografía emocional (uso limitado)

Opciones permitidas:
* Playfair Display
* Cormorant
* Libre Baskerville

**Uso EXCLUSIVO en:**
* Títulos principales emocionales
* Pantalla de bienvenida
* Frases inspiracionales

Ejemplos válidos:
* "Tu boda"
* "El gran día"
* "Vamos paso a paso"

❌ **NO usar en:**
* Texto largo
* Formularios
* Botones
* Listados

---

### 3.2 Tipografía funcional (principal)

Opciones permitidas:
* Inter
* DM Sans

**Uso mayoritario en toda la app:**
* Textos
* Botones
* Formularios
* Listas
* Fechas, precios, tareas

---

### 3.3 Jerarquía tipográfica

```txt
H1 (emocional):
- Playfair / Cormorant
- 32–36px
- Peso 500–600

H2 / H3:
- Inter / DM Sans
- 20–24px
- Peso 600

Texto normal:
- Inter / DM Sans
- 14–16px
- Peso 400

Texto secundario:
- Inter / DM Sans
- 13–14px
- Color #6B6B6B
```

---

## 4. LAYOUT Y ESTRUCTURA VISUAL

### 4.1 Fondo
* Siempre color **#FFF7CC**
* Nunca degradados

### 4.2 Tarjetas (Cards)

```txt
Background: #FFFFFF
Border-radius: 20–24px
Padding: 16–24px
Shadow: 0 6px 20px rgba(0,0,0,0.06)
```

Reglas:
* ❗ Nunca usar bordes duros
* ❗ Separación clara entre tarjetas

---

## 5. BOTONES

### Botón primario

```txt
Background: color acento
Texto: blanco
Border-radius: 999px (pill)
Altura mínima: 48px
```

### Botón secundario

```txt
Background: transparente
Texto: color acento
Sin borde visible
```

Reglas:
* Un solo botón primario por vista
* Botones claros y no agresivos

---

## 6. ICONOGRAFÍA

Estilo obligatorio:
* Lineal
* Trazo fino
* Esquinas redondeadas
* Sin relleno

Bibliotecas recomendadas:
* Lucide
* Feather

Reglas:
* Color #6B6B6B o color acento
* Nunca negro puro
* Tamaño consistente

---

## 7. ANIMACIONES Y TRANSICIONES

```txt
Entrada de pantallas:
- Fade + slide vertical (8–12px)
- Duración: 200–300ms
- Ease-out

Interacciones:
- Micro feedback
- Sin rebotes exagerados
```

Sensación buscada:
> La app respira, no baila

---

## 8. TONO DE TEXTO (COPY)

Estilo:
* Cercano
* Tranquilo
* Positivo

Ejemplos:
* "Vamos poco a poco 💛"
* "Todo está bajo control"
* "Un paso más hacia vuestro día"

❌ Evitar lenguaje técnico

---

## 9. PRINCIPIOS CLAVE (RESUMEN)

* Menos es más
* Priorizar calma sobre impacto
* Diseño emocional + funcional
* Elegancia sin cursilería
* Coherencia absoluta en toda la app

---

## 10. IMPLEMENTACIÓN EN CÓDIGO

### 10.1 Variables CSS recomendadas

```css
:root {
  /* Colores principales */
  --bg-primary: #FFF7CC;
  --bg-surface: #FFFFFF;
  --text-primary: #2E2E2E;
  --text-secondary: #6B6B6B;
  --accent-primary: #8FAF9A;
  --accent-alternative: #B6A6CA;
  --shadow-soft: rgba(0, 0, 0, 0.06);
  
  /* Tipografía */
  --font-emotional: 'Playfair Display', serif;
  --font-functional: 'Inter', sans-serif;
  
  /* Espaciado */
  --card-radius: 20px;
  --button-radius: 999px;
  --card-padding: 24px;
  
  /* Sombras */
  --shadow-card: 0 6px 20px var(--shadow-soft);
}
```

### 10.2 Clases de componentes base

```css
/* Card base */
.calm-card {
  background: var(--bg-surface);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--shadow-card);
}

/* Botón primario */
.calm-btn-primary {
  background: var(--accent-primary);
  color: white;
  border-radius: var(--button-radius);
  min-height: 48px;
  border: none;
  font-family: var(--font-functional);
  font-weight: 600;
  transition: all 200ms ease-out;
}

/* Botón secundario */
.calm-btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  border: none;
  font-family: var(--font-functional);
  font-weight: 600;
}

/* Título emocional */
.calm-title-emotional {
  font-family: var(--font-emotional);
  font-size: 32px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Texto funcional */
.calm-text {
  font-family: var(--font-functional);
  font-size: 16px;
  color: var(--text-primary);
}

/* Texto secundario */
.calm-text-secondary {
  font-family: var(--font-functional);
  font-size: 14px;
  color: var(--text-secondary);
}
```

### 10.3 Animaciones base

```css
@keyframes calmEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.calm-enter {
  animation: calmEnter 300ms ease-out;
}
```

---

## 11. PÁGINAS CANDIDATAS PARA PRUEBA PILOTO

### Recomendación de páginas para probar el nuevo estilo:

1. **Dashboard principal** - Alta visibilidad, impacto inmediato
2. **Listado de invitados** - Permite probar tarjetas, botones y listados
3. **Formulario de nuevo evento** - Prueba de formularios y campos
4. **Página de bienvenida/onboarding** - Ideal para tipografía emocional

### Página más recomendada:
**Listado de invitados** - Combina todos los elementos (tarjetas, botones, iconos, tipografía funcional) sin requerir tipografía emocional compleja.

---

## 12. CHECKLIST DE IMPLEMENTACIÓN

Antes de considerar una página como "migrada al nuevo estilo", verificar:

- [ ] Fondo cambiado a #FFF7CC
- [ ] Tarjetas con border-radius 20px y sombra suave
- [ ] Botones pill (border-radius 999px)
- [ ] Tipografía funcional (Inter/DM Sans) en textos
- [ ] Tipografía emocional SOLO en títulos principales (si aplica)
- [ ] Iconos lineales y finos
- [ ] Colores de texto (#2E2E2E y #6B6B6B)
- [ ] Un solo color acento por vista
- [ ] Animaciones suaves (200-300ms ease-out)
- [ ] Sin bordes duros ni colores saturados

---

## 13. PROMPT PARA WINDSURF (COPY DIRECTO)

> Diseñar una app de bodas minimalista, elegante y emocional.
> Fondo Lemon Cream (#FFF7CC), tarjetas blancas flotantes con sombras suaves.
> Tipografía decorativa solo en títulos emocionales puntuales.
> Tipografía funcional para todo el contenido principal.
> Iconos lineales finos, bordes redondeados, animaciones suaves.
> Sensación de calma, control y experiencia premium.

---

**Fecha de creación:** 15 de diciembre de 2025
**Estado:** Pendiente de prueba piloto en página específica
