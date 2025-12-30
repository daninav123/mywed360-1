# 🔧 i18n - Corrección en Progreso

**Fecha:** 29 diciembre 2024, 23:30  
**Estado:** 🟡 EN PROGRESO

---

## ✅ Correcciones Aplicadas

### InfoBoda.jsx - Parcial (5 ediciones aplicadas)

**Sección "Visión General":**
- ✅ Título y subtítulo convertidos a i18n
- ✅ "¿Cómo os conocisteis?" → `t('infoBoda.vision.howWeMet')`
- ✅ "¿Qué es lo más importante ese día?" → `t('infoBoda.vision.mostImportant')`
- ✅ "✅ SÍ queremos" → `t('infoBoda.vision.mustHave')`
- ✅ "❌ NO queremos" → `t('infoBoda.vision.mustNotHave')`
- ✅ "💫 ¿Qué recordaréis en 10 años?" → `t('infoBoda.vision.remember10Years')`
- ✅ Todos los placeholders convertidos a i18n

**Sección "Información Esencial":**
- ✅ Título y subtítulo convertidos a i18n
- ✅ "👫 Nombres de los dos" → `t('infoBoda.essential.coupleName')`
- ✅ "Fecha de la boda" → `t('infoBoda.essential.weddingDate')`
- ✅ "Número de invitados" → `t('infoBoda.essential.numGuests')`
- ✅ Placeholder "Ejemplo: Ana & Carlos" → `t('infoBoda.essential.coupleNamePlaceholder')`

---

## 🔄 Próximas Correcciones

### InfoBoda.jsx - Pendiente
- [ ] Sección "Ceremonia" (placeholders de lugares y direcciones)
- [ ] Sección "Banquete" (placeholders de lugares)
- [ ] Sección "Espacios" (placeholders y labels)
- [ ] Sección "Contactos de Emergencia" (labels)
- [ ] ~30+ placeholders más

### Otras Páginas Críticas
- [ ] PostBoda.jsx (constantes CATEGORIAS_AGRADECIMIENTOS, TIPOS_RECUERDO, etc.)
- [ ] DiaDeBoda.jsx (constantes MOMENTOS_DIA, CHECKLIST_DEFAULT)
- [ ] GestionNinos.jsx (labels y placeholders)
- [ ] TransporteLogistica.jsx (labels y opciones)

---

## 📦 Claves i18n Necesarias

### `/apps/main-app/src/i18n/locales/en/pages.json`

```json
{
  "infoBoda": {
    "vision": {
      "title": "General Vision",
      "subtitle": "The essence of your wedding",
      "howWeMet": "How did you meet?",
      "howWeMetPlaceholder": "Tell us your story...",
      "mostImportant": "What is most important that day?",
      "mostImportantPlaceholder": "What really matters to you...",
      "mustHave": "We DO want",
      "mustHavePlaceholder": "Essential elements...",
      "mustNotHave": "We DON'T want",
      "mustNotHavePlaceholder": "Things you prefer to avoid...",
      "remember10Years": "What will you remember in 10 years?",
      "remember10YearsPlaceholder": "What do you want to stay in your memory?"
    },
    "essential": {
      "title": "Essential Information",
      "subtitle": "The most important details of your wedding",
      "coupleName": "Couple Names",
      "coupleNamePlaceholder": "Example: Ana & Carlos",
      "coupleNameHint": "Both names, as they will appear on invitations",
      "weddingDate": "Wedding Date",
      "numGuests": "Number of Guests"
    }
  }
}
```

### `/apps/main-app/src/i18n/locales/es/pages.json`

```json
{
  "infoBoda": {
    "vision": {
      "title": "Visión General",
      "subtitle": "La esencia de vuestra boda",
      "howWeMet": "¿Cómo os conocisteis?",
      "howWeMetPlaceholder": "Cuéntanos vuestra historia...",
      "mostImportant": "¿Qué es lo más importante ese día?",
      "mostImportantPlaceholder": "Lo que realmente importa para vosotros...",
      "mustHave": "SÍ queremos",
      "mustHavePlaceholder": "Elementos imprescindibles...",
      "mustNotHave": "NO queremos",
      "mustNotHavePlaceholder": "Cosas que preferís evitar...",
      "remember10Years": "¿Qué recordaréis en 10 años?",
      "remember10YearsPlaceholder": "¿Qué queréis que permanezca en vuestra memoria?"
    },
    "essential": {
      "title": "Información Esencial",
      "subtitle": "Los datos más importantes de vuestra boda",
      "coupleName": "Nombres de los dos",
      "coupleNamePlaceholder": "Ejemplo: Ana & Carlos",
      "coupleNameHint": "Los nombres de ambos, como aparecerán en las invitaciones",
      "weddingDate": "Fecha de la boda",
      "numGuests": "Número de invitados"
    }
  }
}
```

---

## 📊 Progreso

**InfoBoda.jsx:**
- ✅ Completado: ~15% (5 secciones de ~36)
- 🟡 En progreso: Secciones de lugares, ceremonia, banquete
- ⏳ Pendiente: ~30+ placeholders y labels

**Proyecto General:**
- ✅ Hook `useTranslation` añadido: 107/107 páginas (100%)
- 🔴 Textos convertidos a i18n: ~5% (estimado)
- ⏳ Pendiente: 20+ páginas con textos hardcodeados

---

**Próximo paso:** Continuar con InfoBoda.jsx y las otras secciones restantes
