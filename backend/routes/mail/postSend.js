import express from 'express';
import axios from 'axios';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';
import { createMailgunClients } from './clients.js';

const router = express.Router();

// POST /api/mail  { to, subject, body }
router.post('/', requireMailAccess, async (req, res) => {
  try {
    const { to, subject, body, recordOnly, from: fromBody, attachments: rawAttachments, cc, bcc, replyTo } = req.body;
    const attachments = Array.isArray(rawAttachments)
      ? rawAttachments.map((a) => ({ filename: a.filename || a.name || null, name: a.name || a.filename || null, size: a.size || 0, url: a.url || null }))
      : [];
    const date = new Date().toISOString();
    const profile = req.userProfile || {};
    const computedFrom = fromBody || profile.myWed360Email || profile.email;
    const from = computedFrom || 'no-reply@mywed360.com';

    const mailData = {
      from,
      to,
      subject,
      text: body,
      html: `<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">${(body || '').replace(/\\n/g, '<br>')}</div>`,
    };

    if (cc) mailData.cc = cc;
    if (bcc) mailData.bcc = bcc;
    if (replyTo) mailData['h:Reply-To'] = replyTo;

    // Adjuntos desde URLs
    try {
      const { mailgun, mailgunAlt } = createMailgunClients();
      const mgForAttachment = mailgun || mailgunAlt;
      if (mgForAttachment && Array.isArray(attachments) && attachments.length) {
        const objs = [];
        for (const att of attachments) {
          if (!att?.url) continue;
          const filename = att.filename || att.name || 'adjunto';
          try {
            const resp = await axios.get(att.url, { responseType: 'arraybuffer' });
            const buf = Buffer.from(resp.data);
            const Att = mgForAttachment.Attachment || mgForAttachment.Attachment;
            if (Att) objs.push(new Att({ data: buf, filename }));
            else objs.push({ data: buf, filename });
          } catch (e) {
            console.warn('No se pudo descargar adjunto para enviar:', filename, e?.message || e);
          }
        }
        if (objs.length) mailData.attachment = objs;
      }
    } catch (attErr) {
      console.warn('Error preparando adjuntos:', attErr?.message || attErr);
    }

    // Envío real si procede
    let messageId = null;
    if (!recordOnly) {
      try {
        const { mailgun, mailgunAlt } = createMailgunClients();
        if (!mailgun) {
          console.warn('Mailgun no disponible. Se omite envío real y se continúa con registro en BD.');
        } else {
          console.log('Enviando correo real con Mailgun:', { from: mailData.from, to: mailData.to, subject: mailData.subject });
          let result = null;
          try {
            result = await mailgun.messages().send(mailData);
            console.log('Correo enviado exitosamente con dominio principal:', result);
            try {
              const rawId = (result && (result.id || result.messageId)) || null;
              if (rawId) messageId = String(rawId).trim().toLowerCase().replace(/^<|>$/g, '');
            } catch {}
          } catch (primaryError) {
            console.error('Error al enviar con dominio principal:', primaryError?.message || primaryError);
            if (mailgunAlt) {
              try {
                result = await mailgunAlt.messages().send(mailData);
                console.log('Correo enviado exitosamente con dominio alternativo:', result);
                try {
                  const rawId = (result && (result.id || result.messageId)) || null;
                  if (rawId) messageId = String(rawId).trim().toLowerCase().replace(/^<|>$/g, '');
                } catch {}
              } catch (altError) {
                console.error('Error al enviar con dominio alternativo:', altError?.message || altError);
                throw new Error('No se pudo enviar el correo con ninguna configuración de Mailgun');
              }
            } else {
              throw new Error('No hay configuración de dominio de envío alternativo disponible');
            }
          }
        }
      } catch (mailError) {
        console.error('Error al enviar correo real:', mailError?.message || mailError);
        console.warn('Fallback a simulación de correo...');
      }
    }

    // Registrar en DB (sent)
    const sentRef = await db.collection('mails').add({
      from,
      to,
      subject,
      body,
      date,
      folder: 'sent',
      read: true,
      attachments,
      cc: cc || null,
      bcc: bcc || null,
      replyTo: replyTo || null,
      messageId: messageId || null,
    });
    try { await db.collection('mails').doc(sentRef.id).update({ id: sentRef.id }); } catch {}

    // Copia en subcolección del remitente
    if (!recordOnly) {
      try {
        const uid = req.user?.uid;
        if (uid) {
          await db.collection('users').doc(uid).collection('mails').doc(sentRef.id).set({
            id: sentRef.id,
            from,
            to,
            subject,
            body,
            date,
            folder: 'sent',
            read: true,
            attachments,
            cc: cc || null,
            bcc: bcc || null,
            replyTo: replyTo || null,
            messageId: messageId || null,
            via: 'backend',
          });
        }
      } catch (e) {
        console.warn('No se pudo registrar el enviado en subcoleccion del usuario:', e?.message || e);
      }
    }

    // Registro en inbox del destinatario
    const inboxRef = await db.collection('mails').add({
      from,
      to,
      subject,
      body,
      date,
      folder: 'inbox',
      read: false,
      attachments,
      cc: cc || null,
      bcc: bcc || null,
      replyTo: replyTo || null,
    });
    try { await db.collection('mails').doc(inboxRef.id).update({ id: inboxRef.id }); } catch {}

    // Copia en subcolección del destinatario
    try {
      let uid = null;
      const byAlias = await db.collection('users').where('myWed360Email', '==', to).limit(1).get();
      if (!byAlias.empty) {
        uid = byAlias.docs[0].id;
      } else {
        const byLogin = await db.collection('users').where('email', '==', to).limit(1).get();
        if (!byLogin.empty) uid = byLogin.docs[0].id;
      }
      if (uid) {
        await db.collection('users').doc(uid).collection('mails').doc(inboxRef.id).set({
          id: inboxRef.id,
          from,
          to,
          subject,
          body,
          date,
          folder: 'inbox',
          read: false,
          attachments,
          cc: cc || null,
          bcc: bcc || null,
          replyTo: replyTo || null,
          via: 'backend',
        });
      }
    } catch (e) {
      console.warn('No se pudo registrar el inbox en subcoleccion del destinatario:', e?.message || e);
    }

    res.status(201).json({ id: sentRef.id, to, subject, body, date, folder: 'sent', read: true, from });
  } catch (err) {
    console.error('Error en POST /api/mail:', err);
    res.status(503).json({
      success: false,
      message: 'Fallo enviando correo',
      error: err?.message || String(err),
      hint: 'Si es envío real, verifica MAILGUN_API_KEY, MAILGUN_DOMAIN (p.ej. mg.mywed360.com) y MAILGUN_EU_REGION=true',
    });
  }
});

export default router;

