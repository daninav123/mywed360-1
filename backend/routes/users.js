import express from 'express';
import admin from 'firebase-admin';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

const router = express.Router();

// POST /api/users/upgrade-role
// Body: { newRole: 'assistant'|'planner'|'owner', tier?: string }
// Efectos:
//  - Actualiza users/{uid} con { role, subscription.tier }
//  - Registra roleHistory
//  - Inicializa plannerWeddingIds si aplica
router.post('/upgrade-role', async (req, res) => {
  try {
    const uid = req?.user?.uid || '';
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'unauthenticated', message: 'Usuario no autenticado' },
      });
    }

    const rawRole = String(req.body?.newRole || '')
      .trim()
      .toLowerCase();
    const allowed = new Set(['owner', 'assistant', 'planner']);
    if (!allowed.has(rawRole)) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'bad_request', message: 'newRole inválido' } });
    }

    const tier =
      String(req.body?.tier || '').trim() ||
      (rawRole === 'planner'
        ? 'wedding_planner_1'
        : rawRole === 'assistant'
          ? 'assistant'
          : 'free');

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    const before = snap.exists ? snap.data() || {} : {};
    const prevRole = String(before.role || 'particular');

    // Validaciones de plan básicas
    if (rawRole === 'planner') {
      // Si ya es planner, permitir idempotente; si no, realizar upgrade
      // (Validaciones de pago real deberían ocurrir fuera y reflejarse en `tier`)
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const roleHistoryEntry = {
      from: prevRole,
      to: rawRole,
      at: admin.firestore.Timestamp.now(),
      reason: 'upgrade',
    };

    const payload = {
      role: rawRole,
      subscription: { ...(before.subscription || {}), tier },
      updatedAt: now,
    };

    // Inicializar campos relacionados con planner
    if (rawRole === 'planner') {
      payload.plannerWeddingIds = Array.isArray(before.plannerWeddingIds)
        ? before.plannerWeddingIds
        : [];
    }

    // Persistir cambios
    await userRef.set(payload, { merge: true });
    try {
      await userRef.set(
        { roleHistory: admin.firestore.FieldValue.arrayUnion(roleHistoryEntry) },
        { merge: true }
      );
    } catch {}

    logger.info(`[users] upgrade-role ${uid}: ${prevRole} -> ${rawRole} (tier=${tier})`);
    return res.json({ success: true, role: rawRole, subscription: { tier } });
  } catch (e) {
    logger.error('[users] upgrade-role error', e);
    return res
      .status(500)
      .json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

// PATCH /api/users/profile
// Body: { account: {...}, billing: {...}, subscription: string }
// Guarda el perfil del usuario en PostgreSQL
router.patch('/profile', async (req, res) => {
  try {
    const uid = req?.user?.uid;
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'unauthenticated', message: 'Usuario no autenticado' },
      });
    }

    const { account, billing, subscription } = req.body;

    // Validaciones básicas
    if (account?.email && !/^\S+@\S+\.\S+$/.test(account.email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'invalid_email', message: 'Email inválido' },
      });
    }

    if (account?.whatsNumber && !/^\+?[0-9]{8,15}$/.test(account.whatsNumber.trim())) {
      return res.status(400).json({
        success: false,
        error: { code: 'invalid_whatsapp', message: 'WhatsApp inválido' },
      });
    }

    // Buscar usuario por Firebase UID (asumiendo que existe campo firebaseUid o email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: req.user.email },
          { id: uid }
        ]
      },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'user_not_found', message: 'Usuario no encontrado' },
      });
    }

    // Preparar datos para guardar en JSON
    const profileData = {
      account: account || {},
      billing: billing || {},
      subscription: subscription || 'free',
    };

    // Actualizar o crear UserProfile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phone: account?.whatsNumber || null,
        settings: profileData,
      },
      update: {
        phone: account?.whatsNumber || null,
        settings: profileData,
        updatedAt: new Date(),
      },
    });

    logger.info(`[users] profile updated for user ${user.id}`);

    return res.json({
      success: true,
      profile: {
        account: profileData.account,
        billing: profileData.billing,
        subscription: profileData.subscription,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (e) {
    logger.error('[users] profile update error', e);
    return res.status(500).json({
      success: false,
      error: { code: 'internal_error', message: 'Error al guardar perfil' },
    });
  }
});

// GET /api/users/profile
// Obtiene el perfil del usuario desde PostgreSQL
router.get('/profile', async (req, res) => {
  try {
    const uid = req?.user?.uid || '';
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'unauthenticated', message: 'Usuario no autenticado' },
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: req.user.email },
          { id: uid }
        ]
      },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'user_not_found', message: 'Usuario no encontrado' },
      });
    }

    const profileSettings = user.profile?.settings || {};

    return res.json({
      success: true,
      profile: {
        account: profileSettings.account || {},
        billing: profileSettings.billing || {},
        subscription: profileSettings.subscription || 'free',
        updatedAt: user.profile?.updatedAt,
        myWed360Email: user.profile?.myWed360Email,
        maLoveEmail: user.profile?.maLoveEmail,
      },
    });
  } catch (e) {
    logger.error('[users] profile get error', e);
    return res.status(500).json({
      success: false,
      error: { code: 'internal_error', message: 'Error al cargar perfil' },
    });
  }
});

export default router;
