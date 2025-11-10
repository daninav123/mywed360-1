import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { db, firebaseReady } from '../firebaseConfig';
import { performanceMonitor } from './PerformanceMonitor';

export const GALLERY_COMPRESSION_THRESHOLD_BYTES = 30 * 1024 * 1024 * 1024; // 30 GB
export const GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT = 30; // días permitidos tras el evento
export const GALLERY_RETENTION_DAYS_AFTER_EVENT = 365; // limpieza automática 1 año después

const DEFAULT_ALBUM_ID = 'momentos';
const DEFAULT_SCENES = [
  { id: 'ceremonia', label: 'Ceremonia' },
  { id: 'banquete', label: 'Banquete' },
  { id: 'fiesta', label: 'Fiesta' },
  { id: 'postboda', label: 'Postboda' },
  { id: 'otros', label: 'Otros' },
];

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      /* noop */
    }
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return null;
  return asDate;
};

const addDays = (base, days) => {
  if (!base) return null;
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + Number(days || 0));
  return result;
};

const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value);
};

const DEFAULT_SETTINGS = {
  moderationMode: 'manual',
  guestAccess: 'link',
  autoExpireHours: 72,
  maxFileSizeMb: 25,
  allowComments: true,
  allowReactions: true,
  allowGuestGallery: true,
  highlightThreshold: 0.72,
  slideshow: {
    autoAdvanceSeconds: 6,
    theme: 'classic',
    highlightThreshold: 0.75,
    showCaptions: true,
  },
  scenes: DEFAULT_SCENES,
};

const DEFAULT_COUNTERS = {
  totalPhotos: 0,
  pendingPhotos: 0,
  approvedPhotos: 0,
  rejectedPhotos: 0,
  guestContributors: 0,
  badgesGranted: 0,
  totalBytes: 0,
  optimizedBytes: 0,
};

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });

