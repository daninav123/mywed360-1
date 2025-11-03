# 🔄 REINICIAR BACKEND - INSTRUCCIONES

## ⚡ ACCIÓN RÁPIDA

1. **Ve a la terminal donde corre el backend**
2. **Presiona `Ctrl + C`** para detenerlo
3. **Ejecuta de nuevo**:
   ```powershell
   npm start
   # o
   node index.js
   ```

---

## ✅ LO QUE DEBERÍA PASAR

Después de reiniciar, deberías ver algo como:

```
✅ Server running on port 4004 (o el puerto que uses)
✅ Firebase initialized
✅ Routes loaded
```

---

## 🧪 PRUEBA QUE FUNCIONA

1. **Recarga el dashboard** en el navegador:

   ```
   http://localhost:5173/supplier/dashboard/z0BAVOrrub8xQvUtHIOw
   ```

2. **Verifica en la consola**:
   - ❌ ANTES: `404 Not Found` en `/api/supplier-dashboard/z0BAVOrrub8xQvUtHIOw`
   - ✅ AHORA: `200 OK` y el dashboard carga correctamente

---

## 🐛 SI SIGUE FALLANDO

Verifica que:

1. ✅ El backend se reinició correctamente
2. ✅ No hay errores en la terminal del backend
3. ✅ El puerto es el correcto (probablemente 4004)
4. ✅ El frontend apunta al backend correcto

---

## 📝 CAMBIO APLICADO

**Endpoint añadido**:

```javascript
GET /api/supplier-dashboard/:id
→ Devuelve { profile, metrics } del proveedor
```

**Ahora el dashboard puede cargar datos** ✅
