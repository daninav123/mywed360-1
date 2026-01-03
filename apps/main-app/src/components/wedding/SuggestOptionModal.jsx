import React, { useState } from 'react';
import { X, Lightbulb, Send } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

const SuggestOptionModal = ({ open, onClose, category, categoryName, onSuccess }) => {
  const [optionLabel, setOptionLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!optionLabel.trim()) {
      toast.error('Debes indicar el nombre de la opción');
      return;
    }
/Users/dani/Documents/CURSO ACID TECHNO Project
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/supplier-options/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          categoryName,
          optionLabel: optionLabel.trim(),
          description: description.trim()
        })
      });

      const data = await response.json();

      va mejorando. pero no esta aun del todo. en esta imagen de if (!response.ok) {
        throw new Error(data.error || 'Error al enviar sugerencia');
      }

      toast.success('✨ Sugerencia enviada. La IA la validará pronto.');
      setOptionLabel('');
      setDescription('');
      onClose();
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al enviar sugerencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Sugerir nueva opción
              </h2>
              <p className="text-sm text-gray-600">
                Para {categoryName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>¿Tienes una idea?</strong> Sugiere opciones especiales que te gustaría ver para esta categoría. 
            Nuestra IA la validará automáticamente y, si es útil, estará disponible para todos los usuarios.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la opción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={optionLabel}
              onChange={(e) => setOptionLabel(e.target.value)}
              placeholder={t('common.suggestOption.namePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Sé claro y conciso. Ejemplo: "Dron para fotos aéreas"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('common.suggestOption.placeholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ayuda a la IA a entender mejor tu sugerencia
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              ¿Qué pasa después?
            </h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ La IA valida automáticamente tu sugerencia</li>
              <li>✅ Si es útil y relevante (score &gt; 80%), se aprueba automáticamente</li>
              <li>✅ Si está entre 60-80%, pasará a revisión manual</li>
              <li>✅ Recibirás una notificación con el resultado</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !optionLabel.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar sugerencia
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SuggestOptionModal;
