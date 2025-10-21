import axios from 'axios';

import { db } from '../db.js';
import { createMailgunClients } from '../routes/mail/clients.js';

function normalizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const filename = item.filename || item.name || null;
      const url = item.url || null;
      return {
        filename,
        name: item.name || filename || null,
        size: item.size || 0,
        url,
      };
    })
    .filter(Boolean);
}

function normalizeAddressList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((entry) => {
        if (typeof entry === 'string') {
          return entry
            .split(/[;,]/)
            .map((value) => value.trim())
            .filter(Boolean);
        }
        if (entry && typeof entry === 'object') {
          const email = entry.email || entry.address || entry.value;
          return email ? [String(email).trim()] : [];
        }
        return [];
      })
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[;,]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
}

function textToHtml(bodyText) {
  if (!bodyText) {
    return '<div style="font-family: Arial, sans-serif; line-height: 1.6;"></div>';
  }
  const safe = String(bodyText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${safe}</div>`;
}

async function resolveOwnerProfile(ownerUid) {
  if (!ownerUid) return null;
  try {
    const snap = await db.collection('users').doc(ownerUid).get();
    return snap.exists ? snap.data() || null : null;
  } catch (error) {
    console.warn('[mailSendService] No se pudo obtener el perfil del remitente', error?.message || error);
    return null;
  }
}

async function resolveRecipientUid(addresses) {
  const candidates = normalizeAddressList(addresses);
  for (const email of candidates) {
    try {
      const aliasSnap = await db.collection('users').where('myWed360Email', '==', email).limit(1).get();
      if (!aliasSnap.empty) return aliasSnap.docs[0].id;
      const loginSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!loginSnap.empty) return loginSnap.docs[0].id;
    } catch (error) {
      console.warn('[mailSendService] No se pudo resolver el destinatario', email, error?.message || error);
    }
  }
  return null;
}

export async function sendMailAndPersist({
  ownerUid = null,
  ownerProfile = null,
  to,
  subject,
  body,
  from: fromOverride,
  cc = null,
  bcc = null,
  replyTo = null,
  attachments: rawAttachments = [],
  recordOnly = false,
  metadata = {},
}) {
  if (!to || !subject) {
    throw new Error('to and subject are required');
  }
  const recipients = normalizeAddressList(to);
  if (!recipients.length) {
    throw new Error('At least one recipient email is required');
  }

  let profile = ownerProfile;
  if (!profile && ownerUid) {
    profile = await resolveOwnerProfile(ownerUid);
  }

  const resolvedFrom =
    fromOverride ||
    profile?.myWed360Email ||
    profile?.email ||
    process.env.DEFAULT_EMAIL_SENDER ||
    'no-reply@malove.app';

  const primaryRecipient = recipients[0];
  const ccList = normalizeAddressList(cc);
  const bccList = normalizeAddressList(bcc);
  const ccString = ccList.length ? ccList.join(', ') : null;
  const bccString = bccList.length ? bccList.join(', ') : null;
  const replyToList = normalizeAddressList(replyTo);
  const attachments = normalizeAttachments(rawAttachments);
  const date = new Date().toISOString();
  const bodyText = typeof body === 'string' ? body : '';
  const bodyHtml = textToHtml(bodyText);

  const mailData = {
    from: resolvedFrom,
    to: recipients,
    subject,
    text: bodyText,
    html: bodyHtml,
  };

  if (ccList.length) mailData.cc = ccList;
  if (bccList.length) mailData.bcc = bccList;
  if (replyToList.length) mailData['h:Reply-To'] = replyToList.join(', ');

  let messageId = null;

  const { mailgun, mailgunAlt } = createMailgunClients();

  const mailgunForAttachments = mailgun || mailgunAlt;

  if (mailgunForAttachments && attachments.length) {
    try {
      const attachmentObjects = [];
      for (const attachment of attachments) {
        if (!attachment?.url) continue;
        try {
          const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);
          const AttachmentCtor =
            mailgunForAttachments.Attachment || (mailgunAlt && mailgunAlt.Attachment) || (mailgun && mailgun.Attachment);
          if (AttachmentCtor) {
            attachmentObjects.push(
              new AttachmentCtor({ data: buffer, filename: attachment.filename || 'adjunto' })
            );
          } else {
            attachmentObjects.push({ data: buffer, filename: attachment.filename || 'adjunto' });
          }
        } catch (error) {
          console.warn(
            '[mailSendService] No se pudo descargar adjunto',
            attachment.filename || attachment.url,
            error?.message || error
          );
        }
      }
      if (attachmentObjects.length) {
        mailData.attachment = attachmentObjects;
      }
    } catch (error) {
      console.warn('[mailSendService] Error preparando adjuntos', error?.message || error);
    }
  }

  if (!recordOnly && mailgun) {
    try {
      let result = await mailgun.messages().send(mailData);
      let rawId = (result && (result.id || result.messageId)) || null;
      if (!rawId && mailgunAlt) {
        result = await mailgunAlt.messages().send(mailData);
        rawId = (result && (result.id || result.messageId)) || null;
      }
      if (rawId) {
        messageId = String(rawId).trim().toLowerCase().replace(/^<|>$/g, '');
      }
    } catch (error) {
      console.error('[mailSendService] Error enviando correo con Mailgun', error?.message || error);
      if (!mailgunAlt) {
        throw error;
      }
      try {
        const result = await mailgunAlt.messages().send(mailData);
        const rawId = (result && (result.id || result.messageId)) || null;
        if (rawId) {
          messageId = String(rawId).trim().toLowerCase().replace(/^<|>$/g, '');
        }
      } catch (altError) {
        console.error('[mailSendService] Error con dominio alternativo de Mailgun', altError?.message || altError);
        throw altError;
      }
    }
  }

  const docPayload = {
    from: resolvedFrom,
    to: primaryRecipient,
    recipients,
    subject,
    body: bodyText,
    bodyText,
    bodyHtml,
    createdAt: date,
    updatedAt: date,
    date,
    folder: 'sent',
    read: true,
    attachments,
    cc: ccString,
    ccList: ccList.length ? ccList : null,
    bcc: bccString,
    bccList: bccList.length ? bccList : null,
    replyTo: replyToList.length ? replyToList.join(', ') : null,
    messageId: messageId || null,
    metadata: metadata && Object.keys(metadata).length ? metadata : null,
    ownerUid: ownerUid || null,
  };

  const sentRef = await db.collection('mails').add(docPayload);
  try {
    await sentRef.update({ id: sentRef.id });
  } catch {}

  if (ownerUid) {
    try {
      await db.collection('users').doc(ownerUid).collection('mails').doc(sentRef.id).set(
        {
          ...docPayload,
          id: sentRef.id,
          via: recordOnly ? 'record-only' : 'backend',
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[mailSendService] No se pudo registrar el correo en la subcolección del remitente', error?.message || error);
    }
  }

  const inboxPayload = {
    from: resolvedFrom,
    to: primaryRecipient,
    recipients,
    subject,
    body: bodyText,
    bodyText,
    bodyHtml,
    createdAt: date,
    updatedAt: date,
    date,
    folder: 'inbox',
    read: false,
    attachments,
    cc: ccString,
    ccList: ccList.length ? ccList : null,
    bcc: bccString,
    bccList: bccList.length ? bccList : null,
    replyTo: replyToList.length ? replyToList.join(', ') : null,
    metadata: metadata && Object.keys(metadata).length ? metadata : null,
  };

  const inboxRef = await db.collection('mails').add(inboxPayload);
  try {
    await inboxRef.update({ id: inboxRef.id });
  } catch {}

  const recipientUid = await resolveRecipientUid(recipients);
  if (recipientUid) {
    try {
      await db
        .collection('users')
        .doc(recipientUid)
        .collection('mails')
        .doc(inboxRef.id)
        .set(
          {
            ...inboxPayload,
            id: inboxRef.id,
            via: recordOnly ? 'record-only' : 'backend',
          },
          { merge: true }
        );
    } catch (error) {
      console.warn('[mailSendService] No se pudo registrar el correo en la subcolección del destinatario', error?.message || error);
    }
  }

  return {
    sentId: sentRef.id,
    inboxId: inboxRef.id,
    messageId,
    date,
    from: resolvedFrom,
    to: primaryRecipient,
    recipients,
    bodyText,
    bodyHtml,
    createdAt: date,
  };
}
