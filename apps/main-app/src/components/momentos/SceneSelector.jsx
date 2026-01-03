import React from 'react';

/**
 * SceneSelector
 * Selector ligero de escenas/ambientes para subir fotos de Momentos.
 */
export default function SceneSelector({ scenes = [], value, onChange, className = '' }) {
  const normalizedScenes = Array.isArray(scenes) && scenes.length ? scenes : [];
  const currentValue =
    value ||
    (normalizedScenes.length ? normalizedScenes[0].id : 'otros');

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {normalizedScenes.map((scene) => {
        const isActive = scene.id === currentValue;
        const label = scene.label || scene.id;
        return (
          <button
            key={scene.id}
            type="button"
            onClick={() => onChange?.(scene.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              isActive
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
            aria-pressed={isActive}
          >
            {scene.emoji && <span className="mr-1">{scene.emoji}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}
