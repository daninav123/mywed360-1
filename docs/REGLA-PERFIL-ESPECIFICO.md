# 🎯 Regla de Oro: Perfil Específico vs Página de Listado

> **Última actualización:** 2025-10-27  
> **Propósito:** Aclarar qué URLs son válidas para tarjetas de proveedores

---

## 📌 **Regla Principal:**

**"¿El enlace de la tarjeta me lleva DIRECTAMENTE al perfil/página de ESE proveedor específico?"**

- ✅ **SÍ** → Tarjeta válida
- ❌ **NO** (me muestra varios proveedores) → Tarjeta inválida

---

## ✅ **URLs VÁLIDAS:**

### **Se ACEPTAN directorios/plataformas SI llevan a UN perfil específico**

bodas.net, directorios, plataformas → **SÍ son válidos SI muestran 1 proveedor**

**Ejemplos correctos:**

```
✅ bodas.net/fotografia/delia-fotografos--e123456
   → Lleva al PERFIL de "Delia Fotógrafos"
   → Muestra SU portfolio, SUS precios, SU contacto
   → bodas.net actúa como plataforma, pero muestra 1 proveedor
   
✅ www.juanlopezfoto.com
   → Sitio web propio del fotógrafo
   → Muestra toda la información de Juan López
   
✅ www.instagram.com/estudiofotovalencia
   → Perfil específico en Instagram
   → Muestra las fotos y contacto del estudio
   
✅ www.proveedoresbodas.com/perfil/catering-martinez-12345
   → Perfil en otro directorio
   → Lleva al perfil de "Catering Martínez"
```

**Por qué son válidos:**
- Cada URL lleva a la información de **UN SOLO proveedor**
- El usuario ve el portfolio/servicios de **ESE proveedor específico**
- El usuario puede contactar directamente con **ESE proveedor**
- No hay confusión → 1 tarjeta = 1 proveedor

---

## ❌ **URLs INVÁLIDAS:**

### **Se DESCARTAN páginas que muestran VARIOS proveedores**

**Ejemplos incorrectos:**

```
❌ bodas.net/fotografia
   → Muestra LISTADO de TODOS los fotógrafos
   → El usuario debe elegir entre múltiples opciones
   → NO lleva directamente a un proveedor

❌ bodas.net/fotografos?ciudad=madrid
   → Página de BÚSQUEDA con resultados múltiples
   → El usuario ve 20-30 fotógrafos
   → NO es un perfil específico

❌ bodas.net/buscar?q=fotografo
   → Buscador interno
   → Muestra resultados de búsqueda
   → NO es un perfil individual

❌ www.proveedores.com/dj/valencia
   → Directorio de todos los DJs en Valencia
   → Lista múltiples opciones
   → NO es un perfil único

❌ bodas.net/catering/compara
   → Página de comparación
   → Muestra varios proveedores para comparar
   → NO es un perfil específico
```

**Por qué son inválidas:**
- Muestran **MÚLTIPLES proveedores** en la misma página
- El usuario NO sabe cuál elegir → confusión
- La tarjeta NO representa a un proveedor específico
- Rompe la regla: 1 tarjeta = 1 proveedor

---

## 🔍 **Cómo Validar una URL:**

### **Test mental rápido:**

1. **Imagina que haces clic en el enlace**
2. **¿Llegas directamente a la página de UN proveedor?**
   - SÍ → ✅ URL válida
   - NO → ❌ URL inválida

### **Preguntas de validación:**

| Pregunta | ✅ Válida | ❌ Inválida |
|----------|----------|------------|
| ¿Veo el portfolio de UN proveedor? | Sí | No, veo varios |
| ¿Puedo contactar directamente? | Sí | No, debo elegir primero |
| ¿La página habla de UN negocio? | Sí | No, lista varios |
| ¿Dice "Somos", "Nuestros servicios"? | Sí | No, dice "Encuentra", "Compara" |

---

## 🎯 **Ejemplos Prácticos:**

