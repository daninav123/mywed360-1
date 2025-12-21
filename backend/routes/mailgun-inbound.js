import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { db } from '../db.js'; // Firestore
import admin from 'firebase-admin';
import { analyzeEmail } from '../services/emailAnalysis.js';
import { FieldValue } from 'firebase-admin/firestore';
import { applyEmailInsightsToSystem } from '../services/emailActionRouter.js';
import { classifyEmailContent } from '../services/emailClassification.js';
import { extractTextFromAttachment } from '../services/attachmentText.js';
import { 
  isQuoteResponse, 
  findMatchingQuoteRequest, 
  analyzeQuoteResponse 
} from '../services/quoteResponseAnalysis.js';
import { sendQuoteReceivedNotification } from '../services/quoteRequestEmailService.js';

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

  // En desarrollo, solo advertir pero continuar
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (anyKey) {
    const ok = verifyWithAnyKey({ timestamp, token, signature });
    if (!ok) {
      console.warn('⚠️ [Mailgun] Webhook con firma no válida');
      if (!isDevelopment) {
        return res.status(403).json({ success: false, message: 'Invalid signature' });
      }
      console.warn('⚠️ [Mailgun] Continuando en modo desarrollo sin verificación');
    } else {
      console.log('✅ [Mailgun] Firma verificada correctamente');
    }
  } else {
    // Entorno local / CI sin clave: continuar pero advertir
    console.warn('⚠️ [Mailgun] MAILGUN_SIGNING_KEY no definido; se omite verificación de firma (solo dev)');
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
    // Normalizar @mg.malove.app a @malove.app para que coincida con perfil usuario
    let rcpt = String(rcptRaw || '').trim().toLowerCase();
    if (rcpt.endsWith('@mg.malove.app')) {
      rcpt = rcpt.replace('@mg.malove.app', '@malove.app');
      console.log(`📧 [Mailgun] Destinatario normalizado: ${rcptRaw} → ${rcpt}`);
    }
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

      // Guardar copia bajo subcolecci�n del usuario si podemos resolverlo por email
      let ownerUid = null;
      try {
        console.log(`📧 [Mailgun] Procesando mail para destinatario: ${rcpt}`);
        console.log(`📧 [Mailgun] Remitente: ${senderNorm}`);
        console.log(`📧 [Mailgun] Asunto: ${subject}`);
        
        // Lista de emails a probar (incluyendo versión sin mg. si aplica)
        const emailsToTry = [rcpt];
        
        // Si el email es @mg.malove.app, también probar con @malove.app
        if (rcpt.endsWith('@mg.malove.app')) {
          const withoutMg = rcpt.replace('@mg.malove.app', '@malove.app');
          emailsToTry.push(withoutMg);
          console.log(`📧 [Mailgun] Email detectado en @mg.malove.app, también probaré: ${withoutMg}`);
        }
        
        let userSnap = { empty: true };
        
        // Buscar por cada email candidato
        for (const emailToTry of emailsToTry) {
          // Buscar por maLoveEmail primero (nuevo sistema)
          userSnap = await db.collection('users').where('maLoveEmail', '==', emailToTry).limit(1).get();
          console.log(`📧 [Mailgun] Búsqueda por maLoveEmail (${emailToTry}): ${userSnap.empty ? 'NO ENCONTRADO' : 'ENCONTRADO'}`);
          if (!userSnap.empty) break;
          
          // Fallback a myWed360Email (legacy)
          userSnap = await db.collection('users').where('myWed360Email', '==', emailToTry).limit(1).get();
          console.log(`📧 [Mailgun] Búsqueda por myWed360Email (${emailToTry}): ${userSnap.empty ? 'NO ENCONTRADO' : 'ENCONTRADO'}`);
          if (!userSnap.empty) break;
          
          // Fallback a email login
          userSnap = await db.collection('users').where('email', '==', emailToTry).limit(1).get();
          console.log(`📧 [Mailgun] Búsqueda por email login (${emailToTry}): ${userSnap.empty ? 'NO ENCONTRADO' : 'ENCONTRADO'}`);
          if (!userSnap.empty) break;
        }
        
        if (!userSnap.empty) {
          ownerUid = userSnap.docs[0].id;
          console.log(`✅ [Mailgun] Usuario encontrado: ${ownerUid}`);
          console.log(`✅ [Mailgun] Guardando mail ${mailRef.id} en subcolección de usuario ${ownerUid}`);
          
          await db.collection('users')
            .doc(ownerUid)
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
          
          console.log(`✅ [Mailgun] Mail guardado exitosamente en subcolección`);
        } else {
          console.warn(`⚠️ [Mailgun] NO SE ENCONTRÓ USUARIO para destinatario: ${rcpt}`);
          console.warn(`⚠️ [Mailgun] El mail ${mailRef.id} NO se guardará en subcolección de usuario`);
          console.warn(`⚠️ [Mailgun] Solo estará en colección global 'mails'`);
        }
      } catch (subErr) {
        console.error('❌ [Mailgun] Error escribiendo mail en subcolección:', subErr?.message || subErr);
        console.error('❌ [Mailgun] Stack:', subErr?.stack);
      }

      // Clasificación IA del correo (persistencia en Firestore)
      try {
        await classifyEmailContent({
          subject,
          body: bodyContent,
          mailId: mailRef.id,
          ownerUid,
        });
      } catch (clsErr) {
        console.warn('Could not classify inbound email:', clsErr?.message || clsErr);
      }

      // 🤖 NUEVO: Detectar y procesar respuestas de presupuestos automáticamente
      try {
        if (isQuoteResponse({ subject, body: bodyContent, fromEmail: senderNorm })) {
          console.log('🎯 [QuoteResponse] Email detectado como posible respuesta de presupuesto');
          
          // Buscar solicitud correspondiente
          const matchingRequest = await findMatchingQuoteRequest({
            fromEmail: senderNorm,
            subject,
            body: bodyContent,
            db,
          });

          if (matchingRequest) {
            console.log(`✅ [QuoteResponse] Solicitud encontrada: ${matchingRequest.requestId}`);
            
            // Extraer texto de adjuntos (especialmente PDFs)
            let attachmentsText = [];
            try {
              for (const d of attachmentDocs) {
                if (!d || !d.buffer) continue;
                const text = await extractTextFromAttachment({ 
                  buffer: d.buffer, 
                  contentType: d.contentType || '', 
                  filename: d.filename || '' 
                });
                if (text && text.trim()) {
                  attachmentsText.push({ 
                    filename: d.filename || '', 
                    mime: d.contentType || '', 
                    text 
                  });
                }
              }
            } catch (attErr) {
              console.warn('[QuoteResponse] Error extrayendo texto de adjuntos:', attErr?.message);
            }

            // Analizar presupuesto con IA
            const quoteData = await analyzeQuoteResponse({
              subject,
              body: bodyContent,
              attachments: attachmentsText,
              supplierName: matchingRequest.data.supplierName || '',
              categoryName: matchingRequest.data.supplierCategoryName || '',
            });

            if (quoteData) {
              console.log(`🎉 [QuoteResponse] Presupuesto analizado - Precio: ${quoteData.totalPrice || 'N/A'}€`);

              // Guardar presupuesto en Firestore
              const quoteRef = db.collection('quote-responses').doc();
              await quoteRef.set({
                // IDs de referencia
                id: quoteRef.id,
                requestId: matchingRequest.requestId,
                supplierId: matchingRequest.supplierId,
                mailId: mailRef.id,
                
                // Info del proveedor
                supplierEmail: senderNorm,
                supplierName: matchingRequest.data.supplierName || '',
                
                // Info del cliente
                clientEmail: matchingRequest.data.contacto?.email || null,
                clientName: matchingRequest.data.contacto?.nombre || null,
                userId: matchingRequest.data.userId || null,
                weddingId: matchingRequest.data.weddingId || null,
                
                // Datos del presupuesto extraídos por IA
                ...quoteData,
                
                // Email original
                emailSubject: subject,
                emailBody: bodyContent,
                hasAttachments: attachmentDocs.length > 0,
                attachmentCount: attachmentDocs.length,
                
                // Estado
                status: 'received',
                source: 'email_auto',
                
                // Timestamps
                createdAt: FieldValue.serverTimestamp(),
                receivedAt: date,
              });

              const requestOwnerUid = matchingRequest.data.userId || null;
              if (requestOwnerUid) {
                try {
                  await db.collection('mails').doc(mailRef.id).set(
                    {
                      ownerUid: requestOwnerUid,
                      weddingId: matchingRequest.data.weddingId || null,
                      linkedQuoteRequestId: matchingRequest.requestId,
                      linkedQuoteResponseId: quoteRef.id,
                      updatedAt: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                  );
                } catch (mailLinkErr) {
                  console.warn('[QuoteResponse] Error enlazando mail con user:', mailLinkErr?.message);
                }

                // Actualizar subcolección (no crear nuevo, ya existe del guardado inicial)
                try {
                  await db
                    .collection('users')
                    .doc(requestOwnerUid)
                    .collection('mails')
                    .doc(mailRef.id)
                    .set(
                      {
                        ownerUid: requestOwnerUid,
                        weddingId: matchingRequest.data.weddingId || null,
                        linkedQuoteRequestId: matchingRequest.requestId,
                        linkedQuoteResponseId: quoteRef.id,
                        updatedAt: FieldValue.serverTimestamp(),
                      },
                      { merge: true }
                    );
                } catch (subLinkErr) {
                  console.warn('[QuoteResponse] Error actualizando mail en subcolección de usuario:', subLinkErr?.message);
                }
              }

              // Actualizar estado de la solicitud
              if (matchingRequest.source === 'registered_supplier') {
                await db
                  .collection('suppliers')
                  .doc(matchingRequest.supplierId)
                  .collection('quote-requests')
                  .doc(matchingRequest.requestId)
                  .update({
                    status: 'quoted',
                    respondedAt: FieldValue.serverTimestamp(),
                    quoteResponseId: quoteRef.id,
                  });
              } else if (matchingRequest.source === 'internet_supplier') {
                await db
                  .collection('quote-requests-internet')
                  .doc(matchingRequest.requestId)
                  .update({
                    status: 'quoted',
                    respondedAt: FieldValue.serverTimestamp(),
                    quoteResponseId: quoteRef.id,
                  });
              }

              // Notificar al usuario
              if (matchingRequest.data.contacto?.email) {
                try {
                  await sendQuoteReceivedNotification({
                    userEmail: matchingRequest.data.contacto.email,
                    userName: matchingRequest.data.contacto.nombre || 'Usuario',
                    supplierName: matchingRequest.data.supplierName || 'Proveedor',
                    categoryName: matchingRequest.data.supplierCategoryName || 'Servicio',
                    quoteAmount: quoteData.totalPrice,
                    viewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/proveedores/presupuesto/${quoteRef.id}`,
                  });
                  console.log('📧 [QuoteResponse] Notificación enviada al usuario');
                } catch (notifErr) {
                  console.warn('[QuoteResponse] Error enviando notificación:', notifErr?.message);
                }
              }

              console.log(`💾 [QuoteResponse] Presupuesto guardado exitosamente: ${quoteRef.id}`);
            } else {
              console.warn('[QuoteResponse] No se pudo analizar el presupuesto con IA');
            }
          } else {
            console.log('⚠️ [QuoteResponse] No se encontró solicitud correspondiente para este email');
          }
        }
      } catch (quoteErr) {
        console.error('[QuoteResponse] Error procesando respuesta de presupuesto:', quoteErr);
        // No fallar el procesamiento del email si falla el análisis de presupuesto
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
        await db.collection('emailInsights').doc(mailRef.id).set(
          {
            ...insights,
            mailId: mailRef.id,
            createdAt: date,
          },
          { merge: true }
        );

        let weddingId = (rcpt || '').split('@')[0] || null;
        if (!weddingId || weddingId.length < 8) {
          try {
            // Intentar resolver weddingId desde el propietario del correo
            let uid = ownerUid;
            if (!uid) {
              // Buscar por maLoveEmail primero
              let userSnap = await db.collection('users').where('maLoveEmail', '==', rcpt).limit(1).get();
              
              // Fallback a myWed360Email
              if (userSnap.empty) {
                userSnap = await db.collection('users').where('myWed360Email', '==', rcpt).limit(1).get();
              }
              
              // Fallback a email login
              if (userSnap.empty) {
                userSnap = await db.collection('users').where('email', '==', rcpt).limit(1).get();
              }
              
              if (!userSnap.empty) {
                uid = userSnap.docs[0].id;
              }
              if (uid && !ownerUid) {
                ownerUid = uid;
              }
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

        // Crear presupuesto b�sico si se puede resolver proveedor por email
        if (weddingId) {
          try {
            const supSnap = await db
              .collection('weddings')
              .doc(weddingId)
              .collection('suppliers')
              .where('email', '==', senderNorm)
              .limit(1)
              .get();
            if (!supSnap.empty) {
              const supDoc = supSnap.docs[0];
              const supplierId = supDoc.id;
              const supplierData = supDoc.data() || {};
              const budgetArr = Array.isArray(insights?.budgets) ? insights.budgets : [];
              const primary = budgetArr[0] || {};
              const amount = typeof primary.amount === 'number' ? primary.amount : null;
              const currency = primary.currency || 'EUR';
              const description = (primary.description || subject || 'Presupuesto').toString().slice(0, 200);
              const budRef = db
                .collection('weddings').doc(weddingId)
                .collection('suppliers').doc(supplierId)
                .collection('budgets').doc();
              await budRef.set({
                id: budRef.id,
                mailId: mailRef.id,
                supplierEmail: senderNorm,
                supplierName: supplierData.name || null,
                description,
                amount,
                currency,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          } catch (e) { console.warn('auto-create budget failed', e?.message || e); }
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


