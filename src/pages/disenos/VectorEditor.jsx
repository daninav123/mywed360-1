import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import VectorEditor from '../../components/VectorEditor';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../hooks/useAuth';
import { db, firebaseReady } from '../../firebaseConfig';

const fsImport = () => import('firebase/firestore');
const stImport = () => import('firebase/storage');

export default function VectorEditorPage() {
  const [params] = useSearchParams();
  const imageUrl = params.get('image');
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({ numberofcolors: 32, ltres: 0.1, qtres: 0.1, strokewidth: 1 });
  const [mode, setMode] = useState('color');
  const [threshold, setThreshold] = useState(128);
  const editorRef = useRef(null);
  const { activeWedding } = useWedding();
  const { currentUser } = useAuth();
  const category = params.get('category') || 'general';

  const canVectorize = Boolean(imageUrl);

  const doVectorize = async () => {
    if (!imageUrl) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'mono' ? '/api/ai-image/vectorize-mono' : '/api/ai-image/vectorize-svg';
      const payload = mode === 'mono' ? { url: imageUrl, threshold } : { url: imageUrl, options };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Vectorize failed');
      }
      const data = await res.json();
      setSvg(data.svg || '');
    } catch (e) {
      console.error(e);
      setError(e.message || 'No se pudo vectorizar la imagen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imageUrl) doVectorize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editor vectorial (IA)</h1>
        <Link to="/disenos" className="text-blue-600 hover:underline">Volver a Diseños</Link>
      </div>

      {!canVectorize && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-900">
          Abre este editor desde una imagen generada con IA para vectorizarla automáticamente.
        </div>
      )}

      {canVectorize && (
        <div className="bg-white border rounded p-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2">
              <label className="text-sm">Modo</label>
              <select value={mode} onChange={(e)=>setMode(e.target.value)} className="border rounded p-1">
                <option value="color">Color (ImageTracer)</option>
                <option value="mono">Monocromo (Potrace)</option>
              </select>
            </div>
            {mode === 'color' && (
              <>
                <div>
                  <label className="block text-sm">Colores</label>
                  <input type="number" min={2} max={64} value={options.numberofcolors}
                    onChange={(e)=>setOptions((o)=>({ ...o, numberofcolors: Math.max(2, Math.min(64, Number(e.target.value)||32)) }))}
                    className="border rounded p-1 w-28" />
                </div>
                <div>
                  <label className="block text-sm">ltres (0-1)</label>
                  <input type="number" step={0.05} min={0} max={1} value={options.ltres}
                    onChange={(e)=>setOptions((o)=>({ ...o, ltres: Math.max(0, Math.min(1, Number(e.target.value)||0.1)) }))}
                    className="border rounded p-1 w-28" />
                </div>
                <div>
                  <label className="block text-sm">qtres (0-1)</label>
                  <input type="number" step={0.05} min={0} max={1} value={options.qtres}
                    onChange={(e)=>setOptions((o)=>({ ...o, qtres: Math.max(0, Math.min(1, Number(e.target.value)||0.1)) }))}
                    className="border rounded p-1 w-28" />
                </div>
                <div>
                  <label className="block text-sm">Trazo</label>
                  <input type="number" step={0.5} min={0} value={options.strokewidth}
                    onChange={(e)=>setOptions((o)=>({ ...o, strokewidth: Math.max(0, Number(e.target.value)||1) }))}
                    className="border rounded p-1 w-28" />
                </div>
              </>
            )}
            {mode === 'mono' && (
              <>
                <div>
                  <label className="block text-sm">Umbral (0-255)</label>
                  <input type="number" min={0} max={255} value={threshold}
                    onChange={(e)=>setThreshold(Math.max(0, Math.min(255, Number(e.target.value)||128)))}
                    className="border rounded p-1 w-28" />
                </div>
              </>
            )}
            <button onClick={doVectorize} disabled={loading}
              className={`px-3 py-2 rounded ${loading? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{loading ? 'Vectorizando...' : 'Revectorizar'}</button>
            <a href={imageUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:underline">Ver original</a>
            {activeWedding && (
              <button
                onClick={async ()=>{
                  try {
                    const content = editorRef.current?.getSvg?.();
                    if (!content) return alert('No hay SVG para guardar');
                    await firebaseReady;
                    const { collection, doc, setDoc, serverTimestamp } = await fsImport();
                    const { getStorage, ref: sRef, uploadBytes, getDownloadURL } = await stImport();
                    const storage = getStorage();
                    const designsCol = collection(db, 'weddings', activeWedding, 'designs');
                    const newDoc = doc(designsCol);
                    const path = `weddings/${activeWedding}/designs/${newDoc.id}.svg`;
                    const blob = new Blob([content], { type: 'image/svg+xml' });
                    await uploadBytes(sRef(storage, path), blob);
                    const url = await getDownloadURL(sRef(storage, path));
                    await setDoc(newDoc, {
                      type: 'vector', category, storagePath: path, url, sourceImage: imageUrl,
                      createdAt: serverTimestamp(), createdBy: currentUser?.uid || 'unknown'
                    });
                    alert('SVG guardado en la boda');
                  } catch (e) {
                    console.error('Guardar SVG error', e);
                    alert('No se pudo guardar el SVG');
                  }
                }}
                className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Guardar en la boda
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 border rounded bg-red-50 text-red-700">{error}</div>
      )}

      {svg ? (
        <VectorEditor ref={editorRef} svg={svg} />
      ) : canVectorize && !loading ? (
        <div className="text-sm text-gray-600">No hay SVG disponible aún.</div>
      ) : null}
    </div>
  );
}

