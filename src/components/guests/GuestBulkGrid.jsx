import React, { useState, useCallback } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { Button } from '../ui';
import { Input } from '../ui';

// Cabeceras estándar que soporta el pegado desde Excel / Sheets
const DEFAULT_COLUMNS = [
  { key: 'name', label: 'Nombre *', required: true },
  { key: 'email', label: 'Email *', required: true },
  { key: 'phone', label: t('common.telefono') },
  { key: 'companions', label: t('common.acompanantes'), type: 'number', min: 0, max: 10 },
  { key: 'table', label: 'Mesa' },
];

/**
 * Grid estilo Excel para alta masiva de invitados.
 * Permite pegar desde el portapapeles, edición inline y validación básica.
 *
 * Props:
 *  - onCancel(): cierre del grid
 *  - onSave(guests[]): callback con lista validada
 */
const GuestBulkGrid = ({ onCancel, onSave, isLoading = false }) => {
  const { t } = useTranslations();
  const [rows, setRows] = useState([{ id: 0 }]);
  const [errors, setErrors] = useState({});

  // Añadir fila vacía
  const addRow = () => setRows((r) => [...r, { id: Date.now() }]);

  // Eliminar fila
  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  // Manejar cambio celda
  const handleCellChange = (idx, key, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  // Pegado desde clipboard (tab o coma separada)
  const handlePaste = useCallback(
    (e) => {
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;

      const parsed = text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.split(/[\t,]/));

      const newRows = parsed.map((cols, idx) => {
        const obj = { id: Date.now() + idx };
        DEFAULT_COLUMNS.forEach((col, i) => {
          obj[col.key] = cols[i] ? cols[i].trim() : '';
        });
        return obj;
      });
      setRows(newRows);
    },
    [setRows]
  );

  // Validación simple por fila
  const validate = () => {
    const newErrors = {};
    rows.forEach((row, idx) => {
      DEFAULT_COLUMNS.forEach((col) => {
        if (col.required && !row[col.key]) {
          newErrors[`${idx}-${col.key}`] = t('forms.fieldRequired');
        }
      });
      // Email rudimentario
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        newErrors[`${idx}-email`] = t('forms.invalidEmail');
      }
      if (row.phone && !/^\+[1-9]\d{7,14}$/.test(String(row.phone).replace(/\s+/g, ''))) {
        newErrors[`${idx}-phone`] = t('forms.invalidPhone');
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const cleanRows = rows.map((r) => ({
      name: r.name?.trim(),
      email: r.email?.trim(),
      phone: r.phone?.trim(),
      companion: parseInt(r.companions, 10) || 0,
      table: r.table?.trim(),
    }));
    onSave?.(cleanRows);
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <p className="text-sm text-muted">
        Pega datos desde Excel/Sheets o edítalos manualmente. Columnas esperadas:
        {DEFAULT_COLUMNS.map((c) => ` ${c.label}`).join(', ')}.
      </p>

      <div className="overflow-auto border rounded-md max-h-[60vh] relative">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b">
            <tr>
              {DEFAULT_COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.id} className="border-b last:border-0">
                {DEFAULT_COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-1">
                    <Input
                      type={col.type || 'text'}
                      min={col.min}
                      max={col.max}
                      value={row[col.key] || ''}
                      onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
                      className={errors[`${rowIdx}-${col.key}`] ?'border-red-500' : ''}
                      disabled={isLoading}
                    />
                    {errors[`${rowIdx}-${col.key}`] && (
                      <p className="text-xs text-red-500">{errors[`${rowIdx}-${col.key}`]}</p>
                    )}
                  </td>
                ))}
                <td className="px-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIdx)}
                    disabled={isLoading}
                    className="text-muted hover:text-red-600"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={addRow} disabled={isLoading}>
          + Añadir fila
        </Button>
        <div className="space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('app.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {t('app.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestBulkGrid;
