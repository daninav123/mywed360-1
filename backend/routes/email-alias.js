import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * POST /api/email-alias/update
 * Actualiza el email alias del usuario
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, alias } = req.body;

    // Validación
    if (!userId || !alias) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId y alias son requeridos' 
      });
    }

    // Validar formato del alias
    if (alias.length < 3 || alias.length > 30) {
      return res.status(400).json({ 
        success: false, 
        error: 'El alias debe tener entre 3 y 30 caracteres' 
      });
    }

    if (!/^[a-z0-9._-]+$/.test(alias)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se permiten letras minúsculas, números, puntos, guiones' 
      });
    }

    const newEmail = `${alias}@malove.app`;

    console.log(`[email-alias] Actualizando email para usuario ${userId} a ${newEmail}`);

    // 1. Verificar disponibilidad
    const usernameDoc = await db.collection('emailUsernames').doc(alias).get();
    if (usernameDoc.exists) {
      const data = usernameDoc.data();
      if (data.userId !== userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Este alias ya está en uso' 
        });
      }
    }

    // 2. Actualizar usuario
    await db.collection('users').doc(userId).set({
      maLoveEmail: newEmail,
      emailUsername: alias,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 3. Reservar username
    await db.collection('emailUsernames').doc(alias).set({
      userId: userId,
      email: newEmail,
      createdAt: new Date().toISOString()
    });

    console.log(`[email-alias] ✅ Email actualizado correctamente a ${newEmail}`);

    res.json({ 
      success: true, 
      email: newEmail,
      message: 'Email actualizado correctamente'
    });

  } catch (error) {
    console.error('[email-alias] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/email-alias/check/:alias
 * Verifica si un alias está disponible
 */
router.get('/check/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const { userId } = req.query;

    if (!alias) {
      return res.status(400).json({ 
        success: false, 
        error: 'Alias requerido' 
      });
    }

    const usernameDoc = await db.collection('emailUsernames').doc(alias).get();
    
    if (!usernameDoc.exists) {
      return res.json({ 
        success: true, 
        available: true 
      });
    }

    const data = usernameDoc.data();
    const available = data.userId === userId;

    res.json({ 
      success: true, 
      available,
      message: available ? 'Disponible' : 'Ya está en uso'
    });

  } catch (error) {
    console.error('[email-alias] Error checking alias:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
