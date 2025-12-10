import React, { useState, useEffect } from 'react';
import WebRenderer from '../renderer/WebRenderer';
import { DragDropProvider, DroppableContainer, DraggableSection } from './DragDropProvider';
import ColorPickerPanel from './ColorPickerPanel';
import FontSelectorPanel from './FontSelectorPanel';

/**
 * SplitViewEditor - Editor con vista dividida (editor + preview)
 */
const SplitViewEditor = ({ config, onChange, onDragEnd }) => {
  const [activeTab, setActiveTab] = useState('secciones');
  const [previewKey, setPreviewKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Actualizar el preview cuando cambia la configuración
  useEffect(() => {
    setPreviewKey((prev) => prev + 1);
    setLastUpdate(new Date().toLocaleTimeString());
    console.log('🔄 Preview actualizado:', {
      key: previewKey + 1,
      secciones: config?.secciones?.length,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [config]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
      {/* LADO IZQUIERDO: EDITOR */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('secciones')}
            className={`
              flex-1 px-4 py-3 font-semibold transition-colors
              ${
                activeTab === 'secciones'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            📑 Secciones
          </button>
          <button
            onClick={() => setActiveTab('colores')}
            className={`
              flex-1 px-4 py-3 font-semibold transition-colors
              ${
                activeTab === 'colores'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            🎨 Colores
          </button>
          <button
            onClick={() => setActiveTab('fuentes')}
            className={`
              flex-1 px-4 py-3 font-semibold transition-colors
              ${
                activeTab === 'fuentes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            ✍️ Fuentes
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'secciones' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4">📑 Secciones</h3>
              <p className="text-sm text-gray-600 mb-4">
                Arrastra para reordenar, haz click para editar
              </p>

              <DragDropProvider onDragEnd={onDragEnd}>
                <DroppableContainer droppableId="sections">
                  {config.secciones.map((seccion, idx) => (
                    <DraggableSection key={seccion.id} id={String(seccion.id)} index={idx}>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {seccion.tipo === 'hero' && '🎯 Portada'}
                            {seccion.tipo === 'story' && '📖 Historia'}
                            {seccion.tipo === 'eventInfo' && '📅 Evento'}
                            {seccion.tipo === 'photoGallery' && '📸 Galería'}
                            {seccion.tipo === 'rsvp' && '✅ Confirmación'}
                            {seccion.tipo === 'map' && '🗺️ Mapa'}
                            {seccion.tipo === 'timeline' && '⏱️ Timeline'}
                            {seccion.tipo === 'giftList' && '🎁 Regalos'}
                          </h4>
                          <button
                            onClick={() => {
                              console.log(
                                '👁️ Toggle visibilidad:',
                                seccion.id,
                                'visible:',
                                seccion.visible
                              );

                              // Toggle visibilidad
                              const nuevasSecciones = config.secciones.map((s) =>
                                s.id === seccion.id ? { ...s, visible: !s.visible } : s
                              );
                              const nuevaConfig = {
                                ...config,
                                secciones: nuevasSecciones,
                                meta: {
                                  ...config.meta,
                                  updatedAt: new Date().toISOString(),
                                },
                              };

                              console.log('📤 Enviando nueva config:', {
                                seccionId: seccion.id,
                                nuevaVisibilidad: !seccion.visible,
                                totalSecciones: nuevasSecciones.length,
                              });

                              onChange(nuevaConfig);
                            }}
                            className={`
                              text-sm px-3 py-1 rounded font-semibold transition-all
                              ${
                                seccion.visible
                                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                              }
                            `}
                          >
                            {seccion.visible ? '👁️ Visible' : '🚫 Oculta'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Orden: {idx + 1}</p>
                      </div>
                    </DraggableSection>
                  ))}
                </DroppableContainer>
              </DragDropProvider>
            </div>
          )}

          {activeTab === 'colores' && <ColorPickerPanel config={config} onChange={onChange} />}

          {activeTab === 'fuentes' && <FontSelectorPanel config={config} onChange={onChange} />}
        </div>
      </div>

      {/* LADO DERECHO: PREVIEW */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">👁️ Vista Previa</h3>
          <p className="text-xs text-gray-600">Los cambios se ven en tiempo real</p>
        </div>

        <div className="flex-1 overflow-auto">
          <WebRenderer
            key={previewKey}
            config={config}
            editable={true}
            onSectionChange={onChange}
          />
        </div>

        {/* Footer con info */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">✨ Actualiza en tiempo real</p>
            {lastUpdate && <p className="text-green-600 font-semibold">🔄 {lastUpdate}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitViewEditor;
