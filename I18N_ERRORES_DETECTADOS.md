# 🔍 i18n - Errores Detectados y Plan de Corrección

**Fecha:** 29 diciembre 2024  
**Estado:** 🔴 CRÍTICO - Múltiples páginas con textos hardcodeados

---

## 📊 Resumen de Problemas Encontrados

### Páginas con Textos Hardcodeados (Top 20)

1. **InfoBoda.jsx** - 36+ placeholders en español
2. **AdminDiscounts.jsx** - 15+ textos sin traducir
3. **GestionNinos.jsx** - 8+ textos hardcodeados
4. **PostBoda.jsx** - 8+ constantes sin i18n
5. **TransporteLogistica.jsx** - 8+ textos sin traducir
6. **DiaDeBoda.jsx** - 6+ textos hardcodeados
7. **WebEditor.jsx** - 6+ placeholders
8. **AyudaCeremonia.jsx** - 6+ textos
9. **AdminAITraining.jsx** - 5+ textos
10. **Contratos.jsx** - 5+ textos
11. **InvitadosEspeciales.jsx** - 5+ textos
12. **EventosRelacionados.jsx** - 4+ textos
13. **PublicQuoteResponse.jsx** - 4+ textos
14. **PublicRSVP.jsx** - 4+ textos
15. **WeddingTeam.jsx** - 4+ textos
16. **CreateWeddingAI.jsx** - 3+ textos
17. **Ideas.jsx** - 3+ textos
18. **PruebasEnsayos.jsx** - 3+ textos
19. **AdminTaskTemplates.jsx** - 3+ textos
20. **Checklist.jsx** - 2+ textos

---

## 🔴 Problemas Críticos Identificados

### 1. Placeholders Hardcodeados

**Ejemplos en InfoBoda.jsx:**
```javascript
placeholder="Cuéntanos vuestra historia..."
placeholder="Lo que realmente importa para vosotros..."
placeholder="Elementos imprescindibles..."
placeholder="Cosas que preferís evitar..."
placeholder="¿Qué queréis que permanezca en vuestra memoria?"
placeholder="Ejemplo: Ana & Carlos"
placeholder="Ej: Finca El Campillo, Hotel Gran Vía"
placeholder="Calle Mayor, 1, Valencia"
```

**Debe ser:**
```javascript
placeholder={t('infoBoda.placeholders.tellStory')}
placeholder={t('infoBoda.placeholders.whatMatters')}
placeholder={t('infoBoda.placeholders.mustHave')}
placeholder={t('infoBoda.placeholders.mustNotHave')}
placeholder={t('infoBoda.placeholders.remember10Years')}
placeholder={t('infoBoda.placeholders.coupleNameExample')}
placeholder={t('infoBoda.placeholders.venueName')}
placeholder={t('infoBoda.placeholders.address')}
```

### 2. Constantes Sin i18n

**Ejemplos en PostBoda.jsx:**
```javascript
const CATEGORIAS_AGRADECIMIENTOS = [
  { id: 'invitados', nombre: 'Invitados', icon: '👥' },
  { id: 'familia', nombre: 'Familia cercana', icon: '👨‍👩‍👧‍👦' },
  { id: 'padrinos', nombre: 'Padrinos y testigos', icon: '👑' },
];
```

**Debe ser:**
```javascript
const CATEGORIAS_AGRADECIMIENTOS = (t) => [
  { id: 'invitados', nombre: t('postBoda.categories.guests'), icon: '👥' },
  { id: 'familia', nombre: t('postBoda.categories.closeFamily'), icon: '👨‍👩‍👧‍👦' },
  { id: 'padrinos', nombre: t('postBoda.categories.godparents'), icon: '👑' },
];
```

### 3. Labels Sin Traducir

**Ejemplos encontrados:**
```javascript
label="Nombre completo"
label="Dirección completa"
label="Teléfono"
title="Guardar cambios"
```

**Debe ser:**
```javascript
label={t('common.labels.fullName')}
label={t('common.labels.fullAddress')}
label={t('common.labels.phone')}
title={t('common.actions.saveChanges')}
```

---

## 📋 Plan de Corrección

### Fase 1: Páginas Críticas (Alta Prioridad)
- [ ] InfoBoda.jsx (36+ correcciones)
- [ ] AdminDiscounts.jsx (15+ correcciones)
- [ ] GestionNinos.jsx (8+ correcciones)
- [ ] PostBoda.jsx (8+ correcciones)
- [ ] TransporteLogistica.jsx (8+ correcciones)

### Fase 2: Páginas Importantes (Media Prioridad)
- [ ] DiaDeBoda.jsx
- [ ] WebEditor.jsx
- [ ] Contratos.jsx
- [ ] InvitadosEspeciales.jsx
- [ ] EventosRelacionados.jsx

### Fase 3: Páginas Secundarias (Baja Prioridad)
- [ ] Resto de páginas detectadas

---

## 🎯 Patrón de Corrección

### Antes:
```javascript
<Input 
  label="Nombre de pareja"
  placeholder="Ejemplo: Ana & Carlos"
  value={data.coupleName}
/>
```

### Después:
```javascript
<Input 
  label={t('infoBoda.labels.coupleName')}
  placeholder={t('infoBoda.placeholders.coupleNameExample')}
  value={data.coupleName}
/>
```

---

## 📦 Archivos de Traducción Necesarios

Se necesitarán claves en:
- `en/pages.json` - Traducciones de páginas en inglés
- `es/pages.json` - Traducciones de páginas en español
- `en/common.json` - Labels y textos comunes en inglés
- `es/common.json` - Labels y textos comunes en español

---

## ✅ Criterios de Éxito

1. **100% de textos en i18n** - Ningún texto hardcodeado visible
2. **Inglés por defecto** - Todos los textos por defecto en inglés
3. **Español completo** - Todas las traducciones al español disponibles
4. **Consistencia** - Mismo patrón en todas las páginas
5. **Funcionalidad** - Cambio de idioma funciona perfectamente

---

**Estado Actual:** 🔴 PENDIENTE DE CORRECCIÓN  
**Páginas a Corregir:** 20+ identificadas  
**Textos a Corregir:** 200+ estimados
