/**
 * Endpoints de ayuda para tests E2E
 * Solo disponibles en NODE_ENV=development
 */

import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

// Middleware para verificar que estamos en desarrollo
const developmentOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ 
      error: 'Endpoints de test solo disponibles en desarrollo' 
    });
  }
  next();
};

router.use(developmentOnly);

// ============================================
// GESTIÓN DE USUARIOS DE TEST
// ============================================

/**
 * POST /api/test/create-user
 * Crear usuario de test en Firebase Auth
 */
router.post('/create-user', async (req, res) => {
  try {
    const { email, password, displayName, emailVerified } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    // Verificar si el usuario ya existe
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log(`[Test] Usuario ya existe: ${email}`);
      return res.status(200).json({
        uid: existingUser.uid,
        email: existingUser.email,
        message: 'Usuario ya existía'
      });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Crear usuario nuevo
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: typeof emailVerified === 'boolean' ? emailVerified : true // Para tests, verificamos automáticamente salvo que se indique lo contrario
    });

    console.log(`[Test] Usuario creado: ${email} (${userRecord.uid})`);

    // Crear perfil en Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      role: 'owner',
      emailVerified: typeof emailVerified === 'boolean' ? emailVerified : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestUser: true
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('[Test] Error al crear usuario:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario', 
      details: error.message 
    });
  }
});

/**
 * GET /api/test/users/by-email
 * Obtener usuario de Firebase Auth por email
 */
