// scripts/migrate-event-profile.js
// Uso: node scripts/migrate-event-profile.js [--credentials path/to/serviceAccount.json]
// Normaliza eventType/eventProfile en weddings y sincroniza eventProfileSummary en users/{uid}/weddings/{id}.

const admin = require('firebase-admin');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_EVENT_TYPE = 'boda';
const BATCH_LIMIT = 400;

/**
 * Localiza credenciales de servicio si no se proporcionan por CLI.
 */
function resolveCredentialPath(argv) {
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--credentials' && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const candidateDirs = ['Downloads', 'Download'];
  for (const dir of candidateDirs) {
    const candidate = path.join(os.homedir(), dir, 'serviceAccount.json');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const credentialPath = resolveCredentialPath(process.argv);
if (!admin.apps.length) {
  if (credentialPath) {
    const resolved = path.resolve(credentialPath);
    console.log(`[migrate-event-profile] Usando credenciales: ${resolved}`);
    admin.initializeApp({
      credential: admin.credential.cert(require(resolved)),
    });
  } else {
    console.warn('[migrate-event-profile] Sin credenciales explícitas, usando Application Default Credentials');
    admin.initializeApp();
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

function normalizeEventType(raw) {
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    if (value === 'evento') return 'evento';
    if (value === 'boda') return 'boda';
    if (value.length > 0) return value;
  }
  return DEFAULT_EVENT_TYPE;
}

function sanitizeRelatedEvents(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function sanitizeEventProfile(raw, eventType) {
  const profile = raw && typeof raw === 'object' ? { ...raw } : {};
  const guestCountRange =
    typeof profile.guestCountRange === 'string' ? profile.guestCountRange.trim() : null;
  const formalityLevel =
    typeof profile.formalityLevel === 'string' ? profile.formalityLevel.trim() : null;
  const ceremonyType =
    eventType === 'boda' && typeof profile.ceremonyType === 'string'
      ? profile.ceremonyType.trim() || null
      : null;
  const relatedEvents = sanitizeRelatedEvents(profile.relatedEvents);
  const notes = typeof profile.notes === 'string' ? profile.notes.trim() : '';

  return {
    guestCountRange: guestCountRange || null,
    formalityLevel: formalityLevel || null,
    ceremonyType,
    relatedEvents,
    notes,
  };
}

function sanitizePreferences(raw) {
  const base = raw && typeof raw === 'object' ? { ...raw } : {};
  const style = typeof base.style === 'string' ? base.style.trim() : null;
  base.style = style && style.length ? style : null;
  return base;
}

function buildEventProfileSummary(eventType, eventProfile, preferences) {
  return {
    eventType,
    guestCountRange: eventProfile?.guestCountRange || null,
    formalityLevel: eventProfile?.formalityLevel || null,
    ceremonyType: eventType === 'boda' ? eventProfile?.ceremonyType || null : null,
    style: preferences?.style || null,
  };
}

async function commitIfNeeded(state) {
  if (state.writes >= BATCH_LIMIT) {
    await state.batch.commit();
    state.batch = db.batch();
    state.writes = 0;
  }
}

(async () => {
  console.log('[migrate-event-profile] Iniciando migración…');
  const snapshot = await db.collection('weddings').get();
  console.log(`[migrate-event-profile] Weddings detectadas: ${snapshot.size}`);

  let updatedWeddings = 0;
  let updatedSummaries = 0;
  let state = { batch: db.batch(), writes: 0 };

  for (const docSnap of snapshot.docs) {
    const weddingId = docSnap.id;
    const data = docSnap.data() || {};
    const eventType = normalizeEventType(data.eventType);
    const eventProfile = sanitizeEventProfile(data.eventProfile, eventType);
    const preferences = sanitizePreferences(data.preferences);
    const summary = buildEventProfileSummary(eventType, eventProfile, preferences);

    const weddingUpdate = {};
    if (data.eventType !== eventType) {
      weddingUpdate.eventType = eventType;
    }
    const existingProfile = data.eventProfile || {};
    if (
      existingProfile.guestCountRange !== eventProfile.guestCountRange ||
      existingProfile.formalityLevel !== eventProfile.formalityLevel ||
      (existingProfile.ceremonyType || null) !== eventProfile.ceremonyType ||
      JSON.stringify(existingProfile.relatedEvents || []) !== JSON.stringify(eventProfile.relatedEvents) ||
      (existingProfile.notes || '') !== eventProfile.notes
    ) {
      weddingUpdate.eventProfile = eventProfile;
    }
    const existingStyle =
      data.preferences && typeof data.preferences === 'object'
        ? data.preferences.style || null
        : null;
    if (existingStyle !== preferences.style) {
      weddingUpdate.preferences = { ...(data.preferences || {}), style: preferences.style || null };
    }
    if (Object.keys(weddingUpdate).length > 0) {
      weddingUpdate.eventProfileMigratedAt = FieldValue.serverTimestamp();
      state.batch.set(docSnap.ref, weddingUpdate, { merge: true });
      state.writes += 1;
      updatedWeddings += 1;
      await commitIfNeeded(state);
    }

    const participantIds = new Set();
    ['ownerIds', 'plannerIds', 'assistantIds'].forEach((key) => {
      const list = Array.isArray(data[key]) ? data[key] : [];
      list.forEach((uid) => {
        if (typeof uid === 'string' && uid.trim().length) {
          participantIds.add(uid.trim());
        }
      });
    });

    for (const uid of participantIds) {
      const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
      state.batch.set(
        ref,
        {
          eventType,
          eventProfileSummary: summary,
          eventProfileMigratedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      state.writes += 1;
      updatedSummaries += 1;
      await commitIfNeeded(state);
    }
  }

  if (state.writes > 0) {
    await state.batch.commit();
  }

  console.log(
    `[migrate-event-profile] Migración completada. Weddings actualizadas: ${updatedWeddings}, summaries sincronizados: ${updatedSummaries}`
  );
  process.exit(0);
})().catch((error) => {
  console.error('[migrate-event-profile] Error durante la migración', error);
  process.exit(1);
});
