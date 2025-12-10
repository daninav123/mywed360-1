import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Sparkles, Copy, Wand2, BookOpen } from 'lucide-react';

const SmartPromptEditor = ({
  prompt,
  onChange,
  variables = {},
  onOpenLibrary,
  selectedTemplate,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  // Sugerencias inteligentes basadas en contexto
  const intelligentSuggestions = {
    empty: [
      '💕 con colores pastel y detalles románticos',
      '✨ con un diseño minimalista y moderno',
      '🌸 con un estilo vintage y elegante',
      '🏖️ con un ambiente playero y relajado',
      '🌿 con inspiración natural y orgánica',
    ],
    short: [
      'Añade: "con fotos grandes de la pareja en el encabezado"',
      'Añade: "incluir un contador regresivo hasta la boda"',
      'Añade: "con una sección de confirmación de asistencia"',
      'Añade: "mostrar la historia de cómo nos conocimos"',
      'Añade: "incluir un mapa interactivo de la ubicación"',
    ],
    medium: [
      'Considera añadir: "con una galería de fotos animada"',
      'Considera añadir: "incluir lista de regalos sugeridos"',
      'Considera añadir: "con playlist de música para la boda"',
      'Considera añadir: "sección de preguntas frecuentes"',
    ],
  };

  // Variables disponibles
  const availableVariables = [
    { key: 'nombres', example: 'María y Juan', desc: 'Nombres de la pareja' },
    { key: 'fecha', example: '15 de Junio, 2025', desc: 'Fecha de la boda' },
    { key: 'ubicacion', example: 'Barcelona', desc: 'Ubicación general' },
    { key: 'ceremoniaLugar', example: 'Iglesia Santa María', desc: 'Lugar ceremonia' },
    { key: 'recepcionLugar', example: 'Hacienda Los Olivos', desc: 'Lugar recepción' },
    { key: 'historia', example: 'Nos conocimos...', desc: 'Vuestra historia' },
  ];

  useEffect(() => {
    setCharCount(prompt.length);

    // Generar sugerencias basadas en longitud del prompt
    if (prompt.length === 0) {
      setSuggestions(intelligentSuggestions.empty.slice(0, 3));
    } else if (prompt.length < 50) {
      setSuggestions(intelligentSuggestions.short.slice(0, 3));
    } else if (prompt.length < 150) {
      setSuggestions(intelligentSuggestions.medium.slice(0, 2));
    } else {
      setSuggestions([]);
    }
  }, [prompt]);

  const handleSuggestionClick = (suggestion) => {
    const cleanSuggestion = suggestion
      .replace(/^(Añade:|Considera añadir:)\s*"?/, '')
      .replace(/"$/, '');
    const newPrompt = prompt ? `${prompt} ${cleanSuggestion}` : cleanSuggestion;
    onChange(newPrompt);
    setShowSuggestions(false);
  };

  const insertVariable = (varKey) => {
    const cursorPos = textareaRef.current?.selectionStart || prompt.length;
    const textBefore = prompt.substring(0, cursorPos);
    const textAfter = prompt.substring(cursorPos);
    const newPrompt = `${textBefore}{${varKey}}${textAfter}`;
    onChange(newPrompt);

    // Mover cursor después de la variable insertada
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + varKey.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const examplePrompts = [
    {
      title: '💕 Romántica y Elegante',
      text: 'Crea una web elegante para la boda de {nombres} que se celebrará el {fecha} en {ubicacion}. Quiero un diseño romántico con colores pastel (rosa suave y blanco), tipografía elegante, y que incluya nuestra historia de amor, fotos de nuestra relación, y un contador regresivo hasta el gran día.',
    },
    {
      title: '✨ Moderna y Minimalista',
      text: 'Diseña una web moderna y minimalista para {nombres}. Boda el {fecha} en {ubicacion}. Usa colores neutros (blanco, gris, dorado), diseño limpio con mucho espacio en blanco, tipografía sans-serif moderna, galería de fotos con grid, y sección de confirmación de asistencia.',
    },
    {
      title: '🏖️ Estilo Playero',
      text: 'Quiero una web con temática de playa para nuestra boda el {fecha}. Colores del mar (azul turquesa, arena), elementos náuticos, fotos de la playa donde nos conocimos, información sobre el resort {recepcionLugar}, y consejos para los invitados sobre qué llevar.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wand2 size={20} className="text-purple-600" />
            Describe tu web ideal
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Cuanto más detalles des, mejor será el resultado
          </p>
        </div>
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <BookOpen size={16} />
          Ver Ejemplos
        </button>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Ejemplo: Quiero una web elegante con colores pastel, que incluya nuestra historia, fotos de la pareja, y un contador regresivo..."
          className="w-full h-40 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
        />

        {/* Character Counter */}
        <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
          {charCount} caracteres
          {charCount < 30 && <span className="text-amber-600 ml-1">· Añade más detalles</span>}
          {charCount >= 30 && charCount < 100 && (
            <span className="text-blue-600 ml-1">· Bien 👍</span>
          )}
          {charCount >= 100 && <span className="text-green-600 ml-1">· Excelente ✨</span>}
        </div>
      </div>

      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <Lightbulb size={18} className="text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 text-sm">Sugerencias inteligentes</h4>
              <p className="text-xs text-purple-700">Haz clic para añadir a tu descripción</p>
            </div>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-900 transition-colors border border-purple-100 hover:border-purple-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variables Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2 mb-3">
          <Sparkles size={18} className="text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 text-sm">Variables disponibles</h4>
            <p className="text-xs text-blue-700">Haz clic para insertar en tu texto</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableVariables.map((variable) => (
            <button
              key={variable.key}
              onClick={() => insertVariable(variable.key)}
              className="group text-left px-3 py-2 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-400 transition-all"
              title={variable.desc}
            >
              <code className="text-xs font-mono text-purple-600 font-semibold">
                {`{${variable.key}}`}
              </code>
              <div className="text-xs text-gray-600 mt-1 group-hover:text-blue-900">
                {variables[variable.key] || variable.example}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Examples */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Copy size={14} />
          Plantillas de ejemplo (clic para copiar)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => onChange(example.text)}
              className="text-left p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all group"
            >
              <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-blue-900">
                {example.title}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 group-hover:text-blue-800">
                {example.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-900">
          <strong>💡 Consejo profesional:</strong> Menciona colores específicos, el tono
          (formal/casual), y las secciones que quieres incluir para obtener mejores resultados.
        </p>
      </div>
    </div>
  );
};

export default SmartPromptEditor;
