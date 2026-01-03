# 👤 Sistema Claim - Perfiles Editables por Proveedores

**Actualización:** 2025-01-28  
**Estado:** Diseñado (Implementación futura - Fase 3)

---

## 🎯 OBJETIVO

Permitir que proveedores **reclamen su perfil** en la plataforma y puedan:
- ✅ Editar su información de contacto
- ✅ Actualizar descripción y servicios
- ✅ Subir imágenes de portfolio
- ✅ Gestionar disponibilidad
- ✅ Ver métricas de su perfil

**Importante:** Los proveedores NO necesitan registrarse para aparecer en búsquedas. El sistema los descubre automáticamente. El "claim" es opcional y les da control sobre su información.

---

## 🔄 FLUJO COMPLETO

```
┌────────────────────────────────────────────────────────────┐
│ 1. PROVEEDOR ENCUENTRA SU PERFIL                           │
│    - Busca su nombre en la plataforma                      │
│    - Ve un botón "¿Este es tu negocio? Reclamalo"         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 2. INICIA PROCESO DE CLAIM                                 │
│    POST /api/suppliers/:id/claim                           │
│    - Ingresa email (debe coincidir con el perfil)         │
│    - Ingresa nombre y teléfono                             │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 3. VERIFICACIÓN POR EMAIL                                  │
│    - Sistema envía código de 6 dígitos                     │
│    - Código válido por 1 hora                              │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 4. CONFIRMA CÓDIGO                                         │
│    POST /api/suppliers/claim/:claimId/verify               │
│    - Ingresa código recibido                               │
│    - Sistema crea usuario Firebase Auth                    │
│    - Perfil pasa a status "claimed"                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ 5. PROVEEDOR PUEDE EDITAR SU PERFIL                        │
│    PUT /api/suppliers/:id                                  │
│    - Solo el proveedor dueño puede editar                  │
│    - Cambios en tiempo real                                │
└────────────────────────────────────────────────────────────┘
```

---

## 📝 COLLECTION: `supplier_claims`

```javascript
{
  // ID auto-generado
  claimId: "claim_abc123",
  
  // Referencia al proveedor
  supplierId: "alfonso-calza-valencia",
  
  // Datos del solicitante
  email: "alfonso@alfonsocalza.com",
  name: "Alfonso Calza",
  phone: "+34 123 456 789",
  
  // Verificación
  verificationCode: "789456",         // Código de 6 dígitos
  verified: false,                    // ¿Código verificado?
  
  // Estado
  status: "pending",                  // pending | verified | expired | rejected
  
  // Timestamps
  createdAt: Timestamp,
  verifiedAt: null,
  expiresAt: Timestamp,               // createdAt + 1 hora
}
```

---

## 🔌 API ENDPOINTS

### **1. POST /api/suppliers/:id/claim - Iniciar claim**

**Request:**
```javascript
POST /api/suppliers/alfonso-calza-valencia/claim
Content-Type: application/json

{
  "email": "alfonso@alfonsocalza.com",
  "name": "Alfonso Calza",
  "phone": "+34 123 456 789"
}
```

**Response:**
```javascript
{
  "success": true,
  "claimId": "claim_abc123",
  "message": "Código de verificación enviado a alfonso@alfonsocalza.com"
}
```

**Implementación:**
```javascript
// backend/routes/suppliers-claim.js

router.post('/api/suppliers/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone } = req.body;
    
    // Validaciones
    if (!email || !name) {
      return res.status(400).json({ error: 'Email y nombre son requeridos' });
    }
    
    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    const supplier = doc.data();
    
    // Verificar que el email coincide
    if (supplier.contact.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ 
        error: 'El email no coincide con el registrado para este proveedor' 
      });
    }
    
    // Verificar que no esté ya reclamado
    if (supplier.claimed) {
      return res.status(400).json({ 
        error: 'Este perfil ya ha sido reclamado' 
      });
    }
    
    // Generar código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Crear solicitud de claim
    const claimData = {
      supplierId: id,
      email: email.toLowerCase(),
      name,
      phone: phone || null,
      verificationCode,
      verified: false,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    };
    
    const claimDoc = await db.collection('supplier_claims').add(claimData);
    
    // Enviar email de verificación
    await sendClaimVerificationEmail(email, name, verificationCode);
    
    console.log(`📧 [CLAIM] Código enviado a ${email} para ${id}`);
    
    res.json({ 
      success: true, 
      claimId: claimDoc.id,
      message: `Código de verificación enviado a ${email}`
    });
    
  } catch (error) {
    console.error('Error claiming profile:', error);
    res.status(500).json({ error: error.message });
  }
});

async function sendClaimVerificationEmail(email, name, code) {
  // Implementar con tu servicio de email (Mailgun, SendGrid, etc.)
  const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  });
  
  const data = {
    from: 'MyWed360 <noreply@MaLove.App.com>',
    to: email,
    subject: 'Verifica tu perfil en MyWed360',
    html: `
      <h2>Hola ${name},</h2>
      <p>Has solicitado reclamar tu perfil de proveedor en MyWed360.</p>
      <p>Tu código de verificación es:</p>
      <h1 style="font-size: 32px; letter-spacing: 5px; font-family: monospace;">
        ${code}
      </h1>
      <p>Este código expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este email.</p>
    `
  };
  
  await mailgun.messages().send(data);
}
```

