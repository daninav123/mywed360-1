/**
 * MoodBoard - Tablero de inspiración visual
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */
import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Type } from 'lucide-react';
import { toast } from 'react-toastify';

const MoodBoardItem = ({ item, onDelete, onEdit }) => {
  if (item.type === 'image') {
    return (
      <div className="relative group aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <img
          src={item.url}
          alt={item.caption || 'Inspiration'}
          className="w-full h-full object-cover"
        />
        {item.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium">{item.caption}</p>
          </div>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (item.type === 'note') {
    return (
      <div className="relative group p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <p className="text-gray-800 text-sm whitespace-pre-wrap">{item.text}</p>
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
};

const AddItemModal = ({ onAdd, onClose }) => {
  const [activeTab, setActiveTab] = useState('image');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeTab === 'image') {
      if (!imageUrl) {
        toast.error('Añade una URL de imagen');
        return;
      }
      onAdd({
        type: 'image',
        url: imageUrl,
        caption: caption.trim(),
      });
    } else {
      if (!noteText.trim()) {
        toast.error('Escribe una nota');
        return;
      }
      onAdd({
        type: 'note',
        text: noteText.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Añadir inspiración</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                activeTab === 'image'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <ImageIcon className="w-5 h-5 mx-auto mb-1" />
              Imagen
            </button>
            <button
              onClick={() => setActiveTab('note')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                activeTab === 'note'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <Type className="w-5 h-5 mx-auto mb-1" />
              Nota
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'image' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la imagen
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ej: Decoración mesa principal"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota de inspiración
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ej: Quiero centros de mesa con velas y flores silvestres..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Añadir
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function MoodBoard({ items = [], onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddItem = useCallback((newItem) => {
    const item = {
      ...newItem,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...items, item];
    onUpdate(updated);
    toast.success('Inspiración añadida');
  }, [items, onUpdate]);

  const handleDeleteItem = useCallback((itemId) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    
    const updated = items.filter(item => item.id !== itemId);
    onUpdate(updated);
    toast.success('Elemento eliminado');
  }, [items, onUpdate]);

  const handleClearAll = useCallback(() => {
    if (!confirm('¿Borrar todo el mood board?')) return;
    
    onUpdate([]);
    toast.success('Mood board limpiado');
  }, [onUpdate]);

  const imageCount = items.filter(i => i.type === 'image').length;
  const noteCount = items.filter(i => i.type === 'note').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Mood Board</h3>
          <p className="text-sm text-gray-600">
            {items.length === 0 
              ? 'Comienza añadiendo imágenes y notas de inspiración'
              : `${imageCount} imagen${imageCount !== 1 ? 'es' : ''} • ${noteCount} nota${noteCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Añadir
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            Crea tu mood board
          </h4>
          <p className="text-sm text-gray-600 mb-6">
            Reúne imágenes y notas de inspiración para visualizar tu boda ideal
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Comenzar mood board
          </button>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">💡 Sugerencias de búsqueda:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'wedding decoration',
                'bridal bouquet',
                'table centerpieces',
                'wedding cake',
                'ceremony arch',
                'reception setup',
              ].map((term, idx) => (
                <a
                  key={idx}
                  href={`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(term)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {term}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <MoodBoardItem
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>💡 Consejo:</strong> Guarda imágenes de Pinterest, Instagram o revistas de bodas. 
          Esto te ayudará a comunicar tu visión a los proveedores.
        </p>
      </div>

      {showAddModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
