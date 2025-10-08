import { saveAs } from 'file-saver';
import { Wand2, RefreshCcw, Download, FileDown, PenTool, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Spinner from './Spinner';
import { useWedding } from '../context/WeddingContext';
import { db, firebaseReady } from '../firebaseConfig';
import { post as apiPost } from '../services/apiClient';
import { saveData, loadData } from '../services/SyncService';

/**
 * Componente para generar imÒ€)€) €)"Ò€)a€)¡genes con IA (DALLÒ€)€) €)"Ò¢â€)a¬€)&¡Ò€)â€)€)šÒ€)a€)·E/Proxy)
 * Props:
 *  - category: string (invitaciones, logo, etc.)
 *  - templates: Array<{ name, description, prompt }>
 *  - onImageGenerated: (image) => void
 */
const ImageGeneratorAI = ({
  category = 'general',
  templates = [],
  onImageGenerated = () => {},
  defaultPrompt = '',
  autoGenerate = false,
}) => {
  const navigate = useNavigate();
  const { activeWedding } = useWedding();
  const [prompt, setPrompt] = useState('');
  const autoGenOnce = React.useRef(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Opciones de exportaciÒ³n (PDF imprenta)
  const [paperPreset, setPaperPreset] = useState('5x7in'); // '5x7in' | 'A5' | 'A6' | 'DL' | 'SQ140'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [bleed, setBleed] = useState(true); // sangrado 3mm

  // Cargar imÒ€)€) €)"Ò€)a€)¡genes guardadas al iniciar
  useEffect(() => {
    (async () => {
      try {
        const savedImages = await loadData(`mywed360_ai_images_${category}`, {
          defaultValue: [],
          collection: 'userDesigns',
        });
        if (Array.isArray(savedImages) && savedImages.length > 0) {
          setGeneratedImages(savedImages);
        }
      } catch (_) {}
    })();
  }, [category]);

  // Toast temporal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Aplicar prompt por defecto si llega desde fuera
  useEffect(() => {
    if (defaultPrompt && !prompt) setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  // Auto-generar una vez si se solicita y hay prompt listo
  useEffect(() => {
    if (autoGenerate && !autoGenOnce.current && prompt && !loading) {
      autoGenOnce.current = true;
      generateImage();
    }
  }, [autoGenerate, prompt, loading]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
  };

  // Calcular dimensiones en mm segÒ€)€) €)"Ò€)a€)ºn preset/orientaciÒ³n/sangrado
  const getSizeMm = () => {
    let w = 0,
      h = 0;
    if (paperPreset === '5x7in') {
      w = 127;
      h = 178;
    } else if (paperPreset === 'A5') {
      w = 148;
      h = 210;
    } else if (paperPreset === 'A6') {
      w = 105;
      h = 148;
    } else if (paperPreset === 'DL') {
      w = 99;
      h = 210;
    } else if (paperPreset === 'SQ140') {
      w = 140;
      h = 140;
    }
    if (bleed) {
      w += 6;
      h += 6;
    }
    if (orientation === 'landscape') return { widthMm: h, heightMm: w };
    return { widthMm: w, heightMm: h };
  };

  // Generar imagen (proxy o fallback directo)
  const generateImage = async () => {
    if (!prompt.trim()) {
      setToast({
        type: 'error',
        message: 'Por favor, escribe un prompt o selecciona una plantilla',
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1) Proxy backend si estÒ€)€) €)"Ò€)a€)¡ disponible
      try {
        const res = await apiPost('/api/ai-image', { prompt }, { auth: true });
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            handleImageGenerated(data.url);
            return;
          }
        }
      } catch (err) {
        console.warn('Proxy AI-image no disponible, usando OpenAI directo:', err);
      }

      // 2) Fallback directo a OpenAI (si estÒ€)€) €)"Ò€)a€)¡ habilitado)
      const allowDirect =
        import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true' || import.meta.env.DEV;
      if (!allowDirect) throw new Error('OpenAI directo deshabilitado por configuraciÒ€)€) €)"Ò€)a€)³n');

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Error al generar la imagen');
      }
      const data = await response.json();
      const url = data?.data?.[0]?.url;
      if (!url) throw new Error('No se recibiÒ€)€) €)"Ò€)a€)³ URL de imagen');
      handleImageGenerated(url);
    } catch (err) {
      console.error('Error al generar imagen:', err);
      setError(err.message || 'Error al generar la imagen');
      setToast({ type: 'error', message: 'Error al generar la imagen. Intenta con otro prompt.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageGenerated = (imageUrl) => {
    const newImage = {
      id: Date.now(),
      url: imageUrl,
      prompt,
      timestamp: new Date().toISOString(),
      category,
    };
    const updatedImages = [newImage, ...generatedImages];
    setGeneratedImages(updatedImages);
    // persistir
    saveData(`mywed360_ai_images_${category}`, updatedImages, {
      collection: 'userDesigns',
      showNotification: false,
    });
    onImageGenerated(newImage);
    setToast({
      type: 'success',
      message:
        'Ò€)€) €)"Ò¢â€)a¬€)&¡Ò€)â€)€)šÒ€)a€)¡Ò€)a€)¡€)¡Imagen generada con Ò©xito! con Ò©xito!Ò€)€) €)"Ò€)a€)©xito!',
    });
  };

  // Guardar imagen en la boda (Storage + Firestore)
  const saveImageToWedding = async (imageUrl) => {
    if (!activeWedding) {
      setToast({ type: 'error', message: 'Selecciona una boda para guardar el diseÒ±o' });
      return;
    }
    try {
      // Descargar a travÒ€)€) €)"Ò€)a€)©s del proxy para evitar CORS
      const resp = await fetch(`/api/image-proxy?u=${encodeURIComponent(imageUrl)}`);
      if (!resp.ok) throw new Error('No se pudo descargar la imagen');
      const blob = await resp.blob();

      await firebaseReady;
      const { collection, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const {
        getStorage,
        ref: sRef,
        uploadBytes,
        getDownloadURL,
      } = await import('firebase/storage');
      const storage = getStorage();

      const designsCol = collection(db, 'weddings', activeWedding, 'designs');
      const newDoc = doc(designsCol);
      const path = `weddings/${activeWedding}/designs/${newDoc.id}.png`;
      await uploadBytes(sRef(storage, path), blob, { contentType: 'image/png' });
      const url = await getDownloadURL(sRef(storage, path));
      await setDoc(newDoc, {
        type: 'raster',
        category,
        storagePath: path,
        url,
        source: 'ai-image',
        prompt,
        createdAt: serverTimestamp(),
      });
      setToast({ type: 'success', message: 'diseÒ±o guardado en la boda' });
    } catch (e) {
      console.error('Guardar diseÒ±o error', e);
      setToast({ type: 'error', message: 'No se pudo guardar el diseÒ±o' });
    }
  };

  // Descargar PNG (con CORS fallback)
  const downloadImage = async (imageUrl, imageName) => {
    const urlObj = new URL(imageUrl);
    const sameOrigin = urlObj.origin === window.location.origin;
    if (!sameOrigin) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = imageName || `mywed360-${category}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = imageName || `mywed360-${category}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al descargar la imagen:', err);
      const aFallback = document.createElement('a');
      aFallback.href = imageUrl;
      aFallback.target = '_blank';
      aFallback.rel = 'noopener noreferrer';
      document.body.appendChild(aFallback);
      aFallback.click();
      document.body.removeChild(aFallback);
      setToast({ type: 'error', message: 'Error al descargar la imagen' });
    }
  };

  // PDF vectorial (backend vectoriza y compone al TamaÒ±o elegido)
  const downloadVectorPdf = async (imageUrl, fileName) => {
    try {
      const dims = getSizeMm();
      const res = await apiPost(
        '/api/ai-image/vector-pdf',
        { url: imageUrl, ...dims },
        { auth: true }
      );
      if (!res.ok) throw new Error('Error generando PDF');
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error('PDF vacÒ€)€) €)"Ò€)a€)­o');
      saveAs(blob, fileName || `mywed360-${category}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      setToast({ type: 'error', message: 'No se pudo generar el PDF' });
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Plantillas */}
      {templates.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Plantillas disponibles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((template, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  {selectedTemplate === template && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Seleccionada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor de prompt + ajustes de exportaciÒ³n */}
      <div className="bg-white p-4 border rounded-lg">
        <label htmlFor="prompt" className="block font-medium mb-2">
          Prompt para la generaciÒ³n
        </label>
        <div className="flex space-x-2">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe la imagen que quieres generar..."
            className="flex-1 border rounded-lg p-3 min-h-[100px]"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">TamaÒ±o</label>
            <select
              value={paperPreset}
              onChange={(e) => setPaperPreset(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            >
              <option value="5x7in">5x7&quot; (127Ò€)178 mm)</option>
              <option value="A5">A5 (148Ò€)210 mm)</option>
              <option value="A6">A6 (105Ò€)148 mm)</option>
              <option value="DL">DL (99Ò€)210 mm)</option>
              <option value="SQ140">Cuadrado (140Ò€)140 mm)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">orientaciÒ³n</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            >
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 mt-6">
            <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} />
            <span className="text-sm">AÒ±adir sangrado 3mm</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={generateImage}
            disabled={loading || !prompt.trim()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              loading || !prompt.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <RefreshCcw className="animate-spin h-4 w-4" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generar imagen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GalerÒ€)€) €)"Ò€)a€)­a de imÒ€)€) €)"Ò€)a€)¡genes generadas */}
      {generatedImages.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">ImÒ€)€) €)"Ò€)a€)¡genes generadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/disenos/vector-editor?image=${encodeURIComponent(image.url)}&category=${encodeURIComponent(category)}`
                        )
                      }
                      className="bg-white/80 p-2 rounded-full hover:bg-white"
                      title="Editar (vector)"
                    >
                      <PenTool className="h-4 w-4" />
                    </button>
                    {activeWedding && (
                      <button
                        onClick={() => saveImageToWedding(image.url)}
                        className="bg-white/80 p-2 rounded-full hover:bg-white"
                        title="Guardar en la boda"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadImage(image.url)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white"
                      title="Descargar PNG"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadVectorPdf(image.url)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white"
                      title="Descargar PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{image.prompt}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(image.timestamp).toLocaleDateString()}{' '}
                    {new Date(image.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorAI;


