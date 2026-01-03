# 📧 CÓMO AÑADIR REGISTROS MX EN NAMECHEAP

**Paso a paso con tu pantalla actual**

---

## 🎯 REGISTROS MX QUE NECESITAS

Debes añadir **2 registros MX:**

**MX 1:**
```
Type: MX Record
Host: mg
Value: mxa.mailgun.org
Priority: 10
TTL: Automatic
```

**MX 2:**
```
Type: MX Record  
Host: mg
Value: mxb.mailgun.org
Priority: 10
TTL: Automatic
```

---

## 📝 PASO A PASO

### **1. Click en "ADD NEW RECORD"** 
(El botón rojo que ves arriba a la izquierda)

### **2. En el dropdown de "Type":**
- Busca y selecciona: **MX Record**

**⚠️ IMPORTANTE:** Debes cambiar el tipo de registro. Por defecto viene "A Record", cambia a "MX Record"

### **3. Completar PRIMER registro MX:**

**Host:**
```
mg
```

**Value:**
```
mxa.mailgun.org
```

**Priority:**
```
10
```

**TTL:**
```
Automatic
```

**Click en el ✓ (check) verde para guardar**

---

### **4. Añadir SEGUNDO registro MX:**

**Click de nuevo en "ADD NEW RECORD"**

**Type:** MX Record

**Host:**
```
mg
```

**Value:**
```
mxb.mailgun.org
```

**Priority:**
```
10
```

**TTL:**
```
Automatic
```

**Click en el ✓ (check) verde para guardar**

---

## ✅ RESULTADO ESPERADO

Después de añadir los 2 registros MX, deberías ver en tu lista:

```
┌────────────┬──────────────────┬─────────────────────┬──────────┐
│ Type       │ Host             │ Value               │ Priority │
├────────────┼──────────────────┼─────────────────────┼──────────┤
│ TXT Record │ e                │ v=sp...             │ -        │
│ TXT Record │ mg.planivia.net  │ v=sp...             │ -        │
│ CNAME      │ email.mg...      │ eu.mailgun.org      │ -        │
│ MX Record  │ mg               │ mxa.mailgun.org     │ 10       │
│ MX Record  │ mg               │ mxb.mailgun.org     │ 10       │
└────────────┴──────────────────┴─────────────────────┴──────────┘
```

**Total: 5 registros**

---

## 🔍 SI NO VES "MX RECORD" EN EL DROPDOWN

**Opción 1:** Scroll en el dropdown de "Type"

**Opción 2:** En algunas versiones de Namecheap, los MX están en una sección separada:
- Busca "MAIL SETTINGS" en el menú lateral izquierdo
- O scroll hacia abajo en la misma página

---

## ⚠️ NOTAS IMPORTANTES

**Host siempre es:** `mg` (no mg.planivia.net)

**Priority siempre es:** `10` para ambos registros

**No pongas punto al final** del host ni del value

---

## ✅ VERIFICAR

Después de añadir los 2 MX, debes tener:
- ✅ 2 registros TXT (SPF y DKIM)
- ✅ 1 registro CNAME (tracking)
- ✅ 2 registros MX (recepción)

**Total: 5 registros para mg.planivia.net**

---

**¡Añade los 2 MX y me avisas!**
