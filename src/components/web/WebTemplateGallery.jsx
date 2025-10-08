import React from 'react';

const WebTemplateGallery = ({ templates, selectedTemplate, onSelect }) => {
  if (!templates || !Object.keys(templates).length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Selecciona un estilo para tu web</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(templates).map(([key, template]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect?.(key)}
            className={`text-left border rounded-lg p-4 transition-all ${
              selectedTemplate === key
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <h3 className="font-medium text-lg">{template.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{template.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WebTemplateGallery;
