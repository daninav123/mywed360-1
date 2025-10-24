# 🔧 Solución: Firebase Admin Invalid JWT Signature

## Problema Detectado

```
❌ Invalid JWT Signature
Causa: (1) Reloj desincronizado o (2) Service Account Key revocada
```

## ✅ Solución 1: Sincronizar Reloj (RÁPIDA)

**Ejecuta estos comandos en PowerShell como Administrador:**

```powershell
# Detener servicio de tiempo
net stop w32time

# Iniciar servicio
net start w32time

# Forzar sincronización
w32tm /resync

# Verificar
w32tm /query /status
```

Luego **reinicia el backend** y prueba de nuevo.

---

## ✅ Solución 2: Generar Nueva Service Account Key

Si la Solución 1 no funciona, necesitas una nueva clave:

### Pasos:

1. **Ve a Firebase Console:**
   https://console.firebase.google.com/u/0/project/maloveapp-98c77/settings/serviceaccounts/adminsdk

2. **Genera nueva clave:**
   - Click en "Generate new private key"
   - Confirma descarga

3. **Reemplaza el archivo:**
   - Guarda la nueva clave como `serviceAccountKey.json`
   - Sobrescribe el archivo en: `backend/serviceAccountKey.json`

4. **Reinicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

---

## 🔍 Verificación

Deberías ver en los logs del backend:

```
✅ Credencial de servicio cargada desde...
✅ Firebase Admin initialized successfully
✅ Returning 2 users (source: firebase-auth)  ← ESTO ES LO IMPORTANTE
```

Y en el frontend (consola):
```
✅ Returning 2 users
  - First user: { id: '...', email: '...' }
```

---

## 🚀 Qué Hacer AHORA

1. **PRIMERO intenta Solución 1** (sincronizar reloj) - es más rápida
2. Si no funciona, **entonces Solución 2** (nueva service account key)

**Después de cualquiera de las dos:**
- Reinicia el backend
- Recarga el panel de admin
- Los usuarios deberían aparecer
