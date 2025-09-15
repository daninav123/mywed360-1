import { useEffect, useState, useRef, useCallback } from 'react';
import { get as apiGet, post as apiPost } from '../services/apiClient';
import { getUserFolders, createFolder, assignEmailToFolder } from '../services/folderService';
import { getUserTags, createTag, addTagToEmail } from '../services/tagService';

export default function EmailInsights({ mailId, userId, email }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState(null);
  const [applying, setApplying] = useState(false);
  // Para evitar despachar varias veces la misma Reunión
  const dispatchedRef = useRef(false);

  useEffect(() => {
    if (!mailId) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/api/email-insights/${mailId}`, { auth: true });
        const json = await res.json();
        if (!ignore) setInsights(json);
      } catch (err) {
        console.error('Error obteniendo insights:', err);
        if (!ignore) setInsights(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [mailId]);

  // Si no hay insights y hay clave OpenAI en cliente, intentar análisis automático una vez
  useEffect(() => {
    try {
      if (!mailId) return;
      if (insights && Object.keys(insights).length > 0) return;
      const hasKey = !!import.meta.env.VITE_OPENAI_API_KEY;
      if (!hasKey) return;
      // Evita bucle: lanzar una sola vez
      if (!analyzing) analyzeNow();
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailId, insights]);

  const analyzeNow = useCallback(async () => {
    if (!mailId || analyzing) return;
    setAnalyzing(true);
    try {
      await apiPost('/api/email-insights/analyze', { mailId }, { auth: true });
      // Refrescar insights tras analizar
      const res = await apiGet(`/api/email-insights/${mailId}`, { auth: true });
      const json = await res.json();
      setInsights(json);
    } catch (err) {
      console.error('Error analizando:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [mailId, analyzing]);

  // Clasificación local simple (heurística)
  const classifyLocal = useCallback(() => {
    try {
      const text = `${email?.subject || ''} \n ${email?.body || ''}`.toLowerCase();
      const tags = [];
      let folder = null;
      if (/presupuesto|budget|factura|pago/.test(text)) { tags.push('Presupuesto'); folder = folder || 'Finanzas'; }
      if (/contrato|firma|acuerdo/.test(text)) { tags.push('Contrato'); folder = folder || 'Contratos'; }
      if (/fot[oó]grafo|catering|m[úu]sica|dj|flor/i.test(text)) { tags.push('Proveedor'); folder = folder || 'Proveedores'; }
      if (/invitaci[óo]n|rsvp|confirmaci[óo]n/.test(text)) { tags.push('Invitación'); folder = folder || 'RSVP'; }
      return { tags: Array.from(new Set(tags)), folder };
    } catch { return { tags: [], folder: null }; }
  }, [email]);

  useEffect(() => {
    if (!email) return;
    setClassification(classifyLocal());
  }, [email, classifyLocal]);

  const applyClassification = useCallback(() => {
    if (!userId || !mailId || !classification) return;
    setApplying(true);
    try {
      if (classification.folder) {
        const existing = getUserFolders(userId);
        let folder = existing.find(f => f.name.toLowerCase() === classification.folder.toLowerCase());
        if (!folder) {
          folder = createFolder(userId, classification.folder);
        }
        if (folder?.id) assignEmailToFolder(userId, mailId, folder.id);
      }
      if (classification.tags && classification.tags.length) {
        const allTags = getUserTags(userId);
        classification.tags.forEach(tagName => {
          let tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase() || t.id === tagName);
          if (!tag) { try { tag = createTag(userId, tagName); } catch {} }
          if (tag?.id) { try { addTagToEmail(userId, mailId, tag.id); } catch {} }
        });
      }
    } finally { setApplying(false); }
  }, [userId, mailId, classification]);

  // Despachar Reuniónes solo una vez cuando se reciban
  useEffect(() => {
  if (!insights || dispatchedRef.current) return;
  if (insights.meetings && insights.meetings.length > 0) {
    insights.meetings.forEach(m => {
      try {
        const start = m.start || m.date || m.when;
        if (!start) return;
        const startDate = new Date(start);
        if (isNaN(startDate.getTime())) return;
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        const meeting = {
          title: m.title || 'Reunión',
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        window.dispatchEvent(new CustomEvent('lovenda-tasks', { detail: { meeting } }));
      } catch (err) {
        console.warn('No se pudo despachar Reunión:', err);
      }
    });
  }
  dispatchedRef.current = true;
}, [insights]);

  if (!mailId) return null;
  if (loading) return <p className="text-sm text-gray-500">Cargando IA…</p>;
  if (!insights || Object.keys(insights).length === 0)
    return (
      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-gray-500 mb-2">Sin acciones detectadas.</p>
        <button
          onClick={analyzeNow}
          disabled={analyzing}
          className={`text-sm rounded border px-3 py-1 ${analyzing ? 'opacity-60' : 'hover:bg-gray-50'}`}
        >
          {analyzing ? 'Analizando…' : 'Analizar ahora'}
        </button>
        {classification && (classification.tags?.length || classification.folder) && (
          <div className="mt-3 text-xs text-gray-700">
            <div>Sugerencias de clasificación:</div>
            {classification.folder && <div>Carpeta: <span className="font-medium">{classification.folder}</span></div>}
            {classification.tags?.length > 0 && <div>Tags: {classification.tags.join(', ')}</div>}
            {userId && (
              <button
                onClick={applyClassification}
                disabled={applying}
                className={`mt-2 text-xs rounded border px-2 py-1 ${applying ? 'opacity-60' : 'hover:bg-gray-50'}`}
              >
                {applying ? 'Aplicando…' : 'Aplicar sugerencias'}
              </button>
            )}
          </div>
        )}
      </div>
    );

  const { tasks = [], meetings = [], budgets = [], contracts = [] } = insights;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-sm font-semibold mb-2">Acciones sugeridas por IA</h3>

      {tasks.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Tareas</h4>
          <ul className="list-disc list-inside text-sm">
            {tasks.map((t, i) => (
              <li key={i}>{t.title} {t.due && `(para ${t.due})`}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Acciones rápidas */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => {
            try {
              const defaultTitle = (tasks && tasks[0]?.title) || (email?.subject ? `Tarea: ${email.subject}` : 'Tarea de email');
              const title = prompt('Título de la tarea', defaultTitle);
              if (!title) return;
              const task = { title, due: tasks && tasks[0]?.due ? tasks[0].due : null };
              window.dispatchEvent(new CustomEvent('lovenda-tasks', { detail: { task } }));
            } catch (_) {}
          }}
        >Crear tarea</button>
        <button
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => {
            try {
              let startIso = null;
              if (meetings && meetings[0]) {
                const s = meetings[0].start || meetings[0].date || meetings[0].when;
                const d = s ? new Date(s) : null;
                startIso = d && !isNaN(d.getTime()) ? d.toISOString() : null;
              }
              if (!startIso) {
                const now = new Date();
                startIso = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
              }
              const endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
              const meeting = { title: email?.subject ? `Reunión: ${email.subject}` : 'Reunión', start: startIso, end: endIso };
              window.dispatchEvent(new CustomEvent('lovenda-tasks', { detail: { meeting } }));
            } catch (_) {}
          }}
        >Añadir Reunión</button>
      </div>

      {meetings.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Reuniónes</h4>
          <ul className="list-disc list-inside text-sm">
            {meetings.map((m, i) => (
              <li key={i}>{m.title} â€” {m.date}</li>
            ))}
          </ul>
        </section>
      )}

      {budgets.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Presupuestos</h4>
          <ul className="list-disc list-inside text-sm">
            {budgets.map((b, i) => (
              <li key={i}>{b.client}: {b.amount} {b.currency || 'EUR'}</li>
            ))}
          </ul>
        </section>
      )}

      {contracts.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Contratos</h4>
          <ul className="list-disc list-inside text-sm">
            {contracts.map((c, i) => (
              <li key={i}>{c.party} â€” {c.type} ({c.action})</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}




