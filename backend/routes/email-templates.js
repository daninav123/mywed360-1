import express from 'express';
import { randomUUID } from 'crypto';

import logger from '../logger.js';
import { db } from '../db.js';

const router = express.Router();
const COLLECTION = 'email_templates';

// Plantillas de email predefinidas para MyWed360
const EMAIL_TEMPLATES = [
  {
    id: 'wedding-invitation',
    name: 'Invitación de Boda',
    subject: '¡Estás invitado/a a nuestra boda! 💕',
    body: `¡Hola!

Nos complace invitarte a celebrar nuestro gran día con nosotros.

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
📍 Lugar: [LUGAR]

Tu presencia haría que este día sea aún más especial.

¡Esperamos verte allí!

Con amor,
[NOMBRES]`,
    category: 'invitation',
  },
  {
    id: 'save-the-date',
    name: 'Reserva la Fecha',
    subject: '¡Reserva la fecha! 📅 Nuestra boda',
    body: `¡Hola querido/a [NOMBRE]!

Queremos que seas uno de los primeros en saberlo...

¡NOS CASAMOS! 💍

📅 Fecha: [FECHA]
📍 Ciudad: [CIUDAD]

La invitación formal llegará pronto, pero queríamos asegurarnos de que reserves esta fecha especial.

¡No podemos esperar a celebrar contigo!

Con cariño,
[NOMBRES]`,
    category: 'save-the-date',
  },
  {
    id: 'thank-you',
    name: 'Agradecimiento',
    subject: 'Gracias por hacer nuestro día tan especial ❤️',
    body: `Querido/a [NOMBRE],

No tenemos palabras para expresar lo agradecidos que estamos por haber compartido nuestro día especial con nosotros.

Tu presencia, tu cariño y tu alegría hicieron que nuestra boda fuera perfecta.

Gracias por ser parte de nuestra historia de amor.

Con todo nuestro amor,
[NOMBRES]`,
    category: 'thank-you',
  },
  {
    id: 'rsvp-reminder',
    name: 'Recordatorio RSVP',
    subject: 'Recordatorio: Confirma tu asistencia a nuestra boda',
    body: `¡Hola [NOMBRE]!

Esperamos que hayas recibido nuestra invitación de boda.

Nos encantaría saber si podrás acompañarnos en nuestro gran día:

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
📍 Lugar: [LUGAR]

Por favor, confirma tu asistencia antes del [FECHA_LIMITE].

¡Esperamos celebrar contigo!

Con amor,
[NOMBRES]`,
    category: 'rsvp',
  },
  {
    id: 'vendor-inquiry',
    name: 'Consulta a Proveedor',
    subject: 'Consulta para servicios de boda - [FECHA]',
    body: `Estimado/a [PROVEEDOR],

Esperamos que se encuentre bien. Nos ponemos en contacto porque estamos organizando nuestra boda y estamos interesados en sus servicios.

Detalles del evento:
📅 Fecha: [FECHA]
👥 Número de invitados: [INVITADOS]
📍 Ubicación: [LUGAR]

Nos gustaría conocer:
- Disponibilidad para la fecha
- Paquetes disponibles
- Precios
- Condiciones de contratación

Quedamos a la espera de su respuesta.

Saludos cordiales,
[NOMBRES]
[TELEFONO]
[EMAIL]`,
    category: 'vendor',
  },
];

function sanitizeString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function buildTemplateResponse(template) {
  const data = { ...template };
  data.lastModified = template.updatedAt || template.lastModified || template.createdAt || new Date().toISOString();
  return data;
}

async function loadCustomTemplates(ownerUid) {
  if (!ownerUid) return [];
  try {
    const snap = await db
      .collection(COLLECTION)
      .where('ownerUid', '==', ownerUid)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();
    return snap.docs.map((doc) => buildTemplateResponse({ id: doc.id, ...doc.data(), owner: ownerUid, editable: true }));
  } catch (error) {
    logger.warn('[email-templates] No se pudieron cargar plantillas personalizadas', error?.message || error);
    return [];
  }
}

async function loadTemplateById(id) {
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return buildTemplateResponse({ id: snap.id, ...snap.data(), editable: true });
  } catch (error) {
    logger.warn('[email-templates] No se pudo obtener plantilla personalizada', id, error?.message || error);
    return null;
  }
}

