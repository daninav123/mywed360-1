const functions = require('firebase-functions');
const createCors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const { z } = require('zod');
// Usar fetch nativo de Node 18+ (Cloud Functions Node 20)
const fetch = globalThis.fetch;
let FormDataLib = null;
try {
  FormDataLib = require('form-data');
} catch (_) {
  FormDataLib = null;
}
const admin = require('firebase-admin');
// Inicializar Admin SDK solo una vez
if (!admin.apps?.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ==========================================
// ✅ NUEVA CLOUD FUNCTION: onMailUpdated
// ==========================================
// Actualiza contadores de carpetas cuando un email cambia

exports.onMailUpdated = functions.firestore
  .document('users/{uid}/mails/{emailId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid;

    console.log('[onMailUpdated] Procesando cambio', { uid, emailId: context.params.emailId });

    try {
      // Si cambió la carpeta
      if (before.folder !== after.folder) {
        console.log('[onMailUpdated] Carpeta cambió:', before.folder, '->', after.folder);

        // Decrementar contador de carpeta anterior
        if (before.folder) {
          await updateFolderCount(uid, before.folder, -1, before.read ? 0 : -1);
        }

        // Incrementar contador de carpeta nueva
        if (after.folder) {
          await updateFolderCount(uid, after.folder, 1, after.read ? 0 : 1);
        }
      }

      // Si cambió el estado de leído (dentro de la misma carpeta)
      else if (before.read !== after.read && after.folder) {
        console.log('[onMailUpdated] Estado read cambió:', before.read, '->', after.read);

        const unreadDelta = after.read ? -1 : 1; // Si se marcó como leído, decrementar unread
        await updateFolderCount(uid, after.folder, 0, unreadDelta);
      }

      return null;
    } catch (error) {
      console.error('[onMailUpdated] Error:', error);
      // No throw, para no fallar la Cloud Function
      return null;
    }
  });

/**
 * Actualiza los contadores de una carpeta
 * @param {string} uid - ID del usuario
 * @param {string} folder - ID de la carpeta (inbox, sent, trash, custom:xxx)
 * @param {number} totalDelta - Cambio en total de emails (-1, 0, +1)
 * @param {number} unreadDelta - Cambio en no leídos
 */
async function updateFolderCount(uid, folder, totalDelta, unreadDelta) {
  if (!folder) return;

  try {
    const statsRef = db.collection('emailFolderStats').doc(`${uid}_${folder}`);

    const updates = {
      uid,
      folder,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (totalDelta !== 0) {
      updates.totalCount = admin.firestore.FieldValue.increment(totalDelta);
    }

    if (unreadDelta !== 0) {
      updates.unreadCount = admin.firestore.FieldValue.increment(unreadDelta);
    }

    await statsRef.set(updates, { merge: true });

    console.log(`[updateFolderCount] Actualizado ${uid}/${folder}:`, { totalDelta, unreadDelta });
  } catch (error) {
    console.error('[updateFolderCount] Error:', error);
  }
}

// Función auxiliar para obtener contadores de una carpeta
exports.getFolderStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const uid = context.auth.uid;
  const folder = data.folder || 'inbox';

  try {
    const doc = await db.collection('emailFolderStats').doc(`${uid}_${folder}`).get();

    if (!doc.exists) {
      return { totalCount: 0, unreadCount: 0 };
    }

    const data = doc.data();
    return {
      totalCount: data.totalCount || 0,
      unreadCount: data.unreadCount || 0,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    };
  } catch (error) {
    console.error('[getFolderStats] Error:', error);
    throw new functions.https.HttpsError('internal', 'Error obteniendo estadísticas');
  }
});

// ==========================================
// FIN DE NUEVA CLOUD FUNCTION
// ==========================================

const BUDGET_CATEGORY_ALIASES = new Map([
  [
    'catering',
    ['banquete', 'comida', 'restauracion', 'restauración', 'menu', 'menú', 'meal', 'banqueteria'],
  ],
  ['photo', ['fotografia', 'fotografía', 'foto', 'photos', 'fotografos', 'fotógrafos']],
  ['video', ['video', 'vídeo', 'filmacion', 'filmación', 'videografo']],
  ['music', ['musica', 'música', 'dj', 'band', 'orquesta', 'sonido']],
  ['flowers', ['flores', 'floristeria', 'floristería', 'decor floral', 'floral']],
  ['venue', ['lugar', 'espacio', 'salon', 'salón', 'venue']],
  ['planner', ['wedding planner', 'planificador', 'coordinacion', 'coordinación']],
  ['beauty', ['maquillaje', 'peluqueria', 'peluquería', 'beauty', 'estética', 'estetica']],
  ['stationery', ['papeleria', 'papelería', 'invitaciones', 'invitacion', 'seatings']],
  ['lighting', ['luces', 'iluminacion', 'iluminación', 'sonido e iluminación']],
  ['transport', ['transporte', 'autobus', 'autobús', 'bus', 'coche']],
  ['cake', ['tarta', 'pastel', 'postre']],
  ['decor', ['decoracion', 'decoración', 'ambientacion', 'ambientación']],
]);

