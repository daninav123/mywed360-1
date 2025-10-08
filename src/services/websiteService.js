import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db, firebaseReady } from '../lib/firebase';
import { get as apiGet, post as apiPost } from './apiClient';

const RESERVED_SLUGS = new Set(['www', 'api', 'mg', 'mail', 'cdn', 'static', 'assets', 'admin']);

const fetchVersions = async (uid, weddingId) => {
  const userCollection = await getDocs(collection(db, 'users', uid, 'generatedPages'));
  let versionList = userCollection.docs.map((snapshot) => ({
    id: snapshot.id,
    scope: 'user',
    ...snapshot.data(),
  }));

  if (weddingId) {
    try {
      const weddingCollection = await getDocs(collection(db, 'weddings', weddingId, 'generatedPages'));
      versionList = versionList.concat(
        weddingCollection.docs.map((snapshot) => ({
          id: snapshot.id,
          scope: 'wedding',
          ...snapshot.data(),
        }))
      );
    } catch (err) {
      console.warn('websiteService.fetchVersions wedding', err);
    }
  }

  versionList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return versionList;
};

const normalizeProfile = (userDoc = {}, weddingInfo = {}) => {
  const couple = String(weddingInfo.coupleName || '').trim();
  let brideName = '';
  let groomName = '';

  if (couple) {
    const parts = couple
      .split(/\s+y\s+|\s*&\s*|\s*\/\s*|\s*-\s*|,\s*/i)
      .filter(Boolean);
    if (parts.length >= 2) {
      [brideName, groomName] = [parts[0], parts[1]];
    } else {
      brideName = couple;
    }
  }

  const schedule = weddingInfo.schedule || '';
  const transportSchedule = Array.isArray(weddingInfo.transportationSchedule)
    ? weddingInfo.transportationSchedule
    : Array.isArray(weddingInfo.shuttleSchedule)
    ? weddingInfo.shuttleSchedule
    : [];
  const lodgingOptions = Array.isArray(weddingInfo.lodgingOptions)
    ? weddingInfo.lodgingOptions
    : Array.isArray(userDoc?.lodgingOptions)
    ? userDoc.lodgingOptions
    : [];
  const travelGuideRaw =
    weddingInfo.travelGuide ||
    weddingInfo.travelInfo ||
    userDoc?.travelGuide ||
    userDoc?.travelInfo ||
    {};
  const travelInfo = {
    summary: travelGuideRaw.summary || '',
    byCar: travelGuideRaw.byCar || travelGuideRaw.driving || weddingInfo.travelByCar || '',
    byPlane: travelGuideRaw.byPlane || weddingInfo.travelByPlane || '',
    byTrain: travelGuideRaw.byTrain || weddingInfo.travelByTrain || '',
    tips: travelGuideRaw.tips || weddingInfo.travelTips || '',
    airports:
      (Array.isArray(travelGuideRaw.airports) && travelGuideRaw.airports) ||
      (Array.isArray(weddingInfo.airports) && weddingInfo.airports) ||
      [],
    stations:
      (Array.isArray(travelGuideRaw.stations) && travelGuideRaw.stations) ||
      (Array.isArray(weddingInfo.trainStations) && weddingInfo.trainStations) ||
      [],
  };
  const contactEmail = userDoc?.account?.email || userDoc?.email || '';
  const contactPhone = userDoc?.account?.whatsNumber || userDoc?.phone || '';
  const weddingStyle = weddingInfo.weddingStyle || userDoc?.weddingStyle || 'Clásico';
  const colorScheme = weddingInfo.colorScheme || userDoc?.colorScheme || 'Blanco y dorado';
  const additionalInfo = [weddingInfo.importantInfo, weddingInfo.giftAccount].filter(Boolean).join(' | ');

  return {
    brideInfo: { nombre: brideName },
    groomInfo: { nombre: groomName },
    ceremonyInfo: {
      fecha: weddingInfo.weddingDate || '',
      hora: weddingInfo.ceremonyTime || schedule || '',
      lugar: weddingInfo.ceremonyLocation || weddingInfo.celebrationPlace || '',
      direccion: weddingInfo.ceremonyAddress || weddingInfo.celebrationAddress || '',
    },
    receptionInfo: {
      hora: weddingInfo.receptionTime || schedule || '',
      lugar: weddingInfo.receptionVenue || weddingInfo.banquetPlace || '',
      direccion: weddingInfo.receptionAddress || '',
    },
    transportationInfo: {
      detalles: weddingInfo.transportation || '',
      schedule: transportSchedule,
    },
    travelInfo,
    lodgingOptions,
    contactEmail,
    contactPhone,
    weddingStyle,
    colorScheme,
    additionalInfo,
  };
};

const fetchUserDoc = async (uid) => {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (snapshot.exists()) return snapshot.data() || {};
  } catch (err) {
    console.warn('websiteService.fetchUserDoc', err);
  }
  return {};
};

const fetchWeddingDoc = async (weddingId) => {
  if (!weddingId) return {};
  try {
    const snapshot = await getDoc(doc(db, 'weddings', weddingId));
    if (snapshot.exists()) {
      const data = snapshot.data() || {};
      return data.weddingInfo ? { ...data.weddingInfo } : {};
    }
  } catch (err) {
    console.warn('websiteService.fetchWeddingDoc', err);
  }
  return {};
};

