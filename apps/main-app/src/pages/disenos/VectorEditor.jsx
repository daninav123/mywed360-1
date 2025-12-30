import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import { useSearchParams, Link } from 'react-router-dom';

import VectorEditor from '../../components/VectorEditor';
import { useWedding } from '../../context/WeddingContext';
import { db, firebaseReady } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const fsImport = () => import('firebase/firestore');
const stImport = () => import('firebase/storage');

export default function VectorEditorPage() {
  const [params] = useSearchParams();
  const imageUrl = params.get('image');
  const svgUrl = params.get('svg');
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({
    numberofcolors: 32,
    ltres: 0.1,
    qtres: 0.1,
    strokewidth: 1,
  });
  const [mode, setMode] = useState('color');
  const [threshold, setThreshold] = useState(128);
  const editorRef = useRef(null);
  const { activeWedding } = useWedding();
  const { currentUser } = useAuth();
  const category = params.get('category') || 'general';

  const { t } = useTranslations();
  const canVectorize = Boolean(imageUrl);

  const doVectorize = async () => {
    if (!imageUrl) return;
    setLoading(true);
    setError('');
    try {
      const endpoint =
        mode === 'mono' ? '/api/ai-image/vectorize-mono' : '/api/ai-image/vectorize-svg';
      const payload = mode === 'mono' ? { url: imageUrl, threshold } : { url: imageUrl, options };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Vectorize failed');
      }
      const data = await res.json();
      setSvg(data.svg || '');
    } catch (e) {
      // console.error(e);
      setError(
        t(
          'common.designsLibrary.vectorEditor.messages.vectorizeError',
          'No se pudo vectorizar la imagen'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imageUrl) doVectorize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Cargar SVG existente si se pasa ?svg=...
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!svgUrl) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(svgUrl);
        const text = await res.text();
        if (!ignore) setSvg(text);
      } catch (e) {
        // console.error('Cargar SVG error', e);
        if (!ignore)
          setError(
            t(
              'common.designsLibrary.vectorEditor.messages.loadSvgError',
              'No se pudo cargar el SVG'
            )
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [svgUrl]);

  // Paleta por boda (branding)
  const [palette, setPalette] = useState([
    '#1d4ed8',
    '#dc2626',
    '#0ea5e9',
    '#22c55e',
    '#f59e0b',
    '#a855f7',
    '#111827',
    '#ffffff',
  ]);
  useEffect(() => {
    const loadBrand = async () => {
      if (!activeWedding) return;
      try {
        await firebaseReady;
        const { doc, getDoc } = await fsImport();
        const ref = doc(db, 'weddings', activeWedding, 'branding', 'main');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.palette) && data.palette.length) {
            setPalette(data.palette);
          }
        }
      } catch (e) {
        // console.warn(t('common.designsLibrary.vectorEditor.messages.paletteLoadWarning', 'No se pudo cargar la paleta'), e);
      }
    };
    loadBrand();
  }, [activeWedding, t]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('designsLibrary.vectorEditor.title', 'Editor vectorial (IA)')}
        </h1>
        <Link to="/disenos" className="text-blue-600 hover:underline">
          {t('designsLibrary.myDesigns.backLink', 'Volver a Diseños')}
        </Link>
      </div>

      {!canVectorize && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-900">
          {t(
            'common.designsLibrary.vectorEditor.warning.openHint',
            'Abre este editor desde una imagen generada con IA para vectorizarla automáticamente.'
          )}
        </div>
      )}

      {canVectorize && (
        <div className="bg-white border rounded p-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2">
              <label className="text-sm">
                {t('designsLibrary.vectorEditor.controls.modeLabel', 'Modo')}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="border rounded p-1"
              >
                <option value="color">
                  {t(
                    'common.designsLibrary.vectorEditor.controls.modes.color',
                    'Color (ImageTracer)'
                  )}
                </option>
                <option value="mono">
                  {t(
                    'common.designsLibrary.vectorEditor.controls.modes.mono',
                    'Monocromo (Potrace)'
                  )}
                </option>
              </select>
            </div>
            {mode === 'color' && (
              <>
                <div>
                  <label className="block text-sm">
                    {t('designsLibrary.vectorEditor.controls.color.colors', 'Colores')}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={options.numberofcolors}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        numberofcolors: Math.max(2, Math.min(64, Number(e.target.value) || 32)),
                      }))
                    }
                    className="border rounded p-1 w-28"
                  />
                </div>
                <div>
                  <label className="block text-sm">
                    {t('designsLibrary.vectorEditor.controls.color.ltres', 'ltres (0-1)')}
                  </label>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                    value={options.ltres}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        ltres: Math.max(0, Math.min(1, Number(e.target.value) || 0.1)),
                      }))
                    }
                    className="border rounded p-1 w-28"
                  />
                </div>
                <div>
                  <label className="block text-sm">
                    {t('designsLibrary.vectorEditor.controls.color.qtres', 'qtres (0-1)')}
                  </label>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                    value={options.qtres}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        qtres: Math.max(0, Math.min(1, Number(e.target.value) || 0.1)),
                      }))
                    }
                    className="border rounded p-1 w-28"
                  />
                </div>
                <div>
                  <label className="block text-sm">
                    {t('designsLibrary.vectorEditor.controls.color.stroke', 'Trazo')}
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    value={options.strokewidth}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        strokewidth: Math.max(0, Number(e.target.value) || 1),
                      }))
                    }
                    className="border rounded p-1 w-28"
                  />
                </div>
              </>
            )}
            {mode === 'mono' && (
              <>
                <div>
                  <label className="block text-sm">
                    {t(
                      'common.designsLibrary.vectorEditor.controls.mono.threshold',
                      'Umbral (0-255)'
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={threshold}
                    onChange={(e) =>
                      setThreshold(Math.max(0, Math.min(255, Number(e.target.value) || 128)))
                    }
                    className="border rounded p-1 w-28"
                  />
                </div>
              </>
            )}
            <button
              onClick={doVectorize}
              disabled={loading}
              className={`px-3 py-2 rounded ${loading ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading
                ? t(
                    'common.designsLibrary.vectorEditor.controls.vectorize.loading',
                    'Vectorizando...'
                  )
                : t('designsLibrary.vectorEditor.controls.vectorize.action', 'Revectorizar')}
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-600 hover:underline"
            >
              {t('designsLibrary.vectorEditor.controls.viewOriginal', 'Ver original')}
            </a>
            {activeWedding && (
              <button
                onClick={async () => {
                  try {
                    const content = editorRef.current?.getSvg?.();
                    if (!content)
                      return toast.error(
                        t(
                          'common.designsLibrary.vectorEditor.toasts.noContent',
                          'No hay contenido SVG para guardar.'
                        )
                      );
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
                      type: 'vector',
                      category,
                      storagePath: path,
                      url,
                      sourceImage: imageUrl,
                      createdAt: serverTimestamp(),
                      createdBy: currentUser?.uid || 'unknown',
                    });
                    toast.success(
                      t(
                        'common.designsLibrary.vectorEditor.toasts.saveSuccess',
                        'SVG guardado correctamente.'
                      )
                    );
                  } catch (e) {
                    // console.error('Guardar SVG error', e);
                    toast.error(
                      t(
                        'common.designsLibrary.vectorEditor.toasts.saveError',
                        'No se pudo guardar el SVG.'
                      )
                    );
                  }
                }}
                className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {t(
                  'common.designsLibrary.vectorEditor.controls.saveToWedding',
                  'Guardar en la boda'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paleta de marca (editable) */}
      {activeWedding && (
        <div className="bg-white border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {t('designsLibrary.vectorEditor.palette.title', 'Paleta de la boda')}
            </h3>
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={async () => {
                try {
                  await firebaseReady;
                  const { doc, setDoc, serverTimestamp } = await fsImport();
                  const ref = doc(db, 'weddings', activeWedding, 'branding', 'main');
                  await setDoc(ref, { palette, updatedAt: serverTimestamp() }, { merge: true });
                  toast.success(
                    t(
                      'common.designsLibrary.vectorEditor.toasts.paletteSaved',
                      'Paleta guardada correctamente.'
                    )
                  );
                } catch (e) {
                  // console.error(e);
                  toast.error(
                    t(
                      'common.designsLibrary.vectorEditor.toasts.paletteSaveError',
                      'No se pudo guardar la paleta.'
                    )
                  );
                }
              }}
            >
              {t('designsLibrary.vectorEditor.palette.save', 'Guardar paleta')}
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {palette.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPalette((prev) => prev.map((p, j) => (j === i ? val : p)));
                  }}
                  className="w-10 h-8 p-0 border rounded"
                />
                <input
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPalette((prev) => prev.map((p, j) => (j === i ? val : p)));
                  }}
                  className="border rounded p-1 w-28 text-sm"
                />
              </div>
            ))}
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setPalette((prev) => [...prev, '#000000'])}
            >
              {t('designsLibrary.vectorEditor.palette.addColor', '+ color')}
            </button>
          </div>
        </div>
      )}

      {error && <div className="p-3 border rounded bg-red-50 text-red-700">{error}</div>}

      {svg ? (
        <VectorEditor ref={editorRef} svg={svg} palette={palette} />
      ) : canVectorize && !loading ? (
        <div className="text-sm text-gray-600">
          {t('designsLibrary.vectorEditor.messages.noSvg', 'No hay SVG disponible aún.')}
        </div>
      ) : null}
    </div>
  );
}