// ----- CORS estricto para Functions -----
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'https://maloveapp.netlify.app'];
const ALLOWED_ORIGINS = String(
  process.env.FUNCTIONS_ALLOWED_ORIGINS ||
    process.env.ALLOWED_ORIGIN ||
    DEFAULT_ALLOWED_ORIGINS.join(',')
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsHandler = createCors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ----- Configuración y utilidades de autenticación admin -----
const ADMIN_EMAIL = String(
  process.env.ADMIN_EMAIL ||
    process.env.VITE_ADMIN_EMAIL ||
    process.env.ADMIN_USER_EMAIL ||
    'admin@maloveapp.com'
)
  .trim()
  .toLowerCase();
const ADMIN_NAME =
  process.env.ADMIN_NAME || process.env.VITE_ADMIN_NAME || 'Administrador MaLoveApp';
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || process.env.VITE_ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_FALLBACK = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || '';
const ADMIN_REQUIRE_MFA =
  String(process.env.ADMIN_REQUIRE_MFA || process.env.VITE_ADMIN_REQUIRE_MFA || 'true')
    .toLowerCase()
    .trim() !== 'false';
const ADMIN_MFA_SECRET = process.env.ADMIN_MFA_SECRET || process.env.VITE_ADMIN_MFA_SECRET || '';
const ADMIN_MFA_WINDOW_SECONDS = Number(
  process.env.ADMIN_MFA_WINDOW_SECONDS || process.env.VITE_ADMIN_MFA_WINDOW_SECONDS || 90
);
const ADMIN_LOGIN_MAX_ATTEMPTS = Number(
  process.env.ADMIN_LOGIN_MAX_ATTEMPTS || process.env.VITE_ADMIN_LOGIN_MAX_ATTEMPTS || 5
);
const ADMIN_LOGIN_WINDOW_MINUTES = Number(
  process.env.ADMIN_LOGIN_WINDOW_MINUTES || process.env.VITE_ADMIN_LOGIN_WINDOW_MINUTES || 60
);
const ADMIN_LOGIN_LOCK_MINUTES = Number(
  process.env.ADMIN_LOGIN_LOCK_MINUTES || process.env.VITE_ADMIN_LOGIN_LOCK_MINUTES || 15
);
const ADMIN_SESSION_TTL_MINUTES = Number(
  process.env.ADMIN_SESSION_TTL_MINUTES || process.env.VITE_ADMIN_SESSION_TTL_MINUTES || 720
);

authenticator.options = {
  window: Number(
    process.env.ADMIN_MFA_WINDOW_DRIFT || process.env.VITE_ADMIN_MFA_WINDOW_DRIFT || 1
  ),
};

const LOGIN_ATTEMPTS_COLLECTION = 'adminLoginAttempts';
const LOGIN_CHALLENGES_COLLECTION = 'adminLoginChallenges';
const ADMIN_SESSIONS_COLLECTION = 'adminSessions';

const ADMIN_PROFILE = {
  id: 'admin-local',
  name: ADMIN_NAME,
  email: ADMIN_EMAIL,
  role: 'admin',
  isAdmin: true,
  permissions: ['*'],
  preferences: {
    theme: 'dark',
    emailNotifications: false,
  },
};

const ADMIN_USER = {
  uid: 'admin-local',
  email: ADMIN_EMAIL,
  displayName: ADMIN_NAME,
};

function getAdminProfile() {
  return {
    ...ADMIN_PROFILE,
    email: ADMIN_EMAIL,
  };
}

function getAdminUser() {
  return {
    ...ADMIN_USER,
    email: ADMIN_EMAIL,
    displayName: ADMIN_NAME,
  };
}

function toIsoDate(value) {
  try {
    if (value && typeof value.toISOString === 'function') {
      return value.toISOString();
    }
  } catch {}
  return null;
}

const loginSchema = z.object({
  email: z.string().trim().min(3, 'Email requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const mfaSchema = z.object({
  challengeId: z.string().min(10, 'Challenge inválido'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'Código MFA inválido')
    .transform((value) => value.trim()),
  resumeToken: z.string().min(10, 'Token inválido'),
});

const logoutSchema = z.object({
  sessionToken: z.string().min(20, 'Token de sesión requerido'),
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim());
    if (parts.length && parts[0]) return parts[0];
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function getUserAgent(req) {
  return req.headers['user-agent'] || req.headers['User-Agent'] || 'unknown';
}

async function recordAdminAudit(action, payload = {}) {
  try {
    const entry = {
      action,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...payload,
    };
    await db.collection('adminAuditLogs').add(entry);
  } catch (error) {
    console.error('[adminAudit] No se pudo registrar el evento', error);
  }
}

async function getLoginAttemptDoc(email, ip) {
  const key = hashToken(`${email}|${ip || 'unknown'}`);
  return db.collection(LOGIN_ATTEMPTS_COLLECTION).doc(key);
}

async function getLoginAttemptState(email, ip) {
  const ref = await getLoginAttemptDoc(email, ip);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ref, locked: false, data: null };
  const data = snapshot.data() || {};
  const now = Date.now();
  const lockedUntil = data.lockedUntil?.toMillis ? data.lockedUntil.toMillis() : null;
  if (lockedUntil && lockedUntil > now) {
    return {
      ref,
      locked: true,
      lockedUntil: new Date(lockedUntil),
      data,
    };
  }
  const firstAttemptAt = data.firstAttemptAt?.toMillis ? data.firstAttemptAt.toMillis() : null;
  if (firstAttemptAt && now - firstAttemptAt > ADMIN_LOGIN_WINDOW_MINUTES * 60 * 1000) {
    await ref.delete().catch(() => {});
    return { ref, locked: false, data: null };
  }
  return { ref, locked: false, data };
}

async function incrementLoginFailure(email, ip) {
  const { ref, data } = await getLoginAttemptState(email, ip);
  const now = Date.now();
  const base = data || {};
  const firstAttemptAt = base.firstAttemptAt?.toMillis?.() || now;
  const count = Number(base.count || 0) + 1;
  const update = {
    email,
    ip,
    count,
    firstAttemptAt: admin.firestore.Timestamp.fromMillis(firstAttemptAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    const lockedUntilDate = new Date(now + ADMIN_LOGIN_LOCK_MINUTES * 60 * 1000);
    update.count = 0;
    update.lockedUntil = admin.firestore.Timestamp.fromDate(lockedUntilDate);
    await ref.set(update, { merge: true });
    return {
      locked: true,
      lockedUntil: lockedUntilDate,
    };
  }

  await ref.set(update, { merge: true });
  return { locked: false };
}

async function resetLoginAttempts(email, ip) {
  try {
    const ref = await getLoginAttemptDoc(email, ip);
    await ref.delete();
  } catch (error) {
    console.warn('[adminLogin] No se pudo limpiar attempts', error);
  }
}

async function verifyAdminPassword(password) {
  if (ADMIN_PASSWORD_HASH) {
    try {
      return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } catch (error) {
      console.error('[adminLogin] Error verificando hash', error);
      return false;
    }
  }
  if (ADMIN_PASSWORD_FALLBACK) {
    return password === ADMIN_PASSWORD_FALLBACK;
  }
  console.error('[adminLogin] No hay contraseña configurada');
  return false;
}

async function createMfaChallenge(email, ip, userAgent) {
  const challengeId = crypto.randomUUID();
  const resumeToken = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + ADMIN_MFA_WINDOW_SECONDS * 1000);

  await db
    .collection(LOGIN_CHALLENGES_COLLECTION)
    .doc(challengeId)
    .set({
      email,
      ip,
      userAgent,
      resumeTokenHash: hashToken(resumeToken),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
    });

  return { challengeId, resumeToken, expiresAt };
}

async function consumeMfaChallenge(challengeId) {
  try {
    await db.collection(LOGIN_CHALLENGES_COLLECTION).doc(challengeId).set(
      {
        status: 'consumed',
        consumedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[adminLogin] No se pudo marcar challenge como consumido', error);
  }
}

async function createAdminSession(email, metadata = {}) {
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MINUTES * 60 * 1000);
  const tokenHash = hashToken(sessionToken);

  await db
    .collection(ADMIN_SESSIONS_COLLECTION)
    .doc(sessionId)
    .set({
      sessionId,
      email,
      tokenHash,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      metadata: {
        ip: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        reason: metadata.reason || 'login',
      },
    });

  return {
    sessionId,
    sessionToken,
    expiresAt,
  };
}

async function endAdminSession(sessionToken, reason = 'logout') {
  if (!sessionToken) return;
  const tokenHash = hashToken(sessionToken);
  const snapshot = await db
    .collection(ADMIN_SESSIONS_COLLECTION)
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data() || {};
  await doc.ref.set(
    {
      status: 'terminated',
      terminatedAt: admin.firestore.FieldValue.serverTimestamp(),
      terminationReason: reason,
    },
    { merge: true }
  );
  return {
    email: data.email || ADMIN_EMAIL,
    sessionId: data.sessionId,
  };
}

// ----- Helpers de autenticación (Firebase ID token) -----
const allowMockTokens = (() => {
  const v = process.env.ALLOW_MOCK_TOKENS;
  return v ? v !== 'false' : process.env.NODE_ENV !== 'production';
})();

function getBearerToken(req) {
  try {
    const h = req.headers['authorization'] || req.headers['Authorization'];
    if (!h) return null;
    const p = String(h).split(' ');
    if (p.length !== 2 || p[0] !== 'Bearer') return null;
    return p[1];
  } catch {
    return null;
  }
}

async function verifyIdTokenOrMock(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  if (allowMockTokens && token.startsWith('mock-')) {
    // mock-<uid>-<email>
    const parts = token.split('-');
    if (parts.length >= 3) {
      return { uid: parts[1], email: parts.slice(2).join('-'), email_verified: true };
    }
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}
// Configuración para Mailgun
// Usar variable de entorno primero; si no existe, intentar leer de funciones config y evitar TypeError
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || functions.config().mailgun?.key || '';
const MAILGUN_DOMAIN =
  process.env.MAILGUN_DOMAIN || functions.config().mailgun?.domain || 'maloveapp.com';
// Permitir sobreescribir la URL base (soporta US y EU)
const MAILGUN_BASE_URL =
  process.env.MAILGUN_BASE_URL ||
  functions.config().mailgun?.base_url ||
  'https://api.mailgun.net/v3';
const MAILGUN_SIGNING_KEY =
  process.env.MAILGUN_SIGNING_KEY || functions.config().mailgun?.signing_key || '';

// Función para obtener eventos de Mailgun
exports.getMailgunEvents = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      const user = await verifyIdTokenOrMock(request);
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }
      // Verificar que el usuario está autenticado (recomendado usar Firebase Auth)
      // const authHeader = request.headers.authorization;
      // if (!authHeader || !authHeader.startsWith('Bearer ')) {
      //   return response.status(401).json({ error: 'Unauthorized' });
      // }
      // const idToken = authHeader.split('Bearer ')[1];
      // await admin.auth().verifyIdToken(idToken);

      // Obtener parámetros de consulta
      const { recipient, from, event = 'delivered', limit = 50 } = request.query;

      if (!recipient && !from) {
        return response.status(400).json({ error: 'Se requiere "recipient" o "from"' });
      }

      // Construir URL para Mailgun
      const params = new URLSearchParams({
        event,
        limit: String(Math.min(300, Math.max(1, Number(limit) || 50))),
      });
      if (recipient) params.append('recipient', recipient);
      if (from) params.append('from', from);

      // Determinar dominio a consultar: si el email pertenece a maloveapp.com usar dominio raíz, si es mg.maloveapp.com usar subdominio
      let targetDomain = MAILGUN_DOMAIN;
      const sampleEmail = recipient || from;
      if (sampleEmail) {
        const domainPart = sampleEmail.split('@')[1] || '';
        if (domainPart === 'maloveapp.com') {
          targetDomain = 'maloveapp.com';
        } else if (domainPart === 'mg.maloveapp.com') {
          targetDomain = 'mg.maloveapp.com';
        }
      }

      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

      // Hacer solicitud a Mailgun API
      const mailgunResponse = await fetch(
        `${MAILGUN_BASE_URL}/${targetDomain}/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText,
        });
      }

      const data = await mailgunResponse.json();
      return response.json(data);
    } catch (error) {
      console.error('Error processing Mailgun events request:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// Función para enviar correos a través de Mailgun
exports.sendEmail = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    // Configurar CORS de forma explícita
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // Preflight
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Requiere autenticación Firebase
      const user = await verifyIdTokenOrMock(request);
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }
      // Extraer datos del cuerpo
      const { from, to, subject, body, html, attachments } = request.body;

      if (!from || !to || !subject || (!body && !html)) {
        return response.status(400).json({ error: 'Missing required fields' });
      }

      // Construir formData para Mailgun
      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

      // Si hay adjuntos, usar multipart/form-data con descarga de URLs
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      let mailgunResponse;
      if (hasAttachments && FormDataLib) {
        const ATTACHMENT_MAX_BYTES = Number(
          process.env.EMAIL_ATTACHMENT_MAX_BYTES || 5 * 1024 * 1024
        );
        const ATTACHMENT_TIMEOUT_MS = Number(process.env.EMAIL_ATTACHMENT_TIMEOUT_MS || 10000);
        const DEFAULT_ALLOWED_MIME = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'text/plain',
        ];
        const ALLOWED_MIME = String(
          process.env.EMAIL_ATTACHMENT_ALLOWED_MIME || DEFAULT_ALLOWED_MIME.join(',')
        )
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        const inferMimeFromName = (name) => {
          try {
            const n = String(name || '').toLowerCase();
            if (n.endsWith('.pdf')) return 'application/pdf';
            if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
            if (n.endsWith('.png')) return 'image/png';
            if (n.endsWith('.gif')) return 'image/gif';
            if (n.endsWith('.webp')) return 'image/webp';
            if (n.endsWith('.svg')) return 'image/svg+xml';
            if (n.endsWith('.txt')) return 'text/plain';
          } catch {}
          return '';
        };
        const form = new FormDataLib();
        form.append('from', from);
        form.append('to', to);
        form.append('subject', subject);
        if (body) form.append('text', body);
        if (html) form.append('html', html);

        for (const att of attachments) {
          if (!att) continue;
          const filename = att.filename || att.name || 'attachment';
          if (att.url) {
            try {
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), ATTACHMENT_TIMEOUT_MS);
              const resp = await fetch(att.url, { signal: controller.signal });
              clearTimeout(t);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              // Validar tipo MIME permitido
              let ctype = '';
              try {
                ctype =
                  (resp.headers &&
                    (resp.headers.get
                      ? resp.headers.get('content-type')
                      : resp.headers['content-type'])) ||
                  '';
              } catch {}
              const baseType = String(ctype || '')
                .split(';')[0]
                .trim()
                .toLowerCase();
              const inferred = baseType || inferMimeFromName(filename || att.url || '');
              if (ALLOWED_MIME.length && inferred && !ALLOWED_MIME.includes(inferred)) {
                throw new Error(`Attachment content-type not allowed: ${inferred}`);
              }
              const lenHeader = resp.headers?.get
                ? resp.headers.get('content-length')
                : resp.headers && resp.headers['content-length'];
              const contentLength = Number(lenHeader || 0);
              if (contentLength && contentLength > ATTACHMENT_MAX_BYTES) {
                throw new Error(
                  `Attachment too large (${contentLength} > ${ATTACHMENT_MAX_BYTES})`
                );
              }
              const buf = Buffer.from(await resp.arrayBuffer());
              if (buf.length > ATTACHMENT_MAX_BYTES) {
                throw new Error(
                  `Attachment too large after download (${buf.length} > ${ATTACHMENT_MAX_BYTES})`
                );
              }
              form.append('attachment', buf, { filename });
            } catch (e) {
              console.warn('No se pudo adjuntar archivo desde URL:', filename, e?.message || e);
            }
          }
        }

        mailgunResponse = await fetch(`${MAILGUN_BASE_URL}/${MAILGUN_DOMAIN}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            ...form.getHeaders(),
          },
          body: form,
        });
      } else {
        const formData = new URLSearchParams();
        formData.append('from', from);
        formData.append('to', to);
        formData.append('subject', subject);
        if (body) formData.append('text', body);
        if (html) formData.append('html', html);
        mailgunResponse = await fetch(`${MAILGUN_BASE_URL}/${MAILGUN_DOMAIN}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });
      }

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText,
        });
      }

      const data = await mailgunResponse.json();
      return response.json(data);
    } catch (error) {
      console.error('Error sending email:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// ----- Autenticación administrativa -----
exports.adminLogin = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ success: false, code: 'method_not_allowed' });
    }

    let payload = request.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return response
          .status(400)
          .json({ success: false, code: 'invalid_json', message: 'JSON inválido' });
      }
    }
    payload = payload || {};

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      return response.status(400).json({
        success: false,
        code: 'invalid_payload',
        message: 'Email y contraseña son obligatorios',
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const attemptEmail = ADMIN_EMAIL;
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    const lockStatus = await getLoginAttemptState(attemptEmail, ip);
    if (lockStatus.locked) {
      await recordAdminAudit('ADMIN_ACCESS_BLOCKED', {
        actor: normalizedEmail,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          lockedUntil: toIsoDate(lockStatus.lockedUntil),
        },
      });
      return response.status(429).json({
        success: false,
        code: 'locked',
        message: 'Acceso bloqueado temporalmente. Inténtalo de nuevo en unos minutos.',
        lockedUntil: toIsoDate(lockStatus.lockedUntil),
      });
    }

    if (normalizedEmail !== ADMIN_EMAIL) {
      const failure = await incrementLoginFailure(attemptEmail, ip);
      await recordAdminAudit('ADMIN_ACCESS_DENIED', {
        actor: normalizedEmail,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'invalid_email',
        },
      });
      return response.status(failure.locked ? 429 : 401).json({
        success: false,
        code: failure.locked ? 'locked' : 'invalid_credentials',
        message: 'Email o contraseña no válidos',
        lockedUntil: failure.locked ? toIsoDate(failure.lockedUntil) : null,
      });
    }

    const passwordOk = await verifyAdminPassword(password);
    if (!passwordOk) {
      const failure = await incrementLoginFailure(attemptEmail, ip);
      await recordAdminAudit('ADMIN_ACCESS_DENIED', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'invalid_password',
        },
      });
      return response.status(failure.locked ? 429 : 401).json({
        success: false,
        code: failure.locked ? 'locked' : 'invalid_credentials',
        message: 'Email o contraseña no válidos',
        lockedUntil: failure.locked ? toIsoDate(failure.lockedUntil) : null,
      });
    }

    await resetLoginAttempts(attemptEmail, ip);

    if (ADMIN_REQUIRE_MFA) {
      if (!ADMIN_MFA_SECRET) {
        console.error('[adminLogin] MFA requerido pero ADMIN_MFA_SECRET no está configurado');
        return response.status(500).json({
          success: false,
          code: 'mfa_not_configured',
          message: 'No se pudo completar el login (MFA no disponible).',
        });
      }
      const challenge = await createMfaChallenge(ADMIN_EMAIL, ip, userAgent);
      await recordAdminAudit('ADMIN_MFA_CHALLENGE', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'challenge',
        metadata: {
          ip,
          challengeId: challenge.challengeId,
        },
      });
      return response.json({
        success: true,
        requiresMfa: true,
        challengeId: challenge.challengeId,
        resumeToken: challenge.resumeToken,
        expiresAt: challenge.expiresAt.toISOString(),
      });
    }

    const session = await createAdminSession(ADMIN_EMAIL, {
      ip,
      userAgent,
      reason: 'password-only',
    });
    const profile = getAdminProfile();
    const adminUser = getAdminUser();

    await recordAdminAudit('ADMIN_LOGIN_SUCCESS', {
      actor: ADMIN_EMAIL,
      resourceType: 'auth',
      outcome: 'granted',
      metadata: {
        ip,
        userAgent,
        sessionId: session.sessionId,
      },
    });

    return response.json({
      success: true,
      requiresMfa: false,
      sessionToken: session.sessionToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      sessionId: session.sessionId,
      adminUser,
      profile,
    });
  });
});

exports.adminLoginMfa = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ success: false, code: 'method_not_allowed' });
    }

    let payload = request.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return response
          .status(400)
          .json({ success: false, code: 'invalid_json', message: 'JSON inválido' });
      }
    }
    payload = payload || {};

    const parsed = mfaSchema.safeParse(payload);
    if (!parsed.success) {
      return response.status(400).json({
        success: false,
        code: 'invalid_payload',
        message: 'Código MFA inválido',
      });
    }

    const { challengeId, code, resumeToken } = parsed.data;
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);
    const attemptEmail = ADMIN_EMAIL;

    const challengeRef = db.collection(LOGIN_CHALLENGES_COLLECTION).doc(challengeId);
    const snapshot = await challengeRef.get();
    if (!snapshot.exists) {
      await recordAdminAudit('ADMIN_MFA_FAILED', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'challenge_not_found',
        },
      });
      return response.status(404).json({
        success: false,
        code: 'challenge_not_found',
        message: 'El desafío MFA no existe o ya fue consumido.',
      });
    }

    const challenge = snapshot.data() || {};
    if (challenge.status === 'consumed') {
      return response.status(409).json({
        success: false,
        code: 'challenge_consumed',
        message: 'El desafío ya fue completado.',
      });
    }

    const expectedHash = challenge.resumeTokenHash;
    if (!expectedHash || hashToken(resumeToken) !== expectedHash) {
      const failure = await incrementLoginFailure(attemptEmail, ip);
      await recordAdminAudit('ADMIN_MFA_FAILED', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'resume_token_mismatch',
        },
      });
      return response.status(failure.locked ? 429 : 401).json({
        success: false,
        code: failure.locked ? 'locked' : 'invalid_mfa',
        message: 'Código MFA inválido.',
        lockedUntil: failure.locked ? toIsoDate(failure.lockedUntil) : null,
      });
    }

    const expiresAtMillis = challenge.expiresAt?.toMillis?.() || 0;
    if (expiresAtMillis && expiresAtMillis < Date.now()) {
      await challengeRef.set(
        {
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      const failure = await incrementLoginFailure(attemptEmail, ip);
      await recordAdminAudit('ADMIN_MFA_FAILED', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'challenge_expired',
        },
      });
      return response.status(failure.locked ? 429 : 410).json({
        success: false,
        code: failure.locked ? 'locked' : 'challenge_expired',
        message: 'El desafío ha expirado. Inicia sesión de nuevo.',
        lockedUntil: failure.locked ? toIsoDate(failure.lockedUntil) : null,
      });
    }

    const validMfa = !ADMIN_REQUIRE_MFA || authenticator.check(code, ADMIN_MFA_SECRET);

    if (!validMfa) {
      await challengeRef.set(
        {
          attempts: (challenge.attempts || 0) + 1,
          lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      const failure = await incrementLoginFailure(attemptEmail, ip);
      await recordAdminAudit('ADMIN_MFA_FAILED', {
        actor: ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'denied',
        metadata: {
          ip,
          reason: 'invalid_code',
        },
      });
      return response.status(failure.locked ? 429 : 401).json({
        success: false,
        code: failure.locked ? 'locked' : 'invalid_mfa',
        message: 'Código MFA inválido.',
        lockedUntil: failure.locked ? toIsoDate(failure.lockedUntil) : null,
      });
    }

    await consumeMfaChallenge(challengeId);
    await resetLoginAttempts(attemptEmail, ip);

    const session = await createAdminSession(ADMIN_EMAIL, {
      ip,
      userAgent,
      reason: 'password+mfa',
    });
    const profile = getAdminProfile();
    const adminUser = getAdminUser();

    await recordAdminAudit('ADMIN_MFA_SUCCESS', {
      actor: ADMIN_EMAIL,
      resourceType: 'auth',
      outcome: 'granted',
      metadata: {
        ip,
        userAgent,
        challengeId,
      },
    });

    await recordAdminAudit('ADMIN_LOGIN_SUCCESS', {
      actor: ADMIN_EMAIL,
      resourceType: 'auth',
      outcome: 'granted',
      metadata: {
        ip,
        userAgent,
        sessionId: session.sessionId,
        strategy: 'password+mfa',
      },
    });

    return response.json({
      success: true,
      sessionToken: session.sessionToken,
      sessionExpiresAt: session.expiresAt.toISOString(),
      sessionId: session.sessionId,
      adminUser,
      profile,
    });
  });
});

exports.adminLogout = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ success: false, code: 'method_not_allowed' });
    }

    let payload = request.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return response
          .status(400)
          .json({ success: false, code: 'invalid_json', message: 'JSON inválido' });
      }
    }
    payload = payload || {};

    const parsed = logoutSchema.safeParse(payload);
    if (!parsed.success) {
      return response.status(400).json({
        success: false,
        code: 'invalid_payload',
        message: 'Token de sesión requerido',
      });
    }

    const { sessionToken } = parsed.data;
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    const session = await endAdminSession(sessionToken, 'logout');
    if (session) {
      await recordAdminAudit('ADMIN_LOGOUT', {
        actor: session.email || ADMIN_EMAIL,
        resourceType: 'auth',
        outcome: 'logout',
        metadata: {
          ip,
          userAgent,
          sessionId: session.sessionId,
        },
      });
    }

    return response.json({ success: true });
  });
});

// ------------------------------
// Webhook: recepción de eventos de Mailgun
// ------------------------------
exports.mailgunWebhook = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
      if (!MAILGUN_SIGNING_KEY && isProd) {
        console.error('MAILGUN_SIGNING_KEY no configurada');
        return response.status(500).json({ error: 'Signing key not configured' });
      }
      // Mailgun puede enviar un único evento o un array bajo "signature"+"event-data"
      const events = Array.isArray(request.body) ? request.body : [request.body];

      // Verificación de firma (primer evento) para asegurar origen Mailgun
      if (MAILGUN_SIGNING_KEY) {
        for (const evt of events) {
          const sig = evt?.signature;
          if (!sig) {
            console.warn('Webhook Mailgun sin firma');
            return response.status(401).json({ error: 'Missing signature' });
          }
          const signed = String(sig.signature || '');
          const token = String(sig.token || '');
          const timestamp = String(sig.timestamp || '');
          const hmac = crypto
            .createHmac('sha256', MAILGUN_SIGNING_KEY)
            .update(timestamp + token)
            .digest('hex');
          const ok =
            signed &&
            hmac &&
            signed.length === hmac.length &&
            crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(hmac));
          if (!ok) {
            console.warn('Webhook Mailgun firma inválida');
            return response.status(401).json({ error: 'Invalid signature' });
          }
        }
      }

      const batch = db.batch();

      events.forEach((evt) => {
        const id = evt['event-data']?.id || evt.id || `${Date.now()}-${Math.random()}`;
        const data = evt['event-data'] || evt;
        batch.set(db.collection('mailgunEvents').doc(id), data, { merge: true });
      });

      await batch.commit();
      return response.json({ received: events.length });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return response.status(500).json({ error: err.message });
    }
  });
});

// ------------------------------
// Tarea programada: Agregación diaria
// ------------------------------
const { FieldValue } = admin.firestore;

exports.aggregateDailyMetrics = functions.pubsub
  .schedule('0 2 * * *') // Todos los días a las 02:00
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    const now = new Date();
    const yyyyMMdd = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayStartTs = dayStart.getTime() / 1000; // seg

    // Obtener eventos del día
    const snapshot = await db
      .collection('mailgunEvents')
      .where('event-data.timestamp', '>=', dayStartTs)
      .get();

    const metricsByUser = {};

    snapshot.forEach((doc) => {
      const evt = doc.data()['event-data'] || doc.data();
      const { event, recipient } = evt;
      if (!recipient) return;
      const userId = recipient.split('@')[0]; // Supuesto: alias = userId
      if (!metricsByUser[userId]) {
        metricsByUser[userId] = { sent: 0, received: 0, opens: 0, clicks: 0, bounces: 0 };
      }
      switch (event) {
        case 'delivered':
          metricsByUser[userId].sent += 1;
          break;
        case 'stored':
        case 'inbound':
          metricsByUser[userId].received += 1;
          break;
        case 'opened':
          metricsByUser[userId].opens += 1;
          break;
        case 'clicked':
          metricsByUser[userId].clicks += 1;
          break;
        case 'failed':
          metricsByUser[userId].bounces += 1;
          break;
        default:
          break;
      }
    });

    const batch = db.batch();

    Object.entries(metricsByUser).forEach(([userId, daily]) => {
      const docRef = db.collection('emailMetrics').doc(userId);
      batch.set(
        docRef,
        {
          sent: FieldValue.increment(daily.sent),
          received: FieldValue.increment(daily.received),
          opens: FieldValue.increment(daily.opens),
          clicks: FieldValue.increment(daily.clicks),
          bounces: FieldValue.increment(daily.bounces),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Subcolección diaria
      const dailyRef = docRef.collection('daily').doc(yyyyMMdd);
      batch.set(
        dailyRef,
        { date: yyyyMMdd, ...daily, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    });

    await batch.commit();
    console.log(`Aggregated metrics for ${Object.keys(metricsByUser).length} users`);
  });

// Función para validar correo electrónico
// ------------------------------
// Cloud Function: inicializar subcolecciones al crear una boda
// ------------------------------
exports.initWeddingSubcollections = functions.firestore
  .document('weddings/{weddingId}')
  .onCreate(async (snap, context) => {
    const weddingId = context.params.weddingId;
    const subCollections = [
      'guests',
      // seatingPlan raíz y subniveles
      'seatingPlan',
      'seatingPlan/banquet',
      'seatingPlan/banquet/areas',
      'seatingPlan/banquet/tables',
      'designs',
      'suppliers',
      // Mantener compatibilidad pero estandarizar en 'specialMoments'
      'momentosEspeciales',
      'specialMoments',
      'timing',
      'checklist',
      'ayudaCeremonia',
      'disenoWeb',
      'ideas',
    ];

    const batch = db.batch();
    subCollections.forEach((sub) => {
      const ref = db.collection('weddings').doc(weddingId).collection(sub).doc('_placeholder');
      batch.set(ref, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    console.log(`Subcolecciones iniciales creadas para boda ${weddingId}`);
  });

// ------------------------------
// Cloud Function: inicializar subcolección meetings al crear un usuario
// ------------------------------
exports.initUserMeetingsSubcollection = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const ref = db.collection('users').doc(uid).collection('meetings').doc('_placeholder');
    try {
      await ref.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log(`Subcolección meetings creada para usuario ${uid}`);
    } catch (err) {
      console.error('Error creando subcolección meetings para usuario', uid, err);
    }
  });

// ------------------------------
// Cloud Function: eliminar weddingId redundante en users
// ------------------------------
exports.cleanupUserWeddingId = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const afterData = change.after.exists ? change.after.data() : null;
    if (!afterData) return null;
    if (!('weddingId' in afterData)) return null;

    const uid = context.params.uid;
    console.log(`Detectado campo weddingId redundante en users/${uid}. Eliminando…`);
    try {
      await change.after.ref.update({ weddingId: admin.firestore.FieldValue.delete() });
      console.log(`weddingId eliminado de users/${uid}`);
    } catch (err) {
      console.error('Error al eliminar weddingId en users/', uid, err);
    }
    return null;
  });

// ------------------------------
// Firestore trigger: sincronizar seatingPlan al modificar invitados
// ------------------------------
// ------------------------------
// Cloud Function: establecer campos por defecto al crear una boda
// ------------------------------
exports.initWeddingDefaultFields = functions.firestore
  .document('weddings/{weddingId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const defaults = {
      active: true,
      assistantIds: [],
      banquetPlace: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      location: '',
      name: 'Boda sin nombre',
      ownerIds: [],
      plannerIds: [],
      progress: 0,
      weddingDate: '',
    };
    const update = {};
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in data)) update[k] = v;
    }
    if (Object.keys(update).length) {
      await snap.ref.update(update);
      console.log(`Campos por defecto añadidos a boda ${context.params.weddingId}`);
    }
  });

// ------------------------------
// Firestore trigger: sincronizar seatingPlan al modificar invitados
// [eliminada] función legacy syncSeatingPlanOnGuestWrite
/*
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const weddingId = context.params.weddingId;
    const guestId = context.params.guestId;

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    const oldTableId = beforeData ? beforeData.tableId : undefined;
    const newTableId = afterData ? afterData.tableId : undefined;

    const tableColl = db.collection('weddings').doc(weddingId).collection('seatingPlan');
    const batch = db.batch();

    // Quitar invitado de la mesa antigua (si procede)
    if (oldTableId && oldTableId !== newTableId) {
      const oldRef = tableColl.doc(String(oldTableId));
      batch.set(
        oldRef,
        {
          assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Añadir invitado a la nueva mesa
    if (newTableId) {
      const newRef = tableColl.doc(String(newTableId));
      const newSnap = await newRef.get();
      if (newSnap.exists) {
        batch.set(
          newRef,
          {
            assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Crear documento de mesa con estructura mínima
        batch.set(newRef, {
          name: `Mesa ${newTableId}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          enabled: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    // Eliminar la mesa antigua si quedó vacía
    if (oldTableId && oldTableId !== newTableId) {
      const oldSnap = await tableColl.doc(String(oldTableId)).get();
      if (oldSnap.exists) {
        const assigned = oldSnap.get('assignedGuestIds') || [];
        if (assigned.length === 0) {
          await tableColl.doc(String(oldTableId)).delete();
        }
      }
    }
  });