const optimizeImageFile = async (
  file,
  { maxEdge = 2560, quality = 0.82, force = false } = {}
) => {
  if (!file || !(file.type || '').startsWith('image/')) return null;
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  try {
    let bitmap = null;
    let width = 0;
    let height = 0;

    if (typeof window.createImageBitmap === 'function') {
      try {
        bitmap = await window.createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
      } catch {
        bitmap = null;
      }
    }

    if (!bitmap) {
      const image = await loadImageElement(file);
      width = image.width;
      height = image.height;
      bitmap = image;
    }

    if (!width || !height) return null;

    const maxDimension = Math.max(width, height);
    const ratio = maxDimension > maxEdge ? maxEdge / maxDimension : 1;
    const targetWidth = Math.max(1, Math.round(width * ratio));
    const targetHeight = Math.max(1, Math.round(height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    if (bitmap && typeof bitmap.close === 'function') {
      try {
        bitmap.close();
      } catch {
        /* noop */
      }
    }

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return null;
    if (!force && blob.size >= file.size) return null;

    const filenameBase = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'foto';
    const optimizedFile = new File([blob], `${filenameBase}.jpg`, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      wasCompressed: force ? blob.size <= file.size : blob.size < file.size,
    };
  } catch (error) {
    console.warn('[momentosService] optimizeImageFile no pudo comprimir', error);
    return null;
  }
};

const ensureFirebase = async () => {
  await firebaseReady;
  if (!db) {
    throw new Error('Firebase no está configurado (db nulo)');
  }
  return db;
};

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return `moment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const generateToken = (bytes = 16) => {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(bytes);
      crypto.getRandomValues(arr);
      return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  return `${Date.now().toString(16)}${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
};

const normalizeScenes = (scenes) => {
  if (!Array.isArray(scenes) || !scenes.length) return DEFAULT_SCENES;
  const map = new Map();
  scenes.forEach((scene) => {
    if (!scene) return;
    const id = (scene.id || scene.value || scene.slug || scene.label || '').toString().trim();
    const label = (scene.label || scene.name || scene.title || id || '').toString().trim();
    if (!id || !label) return;
    if (!map.has(id)) {
      map.set(id, { id, label, emoji: scene.emoji || null, color: scene.color || null });
    }
  });
  return map.size ? Array.from(map.values()) : DEFAULT_SCENES;
};

const readFileArrayBuffer = async (file) => {
  if (!file || typeof file.arrayBuffer !== 'function') return null;
  try {
    return await file.arrayBuffer();
  } catch {
    return null;
  }
};

const computeFileHash = async (file) => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const buffer = await readFileArrayBuffer(file);
  if (!buffer) return null;
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const generateImageThumbnail = async (
  file,
  { maxEdge = 640, quality = 0.72 } = {}
) => {
  if (!file || !(file.type || '').startsWith('image/')) return null;
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  try {
    let bitmap = null;
    let width = 0;
    let height = 0;

    if (typeof window.createImageBitmap === 'function') {
      try {
        bitmap = await window.createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
      } catch {
        bitmap = null;
      }
    }

    if (!bitmap) {
      const image = await loadImageElement(file);
      width = image.width;
      height = image.height;
      bitmap = image;
    }

    if (!width || !height) return null;

    const maxDimension = Math.max(width, height);
    const ratio = maxDimension > maxEdge ? maxEdge / maxDimension : 1;
    const targetWidth = Math.max(1, Math.round(width * ratio));
    const targetHeight = Math.max(1, Math.round(height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    if (bitmap && typeof bitmap.close === 'function') {
      try {
        bitmap.close();
      } catch {
        /* noop */
      }
    }

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return null;

    const filenameBase = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'thumb';
    const thumbFile = new File([blob], `${filenameBase}-thumb.jpg`, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now(),
    });
    return { file: thumbFile, size: thumbFile.size };
  } catch (error) {
    console.warn('[momentosService] generateImageThumbnail error', error);
    return null;
  }
};

const reserveMediaHash = async ({ weddingId, albumId, hash, fileName }) => {
  if (!hash) return null;
  const dbInstance = await ensureFirebase();
  const hashRef = doc(
    dbInstance,
    'weddings',
    weddingId,
    'albums',
    albumId,
    'hashes',
    hash
  );

  try {
    await runTransaction(dbInstance, async (tx) => {
      const snap = await tx.get(hashRef);
      if (snap.exists()) {
        throw new Error('hash_exists');
      }
      tx.set(hashRef, {
        hash,
        weddingId,
        albumId,
        fileName: fileName || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error?.message === 'hash_exists') {
      throw new Error('duplicate_media_hash');
    }
    throw error;
  }

  return {
    async markSuccess(photoId) {
      await updateDoc(hashRef, {
        status: 'active',
        photoId: photoId || null,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    },
    async release() {
      await deleteDoc(hashRef).catch(() => {});
    },
  };
};

const nowPlusHours = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + Number(hours || 24));
  return Timestamp.fromDate(date);
};

const buildAlbumDefaults = (overridesSettings = {}) => ({
  name: 'Galería de recuerdos',
  slug: 'momentos-principal',
  status: 'active',
  eventDate: null,
  uploadWindow: {
    closesAt: null,
    closedAt: null,
    compressionThresholdBytes: GALLERY_COMPRESSION_THRESHOLD_BYTES,
    compressionActive: false,
    lastCompressionAt: null,
    lastTokenAt: null,
    cleanupAt: null,
    cleanedAt: null,
    cleanupStatus: 'scheduled',
  },
  settings: {
    ...DEFAULT_SETTINGS,
    ...overridesSettings,
    scenes: normalizeScenes(overridesSettings?.scenes || DEFAULT_SETTINGS.scenes),
  },
  counters: { ...DEFAULT_COUNTERS },
  qrCode: {
    latestTokenId: null,
    expiresAt: null,
  },
});

const resolveAlbumEventDate = (album) =>
  parseDateValue(
    album?.eventDate ||
      album?.weddingDate ||
      album?.settings?.eventDate ||
      album?.settings?.weddingDate ||
      album?.eventDateValue ||
      album?.timelineDate ||
      album?.coreInfo?.weddingDate
  );

const resolveUploadWindow = (album) => {
  const eventDate = resolveAlbumEventDate(album);
  const closesAtFromAlbum = parseDateValue(album?.uploadWindow?.closesAt);
  const closesAt =
    closesAtFromAlbum ||
    (eventDate ? addDays(eventDate, GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT) : null);
  const threshold =
    album?.uploadWindow?.compressionThresholdBytes || GALLERY_COMPRESSION_THRESHOLD_BYTES;
  const totalBytes = album?.counters?.totalBytes || 0;
  const compressionActive =
    Boolean(album?.uploadWindow?.compressionActive) || totalBytes >= threshold;
  const cleanupAtFromAlbum = parseDateValue(album?.uploadWindow?.cleanupAt);
  const cleanupAt =
    cleanupAtFromAlbum ||
    (eventDate
      ? addDays(eventDate, GALLERY_RETENTION_DAYS_AFTER_EVENT)
      : closesAt
      ? addDays(
          closesAt,
          Math.max(GALLERY_RETENTION_DAYS_AFTER_EVENT - GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT, 0)
        )
      : null);
  const cleanupStatus = album?.uploadWindow?.cleanupStatus || 'scheduled';
  return {
    eventDate,
    closesAt,
    thresholdBytes: threshold,
    compressionActive,
    cleanupAt,
    cleanupStatus,
  };
};

const calculateHighlightScore = (photo, album) => {
  const reasons = [];
  let score = 0.35;

  if (photo?.scene) {
    const sceneId = photo.scene;
    const preferred =
      album?.settings?.scenes?.find((scene) => scene.id === sceneId)?.priority ||
      ['ceremonia', 'banquete'].includes(sceneId);
    if (preferred) {
      score += 0.12;
      reasons.push(`Escena ${sceneId}`);
    }
  }

  if (photo?.reactions) {
    const totals = Object.values(photo.reactions).reduce(
      (acc, value) => acc + Number(value || 0),
      0
    );
    if (totals > 0) {
      const capped = Math.min(totals, 20);
      score += capped * 0.015;
      reasons.push(`${totals} reacciones`);
    }
  }

  if (photo?.uploaderType === 'guest') {
    score += 0.05;
    reasons.push('Subida por invitado');
  }

  if (photo?.exif?.takenAt) {
    try {
      const taken = photo.exif.takenAt.toDate ? photo.exif.takenAt.toDate() : new Date(photo.exif.takenAt);
      const eventDate = album?.eventDate || null;
      if (eventDate) {
        const diff = Math.abs(taken.getTime() - new Date(eventDate).getTime());
        if (diff < 3 * 60 * 60 * 1000) {
          score += 0.04;
          reasons.push('Dentro del rango del evento');
        }
      }
    } catch {}
  }

  if (photo?.labels?.includes('featured')) {
    score += 0.15;
    reasons.push('Marcada como destacada por el anfitrión');
  }

  if (photo?.width && photo?.height) {
    const megapixels = (photo.width * photo.height) / 1_000_000;
    if (megapixels >= 8) {
      score += 0.05;
      reasons.push('Alta resolución');
    }
  }

  if (photo?.highlight?.score) {
    score = Math.max(score, Number(photo.highlight.score) || 0);
  }

  return {
    score: Math.min(Number(score.toFixed(3)), 1),
    reasons: Array.from(new Set(reasons)),
  };
};

export const ensureMomentosAlbum = async (weddingId, overrides = {}) => {
  if (!weddingId) throw new Error('weddingId es requerido');
  await ensureFirebase();
  const albumRef = doc(db, 'weddings', weddingId, 'albums', DEFAULT_ALBUM_ID);
  const snapshot = await getDoc(albumRef);
  if (snapshot.exists()) {
    return { id: albumRef.id, ...snapshot.data() };
  }

  const {
    settings: overridesSettings = {},
    counters: overridesCounters = {},
    uploadWindow: overridesUploadWindow = {},
    eventDate: overridesEventDate,
    weddingDate: overridesWeddingDate,
    ...restOverrides
  } = overrides || {};

  const payload = buildAlbumDefaults(overridesSettings);
  const eventDateCandidate = parseDateValue(overridesEventDate || overridesWeddingDate);
  const eventDateTimestamp = eventDateCandidate ? toTimestamp(eventDateCandidate) : null;
  const closesAtCandidate = overridesUploadWindow?.closesAt
    ? parseDateValue(overridesUploadWindow.closesAt)
    : eventDateCandidate
    ? addDays(eventDateCandidate, GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT)
    : null;
  const cleanupAtCandidate = overridesUploadWindow?.cleanupAt
    ? parseDateValue(overridesUploadWindow.cleanupAt)
    : eventDateCandidate
    ? addDays(eventDateCandidate, GALLERY_RETENTION_DAYS_AFTER_EVENT)
    : closesAtCandidate
    ? addDays(
        closesAtCandidate,
        Math.max(GALLERY_RETENTION_DAYS_AFTER_EVENT - GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT, 0)
      )
    : null;

  await setDoc(
    albumRef,
    {
      ...payload,
      ...restOverrides,
      eventDate: eventDateTimestamp || payload.eventDate,
      uploadWindow: {
        ...payload.uploadWindow,
        ...overridesUploadWindow,
        compressionThresholdBytes:
          overridesUploadWindow?.compressionThresholdBytes ||
          payload.uploadWindow.compressionThresholdBytes,
        closesAt: closesAtCandidate
          ? toTimestamp(closesAtCandidate)
          : payload.uploadWindow.closesAt,
        cleanupAt: cleanupAtCandidate
          ? toTimestamp(cleanupAtCandidate)
          : payload.uploadWindow.cleanupAt,
        cleanupStatus:
          overridesUploadWindow?.cleanupStatus || payload.uploadWindow.cleanupStatus || 'scheduled',
      },
      settings: {
        ...payload.settings,
        ...overridesSettings,
        scenes: normalizeScenes(overridesSettings?.scenes || payload.settings.scenes),
      },
      counters: { ...payload.counters, ...overridesCounters },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    },
    { merge: true }
  );
  performanceMonitor?.logEvent?.('momentos_album_created', { weddingId });
  const created = await getDoc(albumRef);
  return { id: albumRef.id, ...created.data() };
};

export const listenAlbum = async (weddingId, callback, albumId = DEFAULT_ALBUM_ID) => {
  await ensureFirebase();
  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  return onSnapshot(albumRef, (snap) => {
    if (!snap.exists()) {
      callback?.(null);
      return;
    }
    const data = snap.data();
    callback?.({ id: snap.id, ...data, settings: data?.settings || { ...DEFAULT_SETTINGS } });
  });
};

export const listenPhotos = async (
  weddingId,
  callback,
  options = { albumId: DEFAULT_ALBUM_ID, status: null, limit: 200 }
) => {
  await ensureFirebase();
  const { albumId = DEFAULT_ALBUM_ID, status = null, limit: limitResults = 200 } = options || {};
  const photosRef = collection(db, 'weddings', weddingId, 'albums', albumId, 'photos');
  const constraints = [orderBy('createdAt', 'desc')];
  if (status) {
    constraints.push(where('status', '==', status));
  }
  if (limitResults) {
    constraints.push(limit(limitResults));
  }
  const q = query(photosRef, ...constraints);
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback?.(items);
  });
};

export const listenGuestProgress = async (
  weddingId,
  callback,
  { albumId = DEFAULT_ALBUM_ID, limit: limitResults = 50 } = {}
) => {
  await ensureFirebase();
  const progressRef = collection(
    db,
    'weddings',
    weddingId,
    'albums',
    albumId,
    'guestProgress'
  );
  const constraints = [orderBy('totalUploads', 'desc')];
  if (limitResults) {
    constraints.push(limit(limitResults));
  }
  const q = query(progressRef, ...constraints);
  return onSnapshot(q, (snap) => {
    const records = [];
    snap.forEach((docSnap) => records.push({ id: docSnap.id, ...docSnap.data() }));
    callback?.(records);
  });
};

export const uploadMomentPhoto = async ({
  weddingId,
  albumId = DEFAULT_ALBUM_ID,
  file,
  metadata = {},
  onProgress = null,
  signal = null,
}) => {
  if (!weddingId) throw new Error('weddingId es requerido');
  if (!file) throw new Error('file es requerido');
  await ensureFirebase();

  const storage = getStorage();
  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const albumSnap = await getDoc(albumRef);
  const albumData = albumSnap.exists() ? albumSnap.data() || {} : {};
  const { eventDate, closesAt, thresholdBytes } = resolveUploadWindow(albumData);
  const now = new Date();

  if (closesAt && now > closesAt) {
    if (!albumData?.uploadWindow?.closedAt) {
      await updateDoc(albumRef, {
        'uploadWindow.closedAt': serverTimestamp(),
      }).catch(() => {});
    }
    throw new Error(
      'El periodo de aportaciones ya finalizó. Contacta con la pareja anfitriona para solicitar acceso.'
    );
  }

  const existingBytes = albumData?.counters?.totalBytes || 0;
  const threshold = thresholdBytes || GALLERY_COMPRESSION_THRESHOLD_BYTES;
  const willExceedThreshold =
    existingBytes >= threshold || existingBytes + file.size > threshold;
  const isVideo = (file.type || '').startsWith('video/');
  const videoDurationSeconds = Number(metadata?.videoDurationSeconds || 0);

  if (willExceedThreshold && isVideo && videoDurationSeconds && videoDurationSeconds > 120) {
    throw new Error('video_exceeds_limit');
  }

  const originalFile = file;
  let workingFile = file;
  let compressionApplied = false;

  if (!isVideo) {
    const optimized = await optimizeImageFile(file, {
      maxEdge: 2560,
      quality: willExceedThreshold ? 0.8 : 0.82,
      force: true,
    });
    if (optimized?.file) {
      workingFile = optimized.file;
      compressionApplied =
        optimized.wasCompressed ||
        (file.type && optimized.file.type && file.type !== optimized.file.type);
    }
  }

  const mediaHash = await computeFileHash(originalFile);
  let hashReservation = null;
  if (mediaHash) {
    try {
      hashReservation = await reserveMediaHash({
        weddingId,
        albumId,
        hash: mediaHash,
        fileName: originalFile.name,
      });
    } catch (error) {
      if (error?.message === 'duplicate_media_hash') {
        throw new Error('duplicate_photo');
      }
      throw error;
    }
  }

  const photoId = generateId();
  const originalExt =
    (originalFile.name && originalFile.name.split('.').pop()) ||
    (originalFile.type && originalFile.type.split('/').pop()) ||
    'jpg';
  const workingExt =
    (workingFile.name && workingFile.name.split('.').pop()) ||
    (workingFile.type && workingFile.type.split('/').pop()) ||
    originalExt ||
    'jpg';

  const basePath = `weddings/${weddingId}/albums/${albumId}/photos/${photoId}`;
  const optimizedPath = `${basePath}/optimized.${workingExt.toLowerCase() || 'jpg'}`;
  const thumbCandidate = !isVideo ? await generateImageThumbnail(workingFile) : null;
  const thumbPath = thumbCandidate?.file ? `${basePath}/thumb.jpg` : null;

  const storagePathOptimized = optimizedPath;
  const storageRefOptimized = ref(storage, storagePathOptimized);
  const thumbRef = thumbPath ? ref(storage, thumbPath) : null;

  const uploadTask = uploadBytesResumable(storageRefOptimized, workingFile, {
    contentType: workingFile.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    cacheControl: isVideo ? 'public,max-age=3600' : 'public,max-age=86400',
    customMetadata: {
      uploader: metadata?.uploaderId || '',
      weddingId,
      albumId,
      scene: metadata?.scene || 'otro',
      originalFilename: originalFile.name || '',
      originalSize: String(originalFile.size || 0),
      storedSize: String(workingFile.size || 0),
      compression: !isVideo && compressionApplied ? 'true' : 'false',
      hash: mediaHash || '',
      videoDurationSeconds: videoDurationSeconds ? String(videoDurationSeconds) : '',
    },
  });

  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      try {
        uploadTask.cancel();
      } catch {}
      reject(new DOMException('Operación cancelada', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) {
        abortHandler();
        return;
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (typeof onProgress === 'function') {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress, snapshot);
        }
      },
      (error) => {
        if (signal) signal.removeEventListener('abort', abortHandler);
        hashReservation?.release();
        reject(error);
      },
      async () => {
        if (signal) signal.removeEventListener('abort', abortHandler);
        try {
          const optimizedUrl = await getDownloadURL(storageRefOptimized);
          let thumbUrl = optimizedUrl;

          if (thumbCandidate?.file && thumbRef) {
            await uploadBytes(thumbRef, thumbCandidate.file, {
              contentType: thumbCandidate.file.type || 'image/jpeg',
              cacheControl: 'public,max-age=31536000',
              customMetadata: {
                hash: mediaHash || '',
                weddingId,
                albumId,
                parentId: photoId,
              },
            });
            thumbUrl = await getDownloadURL(thumbRef);
          }

          const photoRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'photos', photoId);
          const scene = (metadata?.scene || 'otro').toLowerCase();

          const payload = {
            uploaderType: metadata?.uploaderType || 'host',
            uploaderId: metadata?.uploaderId || null,
            guestName: metadata?.guestName || null,
            source: metadata?.source || 'web',
            scene,
            labels: Array.from(new Set([scene, ...(metadata?.labels || [])])).filter(Boolean),
            storagePathOriginal: storagePathOptimized,
            storagePathOptimized,
            storagePathThumb: thumbPath || null,
            status: 'pending',
            flagged: metadata?.flagged || { nudity: false, violence: false },
            width: metadata?.width || null,
            height: metadata?.height || null,
            exif: metadata?.exif || {},
            reactions: metadata?.reactions || { heart: 0, wow: 0 },
            commentsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            highlight: metadata?.highlight || { score: 0, reasons: [] },
            upload: {
              filename: originalFile.name,
              storedFilename: `${photoId}.${workingExt.toLowerCase() || 'jpg'}`,
              sizeOriginal: originalFile.size,
              sizeStored: workingFile.size,
              sizeThumbnail: thumbCandidate?.size || 0,
              contentTypeOriginal: originalFile.type || null,
              contentTypeStored: workingFile.type || null,
              compressed: !isVideo && compressionApplied,
              compressionThresholdBytes: threshold,
              hash: mediaHash || null,
              videoDurationSeconds: videoDurationSeconds || null,
            },
            urls: {
              original: optimizedUrl,
              optimized: optimizedUrl,
              thumb: thumbUrl,
            },
            moderation: {
              auto: {
                status: 'queued',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
            },
          };

          await setDoc(photoRef, payload);
          const storedBytes = (workingFile.size || 0) + (thumbCandidate?.size || 0);
          const albumUpdates = {
            'counters.totalPhotos': increment(1),
            'counters.pendingPhotos': increment(1),
            'counters.totalBytes': increment(storedBytes || 0),
            'counters.optimizedBytes': increment(storedBytes || 0),
            lastActivityAt: serverTimestamp(),
          };

          if (willExceedThreshold || compressionApplied) {
            albumUpdates['uploadWindow.compressionActive'] = true;
            albumUpdates['uploadWindow.lastCompressionAt'] = serverTimestamp();
          }
          if (threshold && !albumData?.uploadWindow?.compressionThresholdBytes) {
            albumUpdates['uploadWindow.compressionThresholdBytes'] = threshold;
          }
          if (eventDate && !albumData?.eventDate) {
            albumUpdates.eventDate = toTimestamp(eventDate);
          }
          if (eventDate && !albumData?.uploadWindow?.closesAt && closesAt) {
            albumUpdates['uploadWindow.closesAt'] = toTimestamp(closesAt);
          }

          await updateDoc(albumRef, albumUpdates).catch(() => {});

          if (metadata?.tokenId) {
            const tokenRef = doc(
              db,
              'weddings',
              weddingId,
              'albums',
              albumId,
              'tokens',
              metadata.tokenId
            );
            await updateDoc(tokenRef, {
              usedCount: increment(1),
              lastUsedAt: serverTimestamp(),
            }).catch(() => {});
          }

          if (metadata?.guestId) {
            const guestRef = doc(
              db,
              'weddings',
              weddingId,
              'albums',
              albumId,
              'guestProgress',
              metadata.guestId
            );
            await runTransaction(db, async (tx) => {
              const guestSnap = await tx.get(guestRef);
              const guestData = guestSnap.exists() ? guestSnap.data() || {} : {};
              const nextTotal = (guestData.totalUploads || 0) + 1;
              const sceneBreakdown = guestData.sceneBreakdown || {};
              const nextBreakdown = {
                ...sceneBreakdown,
                [scene]: (sceneBreakdown[scene] || 0) + 1,
              };
              const badges = new Set(guestData.badges || []);
              if (nextTotal >= 1) badges.add('primerMomento');
              if (nextTotal >= 3) badges.add('momentoEntusiasta');
              if (nextTotal >= 5) badges.add('momentoEstrella');

              tx.set(
                guestRef,
                {
                  displayName:
                    metadata?.guestDisplayName || metadata?.guestName || 'Invitado anónimo',
                  totalUploads: nextTotal,
                  lastUploadAt: serverTimestamp(),
                  badges: Array.from(badges),
                  sceneBreakdown: nextBreakdown,
                },
                { merge: true }
              );

              if (!guestSnap.exists()) {
                tx.update(albumRef, {
                  'counters.guestContributors': increment(1),
                });
              }
            }).catch(() => {});
          }

          if (hashReservation) {
            await hashReservation.markSuccess(photoId);
          }

          performanceMonitor?.logEvent?.('momentos_upload_success', {
            weddingId,
            albumId,
            scene,
            size: workingFile.size,
            originalSize: originalFile.size,
            compressed: !isVideo && compressionApplied,
          });

          resolve({
            id: photoId,
            ...payload,
          });
        } catch (error) {
          hashReservation?.release();
          reject(error);
        }
      }
    );
  });
};

export const updatePhotoStatus = async ({
  weddingId,
  albumId = DEFAULT_ALBUM_ID,
  photoId,
  status,
  reason = '',
  actorId = null,
}) => {
  if (!weddingId || !photoId || !status) throw new Error('Datos insuficientes para actualizar foto');
  await ensureFirebase();

  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const photoRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'photos', photoId);

  await runTransaction(db, async (tx) => {
    const photoSnap = await tx.get(photoRef);
    if (!photoSnap.exists()) throw new Error('Foto no encontrada');
    const albumSnap = await tx.get(albumRef);
    const albumData = albumSnap.exists() ? albumSnap.data() : {};
    const current = photoSnap.data();
    const prevStatus = current.status || 'pending';
    const nextStatus = status;
    if (prevStatus === nextStatus) return;

    const updates = {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    };

    const countersUpdate = {};
    if (prevStatus === 'pending') countersUpdate['counters.pendingPhotos'] = increment(-1);
    if (prevStatus === 'approved') countersUpdate['counters.approvedPhotos'] = increment(-1);
    if (prevStatus === 'rejected') countersUpdate['counters.rejectedPhotos'] = increment(-1);

    if (nextStatus === 'pending') countersUpdate['counters.pendingPhotos'] = increment(1);
    if (nextStatus === 'approved') {
      countersUpdate['counters.approvedPhotos'] = increment(1);
      updates.approvedAt = serverTimestamp();
      const highlightMeta = calculateHighlightScore(current, albumData);
      updates.highlight = {
        ...current.highlight,
        ...highlightMeta,
        surfacedAt: serverTimestamp(),
      };
      if (!current.labels?.includes('featured') && highlightMeta.score >= (albumData?.settings?.highlightThreshold || 0.72)) {
        updates.labels = Array.from(new Set([...(current.labels || []), 'featured']));
      }
      updates.rejection = deleteField();
    }
    if (nextStatus === 'rejected') {
      countersUpdate['counters.rejectedPhotos'] = increment(1);
      updates.rejection = {
        reason: reason || 'Rechazado por anfitrión',
        rejectedBy: actorId || null,
        rejectedAt: serverTimestamp(),
      };
    }

    tx.update(photoRef, updates);
    tx.update(albumRef, {
      ...countersUpdate,
      lastActivityAt: serverTimestamp(),
    });
  });

  performanceMonitor?.logEvent?.('momentos_photo_moderated', {
    weddingId,
    albumId,
    photoId,
    status,
  });
};

