# ✅ VERIFICAR CONFIGURACIÓN DNS

**Has completado la configuración en Namecheap** 🎉

Ahora verifica que todo esté bien.

---

## 🔍 OPCIÓN 1: VERIFICAR EN MAILGUN (OFICIAL)

### **Paso 1: Login en Mailgun**
```
https://app.mailgun.com/
```

### **Paso 2: Ir a Domains**
```
Menu → Sending → Domains
```

### **Paso 3: Buscar tu dominio**
```
Click en: mg.planivia.net
```

### **Paso 4: Click "Verify DNS Settings"**

Verás un botón que dice **"Verify DNS Settings"**

**Click en ese botón**

---

## ✅ RESULTADO ESPERADO:

**Si TODO está bien:**
```
✅ Domain Verification Status: Verified
✅ SPF: Valid
✅ DKIM: Valid  
✅ Tracking: Valid
✅ Receiving: Valid (MX records)
```

**Checks verdes en todos** ✅✅✅✅✅

---

## ⏱️ SI SALE ERROR O "NOT VERIFIED":

**Es NORMAL si acabas de configurar**

DNS tarda en propagarse:
- Mínimo: 15 minutos
- Normal: 1-2 horas
- Máximo: 24-48 horas

**SOLUCIÓN:**
1. Espera 15-30 minutos
2. Vuelve a hacer click en "Verify DNS Settings"
3. Repite hasta que salga "Verified"

---

## 🌐 OPCIÓN 2: VERIFICAR DNS ONLINE

### **Herramienta: MXToolbox**

```
https://mxtoolbox.com/SuperTool.aspx
```

**Buscar:** `mg.planivia.net`

**Verás si los registros están propagados:**
- SPF Record
- DKIM Record
- MX Records
- CNAME Records

---

## 🧪 OPCIÓN 3: VERIFICAR CON COMANDOS

**En PowerShell:**

```powershell
# Verificar SPF
nslookup -type=TXT mg.planivia.net

# Verificar DKIM
nslookup -type=TXT k1._domainkey.mg.planivia.net

# Verificar MX
nslookup -type=MX mg.planivia.net

# Verificar CNAME
nslookup -type=CNAME email.mg.planivia.net
```

**Si aparecen los valores → DNS OK** ✅

---

## ⚠️ IMPORTANTE: PROPAGACIÓN DNS

**Acabas de configurar los registros en Namecheap.**

Los DNS tardan en **propagarse por internet**.

**Durante este tiempo:**
- Mailgun puede decir "Not Verified" ⏳
- Es normal, ten paciencia
- Espera 15-30 minutos mínimo

**Después de 30 minutos:**
- Vuelve a verificar en Mailgun
- Debería salir "Verified" ✅

---

## ✅ CHECKLIST DE VERIFICACIÓN

**En Mailgun, deberías ver:**
- [ ] Domain Status: Verified
- [ ] SPF: Valid
- [ ] DKIM: Valid
- [ ] Tracking (CNAME): Valid
- [ ] Receiving (MX): Valid

**Si todos tienen ✅ → PERFECTO**

---

## 🚀 PRÓXIMOS PASOS

### **Después de que Mailgun diga "Verified":**

**1. Reiniciar backend:**
```bash
cd backend
npm start
```

**2. Probar reset password:**
```
http://localhost:5173/reset-password
Ingresar tu email
```

**3. Revisar email:**
- Debería llegar de: noreply@mg.planivia.net
- Asunto: "Resetear tu password"
- Con link de reset

---

## 📊 ESTADO ACTUAL

**Completado:**
- ✅ Dominio cambiado en .env
- ✅ TXT (SPF) añadido en Namecheap
- ✅ TXT (DKIM) añadido en Namecheap
- ✅ CNAME (tracking) añadido en Namecheap
- ✅ MX (2 registros) añadidos en Namecheap

**Pendiente:**
- ⏳ Esperar propagación DNS (15-30 min)
- ⏳ Verificar en Mailgun
- ⏳ Probar envío de emails

---

## 🎯 RESUMEN

**AHORA:**
1. Ve a Mailgun
2. Sending → Domains → mg.planivia.net
3. Click "Verify DNS Settings"

**SI SALE "VERIFIED" → ¡Listo! Prueba emails**

**SI SALE ERROR → Espera 30 min y vuelve a verificar**

---

**¡Ve a Mailgun y haz click en "Verify DNS Settings"!**
