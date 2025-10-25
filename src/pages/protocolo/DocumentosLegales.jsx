import { Download } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  addDoc,
  collection,
  deleteDoc,
  doc as firestoreDoc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import { useWedding } from '../../context/WeddingContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import useTranslations from '../../hooks/useTranslations';
import { uploadEmailAttachments } from '../../services/storageUploadService';
import { db } from '../../firebaseConfig';
import { formatDate } from '../../utils/formatUtils';
import { useAuth } from '../../hooks/useAuth';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import legalCatalog from '../../data/legalRequirementsCatalog.json';

// Persistencia local de progreso de requisitos por boda
const LEGAL_LS_KEY = (weddingId) => `legalRequirements_${weddingId}`;
function loadLegalProgress(weddingId) {
  try {
    return JSON.parse(localStorage.getItem(LEGAL_LS_KEY(weddingId)) || '{}');
  } catch {
    return {};
  }
}
function saveLegalProgress(weddingId, data) {
  try {
    localStorage.setItem(LEGAL_LS_KEY(weddingId), JSON.stringify(data || {}));
  } catch {}
}

const COUNTRY_CATALOG = legalCatalog?.countries || {};
const DEFAULT_COUNTRY = COUNTRY_CATALOG.ES
  ? 'ES'
  : Object.keys(COUNTRY_CATALOG)[0] || 'ES';
const LEGAL_TYPE_OPTIONS = [
  { key: 'civil', label: 'Civil / Juzgado' },
  { key: 'religious_catholic', label: 'Iglesia (efectos civiles)' },
];
const COUNTRY_OPTIONS = Object.entries(COUNTRY_CATALOG)
  .map(([code, info]) => ({ code, name: info?.name || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

const legacyTypeKey = (type) => (type === 'religious_catholic' ? 'iglesia' : type);

const sanitizeKeyFragment = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'item';

// Descargables por región y tipo
const DOWNLOAD_TEMPLATES = {
  ES: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Solicitud de expediente matrimonial',
        desc: {t('common.modelo_generico_para_registro_civil')},
      },
      {
        id: 'declaracion_estado_civil',
        title: {t('common.declaracion_jurada_estado_civil')},
        desc: {t('common.solteria_divorcio_viudedad')},
      },
      {
        id: 'modelo_testigos',
        title: {t('common.modelo_declaracion_testigos')},
        desc: {t('common.aportacion_testigos_registro_solicita')},
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: {t('common.solicitud_expediente_matrimonial_canonico')},
        desc: {t('common.modelo_tipo_para_parroquiadiocesis')},
      },
      {
        id: 'fe_solteria_eclesiastica',
        title: {t('common.solteria_modelo')},
        desc: 'Para su parroquia de origen',
      },
      {
        id: 'constancia_curso_prematrimonial',
        title: 'Constancia curso prematrimonial (modelo)',
        desc: 'A completar por la parroquia/centro',
      },
    ],
  },
  FR: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Demande de dossier matrimonial (modèle)',
        desc: {t('common.modele_generique')},
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: 'Demande de dossier canonique (modèle)',
        desc: {t('common.modele_generique')},
      },
    ],
  },
  US: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Marriage License Application (template)',
        desc: 'Generic template',
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: 'Canonical Marriage Dossier Request (template)',
        desc: 'Generic template',
      },
    ],
  },
};

const DEFAULT_RELATED_ID = 'legal';

function guessRelatedCeremonyId(label = '') {
  const lower = String(label).toLowerCase();
  if (lower.includes('curso')) return 'curso';
  if (lower.includes('ensayo')) return 'rehearsal';
  if (lower.includes('proveedor') || lower.includes({t('common.musica')}) || lower.includes('sonido')) {
    return 'suppliers';
  }
  return DEFAULT_RELATED_ID;
}

