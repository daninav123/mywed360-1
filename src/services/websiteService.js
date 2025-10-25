import i18n from '../i18n';
import {
  addDoc,
  collection,
  deleteDoc,
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

const fetchPromptLibrary = async (uid) => {
  if (!uid) return [];
  const promptSnap = await getDocs(collection(db, 'users', uid, 'websitePrompts'));
  const prompts = promptSnap.docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() || {}),
  }));

  prompts.sort((a, b) => {
    const tsB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
    const tsA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
    return tsB - tsA;
  });

  return prompts;
};

const normalizePromptPayload = ({ name, description, prompt, templateKey }) => {
  const trimmedPrompt = String(prompt || '').trim();
  if (!trimmedPrompt) {
    throw new Error('El prompt no puede estar vacio');
  }

  return {
    name: String(name || '').trim() || 'Prompt personalizado',
    description: String(description || '').trim(),
    prompt: trimmedPrompt,
    templateKey: String(templateKey || 'personalizada').trim() || 'personalizada',
  };
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
  const additionalInfo = [
    weddingInfo.additionalInfo,
    weddingInfo.importantInfo,
    weddingInfo.giftAccount,
  ]
    .filter(Boolean)
    .join(' | ');

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
    story: weddingInfo.story || userDoc?.story || '',
    faqs: Array.isArray(weddingInfo.faqs) ? weddingInfo.faqs : [],
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
  if (!uid) return { profile: null, weddingInfo: {}, versions: [], promptLibrary: [] };

  try {
    await firebaseReady;
  } catch (err) {
    console.warn('websiteService.loadWebsiteContext firebaseReady', err);
  }

  const [userDoc, weddingInfo, prompts] = await Promise.all([
    fetchUserDoc(uid),
    fetchWeddingDoc(weddingId),
    fetchPromptLibrary(uid),
  ]);
  const profile = normalizeProfile(userDoc, weddingInfo);
  const versions = await fetchVersions(uid, weddingId);

  return { profile, weddingInfo, versions, promptLibrary: prompts };
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

export const updateWebsiteLogistics = async ({ uid, weddingId, logistics }) => {
  if (!uid) throw new Error('updateWebsiteLogistics: uid requerido');
  const payload = {
    transportation: logistics?.transportation || '',
    transportationSchedule: logistics?.transportationSchedule || [],
    lodgingOptions: logistics?.lodgingOptions || [],
    travelGuide: logistics?.travelGuide || {},
    story: logistics?.story || '',
    additionalInfo: logistics?.additionalInfo || '',
    faqs: logistics?.faqs || [],
  };

  const updateData = {
    'weddingInfo.transportation': payload.transportation,
    'weddingInfo.transportationSchedule': payload.transportationSchedule,
    'weddingInfo.lodgingOptions': payload.lodgingOptions,
    'weddingInfo.travelGuide': payload.travelGuide,
    'weddingInfo.story': payload.story,
    'weddingInfo.additionalInfo': payload.additionalInfo,
    'weddingInfo.faqs': payload.faqs,
  };

  if (weddingId) {
    await setDoc(doc(db, 'weddings', weddingId), updateData, { merge: true });
  } else {
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  }

  return payload;
};

export const logWebsiteAiRun = async ({ uid, weddingId, prompt, templateKey }) => {
  try {
    const ref = await addDoc(collection(db, 'ai', 'websites', 'runs'), {
      uid,
      weddingId: weddingId || null,
      templateKey,
      prompt,
      estimatedTokens: Math.max(1, Math.round((prompt || '').split(/\s+/).length * 1.2)),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('logWebsiteAiRun', err);
    return null;
  }
};

export const recordWebsiteEvent = async ({ uid, weddingId, event, payload }) => {
  try {
    await addDoc(collection(db, 'analytics', 'websiteEvents'), {
      uid,
      weddingId: weddingId || null,
      event,
      payload: payload || {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('recordWebsiteEvent', err);
    throw err;
  }
};

export const listWebsitePrompts = async ({ uid }) => fetchPromptLibrary(uid);

export const createWebsitePrompt = async ({ uid, name, description, prompt, templateKey }) => {
  if (!uid) throw new Error('createWebsitePrompt: uid requerido');
  const payload = normalizePromptPayload({ name, description, prompt, templateKey });
  await addDoc(collection(db, 'users', uid, 'websitePrompts'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return fetchPromptLibrary(uid);
};

export const updateWebsitePrompt = async ({
  uid,
  promptId,
  name,
  description,
  prompt,
  templateKey,
}) => {
  if (!uid) throw new Error('updateWebsitePrompt: uid requerido');
  if (!promptId) throw new Error('updateWebsitePrompt: promptId requerido');
  const payload = normalizePromptPayload({ name, description, prompt, templateKey });
  await setDoc(
    doc(db, 'users', uid, 'websitePrompts', promptId),
    { ...payload, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return fetchPromptLibrary(uid);
};

export const deleteWebsitePrompt = async ({ uid, promptId }) => {
  if (!uid) throw new Error('deleteWebsitePrompt: uid requerido');
  if (!promptId) throw new Error('deleteWebsitePrompt: promptId requerido');
  await deleteDoc(doc(db, 'users', uid, 'websitePrompts', promptId));
  return fetchPromptLibrary(uid);
};

export const RESERVED_PUBLIC_SLUGS = RESERVED_SLUGS;

export const requestWebsiteAiHtml = async ({
  systemMessage,
  userMessage,
  templateKey,
  weddingId,
  temperature,
  model,
}) => {
  const response = await apiPost(
    '/api/ai-website/generate',
    {
      systemMessage,
      userMessage,
      templateKey: templateKey || 'personalizada',
      weddingId: weddingId || null,
      temperature,
      model,
    },
    { auth: true }
  );

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    if (response.ok) {
      throw new Error(i18n.t('common.respuesta_invalida_generar_sitio_con'));
    }
  }

  if (!response.ok) {
    const error = new Error(data?.error || i18n.t('common.pudo_generar_pagina_con'));
    error.details = data;
    error.status = response.status;
    throw error;
  }

  if (!data || typeof data.html !== 'string') {
    const error = new Error(i18n.t('common.respuesta_invalida_generar_sitio_con'));
    error.details = data;
    throw error;
  }

  return data;
};
