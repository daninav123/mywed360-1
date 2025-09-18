import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { db } from '../db.js'; // Firestore
import admin from 'firebase-admin';
import { analyzeEmail } from '../services/emailAnalysis.js';
import { applyEmailInsightsToSystem } from '../services/emailActionRouter.js';
import { extractTextFromAttachment } from '../services/attachmentText.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Comprueba la firma que Mailgun envía en cada webhook.
// Docs: https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
function verifyMailgunSignature(timestamp, token, signature, apiKey) {
  try {
    const encodedToken = crypto
      .createHmac('sha256', apiKey)
      .update(timestamp + token)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(encodedToken), Buffer.from(String(signature)));
  } catch {
    return false;
  }
}

function verifyWithAnyKey({ timestamp, token, signature }) {
  const candidates = [
    process.env.MAILGUN_SIGNING_KEY,
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY,
    process.env.MAILGUN_API_KEY,
    process.env.VITE_MAILGUN_API_KEY,
  ].filter(Boolean);
  for (const key of candidates) {
    if (verifyMailgunSignature(timestamp, token, signature, key)) return true;
  }
  return false;
}

router.post('/', upload.any(), async (req, res) => {
  const anyKey = process.env.MAILGUN_SIGNING_KEY || process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY || process.env.VITE_MAILGUN_API_KEY;

  // Extraer datos de cabecera common para la firma
  const { timestamp, token, signature } = req.body || {};

  if (anyKey) {
    const ok = verifyWithAnyKey({ timestamp, token, signature });
    if (!ok) {
      console.warn('Webhook Mailgun firma no válida');
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }
  } else {
    // Entorno local / CI sin clave: continuar pero advertir
    console.warn('MAILGUN_SIGNING_KEY no definido; se omite verificación de firma (solo dev)');
  }

  // Extraer campos principales del mensaje
  const {
    recipient,
    sender,
    subject,
    'body-plain': bodyPlain,
    'stripped-text': strippedText,
    'stripped-html': strippedHtml,
  } = req.body || {};

  // Persistir el correo en Firestore
  const bodyContent = bodyPlain || strippedText || strippedHtml || '';
  const date = new Date().toISOString();

  // Mailgun puede enviar varios destinatarios separados por comas.
  const recipients = recipient ? recipient.split(/,\s*/).map(r => r.trim()).filter(Boolean) : [];

  const savePromises = recipients.map(async (rcptRaw) => {
    const rcpt = String(rcptRaw || '').trim().toLowerCase();
    const senderNorm = String(sender || '').trim().toLowerCase();
    try {
      // Adjuntos (multipart)
      const files = Array.isArray(req.files) ? req.files : [];
      const attachmentsTmp = [];
      const attachmentDocs = [];
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        if (!f) continue;
        const attId = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}_${i}`;
        const contentType = f.mimetype || f.type || 'application/octet-stream';
        const size = typeof f.size === 'number' ? f.size : (f.buffer ? f.buffer.length : 0);
        const filename = f.originalname || f.filename || `attachment_${i+1}`;
        attachmentsTmp.push({ id: attId, filename, size, contentType, url: `/api/mail/PENDING/attachments/${attId}` });
        attachmentDocs.push({ id: attId, filename, size, contentType, buffer: f.buffer || null });
      }

      const mailRef = await db.collection('mails').add({
        from: senderNorm,
        to: rcpt,
        subject,
        body: bodyContent,
        date,
        folder: 'inbox',
        read: false,
        via: 'mailgun',
        attachments: attachmentsTmp
      });

      // Guardar ID también en el documento
      try {
        const fixed = (attachmentsTmp || []).map(a => ({ ...a, url: `/api/mail/${mailRef.id}/attachments/${a.id}` }));
        await db.collection('mails').doc(mailRef.id).update({ id: mailRef.id, attachments: fixed });
      } catch (e) {
        // best-effort only
      }

      // Guardar adjuntos exclusivamente en Storage (si está configurado), evitando inline
      try {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
        if (bucketName) {
          for (const d of attachmentDocs) {
            if (d && d.buffer) {
              const safeName = String(d.filename || 'attachment').replace(/[^a-zA-Z0-9_\.\-]/g, '_');
              const objectPath = `email_attachments/${mailRef.id}/${d.id}/${safeName}`;
              await admin.storage().bucket(bucketName).file(objectPath).save(d.buffer, { contentType: d.contentType || 'application/octet-stream', resumable: false, public: false, metadata: { contentType: d.contentType || 'application/octet-stream' } });
              await db.collection('mails').doc(mailRef.id).collection('attachments').doc(d.id).set({
                id: d.id,
                filename: d.filename,
                contentType: d.contentType,
                size: d.size,
                storagePath: objectPath,
                createdAt: date,
              }, { merge: true });
            }
          }
        } else {
          // Fallback: si no hay bucket, guardar inline solo si es pequeño
          for (const d of attachmentDocs) {
            let dataBase64 = null;
            try { if (d.buffer && d.buffer.length <= 250 * 1024) dataBase64 = d.buffer.toString('base64'); } catch {}
            await db.collection('mails').doc(mailRef.id).collection('attachments').doc(d.id).set({
              id: d.id,
              filename: d.filename,
              contentType: d.contentType,
              size: d.size,
              dataBase64,
              createdAt: date,
            }, { merge: true });
          }
        }
      } catch (attErr) {
        console.warn('Could not persist inbound attachments:', attErr?.message || attErr);
      }

      // Guardar copia bajo subcolección del usuario si podemos resolverlo por email
      try {
        let userSnap = await db.collection('users').where('myWed360Email', '==', rcpt).limit(1).get();
        if (userSnap.empty) {
          const legacy = rcpt.replace(/@mywed360\.com$/i, '@mywed360');
          userSnap = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
        }
        if (!userSnap.empty) {
          const uid = userSnap.docs[0].id;
          await db.collection('users')
            .doc(uid)
            .collection('mails')
            .doc(mailRef.id)
            .set({
              id: mailRef.id,
              from: senderNorm,
              to: rcpt,
              subject,
              body: bodyContent,
              date,
              folder: 'inbox',
              read: false,
              via: 'mailgun'
            });
        }
      } catch (subErr) {
        console.warn('Could not write inbound mail to user subcollection:', subErr?.message || subErr);
      }

      // Análisis IA automático -> extraer texto de adjuntos, guardar insights y generar notificaciones
      try {
        let attachmentsText = [];
        try {
          const maxBytes = parseInt(process.env.EMAIL_ANALYSIS_MAX_ATTACHMENT_BYTES || String(5 * 1024 * 1024), 10);
          for (const d of attachmentDocs) {
            if (!d || !d.buffer) continue;
            const tooBig = typeof d.size === 'number' && d.size > maxBytes;
            if (tooBig) continue;
            const text = await extractTextFromAttachment({ buffer: d.buffer, contentType: d.contentType || '', filename: d.filename || '' });
            if (text && text.trim()) attachmentsText.push({ filename: d.filename || '', mime: d.contentType || '', text });
          }
        } catch {}
        const insights = await analyzeEmail({ subject, body: bodyContent, attachments: (req.body?.attachments || []), attachmentsText });
        await db.collection('emailInsights').doc(mailRef.id).set({
          ...insights,
          mailId: mailRef.id,
          createdAt: date,
        });

        let weddingId = (rcpt || '').split('@')[0] || null;
        if (!weddingId || weddingId.length < 8) {
          try {
            // Intentar resolver weddingId desde el propietario del correo
            let uid = null;
            let userSnap = await db.collection('users').where('myWed360Email', '==', rcpt).limit(1).get();
            if (userSnap.empty) {
              const legacy = rcpt.replace(/@mywed360\.com$/i, '@mywed360');
              userSnap = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
            }
            if (!userSnap.empty) {
              uid = userSnap.docs[0].id;
            } else {
              const byLogin = await db.collection('users').where('email', '==', rcpt).limit(1).get();
              if (!byLogin.empty) uid = byLogin.docs[0].id;
            }
            if (uid) {
              const ws = await db.collection('users').doc(uid).collection('weddings').limit(1).get();
              if (!ws.empty) {
                weddingId = ws.docs[0].id;
              }
            }
          } catch {}
        }

        // Notificaciones por reuniones detectadas (aceptación desde UI)
        if (weddingId) {
          try {
            const { createNotification } = await import('../services/notificationService.js');
            const meetings = Array.isArray(insights?.meetings) ? insights.meetings : [];
            for (const m of meetings) {
              const when = m?.start || m?.date || m?.when;
              if (!when) continue;
              const title = m?.title || subject || 'Reunión';
              await createNotification({
                type: 'event',
                message: `Se detectó una reunión: ${title}`,
                payload: {
                  kind: 'meeting_suggested',
                  mailId: mailRef.id,
                  weddingId,
                  meeting: { title, when }
                }
              });
            }
          } catch (e) { console.warn('notification failed', e?.message || e); }
        }

        // Notificaciones por presupuestos detectados (aceptación desde UI)
        if (weddingId) {
          try {
            const { createNotification } = await import('../services/notificationService.js');
            const budgets = Array.isArray(insights?.budgets) ? insights.budgets : [];
            for (const b of budgets) {
              await createNotification({
                type: 'event',
                message: `Presupuesto detectado: ${subject || b?.description || 'Presupuesto'}`,
                payload: {
                  kind: 'budget_suggested',
                  mailId: mailRef.id,
                  weddingId,
                  supplierId: null,
                  budgetId: null,
                  budget: { description: subject || b?.description || 'Presupuesto', amount: b?.amount, currency: b?.currency || 'EUR' }
                }
              });
            }
          } catch (e) { console.warn('notification failed', e?.message || e); }
        }

        // Notificaciones por tareas detectadas
        if (weddingId) {
          try {
            const { createNotification } = await import('../services/notificationService.js');
            const tasks = Array.isArray(insights?.tasks) ? insights.tasks : [];
            for (const t of tasks) {
              const title = t?.title || subject || 'Tarea';
              await createNotification({
                type: 'event',
                message: `Tarea detectada: ${title}`,
                payload: {
                  kind: 'task_suggested',
                  mailId: mailRef.id,
                  weddingId,
                  task: {
                    title,
                    due: t?.due || null,
                    priority: t?.priority || 'media'
                  }
                }
              });
            }
          } catch (e) { console.warn('notification failed', e?.message || e); }
        }
        // Aplicación automática opcional de insights al sistema
        try {
          if (process.env.EMAIL_INSIGHTS_AUTO_APPLY === 'true' && weddingId) {
            await applyEmailInsightsToSystem({ weddingId, sender: senderNorm, mailId: mailRef.id, insights, subject });
          }
        } catch (autoErr) {
          console.warn('auto-apply insights failed', autoErr?.message || autoErr);
        }
      } catch (aiErr) {
        console.error('Error analizando correo:', aiErr);
      }
    } catch (err) {
      console.error('Error guardando correo entrante en Firestore:', err);
    }
  });

  console.log('Email recibido de Mailgun:', {
    recipients,
    sender,
    subject,
    body: bodyContent,
  });

  // Esperar a que todas las escrituras terminen pero sin bloquear la respuesta si tardan
  Promise.allSettled(savePromises).then(() => {
    console.log('Correo entrante guardado en Firestore');
  });

  // Mailgun requiere respuesta 200 OK
  return res.json({ success: true });
});

export default router;

