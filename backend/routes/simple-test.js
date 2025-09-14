import express from 'express';
import { db } from '../db.js';
import admin from 'firebase-admin';

const router = express.Router();

/**
 * Endpoint de test simple sin dependencias externas
 * Para verificar que las rutas se registran correctamente
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
});

/**
 * Test de Mailgun simplificado
 */
router.get('/mailgun', (req, res) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;
  
  res.status(200).json({
    success: true,
    message: 'Mailgun test endpoint working',
    config: {
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN,
      apiKeyPrefix: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 8) + '...' : 'not_set',
      domain: MAILGUN_DOMAIN || 'not_set'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Test de variables de entorno
 */
router.get('/env', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Environment test endpoint working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
      hasMailgunKey: !!process.env.MAILGUN_API_KEY,
      hasMailgunDomain: !!process.env.MAILGUN_DOMAIN,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Seeds mínimos para pruebas locales/E2E
 */
router.post('/seed/wedding', async (req, res) => {
  try {
    const weddingId = String(req.body?.weddingId || 'w1');
    const name = String(req.body?.name || 'Demo Wedding');
    const wRef = db.collection('weddings').doc(weddingId);
    await wRef.set({
      id: weddingId,
      name,
      date: new Date().toISOString().slice(0, 10),
      ownerIds: ['local-owner'],
      plannerIds: ['local-planner'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Crear invitados básicos: 3 confirmados, 7 pendientes
    const guests = [];
    for (let i = 1; i <= 10; i++) {
      const id = `g${i}`;
      const confirmed = i <= 3;
      guests.push({
        id,
        name: confirmed ? `Invitado Confirmado ${i}` : `Invitado Pendiente ${i}`,
        status: confirmed ? 'confirmed' : 'pending',
        response: confirmed ? 'Sí' : 'Pendiente',
        companion: confirmed && i === 1 ? 1 : 0,
        phone: `+34999999${(100 + i).toString().slice(-3)}`,
        email: `guest${i}@example.com`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    const batch = db.batch();
    guests.forEach(g => {
      const gRef = wRef.collection('guests').doc(g.id);
      batch.set(gRef, g, { merge: true });
    });
    await batch.commit();

    res.json({ success: true, weddingId, guests: guests.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'seed error' });
  }
});

router.post('/seed/seating', async (req, res) => {
  try {
    const weddingId = String(req.body?.weddingId || 'w1');
    const wRef = db.collection('weddings').doc(weddingId);
    const planRef = wRef.collection('seatingPlan').doc('banquet');
    const tables = [];
    // Plantilla 3x4 con 8 sillas
    let tId = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        tables.push({ id: tId, x: 120 + c * 140, y: 160 + r * 160, shape: 'circle', seats: 8, name: `Mesa ${tId}` });
        tId += 1;
      }
    }
    await planRef.set({
      config: { width: 1800, height: 1200, aisleMin: 80 },
      tables,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ success: true, tables: tables.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'seed error' });
  }
});

router.post('/seed/emails', async (req, res) => {
  try {
    const to = String(req.body?.to || 'usuario.test@lovenda.com');
    const from = String(req.body?.from || 'proveedor@example.com');
    const now = new Date().toISOString();
    const sent = await db.collection('mails').add({ id: '', from, to, subject: 'Presupuesto catering', body: 'Adjunto presupuesto de catering para 120 personas.', date: now, folder: 'inbox', read: false });
    await db.collection('mails').doc(sent.id).update({ id: sent.id });
    res.json({ success: true, count: 1, ids: [sent.id] });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'seed error' });
  }
});

router.post('/seed/budgets', async (req, res) => {
  try {
    const weddingId = String(req.body?.weddingId || 'w1');
    const supplierId = String(req.body?.supplierId || 'supplier1');
    const bRef = db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId).collection('budgets').doc();
    const data = {
      id: bRef.id,
      supplierName: 'Proveedor Catering',
      supplierEmail: 'catering@example.com',
      description: 'Banquete 120 pax',
      amount: 4200,
      currency: 'EUR',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await bRef.set(data);
    res.json({ success: true, budgetId: bRef.id });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'seed error' });
  }
});

router.post('/cleanup', async (_req, res) => {
  try {
    // Limpieza best-effort: borrar mails globales recientes y subcolecciones seed básicas
    const mails = await db.collection('mails').limit(50).get();
    const batch = db.batch();
    mails.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'cleanup error' });
  }
});

export default router;
