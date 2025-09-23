import PropTypes from 'prop-types';
import React from 'react';

function PropertyPanel({ element, updateElement }) {
  if (!element) {
    return <p className="text-sm text-gray-500">Selecciona un elemento para editar.</p>;
  }

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    updateElement((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-lg font-semibold">Propiedades</h3>
      {element.type === 'text' && (
        <>
          <label className="block text-xs text-gray-600">Contenido</label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={element.content}
            onChange={handleChange('content')}
          />
          <label className="block text-xs text-gray-600 mt-2">Tamaño fuente</label>
          <input
            type="number"
            className="w-full border px-2 py-1 rounded"
            value={element.fontSize || 16}
            onChange={(e) =>
              updateElement((prev) => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))
            }
          />
        </>
      )}
    </div>
  );
}

PropertyPanel.propTypes = {
  element: PropTypes.object,
  updateElement: PropTypes.func.isRequired,
};

export default PropertyPanel;