export const loadWebsiteContext = async ({ uid, weddingId }) => {
  if (!uid) return { profile: null, weddingInfo: {}, versions: [] };

  try {
    await firebaseReady;
  } catch (err) {
    console.warn('websiteService.loadWebsiteContext firebaseReady', err);
  }

  const [userDoc, weddingInfo] = await Promise.all([fetchUserDoc(uid), fetchWeddingDoc(weddingId)]);
  const profile = normalizeProfile(userDoc, weddingInfo);
  const versions = await fetchVersions(uid, weddingId);

  return { profile, weddingInfo, versions };
};

export const buildSlugSuggestions = (profile) => {
  if (!profile) return [];

  const toSlug = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const firstWord = (value) =>
    String(value || '')
      .trim()
      .split(/\s+/)[0] || '';

  const yyyymmdd = (date) => {
    try {
      const dt = new Date(date);
      if (Number.isNaN(dt.getTime())) return '';
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${dt.getFullYear()}${month}${day}`;
    } catch {
      return '';
    }
  };

  const bride = profile?.brideInfo?.nombre || '';
  const groom = profile?.groomInfo?.nombre || '';
  const ceremonyDate = profile?.ceremonyInfo?.fecha || '';

  const brideFirst = firstWord(bride);
  const groomFirst = firstWord(groom);
  const dateStamp = yyyymmdd(ceremonyDate || Date.now());
  const dateIso = (() => {
    try {
      const dt = new Date(ceremonyDate || Date.now());
      if (Number.isNaN(dt.getTime())) return '';
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${dt.getFullYear()}-${month}-${day}`;
    } catch {
      return '';
    }
  })();
  const year = (dateIso || dateStamp).slice(0, 4);

  const initials = `${brideFirst.slice(0, 1)}${groomFirst.slice(0, 1)}`.trim();

  const suggestions = [
    [toSlug(dateIso)],
    [toSlug(dateIso), toSlug(brideFirst), toSlug(groomFirst)],
    [toSlug(dateIso), toSlug(groomFirst), toSlug(brideFirst)],
    [toSlug(brideFirst), toSlug(groomFirst), dateStamp],
    [toSlug(groomFirst), toSlug(brideFirst), dateStamp],
    [toSlug(dateIso), toSlug(initials)],
    [toSlug(brideFirst), toSlug(groomFirst)],
    [toSlug(groomFirst), toSlug(brideFirst)],
    [toSlug(initials), dateStamp],
    [toSlug(initials), year],
  ]
    .map((parts) => parts.filter(Boolean).join('-'))
    .filter(Boolean);

  return Array.from(new Set(suggestions));
};

export const checkSlugAvailability = async (slug) => {
  if (!slug) return { status: 'invalid' };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return { status: 'invalid' };
  if (RESERVED_SLUGS.has(slug)) return { status: 'reserved' };

  try {
    const response = await apiGet(`/api/public/weddings/${encodeURIComponent(slug)}`);
    if (response.status === 404) {
      try {
        const body = await response.json();
        if (body?.error === 'expired') return { status: 'taken' };
      } catch {
        /* noop */
      }
      return { status: 'available' };
    }

    if (response.ok || response.status === 403) return { status: 'taken' };
  } catch (err) {
    console.warn('websiteService.checkSlugAvailability', err);
    return { status: 'unknown' };
  }

  return { status: 'unknown' };
};

export const saveWebsiteVersion = async ({ uid, weddingId, html, prompt, slug }) => {
  if (!uid) throw new Error('saveWebsiteVersion: uid requerido');
  if (!html) throw new Error('saveWebsiteVersion: html requerido');

  await setDoc(doc(db, 'users', uid), { generatedHtml: html }, { merge: true });
  await addDoc(collection(db, 'users', uid, 'generatedPages'), {
    html,
    createdAt: serverTimestamp(),
    prompt,
    slug: slug || null,
  });

  if (weddingId) {
    try {
      await addDoc(collection(db, 'weddings', weddingId, 'generatedPages'), {
        html,
        createdAt: serverTimestamp(),
        prompt,
        slug: slug || null,
        author: uid,
      });
    } catch (err) {
      console.warn('websiteService.saveWebsiteVersion wedding', err);
    }
  }

  const versions = await fetchVersions(uid, weddingId);
  return versions;
};

export const publishWeddingSite = async ({ weddingId, html, slug }) => {
  if (!weddingId) return { ok: false };

  try {
    const response = await apiPost(
      `/api/public/weddings/${encodeURIComponent(weddingId)}/publish`,
      { html, slug: slug || undefined },
      { auth: true }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { ok: false, error };
    }

    const data = await response.json().catch(() => ({}));
    const publicUrl =
      data?.publicUrl ||
      (typeof window !== 'undefined' && data?.publicPath
        ? `${window.location.origin}${data.publicPath}`
        : null);

    return { ok: true, publicUrl, data };
  } catch (err) {
    console.warn('websiteService.publishWeddingSite', err);
    return { ok: false, error: err };
  }
};

export const RESERVED_PUBLIC_SLUGS = RESERVED_SLUGS;
