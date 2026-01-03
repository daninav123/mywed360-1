# 🔍 DEBUG - LOGIN LOOP

## Problema Observado

El login se ejecuta exitosamente PERO se repite en un loop infinito:

```
[Login.jsx] Llamando loginWithEmail...
[Login.jsx] Resultado: {success: true, user: {…}}
[Login.jsx] Login exitoso, navegando a /home
[Login.jsx] Navigate llamado
// LOOP - Se vuelve a ejecutar todo desde el inicio
```

---

## Causa Probable

**Flujo esperado:**
1. Login exitoso → `setAuthUser()` → `isAuthenticated = true`
2. Navigate to `/home`
3. `/home` está en `<ProtectedRoute />` 
4. ProtectedRoute verifica `isAuthenticated` → TRUE → permite acceso

**Flujo actual (LOOP):**
1. Login exitoso → `setAuthUser()` 
2. Navigate to `/home`
3. ProtectedRoute verifica `isAuthenticated` → **FALSE** ❌
4. Redirige de vuelta a `/login`
5. **LOOP SE REPITE**

---

## Posibles Causas

### 1. `isAuthenticated` No Se Calcula Correctamente
- `authUser` se setea pero `isAuthenticated` no se actualiza
- Verificar en `useAuth.jsx` cómo se calcula

### 2. `loadUserProfile()` Falla Silenciosamente
- Si `/api/users/profile` falla, puede resetear el estado
- Backend logs muestran que SÍ se llama a `/api/users/profile`

### 3. Token No Se Guarda en LocalStorage
- `setStoredToken()` no funciona correctamente
- Al recargar, el token se pierde

### 4. `verifyCurrentToken()` Se Ejecuta y Limpia el Estado
- useEffect llama a `verifyCurrentToken()` al montar
- Si falla, resetea `authUser` a null

---

## Logs Agregados para Debug

He agregado logs en:

### `loginWithEmail()`:
```javascript
console.log('[useAuth] loginWithEmail iniciado:', email);
console.log('[useAuth] Response estructura:', {...});
console.log('[useAuth] Token y user recibidos, guardando...');
console.log('[useAuth] authUser seteado, cargando perfil...');
console.log('[useAuth] Login completo, retornando success');
```

### `loadUserProfile()`:
```javascript
console.log('[useAuth] loadUserProfile llamado con token:', ...);
console.log('[useAuth] loadUserProfile response:', {...});
console.log('[useAuth] UserProfile seteado correctamente');
console.warn('[useAuth] loadUserProfile no success:', ...);
console.error('[useAuth] Error loading user profile:', ...);
```

---

## Próximos Pasos

1. **Recargar el navegador** (Ctrl+Shift+R)
2. **Abrir DevTools > Console**
3. **Intentar login**
4. **Revisar logs en consola** - buscar:
   - `[useAuth]` logs
   - Si `loadUserProfile` se ejecuta correctamente
   - Si hay algún error silencioso

5. **Enviarme los logs completos** que empiecen con `[useAuth]`

---

## Verificación del Backend

```bash
# Login funciona:
curl -X POST http://localhost:4004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"danielanavarrocampos@icloud.com","password":"12345678"}'
# ✅ Devuelve: {"success": true, "data": {"token": "...", "user": {...}}}

# /api/users/profile - NECESITA VERIFICACIÓN:
TOKEN="..." # obtener del login
curl http://localhost:4004/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
# ❓ ¿Qué devuelve?
```

---

## Solución Temporal SI PERSISTE

Si el loop continúa después de revisar logs, la solución temporal es:

1. Comentar temporalmente `verifyCurrentToken()` en useEffect
2. O hacer que `ProtectedRoute` no redirija si hay token en localStorage
