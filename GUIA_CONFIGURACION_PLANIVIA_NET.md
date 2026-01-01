# 📧 GUÍA: CONFIGURAR PLANIVIA.NET PASO A PASO

**Dominio nuevo:** planivia.net  
**Fecha:** 1 enero 2026

---

## ✅ PASO 1: CAMBIAR DOMINIO EN .ENV (COMPLETADO)

Ya he cambiado en `backend/.env`:

```env
# ANTES:
MAILGUN_DOMAIN=malove.app
MAILGUN_SENDING_DOMAIN=mg.malove.app

# AHORA:
MAILGUN_DOMAIN=planivia.net
MAILGUN_SENDING_DOMAIN=mg.planivia.net
```

✅ **Completado automáticamente**

---

## 🔧 PASO 2: AÑADIR DOMINIO EN MAILGUN

### **2.1 Login en Mailgun**
```
https://app.mailgun.com/
```

**Credenciales:** Las que ya tienes configuradas

### **2.2 Añadir nuevo dominio**

**Opción A: Dashboard > Sending > Domains**
```
1. Click "Add New Domain"
2. Domain Name: mg.planivia.net
3. Region: EU (Europa)
4. Click "Add Domain"
```

**Opción B: Si ya existe el dominio**
```
Solo verifica que mg.planivia.net esté en la lista
```

### **2.3 Copiar registros DNS**

Mailgun te mostrará una pantalla con 4 registros DNS:

```
┌─────────────────────────────────────────┐
│ DNS Settings for mg.planivia.net        │
├─────────────────────────────────────────┤
│ 📝 Sending Records                      │
│                                         │
│ Type  | Hostname           | Value     │
│-------|--------------------|-----------│
│ TXT   | mg.planivia.net    | v=spf1... │
│ TXT   | k1._domainkey.mg...| k=rsa...  │
│ CNAME | email.mg.planivia..| mailgun...│
│                                         │
│ 📥 Receiving Records (Optional)         │
│ MX    | mg.planivia.net    | mxa.mai...│
│ MX    | mg.planivia.net    | mxb.mai...│
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** Copia estos valores exactos, los necesitarás en el siguiente paso.

**Screenshot recomendado:** Haz captura de esta pantalla

---

## 🌐 PASO 3: CONFIGURAR DNS EN NAMECHEAP

### **3.1 Login en Namecheap**
```
https://www.namecheap.com/
```

### **3.2 Ir a gestión de DNS**
```
1. Account → Domain List
2. Buscar: planivia.net
3. Click "Manage"
4. Tab "Advanced DNS"
```

### **3.3 Añadir registros DNS**

**⚠️ NOTA:** Usa los valores EXACTOS que copiaste de Mailgun

---

#### **REGISTRO 1: SPF (TXT)**

```
Type: TXT Record
Host: mg
Value: v=spf1 include:mailgun.org ~all
TTL: Automatic (o 3600)
```

**Click "Add New Record" y completar:**
- Type: **TXT Record**
- Host: **mg**
- Value: **v=spf1 include:mailgun.org ~all**
- TTL: **Automatic**

**Click "✓" para guardar**

---

#### **REGISTRO 2: DKIM (TXT)**

```
Type: TXT Record
Host: k1._domainkey.mg
Value: [Copiar de Mailgun - empieza con "k=rsa; p=..."]
TTL: Automatic
```

**⚠️ IMPORTANTE:** El valor es MUY largo (varias líneas)

**Ejemplo del valor (el tuyo será diferente):**
```
k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDYo...
[continúa muchas líneas más]
```

**Click "Add New Record":**
- Type: **TXT Record**
- Host: **k1._domainkey.mg**
- Value: **[Pegar TODO el valor de Mailgun]**
- TTL: **Automatic**

**Click "✓" para guardar**

---

#### **REGISTRO 3: TRACKING (CNAME)**

```
Type: CNAME Record
Host: email.mg
Target: mailgun.org
TTL: Automatic
```

**Click "Add New Record":**
- Type: **CNAME Record**
- Host: **email.mg**
- Target: **mailgun.org**
- TTL: **Automatic**

**Click "✓" para guardar**

---

#### **REGISTRO 4: MX - PRIMERO**

```
Type: MX Record
Host: mg
Value: mxa.mailgun.org
Priority: 10
TTL: Automatic
```

**Click "Add New Record":**
- Type: **MX Record**
- Host: **mg**
- Value: **mxa.mailgun.org**
- Priority: **10**
- TTL: **Automatic**

**Click "✓" para guardar**

---

#### **REGISTRO 5: MX - SEGUNDO**

```
Type: MX Record
Host: mg
Value: mxb.mailgun.org
Priority: 10
TTL: Automatic
```

**Click "Add New Record":**
- Type: **MX Record**
- Host: **mg**
- Value: **mxb.mailgun.org**
- Priority: **10**
- TTL: **Automatic**

**Click "✓" para guardar**

---

### **3.4 Verificar registros añadidos**

En Namecheap deberías ver ahora **5 registros nuevos:**

```
┌──────────┬──────────────────────┬─────────────────┐
│ Type     │ Host                 │ Value/Target    │
├──────────┼──────────────────────┼─────────────────┤
│ TXT      │ mg                   │ v=spf1...       │
│ TXT      │ k1._domainkey.mg     │ k=rsa; p=...    │
│ CNAME    │ email.mg             │ mailgun.org     │
│ MX       │ mg                   │ mxa.mailgun.org │
│ MX       │ mg                   │ mxb.mailgun.org │
└──────────┴──────────────────────┴─────────────────┘
```

---

## ⏱️ PASO 4: ESPERAR PROPAGACIÓN DNS

**Tiempo de espera:** 15 minutos a 2 horas (normalmente)

**Durante este tiempo:**
- ✅ Los registros se están propagando por internet
- ❌ Los emails todavía NO funcionarán
- ⏳ Ten paciencia

**Puedes hacer otras cosas mientras esperas**

---

## ✅ PASO 5: VERIFICAR EN MAILGUN

### **5.1 Volver a Mailgun**
```
https://app.mailgun.com/
Sending → Domains → mg.planivia.net
```

### **5.2 Click "Verify DNS Settings"**

**Mailgun comprobará los registros DNS**

**Resultado esperado:**
```
✅ Domain Verification Status: Verified
✅ SPF: Valid
✅ DKIM: Valid
✅ Tracking: Valid
```

**Si sale error:**
- Espera 15-30 minutos más
- Verifica que copiaste los valores correctamente
- Usa "Verify DNS Settings" otra vez

---

## 🧪 PASO 6: PROBAR ENVÍO DE EMAIL

### **6.1 Reiniciar backend**
```bash
cd backend
# Matar proceso actual
Get-Process -Name node | Stop-Process -Force

