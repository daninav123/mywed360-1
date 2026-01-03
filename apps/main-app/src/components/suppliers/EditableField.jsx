import React, { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Campo editable inline para corregir datos extraídos por IA
 * Permite al usuario validar y mejorar la precisión del análisis
 */
const EditableField = ({ 
  label, 
  value, 
  type = 'text',
  onSave,
  multiline = false,
  placeholder = '',
  isArray = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleSave = () => {
    if (editedValue !== value) {
      onSave(editedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const displayValue = () => {
    if (isArray && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'No especificado';
    }
    return value || 'No especificado';
  };

  if (!isEditing) {
    return (
      <div className="group relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
            <p className="text-sm text-gray-900 whitespace-pre-line">
              {displayValue()}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-100 rounded"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      {multiline ? (
        <textarea
          value={isArray ? editedValue.join('\n') : editedValue}
          onChange={(e) => {
            if (isArray) {
              setEditedValue(e.target.value.split('\n').filter(s => s.trim()));
            } else {
              setEditedValue(e.target.value);
            }
          }}
          className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={placeholder}
          rows={4}
          autoFocus
        />
      ) : (
        <input
          type={type}
          value={editedValue}
          onChange={(e) => setEditedValue(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={placeholder}
          autoFocus
        />
      )}
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Guardar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default EditableField;
