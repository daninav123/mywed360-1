import { FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import Modal from '../Modal';
import { Button, Input } from '../ui';

const FIELD_DEFS = [
  { key: 'concept', label: 'Concepto', required: true, examples: ['Concepto', 'Description'] },
  { key: 'amount', label: 'Importe', required: true, examples: ['Monto', 'Amount'] },
  { key: 'type', label: 'Tipo (Ingreso/Gasto)', required: false, examples: ['Tipo', 'Type'] },
  { key: 'status', label: 'Estado', required: false, examples: ['Estado', 'Status'] },
  { key: 'paidAmount', label: 'Importe pagado', required: false, examples: ['Pagado', 'Paid'] },
  { key: 'category', label: 'Categoría', required: false, examples: ['Categoría', 'Category'] },
  { key: 'provider', label: 'Proveedor', required: false, examples: ['Proveedor', 'Vendor'] },
  { key: 'dueDate', label: 'Fecha vencimiento', required: false, examples: ['Vencimiento', 'Due Date'] },
  { key: 'date', label: 'Fecha operación', required: false, examples: ['Fecha', 'Date'] },
  { key: 'paymentMethod', label: 'Método de pago', required: false, examples: ['Método', 'Payment Method'] },
  { key: 'description', label: 'Descripción/Notas', required: false, examples: ['Notas', 'Notes', 'Memo', 'Descripción'] },
];

const SUGGESTIONS = {
  concept: ['concept', 'concepto', 'description', 'detalle', 'descripcion', 'title', 'subject'],
  amount: ['amount', 'importe', 'monto', 'total', 'valor', 'value'],
  paidAmount: ['paid', 'pagado', 'pagada', 'paidamount', 'amount paid'],
  type: ['type', 'tipo', 'kind'],
  status: ['status', 'estado', 'state'],
  category: ['category', 'categoria', 'segmento', 'rubros'],
  provider: ['provider', 'proveedor', 'vendor', 'empresa'],
  dueDate: ['due', 'fecha venc', 'vencimiento', 'due date', 'deadline'],
  date: ['date', 'fecha', 'transaction date', 'posted'],
  paymentMethod: ['payment method', 'metodo', 'payment', 'forma de pago'],
  description: ['notes', 'nota', 'observaciones', 'memo', 'comentarios', 'descripcion', 'description'],
};

const normalizeHeader = (header) =>
  String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/_/g, ' ');

