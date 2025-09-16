import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card, Button } from '../ui';
import { Plus, Edit3, Trash2, Download, Upload, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import Modal from '../Modal';
import TransactionForm from './TransactionForm';

/**
 * Componente para gestiÃƒÆ’Ã‚Â³n de transacciones
 * Incluye lista, filtros, formularios y acciones masivas
 */
export default function TransactionManager({ 
  transactions, 
  onCreateTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onImportBank,
  isLoading 
}) {
  // Estados para filtros y modales
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankId, setBankId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const fileInputRef = useRef(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const handleClickImportCSV = () => fileInputRef.current?.click();

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = {
      date: header.findIndex(h => /fecha|date/.test(h)),
      desc: header.findIndex(h => /concepto|descripcion|descripciÃƒÂ³n|description/.test(h)),
      amount: header.findIndex(h => /importe|monto|amount/.test(h)),
      type: header.findIndex(h => /tipo|type/.test(h)),
      category: header.findIndex(h => /categoria|categorÃƒÂ­a|category/.test(h)),
    };
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (!cols.some(c => c && c.trim())) continue;
      const rawAmount = Number((cols[idx.amount] || '').replace(/[^0-9.-]/g, '')) || 0;
      let type = cols[idx.type]?.toLowerCase() || '';
      if (!type) type = rawAmount < 0 ? 'expense' : 'income';
      if (type.includes('gasto') || type === 'expense') type = 'expense';
      if (type.includes('ingreso') || type === 'income') type = 'income';
      out.push({
        date: (cols[idx.date] || '').slice(0, 10),
        concept: cols[idx.desc] || '',
        amount: Math.abs(rawAmount),
        type,
        category: cols[idx.category] || 'OTROS',
        source: 'csv',
      });
    }
    return out;
  };

  const handleCSVSelected = useCallback(async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setCsvLoading(true);
      const text = await file.text();
      const rows = parseCSV(text);
      for (const row of rows) {
        // eslint-disable-next-line no-await-in-loop
        await onCreateTransaction(row);
      }
      alert(`Importadas ${rows.length} transacciones del CSV`);
    } catch (err) {
      console.error('CSV import error', err);
      alert('No se pudo importar el CSV');
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onCreateTransaction]);

  // Transacciones filtradas
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.concept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || transaction.type === typeFilter;
      const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  // CategorÃƒÆ’Ã‚Â­as ÃƒÆ’Ã‚Âºnicas para el filtro
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [transactions]);

  // EstadÃƒÆ’Ã‚Â­sticas de transacciones filtradas
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Manejar apertura de modal para nueva transacciÃƒÆ’Ã‚Â³n
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  // Manejar apertura de modal para editar transacciÃƒÆ’Ã‚Â³n
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Manejar guardado de transacciÃƒÆ’Ã‚Â³n
  const handleSaveTransaction = async (transactionData) => {
    try {
      let result;
      if (editingTransaction) {
        result = await onUpdateTransaction(editingTransaction.id, transactionData);
      } else {
        result = await onCreateTransaction(transactionData);
      }
      
      if (result.success) {
        setShowTransactionModal(false);
        setEditingTransaction(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando transacciÃƒÆ’Ã‚Â³n:', error);
      alert('Error inesperado al guardar la transacciÃƒÆ’Ã‚Â³n');
    }
  };

  // Manejar eliminaciÃƒÆ’Ã‚Â³n de transacciÃƒÆ’Ã‚Â³n
  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm(`Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡s seguro de eliminar la transacciÃƒÆ’Ã‚Â³n "${transaction.concept}"?`)) {
      const result = await onDeleteTransaction(transaction.id);
      if (!result.success) {
        alert(`Error eliminando transacciÃƒÆ’Ã‚Â³n: ${result.error}`);
      }
    }
  };

  // Exportar transacciones a CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Concepto', 'Tipo', 'CategorÃƒÆ’Ã‚Â­a', 'Monto'];
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.concept || t.description || ''}"`,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category || '',
        t.amount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Transacciones</h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            {stats.count} transacciones ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Balance: {formatCurrency(stats.balance)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={() => setShowBankModal(true)}
            disabled={isLoading}
          >
            Conectar Banco (Nordigen)
          </Button>
          <Button
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={handleClickImportCSV}
            disabled={isLoading || csvLoading}
          >
            Importar CSV
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={handleAddTransaction}
          >
            Nueva TransacciÃƒÆ’Ã‚Â³n
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* BÃƒÆ’Ã‚Âºsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text)]/40" />
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>

          {/* Filtro por categorÃƒÆ’Ã‚Â­a */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
          >
            <option value="">Todas las categorÃƒÆ’Ã‚Â­as</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Limpiar filtros */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setCategoryFilter('');
            }}
            className="w-full"
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Input oculto para CSV manual */}
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleCSVSelected}
      />

      {/* Lista de transacciones */}
      <Card className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[color:var(--color-text)]/60">No hay transacciones que mostrar</p>
            <Button
              className="mt-4"
              onClick={handleAddTransaction}
              leftIcon={<Plus size={16} />}
            >
              Crear primera transacciÃƒÆ’Ã‚Â³n
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    CategorÃƒÆ’Ã‚Â­a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--color-surface)] divide-y divide-[color:var(--color-text)]/10">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[var(--color-accent)]/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[color:var(--color-text)]">
                      <div className="max-w-xs truncate">
                        {transaction.concept || transaction.description || 'Sin concepto'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]/60">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category || 'Sin categorÃƒÆ’Ã‚Â­a'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-[var(--color-success)]/15 text-[color:var(--color-success)]' 
                          : 'bg-[var(--color-danger)]/15 text-[color:var(--color-danger)]'
                      }`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      transaction.type === 'income' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-[var(--color-primary)] hover:brightness-110"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction)}
                          className="text-[color:var(--color-danger)] hover:brightness-110"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de formulario de transacciÃƒÆ’Ã‚Â³n */}


      {/* Modal de importaciÃƒÂ³n bancaria */}
      <Modal
        open={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Importar movimientos bancarios"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Bank ID (cuenta)</label>
              <input
                type="text"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                placeholder="e.g. 1234abcd"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBankModal(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                try {
                  const res = await onImportBank({ bankId: bankId || undefined, from: dateFrom || undefined, to: dateTo || undefined });
                  if (!res?.success) alert(res?.error || 'No se pudieron importar movimientos');
                  else setShowBankModal(false);
                } catch (e) {
                  alert('Error importando movimientos');
                }
              }}
              disabled={isLoading}
            >
              Importar
            </Button>
          </div>
          <p className="text-xs text-gray-500">Requiere configurar `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY` (frontend) y `NORDIGEN_*` en el backend.</p>
        </div>
      </Modal>
      <Modal
        open={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Editar TransacciÃƒÆ’Ã‚Â³n' : 'Nueva TransacciÃƒÆ’Ã‚Â³n'}
        size="lg"
      >
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
