import admin from 'firebase-admin';
import vision from '@google-cloud/vision';
import { FieldValue } from 'firebase-admin/firestore';

import { db, USE_FIREBASE } from '../db.js';

// Verificar si Firebase está disponible
const FIREBASE_AVAILABLE = USE_FIREBASE && db !== null;

const DEFAULT_BATCH_LIMIT = Math.max(
  1,
  Number(process.env.MOMENTOS_MODERATION_BATCH_LIMIT || 10)
);
const SAFESEARCH_THRESHOLD_LABEL = String(
  process.env.MOMENTOS_SAFESEARCH_THRESHOLD || 'LIKELY'
).toUpperCase();
const AUTO_MODERATION_DISABLED = process.env.MOMENTOS_AUTO_MODERATION_DISABLED === '1';

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
const storageBucket = BUCKET_NAME ? admin.storage().bucket(BUCKET_NAME) : null;

const severityOrder = [
  'UNKNOWN',
  'VERY_UNLIKELY',
  'UNLIKELY',
  'POSSIBLE',
  'LIKELY',
  'VERY_LIKELY',
];

const thresholdIndex = Math.max(
  0,
  severityOrder.indexOf(SAFESEARCH_THRESHOLD_LABEL) !== -1
    ? severityOrder.indexOf(SAFESEARCH_THRESHOLD_LABEL)
    : severityOrder.indexOf('LIKELY')
);

let visionClient = null;

function getVisionClient() {
  if (AUTO_MODERATION_DISABLED) return null;
  if (!visionClient) {
    visionClient = new vision.ImageAnnotatorClient();
  }
  return visionClient;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function severity(label) {
  const idx = severityOrder.indexOf(String(label || '').toUpperCase());
  return idx === -1 ? 0 : idx;
}

function shouldFlagSafeSearch(annotation) {
  if (!annotation) return false;
  const categories = ['adult', 'violence', 'racy', 'medical'];
  return categories.some((cat) => severity(annotation[cat]) >= thresholdIndex);
}

function buildSafeSearchSummary(annotation) {
  if (!annotation) return null;
  return {
    adult: annotation.adult || 'UNKNOWN',
    spoof: annotation.spoof || 'UNKNOWN',
    medical: annotation.medical || 'UNKNOWN',
    violence: annotation.violence || 'UNKNOWN',
    racy: annotation.racy || 'UNKNOWN',
  };
}

async function lockPhotoForProcessing(docRef) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() || {};
    const currentStatus = data?.moderation?.auto?.status;
    if (currentStatus === 'processing') {
      return null;
    }
    if (currentStatus && ['passed', 'flagged', 'error'].includes(currentStatus)) {
      return null;
    }
    tx.update(docRef, {
      'moderation.auto.status': 'processing',
      'moderation.auto.startedAt': FieldValue.serverTimestamp(),
      'moderation.auto.updatedAt': FieldValue.serverTimestamp(),
    });
    return { data, ref: docRef };
  });
}

async function analysePhotoWithVision(storagePath, publicUrl) {
  const client = getVisionClient();
  if (!client) {
    throw new Error('vision_client_not_initialized');
  }

  const request = storagePath && storageBucket
    ? { image: { source: { imageUri: `gs://${storageBucket.name}/${storagePath}` } } }
    : publicUrl
    ? { image: { source: { imageUri: publicUrl } } }
    : null;

  if (!request) {
    throw new Error('no_image_source');
  }

  const [result] = await client.safeSearchDetection(request.image);
  const annotation = result?.safeSearchAnnotation || null;
  return annotation;
}

export async function moderatePendingMomentosPhotos({
  limit = DEFAULT_BATCH_LIMIT,
  dryRun = false,
} = {}) {
  if (AUTO_MODERATION_DISABLED || !FIREBASE_AVAILABLE) {
    return { processed: 0, dryRun, items: [], disabled: !FIREBASE_AVAILABLE };
  }

  const query = db
    .collectionGroup('photos')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(limit);

  const snapshot = await query.get();
  if (snapshot.empty) {
    return { processed: 0, dryRun, items: [] };
  }

  const processed = [];

  for (const docSnap of snapshot.docs) {
    const lock = await lockPhotoForProcessing(docSnap.ref);
    if (!lock) continue;

    const { data } = lock;
    const albumRef = docSnap.ref.parent?.parent || null;
    const weddingId = albumRef?.parent?.id || null;
    const albumId = albumRef?.id || null;

    const summary = {
      photoId: docSnap.id,
      weddingId,
      albumId,
      flagged: false,
      status: 'processing',
      error: null,
    };

    try {
      if (dryRun) {
        summary.status = 'skipped';
        await docSnap.ref.update({
          'moderation.auto.status': 'queued',
          'moderation.auto.updatedAt': FieldValue.serverTimestamp(),
        }).catch(() => {});
        processed.push(summary);
        continue;
      }

      const storagePath = data.storagePathOptimized || data.storagePathOriginal || null;
      const imageUrl = data.urls?.optimized || data.urls?.original || null;
      const annotation = await analysePhotoWithVision(storagePath, imageUrl);
      const safeSearch = buildSafeSearchSummary(annotation);
      const flagged = shouldFlagSafeSearch(annotation);

      const update = {
        'moderation.auto.status': flagged ? 'flagged' : 'passed',
        'moderation.auto.flagged': flagged,
        'moderation.auto.safeSearch': safeSearch,
        'moderation.auto.processedAt': FieldValue.serverTimestamp(),
        'moderation.auto.updatedAt': FieldValue.serverTimestamp(),
        'moderation.auto.reason': flagged ? 'safe_search_flagged' : 'safe_search_pass',
        'moderation.auto.error': FieldValue.delete(),
      };

      if (flagged) {
        update.status = 'rejected';
        update['flagged.autoUnsafe'] = true;
        update['flagged.reason'] = 'auto_safe_search';
        update['flagged.updatedAt'] = FieldValue.serverTimestamp();
      }

      await docSnap.ref.update(update);

      if (flagged && albumRef) {
        await albumRef.update({
          'counters.pendingPhotos': FieldValue.increment(-1),
          'counters.rejectedPhotos': FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        }).catch(() => {});
      }

      summary.status = flagged ? 'flagged' : 'passed';
      summary.flagged = flagged;
      summary.safeSearch = safeSearch;
    } catch (error) {
      const message = error?.message || 'moderation_failed';
      summary.status = 'error';
      summary.error = message;

      if (!dryRun) {
        await docSnap.ref.update({
          'moderation.auto.status': 'error',
          'moderation.auto.error': message,
          'moderation.auto.updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }

    processed.push(summary);
  }

  return {
    processed: processed.length,
    dryRun,
    items: processed,
  };
}
