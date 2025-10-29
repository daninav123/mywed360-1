# 🔍 INVESTIGACIÓN: Google Places API para Proveedores de Bodas

## 📊 VERIFICACIÓN DE COBERTURA

### ✅ **NEGOCIOS QUE SÍ ESTÁN EN GOOGLE MAPS**

#### 1. **Locales físicos (Tiendas, estudios, oficinas)**

- ✅ Estudios de fotografía de bodas
- ✅ Tiendas de vestidos de novia
- ✅ Salones de belleza / Peluquerías para novias
- ✅ Floristerías especializadas en bodas
- ✅ Pastelerías / Tiendas de tartas de boda
- ✅ Restaurantes / Salones de banquetes
- ✅ Hoteles con salones para eventos
- ✅ Joyerías (anillos de boda)

**Ejemplo encontrado:**

- **Va de Novias** - Fotografía de Bodas en Valencia
  - Dirección: Carrer de Ponent, 2, Valencia
  - ⭐ Rating visible en Google Maps
  - ✅ Tiene perfil verificado

#### 2. **Servicios móviles CON oficina/local**

- ✅ Agencias de wedding planning con oficina
- ✅ Empresas de catering con local
- ✅ Empresas de DJ/música con sede física

**Ejemplo encontrado:**

- **Valmúsica** - Orquestas y grupos para bodas
  - Dirección: Av. Vicente Blasco Ibáñez, 8, Alboraya (Valencia)
  - Teléfono: Visible en web
  - ⭐ Empresa establecida con local

---

### ❌ **NEGOCIOS QUE PUEDEN NO ESTAR EN GOOGLE MAPS**

#### 1. **Freelancers sin local físico**

- ❌ DJ independientes que trabajan desde casa
- ❌ Fotógrafos freelance sin estudio
- ❌ Wedding planners independientes sin oficina
- ❌ Músicos individuales / bandas pequeñas

#### 2. **Servicios temporales o informales**

- ❌ Grupos de música que solo tocan en eventos
- ❌ Proveedores "amateurs" o de medio tiempo
- ❌ Nuevos emprendedores sin presencia establecida

---

## 📊 ANÁLISIS DE COBERTURA POR CATEGORÍA

### 🎯 **Alta cobertura en Google Places (>80%)**

| Categoría              | Cobertura estimada | Razón                    |
| ---------------------- | ------------------ | ------------------------ |
| 🍰 Pastelerías bodas   | 90%                | Local físico obligatorio |
| 🏨 Salones banquetes   | 95%                | Negocio establecido      |
| 💐 Floristerías        | 85%                | Tienda física            |
| 💍 Joyerías            | 90%                | Local comercial          |
| 👗 Tiendas vestidos    | 85%                | Tienda física            |
| 💇 Peluquerías/Belleza | 90%                | Salón físico             |

### 🎯 **Media cobertura en Google Places (40-60%)**

| Categoría             | Cobertura estimada | Razón                       |
| --------------------- | ------------------ | --------------------------- |
| 📸 Fotógrafos bodas   | 50%                | Muchos freelance sin local  |
| 🎥 Videógrafos        | 45%                | Similar a fotógrafos        |
| 🎵 DJ bodas           | 40%                | Muchos independientes       |
| 🎪 Decoración eventos | 55%                | Mix de empresas y freelance |
| 🍽️ Catering           | 60%                | Empresas medianas-grandes   |

### 🎯 **Baja cobertura en Google Places (20-40%)**

| Categoría            | Cobertura estimada | Razón                          |
| -------------------- | ------------------ | ------------------------------ |
| 👰 Wedding planners  | 30%                | Muchos freelance               |
| 🎼 Músicos en vivo   | 25%                | Grupos pequeños sin oficina    |
| 🎤 Cantantes bodas   | 20%                | Mayormente freelance           |
| 🚗 Transporte novios | 35%                | Mix de empresas y particulares |

---

## 💡 **CONCLUSIONES**

### ✅ **Google Places API es BUENA para:**

1. Proveedores con **local físico establecido**
2. **Empresas medianas/grandes** con presencia comercial
3. Servicios que **requieren instalaciones** (salones, restaurantes, tiendas)
4. Negocios que han estado **operando por años**

### ❌ **Google Places API es LIMITADA para:**

1. **Freelancers** y trabajadores independientes
2. **Nuevos emprendedores** sin local
3. Servicios completamente **móviles** (DJ, músicos, fotógrafos sin estudio)
4. Proveedores "**informales**" o de medio tiempo

---

## 🎯 **RECOMENDACIÓN FINAL**

### **Estrategia Híbrida Optimizada:**

```
PASO 1: FIRESTORE (BD propia)
├─ Proveedores registrados
├─ Verificados por nosotros
└─ Contacto garantizado ✅

PASO 2: GOOGLE PLACES API (si < 5 resultados)
├─ Solo para categorías de "alta cobertura"
├─ Filtrar por rating > 4.0
└─ Garantiza: teléfono, dirección, reviews ✅

PASO 3: TAVILY (si < 10 resultados)
├─ Para categorías de "baja cobertura"
├─ Encuentra freelancers y nuevos emprendedores
└─ Más resultados pero menos verificados ⚠️
```

### **Decisión por categoría:**

```javascript
const useGooglePlaces = (category) => {
  const highCoverageCategories = [
    'salones-banquetes',
    'floristerias',
    'pasteleria',
    'joyeria',
    'vestidos-novia',
    'peluqueria',
    'hoteles',
    'restaurantes',
  ];

  const mediumCoverageCategories = ['fotografos', 'videografos', 'catering', 'decoracion'];

  // Usar Google Places solo para alta/media cobertura
  return highCoverageCategories.includes(category) || mediumCoverageCategories.includes(category);
};

const useTavily = (category) => {
  const lowCoverageCategories = ['wedding-planners', 'musicos', 'dj', 'cantantes'];

  // Usar Tavily para baja cobertura y freelancers
  return lowCoverageCategories.includes(category);
};
```

---

## 💰 **ANÁLISIS DE COSTES**

### **Google Places API**

- **Precio:** $17 USD / 1000 búsquedas
- **Cálculo mensual:**
  - 100 usuarios × 20 búsquedas/mes = 2000 búsquedas
  - Coste: ~$34 USD/mes (~€32/mes)

### **Tavily API**

- **Precio actual:** Ya lo tienes
- **Ventaja:** Incluido

### **Estrategia combinada (RECOMENDADA)**

- Google Places: ~1000 búsquedas/mes = $17 USD/mes (~€16/mes)
- Tavily: ~1000 búsquedas/mes = Gratis (plan actual)
- **Total:** ~€16/mes 💰

---

## 🚀 **PRÓXIMOS PASOS**

1. ✅ **Verificar tu caso de uso específico**
   - ¿Qué categorías de proveedores son más importantes?
   - ¿Cuántas búsquedas esperás por mes?

2. ✅ **Probar Google Places API**
   - Crear proyecto en Google Cloud
   - Hacer pruebas con 10-20 búsquedas
   - Verificar calidad de resultados

3. ✅ **Implementar estrategia híbrida**
   - FIRESTORE → GOOGLE PLACES → TAVILY
   - Monitorizar qué fuente da mejores resultados

---

## 📝 **NOTAS ADICIONALES**

- **Google Places** devuelve datos **estructurados y verificados**
- **Tavily** es mejor para encontrar **nuevos proveedores** y freelancers
- La **combinación** de ambos maximiza cobertura y calidad
- **Coste razonable** (~€16/mes) para la calidad que ofrece
