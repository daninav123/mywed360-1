import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Componente para importar transacciones desde CSV/Excel
 * con preview y mapeo de columnas
 */
const ImportTransactions = ({ onImportComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    concept: '',
    amount: '',
    type: ''
  });
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Formato no válido. Por favor, sube un archivo CSV o Excel (.xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setError('');
    parseFile(selectedFile);
  };

  const parseFile = async (file) => {
    setParsing(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('El archivo está vacío');
      }

      // Primera línea como headers
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/['"]/g, ''));
      
      // Parsear primeras 5 filas como preview
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(/[,;\t]/).map(v => v.trim().replace(/['"]/g, ''));
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      setPreviewData({ headers, rows, totalRows: lines.length - 1 });

      // Auto-detectar columnas
      autoDetectColumns(headers);
    } catch (err) {
      // console.error('Error parsing file:', err);
      setError(`Error al procesar el archivo: ${err.message}`);
      setPreviewData(null);
    } finally {
      setParsing(false);
    }
  };

  const autoDetectColumns = (headers) => {
    const mapping = { date: '', concept: '', amount: '', type: '' };

    headers.forEach(header => {
      const lower = header.toLowerCase();
      
      if (!mapping.date && (lower.includes('fecha') || lower.includes('date'))) {
        mapping.date = header;
      }
      if (!mapping.concept && (lower.includes('concepto') || lower.includes('description') || lower.includes('descripción'))) {
        mapping.concept = header;
      }
      if (!mapping.amount && (lower.includes('monto') || lower.includes('amount') || lower.includes('importe') || lower.includes('cantidad'))) {
        mapping.amount = header;
      }
      if (!mapping.type && (lower.includes('tipo') || lower.includes('type') || lower.includes('category'))) {
        mapping.type = header;
      }
    });

    setColumnMapping(mapping);
  };

  const handleImport = async () => {
    if (!file || !previewData) return;

    // Validar que todas las columnas obligatorias estén mapeadas
    if (!columnMapping.date || !columnMapping.concept || !columnMapping.amount) {
      setError('Debes mapear al menos Fecha, Concepto y Monto');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/['"]/g, ''));

      const transactions = lines.slice(1).map(line => {
        const values = line.split(/[,;\t]/).map(v => v.trim().replace(/['"]/g, ''));
        const row = headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});

        return {
          date: row[columnMapping.date],
          concept: row[columnMapping.concept],
          amount: parseFloat(row[columnMapping.amount].replace(/[^0-9.-]/g, '')) || 0,
          type: row[columnMapping.type] || 'expense',
          imported: true,
          importedAt: new Date().toISOString()
        };
      }).filter(t => t.date && t.concept && t.amount); // Filtrar filas inválidas

      if (transactions.length === 0) {
        throw new Error('No se encontraron transacciones válidas');
      }

      // Llamar callback con las transacciones
      if (onImportComplete) {
        await onImportComplete(transactions);
      }
    } catch (err) {
      // console.error('Error importing transactions:', err);
      setError(`Error al importar: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Importar Transacciones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Sube un archivo CSV o Excel con tus transacciones
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* File Upload */}
      {!previewData && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={parsing}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {parsing ? (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 animate-pulse">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">Procesando archivo...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-700 font-medium mb-1">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-sm text-gray-500">
                  CSV, Excel (.xlsx, .xls)
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{file?.name}</p>
                <p className="text-xs text-blue-700">
                  {previewData.totalRows} filas detectadas
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setColumnMapping({ date: '', concept: '', amount: '', type: '' });
              }}
            >
              Cambiar archivo
            </Button>
          </div>

          {/* Column Mapping */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Mapeo de Columnas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'date', label: 'Fecha *', required: true },
                { key: 'concept', label: 'Concepto *', required: true },
                { key: 'amount', label: 'Monto *', required: true },
                { key: 'type', label: 'Tipo', required: false }
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <select
                    value={columnMapping[key]}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    required={required}
                  >
                    <option value="">Seleccionar...</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">
                Vista previa (primeras 5 filas)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {previewData.headers.map(header => (
                      <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      {previewData.headers.map(header => (
                        <td key={header} className="px-4 py-2 text-gray-600">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={importing || !columnMapping.date || !columnMapping.concept || !columnMapping.amount}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importar {previewData.totalRows} transacciones
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTransactions;