/**
 * GET /api/email-templates
 * Obtiene las plantillas de email disponibles para el usuario
 */
router.get('/', async (req, res) => {
  try {
    const authUser = req.user || null;
    const ownerUid = authUser?.uid || null;
    logger.info(`[email-templates] Listando plantillas${ownerUid ? ` para uid ${ownerUid}` : ''}`);

    const defaults = EMAIL_TEMPLATES.map((template) => ({
      ...buildTemplateResponse(template),
      owner: 'system',
      editable: false,
    }));

    const custom = ownerUid ? await loadCustomTemplates(ownerUid) : [];

    const templates = [...defaults, ...custom];

    res.json({
      success: true,
      templates,
      total: templates.length,
    });
  } catch (error) {
    logger.error('Error obteniendo plantillas de email:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
});

/**
 * GET /api/email-templates/:id
 * Obtiene una plantilla específica por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template =
      EMAIL_TEMPLATES.find((t) => t.id === id) ||
      (await loadTemplateById(id));

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Plantilla no encontrada',
      });
    }

    logger.info(`Plantilla ${id} obtenida correctamente`);

    res.json({
      success: true,
      template: buildTemplateResponse(template),
    });
  } catch (error) {
    logger.error('Error obteniendo plantilla:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
});

/**
 * POST /api/email-templates
 * Crea una nueva plantilla personalizada
 */
router.post('/', async (req, res) => {
  try {
    const user = req.user;
    if (!user?.uid) {
      return res.status(401).json({
        success: false,
        error: 'auth-required',
        message: 'Se requiere autenticación para crear plantillas',
      });
    }

    const { name, subject, body, category } = req.body || {};
    const templateName = sanitizeString(name);
    const templateSubject = sanitizeString(subject);
    const templateBody = sanitizeString(body);
    const templateCategory = sanitizeString(category, 'custom');

    if (!templateName || !templateSubject || !templateBody) {
      return res.status(400).json({
        success: false,
        error: 'invalid-payload',
        message: 'Los campos name, subject y body son obligatorios',
      });
    }

    const now = new Date().toISOString();
    const id = `tpl-${randomUUID()}`;
    const payload = {
      id,
      name: templateName,
      subject: templateSubject,
      body: templateBody,
      category: templateCategory,
      ownerUid: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTION).doc(id).set(payload, { merge: false });

    res.status(201).json({
      success: true,
      template: buildTemplateResponse({ ...payload, owner: user.uid, editable: true }),
    });
  } catch (error) {
    logger.error('Error creando plantilla:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
});

/**
 * PUT /api/email-templates/:templateId
 * Actualiza una plantilla personalizada existente
 */
router.put('/:id', async (req, res) => {
  try {
    const user = req.user;
    if (!user?.uid) {
      return res.status(401).json({
        success: false,
        error: 'auth-required',
        message: 'Se requiere autenticación para actualizar plantillas',
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'invalid-id' });
    }

    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ success: false, error: 'not-found' });
    }

    const existing = snap.data() || {};
    const profile = req.userProfile || {};
    const role = String(profile.role || '').toLowerCase();
    const isPrivileged = role === 'admin' || role === 'planner';
    if (!isPrivileged && existing.ownerUid && existing.ownerUid !== user.uid) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    const updates = {};
    if (typeof req.body?.name === 'string') updates.name = sanitizeString(req.body.name, existing.name);
    if (typeof req.body?.subject === 'string') updates.subject = sanitizeString(req.body.subject, existing.subject);
    if (typeof req.body?.body === 'string') updates.body = sanitizeString(req.body.body, existing.body);
    if (typeof req.body?.category === 'string') updates.category = sanitizeString(req.body.category, existing.category);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, error: 'no-fields-to-update' });
    }

    updates.updatedAt = new Date().toISOString();

    await ref.set(updates, { merge: true });

    const merged = buildTemplateResponse({
      ...existing,
      ...updates,
      id,
      ownerUid: existing.ownerUid || user.uid,
      owner: existing.ownerUid || user.uid,
      editable: true,
    });

    res.json({
      success: true,
      template: merged,
    });
  } catch (error) {
    logger.error('Error actualizando plantilla:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
});

export default router;
