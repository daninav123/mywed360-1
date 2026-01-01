import React, { useState } from 'react';
import { X, Sparkles, Wand2, Palette, Layout as LayoutIcon } from 'lucide-react';

export default function AIAssistant({ onClose, canvasRef }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('compose');

  const modes = [
    {
      id: 'compose',
      label: 'Componer diseño',
      icon: Wand2,
      description: 'Crea un diseño completo desde cero',
    },
    {
      id: 'improve',
      label: 'Mejorar diseño',
      icon: Sparkles,
      description: 'Mejora el diseño actual',
    },
    {
      id: 'colors',
      label: 'Paleta de colores',
      icon: Palette,
      description: 'Sugiere combinaciones de colores',
    },
    {
      id: 'variations',
      label: 'Variaciones',
      icon: LayoutIcon,
      description: 'Genera variaciones del diseño',
    },
  ];

  const suggestions = [
    'Invitación minimalista con flores',
    'Menú elegante con marco dorado',
    'Cartel de bienvenida rústico',
    'Tarjeta de agradecimiento floral',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/design-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: activeMode,
          apiKey: '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',
        }),
      });

      if (!response.ok) {
        console.warn('API no disponible, usando modo mock');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        const data = await response.json();
        onApplyDesign({
          type: 'ai-generated',
          prompt,
          mode: activeMode,
          design: data.design,
        });
        onClose();
        return;
      }
      
      onApplyDesign({
        type: 'ai-generated',
        prompt,
        mode: activeMode,
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating design:', error);
      onApplyDesign({
        type: 'ai-generated',
        prompt,
        mode: activeMode,
      });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  bg-opacity-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asistente IA</h2>
              <p className="text-sm text-purple-100">
                Crea y mejora diseños con inteligencia artificial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover: hover:bg-opacity-20 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    activeMode === mode.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${activeMode === mode.id ? 'text-purple-600' : 'text-gray-400'}`}
                  />
                  <div className="font-semibold text-sm mb-1">{mode.label}</div>
                  <div className="text-xs " style={{ color: 'var(--color-muted)' }}>{mode.description}</div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
              Describe tu diseño
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Invitación de boda minimalista con flores en las esquinas, tipografía elegante, colores tierra..."
              className="w-full px-4 py-3 border  rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
              rows={4}
            />
          </div>

          <div>
            <div className="text-xs font-medium  mb-2" style={{ color: 'var(--color-text)' }}>Sugerencias</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 text-xs  hover:bg-gray-200 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar diseño
              </>
            )}
          </button>

          <div className="text-xs  text-center" style={{ color: 'var(--color-muted)' }}>
            La IA te ayudará a crear diseños profesionales en segundos
          </div>
        </div>
      </div>
    </div>
  );
}