router.get('/users/by-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const userRecord = await admin.auth().getUserByEmail(String(email));

    return res.status(200).json({
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName || '',
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.error('[Test] Error al obtener usuario por email:', error);
    return res.status(500).json({
      error: 'Error al obtener usuario',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/test/delete-user/:uid
 * Eliminar usuario de test de Firebase Auth
 */
router.delete('/delete-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Eliminar perfil de Firestore
    await admin.firestore().collection('users').doc(uid).delete();

    // Eliminar usuario de Auth
    await admin.auth().deleteUser(uid);

    console.log(`[Test] Usuario eliminado: ${uid}`);
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('[Test] Error al eliminar usuario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar usuario', 
      details: error.message 
    });
  }
});

// ============================================
// GESTIÓN DE BODAS DE TEST
// ============================================

/**
 * POST /api/test/create-wedding
 * Crear boda de test en Firestore
 */
router.post('/create-wedding', async (req, res) => {
  try {
    const { name, date, venue, userId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nombre de boda requerido' });
    }

    // Si no se proporciona userId, usar uno de test
    const ownerId = userId || 'test-user-cypress';

    const weddingData = {
      name,
      date: date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      venue: venue || 'Lugar Test',
      ownerIds: [ownerId],
      plannerIds: [],
      assistantIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      isTestWedding: true,
      guestCount: 0,
      budget: 10000,
      status: 'planning'
    };

    // Crear boda en subcolección del usuario
    const weddingRef = await admin.firestore()
      .collection('users')
      .doc(ownerId)
      .collection('weddings')
      .add(weddingData);

    console.log(`[Test] Boda creada: ${name} (${weddingRef.id})`);

    res.status(201).json({
      wedding: {
        id: weddingRef.id,
        ...weddingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Test] Error al crear boda:', error);
    res.status(500).json({ 
      error: 'Error al crear boda', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/test/delete-wedding/:weddingId
 * Eliminar boda de test de Firestore
 */
router.delete('/delete-wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Buscar la boda en todas las subcolecciones de usuarios
    // (En producción esto sería más específico)
    const usersSnapshot = await admin.firestore().collection('users').get();

    let deleted = false;
    for (const userDoc of usersSnapshot.docs) {
      const weddingRef = userDoc.ref.collection('weddings').doc(weddingId);
      const weddingDoc = await weddingRef.get();
      
      if (weddingDoc.exists) {
        await weddingRef.delete();
        deleted = true;
        console.log(`[Test] Boda eliminada: ${weddingId}`);
        break;
      }
    }

    if (deleted) {
      res.status(200).json({ message: 'Boda eliminada' });
    } else {
      res.status(404).json({ error: 'Boda no encontrada' });
    }
  } catch (error) {
    console.error('[Test] Error al eliminar boda:', error);
    res.status(500).json({ 
      error: 'Error al eliminar boda', 
      details: error.message 
    });
  }
});

/**
 * DELETE /api/test/users/:userId/weddings
 * Eliminar todas las bodas de test de un usuario
 */
router.delete('/users/:userId/weddings', async (req, res) => {
  try {
    const { userId } = req.params;

    const weddingsSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('weddings')
      .where('isTestWedding', '==', true)
      .get();

    const deletePromises = weddingsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    console.log(`[Test] ${deletePromises.length} bodas eliminadas para usuario ${userId}`);

    res.status(200).json({ 
      message: 'Bodas eliminadas', 
      count: deletePromises.length 
    });
  } catch (error) {
    console.error('[Test] Error al eliminar bodas:', error);
    res.status(500).json({ 
      error: 'Error al eliminar bodas', 
      details: error.message 
    });
  }
});

// ============================================
// LIMPIEZA GENERAL
// ============================================

/**
 * POST /api/test/cleanup
 * Limpiar todos los datos de test
 */
router.post('/cleanup', async (req, res) => {
  try {
    let deletedCount = 0;

    // Eliminar usuarios de test
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('isTestUser', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      // Eliminar bodas del usuario
      const weddingsSnapshot = await userDoc.ref.collection('weddings').get();
      for (const weddingDoc of weddingsSnapshot.docs) {
        await weddingDoc.ref.delete();
        deletedCount++;
      }

      // Eliminar usuario de Firestore
      await userDoc.ref.delete();

      // Eliminar usuario de Auth
      try {
        await admin.auth().deleteUser(userDoc.id);
      } catch (error) {
        console.warn(`[Test] No se pudo eliminar usuario de Auth: ${userDoc.id}`);
      }

      deletedCount++;
    }

    console.log(`[Test] Limpieza completada: ${deletedCount} elementos eliminados`);

    res.status(200).json({ 
      message: 'Limpieza completada', 
      deletedCount 
    });
  } catch (error) {
    console.error('[Test] Error en limpieza:', error);
    res.status(500).json({ 
      error: 'Error en limpieza', 
      details: error.message 
    });
  }
});

// ============================================
// INVITADOS DE TEST
// ============================================

/**
 * POST /api/weddings/:weddingId/guests
 * Crear invitado de test
 */
router.post('/weddings/:weddingId/guests', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { name, email, phone, confirmed } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nombre de invitado requerido' });
    }

    const guestData = {
      name,
      email: email || `guest-${Date.now()}@test.com`,
      phone: phone || '+34600000000',
      confirmed: confirmed || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isTestGuest: true
    };

    // Buscar la boda y crear invitado
    // (Simplificado para el ejemplo)
    const usersSnapshot = await admin.firestore().collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'No hay usuarios para asociar la boda' });
    }

    const userId = usersSnapshot.docs[0].id;
    const guestRef = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('weddings')
      .doc(weddingId)
      .collection('guests')
      .add(guestData);

    console.log(`[Test] Invitado creado: ${name} (${guestRef.id})`);

    res.status(201).json({
      guest: {
        id: guestRef.id,
        ...guestData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Test] Error al crear invitado:', error);
    res.status(500).json({ 
      error: 'Error al crear invitado', 
      details: error.message 
    });
  }
});

/**
 * POST /api/weddings/:weddingId/guests/bulk
 * Crear múltiples invitados de test
 */
router.post('/weddings/:weddingId/guests/bulk', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { guests } = req.body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ error: 'Array de invitados requerido' });
    }

    // Buscar usuario y boda
    const usersSnapshot = await admin.firestore().collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'No hay usuarios' });
    }

    const userId = usersSnapshot.docs[0].id;
    const guestsRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('weddings')
      .doc(weddingId)
      .collection('guests');

    const batch = admin.firestore().batch();
    const createdGuests = [];

    guests.forEach((guest) => {
      const newGuestRef = guestsRef.doc();
      const guestData = {
        name: guest.name || 'Invitado Test',
        email: guest.email || `guest-${Date.now()}@test.com`,
        phone: guest.phone || '+34600000000',
        confirmed: guest.confirmed || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isTestGuest: true
      };
      batch.set(newGuestRef, guestData);
      createdGuests.push({ id: newGuestRef.id, ...guestData });
    });

    await batch.commit();

    console.log(`[Test] ${guests.length} invitados creados en bulk`);

    res.status(201).json({
      guests: createdGuests
    });
  } catch (error) {
    console.error('[Test] Error al crear invitados en bulk:', error);
    res.status(500).json({ 
      error: 'Error al crear invitados', 
      details: error.message 
    });
  }
});

export default router;