---

### **2. POST /api/suppliers/claim/:claimId/verify - Verificar código**

**Request:**
```javascript
POST /api/suppliers/claim/claim_abc123/verify
Content-Type: application/json

{
  "code": "789456"
}
```

**Response:**
```javascript
{
  "success": true,
  "userId": "firebase-uid-123",
  "token": "firebase-custom-token",
  "message": "Perfil reclamado exitosamente"
}
```

**Implementación:**
```javascript
router.post('/api/suppliers/claim/:claimId/verify', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Código es requerido' });
    }
    
    const db = admin.firestore();
    const claimDoc = await db.collection('supplier_claims').doc(claimId).get();
    
    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    const claim = claimDoc.data();
    
    // Verificar que no haya expirado
    if (claim.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }
    
    // Verificar código
    if (claim.verificationCode !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }
    
    // Verificar que no esté ya verificado
    if (claim.verified) {
      return res.status(400).json({ error: 'Este claim ya fue verificado' });
    }
    
    // Crear/obtener usuario en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(claim.email);
    } catch (error) {
      // Usuario no existe, crearlo
      userRecord = await admin.auth().createUser({
        email: claim.email,
        displayName: claim.name,
        phoneNumber: claim.phone
      });
    }
    
    // Actualizar proveedor como "claimed"
    await db.collection('suppliers').doc(claim.supplierId).update({
      claimed: true,
      claimedBy: userRecord.uid,
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active' // Activar automáticamente al reclamar
    });
    
    // Actualizar claim como verificado
    await db.collection('supplier_claims').doc(claimId).update({
      verified: true,
      status: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Crear custom token para login automático
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    console.log(`✅ [CLAIM] Perfil ${claim.supplierId} reclamado por ${claim.email}`);
    
    res.json({ 
      success: true, 
      userId: userRecord.uid,
      token: customToken,
      supplierId: claim.supplierId,
      message: 'Perfil reclamado exitosamente'
    });
    
  } catch (error) {
    console.error('Error verifying claim:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### **3. PUT /api/suppliers/:id - Editar perfil (solo proveedor dueño)**

**Request:**
```javascript
PUT /api/suppliers/alfonso-calza-valencia
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "business": {
    "description": "Nueva descripción actualizada...",
    "priceRange": "€€€€",
    "minBudget": 2000,
    "maxBudget": 5000,
    "services": [
      "Fotografía de boda completa",
      "Preboda en localizaciones únicas",
      "Álbum de lujo"
    ],
    "availability": "busy"
  },
  "contact": {
    "phone": "+34 999 888 777",
    "whatsapp": "+34999888777",
    "instagram": "@alfonsocalza_oficial"
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Perfil actualizado"
}
```

**Implementación:**
```javascript
router.put('/api/suppliers/:id', authenticateSupplier, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.uid; // Del middleware de autenticación
    
    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    const supplier = doc.data();
    
    // Verificar que el usuario es el dueño del perfil
    if (supplier.claimedBy !== userId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para editar este perfil' 
      });
    }
    
    // Campos permitidos para editar
    const allowedFields = [
      'business.description',
      'business.priceRange',
      'business.minBudget',
      'business.maxBudget',
      'business.services',
      'business.availability',
      'business.responseTime',
      'contact.phone',
      'contact.whatsapp',
      'contact.instagram',
      'contact.facebook',
      'location.serviceArea',
      'media.logo',
      'media.cover',
      'media.portfolio'
    ];
    
    // Filtrar solo campos permitidos
    const safeUpdates = {};
    
    if (updates.business) {
      if (updates.business.description) safeUpdates['business.description'] = updates.business.description;
      if (updates.business.priceRange) safeUpdates['business.priceRange'] = updates.business.priceRange;
      if (updates.business.minBudget) safeUpdates['business.minBudget'] = updates.business.minBudget;
      if (updates.business.maxBudget) safeUpdates['business.maxBudget'] = updates.business.maxBudget;
      if (updates.business.services) safeUpdates['business.services'] = updates.business.services;
      if (updates.business.availability) safeUpdates['business.availability'] = updates.business.availability;
      if (updates.business.responseTime) safeUpdates['business.responseTime'] = updates.business.responseTime;
    }
    
    if (updates.contact) {
      if (updates.contact.phone) safeUpdates['contact.phone'] = updates.contact.phone;
      if (updates.contact.whatsapp) safeUpdates['contact.whatsapp'] = updates.contact.whatsapp;
      if (updates.contact.instagram) safeUpdates['contact.instagram'] = updates.contact.instagram;
      if (updates.contact.facebook) safeUpdates['contact.facebook'] = updates.contact.facebook;
    }
    
    if (updates.location && updates.location.serviceArea) {
      safeUpdates['location.serviceArea'] = updates.location.serviceArea;
    }
    
    if (updates.media) {
      if (updates.media.logo) safeUpdates['media.logo'] = updates.media.logo;
      if (updates.media.cover) safeUpdates['media.cover'] = updates.media.cover;
      if (updates.media.portfolio) safeUpdates['media.portfolio'] = updates.media.portfolio;
    }
    
    // Agregar metadatos
    safeUpdates.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    safeUpdates.updatedBy = userId;
    
    // Actualizar
    await docRef.update(safeUpdates);
    
    console.log(`✏️ [EDIT] ${id} actualizado por ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'Perfil actualizado' 
    });
    
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware de autenticación
async function authenticateSupplier(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
    
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}
```

---

## 🎨 UI COMPONENTS (Frontend)

### **Botón "Reclamar perfil"**
```jsx
// src/components/suppliers/ClaimButton.jsx

function ClaimButton({ supplierId, claimed }) {
  if (claimed) {
    return (
      <div className="text-sm text-green-600 flex items-center gap-1">
        <CheckCircle size={16} />
        Perfil verificado
      </div>
    );
  }
  
  return (
    <button 
      onClick={() => openClaimModal(supplierId)}
      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
    >
      <Edit size={16} />
      ¿Este es tu negocio? Reclámalo
    </button>
  );
}
```

### **Modal de claim**
```jsx
// src/components/suppliers/ClaimModal.jsx

function ClaimModal({ supplierId, onClose }) {
  const [step, setStep] = useState(1); // 1: form, 2: verify code
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [claimId, setClaimId] = useState(null);
  
  const handleSubmit = async () => {
    const response = await fetch(`/api/suppliers/${supplierId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setClaimId(data.claimId);
      setStep(2);
      toast.success('Código enviado a tu email');
    } else {
      toast.error(data.error);
    }
  };
  
  const handleVerify = async () => {
    const response = await fetch(`/api/suppliers/claim/${claimId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Login automático con el custom token
      await signInWithCustomToken(auth, data.token);
      toast.success('¡Perfil reclamado exitosamente!');
      navigate(`/proveedor/dashboard/${supplierId}`);
    } else {
      toast.error(data.error);
    }
  };
  
  return (
    <Modal isOpen onClose={onClose}>
      {step === 1 && (
        <div>
          <h2>Reclamar perfil</h2>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="tel" 
            placeholder="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleSubmit}>Enviar código</button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2>Verifica tu email</h2>
          <p>Ingresa el código de 6 dígitos que enviamos a {email}</p>
          <input 
            type="text" 
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerify}>Verificar</button>
        </div>
      )}
    </Modal>
  );
}
```

---

## 🔒 SEGURIDAD

### **Validaciones:**
1. ✅ Email debe coincidir con el registrado
2. ✅ Código expira en 1 hora
3. ✅ Solo el dueño puede editar su perfil
4. ✅ Campos editables limitados (no puede cambiar nombre, categoría, etc.)
5. ✅ No se puede reclamar un perfil ya reclamado

### **Rate limiting:**
```javascript
// Limitar intentos de claim
const rateLimit = require('express-rate-limit');

const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 intentos
  message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
});

router.post('/api/suppliers/:id/claim', claimLimiter, async (req, res) => {
  // ...
});
```

---

## 📚 SIGUIENTE PASO

Lee: **[Plan de Implementación](./PLAN-IMPLEMENTACION.md)** para ver los pasos detallados de implementación.
