import express from 'express';
import admin from 'firebase-admin';
import pkg from 'pg';
import logger from '../utils/logger.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// POST /api/weddings - Crear nueva boda en PostgreSQL
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('[weddings] POST - Creating wedding');
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autenticado' 
      });
    }

    const { 
      coupleName, 
      weddingDate, 
      celebrationPlace, 
      status, 
      numGuests,
      eventType 
    } = req.body;

    console.log('[weddings] Creating wedding for user:', userId);
    console.log('[weddings] Data:', { coupleName, weddingDate });

    const result = await pool.query(`
      INSERT INTO weddings (
        "userId",
        "coupleName",
        "weddingDate",
        "celebrationPlace",
        status,
        "numGuests",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      coupleName || 'Mi Boda',
      weddingDate || null,
      celebrationPlace || null,
      status || 'planning',
      numGuests || null
    ]);

    const wedding = result.rows[0];
    console.log('[weddings] Wedding created:', wedding.id);

    res.json({
      success: true,
      data: wedding
    });
  } catch (error) {
    console.error('[weddings] Error creating wedding:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/weddings/:weddingId/permissions/autofix
// Añade al usuario autenticado a plannerIds de la boda si tiene relación válida
// Criterios de autorización:
//  - Admin siempre permitido
//  - Existe users/{uid}/weddings/{weddingId}
//  - O ya consta en ownerIds/plannerIds/assistantIds en weddings/{weddingId}
router.post('/:weddingId/permissions/autofix', requireAuth, async (req, res) => {
  try {
    const weddingId = String(req.params.weddingId || '').trim();
    const uid = req?.user?.uid || '';
    const role = String(req?.userProfile?.role || '').toLowerCase();

    if (!weddingId) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'bad_request', message: 'weddingId requerido' } });
    }
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'unauthenticated', message: 'Usuario no autenticado' },
      });
    }

    const isAdmin = role === 'admin';

    const db = admin.firestore();

    // Cargar doc principal de la boda
    const wedRef = db.collection('weddings').doc(weddingId);
    const wedSnap = await wedRef.get();
    if (!wedSnap.exists) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'not_found', message: 'Boda no encontrada' } });
    }
    const wdata = wedSnap.data() || {};

    // Comprobar relación existente en doc principal
    const owners = Array.isArray(wdata.ownerIds) ? wdata.ownerIds : [];
    const planners = Array.isArray(wdata.plannerIds) ? wdata.plannerIds : [];
    const assistants = Array.isArray(wdata.assistantIds) ? wdata.assistantIds : [];
    const alreadyLinked =
      owners.includes(uid) || planners.includes(uid) || assistants.includes(uid);

    // Comprobar relación en subcolección del usuario
    let listedInUserSubcol = false;
    try {
      const userWedRef = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
      const userWedSnap = await userWedRef.get();
      listedInUserSubcol = userWedSnap.exists;
    } catch {}

    if (!isAdmin && !listedInUserSubcol && !alreadyLinked) {
      // No hay relación previa -> denegar por seguridad
      return res.status(403).json({
        success: false,
        error: { code: 'forbidden', message: 'No tienes relación con esta boda' },
      });
    }

    // Si ya está en plannerIds, devolver idempotente
    if (planners.includes(uid)) {
      return res.json({ success: true, action: 'already_member', role: 'planner', weddingId, uid });
    }

    // Añadir como planner (idempotente con arrayUnion)
    try {
      const { FieldValue } = await import('firebase-admin/firestore');
      await wedRef.set(
        { plannerIds: FieldValue.arrayUnion(uid), updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      logger.info(`[autofix] planner añadido ${uid} -> wedding ${weddingId}`);
      return res.json({ success: true, action: 'added', role: 'planner', weddingId, uid });
    } catch (e) {
      logger.error('[autofix] error añadiendo planner:', e);
      return res.status(500).json({
        success: false,
        error: { code: 'internal_error', message: 'No se pudo actualizar la boda' },
      });
    }
  } catch (e) {
    logger.error('[autofix] exception:', e);
    return res
      .status(500)
      .json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

export default router;

// Rutas de soporte para E2E/Desarrollo (no producción salvo flag explícita)
// POST /api/weddings/dev/seed
// Crea/actualiza bodas para el usuario autenticado como planner y las vincula en users/{uid}/weddings
router.post('/dev/seed', requireAuth, async (req, res) => {
  try {
    const allowProd = String(process.env.ENABLE_DEV_SEED || 'false').toLowerCase() === 'true';
    const isProd = String(process.env.NODE_ENV || 'production').toLowerCase() === 'production';
    if (isProd && !allowProd) {
      return res.status(403).json({
        ok: false,
        error: { code: 'forbidden', message: 'dev/seed deshabilitado en producción' },
      });
    }

    const uid = req?.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, error: { code: 'unauthenticated' } });

    const payload = req.body || {};
    const items = Array.isArray(payload.weddings) ? payload.weddings : [];
    const activeIdReq = typeof payload.activeId === 'string' ? payload.activeId.trim() : '';

    const db = admin.firestore();
    const created = [];
    const batch = db.batch();

    for (const it of items) {
      try {
        const id =
          (typeof it?.id === 'string' && it.id.trim()) || db.collection('weddings').doc().id;
        const wedRef = db.collection('weddings').doc(id);
        const base = {
          name: it?.name || 'Boda',
          weddingDate: it?.weddingDate || it?.date || '',
          location: it?.location || '',
          progress: Number.isFinite(Number(it?.progress)) ? Number(it.progress) : 0,
          active: it?.active !== false,
          ownerIds: Array.isArray(it?.ownerIds) ? it.ownerIds : [],
          plannerIds: admin.firestore.FieldValue.arrayUnion(uid),
          assistantIds: Array.isArray(it?.assistantIds) ? it.assistantIds : [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(wedRef, base, { merge: true });

        const subRef = db.collection('users').doc(uid).collection('weddings').doc(id);
        batch.set(
          subRef,
          {
            id,
            name: base.name,
            weddingDate: base.weddingDate,
            location: base.location,
            progress: base.progress,
            active: base.active,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        created.push(id);
      } catch (e) {
        logger.warn('[dev/seed] item error:', e);
      }
    }

    await batch.commit();

    const activeId =
      activeIdReq && created.includes(activeIdReq) ? activeIdReq : created[0] || null;
    if (activeId) {
      try {
        await db.collection('users').doc(uid).set(
          {
            activeWeddingId: activeId,
            hasActiveWedding: true,
            lastActiveWeddingAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        await db
          .collection('users')
          .doc(uid)
          .collection('weddings')
          .doc(activeId)
          .set(
            { active: true, lastAccessedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
      } catch (e) {
        logger.warn('[dev/seed] could not set active wedding for user', e);
      }
    }

    return res.json({ ok: true, created, activeId });
  } catch (e) {
    logger.error('[dev/seed] exception:', e);
    return res
      .status(500)
      .json({ ok: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});