const AUTO_STATUS = {
  expense: 'pending',
  income: 'expected',
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const str = String(value).trim();
  if (!str) return null;
  const normalized = str
    .replace(/\s+/g, '')
    .replace(/[^0-9,.\-]/g, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateValue = (raw, XLSX) => {
  if (raw === undefined || raw === null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  if (typeof raw === 'number' && XLSX?.SSF) {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) {
      const date = new Date(
        parsed.y,
        (parsed.m || 1) - 1,
        parsed.d || 1,
        parsed.H || 0,
        parsed.M || 0,
        parsed.S || 0
      );
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  const str = String(raw).trim();
  if (!str) return null;
  const isoCandidate = new Date(str);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate.toISOString().slice(0, 10);
  }
  return null;
};

const autoMapHeaders = (headers = []) => {
  const map = {};
  headers.forEach((header) => {
    const normalized = normalizeHeader(header);
    for (const field of FIELD_DEFS) {
      if (map[field.key]) continue;
      const suggestions = SUGGESTIONS[field.key] || [];
      if (suggestions.some((keyword) => normalized.includes(keyword))) {
        map[field.key] = header;
      }
    }
  });
  return map;
};

const defaultOptions = {
  defaultType: 'expense',
  defaultStatusExpense: 'pending',
  defaultStatusIncome: 'expected',
};

export default function TransactionImportModal({
  open,
  onClose,
  onImport,
  isLoading,
}) {
  const [fileMeta, setFileMeta] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [options, setOptions] = useState(defaultOptions);
  const [error, setError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFileMeta(null);
      setHeaders([]);
      setRows([]);
      setFieldMap({});
      setOptions(defaultOptions);
      setError(null);
      setParsing(false);
      setSubmitting(false);
    }
  }, [open]);

  const loadXLSX = async () => {
    const mod = await import('xlsx');
    const XLSX = mod.default || mod;
    return XLSX;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const XLSX = await loadXLSX();
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        dateNF: 'yyyy-mm-dd',
      });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('No se encontró ninguna pestaña en el archivo.');
      const worksheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!Array.isArray(raw) || raw.length < 2) {
        throw new Error('El archivo no contiene filas suficientes.');
      }
      const [headerRow, ...dataRows] = raw;
      const cleanHeaders = headerRow.map((h, idx) => {
        const label = String(h || `Columna ${idx + 1}`).trim();
        return label || `Columna ${idx + 1}`;
      });
      const tableRows = dataRows
        .map((row) => {
          const obj = {};
          cleanHeaders.forEach((header, idx) => {
            obj[header] = row[idx];
          });
          return obj;
        })
        .filter((row) => Object.values(row).some((value) => value !== '' && value !== null));

      setFileMeta({ name: file.name, size: file.size });
      setHeaders(cleanHeaders);
      setRows(tableRows);
      setFieldMap((prev) => ({ ...autoMapHeaders(cleanHeaders), ...prev }));
      setError(null);
    } catch (err) {
      console.error('[TransactionImportModal] parse error', err);
      setFileMeta(null);
      setHeaders([]);
      setRows([]);
      setFieldMap({});
      setError(err?.message || 'No se pudo leer el archivo.');
    } finally {
      setParsing(false);
    }
  };

  const mappedPreview = useMemo(() => {
    if (!rows.length || !headers.length) return [];
    return rows.slice(0, 5).map((row, index) => {
      const previewRow = { '#': index + 1 };
      FIELD_DEFS.forEach((field) => {
        const column = fieldMap[field.key];
        if (column) previewRow[field.label] = row[column];
      });
      return previewRow;
    });
  }, [rows, headers, fieldMap]);

  const requiredMissing = useMemo(() => {
    return FIELD_DEFS.some(
      (field) => field.required && (!fieldMap[field.key] || !headers.includes(fieldMap[field.key]))
    );
  }, [fieldMap, headers]);

  const handleImport = async () => {
    if (!onImport || !rows.length) return;
    setSubmitting(true);
    try {
      const XLSX = await loadXLSX();
      const normalized = rows
        .map((row, index) => {
          const getValue = (fieldKey) => {
            const column = fieldMap[fieldKey];
            if (!column) return undefined;
            return row[column];
          };

          const conceptRaw = getValue('concept');
          const concept = conceptRaw ? String(conceptRaw).trim() : `Importado ${index + 1}`;

          const amountRaw = getValue('amount');
          const amount = parseNumber(amountRaw);
          if (amount === null) return null;

          const typeRaw = String(getValue('type') || '').toLowerCase();
          let type = options.defaultType;
          if (typeRaw.includes('ingreso') || typeRaw.includes('income') || amount > 0) {
            type = 'income';
          } else if (typeRaw.includes('gasto') || typeRaw.includes('expense') || amount < 0) {
            type = 'expense';
          }

          const statusRaw = String(getValue('status') || '').toLowerCase();
          let status = type === 'income' ? options.defaultStatusIncome : options.defaultStatusExpense;
          if (statusRaw.includes('paid') || statusRaw.includes('pag') || statusRaw.includes('recib')) {
            status = type === 'income' ? 'received' : 'paid';
          } else if (statusRaw.includes('partial') || statusRaw.includes('parcial')) {
            status = 'partial';
          } else if (statusRaw.includes('expected') || statusRaw.includes('previsto')) {
            status = type === 'income' ? 'expected' : 'pending';
          }

          const paidRaw = getValue('paidAmount');
          const paidAmount = parseNumber(paidRaw);
          const category = String(getValue('category') || '').trim();
          const provider = String(getValue('provider') || '').trim();
          const dueDate = parseDateValue(getValue('dueDate'), XLSX);
          const dateValue = parseDateValue(getValue('date'), XLSX);
          const paymentMethod = String(getValue('paymentMethod') || '').trim();
          const description = String(getValue('description') || '').trim();

          const absAmount = Math.abs(amount);
          return {
            concept,
            amount: absAmount,
            type,
            status,
            paidAmount: paidAmount !== null ? Math.abs(paidAmount) : undefined,
            category: category || undefined,
            provider: provider || undefined,
            dueDate: dueDate || undefined,
            date: dateValue || undefined,
            paymentMethod: paymentMethod || undefined,
            description: description || undefined,
            meta: { source: 'import-csv' },
          };
        })
        .filter(Boolean);

      if (!normalized.length) {
        setError('No se detectaron filas válidas para importar.');
        return;
      }

      const result = await onImport(normalized, { file: fileMeta, headers });
      if (result?.success) {
        onClose?.();
      } else if (result?.errors?.length) {
        setError(
          `${result.imported || 0} filas importadas, ${result.errors.length} con errores. Revisa el archivo.`
        );
      }
    } catch (err) {
      console.error('[TransactionImportModal] import error', err);
      setError(err?.message || 'No se pudo completar la importación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar transacciones"
      size="lg"
      className="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="border border-dashed border-[color:var(--color-primary)]/40 rounded-lg p-4">
          <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-center text-sm text-[color:var(--color-text)]/70">
            <Upload className="w-6 h-6 text-[color:var(--color-primary)]" />
            <span>
              Selecciona un archivo CSV o Excel (.csv, .xls, .xlsx). La primera fila debe contener los encabezados.
            </span>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={parsing || isLoading || submitting}
              className="hidden"
            />
            {fileMeta && (
              <span className="text-xs text-[color:var(--color-text)]/50">
                {fileMeta.name} · {(fileMeta.size / 1024).toFixed(1)} KB
              </span>
            )}
          </label>
        </div>

        {(parsing || submitting) && (
          <div className="flex items-center text-sm text-[color:var(--color-text)]/70 gap-2">
            <FileSpreadsheet className="w-4 h-4 animate-pulse" />
            {parsing ? 'Leyendo archivo…' : 'Procesando filas…'}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-[color:var(--color-danger)] bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30 rounded-md">
            <XCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {headers.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_DEFS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[color:var(--color-text)]/80">
                    {field.label}
                    {field.required && <span className="text-[color:var(--color-danger)]">*</span>}
                  </label>
              <select
                className="block w-full rounded-md border border-[color:var(--color-text)]/20 px-3 py-2 text-sm bg-white text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40"
                value={fieldMap[field.key] || ''}
                onChange={(event) =>
                  setFieldMap((prev) => ({
                    ...prev,
                    [field.key]: event.target.value || undefined,
                  }))
                }
                disabled={isLoading || submitting}
              >
                <option value="">-- Sin asignar --</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
                  {!!field.examples?.length && (
                    <p className="text-xs text-[color:var(--color-text)]/50">
                      Ejemplos: {field.examples.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[color:var(--color-text)]/80">
                  Tipo por defecto
                </label>
                <select
                  className="block w-full rounded-md border border-[color:var(--color-text)]/20 px-3 py-2 text-sm bg-white text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40"
                  value={options.defaultType}
                  onChange={(event) =>
                    setOptions((prev) => ({ ...prev, defaultType: event.target.value }))
                  }
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[color:var(--color-text)]/80">
                  Estado por defecto (gastos)
                </label>
                <select
                  className="block w-full rounded-md border border-[color:var(--color-text)]/20 px-3 py-2 text-sm bg-white text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40"
                  value={options.defaultStatusExpense}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      defaultStatusExpense: event.target.value,
                    }))
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="partial">Pagado parcial</option>
                  <option value="paid">Pagado</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[color:var(--color-text)]/80">
                  Estado por defecto (ingresos)
                </label>
                <select
                  className="block w-full rounded-md border border-[color:var(--color-text)]/20 px-3 py-2 text-sm bg-white text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40"
                  value={options.defaultStatusIncome}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      defaultStatusIncome: event.target.value,
                    }))
                  }
                >
                  <option value="expected">Previsto</option>
                  <option value="received">Recibido</option>
                </select>
              </div>
            </div>
          </>
        )}

        {mappedPreview.length > 0 && (
          <div className="border rounded-lg border-[color:var(--color-text)]/10 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold bg-[color:var(--color-text)]/5 text-[color:var(--color-text)]/70">
              Vista previa (primeras {mappedPreview.length} filas)
            </div>
            <div className="overflow-auto max-h-60 text-xs">
              <table className="min-w-full divide-y divide-[color:var(--color-text)]/10">
                <thead className="bg-[color:var(--color-surface)]/80">
                  <tr>
                    {Object.keys(mappedPreview[0]).map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-medium text-[color:var(--color-text)]/70"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-text)]/10">
                  {mappedPreview.map((row) => (
                    <tr key={row['#']}>
                      {Object.entries(row).map(([col, value]) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-[color:var(--color-text)]/80">
                          {value === undefined || value === null || value === ''
                            ? '—'
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-[color:var(--color-text)]/60">
            Se importarán {rows.length} filas. Los campos obligatorios deben estar mapeados.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting || isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={requiredMissing || submitting || isLoading || parsing}
            >
              Importar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