*/

// ------------------------------
// Firestore trigger: sincronizar banquet/tables con invitados (nueva estructura)
// ------------------------------
/* LEGACY: desactivada tras migración a banquet/tables
exports.syncSeatingPlanOnGuestWrite = functions.firestore
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const { weddingId, guestId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const beforeTable = before ? before.tableId : null;
    const afterTable = after ? after.tableId : null;

    const tableRef = (tableId) => db.doc(`weddings/${weddingId}/seatingPlan/banquet/tables/${tableId}`);

    // Si el invitado estaba en una mesa y cambia/elimina
    if (beforeTable && beforeTable !== afterTable) {
      const ref = tableRef(beforeTable);
      await ref.update({
        assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      if (!snap.exists || (snap.data().assignedGuestIds || []).length === 0) {
        await ref.delete();
      }
    }

    // Si se elimina al invitado, salir
    if (!after) return;

    if (afterTable) {
      const ref = tableRef(afterTable);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          name: `Mesa ${afterTable}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });
*/

exports.syncBanquetTablesOnGuestWrite = functions.firestore
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const { weddingId, guestId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const beforeTable = before ? before.tableId : null;
    const afterTable = after ? after.tableId : null;

    const tableRef = (tableId) =>
      db.doc(`weddings/${weddingId}/seatingPlan/banquet/tables/${tableId}`);

    // Si el invitado estaba en una mesa y cambia/elimina
    if (beforeTable && beforeTable !== afterTable) {
      const ref = tableRef(beforeTable);
      await ref.update({
        assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      if (!snap.exists || (snap.data().assignedGuestIds || []).length === 0) {
        await ref.delete();
      }
    }

    // Si se elimina al invitado, salir
    if (!after) return;

    if (afterTable) {
      const ref = tableRef(afterTable);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          name: `Mesa ${afterTable}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });

// ------------------------------
// Firestore trigger: sincronizar subcolección users/{uid}/weddings
// ------------------------------
exports.syncUserWeddingRefs = functions.firestore
  .document('weddings/{weddingId}')
  .onWrite(async (change, context) => {
    const weddingId = context.params.weddingId;

    // Si el documento se borra, eliminamos referencia en todos los usuarios
    if (!change.after.exists) {
      const before = change.before.data() || {};
      const roles = ['ownerIds', 'plannerIds', 'assistantIds'];
      const uids = new Set();
      roles.forEach((r) => (before[r] || []).forEach((uid) => uids.add(uid)));
      const batch = db.batch();
      uids.forEach((uid) => {
        const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
        batch.delete(ref);
      });
      await batch.commit();
      console.log(
        `syncUserWeddingRefs: Eliminadas refs de boda ${weddingId} en ${uids.size} usuarios`
      );
      return;
    }

    const after = change.after.data() || {};
    const before = change.before.data() || {};
    const roles = ['ownerIds', 'plannerIds', 'assistantIds'];

    const uidRoleMap = new Map();
    roles.forEach((role) => {
      (after[role] || []).forEach((uid) => {
        const prev = uidRoleMap.get(uid) || [];
        uidRoleMap.set(uid, [...prev, role.replace('Ids', '')]);
      });
    });
    const newUids = new Set(uidRoleMap.keys());

    // Detectar removidos
    const prevUids = new Set();
    roles.forEach((role) => (before[role] || []).forEach((uid) => prevUids.add(uid)));
    const removed = [...prevUids].filter((uid) => !newUids.has(uid));

    const batch = db.batch();

    // Añadir/actualizar docs para nuevos uids
    uidRoleMap.forEach((rolesArr, uid) => {
      const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
      batch.set(
        ref,
        {
          name: after.name || after.slug || 'Boda',
          roles: rolesArr,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Eliminar docs para uids quitados
    removed.forEach((uid) => {
      const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
      batch.delete(ref);
    });

    await batch.commit();
    console.log(`syncUserWeddingRefs: Sincronizadas referencias de boda ${weddingId}`);
  });

exports.validateEmail = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { email } = request.query;

      if (!email) {
        return response.status(400).json({ error: 'Email is required' });
      }

      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

      // Hacer solicitud a Mailgun API
      const mailgunResponse = await fetch(
        `${MAILGUN_BASE_URL}/address/validate?address=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText,
        });
      }

      const data = await mailgunResponse.json();
      return response.json(data);
    } catch (error) {
      console.error('Error validating email:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

const normalizeBudgetCategoryKey = (value) => {
  if (!value) return '';
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
  if (!normalized) return '';
  for (const [key, aliases] of BUDGET_CATEGORY_ALIASES.entries()) {
    if (key === normalized) return key;
    if (aliases.includes(normalized)) return key;
  }
  return normalized;
};

const computeGuestBucket = (guestCount) => {
  const count = Number(guestCount) || 0;
  if (count <= 0) return '0-0';
  const size = 50;
  const start = Math.floor((count - 1) / size) * size + 1;
  const end = start + size - 1;
  return `${start}-${end}`;
};

const percentile = (sortedValues, p) => {
  if (!sortedValues.length) return 0;
  const pos = (sortedValues.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
};

const computeStatsFromValues = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  return {
    avg: sum / sorted.length,
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    count: sorted.length,
  };
};

exports.aggregateBudgetBenchmarks = functions.firestore
  .document('budgetSnapshots/{weddingId}')
  .onWrite(async (change) => {
    const snap = change.after.exists ? change.after.data() : null;
    if (!snap || snap.status !== 'confirmed') {
      return null;
    }

    const regionKey = (
      snap.regionKey ||
      normalizeBudgetCategoryKey(snap?.wedding?.country) ||
      'global'
    ).toLowerCase();
    const guestBucket = snap.guestBucket || computeGuestBucket(snap?.wedding?.guestCount);

    const confirmedSnapshots = await db
      .collection('budgetSnapshots')
      .where('status', '==', 'confirmed')
      .where('regionKey', '==', regionKey)
      .where('guestBucket', '==', guestBucket)
      .get();

    if (confirmedSnapshots.empty) {
      await db
        .collection('budgetBenchmarks')
        .doc(`${regionKey}_${guestBucket}`)
        .set({
          region: regionKey,
          guestBucket,
          count: 0,
          total: { avg: 0, p50: 0, p75: 0, count: 0 },
          categories: {},
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      return null;
    }

    const totalValues = [];
    const categoryMap = new Map();
    const categoryPerGuestMap = new Map();

    confirmedSnapshots.forEach((docSnap) => {
      const data = docSnap.data();
      const totalAmount = Number(data?.totals?.budget) || 0;
      const guestCount = Number(data?.wedding?.guestCount) || 0;
      if (totalAmount > 0 && totalAmount < 500000) {
        totalValues.push(totalAmount);
      }

      const categories = Array.isArray(data?.categories) ? data.categories : [];
      categories.forEach((category) => {
        const amount = Number(category?.amount) || 0;
        if (amount <= 0 || amount > 500000) return;
        const key = normalizeBudgetCategoryKey(category?.key || category?.name);
        if (!key) return;
        if (!categoryMap.has(key)) categoryMap.set(key, []);
        categoryMap.get(key).push(amount);
        if (guestCount > 0) {
          const perGuest = amount / guestCount;
          if (!categoryPerGuestMap.has(key)) categoryPerGuestMap.set(key, []);
          categoryPerGuestMap.get(key).push(perGuest);
        }
      });
    });

    const totalStats = computeStatsFromValues(totalValues) || {
      avg: 0,
      p50: 0,
      p75: 0,
      count: 0,
    };

    const categoriesPayload = {};
    categoryMap.forEach((values, key) => {
      if (values.length < 3) return;
      const stats = computeStatsFromValues(values);
      if (!stats) return;
      const perGuestValues = categoryPerGuestMap.get(key) || [];
      const perGuestStats =
        perGuestValues.length >= 3 ? computeStatsFromValues(perGuestValues) : null;
      categoriesPayload[key] = perGuestStats ? { ...stats, perGuest: perGuestStats } : { ...stats };
    });

    await db.collection('budgetBenchmarks').doc(`${regionKey}_${guestBucket}`).set(
      {
        region: regionKey,
        guestBucket,
        count: totalStats.count,
        total: totalStats,
        categories: categoriesPayload,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return null;
  });

// Scheduled cleanup for webhook idempotency markers (TTL simulation)
exports.cleanupWebhookDedup = functions.pubsub
  .schedule('0 */6 * * *') // every 6 hours
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    const now = new Date();
    const snap = await db.collection('webhookDedup').where('expireAt', '<=', now).limit(500).get();
    if (snap.empty) return null;
    const batch = db.batch();
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`cleanupWebhookDedup: removed ${snap.size} expired docs`);
    return null;
  });

// ==========================================
// PORTFOLIO: Cloud Function para Thumbnails
// ==========================================
// Importar y exportar la Cloud Function de thumbnails
const { generatePortfolioThumbnails } = require('./generateThumbnails');
exports.generatePortfolioThumbnails = generatePortfolioThumbnails;
