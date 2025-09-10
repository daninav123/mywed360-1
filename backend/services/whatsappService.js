import logger from '../logger.js';
import admin from 'firebase-admin';

let twilioClient = null;

// Asegurar inicialización de Firebase Admin si aún no está
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    // no-op; puede estar ya inicializado por middleware
  }
}

async function ensureTwilio() {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();
  if (provider !== 'twilio') {
    throw new Error('WHATSAPP_PROVIDER no soportado: ' + provider);
  }
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    throw new Error('Twilio no configurado. Variables requeridas: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM');
  }
  if (!twilioClient) {
    const mod = await import('twilio');
    const twilio = mod.default || mod;
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return { client: twilioClient, from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` };
}

export function toE164(phone, defaultCountryCode = '') {
  if (!phone) return null;
  let p = String(phone).replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) {
    if (defaultCountryCode) {
      const cc = defaultCountryCode.replace('+', '');
      p = `+${cc}${p}`;
    } else {
      // Asumir que ya viene en nacional, no se puede garantizar E.164 sin CC
      p = `+${p}`;
    }
  }
  return p;
}

function buildStatusCallbackUrl() {
  const envUrl = process.env.WHATSAPP_STATUS_CALLBACK_URL;
  if (envUrl) return envUrl;
  const renderUrl = process.env.BACKEND_BASE_URL || 'https://mywed360-backend.onrender.com';
  return `${renderUrl.replace(/\/$/, '')}/api/whatsapp/webhook/twilio`;
}

export async function sendWhatsAppText({ to, message, weddingId, guestId, templateId = null, scheduleAt = null, metadata = {} }) {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();
  if (provider !== 'twilio') {
    return { success: false, error: 'Proveedor no soportado' };
  }

  try {
    const { client, from } = await ensureTwilio();
    const normalized = toE164(to, process.env.DEFAULT_COUNTRY_CODE || '');
    if (!normalized) return { success: false, error: 'Teléfono inválido' };
    const toE = normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
    const statusCallback = buildStatusCallbackUrl();

    const createParams = {
      from,
      to: toE,
      body: message,
      statusCallback,
    };

    // Twilio no soporta schedule en WhatsApp aún de forma nativa
    const resp = await client.messages.create(createParams);

    // Guardar log inicial
    const log = {
      canal: 'whatsapp',
      modo: 'api',
      weddingId: weddingId || null,
      invitado_id: guestId || null,
      plantilla_id: templateId,
      mensaje_preview: (message || '').slice(0, 500),
      estado: resp.status || 'queued',
      proveedor: 'twilio',
      proveedor_message_id: resp.sid,
      error_code: null,
      scheduled_at: scheduleAt || null,
      sent_at: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || {},
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await admin.firestore().collection('mensajeria_log').doc(resp.sid).set(log, { merge: true });
    } catch (e) {
      logger.warn('[whatsappService] No se pudo escribir en mensajeria_log:', e);
    }

    // Crear/actualizar sesión de conversación (RSVP) si aplica
    try {
      await upsertInviteSession({
        toE164: normalized,
        weddingId: weddingId || null,
        guestId: guestId || null,
        rsvpFlow: Boolean(metadata && metadata.rsvpFlow),
        lastOutboundSid: resp.sid,
        lastMessage: (message || '').slice(0, 500),
      });
    } catch (e) {
      logger.warn('[whatsappService] upsertInviteSession fallo:', e?.message || e);
    }

    return { success: true, provider: 'twilio', sid: resp.sid, status: resp.status };
  } catch (err) {
    logger.error('[whatsappService] Error enviando WhatsApp:', err);
    return { success: false, error: err.message || 'error' };
  }
}

export async function updateDeliveryStatusFromTwilio(payload) {
  try {
    const sid = payload.MessageSid || payload.SmsSid || payload.sid;
    if (!sid) return;
    const status = (payload.MessageStatus || payload.SmsStatus || payload.status || '').toLowerCase();

    const patch = {
      estado: status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (status === 'delivered') patch.delivered_at = admin.firestore.FieldValue.serverTimestamp();
    if (status === 'read') patch.read_at = admin.firestore.FieldValue.serverTimestamp();
    if (status === 'failed' || status === 'undelivered') {
      patch.error_code = payload.ErrorCode || payload.errorCode || null;
    }

    await admin.firestore().collection('mensajeria_log').doc(sid).set(patch, { merge: true });
  } catch (e) {
    logger.error('[whatsappService] Error actualizando estado Twilio:', e);
  }
}

export function providerStatus() {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();
  if (provider !== 'twilio') return { configured: false, provider };
  const ok = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
  return { configured: ok, provider };
}

// ----------------- Conversación entrante (RSVP) -----------------

function normalizeFromWhatsApp(from = '') {
  // from típico: "whatsapp:+34123456789"
  try {
    const f = String(from || '').trim();
    const p = f.replace(/^whatsapp:/i, '');
    return toE164(p, process.env.DEFAULT_COUNTRY_CODE || '');
  } catch (_) {
    return null;
  }
}

function sessionDocIdFromPhone(e164) {
  return (e164 || '').replace(/^\+/, '');
}

async function upsertInviteSession({ toE164, weddingId, guestId, rsvpFlow = false, lastOutboundSid = null, lastMessage = '' }) {
  try {
    if (!toE164) return;
    const docId = sessionDocIdFromPhone(toE164);
    const ref = admin.firestore().collection('whatsapp_sessions').doc(docId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const snap = await ref.get();
    const base = {
      phoneE164: toE164,
      weddingId: weddingId || null,
      guestId: guestId || null,
      provider: 'twilio',
      updatedAt: now,
      lastOutboundSid: lastOutboundSid || null,
      lastOutboundPreview: lastMessage || '',
    };
    if (!snap.exists) {
      await ref.set({
        ...base,
        state: rsvpFlow ? 'awaiting_accept' : 'idle',
        lastPrompt: rsvpFlow ? 'ask_accept' : null,
        createdAt: now,
      }, { merge: true });
    } else {
      await ref.set({ ...base, state: rsvpFlow ? 'awaiting_accept' : (snap.get('state') || 'idle') }, { merge: true });
    }
  } catch (e) {
    logger.warn('[whatsappService] upsertInviteSession error:', e?.message || e);
  }
}

function parseYesNo(text = '') {
  const t = String(text || '').trim().toLowerCase();
  const yes = ['1', 'si', 'sí', 'acepto', 'confirmo', 'voy', 'asisto', 'sí voy', 'si voy', 'confirmada', 'confirmado'];
  const no = ['2', 'no', 'rechazo', 'no voy', 'no asisto', 'no puedo', 'cancelo'];
  if (yes.some((k) => t === k || t.includes(k))) return 'yes';
  if (no.some((k) => t === k || t.includes(k))) return 'no';
  return 'unknown';
}

function parseCompanions(text = '') {
  const m = String(text || '').match(/-?\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  if (isNaN(n) || n < 0) return 0;
  if (n > 20) return 20; // límite razonable
  return n;
}

async function replyWhatsApp(toE164, body) {
  const { client, from } = await ensureTwilio();
  const to = toE164.startsWith('whatsapp:') ? toE164 : `whatsapp:${toE164}`;
  const statusCallback = buildStatusCallbackUrl();
  return client.messages.create({ from, to, body, statusCallback });
}

async function updateGuestDoc({ weddingId, guestId, patch }) {
  if (!weddingId || !guestId) return false;
  try {
    const ref = admin.firestore().collection('weddings').doc(weddingId).collection('guests').doc(guestId);
    await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return true;
  } catch (e) {
    logger.error('[whatsappService] updateGuestDoc error:', e);
    return false;
  }
}

async function logInbound({ sid, fromE164, toE164, body, weddingId, guestId, waId, profileName }) {
  try {
    const ref = admin.firestore().collection('mensajeria_log').doc(sid || `in_${Date.now()}`);
    await ref.set({
      canal: 'whatsapp',
      modo: 'api',
      tipo: 'inbound',
      proveedor: 'twilio',
      proveedor_message_id: sid || null,
      from: fromE164 || null,
      to: toE164 || null,
      body: (body || '').slice(0, 1000),
      weddingId: weddingId || null,
      invitado_id: guestId || null,
      waId: waId || null,
      profileName: profileName || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    logger.warn('[whatsappService] logInbound error:', e?.message || e);
  }
}

export async function handleIncomingMessage(payload) {
  try {
    const fromRaw = payload.From || payload.from;
    const body = payload.Body || payload.body || '';
    const waId = payload.WaId || payload.WAID || null;
    const profileName = payload.ProfileName || payload.profileName || null;
    const fromE164 = normalizeFromWhatsApp(fromRaw);
    if (!fromE164) return;
    const docId = sessionDocIdFromPhone(fromE164);
    const sessions = admin.firestore().collection('whatsapp_sessions');
    const ref = sessions.doc(docId);
    const snap = await ref.get();
    const session = snap.exists ? snap.data() : null;

    // Registrar inbound en log
    await logInbound({ sid: payload.MessageSid || payload.SmsSid || null, fromE164, toE164: (payload.To || '').replace(/^whatsapp:/i, ''), body, weddingId: session?.weddingId || null, guestId: session?.guestId || null, waId, profileName });

    if (!session) {
      // Sin sesión conocida: pedir identificación
      const msg = 'Hola, no pudimos identificar tu invitación. Responde con "AYUDA" para asistencia o espera a recibir un mensaje de invitación para iniciar el cuestionario.';
      try { await replyWhatsApp(fromE164, msg); } catch {}
      return;
    }

    const state = session.state || 'idle';
    const weddingId = session.weddingId || null;
    const guestId = session.guestId || null;

    // Helper para actualizar sesión
    const updateSession = async (patch) => {
      try {
        await ref.set({ ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } catch (e) {
        logger.warn('[whatsappService] updateSession error:', e?.message || e);
      }
    };

    if (state === 'awaiting_accept') {
      const yn = parseYesNo(body);
      if (yn === 'yes') {
        // Actualizar invitado como confirmado (compat con UI + RSVP)
        await updateGuestDoc({ weddingId, guestId, patch: { status: 'confirmed', status_rsvp: 'accepted', response: 'Sí' } });
        await updateSession({ state: 'awaiting_companions', lastPrompt: 'ask_companions' });
        await replyWhatsApp(fromE164, '¡Genial! ¿Vendrás con acompañantes? Responde únicamente con un número (0 si vienes sin acompañante).');
        return;
      }
      if (yn === 'no') {
        await updateGuestDoc({ weddingId, guestId, patch: { status: 'declined', status_rsvp: 'rejected', response: 'No', companions: 0, companion: 0 } });
        await updateSession({ state: 'completed', lastPrompt: 'completed' });
        await replyWhatsApp(fromE164, 'Gracias por responder. Hemos registrado que no podrás asistir. Si cambia tu situación, avísanos.');
        return;
      }
      await replyWhatsApp(fromE164, 'Por favor responde "Sí" o "No" (también puedes responder 1 para Sí o 2 para No).');
      return;
    }

    if (state === 'awaiting_companions') {
      const n = parseCompanions(body);
      if (n === null) {
        await replyWhatsApp(fromE164, 'No entendí el número de acompañantes. Responde solo con un número (0, 1, 2, ...).');
        return;
      }
      await updateGuestDoc({ weddingId, guestId, patch: { companions: n, companion: n } });
      await updateSession({ state: 'awaiting_allergens', lastPrompt: 'ask_allergens', companions: n });
      await replyWhatsApp(fromE164, '¿Alguna restricción alimentaria o alergia? Responde "ninguna" si no tienes.');
      return;
    }

    if (state === 'awaiting_allergens') {
      const text = String(body || '').trim();
      const none = ['ninguna', 'no', 'ninguno', 'ningunas', 'ningunos'];
      const allergens = none.includes(text.toLowerCase()) ? '' : text.slice(0, 500);
      await updateGuestDoc({ weddingId, guestId, patch: { allergens } });
      await updateSession({ state: 'completed', lastPrompt: 'completed' });

      // Mensaje de cierre con resumen
      const n = session.companions ?? 0;
      const resumen = `¡Gracias! Hemos registrado tu confirmación${n ? ` con ${n} acompañante(s)` : ''}${allergens ? ` y alergias/restricciones: ${allergens}` : ''}.`;
      await replyWhatsApp(fromE164, resumen);
      return;
    }

    // Estado idle o desconocido
    await replyWhatsApp(fromE164, 'Hola, ya hemos registrado tu respuesta. Si necesitas cambiar algo, responde "AYUDA".');
  } catch (e) {
    logger.error('[whatsappService] handleIncomingMessage error:', e);
  }
}