export const updatePhotoLabels = async ({
  weddingId,
  albumId = DEFAULT_ALBUM_ID,
  photoId,
  labels = [],
}) => {
  await ensureFirebase();
  const photoRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'photos', photoId);
  const uniqueLabels = Array.from(new Set(labels.filter(Boolean)));
  await updateDoc(photoRef, {
    labels: uniqueLabels,
    updatedAt: serverTimestamp(),
  });
};

export const updateAlbumSettings = async (
  weddingId,
  partialSettings = {},
  albumId = DEFAULT_ALBUM_ID
) => {
  await ensureFirebase();
  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const snapshot = await getDoc(albumRef);
  const current = snapshot.exists() ? snapshot.data() : {};
  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...(current.settings || {}),
    ...partialSettings,
  };
  mergedSettings.scenes = normalizeScenes(partialSettings?.scenes || mergedSettings.scenes);
  if (!mergedSettings.slideshow) mergedSettings.slideshow = DEFAULT_SETTINGS.slideshow;
  await setDoc(
    albumRef,
    {
      settings: mergedSettings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  performanceMonitor?.logEvent?.('momentos_settings_updated', {
    weddingId,
    albumId,
    fields: Object.keys(partialSettings || {}),
  });
  return mergedSettings;
};

export const createGuestToken = async (
  weddingId,
  {
    albumId = DEFAULT_ALBUM_ID,
    type = 'guest',
    ttlHours = 24,
    maxUsages = 200,
    createdBy = null,
    sceneTargets = [],
  } = {}
) => {
  await ensureFirebase();

  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const albumSnap = await getDoc(albumRef);
  const albumData = albumSnap.exists() ? albumSnap.data() || {} : {};
  const { closesAt } = resolveUploadWindow(albumData);
  const nowDate = new Date();
  if (closesAt && nowDate > closesAt) {
    throw new Error('El periodo para subir recuerdos ya finalizó. Genera un nuevo QR cuando habilites la galería nuevamente.');
  }

  const tokensRef = collection(db, 'weddings', weddingId, 'albums', albumId, 'tokens');
  const tokenId = generateId();
  const tokenSecret = generateToken(24);
  let expiresAt = nowPlusHours(ttlHours);
  if (closesAt) {
    const currentExpiry = expiresAt?.toDate?.() || null;
    if (!currentExpiry || closesAt.getTime() < currentExpiry.getTime()) {
      expiresAt = toTimestamp(closesAt);
    }
  }
  await setDoc(doc(tokensRef, tokenId), {
    type,
    status: 'active',
    token: tokenSecret,
    maxUsages,
    usedCount: 0,
    createdAt: serverTimestamp(),
    createdBy,
    expiresAt,
    sceneTargets,
  });

  await updateDoc(albumRef, {
    'qrCode.latestTokenId': tokenId,
    'qrCode.expiresAt': expiresAt,
    'uploadWindow.lastTokenAt': serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  performanceMonitor?.logEvent?.('momentos_token_created', {
    weddingId,
    albumId,
    type,
    ttlHours,
  });

  return { id: tokenId, token: tokenSecret, expiresAt, maxUsages, type, sceneTargets };
};

export const validateGuestToken = async (
  weddingId,
  tokenValue,
  { albumId = DEFAULT_ALBUM_ID } = {}
) => {
  if (!weddingId || !tokenValue) {
    throw new Error('Token inválido');
  }
  await ensureFirebase();
  const tokensRef = collection(db, 'weddings', weddingId, 'albums', albumId, 'tokens');
  const q = query(tokensRef, where('token', '==', tokenValue), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Token no encontrado');
  }
  const docSnap = snap.docs[0];
  const data = docSnap.data();
  if (data.status && data.status !== 'active') {
    throw new Error('El enlace está inactivo');
  }
  const now = Timestamp.now();
  if (data.expiresAt?.toMillis && data.expiresAt.toMillis() < now.toMillis()) {
    throw new Error('El enlace ha caducado');
  }
  if (data.maxUsages && data.usedCount >= data.maxUsages) {
    throw new Error('El enlace alcanzó su límite de subidas');
  }

  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const albumSnap = await getDoc(albumRef);
  const albumData = albumSnap.exists() ? albumSnap.data() || {} : {};
  const { closesAt } = resolveUploadWindow(albumData);
  const nowDate = new Date();
  if (closesAt && nowDate > closesAt) {
    throw new Error('La galería ya no acepta nuevas fotos (periodo finalizado)');
  }

  return { id: docSnap.id, ...data };
};

export const listenGuestTokens = async (
  weddingId,
  callback,
  { albumId = DEFAULT_ALBUM_ID } = {}
) => {
  await ensureFirebase();
  const tokensRef = collection(db, 'weddings', weddingId, 'albums', albumId, 'tokens');
  const q = query(tokensRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const tokens = [];
    snap.forEach((docSnap) => tokens.push({ id: docSnap.id, ...docSnap.data() }));
    callback?.(tokens);
  });
};

export const revokeGuestToken = async (
  weddingId,
  tokenId,
  { albumId = DEFAULT_ALBUM_ID } = {}
) => {
  await ensureFirebase();
  const tokenRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'tokens', tokenId);
  await updateDoc(tokenRef, { status: 'revoked', revokedAt: serverTimestamp() });
  performanceMonitor?.logEvent?.('momentos_token_revoked', { weddingId, albumId, tokenId });
};

export const incrementTokenUsage = async (
  weddingId,
  tokenId,
  { albumId = DEFAULT_ALBUM_ID } = {}
) => {
  if (!weddingId || !tokenId) return;
  await ensureFirebase();
  const tokenRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'tokens', tokenId);
  await updateDoc(tokenRef, {
    usedCount: increment(1),
    lastUsedAt: serverTimestamp(),
  }).catch(() => {});
};

