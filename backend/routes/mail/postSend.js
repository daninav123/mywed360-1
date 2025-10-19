import express from 'express';

import { requireMailAccess } from '../../middleware/authMiddleware.js';
import { sendMailAndPersist } from '../../services/mailSendService.js';

const router = express.Router();

// POST /api/mail  { to, subject, body }
router.post('/', requireMailAccess, async (req, res) => {
  try {
    const {
      to,
      subject,
      body,
      recordOnly,
      from: fromBody,
      attachments,
      cc,
      bcc,
      replyTo,
      metadata,
    } = req.body || {};

    const result = await sendMailAndPersist({
      ownerUid: req.user?.uid || null,
      ownerProfile: req.userProfile || null,
      to,
      subject,
      body,
      from: fromBody,
      attachments,
      cc,
      bcc,
      replyTo,
      recordOnly: Boolean(recordOnly),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });

    const resultRecipients = Array.isArray(result.recipients)
      ? result.recipients
      : [];
    const normalizedTo =
      resultRecipients.length > 0
        ? resultRecipients
        : Array.isArray(to)
          ? to.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
          : typeof to === 'string'
            ? to
                .split(/[;,]/)
                .map((value) => value.trim())
                .filter(Boolean)
            : [];
    const toPrimary =
      result.to ||
      (normalizedTo.length ? normalizedTo[0] : typeof to === 'string' ? to : '');

    res.status(201).json({
      id: result.sentId,
      to: normalizedTo,
      toAddress: toPrimary || null,
      toDisplay: normalizedTo.join(', '),
      recipients: normalizedTo,
      toList: normalizedTo,
      toPrimary: toPrimary || null,
      subject,
      body: result.bodyText || body,
      bodyText: result.bodyText || body,
      bodyHtml: result.bodyHtml || null,
      createdAt: result.createdAt || result.date,
      date: result.date,
      folder: 'sent',
      read: true,
      from: result.from,
      messageId: result.messageId || null,
    });
  } catch (err) {
    console.error('Error en POST /api/mail:', err);
    res.status(503).json({
      success: false,
      message: 'Fallo enviando correo',
      error: err?.message || String(err),
      hint: 'Si es envío real, verifica MAILGUN_API_KEY, MAILGUN_DOMAIN y MAILGUN_EU_REGION.',
    });
  }
});

export default router;