// Plantillas HTML para .doc / PDF con prefill básico
function generateTemplateHTML(id, region = 'ES', data = {}) {
  const today = formatDate(new Date(), 'short');
  const styles = `body{font-family:Calibri,Arial,sans-serif;line-height:1.4;color:#222}h1{font-size:20pt;margin:0 0 6pt}h2{font-size:14pt;margin:14pt 0 6pt}p{margin:6pt 0}ul{margin:6pt 0 6pt 18pt}`;
  const couple = data.couple || '______________________ y ______________________';
  const bride = data.bride || '______________________';
  const groom = data.groom || '______________________';
  const eventDate = data.date || '____/____/______';
  const place = data.place || '______________________';
  const commonHeader = `<h1>Documento</h1><p>Fecha: ${today}</p>`;
  switch (id) {
    case 'solicitud_expediente_matrimonial':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud de expediente</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Solicitud de apertura de expediente matrimonial</h2>
        <p>Registro Civil: ______________________________</p>
        <p>Nosotros, ${couple}, solicitamos la apertura del expediente para contraer matrimonio.</p>
        <p>Adjuntamos la documentación requerida y declaramos que los datos aportados son veraces.</p>
        <p>Lugar del enlace: ${place}. Fecha prevista: ${eventDate}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>${bride} &nbsp;&nbsp;&nbsp;&nbsp; ${groom}</p>
      </body></html>`;
    case 'declaracion_estado_civil':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaración estado civil</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Declaración jurada de estado civil</h2>
        <p>Yo, D./Dña. ______________________ con DNI __________, declaro bajo mi responsabilidad que mi estado civil es: __________ (soltero/a, divorciado/a, viudo/a).</p>
        <p>Y para que conste a los efectos oportunos, firmo la presente.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firma: ${bride}</p>
      </body></html>`;
    case 'modelo_testigos':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaración de testigos</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Declaración de testigos</h2>
        <p>El/La que suscribe, D./Dña. ______________________ con DNI __________, y D./Dña. ______________________ con DNI __________, DECLARAN conocer a los contrayentes y no tener conocimiento de impedimentos legales para la celebración del matrimonio.</p>
        <p>Contrayentes: ${couple}. Fecha prevista del enlace: ${eventDate}. Lugar: ${place}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>___________________________ &nbsp;&nbsp;&nbsp;&nbsp; ___________________________</p>
      </body></html>`;
    case 'solicitud_expediente_canonico':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud expediente canónico</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Solicitud de apertura de expediente matrimonial canónico</h2>
        <p>Parroquia: ______________________________ &nbsp;&nbsp; Diócesis: ______________________________</p>
        <p>Los contrayentes ${couple} solicitan la apertura del expediente matrimonial canónico.</p>
        <p>Se aportará la documentación requerida por la parroquia y la diócesis.</p>
        <p>Lugar del enlace: ${place}. Fecha prevista: ${eventDate}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>${bride} &nbsp;&nbsp;&nbsp;&nbsp; ${groom}</p>
      </body></html>`;
    case 'fe_solteria_eclesiastica':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fe de soltería</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Fe de soltería (modelo)</h2>
        <p>D./Dña. ______________________ con DNI __________, parroquiano de ______________________, solicita la expedición de Fe de Soltería a efectos matrimoniales.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firma: ${bride}</p>
      </body></html>`;
    case 'constancia_curso_prematrimonial':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Constancia curso prematrimonial</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Constancia de asistencia a curso prematrimonial (modelo)</h2>
        <p>Se deja constancia de que ${couple} han completado el curso prematrimonial impartido por ______________________ los días ______________________.</p>
        <p>Firma y sello: ___________________________</p>
      </body></html>`;
    default:
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plantilla</title><style>${styles}</style></head><body>${commonHeader}<p>Plantilla gen€)rica.</p></body></html>`;
  }
}

function downloadAsDoc(filename, html) {
  try {
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('No se pudo descargar la plantilla', e);
  }
}

async function downloadAsPdf(filename, html) {
  try {
    const jspdfMod = await import('jspdf');
    // Asegurar html2canvas para doc.html
    try {
      const h2c = await import('html2canvas');
      if (typeof window !== 'undefined') window.html2canvas = h2c.default || h2c;
    } catch {}
    const jsPDF = jspdfMod.default || jspdfMod.jsPDF || jspdfMod;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = html;
    document.body.appendChild(container);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    await doc.html(container, {
      x: 32,
      y: 32,
      width: 531,
      windowWidth: 800,
      html2canvas: { scale: 0.9 },
    });
    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    container.remove();
  } catch (e) {
    console.warn('No se pudo generar PDF, abriendo impresión como fallback', e);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  }
}

function buildTemplatePrefill(info) {
  const wi = info || {};
  const couple =
    wi.coupleName ||
    wi.couple ||
    wi.brideAndGroom ||
    [wi.bride, wi.groom].filter(Boolean).join(' y ');
  const date = wi.weddingDate || wi.date || wi.ceremonyDate || '';
  const place =
    wi.celebrationPlace || wi.ceremonyLocation || wi.location || wi.place || wi.venue || '';
  const bride = wi.bride || (couple ? couple.split(' y ')[0] : '');
  const groom = wi.groom || (couple ? couple.split(' y ')[1] : '');
  return { couple, date, place, bride, groom };
}

export default function DocumentosLegales() {
  const { activeWedding } = useWedding();
  const { info: weddingInfo } = useActiveWeddingInfo();
  const { t } = useTranslations();
  const { currentUser } = useAuth();
  const tr = (key, def) => {
    try {
      const v = t(key);
      return v === key ? def : v;
    } catch {
      return def;
    }
  };

  const [form, setForm] = useState({ region: DEFAULT_COUNTRY });
  const [legalType, setLegalType] = useState('civil');
  const [legalProgress, setLegalProgress] = useState({});
  const [uploadingReq, setUploadingReq] = useState({}); // { key: boolean }

  const progressSyncRef = useRef({
    localLoaded: false,
    remoteLoaded: false,
    skipNextWrite: false,
  });
  const progressWriteTimerRef = useRef(null);

  useEffect(() => {
    progressSyncRef.current.localLoaded = false;
    progressSyncRef.current.remoteLoaded = false;
    progressSyncRef.current.skipNextWrite = false;
    if (progressWriteTimerRef.current) {
      clearTimeout(progressWriteTimerRef.current);
      progressWriteTimerRef.current = null;
    }
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding) return;
    const stored = loadLegalProgress(activeWedding);
    progressSyncRef.current.skipNextWrite = true;
    progressSyncRef.current.localLoaded = true;
    setLegalProgress(stored || {});
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding) return;
    let cancelled = false;
    (async () => {
      try {
        const docRef = firestoreDoc(db, 'weddings', activeWedding, 'legalRequirements', 'progress');
        const snap = await getDoc(docRef);
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() || {};
          const entries = data.entries && typeof data.entries === 'object' ? data.entries : {};
          if (entries && Object.keys(entries).length > 0) {
            progressSyncRef.current.skipNextWrite = true;
            setLegalProgress((prev) => {
              const merged = { ...(prev || {}) };
              Object.entries(entries).forEach(([key, value]) => {
                merged[key] = value;
              });
              if (activeWedding) {
                saveLegalProgress(activeWedding, merged);
              }
              return merged;
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[DocumentosLegales] No se pudo cargar progreso legal remoto', error);
        }
      } finally {
        if (!cancelled) {
          progressSyncRef.current.remoteLoaded = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);

  const activeCountry = COUNTRY_CATALOG[form.region] || COUNTRY_CATALOG[DEFAULT_COUNTRY];

  useEffect(() => {
    if (!weddingInfo) return;
    const profileCountry =
      weddingInfo?.ceremony?.legal?.countryOrigin ||
      weddingInfo?.profile?.location?.country ||
      weddingInfo?.profile?.country ||
      weddingInfo?.event?.country ||
      weddingInfo?.location?.country ||
      weddingInfo?.country;
    if (!profileCountry) return;
    const normalized = String(profileCountry).toUpperCase();
    if (!COUNTRY_CATALOG[normalized]) return;
    setForm((prev) => (prev.region === normalized ? prev : { ...prev, region: normalized }));
  }, [weddingInfo]);

  const availableLegalTypes = useMemo(() => {
    if (!activeCountry) return LEGAL_TYPE_OPTIONS;
    return LEGAL_TYPE_OPTIONS.filter((option) => {
      const typeData = activeCountry.ceremonyTypes?.[option.key];
      if (!typeData || !Array.isArray(typeData.requirements)) return false;
      return typeData.requirements.some(
        (req) => Array.isArray(req.documentation) && req.documentation.length > 0
      );
    });
  }, [activeCountry]);

  useEffect(() => {
    if (!activeCountry) return;
    if (!availableLegalTypes.some((option) => option.key === legalType)) {
      const fallbackType = availableLegalTypes[0]?.key || 'civil';
      if (fallbackType !== legalType) setLegalType(fallbackType);
    }
  }, [activeCountry, availableLegalTypes, legalType]);

  const updateProgress = useCallback(
    (updater) => {
      setLegalProgress((prev) => {
        const snapshot = { ...(prev || {}) };
        const next = updater(snapshot);
        const finalState = next || snapshot;
        if (activeWedding) {
          saveLegalProgress(activeWedding, finalState);
        }
        return finalState;
      });
    },
    [activeWedding]
  );

  const requirementsList = useMemo(() => {
    if (!activeCountry) return [];
    const typeCollection = activeCountry.ceremonyTypes?.[legalType];
    if (!typeCollection || !Array.isArray(typeCollection.requirements)) return [];
    const list = [];
    typeCollection.requirements.forEach((req, reqIndex) => {
      (req.documentation || []).forEach((docLabel, docIndex) => {
        const normalizedLabel = (docLabel || '').trim();
        if (!normalizedLabel) return;
        const fragment =
          sanitizeKeyFragment(normalizedLabel) || `${req.id || `req-${reqIndex}`}-${docIndex}`;
        const key = `${form.region}.${legalType}.${req.id || `req-${reqIndex}`}.${fragment}`;
        const legacyKey = `${form.region}.${legacyTypeKey(legalType)}.${normalizedLabel}`;
        list.push({
          key,
          legacyKey,
          label: normalizedLabel,
          requirement: req,
        });
      });
    });
    return list;
  }, [activeCountry, form.region, legalType]);

  const requirementSummary = useMemo(() => {
    if (!activeCountry) {
      return { authorities: [], links: [], leadTimeDays: null };
    }
    const typeCollection = activeCountry.ceremonyTypes?.[legalType];
    if (!typeCollection || !Array.isArray(typeCollection.requirements)) {
      return { authorities: [], links: [], leadTimeDays: null };
    }
    const authorities = new Set();
    const linksMap = new Map();
    let leadTime = null;
    typeCollection.requirements.forEach((req) => {
      if (req.authority) authorities.add(req.authority);
      if (typeof req.leadTimeDays === 'number' && !Number.isNaN(req.leadTimeDays)) {
        leadTime = leadTime === null ? req.leadTimeDays : Math.max(leadTime, req.leadTimeDays);
      }
      (req.links || []).forEach((link) => {
        if (link?.url && !linksMap.has(link.url)) {
          linksMap.set(link.url, link);
        }
      });
    });
    return {
      authorities: Array.from(authorities),
      links: Array.from(linksMap.values()),
      leadTimeDays: leadTime,
    };
  }, [activeCountry, legalType]);

  useEffect(() => {
    if (!activeWedding) return;
    const syncState = progressSyncRef.current;
    if (!syncState.localLoaded || !syncState.remoteLoaded) return;
    if (syncState.skipNextWrite) {
      syncState.skipNextWrite = false;
      return;
    }
    if (progressWriteTimerRef.current) {
      clearTimeout(progressWriteTimerRef.current);
      progressWriteTimerRef.current = null;
    }
    const safeProgress = legalProgress && typeof legalProgress === 'object' ? legalProgress : {};
    progressWriteTimerRef.current = setTimeout(async () => {
      try {
        const docRef = firestoreDoc(db, 'weddings', activeWedding, 'legalRequirements', 'progress');
        await setDoc(
          docRef,
          {
            entries: safeProgress,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null,
          },
          { merge: true }
        );
        saveLegalProgress(activeWedding, safeProgress);
      } catch (error) {
        console.warn('[DocumentosLegales] No se pudo sincronizar progreso legal', error);
      } finally {
        progressWriteTimerRef.current = null;
      }
    }, 800);
    return () => {
      if (progressWriteTimerRef.current) {
        clearTimeout(progressWriteTimerRef.current);
        progressWriteTimerRef.current = null;
      }
    };
  }, [legalProgress, activeWedding, currentUser]);

  const countryNotes = activeCountry?.metadata?.notes || [];
  const sourceLinks =
    requirementSummary.links.length > 0
      ? requirementSummary.links
      : activeCountry?.metadata?.sourceUrl
        ? [
            {
              type: 'reference',
              label: activeCountry?.metadata?.sourceLabel || 'Fuente oficial',
              url: activeCountry.metadata.sourceUrl,
            },
          ]
        : [];
  const formattedLeadTime =
    requirementSummary.leadTimeDays && requirementSummary.leadTimeDays > 0
      ? `≈ ${requirementSummary.leadTimeDays} días`
      : null;

  const templatesForSelection = useMemo(() => {
    const byRegion = DOWNLOAD_TEMPLATES[form.region] || DOWNLOAD_TEMPLATES.ES;
    const templateKey = legacyTypeKey(legalType);
    return byRegion[templateKey] || [];
  }, [form.region, legalType]);

  return (
    <PageWrapper title="Documentos">
      {!activeWedding && (
        <Card className="p-6">
          <p className="text-gray-700">Selecciona una boda activa para gestionar documentos.</p>
        </Card>
      )}

      {activeWedding && (
        <>
          {/* Requisitos legales */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Requisitos para registrar la boda</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-gray-600">Tipo:</label>
                <div className="inline-flex rounded overflow-hidden border">
                  {availableLegalTypes.map((option) => (
                    <button
                      key={option.key}
                      className={`${
                        legalType === option.key ? 'bg-blue-600 text-white' : 'bg-white'
                      } px-3 py-1 text-sm transition-colors`}
                      onClick={() => setLegalType(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <label className="text-sm text-gray-600 ml-2">País:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Esta lista es orientativa y puede variar según municipio, Registro Civil o diócesis.
              Confirma siempre con tu oficina/parroquia.
            </p>
            <div className="space-y-2">
              {requirementsList.length === 0 && (
                <p className="text-sm text-gray-600">
                  No hay requisitos configurados para este tipo en{' '}
                  {activeCountry?.name || form.region}.
                </p>
              )}
              {requirementsList.map(({ key: progressKey, legacyKey, label }, idx) => {
                const entry =
                  legalProgress[progressKey] ??
                  (legacyKey ? legalProgress[legacyKey] : undefined);
                const checked = typeof entry === 'object' ? !!entry.done : !!entry;
                const fileMeta = typeof entry === 'object' ? entry.file : null;
                const inputId = `file-${idx}-${progressKey.replace(/[^a-z0-9]/gi, '-')}`;
                return (
                  <div key={progressKey} className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          updateProgress((current) => {
                            const next = { ...current };
                            const previous =
                              next[progressKey] ??
                              (legacyKey ? next[legacyKey] : undefined);
                            if (e.target.checked) {
                              next[progressKey] =
                                typeof previous === 'object'
                                  ? { ...previous, done: true }
                                  : true;
                            } else {
                              if (typeof previous === 'object' && previous.file) {
                                next[progressKey] = { ...previous, done: false };
                              } else {
                                delete next[progressKey];
                              }
                            }
                            if (legacyKey && legacyKey in next) delete next[legacyKey];
                            return next;
                          })
                        }
                      />
                      <span>{label}</span>
                    </label>
                    <div className="pl-6 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <input
                        id={inputId}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={async (e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          const upKey = progressKey;
                          const relatedId = guessRelatedCeremonyId(label);
                          setUploadingReq((u) => ({ ...u, [upKey]: true }));
                          try {
                            const uploaded = await uploadEmailAttachments(
                              [f],
                              activeWedding || 'anon',
                              'legal-requirements'
                            );
                            const meta =
                              Array.isArray(uploaded) && uploaded[0]
                                ? uploaded[0]
                                : { filename: f.name, size: f.size };
                            meta.relatedCeremonyId = relatedId;
                            let documentId =
                              typeof entry === 'object' && entry?.file
                                ? entry.file.documentId
                                : undefined;

                            if (activeWedding) {
                              const documentsCol = collection(
                                db,
                                'weddings',
                                activeWedding,
                                'documents'
                              );
                              const documentBase = {
                                name: meta.filename || f.name || 'Documento legal',
                                url: meta.url || '',
                                storagePath: meta.storagePath || '',
                                size: meta.size ?? f.size ?? 0,
                                category: 'legal',
                                relatedCeremonyId: relatedId || DEFAULT_RELATED_ID,
                                status: 'uploaded',
                                requirementKey: upKey,
                                legalType,
                                source: 'documents-legal',
                              };
                              if (currentUser?.uid) documentBase.uploadedBy = currentUser.uid;
                              if (currentUser?.email) documentBase.uploadedByEmail = currentUser.email;

                              if (documentId) {
                                const documentRef = firestoreDoc(
                                  db,
                                  'weddings',
                                  activeWedding,
                                  'documents',
                                  documentId
                                );
                                await setDoc(
                                  documentRef,
                                  { ...documentBase, updatedAt: serverTimestamp() },
                                  { merge: true }
                                );
                              } else {
                                const docRef = await addDoc(documentsCol, {
                                  ...documentBase,
                                  createdAt: serverTimestamp(),
                                  updatedAt: serverTimestamp(),
                                });
                                documentId = docRef.id;
                              }
                              meta.documentId = documentId;
                              try {
                                performanceMonitor.logEvent('ceremony_document_uploaded', {
                                  weddingId: activeWedding,
                                  requirementKey: upKey,
                                  relatedCeremonyId: relatedId || DEFAULT_RELATED_ID,
                                });
                              } catch {}
                            }

                            updateProgress((current) => {
                              const next = { ...current };
                              const previous =
                                next[upKey] ?? (legacyKey ? next[legacyKey] : undefined);
                              const base = typeof previous === 'object' ? previous : {};
                              next[upKey] = { ...base, done: true, file: { ...meta } };
                              if (legacyKey && legacyKey in next) delete next[legacyKey];
                              return next;
                            });
                            try {
                              toast.success(tr('documents.uploaded', 'Archivo subido'));
                            } catch {}
                          } catch (err) {
                            console.warn('Upload requirement failed', err);
                            try {
                              toast.error(
                                tr('documents.uploadFailed', 'No se pudo subir el archivo')
                              );
                            } catch {}
                          } finally {
                            setUploadingReq((u) => ({ ...u, [upKey]: false }));
                            e.target.value = '';
                          }
                        }}
                      />
                      <label
                        htmlFor={inputId}
                        className="px-2 py-1 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        {uploadingReq[progressKey]
                          ? 'Subiendo...'
                          : fileMeta
                            ? 'Reemplazar archivo'
                            : 'Subir archivo'}
                      </label>
                      {fileMeta && (
                        <>
                          {fileMeta.url ? (
                            <a
                              href={fileMeta.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              Ver
                            </a>
                          ) : (
                            <span>{fileMeta.filename || 'Archivo'}</span>
                          )}
                          <button
                            className="text-red-600"
                            onClick={async () => {
                              let storageDeletedOk = true;
                              let firestoreDeletedOk = true;
                              if (fileMeta.url) {
                                try {
                                  const {
                                    getStorage,
                                    ref: sRef,
                                    deleteObject,
                                    refFromURL,
                                  } = await import('firebase/storage');
                                  const storage = getStorage();
                                  let fileRef;
                                  try {
                                    fileRef = refFromURL(fileMeta.url);
                                  } catch (_) {
                                    try {
                                      fileRef = sRef(storage, fileMeta.url);
                                    } catch {}
                                  }
                                  if (fileRef)
                                    await deleteObject(fileRef).catch(() => {
                                      storageDeletedOk = false;
                                    });
                                } catch (e) {
                                  storageDeletedOk = false;
                                  console.warn('No se pudo borrar del Storage:', e);
                                }
                              }
                              if (fileMeta.documentId && activeWedding) {
                                try {
                                  await deleteDoc(
                                    firestoreDoc(
                                      db,
                                      'weddings',
                                      activeWedding,
                                      'documents',
                                      fileMeta.documentId
                                    )
                                  );
                                } catch (err) {
                                  firestoreDeletedOk = false;
                                  console.warn('No se pudo borrar el documento de Firestore:', err);
                                }
                              }
                              updateProgress((current) => {
                                const next = { ...current };
                                const previous =
                                  next[progressKey] ??
                                  (legacyKey ? next[legacyKey] : undefined);
                                if (typeof previous === 'object') {
                                  const cleaned = { ...previous, done: false };
                                  delete cleaned.file;
                                  if (Object.keys(cleaned).length <= 1 && cleaned.done === false) {
                                    delete next[progressKey];
                                  } else {
                                    next[progressKey] = cleaned;
                                  }
                                } else if (previous) {
                                  delete next[progressKey];
                                }
                                if (legacyKey && legacyKey in next) delete next[legacyKey];
                                return next;
                              });
                              try {
                                if (storageDeletedOk && firestoreDeletedOk)
                                  toast.success(tr('documents.fileDeleted', 'Archivo eliminado'));
                                else
                                  toast.warn(
                                    tr(
                                      'documents.fileRefRemoved',
                                      'Referencia eliminada. No se pudo borrar del almacenamiento o del registro.'
                                    )
                                  );
                              } catch {}
                            }}
                          >
                            Quitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {(requirementSummary.authorities.length > 0 ||
              formattedLeadTime ||
              countryNotes.length > 0 ||
              sourceLinks.length > 0) && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm text-slate-700">
                {requirementSummary.authorities.length > 0 && (
                  <div>
                    <span className="font-semibold">Autoridades clave:</span>{' '}
                    {requirementSummary.authorities.join(', ')}
                  </div>
                )}
                {formattedLeadTime && (
                  <div>
                    <span className="font-semibold">Plazo estimado:</span> {formattedLeadTime}
                  </div>
                )}
                {countryNotes.length > 0 && (
                  <div>
                    <span className="font-semibold">Notas destacadas:</span>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      {countryNotes.map((note, index) => (
                        <li key={`${form.region}-note-${index}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {sourceLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">Fuentes:</span>
                    {sourceLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {link.label || link.url}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Descargables */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Descargables</h2>
              <div className="text-sm text-gray-600">
                {form.region === 'ES' ? 'España' : form.region}
              </div>
            </div>
            {templatesForSelection.length === 0 && (
              <p className="text-gray-600 text-sm">No hay descargables para la selección actual.</p>
            )}
            {templatesForSelection.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templatesForSelection.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="border rounded-lg p-3 flex items-center justify-between bg-white"
                  >
                    <div>
                      <div className="font-medium">{tpl.title}</div>
                      {tpl.desc && <div className="text-xs text-gray-600">{tpl.desc}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={() => {
                          try {
                            const data = buildTemplatePrefill(weddingInfo);
                            const html = generateTemplateHTML(tpl.id, form.region, data);
                            const name = tpl.title.replace(/\s+/g, '_');
                            downloadAsDoc(name, html);
                            try {
                              toast.success(
                                tr('documents.docDownloadStarted', 'Descarga iniciada (.DOC)')
                              );
                            } catch {}
                          } catch (e) {
                            try {
                              toast.error(tr('documents.docFailed', 'No se pudo generar el .DOC'));
                            } catch {}
                          }
                        }}
                      >
                        <Download size={16} /> .DOC
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            const data = buildTemplatePrefill(weddingInfo);
                            const html = generateTemplateHTML(tpl.id, form.region, data);
                            const name = tpl.title.replace(/\s+/g, '_');
                            await downloadAsPdf(name, html);
                            try {
                              toast.success(tr('documents.pdfReady', 'PDF generado'));
                            } catch {}
                          } catch (e) {
                            try {
                              toast.error(tr('documents.pdfFailed', 'No se pudo generar el PDF'));
                            } catch {}
                          }
                        }}
                      >
                        <Download size={16} /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </PageWrapper>
  );
}