export const getDownloadLinks = async (
  weddingId,
  { albumId = DEFAULT_ALBUM_ID, status = 'approved' } = {}
) => {
  await ensureFirebase();
  const photosRef = collection(db, 'weddings', weddingId, 'albums', albumId, 'photos');
  const constraints = [orderBy('createdAt', 'desc')];
  if (status) constraints.push(where('status', '==', status));
  const q = query(photosRef, ...constraints);
  const snap = await getDocs(q);
  const urls = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const url = data?.urls?.optimized || data?.urls?.original || null;
    if (url) {
      urls.push({
        id: docSnap.id,
        url,
        scene: data?.scene || null,
        uploaderType: data?.uploaderType || null,
        filename: data?.upload?.filename || `${docSnap.id}.jpg`,
        status: data?.status || 'pending',
      });
    }
  });
  performanceMonitor?.logEvent?.('momentos_download_links_generated', {
    weddingId,
    albumId,
    count: urls.length,
  });
  return urls;
};

export const markPhotoReaction = async ({
  weddingId,
  albumId = DEFAULT_ALBUM_ID,
  photoId,
  reaction = 'heart',
  incrementBy = 1,
}) => {
  await ensureFirebase();
  const photoRef = doc(db, 'weddings', weddingId, 'albums', albumId, 'photos', photoId);
  await updateDoc(photoRef, {
    [`reactions.${reaction}`]: increment(incrementBy),
    updatedAt: serverTimestamp(),
  });
};

