/**
 * 🎨 Componente: DynamicField
 *
 * Renderiza campos de formulario dinámicos según su tipo.
 * Soporta: select, boolean, text, textarea, number, multi-select
 */

import React from 'react';

export default function DynamicField({ field, value, onChange }) {
  const handleChange = (newValue) => {
    onChange(field.id, newValue);
  };

  // SELECT
  if (field.type === 'select') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          value={value || field.default || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={field.required}
        >
          <option value="">Selecciona una opción</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      </div>
    );
  }

  // BOOLEAN
  if (field.type === 'boolean') {
    const currentValue = value !== undefined ? value : field.default;
    return (
      <div className="mb-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={currentValue}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
        {field.helpText && <p className="mt-1 ml-7 text-xs text-gray-500">{field.helpText}</p>}
      </div>
    );
  }

  // TEXTAREA
  if (field.type === 'textarea') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={field.required}
        />
        {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      </div>
    );
  }

  // NUMBER
  if (field.type === 'number') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={field.required}
          />
          {field.suffix && (
            <span className="absolute right-3 top-2 text-gray-500">{field.suffix}</span>
          )}
        </div>
        {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      </div>
    );
  }

  // MULTI-SELECT
  if (field.type === 'multi-select') {
    const currentValue = value || field.default || [];
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {field.options.map((opt) => (
            <label key={opt.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentValue.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange([...currentValue, opt.value]);
                  } else {
                    handleChange(currentValue.filter((v) => v !== opt.value));
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      </div>
    );
  }

  // TEXT (default)
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required={field.required}
      />
      {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
    </div>
  );
}
