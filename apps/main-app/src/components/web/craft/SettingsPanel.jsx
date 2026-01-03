import React from 'react';
import { useEditor } from '@craftjs/core';

/**
 * SettingsPanel - Panel de configuración para el componente seleccionado
 */
export const SettingsPanel = () => {
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return { selected };
  });

  return (
    <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-gray-900 text-lg">⚙️ Propiedades</h2>
        <p className="text-xs text-gray-600 mt-1">
          {selected ? `Editando: ${selected.name}` : 'Selecciona un componente'}
        </p>
      </div>

      <div className="p-4">
        {selected ? (
          <>
            {/* Renderizar settings del componente */}
            {selected.settings && React.createElement(selected.settings)}

            {/* Botón eliminar */}
            {selected.isDeletable && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => actions.delete(selected.id)}
                  className="
                    w-full px-4 py-2 bg-red-600 text-white rounded-lg
                    hover:bg-red-700 transition-colors font-semibold
                  "
                >
                  🗑️ Eliminar Componente
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👆</div>
            <p className="text-gray-600">
              Selecciona un componente en el canvas para ver sus propiedades
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
