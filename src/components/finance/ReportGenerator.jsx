import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, Calendar, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

/**
 * Generador de reportes financieros en PDF y Excel
 */
const ReportGenerator = ({ transactions = [], weddingInfo = {} }) => {
  const { t } = useTranslations();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('summary'); // summary, detailed, supplier
  const [format, setFormat] = useState('pdf'); // pdf, excel
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [selectedSupplier, setSelectedSupplier] = useState('');

  // Obtener proveedores únicos
  const suppliers = [
    ...new Set(
      transactions.filter((t) => t.supplier || t.concept).map((t) => t.supplier || t.concept)
    ),
  ].sort();

  const generateReport = async () => {
    setGenerating(true);

    try {
      // Filtrar transacciones según criterios
      let filteredTransactions = [...transactions];

      if (dateRange.start) {
        filteredTransactions = filteredTransactions.filter(
          (t) => new Date(t.date) >= new Date(dateRange.start)
        );
      }

      if (dateRange.end) {
        filteredTransactions = filteredTransactions.filter(
          (t) => new Date(t.date) <= new Date(dateRange.end)
        );
      }

      if (selectedSupplier) {
        filteredTransactions = filteredTransactions.filter(
          (t) => t.supplier === selectedSupplier || t.concept === selectedSupplier
        );
      }

      // Generar según formato
      if (format === 'pdf') {
        await generatePDFReport(filteredTransactions);
      } else {
        await generateExcelReport(filteredTransactions);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(
        t(
          'finance.reports.generateError',
          'Error al generar el reporte. Por favor, intenta nuevamente.'
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  const generatePDFReport = async (data) => {
    // Importar jsPDF dinámicamente
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text('Reporte Financiero', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(weddingInfo.name || 'Mi Boda', pageWidth / 2, 28, { align: 'center' });

    if (dateRange.start || dateRange.end) {
      const rangeText = `Período: ${dateRange.start || 'Inicio'} - ${dateRange.end || 'Actual'}`;
      doc.text(rangeText, pageWidth / 2, 34, { align: 'center' });
    }

    // Resumen
    const totalExpenses = data
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = data
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    doc.setFontSize(12);
    doc.text('Resumen', 14, 45);

    doc.setFontSize(10);
    doc.text(`Total Gastos: €${totalExpenses.toFixed(2)}`, 14, 52);
    doc.text(`Total Ingresos: €${totalIncome.toFixed(2)}`, 14, 58);
    doc.text(`Balance: €${balance.toFixed(2)}`, 14, 64);

    // Tabla de transacciones
    const tableData = data.map((t) => [
      formatDate(t.date, 'short'),
      t.concept || t.description || '-',
      t.supplier || '-',
      t.type === 'expense' ? 'Gasto' : 'Ingreso',
      `€${t.amount.toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: 72,
      head: [['Fecha', 'Concepto', 'Proveedor', 'Tipo', 'Monto']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Generado el ${formatDate(new Date(), 'short')}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Descargar
    const fileName = `reporte-financiero-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  const generateExcelReport = async (data) => {
    // Importar xlsx dinámicamente
    const XLSX = await import('xlsx');

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    const summaryData = [
      ['Reporte Financiero'],
      [weddingInfo.name || 'Mi Boda'],
      [],
      ['Resumen'],
      [
        'Total Gastos',
        data.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      ],
      [
        'Total Ingresos',
        data.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      ],
      [
        'Balance',
        data.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
          data.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      ],
      [],
      ['Generado el', formatDate(new Date(), 'short')],
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Transacciones
    const transactionsData = [
      ['Fecha', 'Concepto', 'Proveedor', 'Tipo', 'Monto', 'Categoría'],
      ...data.map((t) => [
        formatDate(t.date, 'short'),
        t.concept || t.description || '-',
        t.supplier || '-',
        t.type === 'expense' ? 'Gasto' : 'Ingreso',
        t.amount,
        t.category || '-',
      ]),
    ];

    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transacciones');

    // Hoja 3: Por Proveedor (si hay datos)
    if (reportType === 'supplier' || suppliers.length > 0) {
      const supplierSummary = suppliers.map((supplier) => {
        const supplierTransactions = data.filter(
          (t) => t.supplier === supplier || t.concept === supplier
        );
        const total = supplierTransactions.reduce((sum, t) => sum + t.amount, 0);
        return [supplier, supplierTransactions.length, total];
      });

      const wsSuppliers = XLSX.utils.aoa_to_sheet([
        ['Proveedor', 'Transacciones', 'Total'],
        ...supplierSummary,
      ]);
      XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Por Proveedor');
    }

    // Descargar
    const fileName = `reporte-financiero-${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Generar Reporte</h2>
        <p className="text-sm text-gray-600 mt-1">Exporta tus datos financieros en PDF o Excel</p>
      </div>

      {/* Configuración */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Tipo de Reporte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'summary', label: 'Resumen' },
              { value: 'detailed', label: 'Detallado' },
              { value: 'supplier', label: 'Por Proveedor' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setReportType(value)}
                className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                  reportType === value
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Formato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat('pdf')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-colors ${
                format === 'pdf'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => setFormat('excel')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-colors ${
                format === 'excel'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Rango de Fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Rango de Fechas (Opcional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filtro por Proveedor */}
        {reportType === 'supplier' && suppliers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Proveedor (Opcional)
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Todos los proveedores</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Se incluirán:</strong> {transactions.length} transacciones en el reporte
        </p>
      </div>

      {/* Botón Generar */}
      <div className="flex justify-end">
        <Button
          onClick={generateReport}
          disabled={generating || transactions.length === 0}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generar Reporte
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReportGenerator;
