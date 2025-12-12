# 🔍 DEBUG - Portfolio en Modal de Detalles

## ⚠️ Problema Reportado

El portfolio NO se muestra en el modal de detalles del proveedor, solo aparece:
- Nombre
- Categoría
- Ubicación
- Contacto
- Notas privadas

**Falta:** Sección de portfolio con fotos

---

## 🔍 Debug Añadido

He añadido logs detallados para identificar el problema:

### **1. Logs al abrir el modal:**
```javascript
console.log('🔍 [SupplierDetailModal] Datos del supplier:', {
  name: supplier.name,
  hasPortfolio: supplier.hasPortfolio,  // ← ¿Es true?
  slug: supplier.slug,                   // ← ¿Existe?
  portfolioPhotosLength: portfolioPhotos.length,
});

console.log('🔍 [SupplierDetailModal] Condición portfolio:', {
  'supplier.hasPortfolio': supplier.hasPortfolio,
  'supplier.slug': supplier.slug,
  'portfolioPhotos.length': portfolioPhotos.length,
  'mostrarPortfolio': (supplier.hasPortfolio && supplier.slug) || portfolioPhotos.length > 0,
});
```

### **2. Logs al cargar portfolio:**
```javascript
console.log('🔍 [SupplierDetailModal] Cargando portfolio para:', supplier.slug);
console.log('🔍 [SupplierDetailModal] Respuesta API:', response.status);
console.log('🔍 [SupplierDetailModal] Datos recibidos:', {
  hasPortfolio: data.hasPortfolio,
  portfolioLength: data.portfolio?.length,
  portfolio: data.portfolio,
});
console.log('✅ [SupplierDetailModal] Portfolio cargado:', data.portfolio.length, 'fotos');
```

---

## 🎯 Pasos para Debuggear

### **1. Reinicia y abre la consola:**
```
Servidor reiniciado en: http://localhost:5173/
```

### **2. Abre devtools (Cmd+Option+I)**

### **3. Ve a proveedores:**
```
http://localhost:5173/proveedores
```

### **4. Busca "ReSona" y haz click en "Ver detalles"**

### **5. Revisa la consola y copia los logs:**
```
🔍 [SupplierDetailModal] Datos del supplier: {...}
🔍 [SupplierDetailModal] Condición portfolio: {...}
🔍 [SupplierDetailModal] Cargando portfolio para: ...
🔍 [SupplierDetailModal] Respuesta API: ...
🔍 [SupplierDetailModal] Datos recibidos: {...}
```

---

## 🤔 Posibles Causas

### **Causa 1: `hasPortfolio` es false**
```javascript
if (!supplier.hasPortfolio) {
  // No carga el portfolio
}
```
**Solución:** Verificar que ReSona tenga `hasPortfolio: true` en Firestore

### **Causa 2: No tiene `slug`**
```javascript
if (!supplier.slug) {
  // No carga el portfolio
}
```
**Solución:** Verificar que ReSona tenga `slug: "resona-valencia"`

### **Causa 3: API no devuelve portfolio**
```javascript
// Endpoint: /api/suppliers/public/resona-valencia
// Debe devolver: { portfolio: [...28 fotos...] }
```
**Solución:** Verificar que el backend devuelva correctamente

### **Causa 4: Condición de renderizado demasiado estricta**
```javascript
{(supplier.hasPortfolio && supplier.slug) || portfolioPhotos.length > 0 ? (
  // Mostrar portfolio
) : null}
```
**Solución:** Puede que la condición nunca se cumpla

---

## 📝 Siguiente Paso

**Abre el modal, revisa la consola y pásame los logs para identificar la causa exacta.**

---

**Servidor listo en:** http://localhost:5173/ 🚀
