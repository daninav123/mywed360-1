import admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { db } from '../db.js';

const DEFAULT_BATCH_LIMIT = Math.max(
  1,
  Number(process.env.MOMENTOS_CLEANUP_BATCH_LIMIT || 3)
);
const DEFAULT_SUBCOLLECTION_BATCH = Math.max(
  25,
  Number(process.env.MOMENTOS_CLEANUP_SUBCOLLECTION_BATCH || 100)
);
const DEFAULT_RETENTION_DAYS = Math.max(
  30,
  Number(process.env.MOMENTOS_RETENTION_DAYS || 365)
);

const ALBUM_SLUG = 'momentos-principal';
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
const storageBucket = STORAGE_BUCKET ? admin.storage().bucket(STORAGE_BUCKET) : null;

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

async function deleteCollectionBatch(collectionRef, { batchSize, dryRun }) {
  let deleted = 0;
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;
    if (dryRun) {
      deleted += snapshot.size;
      break;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }
  return deleted;
}

async function deletePhotoDocument(photoDoc, { bucket, dryRun }) {
  const data = photoDoc.data() || {};
  if (!dryRun && bucket) {
    const paths = [
      data.storagePathOriginal,
      data.storagePathOptimized,
      data.storagePathThumb,
    ]
      .filter(Boolean)
      .map((p) => String(p));

    await Promise.allSettled(
      paths.map((path) =>
        bucket
          .file(path)
          .delete({ ignoreNotFound: true })
          .catch((error) => {
            console.warn('[momentosCleanup] No se pudo eliminar archivo', path, error?.message);
          })
      )
    );
  }

  const commentsRef = photoDoc.ref.collection('comments');
  await deleteCollectionBatch(commentsRef, {
    batchSize: DEFAULT_SUBCOLLECTION_BATCH,
    dryRun,
  });

  if (!dryRun) {
    await photoDoc.ref.delete();
  }
}

export async function cleanupMomentosAlbums({
  limit = DEFAULT_BATCH_LIMIT,
  dryRun = false,
  now = new Date(),
} = {}) {
  const cutoff = new Date(now.getTime());
  const results = [];

  const query = db
    .collectionGroup('albums')
    .where('slug', '==', ALBUM_SLUG)
    .where('uploadWindow.cleanupStatus', '==', 'scheduled')
    .where('uploadWindow.cleanupAt', '<=', cutoff)
    .limit(limit);

  const snapshot = await query.get();
  if (snapshot.empty) {
    return { processed: 0, dryRun, items: [] };
  }

  for (const albumSnap of snapshot.docs) {
    const albumRef = albumSnap.ref;
    const albumData = albumSnap.data() || {};
    const weddingRef = albumRef?.parent?.parent;
    if (!weddingRef) {
      continue;
    }

    const summary = {
      weddingId: weddingRef.id,
      albumId: albumRef.id,
      dryRun,
      photosRemoved: 0,
      bytesFreed: 0,
      errors: [],
    };

    const cleanupAtValue = toDate(albumData?.uploadWindow?.cleanupAt);
    const eventDate = toDate(albumData?.eventDate);
    let effectiveCleanupAt = cleanupAtValue;

    if (!effectiveCleanupAt && eventDate) {
      const fallbackCleanupAt = new Date(
        eventDate.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );
      effectiveCleanupAt = fallbackCleanupAt;
      if (!dryRun) {
        await albumRef
          .update({
            'uploadWindow.cleanupAt': Timestamp.fromDate(fallbackCleanupAt),
            'uploadWindow.cleanupStatus':
              albumData?.uploadWindow?.cleanupStatus || 'scheduled',
          })
          .catch(() => {});
      }
    }

    if (!effectiveCleanupAt) {
      summary.errors.push('cleanup_at_missing');
      results.push(summary);
      continue;
    }

    if (effectiveCleanupAt > cutoff) {
      continue;
    }

    try {
      if (!dryRun) {
        await albumRef.update({
          'uploadWindow.cleanupStatus': 'cleaning',
          'uploadWindow.cleanupStartedAt': FieldValue.serverTimestamp(),
          'uploadWindow.cleanupLastRunAt': FieldValue.serverTimestamp(),
        });
      }

      const photosRef = albumRef.collection('photos');
      while (true) {
        const photosSnap = await photosRef.limit(DEFAULT_SUBCOLLECTION_BATCH).get();
        if (photosSnap.empty) break;
        for (const photoDoc of photosSnap.docs) {
          const data = photoDoc.data() || {};
          const storedBytes = Number(data.upload?.sizeStored || data.upload?.sizeOriginal || 0);
          summary.photosRemoved += 1;
          summary.bytesFreed += Number.isFinite(storedBytes) ? storedBytes : 0;
          await deletePhotoDocument(photoDoc, {
            bucket: storageBucket,
            dryRun,
          });
        }
        if (dryRun) break;
      }

      for (const subName of ['guestProgress', 'tokens', 'activity', 'exports']) {
        const subRef = albumRef.collection(subName);
        await deleteCollectionBatch(subRef, {
          batchSize: DEFAULT_SUBCOLLECTION_BATCH,
          dryRun,
        });
      }

      if (!dryRun) {
        await albumRef.update({
          status: 'archived',
          archivedAt: FieldValue.serverTimestamp(),
          'counters.totalPhotos': 0,
          'counters.pendingPhotos': 0,
          'counters.approvedPhotos': 0,
          'counters.rejectedPhotos': 0,
          'counters.guestContributors': 0,
          'counters.badgesGranted': 0,
          'counters.totalBytes': 0,
          'counters.optimizedBytes': 0,
          'uploadWindow.cleanupStatus': 'completed',
          'uploadWindow.cleanedAt': FieldValue.serverTimestamp(),
          'uploadWindow.cleanupSummary': {
            photosRemoved: summary.photosRemoved,
            bytesFreed: summary.bytesFreed,
            processedAt: new Date().toISOString(),
          },
        });
      }

      results.push(summary);
    } catch (error) {
      const message = error?.message || 'cleanup_failed';
      summary.errors.push(message);
      if (!dryRun) {
        await albumRef.update({
          'uploadWindow.cleanupStatus': 'scheduled',
          'uploadWindow.cleanupLastError': message,
          'uploadWindow.cleanupLastErrorAt': FieldValue.serverTimestamp(),
        }).catch(() => {});
      }
      results.push(summary);
    }
  }

  return {
    processed: results.length,
    dryRun,
    retentionDays: DEFAULT_RETENTION_DAYS,
    items: results,
  };
}

export const MOMENTOS_RETENTION_DAYS = DEFAULT_RETENTION_DAYS;