export const recordActivity = async (
  weddingId,
  activity,
  { albumId = DEFAULT_ALBUM_ID } = {}
) => {
  await ensureFirebase();
  const activityRef = doc(
    collection(db, 'weddings', weddingId, 'albums', albumId, 'activity')
  );
  await setDoc(
    activityRef,
    {
      ...activity,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getAlbumEventDate = (album) => resolveAlbumEventDate(album || {});

export const getGalleryUploadState = (album, now = new Date()) => {
  const safeAlbum = album || {};
  const {
    eventDate,
    closesAt,
    thresholdBytes,
    compressionActive,
    cleanupAt,
    cleanupStatus,
  } = resolveUploadWindow(safeAlbum);
  const totalBytes = safeAlbum?.counters?.totalBytes || 0;
  const optimizedBytes = safeAlbum?.counters?.optimizedBytes || 0;
  const threshold = thresholdBytes || GALLERY_COMPRESSION_THRESHOLD_BYTES;
  const windowOpen = !closesAt || now <= closesAt;
  const remainingMillis = closesAt ? closesAt.getTime() - now.getTime() : null;
  const cleanupMillis = cleanupAt ? cleanupAt.getTime() - now.getTime() : null;
  const percentageUsed = threshold
    ? Math.min(100, Math.round((totalBytes / threshold) * 100))
    : null;

  return {
    eventDate,
    closesAt,
    cleanupAt,
    cleanupStatus,
    isWindowOpen: windowOpen,
    totalBytes,
    optimizedBytes,
    thresholdBytes: threshold,
    compressionActive: compressionActive || totalBytes >= threshold,
    shouldCompressNext: totalBytes >= threshold,
    remainingMillis,
    remainingDays:
      remainingMillis !== null ? Math.ceil(remainingMillis / (1000 * 60 * 60 * 24)) : null,
    cleanupMillis,
    cleanupDue: cleanupAt ? now >= cleanupAt : false,
    cleanupDaysRemaining:
      cleanupMillis !== null ? Math.ceil(cleanupMillis / (1000 * 60 * 60 * 24)) : null,
    percentageUsed,
    now,
  };
};

export const syncAlbumEventDate = async (
  weddingId,
  { albumId = DEFAULT_ALBUM_ID, eventDate } = {}
) => {
  if (!weddingId) throw new Error('weddingId es requerido');
  if (typeof eventDate === 'undefined') return null;
  await ensureFirebase();

  const albumRef = doc(db, 'weddings', weddingId, 'albums', albumId);
  const currentSnap = await getDoc(albumRef);
  if (!currentSnap.exists()) return null;
  const currentData = currentSnap.data() || {};

  const updates = {};
  const parsedEventDate = parseDateValue(eventDate);

  if (parsedEventDate) {
    updates.eventDate = toTimestamp(parsedEventDate);
    updates['uploadWindow.closesAt'] = toTimestamp(
      addDays(parsedEventDate, GALLERY_UPLOAD_WINDOW_DAYS_AFTER_EVENT)
    );
    updates['uploadWindow.cleanupAt'] = toTimestamp(
      addDays(parsedEventDate, GALLERY_RETENTION_DAYS_AFTER_EVENT)
    );
    if ((currentData?.uploadWindow?.cleanupStatus || 'scheduled') !== 'completed') {
      updates['uploadWindow.cleanupStatus'] = 'scheduled';
    }
  } else {
    updates.eventDate = deleteField();
    updates['uploadWindow.closesAt'] = deleteField();
    updates['uploadWindow.cleanupAt'] = deleteField();
    updates['uploadWindow.cleanupStatus'] = deleteField();
  }

  if (!currentData?.uploadWindow?.compressionThresholdBytes) {
    updates['uploadWindow.compressionThresholdBytes'] = GALLERY_COMPRESSION_THRESHOLD_BYTES;
  }

  if (!Object.keys(updates).length) return { id: albumRef.id, ...currentData };

  await updateDoc(albumRef, updates).catch(() => {});
  const refreshed = await getDoc(albumRef);
  return refreshed.exists() ? { id: albumRef.id, ...refreshed.data() } : null;
};

export const getAlbumScenes = (album) =>
  normalizeScenes(album?.settings?.scenes || DEFAULT_SETTINGS.scenes);

export const buildGuestShareUrl = ({ baseUrl, token, weddingId }) => {
  if (!token || !weddingId) return '';
  const origin =
    baseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://maloveapp.app');
  const normalized = origin.replace(/\/$/, '');
  return `${normalized}/momentos/recuerdos?w=${encodeURIComponent(
    weddingId
  )}&token=${encodeURIComponent(token)}`;
};

export const summarizeByScene = (photos = []) => {
  const summary = {
    total: photos.length,
    scenes: {},
  };
  photos.forEach((photo) => {
    const key = photo.scene || 'otros';
    summary.scenes[key] = summary.scenes[key] ? summary.scenes[key] + 1 : 1;
  });
  return summary;
};

export default {
  ensureMomentosAlbum,
  listenAlbum,
  listenPhotos,
  listenGuestProgress,
  uploadMomentPhoto,
  updatePhotoStatus,
  updateAlbumSettings,
  createGuestToken,
  validateGuestToken,
  listenGuestTokens,
  revokeGuestToken,
  incrementTokenUsage,
  getDownloadLinks,
  markPhotoReaction,
  recordActivity,
  getAlbumEventDate,
  getGalleryUploadState,
  syncAlbumEventDate,
  getAlbumScenes,
  buildGuestShareUrl,
  summarizeByScene,
};
