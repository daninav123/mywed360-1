import { Search, Eye, Download, Save, Copy, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Card from '../components/ui/Card';
import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import useGuests from '../hooks/useGuests';
import * as EmailService from '../services/emailService';
import { generateRsvpLink } from '../services/rsvpService';
import { post as apiPost } from '../services/apiClient';
import { saveData, loadData } from '../services/SyncService';
import { invitationTemplates } from '../data/invitationTemplates';
import sanitizeHtml from '../utils/sanitizeHtml';

export default function Invitaciones() {
  const { activeWedding } = useWedding();
  const { info: weddingInfo } = useActiveWeddingInfo();
  const { guests } = useGuests();

  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    setToast(null);
    try {
      const allowDirect =
        import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true' || import.meta.env.DEV;
      if (!allowDirect) throw new Error('OpenAI directo deshabilitado por configuraciÃ³n');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant specialized in generating invitation texts.',
            },
            { role: 'user', content: aiPrompt },
          ],
        }),
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setGeneratedText(text);
      setToast({ message: 'InvitaciÃ³n generada', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error generando invitaciÃ³n', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveDraft = async () => {
    const draft = { aiPrompt, panel, filterCategory, filterColor, filterFont, step, generatedText };
    await saveData('invitationDraft', draft, {
      collection: 'userInvitations',
      showNotification: true,
    });
    setToast({ message: 'Borrador guardado', type: 'success' });
  };
  const handleDuplicateDesign = async () => {
    const draftKey = `invitationDraft_${Date.now()}`;
    const data = { aiPrompt, panel, filterCategory, filterColor, filterFont, step, generatedText };
    await saveData(draftKey, data, {
      collection: 'userInvitations',
      showNotification: false,
    });
    setToast({ message: 'DiseÃ±o duplicado', type: 'success' });
  };
  const [panel, setPanel] = useState('invitation'); // 'invitation' o 'envelope'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterFont, setFilterFont] = useState('');
  const [step, setStep] = useState(1);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [subject, setSubject] = useState('Invitación a nuestra boda');

  // Carga inicial asÃ­ncrona de borrador/preferencias
  useEffect(() => {
    (async () => {
      try {
        const [p, pnl, fc, fcol, ff, st, gen, prev] = await Promise.all([
          loadData('invitationAiPrompt', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationPanel', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationFilterCategory', {
            collection: 'userInvitations',
            fallbackToLocal: true,
          }),
          loadData('invitationFilterColor', {
            collection: 'userInvitations',
            fallbackToLocal: true,
          }),
          loadData('invitationFilterFont', {
            collection: 'userInvitations',
            fallbackToLocal: true,
          }),
          loadData('invitationStep', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationGeneratedText', {
            collection: 'userInvitations',
            fallbackToLocal: true,
          }),
          loadData('invitationShowPreview', {
            collection: 'userInvitations',
            fallbackToLocal: true,
          }),
        ]);
        if (typeof p === 'string') setAiPrompt(p);
        if (pnl) setPanel(pnl);
        if (typeof fc === 'string') setFilterCategory(fc);
        if (typeof fcol === 'string') setFilterColor(fcol);
        if (typeof ff === 'string') setFilterFont(ff);
        const stNum = parseInt(st, 10);
        if (!isNaN(stNum) && stNum >= 1 && stNum <= 4) setStep(stNum);
        if (typeof gen === 'string') setGeneratedText(gen);
        if (typeof prev === 'boolean') setShowPreview(prev);
      } catch {}
    })();
  }, []);

  // Plantillas
  const templates = invitationTemplates;
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || 'classic');
  const [previewGuestId, setPreviewGuestId] = useState('');
  const [previewRsvpLink, setPreviewRsvpLink] = useState('');
  const filtered = templates.filter(
    (t) =>
      (filterCategory ? t.category === filterCategory : true) &&
      (filterColor ? t.color === filterColor : true) &&
      (filterFont ? t.font === filterFont : true)
  );
  // Persistencia silenciosa por campo
  useEffect(() => {
    saveData('invitationAiPrompt', aiPrompt, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [aiPrompt]);
  useEffect(() => {
    saveData('invitationPanel', panel, { collection: 'userInvitations', showNotification: false });
  }, [panel]);
  useEffect(() => {
    saveData('invitationFilterCategory', filterCategory, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [filterCategory]);
  useEffect(() => {
    saveData('invitationFilterColor', filterColor, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [filterColor]);
  useEffect(() => {
    saveData('invitationFilterFont', filterFont, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [filterFont]);
  useEffect(() => {
    saveData('invitationStep', String(step), {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [step]);
  useEffect(() => {
    saveData('invitationGeneratedText', generatedText, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [generatedText]);
  useEffect(() => {
    saveData('invitationShowPreview', showPreview, {
      collection: 'userInvitations',
      showNotification: false,
    });
  }, [showPreview]);

  // Indicador de sincronizaciÃ³n  return (
    <Card className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-2xl font-semibold">DiseÃ±o de Invitaciones</h1>
      <div className="flex justify-between mb-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="bg-gray-200 px-3 py-1 rounded">
            Anterior
          </button>
        )}
        {step < 4 && (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Siguiente
          </button>
        )}
        {step === 4 && (
          <button
            onClick={() => alert('Wizard completado')}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Finalizar
          </button>
        )}
      </div>

      {/* Asistente de IA */}
      {step === 1 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Asistente de IA</h2>
          <textarea
            rows={3}
            placeholder="Describe cÃ³mo quieres tu invitaciÃ³n..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleAiGenerate}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center"
          >
            {loading ? <Spinner size={16} className="mr-2" /> : <Zap size={16} className="mr-2" />}{' '}
            {loading ? 'Generando...' : 'Generar invitaciÃ³n'}
          </button>
        </section>
      )}

      {/* SelecciÃ³n de Plantilla */}
      {step === 2 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">SelecciÃ³n de Plantilla</h2>
          <div className="flex gap-4 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Todos los estilos</option>
              <option value="clÃ¡sico">ClÃ¡sico</option>
              <option value="moderno">Moderno</option>
              <option value="rÃºstico">RÃºstico</option>
              <option value="minimalista">Minimalista</option>
            </select>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Todas las paletas</option>
              <option value="pastel">Pastel</option>
              <option value="vibrante">Vibrante</option>
              <option value="tierra">Tierra</option>
              <option value="monocromo">Monocromo</option>
            </select>
            <select
              value={filterFont}
              onChange={(e) => setFilterFont(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Todas las tipografÃ­as</option>
              <option value="Serif">Serif</option>
              <option value="Sans">Sans</option>
              <option value="Handwriting">Handwriting</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`border rounded overflow-hidden cursor-pointer hover:shadow-lg ${selectedTemplateId === t.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editor InvitaciÃ³n/Sobre */}
      {step === 3 && (
        <section className="border rounded p-4 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setPanel('invitation')}
              className={`px-4 py-2 rounded ${panel === 'invitation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              InvitaciÃ³n
            </button>
            <button
              onClick={() => setPanel('envelope')}
              className={`px-4 py-2 rounded ${panel === 'envelope' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Sobre
            </button>
          </div>
          <div className="border bg-surface h-[400px] flex items-center justify-center text-gray-400">
            {panel === 'invitation'
              ? 'Canvas de invitaciÃ³n: arrastra componentes aquÃ­'
              : 'Canvas de sobre: frontal / trasero'}
          </div>
        </section>
      )}

      {/* Preview y Exportación */}
      {step === 4 && (
        <section className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPreview((prev) => !prev)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <Eye size={16} className="mr-2" />
            {showPreview ? 'Ocultar preview' : 'Previsualizar'}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center">
            <Download size={16} className="mr-2" />
            Exportar PDF
          </button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center">
            <Download size={16} className="mr-2" />
            Exportar PNG
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded">Compartir</button>
        </section>
      )}

      {step === 4 && (
        <section className="border rounded p-4 space-y-3 mt-3">
          <h2 className="text-lg font-semibold">Envío</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm">
              Asunto
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="block w-full border rounded px-2 py-1 mt-1"
                placeholder="Asunto del correo"
              />
            </label>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              disabled={sendingTest}
              onClick={async () => {
                try {
                  const to = typeof window !== 'undefined' ? window.prompt('Email de prueba:', '') : '';
                  if (!to) return;
                  setSendingTest(true);
                  const html = `
                    <div style="font-family:Arial, sans-serif; line-height:1.6">
                      <h2 style="margin:0 0 12px 0">${subject || 'Invitación a nuestra boda'}</h2>
                      <p>${(generatedText || '').replace(/\n/g, '<br/>')}</p>
                    </div>`;
                  await EmailService.sendMail({ to, subject: subject || 'Invitación a nuestra boda', body: html });
                  setToast({ message: 'Enviado email de prueba', type: 'success' });
                } catch (e) {
                  setToast({ message: 'No se pudo enviar la prueba', type: 'error' });
                } finally {
                  setSendingTest(false);
                }
              }}
              className="bg-indigo-600 text-white px-3 py-1 rounded"
            >
              {sendingTest ? 'Enviando…' : 'Enviar prueba'}
            </button>
            <button
              disabled={!activeWedding || sendingBulk}
              onClick={async () => {
                try {
                  const localGuests = (guests || []).filter(Boolean);
                  if (!localGuests.length) {
                    setToast({ message: 'No hay invitados cargados', type: 'info' });
                    return;
                  }
                  const pending = localGuests.filter((g) => {
                    const s = String(g.status || '').toLowerCase();
                    return (
                      (!s || s === 'pending') &&
                      !(s === 'confirmed' || s === 'accepted') &&
                      !(s === 'declined' || s === 'rejected') &&
                      g.email
                    );
                  });
                  if (!pending.length) {
                    setToast({ message: 'No hay pendientes con email', type: 'info' });
                    return;
                  }
                  const ok = typeof window !== 'undefined' ? window.confirm(`Enviar invitación a ${pending.length} pendientes con enlace RSVP?`) : true;
                  if (!ok) return;
                  setSendingBulk(true);
                  let sent = 0, failed = 0;
                  for (const g of pending.slice(0, 100)) { // límite de seguridad
                    try {
                      const res = await generateRsvpLink({ weddingId: activeWedding, guestId: g.id });
                      const link = res?.link || '';
                      const html = `
                        <div style="font-family:Arial, sans-serif; line-height:1.6">
                          <h2 style="margin:0 0 12px 0">${subject || 'Invitación a nuestra boda'}</h2>
                          <p>${(generatedText || '').replace(/\n/g, '<br/>')}</p>
                          ${link ? `<p><a href="${link}" target="_blank" style="display:inline-block; background:#2563eb; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none">Confirmar asistencia (RSVP)</a></p>` : ''}
                        </div>`;
                      await EmailService.sendMail({ to: g.email, subject: subject || 'Invitación a nuestra boda', body: html });
                      sent++;
                    } catch (e) {
                      failed++;
                    }
                  }
                  setToast({ message: `Invitaciones enviadas: ${sent}. Fallidas: ${failed}.`, type: failed ? 'error' : 'success' });
                } catch (e) {
                  setToast({ message: 'Error en envío masivo', type: 'error' });
                } finally {
                  setSendingBulk(false);
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              {sendingBulk ? 'Enviando…' : 'Enviar a pendientes'}
            </button>
          </div>
        </section>
      )}

      {/* Envío masivo/Recordatorios RSVP */}
      {step === 4 && (
        <section className="border rounded p-4 space-y-3 mt-3">
          <h2 className="text-lg font-semibold">RSVP</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              disabled={!activeWedding || loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await apiPost(
                    '/api/rsvp/reminders',
                    { weddingId: activeWedding, dryRun: true },
                    { auth: true }
                  );
                  const json = await res.json().catch(() => ({}));
                  setToast({
                    message: `SimulaciÃ³n: candidatos=${json.attempted || 0}, enviados=${json.sent || 0}`,
                    type: 'info',
                  });
                } catch {
                  setToast({ message: 'Error simulando recordatorios', type: 'error' });
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              Simular recordatorios
            </button>
            <button
              disabled={!activeWedding || loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await apiPost(
                    '/api/rsvp/reminders',
                    { weddingId: activeWedding, dryRun: false },
                    { auth: true }
                  );
                  const json = await res.json().catch(() => ({}));
                  setToast({ message: `Enviados: ${json.sent || 0}`, type: 'success' });
                } catch {
                  setToast({ message: 'Error enviando recordatorios', type: 'error' });
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Enviar recordatorios
            </button>
          </div>
        </section>
      )}

      {showPreview && (
        <section className="border rounded p-4 bg-gray-50 mt-4">
          <h3 className="text-lg font-semibold mb-2">Preview de Invitación</h3>
          <div className="mb-3">
            <label className="text-sm mr-2">Invitado para preview:</label>
            <select
              value={previewGuestId}
              onChange={async (e) => {
                const id = e.target.value; setPreviewGuestId(id);
                try {
                  if (activeWedding && id) {
                    const { link } = await generateRsvpLink({ weddingId: activeWedding, guestId: id });
                    setPreviewRsvpLink(link || "");
                  } else { setPreviewRsvpLink(""); }
                } catch { setPreviewRsvpLink(""); }
              }}
              className="border rounded px-2 py-1"
            >
              <option value="">(Opcional) Selecciona invitado…</option>
              {(guests || []).slice(0, 100).map((g) => (
                <option key={g.id} value={g.id}>{g.name || g.email || g.id}</option>
              ))}
            </select>
          </div>
          <div className="border rounded bg-surface overflow-hidden">
            <div
              className="max-h-[70vh] overflow-auto"
              dangerouslySetInnerHTML={{ __html: (() => {
                const tpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
                const couple = (weddingInfo?.weddingInfo?.coupleName || weddingInfo?.weddingInfo?.name || "Nuestra boda");
                const wedDate = (weddingInfo?.weddingInfo?.weddingDate || weddingInfo?.weddingInfo?.date || "").toString();
                const venue = (weddingInfo?.weddingInfo?.venue || weddingInfo?.weddingInfo?.place || weddingInfo?.weddingInfo?.location || "Lugar por confirmar");
                const g = (guests || []).find((x) => String(x.id) === String(previewGuestId));
                const guestName = g?.name || "Invitado/a";
                const map = {
                  coupleName: couple,
                  weddingDate: wedDate,
                  venue,
                  guestName,
                  rsvpLink: previewRsvpLink || "",
                  invitationText: generatedText || "Nos hará mucha ilusión contar contigo en este día tan especial.",
                };
                const withIf = (tpl?.html || "").replace(/\{\{#if rsvpLink\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, block) => (map.rsvpLink ? block : ""));
                const out = withIf.replace(/\{\{(\w+)\}\}/g, (_m, k) => (map[k] != null ? String(map[k]) : ""));
                return sanitizeHtml(typeof out === "string" ? out : String(out || ""));
              })() }}
            />
          </div>
        </section>
      )}

      {/* Opciones Avanzadas */}
      {step === 4 && (
        <section className="border rounded p-4">
          <h2 className="text-lg font-semibold">Opciones Avanzadas</h2>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveDraft}
              className="bg-gray-200 px-3 py-1 rounded flex items-center"
            >
              <Save size={16} className="mr-2" />
              Guardar Borrador
            </button>
            <button
              onClick={handleDuplicateDesign}
              className="bg-gray-200 px-3 py-1 rounded flex items-center"
            >
              <Copy size={16} className="mr-2" />
              Duplicar DiseÃ±o
            </button>
          </div>
        </section>
      )}
    </Card>
  );
}



