import React from 'react';
import { WEDDING_STYLES, ATMOSPHERES } from '../../utils/weddingDesignTemplate';
import { Card, Input } from '../ui';

/**
 * Sección para definir la visión y estilo general de la boda
 */
const WeddingVisionSection = ({ 
  weddingDesign, 
  onChange,
  onChatOpen 
}) => {
  const updateVision = (path, value) => {
    const newDesign = { ...weddingDesign };
    const keys = path.split('.');
    let current = newDesign;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onChange(newDesign);
  };

  const toggleStyle = (styleId) => {
    const keywords = weddingDesign.vision?.overallStyle?.keywords || [];
    const newKeywords = keywords.includes(styleId)
      ? keywords.filter(k => k !== styleId)
      : [...keywords, styleId];
    
    updateVision('vision.overallStyle.keywords', newKeywords);
  };

  const selectedStyles = weddingDesign.vision?.overallStyle?.keywords || [];
  const selectedPrimary = weddingDesign.vision?.overallStyle?.primary || '';
  const selectedMood = weddingDesign.vision?.mood?.atmosphere || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎭 Visión y Estilo de tu Boda
            </h2>
            <p className="text-sm text-gray-600">
              Define el estilo general, ambiente y personalidad de vuestra celebración
            </p>
          </div>
          <button
            onClick={() => onChatOpen('vision')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <span>💬</span>
            <span>Ayuda IA</span>
          </button>
        </div>
      </Card>

      {/* Estilo principal */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          ✨ Estilo Principal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {WEDDING_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => {
                updateVision('vision.overallStyle.primary', style.id);
                toggleStyle(style.id);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPrimary === style.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                  : selectedStyles.includes(style.id)
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{style.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{style.name}</div>
              {selectedPrimary === style.id && (
                <div className="text-xs text-purple-600 mt-1">★ Principal</div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Selecciona tu estilo principal. Puedes combinar varios haciendo clic en más de uno.
        </p>
      </Card>

      {/* Ambiente */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          🌟 Ambiente Deseado
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ATMOSPHERES.map(atm => (
            <button
              key={atm.id}
              onClick={() => updateVision('vision.mood.atmosphere', atm.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMood === atm.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{atm.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{atm.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Descripción libre */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          💭 ¿Cómo imagináis vuestra boda?
        </h3>
        <textarea
          value={weddingDesign.vision?.mood?.feeling || ''}
          onChange={(e) => updateVision('vision.mood.feeling', e.target.value)}
          placeholder="Describe con tus palabras cómo os gustaría que fuera vuestra boda, qué sensación queréis transmitir..."
          className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </Card>
    </div>
  );
};

export default WeddingVisionSection;
