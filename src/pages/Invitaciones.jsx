import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Save, Copy, Zap, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Card from '../components/ui/Card';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { useWedding } from '../context/WeddingContext';
import { post as apiPost } from '../services/apiClient';

export default function Invitaciones() {
  const { activeWedding } = useWedding();
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);
  
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
      const allowDirect = (import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true') || import.meta.env.DEV;
      if (!allowDirect) throw new Error('OpenAI directo deshabilitado por configuración');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant specialized in generating invitation texts.' },
            { role: 'user', content: aiPrompt }
          ]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setGeneratedText(text);
      setToast({ message: 'Invitación generada', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error generando invitación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };  
  const handleSaveDraft = async () => {
    const draft = { aiPrompt, panel, filterCategory, filterColor, filterFont, step, generatedText };
    await saveData('invitationDraft', draft, {
      collection: 'userInvitations',
      showNotification: true
    });
    setToast({ message: 'Borrador guardado', type: 'success' });
  };
  const handleDuplicateDesign = async () => {
    const draftKey = `invitationDraft_${Date.now()}`;
    const data = { aiPrompt, panel, filterCategory, filterColor, filterFont, step, generatedText };
    await saveData(draftKey, data, {
      collection: 'userInvitations',
      showNotification: false
    });
    setToast({ message: 'Diseño duplicado', type: 'success' });
  };
  const [panel, setPanel] = useState('invitation'); // 'invitation' o 'envelope'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterFont, setFilterFont] = useState('');
  const [step, setStep] = useState(1);

  // Carga inicial asíncrona de borrador/preferencias
  useEffect(() => {
    (async () => {
      try {
        const [p, pnl, fc, fcol, ff, st, gen, prev] = await Promise.all([
          loadData('invitationAiPrompt', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationPanel', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationFilterCategory', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationFilterColor', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationFilterFont', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationStep', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationGeneratedText', { collection: 'userInvitations', fallbackToLocal: true }),
          loadData('invitationShowPreview', { collection: 'userInvitations', fallbackToLocal: true }),
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

  // Ejemplo de plantillas
  const templates = [
    { id: 1, name: 'Clásico', category: 'clásico', color: 'pastel', font: 'Serif' },
    { id: 2, name: 'Moderno', category: 'moderno', color: 'vibrante', font: 'Sans' },
    { id: 3, name: 'Rústico', category: 'rústico', color: 'tierra', font: 'Handwriting' },
    { id: 4, name: 'Minimalista', category: 'minimalista', color: 'monocromo', font: 'Sans' },
  ];
  const filtered = templates.filter(t =>
    (filterCategory ? t.category === filterCategory : true) &&
    (filterColor ? t.color === filterColor : true) &&
    (filterFont ? t.font === filterFont : true)
  );
  // Persistencia silenciosa por campo
  useEffect(() => { saveData('invitationAiPrompt', aiPrompt, { collection: 'userInvitations', showNotification: false }); }, [aiPrompt]);
  useEffect(() => { saveData('invitationPanel', panel, { collection: 'userInvitations', showNotification: false }); }, [panel]);
  useEffect(() => { saveData('invitationFilterCategory', filterCategory, { collection: 'userInvitations', showNotification: false }); }, [filterCategory]);
  useEffect(() => { saveData('invitationFilterColor', filterColor, { collection: 'userInvitations', showNotification: false }); }, [filterColor]);
  useEffect(() => { saveData('invitationFilterFont', filterFont, { collection: 'userInvitations', showNotification: false }); }, [filterFont]);
  useEffect(() => { saveData('invitationStep', String(step), { collection: 'userInvitations', showNotification: false }); }, [step]);
  useEffect(() => { saveData('invitationGeneratedText', generatedText, { collection: 'userInvitations', showNotification: false }); }, [generatedText]);
  useEffect(() => { saveData('invitationShowPreview', showPreview, { collection: 'userInvitations', showNotification: false }); }, [showPreview]);

  // Indicador de sincronización
  const SyncIndicator = () => (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-md">
      {syncStatus === 'online' ? (
        <>
          <Cloud size={18} className="text-green-500" />
          <span className="text-sm">Sincronizado</span>
        </>
      ) : syncStatus === 'offline' ? (
        <>
          <CloudOff size={18} className="text-yellow-500" />
          <span className="text-sm">Guardado localmente</span>
        </>
      ) : (
        <>
          <RefreshCw size={18} className="text-blue-500 animate-spin" />
          <span className="text-sm">Sincronizando...</span>
        </>
      )}
    </div>
  );

  return (
    <Card className="p-6 space-y-6">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}  
      <h1 className="text-2xl font-semibold">Diseño de Invitaciones</h1>
      <div className="flex justify-between mb-4">  
        {step > 1 && <button onClick={() => setStep(step - 1)} className="bg-gray-200 px-3 py-1 rounded">Anterior</button>}  
        {step < 4 && <button onClick={() => setStep(step + 1)} className="bg-blue-600 text-white px-3 py-1 rounded">Siguiente</button>}  
        {step === 4 && <button onClick={() => alert('Wizard completado')} className="bg-green-600 text-white px-3 py-1 rounded">Finalizar</button>}  
      </div>

      {/* Asistente de IA */}
      {step === 1 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Asistente de IA</h2>
          <textarea
            rows={3}
            placeholder="Describe cómo quieres tu invitación..."
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleAiGenerate}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center"
          >
            {loading ? <Spinner size={16} className="mr-2" /> : <Zap size={16} className="mr-2" />} {loading ? 'Generando...' : 'Generar invitación'}
          </button>
        </section>
      )}

      {/* Selección de Plantilla */}
      {step === 2 && (
        <section className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-semibold">Selección de Plantilla</h2>
          <div className="flex gap-4 flex-wrap">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Todos los estilos</option>
              <option value="clásico">Clásico</option>
              <option value="moderno">Moderno</option>
              <option value="rústico">Rústico</option>
              <option value="minimalista">Minimalista</option>
            </select>
            <select value={filterColor} onChange={e => setFilterColor(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Todas las paletas</option>
              <option value="pastel">Pastel</option>
              <option value="vibrante">Vibrante</option>
              <option value="tierra">Tierra</option>
              <option value="monocromo">Monocromo</option>
            </select>
            <select value={filterFont} onChange={e => setFilterFont(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Todas las tipografías</option>
              <option value="Serif">Serif</option>
              <option value="Sans">Sans</option>
              <option value="Handwriting">Handwriting</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {filtered.map(t => (
              <div key={t.id} className="border rounded overflow-hidden cursor-pointer hover:shadow-lg">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editor Invitación/Sobre */}
      {step === 3 && (
        <section className="border rounded p-4 space-y-4">
          <div className="flex gap-4">
            <button onClick={() => setPanel('invitation')} className={`px-4 py-2 rounded ${panel==='invitation'?'bg-blue-600 text-white':'bg-gray-200'}`}>Invitación</button>
            <button onClick={() => setPanel('envelope')} className={`px-4 py-2 rounded ${panel==='envelope'?'bg-blue-600 text-white':'bg-gray-200'}`}>Sobre</button>
          </div>
          <div className="border bg-white h-[400px] flex items-center justify-center text-gray-400">
            {panel === 'invitation'
              ? 'Canvas de invitación: arrastra componentes aquí'
              : 'Canvas de sobre: frontal / trasero'}
          </div>
        </section>
      )}

      {/* Preview y Exportación */}
      {step === 4 && (
        <section className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPreview(prev => !prev)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <Eye size={16} className="mr-2" />{showPreview ? 'Ocultar preview' : 'Previsualizar'}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center">
            <Download size={16} className="mr-2" />Exportar PDF
          </button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center">
            <Download size={16} className="mr-2" />Exportar PNG
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            Compartir
          </button>
        </section>
      )}
      {/* Envío masivo/Recordatorios RSVP */}
      {step === 4 && (
        <section className="border rounded p-4 space-y-3 mt-3">
          <h2 className="text-lg font-semibold">RSVP</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              disabled={!activeWedding || loading}
              onClick={async ()=>{
                try {
                  setLoading(true);
                  const res = await apiPost('/api/rsvp/reminders', { weddingId: activeWedding, dryRun: true }, { auth: true });
                  const json = await res.json().catch(()=>({}));
                  setToast({ message: `Simulación: candidatos=${json.attempted||0}, enviados=${json.sent||0}`, type: 'info' });
                } catch { setToast({ message: 'Error simulando recordatorios', type: 'error' }); } finally { setLoading(false); }
              }}
              className="bg-gray-200 px-3 py-1 rounded"
            >Simular recordatorios</button>
            <button
              disabled={!activeWedding || loading}
              onClick={async ()=>{
                try {
                  setLoading(true);
                  const res = await apiPost('/api/rsvp/reminders', { weddingId: activeWedding, dryRun: false }, { auth: true });
                  const json = await res.json().catch(()=>({}));
                  setToast({ message: `Enviados: ${json.sent||0}`, type: 'success' });
                } catch { setToast({ message: 'Error enviando recordatorios', type: 'error' }); } finally { setLoading(false); }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >Enviar recordatorios</button>
          </div>
        </section>
      )}
      {showPreview && generatedText && (
        <section className="border rounded p-4 bg-gray-50 mt-4">
          <h3 className="text-lg font-semibold">Preview de Invitación</h3>
          <p className="whitespace-pre-wrap">{generatedText}</p>
        </section>
      )}
      {/* Opciones Avanzadas */}
      {step === 4 && (
        <section className="border rounded p-4">
          <h2 className="text-lg font-semibold">Opciones Avanzadas</h2>
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveDraft} className="bg-gray-200 px-3 py-1 rounded flex items-center">
              <Save size={16} className="mr-2" />Guardar Borrador
            </button>
            <button onClick={handleDuplicateDesign} className="bg-gray-200 px-3 py-1 rounded flex items-center">
              <Copy size={16} className="mr-2" />Duplicar Diseño
            </button>
          </div>
        </section>
      )}

    </Card>
  );
}