# Iniciar de nuevo
npm start
```

### **6.2 Probar desde la app**
```
1. Abrir: http://localhost:5173/reset-password
2. Ingresar: tu-email@gmail.com
3. Esperar mensaje de éxito
4. Revisar tu bandeja de entrada
```

### **6.3 Verificar email recibido**

**Debería llegar email con:**
```
De: MaLoveApp <noreply@mg.planivia.net>
Asunto: Resetear tu password - MaLoveApp
```

**✅ Si llega:** ¡Funciona!
**❌ Si no llega:**
- Revisar spam/junk
- Esperar más tiempo (DNS)
- Verificar logs del backend

---

## 📋 CHECKLIST COMPLETO

- [x] **Paso 1:** Cambiar dominio en .env ✅
- [ ] **Paso 2:** Añadir dominio en Mailgun
- [ ] **Paso 3.1:** Añadir registro SPF en Namecheap
- [ ] **Paso 3.2:** Añadir registro DKIM en Namecheap
- [ ] **Paso 3.3:** Añadir registro CNAME en Namecheap
- [ ] **Paso 3.4:** Añadir registros MX (2) en Namecheap
- [ ] **Paso 4:** Esperar propagación (15 min - 2h)
- [ ] **Paso 5:** Verificar en Mailgun (Domain verified)
- [ ] **Paso 6:** Reiniciar backend
- [ ] **Paso 7:** Probar envío de email

---

## 🆘 TROUBLESHOOTING

### **Mailgun dice "Domain not verified"**
- Espera más tiempo (hasta 2 horas)
- Verifica que los valores DNS sean exactos
- Usa mxtoolbox.com para verificar DNS

### **Email no llega**
- Revisa spam/junk
- Verifica logs del backend (buscar errores)
- Confirma dominio verificado en Mailgun

### **Error "Mailgun API error"**
- Verifica MAILGUN_API_KEY correcto
- Confirma dominio existe en Mailgun
- Revisa región EU configurada

---

## 💡 COMANDOS ÚTILES

**Verificar DNS propagado:**
```bash
# SPF
nslookup -type=TXT mg.planivia.net

# DKIM
nslookup -type=TXT k1._domainkey.mg.planivia.net

# MX
nslookup -type=MX mg.planivia.net
```

**Verificar online:**
```
https://mxtoolbox.com/SuperTool.aspx
Buscar: mg.planivia.net
```

---

## 📞 SOPORTE

**Si necesitas ayuda:**
1. Screenshot de registros DNS en Namecheap
2. Screenshot de Mailgun (domain verification)
3. Logs del backend al intentar enviar

---

## ✅ PRÓXIMOS PASOS

**Después de completar:**
1. ✅ Sistema de emails funcionando
2. ✅ Dominio planivia.net verificado
3. ✅ Reset password operativo
4. 🎉 Producción ready

---

**¡Ahora sigue con el Paso 2!**
**Login en Mailgun y añade el dominio mg.planivia.net**
