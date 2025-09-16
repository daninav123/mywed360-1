import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Camera, Shield, Plus, Eye, Download, RefreshCw, Send } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { useWedding } from '../../context/WeddingContext';
import { listTemplates, generateDocument, listDocuments } from '../../services/LegalDocsService';
// Carga perezosa de firma digital para no impactar el bundle inicial
let requestSignature;
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import { uploadEmailAttachments } from '../../services/storageUploadService';

// Fallback local-storage helpers (when backend is unavailable)
const LS_KEY = (weddingId) => `legalDocs_${weddingId}`;
function loadLocalDocs(weddingId) {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY(weddingId)) || '[]');
  } catch (_) {
    return [];
  }
}
function saveLocalDoc(weddingId, doc) {
  const curr = loadLocalDocs(weddingId);
  const next = [doc, ...curr.filter((d) => d.id !== doc.id)];
  localStorage.setItem(LS_KEY(weddingId), JSON.stringify(next));
  return next;
}

// Track progress of legal requirements (civil/church) in localStorage
const LEGAL_LS_KEY = (weddingId) => `legalRequirements_${weddingId}`;
function loadLegalProgress(weddingId) {
  try {
    return JSON.parse(localStorage.getItem(LEGAL_LS_KEY(weddingId)) || '{}');
  } catch (_) {
    return {};
  }
}
function saveLegalProgress(weddingId, data) {
  try {
    localStorage.setItem(LEGAL_LS_KEY(weddingId), JSON.stringify(data || {}));
  } catch (_) {}
}
function updateLocalDoc(weddingId, docId, updater) {
  const curr = loadLocalDocs(weddingId);
  const next = curr.map((d) => (d.id === docId ? { ...d, ...updater(d) } : d));
  localStorage.setItem(LS_KEY(weddingId), JSON.stringify(next));
  return next;
}

