# 📧 REGISTROS MX EN NAMECHEAP - SECCIÓN SEPARADA

**Problema:** MX Record no aparece en el dropdown de "Add New Record"

**Solución:** Los MX están en una sección separada llamada "MAIL SETTINGS"

---

## 🔍 DÓNDE ENCONTRAR MX RECORDS

### **Opción 1: MAIL SETTINGS (panel izquierdo)**

En tu pantalla de Namecheap:

1. **Mira el menú lateral IZQUIERDO**
2. **Busca una sección que diga:**
   - "MAIL SETTINGS"
   - "Email Forwarding"
   - "MX Records"

3. **Click en esa sección**

---

### **Opción 2: Scroll hacia ABAJO**

Si no ves el menú lateral:

1. **Scroll hacia abajo** en la misma página de "Advanced DNS"
2. Busca una sección que diga **"MAIL SETTINGS"**
3. Ahí podrás configurar los MX

---

## 📝 CUANDO ENCUENTRES "MAIL SETTINGS"

Verás opciones como:

```
┌─────────────────────────────────────┐
│ MAIL SETTINGS                       │
├─────────────────────────────────────┤
│ Email Forwarding:  [dropdown ▼]    │
│                                     │
│ Options:                            │
│ ○ No Email Service                  │
│ ○ Email Forwarding                  │
│ ○ Custom MX                    ← ESTO│
│ ○ Gmail                             │
│ ○ Other providers                   │
└─────────────────────────────────────┘
```

**Selecciona:** `Custom MX` o `Custom MX Records`

---

## ⚙️ CONFIGURAR CUSTOM MX

Después de seleccionar "Custom MX":

1. **Aparecerán campos para añadir MX**
2. **Añade el PRIMER MX:**
   ```
   Subdomain: mg
   Mail Server: mxa.mailgun.org
   Priority: 10
   ```

3. **Click "Add More" o "+" para añadir el SEGUNDO:**
   ```
   Subdomain: mg
   Mail Server: mxb.mailgun.org
   Priority: 10
   ```

4. **GUARDAR cambios**

---

## 🎯 ALTERNATIVA: EMAIL FORWARDING DROPDOWN

Si ves un dropdown que dice "Email Forwarding" con opciones:

**Cambia de:**
```
Email Forwarding: [Namecheap Private Email ▼]
```

**A:**
```
Email Forwarding: [Custom MX ▼]
```

**Luego podrás añadir los 2 MX records**

---

## ✅ RESUMEN

**Los MX NO están en "Add New Record"**

**Los MX están en:**
- Menú lateral → MAIL SETTINGS
- O scroll abajo → MAIL SETTINGS  
- O dropdown "Email Forwarding" → Custom MX

---

**Busca "MAIL SETTINGS" o "Email Forwarding" en tu pantalla actual**

**¿Lo encuentras?**
