import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Camera, Shield, Plus, Eye, Download, RefreshCw, Send } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { useWedding } from '../../context/WeddingContext';
import { listTemplates, generateDocument, listDocuments } from '../../services/LegalDocsService';
import { createRequest as requestSignature } from '../../services/DigitalSignatureService';

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
function updateLocalDoc(weddingId, docId, updater) {
  const curr = loadLocalDocs(weddingId);
  const next = curr.map((d) => (d.id === docId ? { ...d, ...updater(d) } : d));
  localStorage.setItem(LS_KEY(weddingId), JSON.stringify(next));
  return next;
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

  const typeCounts = useMemo(() => {
    const counts = { provider_contract: 0, image_rights: 0, terms_conditions: 0 };
    (docs || []).forEach((d) => {
      const t = d?.meta?.type || d?.type;
      if (t && counts.hasOwnProperty(t)) counts[t]++;
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
    <PageWrapper title="Documentos Legales" actions={actionButtons}>
      {!activeWedding && (
        <Card className="p-6">
          <p className="text-gray-700">Selecciona una boda activa para gestionar documentos.</p>
        </Card>
      )}

      {activeWedding && (
        <>
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
