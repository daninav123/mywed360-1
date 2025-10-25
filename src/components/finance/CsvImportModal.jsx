import React from 'react';

import Modal from '../Modal';
import { Button } from '../ui';
import { useTranslations } from '../../hooks/useTranslations';

export default function CsvImportModal({

  t,
  open,
  onClose,
  csvError,
  csvHeaders = [],
  csvRows = [],
  csvMapping,
  setCsvMapping,
  csvLoading,
  onImport,
}) {
  const { t } = useTranslations();

  const fields = [
    { key: 'date', label: t('finance.transactions.csv.date', { defaultValue: 'Fecha' }) },
    {
      key: 'desc',
      label: t('finance.transactions.csv.description', { defaultValue: t('common.descripcion') }),
    },
    {
      key: 'type',
      label: t('finance.transactions.csv.type', { defaultValue: 'Tipo (Ingreso/Gasto)' }),
    },
    {
      key: 'category',
      label: t('finance.transactions.csv.category', { defaultValue: t('common.categoria') }),
    },
    { key: 'amount', label: t('finance.transactions.csv.amount', { defaultValue: 'Monto' }) },
  ];

  const getCol = (row, i) => (i >= 0 && i < row.length ? row[i] : '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('finance.transactions.csv.title', {
        defaultValue: 'Importar CSV - Mapeo de columnas',
      })}
      size="lg"
    >
      <div className="space-y-4">
        {csvError && <p className="text-sm text-[color:var(--color-danger)]">{csvError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm text-[color:var(--color-text)]/70 mb-1">
                {label}
              </label>
              <select
                className="w-full border rounded px-2 py-1"
                value={csvMapping[key]}
                onChange={(e) => setCsvMapping((m) => ({ ...m, [key]: Number(e.target.value) }))}
              >
                <option value={-1}>
                  {t('finance.transactions.csv.unassigned', { defaultValue: 'No asignado' })}
                </option>
                {csvHeaders.map((h, i) => (
                  <option key={i} value={i}>
                    {h ||
                      `${t('finance.transactions.csv.column', { defaultValue: 'Columna' })} ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div>
          <div className="text-sm font-medium text-[color:var(--color-text)] mb-2">
            {t('finance.transactions.csv.preview', { defaultValue: 'Vista previa' })}
          </div>
          <div className="overflow-auto max-h-64 border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">
                    {t('finance.transactions.csv.date', { defaultValue: 'Fecha' })}
                  </th>
                  <th className="px-2 py-1 text-left">
                    {t('finance.transactions.csv.description', { defaultValue: t('common.descripcion') })}
                  </th>
                  <th className="px-2 py-1 text-left">
                    {t('finance.transactions.csv.type', { defaultValue: 'Tipo' })}
                  </th>
                  <th className="px-2 py-1 text-left">
                    {t('finance.transactions.csv.category', { defaultValue: t('common.categoria') })}
                  </th>
                  <th className="px-2 py-1 text-right">
                    {t('finance.transactions.csv.amount', { defaultValue: 'Monto' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 6).map((row, idx) => {
                  const rawAmount =
                    Number((getCol(row, csvMapping.amount) || '').replace(/[^0-9.-]/g, '')) || 0;
                  let type = (getCol(row, csvMapping.type) || '').toLowerCase();
                  if (!type) type = rawAmount < 0 ? 'expense' : 'income';
                  const typeLabel =
                    type.includes('gasto') || type === 'expense'
                      ? t('finance.transactions.expense', { defaultValue: 'Gasto' })
                      : t('finance.transactions.income', { defaultValue: 'Ingreso' });
                  return (
                    <tr
                      key={idx}
                      className={
                        idx % 2 ? 'bg-[var(--color-accent)]/10' : 'bg-[var(--color-surface)]'
                      }
                    >
                      <td className="px-2 py-1">
                        {(getCol(row, csvMapping.date) || '').slice(0, 10)}
                      </td>
                      <td className="px-2 py-1">{getCol(row, csvMapping.desc)}</td>
                      <td className="px-2 py-1">{typeLabel}</td>
                      <td className="px-2 py-1">{getCol(row, csvMapping.category) || 'OTROS'}</td>
                      <td className="px-2 py-1 text-right">{getCol(row, csvMapping.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button onClick={onImport} disabled={csvLoading}>
            {t('common.import', { defaultValue: 'Importar' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
