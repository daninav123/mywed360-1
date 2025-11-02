# 🌐 SELECTOR DE IDIOMA - ESTRATEGIA GLOBAL

## 🎯 **ESTRATEGIA ACTUAL**

**Un selector global que afecta a todo el proyecto.**

En lugar de tener selectores en cada página, tenemos **2 selectores estratégicos** que cubren toda la aplicación:

---

## ✅ **UBICACIONES DEL SELECTOR**

### **1. MainLayout** 🏠

**Archivo:** `src/components/MainLayout.jsx`

**Cubre:**

- Toda la aplicación logueada
- `/home`, `/bodas`, `/invitados`, `/finance`, `/proveedores`, `/ideas`, `/perfil`
- Todas las páginas dentro de la app

**Ubicación:** Header, junto al avatar del usuario

**Configuración:**

```jsx
<LanguageSelector variant="minimal" persist={true} />
```

- Guarda en localStorage
- Guarda en Firebase (users/{uid}/preferences/language)

---

### **2. MarketingLayout** 🌍

**Archivo:** `src/components/marketing/MarketingLayout.jsx`

**Cubre:**

- Todas las páginas públicas
- `/`, `/app`, `/para-planners`, `/para-proveedores`, `/partners`, `/precios`
- Páginas de marketing

**Ubicación:**

- Desktop: Header derecha
- Mobile: Navegación móvil

**Configuración:**

```jsx
<LanguageSelector variant="minimal" persist={false} />
```

- Solo guarda en localStorage
- No requiere Firebase (usuarios no logueados)

---

## 🔄 **CÓMO FUNCIONA GLOBALMENTE**

### **1. i18next es un Singleton**

```javascript
// El idioma es global en toda la aplicación
import i18n from './i18n';

// Cambiar el idioma en cualquier lugar...
i18n.changeLanguage('es');

// ...afecta a TODAS las páginas
```

### **2. Persistencia en localStorage**

```javascript
// El selector guarda en localStorage
localStorage.setItem('i18nextLng', 'es');

// Al recargar, i18next lee automáticamente
i18n.init({
  lng: localStorage.getItem('i18nextLng') || 'es',
});
```

### **3. Hooks reactivos**

```javascript
// Cada componente usa el hook
const { t } = useTranslation();

// Cuando cambia el idioma...
i18n.changeLanguage('en');

// ...todos los componentes se re-renderizan automáticamente
```

---

## 🎨 **PÁGINAS SIN SELECTOR PROPIO**

Estas páginas **NO tienen selector** pero **SÍ cambian de idioma**:

- `/login` - Usa idioma global de localStorage
- `/signup` - Usa idioma global de localStorage
- `/reset-password` - Usa idioma global de localStorage
- `/admin` - Tiene su propio selector en AdminLayout
- `/disenos/*` - Tiene su propio selector en DisenosLayout
- `/protocolo/*` - Tiene su propio selector en ProtocoloLayout

**¿Por qué funcionan?**

Porque todas usan `useTranslation()` que lee el idioma global de i18next.

---

## 📝 **FLUJO COMPLETO**

### **Usuario no logueado:**

```
1. Usuario entra a página pública (/)
2. MarketingLayout muestra selector 🌐
3. Usuario cambia a inglés
4. Se guarda en localStorage: 'en'
5. i18next cambia globalmente a 'en'
6. TODAS las páginas públicas cambian a inglés
7. Usuario va a /login
8. Login está en inglés (lee de localStorage)
9. Usuario hace signup
10. Signup está en inglés (lee de localStorage)
```

### **Usuario logueado:**

```
1. Usuario inicia sesión
2. MainLayout muestra selector 🌐
3. Usuario cambia a francés
4. Se guarda en:
   - localStorage: 'fr'
   - Firebase: users/{uid}/preferences/language = 'fr'
5. i18next cambia globalmente a 'fr'
6. TODAS las páginas de la app cambian a francés
7. Usuario recarga la página
8. i18next lee localStorage → 'fr'
9. Todo sigue en francés
10. Usuario inicia sesión en otro dispositivo
11. App lee Firebase → 'fr'
12. Se sincroniza el idioma
```

---

## ✅ **VENTAJAS DE ESTA ESTRATEGIA**

### **1. Menos código duplicado**

- Solo 2 selectores en layouts
- No hay selectores redundantes

### **2. Consistencia automática**

- El idioma es global
- No hay conflictos entre selectores

### **3. Performance**

- Menos componentes en el DOM
- Menos re-renders

### **4. Mantenimiento simple**

- Un solo punto de configuración
- Fácil de actualizar

### **5. Experiencia de usuario mejorada**

- El usuario cambia el idioma una vez
- Se aplica a toda la app
- Se mantiene entre sesiones

---

## 🧪 **CÓMO VERIFICAR QUE FUNCIONA**

### **Test 1: Páginas públicas**

```
1. Ve a http://localhost:5173/
2. Cambia el idioma a inglés con el selector 🌐
3. Ve a /para-planners
4. ✅ Debería estar en inglés
5. Ve a /login
6. ✅ Debería estar en inglés (sin selector en la página)
```

### **Test 2: App logueada**

```
1. Inicia sesión
2. Cambia el idioma a francés con el selector 🌐
3. Ve a /invitados
4. ✅ Debería estar en francés
5. Ve a /finance
6. ✅ Debería estar en francés
7. Recarga la página
8. ✅ Debería seguir en francés
```

### **Test 3: Persistencia**

```
1. Cambia el idioma a alemán
2. Cierra el navegador completamente
3. Vuelve a abrir
4. Ve a la app
5. ✅ Debería estar en alemán
```

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### **Archivo i18n:** `src/i18n/index.js`

```javascript
i18n.init({
  fallbackLng: 'es',
  lng: localStorage.getItem('i18nextLng') || 'es',
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
});
```

### **LanguageSelector:** `src/components/ui/LanguageSelector.jsx`

```javascript
const handleLanguageChange = async (languageCode) => {
  // 1. Cambiar i18next globalmente
  await changeLanguage(languageCode);

  // 2. Guardar en localStorage
  localStorage.setItem('i18nextLng', languageCode);

  // 3. Guardar en Firebase (si persist={true})
  if (persist && currentUser) {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      'preferences.language': languageCode,
    });
  }
};
```

---

## 📊 **COBERTURA FINAL**

```
✅ MainLayout → 100% de páginas logueadas
✅ MarketingLayout → 100% de páginas públicas
✅ AdminLayout → Panel de administración
✅ DisenosLayout → Sección diseños
✅ ProtocoloLayout → Sección protocolo
✅ Perfil → Configuración de usuario
```

**TOTAL:** Toda la aplicación cubierta con 6 selectores estratégicos

---

## 🎯 **RESULTADO**

**Un selector que afecta a TODO el proyecto.**

El usuario puede cambiar el idioma desde:

- La página de inicio (MarketingLayout)
- Cualquier página logueada (MainLayout)
- El panel de admin (AdminLayout)
- Las secciones especializadas (Diseños, Protocolo)

Y el cambio se aplica **globalmente a toda la aplicación**.

---

**Fecha:** 2025-11-02  
**Estrategia:** Selector global con i18next singleton  
**Estado:** ✅ Implementado y funcionando
