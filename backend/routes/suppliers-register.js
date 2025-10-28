// routes/suppliers-register.js
// 🎯 FASE 3: REGISTRO Y GESTIÓN DE PROVEEDORES
// 
// Permite a proveedores:
// - Registrarse en la plataforma
// - Reclamar perfil existente
// - Gestionar su información

import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

const router = express.Router();

// POST /api/suppliers/register - Registrar nuevo proveedor
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      category, 
      location, 
      phone,
      website,
      description 
    } = req.body;
    
    // Validaciones
    if (!email || !password || !name || !category || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, nombre, categoría y ubicación son requeridos' 
      });
    }
    
    console.log(`\n📝 [REGISTER] Nuevo proveedor: ${name} (${email})`);
    
    const db = admin.firestore();
    
    // 1. Verificar si el email ya existe en Firebase Auth
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        error: 'Este email ya está registrado. Intenta iniciar sesión.'
      });
    } catch (error) {
      // Usuario no existe, continuar con registro
      if (error.code !== 'auth/user-not-found') {
        throw error; // Otro error
      }
    }
    
    // 2. Buscar si ya existe un perfil "discovered" con ese email
    const existingProfileSnapshot = await db.collection('suppliers')
      .where('contact.email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    let supplierId;
    let isClaimedProfile = false;
    
    if (!existingProfileSnapshot.empty) {
      // ✅ EXISTE: Reclamar perfil existente
      const existingDoc = existingProfileSnapshot.docs[0];
      supplierId = existingDoc.id;
      
      console.log(`✅ [CLAIM] Perfil existente encontrado: ${supplierId}`);
      
      // Crear usuario en Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });
      
      // Actualizar perfil a "registered"
      await db.collection('suppliers').doc(supplierId).update({
        registered: true,
        status: 'active',
        claimedBy: userRecord.uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        
        // Actualizar datos si los proporciona
        ...(phone && { 'contact.phone': phone }),
        ...(website && { 'contact.website': website }),
        ...(description && { 'business.description': description })
      });
      
      isClaimedProfile = true;
      console.log(`✅ [CLAIM] Perfil reclamado por ${userRecord.uid}`);
      
    } else {
      // ❌ NO EXISTE: Crear nuevo perfil
      console.log(`🆕 [NEW] Creando nuevo perfil para ${name}`);
      
      // Crear usuario en Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });
      
      // Crear slug único
      const slug = createSlug(name, location);
      supplierId = slug;
      
      // Crear perfil en Firestore
      await db.collection('suppliers').doc(supplierId).set({
        // Básicos
        name,
        slug,
        category,
        tags: [],
        
        // Ubicación
        location: {
          city: location,
          province: '',
          country: 'España',
          address: '',
          coordinates: null
        },
        
        // Contacto
        contact: {
          email: email.toLowerCase(),
          emailVerified: false,
          phone: phone || '',
          phoneVerified: false,
          website: website || '',
          instagram: '',
          facebook: '',
          whatsapp: phone || ''
        },
        
        // Business
        business: {
          description: description || '',
          priceRange: '',
          minBudget: 0,
          maxBudget: 0,
          services: [],
          serviceArea: [location],
          availability: 'available',
          yearsExperience: 0
        },
        
        // Media
        media: {
          logo: '',
          cover: '',
          portfolio: [],
          videos: []
        },
        
        // Métricas
        metrics: {
          matchScore: 80, // Score inicial para nuevos registrados
          views: 0,
          clicks: 0,
          conversions: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: 0,
          lastContactDate: null
        },
        
        // Estado
        registered: true,
        source: 'registration',
        status: 'active',
        verified: false, // Verificación manual/automática posterior
        
        // Claim
        claimed: true,
        claimedBy: userRecord.uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        
        // Timestamps
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userRecord.uid,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        
        // Plan (futuro)
        subscription: {
          plan: 'free',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: null,
          features: ['basic-listing']
        }
      });
      
      console.log(`✅ [NEW] Perfil creado: ${supplierId}`);
    }
    
    // 3. Generar token personalizado para login automático
    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      role: 'supplier',
      supplierId
    });
    
    // 4. Enviar email de verificación (opcional)
    // TODO: Implementar envío de email
    
    res.json({
      success: true,
      message: isClaimedProfile ? 'Perfil reclamado exitosamente' : 'Registro exitoso',
      supplierId,
      customToken,
      isClaimedProfile,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
    
  } catch (error) {
    console.error('❌ [REGISTER] Error:', error);
    logger.error('[suppliers-register] Error en registro', { 
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Error registrando proveedor'
    });
  }
});

// POST /api/suppliers/login - Login de proveedor
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email y password son requeridos' 
      });
    }
    
    // Firebase Auth se maneja desde el frontend
    // Este endpoint es solo para obtener datos adicionales
    
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Buscar perfil de proveedor
    const db = admin.firestore();
    const supplierSnapshot = await db.collection('suppliers')
      .where('claimedBy', '==', userRecord.uid)
      .limit(1)
      .get();
    
    if (supplierSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró perfil de proveedor para este usuario'
      });
    }
    
    const supplierDoc = supplierSnapshot.docs[0];
    const supplier = { id: supplierDoc.id, ...supplierDoc.data() };
    
    // Generar custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      role: 'supplier',
      supplierId: supplierDoc.id
    });
    
    res.json({
      success: true,
      customToken,
      supplier,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
    
  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/suppliers/profile/:id - Obtener perfil (solo el dueño)
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado' 
      });
    }
    
    // Verificar token
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const db = admin.firestore();
    const doc = await db.collection('suppliers').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    const supplier = { id: doc.id, ...doc.data() };
    
    // Verificar que es el dueño
    if (supplier.claimedBy !== decodedToken.uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permiso para ver este perfil' 
      });
    }
    
    res.json({
      success: true,
      supplier
    });
    
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/suppliers/profile/:id - Actualizar perfil (solo el dueño)
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autorizado' 
      });
    }
    
    // Verificar token
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const db = admin.firestore();
    const docRef = db.collection('suppliers').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Proveedor no encontrado' 
      });
    }
    
    const supplier = doc.data();
    
    // Verificar que es el dueño
    if (supplier.claimedBy !== decodedToken.uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permiso para editar este perfil' 
      });
    }
    
    // Campos permitidos para actualizar
    const allowedFields = [
      'name', 'business.description', 'business.priceRange', 
      'business.minBudget', 'business.maxBudget', 'business.services',
      'business.serviceArea', 'business.availability', 'business.yearsExperience',
      'contact.phone', 'contact.website', 'contact.instagram', 
      'contact.facebook', 'contact.whatsapp',
      'media.logo', 'media.cover', 'media.portfolio', 'media.videos',
      'location.address', 'location.coordinates',
      'tags'
    ];
    
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }
    
    updates.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    await docRef.update(updates);
    
    console.log(`✅ [UPDATE] Perfil actualizado: ${id}`);
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Función auxiliar para crear slug
function createSlug(name, city) {
  const namePart = (name || 'proveedor')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
  
  const cityPart = (city || 'espana')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  // Añadir timestamp para asegurar unicidad
  const timestamp = Date.now().toString().slice(-6);
  
  return `${namePart}-${cityPart}-${timestamp}`;
}

export default router;