// In-browser generation of simple Word-friendly templates (HTML-as-.doc)
function generateTemplateHTML(id, _region = 'ES', data = {}) {
  const today = new Date().toLocaleDateString();
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
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plantilla</title><style>${styles}</style></head><body>${commonHeader}<p>Plantilla genérica.</p></body></html>`;
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
    // Ensure html2canvas is available for doc.html
    try {
      const h2cMod = await import('html2canvas');
      if (typeof window !== 'undefined') {
        window.html2canvas = h2cMod.default || h2cMod;
      }
    } catch (_) {}
    const jsPDF = jspdfMod.default || jspdfMod.jsPDF || jspdfMod;
    // Volcar el HTML en un contenedor temporal
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
      width: 531, // (595 - 2*32) aprox A4
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
  const couple = wi.coupleName || wi.couple || wi.brideAndGroom || [wi.bride, wi.groom].filter(Boolean).join(' y ');
  const date = wi.weddingDate || wi.date || wi.ceremonyDate || '';
  const place = wi.celebrationPlace || wi.ceremonyLocation || wi.location || wi.place || wi.venue || '';
  const bride = wi.bride || (couple ? couple.split(' y ')[0] : '');
  const groom = wi.groom || (couple ? couple.split(' y ')[1] : '');
  return { couple, date, place, bride, groom };
}

const DEFAULT_TEMPLATES = [
  { id: 'provider_contract', name: 'Contrato con Proveedor', icon: FileText },
  { id: 'image_rights', name: 'Cesión de Imagen', icon: Camera },
  { id: 'terms_conditions', name: 'Términos y Condiciones', icon: Shield },
];

const REGIONAL_TEMPLATES = {
  ES: {
    name: 'España',
    standardClauses: ['gdpr_compliance', 'spanish_consumer_rights', 'civil_liability_spain'],
  },
  FR: {
    name: 'Francia',
    standardClauses: ['gdpr_compliance', 'french_consumer_code', 'civil_liability_france'],
  },
  US: {
    name: 'Estados Unidos',
    standardClauses: ['liability_limitation', 'dispute_resolution', 'force_majeure'],
  },
};

// Requisitos legales informativos para registrar la boda (base ES)
const LEGAL_REQUIREMENTS = {
  ES: {
    civil: [
      'DNI o Pasaporte vigente de ambos',
      'Certificado literal de nacimiento de ambos',
      'Certificado de empadronamiento (últimos 2 años)',
      'Declaración jurada de estado civil (soltería/divorcio/viudedad)',
      'Sentencia de divorcio o certificado de defunción (si aplica)',
      'Formulario de solicitud/expediente matrimonial del Registro Civil',
      'Testigos con DNI (según registro, el día de la cita)'
    ],
    iglesia: [
      'Certificado de bautismo reciente (expedido en los últimos 6 meses)',
      'Certificado de confirmación (si aplica o dispensa)',
      'Curso prematrimonial (certificado de asistencia)',
      'Fe de soltería eclesiástica (o dispensa correspondiente)',
      'Expediente matrimonial canónico',
      'Dispensa por disparidad de culto o mixta (si aplica)'
    ]
  }
};

// Descargables por región y tipo
const DOWNLOAD_TEMPLATES = {
  ES: {
    civil: [
      { id: 'solicitud_expediente_matrimonial', title: 'Solicitud de expediente matrimonial', desc: 'Modelo genérico para el Registro Civil' },
      { id: 'declaracion_estado_civil', title: 'Declaración jurada de estado civil', desc: 'Soltería / divorcio / viudedad' },
      { id: 'modelo_testigos', title: 'Modelo de declaración de testigos', desc: 'Aportación de testigos (si el registro lo solicita)' },
    ],
    iglesia: [
      { id: 'solicitud_expediente_canonico', title: 'Solicitud expediente matrimonial canónico', desc: 'Modelo tipo para parroquia/diócesis' },
      { id: 'fe_solteria_eclesiastica', title: 'Fe de soltería (modelo)', desc: 'Para su parroquia de origen' },
      { id: 'constancia_curso_prematrimonial', title: 'Constancia curso prematrimonial (modelo)', desc: 'A completar por la parroquia/centro' },
    ],
  },
  FR: {
    civil: [
      { id: 'solicitud_expediente_matrimonial', title: 'Demande de dossier matrimonial (modèle)', desc: 'Modèle générique' },
    ],
    iglesia: [
      { id: 'solicitud_expediente_canonico', title: 'Demande de dossier canonique (modèle)', desc: 'Modèle générique' },
    ],
  },
  US: {
    civil: [
      { id: 'solicitud_expediente_matrimonial', title: 'Marriage License Application (template)', desc: 'Generic template' },
    ],
    iglesia: [
      { id: 'solicitud_expediente_canonico', title: 'Canonical Marriage Dossier Request (template)', desc: 'Generic template' },
    ],
  },
};

function DocumentTypeCard({ title, description, Icon, count = 0, onCreate }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
        <div className="text-sm text-gray-500">{count} docs</div>
      </div>
      <div className="flex justify-end">
        <button onClick={onCreate} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white">
          <Plus size={16} /> Crear
        </button>
      </div>
    </div>
  );
}

export default function DocumentosLegales() {
  const { activeWedding } = useWedding();
  const location = useLocation();
  const { info: weddingInfo } = useActiveWeddingInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [docs, setDocs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ type: 'provider_contract', title: '', region: 'ES' });
  const [signModal, setSignModal] = useState({ open: false, doc: null, signer: { name: '', email: '' } });
  const pollRef = useRef(null);
  const [filterType, setFilterType] = useState('all'); // all | provider_contract | image_rights | terms_conditions
  const [filterSig, setFilterSig] = useState('all');   // all | none | requested | completed | declined

  // Legal requirements UI state
  const [legalType, setLegalType] = useState('civil'); // 'civil' | 'iglesia'
  const [legalProgress, setLegalProgress] = useState({});
  const [uploadingReq, setUploadingReq] = useState({}); // { key: boolean }
  const templatesForSelection = useMemo(() => {
    const byRegion = DOWNLOAD_TEMPLATES[form.region] || DOWNLOAD_TEMPLATES.ES;
    return byRegion[legalType] || [];
  }, [form.region, legalType]);

  const typeCounts = useMemo(() => {
    const counts = { provider_contract: 0, image_rights: 0, terms_conditions: 0 };
    (docs || []).forEach((d) => {
      const t = d?.meta?.type || d?.type;
      if (t && Object.prototype.hasOwnProperty.call(counts, t)) counts[t]++;
    });
    return counts;
  }, [docs]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!activeWedding) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Load legal requirements progress
        const lp = loadLegalProgress(activeWedding);
        if (mounted) setLegalProgress(lp);

        // Load templates (best-effort)
        try {
          const tpls = await listTemplates();
          if (mounted && Array.isArray(tpls) && tpls.length) {
            // Map to our expected shape when possible
            const mapped = tpls.map((t) => {
              const Icon = t.id === 'provider_contract' ? FileText : t.id === 'image_rights' ? Camera : Shield;
              return { id: t.id, name: t.name || t.title || t.id, icon: Icon };
            });
            setTemplates(mapped);
          }
        } catch (_) {
          // Ignore and keep defaults
        }

        // Load existing documents (backend first, fallback to local)
        try {
          const list = await listDocuments(activeWedding, 50);
          if (mounted) setDocs(Array.isArray(list) ? list : []);
        } catch (err) {
          console.warn('[DocumentosLegales] backend list failed, using local fallback');
          const local = loadLocalDocs(activeWedding);
          if (mounted) setDocs(local);
        }
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los datos');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeWedding]);

  // Prefill support when navigating from Proveedor u otras pantallas
  useEffect(() => {
    const pf = location?.state?.prefill;
    if (pf) {
      setForm((f) => ({ ...f, ...pf }));
      setCreating(true);
      // limpiar state para evitar reapertura al volver
      try {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } catch (_) {}
    }
  }, [location?.state]);

  async function handleCreate(e) {
    e?.preventDefault?.();
    if (!activeWedding) return;
    if (!form.title?.trim()) return;
    setCreating(true);
    try {
      let created;
      try {
        // Build payload with dynamic fields per type
        const payload = { type: form.type, title: form.title };
        if (form.type === 'provider_contract') {
          payload.providerName = form.providerName || '';
          payload.service = form.service || '';
          payload.eventDate = form.eventDate || '';
          payload.amount = form.amount || '';
          payload.clauses = form.clauses || [];
          payload.customClauses = form.customClauses || '';
        } else if (form.type === 'image_rights') {
          payload.participant = {
            name: form.participantName || '',
            dni: form.participantDni || '',
            relationship: form.participantRel || '',
            isMinor: !!form.participantMinor,
          };
          payload.consents = {
            socialMedia: !!form.consentSocial,
            portfolio: !!form.consentPortfolio,
            commercial: !!form.consentCommercial,
          };
        } else if (form.type === 'terms_conditions') {
          payload.sections = {
            liability: !!form.tcLiability,
            cancellation: !!form.tcCancellation,
            facilities: !!form.tcFacilities,
            guests: !!form.tcGuests,
            gdpr: !!form.tcGdpr,
            forceMajeure: !!form.tcForceMajeure,
          };
        }
        payload.region = form.region || 'ES';
        created = await generateDocument(activeWedding, payload, { saveMeta: true });
      } catch (err) {
        // Fallback to local document
        const id = `local_${Date.now()}`;
        const meta = { title: form.title, type: form.type };
        const fakePdf = btoa(`PDF placeholder for ${form.title} (${form.type})`);
        created = { id, pdfBase64: fakePdf, meta, type: form.type, createdAt: Date.now() };
        const localNext = saveLocalDoc(activeWedding, created);
        setDocs(localNext);
      }
      if (created && created.id) {
        // If backend path: prepend to list
        if (!created.local) setDocs((prev) => [created, ...prev]);
        setForm({ type: 'provider_contract', title: '', region: form.region || 'ES' });
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleRequestSignature() {
    if (!activeWedding || !signModal.doc) return;
    const doc = signModal.doc;
    const signer = signModal.signer;
    try {
      if (!requestSignature) {
        const mod = await import('../../services/DigitalSignatureService');
        requestSignature = mod.createRequest || mod.requestSignature || mod.default;
      }
      await requestSignature({
        documentId: doc.id,
        signers: [{ name: signer.name, email: signer.email, role: 'client' }],
        settings: { reminderFrequency: 3, expirationDays: 30, requireAllSigners: true },
      });
      // optimistic UI update
      setDocs((prev) => prev.map((d) => {
        if (d.id !== doc.id) return d;
        return {
          ...d,
          meta: {
            ...(d.meta || {}),
            signature: { status: 'requested', signers: [signer], requestedAt: Date.now() }
          }
        };
      }));
    } catch (_) {
      // local fallback
      const next = updateLocalDoc(activeWedding, doc.id, (d) => ({ meta: { ...(d.meta || {}), signature: { status: 'requested', signers: [signer], requestedAt: Date.now() } } }));
      setDocs(next);
    } finally {
      setSignModal({ open: false, doc: null, signer: { name: '', email: '' } });
    }
  }

  const actionButtons = (
    <button
      onClick={() => setCreating((v) => (v ? v : true))}
      className="bg-blue-600 text-white px-3 py-2 rounded inline-flex items-center gap-1"
    >
      <Plus size={16} /> Nuevo Documento
    </button>
  );

  // Polling para estado de firmas
  useEffect(() => {
    const pending = (docs || []).filter((d) => d?.meta?.signature && ['requested', 'pending', 'sent'].includes(d.meta.signature.status));
    if (pending.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) return; // ya activo
    pollRef.current = setInterval(async () => {
      try {
        for (const d of pending) {
          try {
            const res = await import('../../services/DigitalSignatureService');
            const data = await res.getStatus(d.id);
            if (data) {
              setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, meta: { ...(x.meta || {}), signature: data.signature || { status: data.status || x?.meta?.signature?.status } } } : x)));
            }
          } catch (_) {}
        }
      } catch (_) {}
    }, 15000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [docs]);

  return (
    <PageWrapper title="Documentos" actions={actionButtons}>
      {!activeWedding && (
        <Card className="p-6">
          <p className="text-gray-700">Selecciona una boda activa para gestionar documentos.</p>
        </Card>
      )}

      {activeWedding && (
        <>
          {/* Guía de registro legal (informativa) */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Requisitos para registrar la boda</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-gray-600">Tipo:</label>
                <div className="inline-flex rounded overflow-hidden border">
                  <button
                    className={`${legalType==='civil' ? 'bg-blue-600 text-white' : 'bg-white'} px-3 py-1 text-sm`}
                    onClick={() => setLegalType('civil')}
                  >Civil / Juzgado</button>
                  <button
                    className={`${legalType==='iglesia' ? 'bg-blue-600 text-white' : 'bg-white'} px-3 py-1 text-sm`}
                    onClick={() => setLegalType('iglesia')}
                  >Iglesia</button>
                </div>
                <label className="text-sm text-gray-600 ml-2">País:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={form.region || 'ES'}
                  onChange={(e)=> setForm((f)=>({ ...f, region: e.target.value }))}
                >
                  <option value="ES">España</option>
                  <option value="FR">Francia</option>
                  <option value="US">Estados Unidos</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Esta lista es orientativa y puede variar según municipio, Registro Civil o diócesis. Confirma siempre con tu oficina/parroquia.
            </p>
            <div className="space-y-2">
              {(LEGAL_REQUIREMENTS[form.region] || LEGAL_REQUIREMENTS.ES)[legalType].map((item, idx) => {
                // Key per wedding + region + type + item
                const key = `${form.region}.${legalType}.${item}`;
                const entry = legalProgress[key];
                const checked = typeof entry === 'object' ? !!entry.done : !!entry;
                const fileMeta = typeof entry === 'object' ? entry.file : null;
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e)=>{
                          const next = { ...(legalProgress || {}) };
                          const prev = next[key];
                          if (e.target.checked) {
                            next[key] = typeof prev === 'object' ? { ...prev, done: true } : true;
                          } else {
                            if (typeof prev === 'object' && prev.file) {
                              next[key] = { ...prev, done: false };
                            } else {
                              delete next[key];
                            }
                          }
                          setLegalProgress(next);
                          saveLegalProgress(activeWedding, next);
                        }}
                      />
                      <span>{item}</span>
                    </label>
                    <div className="pl-6 flex items-center gap-2 text-xs text-gray-600">
                      <input
                        id={`file-${idx}`}
                        type="file"
                        className="hidden"
                        onChange={async (e)=>{
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          const upKey = key;
                          setUploadingReq((u)=>({ ...u, [upKey]: true }));
                          try {
                            const uploaded = await uploadEmailAttachments([f], activeWedding || 'anon', 'legal-requirements');
                            const meta = Array.isArray(uploaded) && uploaded[0] ? uploaded[0] : { filename: f.name, size: f.size };
                            const next = { ...(legalProgress || {}) };
                            const prev = next[upKey];
                            next[upKey] = typeof prev === 'object' ? { ...prev, done: true, file: meta } : { done: true, file: meta };
                            setLegalProgress(next);
                            saveLegalProgress(activeWedding, next);
                          } catch (err) {
                            console.warn('Upload requirement failed', err);
                          } finally {
                            setUploadingReq((u)=>({ ...u, [upKey]: false }));
                            // reset input
                            e.target.value = '';
                          }
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label htmlFor={`file-${idx}`} className="px-2 py-1 border rounded cursor-pointer hover:bg-gray-50">
                        {uploadingReq[key] ? 'Subiendo...' : (fileMeta ? 'Reemplazar archivo' : 'Subir archivo')}
                      </label>
                      {fileMeta && (
                        <>
                          <a href={fileMeta.url} target="_blank" rel="noreferrer" className="underline">Ver</a>
                          <button className="text-red-600" onClick={() => {
                            const next = { ...(legalProgress || {}) };
                            const prev = next[key];
                            if (typeof prev === 'object') {
                              delete prev.file; // no borramos del storage, solo quitamos referencia
                              next[key] = { ...prev };
                            }
                            setLegalProgress(next);
                            saveLegalProgress(activeWedding, next);
                          }}>Quitar</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Descargables */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Descargables</h2>
              <div className="text-sm text-gray-600">{form.region === 'ES' ? 'España' : form.region}</div>
            </div>
            {templatesForSelection.length === 0 && (
              <p className="text-gray-600 text-sm">No hay descargables para la selección actual.</p>
            )}
            {templatesForSelection.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templatesForSelection.map((tpl) => (
                  <div key={tpl.id} className="border rounded-lg p-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="font-medium">{tpl.title}</div>
                      {tpl.desc && <div className="text-xs text-gray-600">{tpl.desc}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={() => {
                          const data = buildTemplatePrefill(weddingInfo);
                          const html = generateTemplateHTML(tpl.id, form.region, data);
                          downloadAsDoc(tpl.title.replace(/\s+/g,'_'), html);
                        }}
                      >
                        <Download size={16} /> .DOC
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={() => {
                          const data = buildTemplatePrefill(weddingInfo);
                          const html = generateTemplateHTML(tpl.id, form.region, data);
                          downloadAsPdf(tpl.title.replace(/\s+/g,'_'), html);
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

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generadores Rápidos</h2>
              <button
                onClick={() => {
                  // Force refresh list (backend or local)
                  if (!activeWedding) return;
                  setLoading(true);
                  setError(null);
                  listDocuments(activeWedding, 50)
                    .then((list) => setDocs(Array.isArray(list) ? list : []))
                    .catch(() => setDocs(loadLocalDocs(activeWedding)))
                    .finally(() => setLoading(false));
                }}
                className="text-sm px-2 py-1 rounded border inline-flex items-center gap-1"
              >
                <RefreshCw size={14} /> Refrescar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <DocumentTypeCard
                  key={tpl.id}
                  title={tpl.name}
                  description={tpl.id === 'provider_contract' ? 'Contratos estándar para proveedores (catering, fotografía, música, ...)'
                    : tpl.id === 'image_rights' ? 'Autorización para uso de imágenes y videos'
                    : 'Términos y condiciones personalizados'}
                  Icon={tpl.icon || FileText}
                  count={typeCounts[tpl.id] || 0}
                  onCreate={() => {
                    setForm((f) => ({ ...f, type: tpl.id }));
                    setCreating(true);
                  }}
                />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mis Documentos</h2>
              {loading && <Spinner />}
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={filterType} onChange={(e)=>setFilterType(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="all">Todos los tipos</option>
                <option value="provider_contract">Contratos proveedor</option>
                <option value="image_rights">Cesión de imagen</option>
                <option value="terms_conditions">Términos y Condiciones</option>
              </select>
              <select value={filterSig} onChange={(e)=>setFilterSig(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="all">Todas las firmas</option>
                <option value="none">Sin solicitud</option>
                <option value="requested">Solicitud enviada</option>
                <option value="completed">Completada</option>
                <option value="declined">Rechazada</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            {!loading && docs.length === 0 && (
              <p className="text-gray-600">Aún no hay documentos generados.</p>
            )}
            {docs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">Título</th>
                      <th className="py-2 pr-2">Tipo</th>
                      <th className="py-2 pr-2">Fecha</th>
                      <th className="py-2 pr-2">Firma</th>
                      <th className="py-2 pr-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs
                      .filter((d)=>{
                        const t = (d.meta?.type || d.type || '').toString();
                        if (filterType !== 'all' && t !== filterType) return false;
                        const sig = d.meta?.signature?.status;
                        if (filterSig === 'none' && sig) return false;
                        if (['requested','completed','declined'].includes(filterSig) && sig !== filterSig) return false;
                        return true;
                      })
                      .map((d) => {
                      const meta = d.meta || {};
                      const title = meta.title || d.title || '(sin título)';
                      const type = meta.type || d.type || '-';
                      const date = d.createdAt ? new Date(d.createdAt) : (d.createdAt? new Date(d.createdAt): new Date());
                      const when = isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                      const href = d.pdfBase64 ? `data:application/pdf;base64,${d.pdfBase64}` : (d.url || '#');
                      const sig = meta.signature;
                      return (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="py-2 pr-2">{title}</td>
                          <td className="py-2 pr-2 capitalize">{type.replace('_', ' ')}</td>
                          <td className="py-2 pr-2">{when}</td>
                          <td className="py-2 pr-2">
                            {sig ? (
                              <span
                                className={
                                  `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ` +
                                  (sig.status === 'completed' ? 'bg-green-100 text-green-800' : sig.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
                                }
                              >
                                {sig.status === 'requested' ? 'Solicitud enviada' : (sig.status || 'pendiente')}
                              </span>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 px-2 py-1 border rounded"
                                onClick={() => setSignModal({ open: true, doc: d, signer: { name: '', email: '' } })}
                              >
                                <Send size={14} /> Solicitar firma
                              </button>
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            <div className="flex justify-end gap-2">
                              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 border rounded">
                                <Eye size={14} /> Ver
                              </a>
                              {d.pdfBase64 && (
                                <a href={href} download={`${title}.pdf`} className="inline-flex items-center gap-1 px-2 py-1 border rounded">
                                  <Download size={14} /> Descargar
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {creating && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Nuevo Documento</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Región</label>
                    <select
                      value={form.region || 'ES'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => {
                          // Si no hay cláusulas seleccionadas y el tipo es contrato, aplicar por defecto las de región
                          const next = { ...f, region: val };
                          if ((f.type === 'provider_contract') && (!f.clauses || f.clauses.length === 0)) {
                            next.clauses = REGIONAL_TEMPLATES[val]?.standardClauses || [];
                          }
                          return next;
                        });
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      {Object.entries(REGIONAL_TEMPLATES).map(([k, v]) => (
                        <option key={k} value={k}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Ej. Contrato de Catering"
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  {/* Campos dinámicos por tipo */}
                  {form.type === 'provider_contract' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Proveedor</label>
                        <input className="w-full border rounded px-3 py-2" value={form.providerName || ''} onChange={(e)=>setForm((f)=>({...f, providerName: e.target.value}))} placeholder="Nombre del proveedor" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Servicio</label>
                        <input className="w-full border rounded px-3 py-2" value={form.service || ''} onChange={(e)=>setForm((f)=>({...f, service: e.target.value}))} placeholder="Ej. Catering, Fotografía" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Fecha del evento</label>
                          <input type="date" className="w-full border rounded px-3 py-2" value={form.eventDate || ''} onChange={(e)=>setForm((f)=>({...f, eventDate: e.target.value}))} />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Importe total</label>
                          <input type="number" min="0" step="0.01" className="w-full border rounded px-3 py-2" value={form.amount || ''} onChange={(e)=>setForm((f)=>({...f, amount: e.target.value}))} placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Cláusulas estándar ({REGIONAL_TEMPLATES[form.region || 'ES']?.name || 'General'})</div>
                        <div className="flex flex-col gap-1">
                          {(REGIONAL_TEMPLATES[form.region || 'ES']?.standardClauses || ['gdpr_compliance','liability_limitation','force_majeure']).map((c)=> (
                            <label key={c} className="inline-flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={(form.clauses||[]).includes(c)} onChange={(e)=>{
                                const set = new Set(form.clauses||[]);
                                if(e.target.checked) set.add(c); else set.delete(c);
                                setForm((f)=>({...f, clauses: Array.from(set)}));
                              }} /> {c.replace('_',' ')}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Cláusulas adicionales</label>
                        <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.customClauses || ''} onChange={(e)=>setForm((f)=>({...f, customClauses: e.target.value}))} placeholder="Texto libre para cláusulas personalizadas" />
                      </div>
                    </div>
                  )}
                  {form.type === 'image_rights' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Nombre participante</label>
                          <input className="w-full border rounded px-3 py-2" value={form.participantName || ''} onChange={(e)=>setForm((f)=>({...f, participantName: e.target.value}))} />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">DNI</label>
                          <input className="w-full border rounded px-3 py-2" value={form.participantDni || ''} onChange={(e)=>setForm((f)=>({...f, participantDni: e.target.value}))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Relación</label>
                          <input className="w-full border rounded px-3 py-2" value={form.participantRel || ''} onChange={(e)=>setForm((f)=>({...f, participantRel: e.target.value}))} placeholder="Invitado, Proveedor, etc." />
                        </div>
                        <label className="inline-flex items-center gap-2 self-end">
                          <input type="checkbox" checked={!!form.participantMinor} onChange={(e)=>setForm((f)=>({...f, participantMinor: e.target.checked}))} /> Menor de edad
                        </label>
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Consentimientos</div>
                        <div className="flex flex-col gap-1">
                          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.consentSocial} onChange={(e)=>setForm((f)=>({...f, consentSocial: e.target.checked}))} /> Redes sociales</label>
                          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.consentPortfolio} onChange={(e)=>setForm((f)=>({...f, consentPortfolio: e.target.checked}))} /> Portfolio</label>
                          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.consentCommercial} onChange={(e)=>setForm((f)=>({...f, consentCommercial: e.target.checked}))} /> Uso comercial</label>
                        </div>
                      </div>
                    </div>
                  )}
                  {form.type === 'terms_conditions' && (
                    <div className="space-y-2">
                      {[
                        ['tcLiability','Responsabilidad civil'],
                        ['tcCancellation','Política de cancelación'],
                        ['tcFacilities','Uso de instalaciones'],
                        ['tcGuests','Comportamiento de invitados'],
                        ['tcGdpr','Protección de datos (GDPR)'],
                        ['tcForceMajeure','Fuerza mayor'],
                      ].map(([key,label]) => (
                        <label key={key} className="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={!!form[key]} onChange={(e)=>setForm((f)=>({...f, [key]: e.target.checked}))} /> {label}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 rounded border">Cancelar</button>
                    <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={!form.title?.trim()}>
                      Crear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {signModal.open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Solicitar firma</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Nombre</label>
                    <input className="w-full border rounded px-3 py-2" value={signModal.signer.name} onChange={(e)=>setSignModal((s)=>({...s, signer: {...s.signer, name: e.target.value}}))} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border rounded px-3 py-2" value={signModal.signer.email} onChange={(e)=>setSignModal((s)=>({...s, signer: {...s.signer, email: e.target.value}}))} />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="px-3 py-2 rounded border" onClick={()=>setSignModal({ open:false, doc:null, signer:{name:'',email:''}})}>Cancelar</button>
                    <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={!signModal.signer.name || !signModal.signer.email} onClick={handleRequestSignature}>Enviar solicitud</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}