### **Caso 1: bodas.net**

```
Tarjeta: "Delia Fotógrafos - Valencia"
Link: bodas.net/fotografia/delia-fotografos--e123456

TEST:
1. Hago clic → ¿Llego a la página de Delia Fotógrafos?
   ✅ SÍ

2. ¿Veo SU portfolio, SUS precios, SU contacto?
   ✅ SÍ

3. ¿O veo una lista de 20 fotógrafos para elegir?
   ❌ NO

RESULTADO: ✅ URL VÁLIDA
RAZÓN: bodas.net muestra el PERFIL de Delia Fotógrafos, no un listado
```

```
Tarjeta: "Fotógrafos en Madrid"
Link: bodas.net/fotografia?ciudad=madrid

TEST:
1. Hago clic → ¿Llego a la página de un fotógrafo específico?
   ❌ NO

2. ¿Veo una lista de múltiples fotógrafos?
   ✅ SÍ

3. ¿Debo elegir entre varias opciones?
   ✅ SÍ

RESULTADO: ❌ URL INVÁLIDA
RAZÓN: bodas.net muestra un LISTADO de proveedores, no un perfil único
```

### **Caso 2: Sitio propio**

```
Tarjeta: "Juan López Fotografía"
Link: www.juanlopezfoto.com

TEST:
1. Hago clic → ¿Llego al sitio de Juan López?
   ✅ SÍ

2. ¿Todo el sitio habla de Juan López?
   ✅ SÍ

RESULTADO: ✅ URL VÁLIDA
RAZÓN: Sitio web propio = siempre perfil específico
```

---

## 🛠️ **Implementación Técnica:**

### **Filtros aplicados en el código:**

```javascript
// 1. DESCARTAR patrones de listado
const invalidPatterns = [
  '/buscar', '/search', '/resultados',
  '/directorio', '/listado', '/categoria',
  '?q=', '?search=', '?query='
];

// 2. VALIDAR bodas.net: Requiere ID numérico
if (url.includes('bodas.net')) {
  const hasId = /\/\d{5,}/.test(url);
  if (!hasId) {
    // ❌ bodas.net/fotografia → DESCARTAR
    return false;
  }
  // ✅ bodas.net/fotografia/nombre--e123 → ACEPTAR
}

// 3. VALIDAR último segmento: No debe ser categoría genérica
const lastSegment = url.split('/').pop();
if (['fotografia', 'video', 'catering'].includes(lastSegment)) {
  // ❌ proveedores.com/fotografia → DESCARTAR
  return false;
}
```

---

## 📝 **Resumen:**

### **✅ Lo que SÍ aceptamos:**

- **bodas.net** SI lleva a UN perfil con ID
- **Sitios propios** (siempre válidos)
- **Perfiles en redes sociales** (Instagram, Facebook)
- **Directorios** SI llevan a UN perfil específico
- Cualquier URL que muestre **UN SOLO proveedor**

### **❌ Lo que NO aceptamos:**

- **Páginas de listado** de múltiples proveedores
- **Buscadores** (aunque sean de bodas.net)
- **Categorías genéricas** sin proveedor específico
- **Comparadores** de múltiples opciones
- Cualquier URL que muestre **VARIOS proveedores**

---

## 🎓 **Lección Aprendida:**

**bodas.net NO es el problema**

El problema NO es la plataforma (bodas.net, directorios, etc.)

El problema ES si la URL lleva a:
- ❌ Una página de LISTADO (varios proveedores)
- ✅ Un PERFIL específico (un proveedor)

**bodas.net/fotografia** → ❌ Listado  
**bodas.net/fotografia/nombre--e123** → ✅ Perfil

---

**Regla final:**  
**1 Tarjeta = 1 Proveedor específico = 1 URL a SU perfil/página**

No importa si es bodas.net, sitio propio o Instagram.  
Lo que importa es que el enlace lleve **DIRECTAMENTE** a la información de **ESE proveedor**.
