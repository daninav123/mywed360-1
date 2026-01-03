# 🔧 CORRECCIÓN DNS - ERROR DETECTADO

**Problema:** Estás usando el dominio COMPLETO en el campo "Host"

**Namecheap añade automáticamente "planivia.net" al final**

Si pones `mg.planivia.net` → Namecheap crea `mg.planivia.net.planivia.net` ❌

**SOLUCIÓN:** Usa solo el SUBDOMINIO, no el dominio completo

---

## ❌ **LO QUE TIENES AHORA (INCORRECTO):**

```
Host: mg.planivia.net         ← MAL
Host: email.mg.planivia...    ← MAL
Host: email._domaink...       ← MAL
```

---

## ✅ **LO QUE DEBE SER (CORRECTO):**

```
Host: mg                      ← BIEN
Host: email.mg                ← BIEN  
Host: k1._domainkey.mg        ← BIEN
```

---

## 🔧 **CORRECCIONES A HACER:**

### **REGISTRO 1: SPF (TXT)**
**ACTUAL (mal):**
```
Host: mg.planivia.net
Value: v=spf1 include mailgun.org ~all
```

**CAMBIAR A:**
```
Host: mg
Value: v=spf1 include:mailgun.org ~all
```

**⚠️ NOTA:** Falta los dos puntos ":" después de include

---

### **REGISTRO 2: DKIM (TXT)**
**ACTUAL (mal):**
```
Host: email._domaink...
Value: k=rsa...
```

**CAMBIAR A:**
```
Host: k1._domainkey.mg
Value: [el valor largo que copiaste de Mailgun]
```

---

### **REGISTRO 3: TRACKING (CNAME)**
**ACTUAL (mal):**
```
Host: email.mg.planivia...
Value: eu.mailgun.org
```

**CAMBIAR A:**
```
Host: email.mg
Value: eu.mailgun.org
```

---

### **REGISTROS 4 y 5: MX**
**ACTUAL (mal):**
```
Host: mg.planivia.net
Value: mxa.eu.mailgun.org
```

**CAMBIAR A:**
```
Host: mg
Value: mxa.eu.mailgun.org
```

```
Host: mg
Value: mxb.eu.mailgun.org
```

---

## 📝 **PASO A PASO PARA CORREGIR:**

### **1. EDITAR CADA REGISTRO:**

**Click en cada registro** (icono de lápiz o edit)

**Cambiar solo el campo "Host":**
- Borrar la parte ".planivia.net"
- Dejar solo el subdominio

**Ejemplos:**
```
mg.planivia.net  → mg
email.mg.planivia.net → email.mg
```

---

### **2. REGISTROS FINALES CORRECTOS:**

```
┌──────────┬──────────────────────┬────────────────────────────┬──────────┐
│ Type     │ Host                 │ Value                      │ Priority │
├──────────┼──────────────────────┼────────────────────────────┼──────────┤
│ TXT      │ mg                   │ v=spf1 include:mailgun...  │ -        │
│ TXT      │ k1._domainkey.mg     │ k=rsa; p=MIGfMA0GCS...     │ -        │
│ CNAME    │ email.mg             │ eu.mailgun.org             │ -        │
│ MX       │ mg                   │ mxa.eu.mailgun.org         │ 10       │
│ MX       │ mg                   │ mxb.eu.mailgun.org         │ 10       │
└──────────┴──────────────────────┴────────────────────────────┴──────────┘
```

**⚠️ IMPORTANTE:** Solo "mg", "email.mg", "k1._domainkey.mg"

**NO** incluyas ".planivia.net" - Namecheap lo añade automáticamente

---

## ⚡ **OTRO ERROR DETECTADO:**

**En el SPF falta ":" después de "include"**

**Incorrecto:**
```
v=spf1 include mailgun.org ~all
```

**Correcto:**
```
v=spf1 include:mailgun.org ~all
         ↑ dos puntos aquí
```

---

## ✅ **CHECKLIST DE CORRECCIÓN:**

- [ ] Editar TXT SPF → Host: `mg` (no mg.planivia.net)
- [ ] Editar TXT SPF → Value: `v=spf1 include:mailgun.org ~all` (añadir ":")
- [ ] Editar TXT DKIM → Host: `k1._domainkey.mg` 
- [ ] Editar CNAME → Host: `email.mg`
- [ ] Editar MX 1 → Host: `mg`
- [ ] Editar MX 2 → Host: `mg`
- [ ] Guardar todos los cambios
- [ ] Esperar 15 min propagación
- [ ] Verificar en Mailgun

---

## 🎯 **RESUMEN:**

**REGLA DE ORO EN NAMECHEAP:**
```
Campo "Host" = SOLO el subdominio
NO incluir el dominio principal (.planivia.net)
```

**Namecheap añade automáticamente ".planivia.net" al final**

---

**Edita todos los registros y cambia el Host a solo el subdominio**
