import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useAuth } from '../hooks/useAuth';
import useTranslations from '../hooks/useTranslations';
import { db } from '../firebaseConfig';
import { post as apiPost } from '../services/apiClient';
/*
  Editor interno para la página web de la boda.
  Permite al usuario rellenar/editar la información que utilizará WeddingSite.jsx.
*/

export default function WebEditor() {
  const { currentUser } = useAuth();
  const { t } = useTranslations();
  const uid = currentUser?.uid || 'dev';

  const [info, setInfo] = useState({
    coupleName: '',
    date: '',
    celebrationPlace: '',
    story: '',
    giftAccount: '',
    primaryColor: '#E91E63',
    secondaryColor: '#FFFFFF',
  });
  const [schedule, setSchedule] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    (async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists() && docSnap.data().weddingInfo)
          setInfo({ ...info, ...docSnap.data().weddingInfo });
        const schSnap = await getDocs(collection(db, 'users', uid, 'schedule'));
        setSchedule(
          schSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.time.localeCompare(b.time))
        );
        const galSnap = await getDocs(collection(db, 'users', uid, 'gallery'));
        setGallery(galSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        // console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const saveInfo = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', uid), { weddingInfo: info }, { merge: true });
      toast.success(t('messages.saveSuccess'));
    } catch (err) {
      // console.error(err);
      toast.error(t('messages.saveError'));
    }
    setLoading(false);
  };

  // --- Schedule helpers ---
  const addSchedule = () => setSchedule([...schedule, { time: '', title: '', temp: Date.now() }]);
  const updateSchedule = (idx, key, val) => {
    const next = [...schedule];
    next[idx][key] = val;
    setSchedule(next);
  };
  const removeSchedule = (idx) => setSchedule(schedule.filter((_, i) => i !== idx));
  const saveSchedule = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'users', uid, 'schedule');
      // Borrar docs existentes y volver a crear (simple)
      const existing = await getDocs(colRef);
      await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
      await Promise.all(
        schedule.map((item) => addDoc(colRef, { time: item.time, title: item.title }))
      );
      toast.success(t('messages.saveSuccess'));
    } catch (e) {
      // console.error(e);
      toast.error(t('errors.generic'));
    }
    setLoading(false);
  };

  // --- AI helpers ---
  const suggestStory = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await apiPost(
          '/api/proxy/openai',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Eres un asistente que redacta textos románticos para webs de boda en español.',
              },
              {
                role: 'user',
                content: `Genera una breve historia de amor (máx 150 palabras) para la pareja ${info.coupleName}.`,
              },
            ],
            maxTokens: 450,
          },
          { auth: true, signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Proxy OpenAI error: ${response.status}`);
        }

        const data = await response.json();
        const text = String(data?.response || '').trim();
        if (text) setInfo((prev) => ({ ...prev, story: text }));
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // console.error(err);
      toast.error(t('errors.openaiError'));
    }
    setAiLoading(false);
  };

  const suggestSchedule = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await apiPost(
          '/api/proxy/openai',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Eres un asistente que devuelve un JSON con el programa típico de una boda en España. Ejemplo: [{"time":"12:00","title":"Ceremonia"}]',
              },
              {
                role: 'user',
                content:
                  'Genera un programa para nuestra boda con 6-8 eventos clave. Usa formato JSON.',
              },
            ],
            maxTokens: 650,
          },
          { auth: true, signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Proxy OpenAI error: ${response.status}`);
        }

        const data = await response.json();
      let arr = [];
      try {
        arr = JSON.parse(data?.response);
      } catch {}
      if (Array.isArray(arr)) setSchedule(arr.map((item, i) => ({ ...item, temp: i })));
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // console.error(err);
      toast.error(t('errors.openaiError'));
    }
    setAiLoading(false);
  };

  // --- Gallery helpers ---
  const addImage = () => setGallery([...gallery, { url: '' }]);
  const updateImage = (idx, val) => {
    const next = [...gallery];
    next[idx].url = val;
    setGallery(next);
  };
  const removeImage = (idx) => setGallery(gallery.filter((_, i) => i !== idx));
  const saveGallery = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'users', uid, 'gallery');
      const existing = await getDocs(colRef);
      await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
      await Promise.all(
        gallery.filter((g) => g.url).map((img) => addDoc(colRef, { url: img.url }))
      );
      toast.success(t('messages.saveSuccess'));
    } catch (e) {
      // console.error(e);
      toast.error(t('errors.generic'));
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>Editor de mi web</h1>

      {/* Información básica */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Datos básicos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            placeholder={t('webEditor.coupleNamesPlaceholder')}
            value={info.coupleName}
            onChange={(e) => setInfo({ ...info, coupleName: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            type="date"
            value={info.date}
            onChange={(e) => setInfo({ ...info, date: e.target.value })}
          />
          <input
            className="border p-2 rounded sm:col-span-2"
            placeholder={t('webEditor.venuePlaceholder')}
            value={info.celebrationPlace}
            onChange={(e) => setInfo({ ...info, celebrationPlace: e.target.value })}
          />
        </div>
        <textarea
          className="border p-2 rounded w-full"
          rows="4"
          placeholder={t('webEditor.storyPlaceholder')}
          value={info.story}
          onChange={(e) => setInfo({ ...info, story: e.target.value })}
        />
        <button
          type="button"
          onClick={suggestStory}
          disabled={aiLoading}
          className="text-sm  underline" style={{ color: 'var(--color-primary)' }}
        >
          {aiLoading ? 'Generando...' : 'Sugerir con IA'}
        </button>
        <input
          className="border p-2 rounded w-full"
          placeholder={t('webEditor.giftAccountPlaceholder')}
          value={info.giftAccount}
          onChange={(e) => setInfo({ ...info, giftAccount: e.target.value })}
        />
        <div className="flex gap-4 items-center">
          <label>Color primario:</label>
          <input
            type="color"
            value={info.primaryColor}
            onChange={(e) => setInfo({ ...info, primaryColor: e.target.value })}
          />
          <label>Color secundario:</label>
          <input
            type="color"
            value={info.secondaryColor}
            onChange={(e) => setInfo({ ...info, secondaryColor: e.target.value })}
          />
        </div>
        <button
          className=" text-white px-4 py-2 rounded" style={{ backgroundColor: 'var(--color-primary)' }}
          disabled={loading}
          onClick={saveInfo}
        >
          Guardar información
        </button>
      </section>

      {/* Programa */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium flex items-center justify-between">
          Programa del día
          <div className="flex gap-3">
            <button onClick={addSchedule} className=" flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
              <Plus size={16} /> Añadir
            </button>
            <button
              onClick={suggestSchedule}
              disabled={aiLoading}
              className="text-indigo-600 flex items-center gap-1"
            >
              <Zap size={16} /> IA
            </button>
          </div>
        </h2>
        {schedule.map((s, idx) => (
          <div key={s.id || s.temp} className="flex gap-2 items-center">
            <input
              type="time"
              className="border p-1 rounded"
              value={s.time}
              onChange={(e) => updateSchedule(idx, 'time', e.target.value)}
            />
            <input
              className="border p-1 rounded flex-grow"
              placeholder={t('webEditor.descriptionPlaceholder')}
              value={s.title}
              onChange={(e) => updateSchedule(idx, 'title', e.target.value)}
            />
            <button onClick={() => removeSchedule(idx)} className="" style={{ color: 'var(--color-danger)' }}>
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button
          className=" text-white px-4 py-2 rounded" style={{ backgroundColor: 'var(--color-primary)' }}
          disabled={loading}
          onClick={saveSchedule}
        >
          Guardar programa
        </button>
      </section>

      {/* Galería */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium flex items-center justify-between">
          Galería{' '}
          <button onClick={addImage} className=" flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
            <Plus size={16} /> Añadir
          </button>
        </h2>
        {gallery.map((g, idx) => (
          <div key={g.id || idx} className="flex gap-2 items-center">
            <input
              className="border p-1 rounded flex-grow"
              placeholder={t('webEditor.imageUrlPlaceholder')}
              value={g.url}
              onChange={(e) => updateImage(idx, e.target.value)}
            />
            <button onClick={() => removeImage(idx)} className="" style={{ color: 'var(--color-danger)' }}>
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button
          className=" text-white px-4 py-2 rounded" style={{ backgroundColor: 'var(--color-primary)' }}
          disabled={loading}
          onClick={saveGallery}
        >
          Guardar galería
        </button>
      </section>

      {/* Vista previa */}
      <section className="space-y-2">
        <h2 className="text-xl font-medium">Vista previa</h2>
        <iframe title="Preview" className="border w-full h-[600px] rounded" src={`/w/${uid}`} />
      </section>
    </div>
  );
}
