import React, { useState, useMemo, useRef, useCallback, useDeferredValue } from 'react';
import { Card, Button } from '../ui';
import { Plus, Edit3, Trash2, Download, Upload, Search, AlertTriangle, Paperclip } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import Modal from '../Modal';
import TransactionForm from './TransactionForm';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';

export default function TransactionManager({ 
  transactions = [], 
  onCreateTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onImportBank,
  isLoading 
}) {
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateRange, setDateRange] = useState(''); // '', '30', '90'
  const [onlyUncategorized, setOnlyUncategorized] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc','date_asc','amount_desc','amount_asc'
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [showBankModal, setShowBankModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fileInputRef = useRef(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [csvMapping, setCsvMapping] = useState({ date: -1, desc: -1, amount: -1, type: -1, category: -1 });
  const [csvError, setCsvError] = useState('');
  // react-window handles scroll; previous manual virtualization removed

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const msInDay = 24*60*60*1000;
    const minDate = dateRange ? new Date(now.getTime() - Number(dateRange) * msInDay) : null;
    let list = transactions.filter(t => {
      const haystack = [t.concept, t.description, t.provider].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = haystack.includes((deferredSearchTerm || '').toLowerCase());
      const matchesType = !typeFilter || t.type === typeFilter;
      const cat = t.category || '';
      const matchesCategory = !categoryFilter || cat === categoryFilter;
      const provider = t.provider || '';
      const matchesProvider = !providerFilter || provider === providerFilter;
      const matchesUncat = !onlyUncategorized || !cat;
      const matchesDate = !minDate || (t.date && new Date(t.date) >= minDate);
      return matchesSearch && matchesType && matchesCategory && matchesProvider && matchesUncat && matchesDate;
    });
    // Sort
    list.sort((a,b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      const aAmt = Number(a.amount) || 0;
      const bAmt = Number(b.amount) || 0;
      if (sortBy === 'date_desc') return bDate - aDate;
      if (sortBy === 'date_asc') return aDate - bDate;
      if (sortBy === 'amount_desc') return bAmt - aAmt;
      if (sortBy === 'amount_asc') return aAmt - bAmt;
      return 0;
    });
    return list;
  }, [transactions, deferredSearchTerm, typeFilter, categoryFilter, providerFilter, dateRange, onlyUncategorized, sortBy]);

  const categories = useMemo(() => {
    return [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
  }, [transactions]);

  const providers = useMemo(() => {
    return [...new Set(transactions.map(t => (t.provider || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  }, [transactions]);

  const getPaidValue = useCallback((transaction) => {
    if (!transaction) return 0;
    const type = transaction.type || 'expense';
    const status = transaction.status || (type === 'income' ? 'expected' : 'pending');
    const amount = Number(transaction.amount) || 0;
    const rawPaid = Number(transaction.paidAmount);
    let paid = Number.isFinite(rawPaid) ? rawPaid : 0;
    if (amount > 0) {
      paid = Math.min(Math.max(paid, 0), amount);
    } else {
      paid = Math.max(paid, 0);
    }
    if (type === 'expense' && status === 'paid' && paid === 0) return amount;
    if (type === 'income' && status === 'received' && paid === 0) return amount;
    return paid;
  }, []);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let pendingExpenses = 0;
    let overdueExpenses = 0;
    const now = new Date();

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;
      const paid = getPaidValue(transaction);

      if (transaction.type === 'income') {
        totalIncome += paid;
      } else {
        totalExpenses += paid;
        const outstanding = Math.max(0, amount - paid);
        if (outstanding > 0) {
          pendingExpenses += outstanding;
          if (transaction.dueDate) {
            const due = new Date(transaction.dueDate);
            if (!Number.isNaN(due.getTime()) && due < now && (transaction.status || '') !== 'paid') {
              overdueExpenses += outstanding;
            }
          }
        }
      }
    });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      count: filteredTransactions.length,
      pendingExpenses,
      overdueExpenses,
    };
  }, [filteredTransactions, getPaidValue]);

  const paymentAlerts = useMemo(() => {
    const now = new Date();
    const soonLimit = new Date();
    soonLimit.setDate(now.getDate() + 7);
    const overdue = [];
    const upcoming = [];

    filteredTransactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      if (!tx.dueDate || (tx.status && tx.status === 'paid')) return;
      const due = new Date(tx.dueDate);
      if (Number.isNaN(due.getTime())) return;
      if (due < now) overdue.push(tx);
      else if (due <= soonLimit) upcoming.push(tx);
    });

    return { overdue, upcoming };
  }, [filteredTransactions]);

  const statusLabels = {
    pending: t('finance.transactions.status.pending', { defaultValue: 'Pendiente' }),
    partial: t('finance.transactions.status.partial', { defaultValue: 'Pago parcial' }),
    paid: t('finance.transactions.status.paid', { defaultValue: 'Pagado' }),
    expected: t('finance.transactions.status.expected', { defaultValue: 'Esperado' }),
    received: t('finance.transactions.status.received', { defaultValue: 'Recibido' }),
  };
  const statusStyles = {
    pending: 'bg-amber-100 text-amber-800',
    partial: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    expected: 'bg-gray-100 text-gray-600',
    received: 'bg-green-100 text-green-700',
  };

  // Simple virtualization calculations
  // no virtualization constants required

  const handleAddTransaction = () => { setEditingTransaction(null); setShowTransactionModal(true); };
  const handleEditTransaction = (tx) => { setEditingTransaction(tx); setShowTransactionModal(true); };
  const handleSaveTransaction = async (data) => {
    try {
      let result;
      if (editingTransaction) result = await onUpdateTransaction(editingTransaction.id, data);
      else result = await onCreateTransaction(data);
      if (result?.success) { setShowTransactionModal(false); setEditingTransaction(null); toast.success('Transacción guardada'); }
      else toast.error(`Error: ${result?.error || 'Error desconocido'}`);
    } catch { toast.error('Error inesperado al guardar la transacción'); }
  };
  const handleDeleteTransaction = async (tx) => {
    if (!window.confirm(`Estas seguro de eliminar la transaccion "${tx.concept || tx.description || ''}"?`)) return;
    const result = await onDeleteTransaction(tx.id);
    if (!result?.success) toast.error(`Error eliminando transacción: ${result?.error || 'Desconocido'}`); else toast.success('Transacción eliminada');
  };

  const handleExportCSV = () => {
    const escapeCsv = (value = '') => `"${String(value).replace(/"/g, '""')}"`;
    const headers = ['Fecha', 'Concepto', 'Proveedor', 'Tipo', 'Categoria', 'Estado', 'Fecha limite', 'Monto', 'Pagado', 'Pendiente'];
    const rows = filteredTransactions.map((t) => {
      const amount = Number(t.amount) || 0;
      const paid = getPaidValue(t);
      const outstanding = Math.max(0, amount - paid);
      const status = t.status || (t.type === 'income' ? 'expected' : 'pending');

      return [
        t.date || '',
        escapeCsv(t.concept || t.description || ''),
        escapeCsv(t.provider || ''),
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        escapeCsv(t.category || ''),
        status,
        t.dueDate || '',
        amount.toFixed(2),
        paid.toFixed(2),
        outstanding.toFixed(2),
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleClickImportCSV = () => fileInputRef.current?.click();
  const parseCSVToRows = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l && l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    // Detect delimiter: prefer comma, fallback to semicolon
    const sample = lines[0];
    const delimiter = (sample.match(/,/g) || []).length >= (sample.match(/;/g) || []).length ? ',' : ';';
    const splitLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };
    const headers = splitLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(line => splitLine(line));
    return { headers, rows };
  };
  const autoDetectMapping = (headers) => {
    const lower = headers.map(h => (h || '').toLowerCase());
    return {
      date: lower.findIndex(h => /fecha|date/.test(h)),
      desc: lower.findIndex(h => /concepto|descripcion|descripción|description/.test(h)),
      amount: lower.findIndex(h => /importe|monto|amount|valor/.test(h)),
      type: lower.findIndex(h => /tipo|type/.test(h)),
      category: lower.findIndex(h => /categoria|categoría|category/.test(h)),
    };
  };
  const handleCSVSelected = useCallback(async (e)=>{
    try{
      const file = e.target.files?.[0]; if(!file) return;
      setCsvLoading(true);
      const text = await file.text();
      const { headers, rows } = parseCSVToRows(text);
      if (!headers.length || !rows.length) { setCsvError('El CSV no contiene datos'); return; }
      setCsvError(''); setCsvHeaders(headers); setCsvRows(rows); setCsvMapping(autoDetectMapping(headers)); setShowCsvModal(true);
    } finally { setCsvLoading(false); if(fileInputRef.current) fileInputRef.current.value=''; }
  },[]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">{t('finance.transactions.title', { defaultValue: 'Transacciones' })}</h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            {stats.count} transacciones - {t('finance.transactions.balanceLabel', { defaultValue: 'Balance:' })} {formatCurrency(stats.balance)}
            {stats.pendingExpenses > 0 && (
              <span>{' - '}{t('finance.transactions.pendingAmount', { defaultValue: 'Pendiente:' })} {formatCurrency(stats.pendingExpenses)}</span>
            )}
            {stats.overdueExpenses > 0 && (
              <span className="text-[color:var(--color-danger)]">{' - '}{t('finance.transactions.overdueAmount', { defaultValue: 'Vencido:' })} {formatCurrency(stats.overdueExpenses)}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload size={16} />} onClick={()=>setShowBankModal(true)} disabled={isLoading}>{t('finance.transactions.connectBank', { defaultValue: 'Conectar Banco (Nordigen)' })}</Button>
          <Button variant="outline" leftIcon={<Upload size={16} />} onClick={handleClickImportCSV} disabled={isLoading || csvLoading}>{t('finance.transactions.importCSV', { defaultValue: 'Importar CSV' })}</Button>
          <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExportCSV}>{t('finance.transactions.exportCSV', { defaultValue: 'Exportar CSV' })}</Button>
          <Button leftIcon={<Plus size={16} />} onClick={handleAddTransaction}>{t('finance.transactions.new', { defaultValue: 'Nueva Transacción' })}</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text)]/40" />
            <input type="text" placeholder={t('finance.transactions.searchPlaceholder', { defaultValue: 'Buscar por concepto...' })} value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20" />
          </div>
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20">
            <option value="">{t('finance.transactions.allTypes', { defaultValue: 'Todos los tipos' })}</option>
            <option value="income">{t('finance.transactions.incomes', { defaultValue: 'Ingresos' })}</option>
            <option value="expense">{t('finance.transactions.expenses', { defaultValue: 'Gastos' })}</option>
          </select>
          <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20">
            <option value="">{t('finance.transactions.allCategories', { defaultValue: 'Todas las categorías' })}</option>
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select value={providerFilter} onChange={(e)=>setProviderFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20">
            <option value="">{t('finance.transactions.allProviders', { defaultValue: 'Todos los proveedores' })}</option>
            {providers.map(provider => (<option key={provider} value={provider}>{provider}</option>))}
          </select>
          <select value={dateRange} onChange={(e)=>setDateRange(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20">
            <option value="">{t('finance.transactions.allDays', { defaultValue: 'Todos los días' })}</option>
            <option value="30">{t('finance.transactions.last30', { defaultValue: 'Últimos 30 días' })}</option>
            <option value="90">{t('finance.transactions.last90', { defaultValue: 'Últimos 90 días' })}</option>
          </select>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20">
            <option value="date_desc">{t('finance.transactions.sort.dateDesc', { defaultValue: 'Fecha (recientes primero)' })}</option>
            <option value="date_asc">{t('finance.transactions.sort.dateAsc', { defaultValue: 'Fecha (antiguos primero)' })}</option>
            <option value="amount_desc">{t('finance.transactions.sort.amountDesc', { defaultValue: 'Importe (mayor primero)' })}</option>
            <option value="amount_asc">{t('finance.transactions.sort.amountAsc', { defaultValue: 'Importe (menor primero)' })}</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text)]/70"><input type="checkbox" checked={onlyUncategorized} onChange={(e)=>setOnlyUncategorized(e.target.checked)} /> {t('finance.transactions.onlyUncategorized', { defaultValue: 'Solo sin categoría' })}</label>
          <Button variant="outline" onClick={()=>{ setSearchTerm(''); setTypeFilter(''); setCategoryFilter(''); setProviderFilter(''); setDateRange(''); setOnlyUncategorized(false); setSortBy('date_desc'); }} className="w-full">{t('finance.transactions.clear', { defaultValue: 'Limpiar' })}</Button>
        </div>
      </Card>

      {(paymentAlerts.overdue.length > 0 || paymentAlerts.upcoming.length > 0) && (
        <Card className="p-4 border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[color:var(--color-text)]">
                {t('finance.transactions.alerts.title', { defaultValue: 'Pagos importantes' })}
              </p>
              {paymentAlerts.overdue.length > 0 && (
                <p className="text-sm text-[color:var(--color-danger)]">
                  {t('finance.transactions.alerts.overdue', { defaultValue: 'Pagos vencidos:' })} {paymentAlerts.overdue.length}
                </p>
              )}
              {paymentAlerts.upcoming.length > 0 && (
                <p className="text-sm text-[color:var(--color-warning)]">
              {t('finance.transactions.alerts.upcoming', { defaultValue: 'Pagos proximos (7 dias):' })} {paymentAlerts.upcoming.length}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[color:var(--color-text)]/60">{t('finance.transactions.empty', { defaultValue: 'No hay transacciones que mostrar' })}</p>
            <Button className="mt-4" onClick={handleAddTransaction} leftIcon={<Plus size={16} />}>{t('finance.transactions.createFirst', { defaultValue: 'Crear primera transacción' })}</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.date', { defaultValue: 'Fecha' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.concept', { defaultValue: 'Concepto' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.category', { defaultValue: 'Categoría' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.type', { defaultValue: 'Tipo' })}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.status', { defaultValue: 'Estado' })}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.amount', { defaultValue: 'Monto' })}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--color-text)]/60 uppercase tracking-wider">{t('finance.transactions.headers.actions', { defaultValue: 'Acciones' })}</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--color-surface)] divide-y divide-[color:var(--color-text)]/10">
                {filteredTransactions.map((t) => {
                  const amount = Number(t.amount) || 0;
                  const paid = getPaidValue(t);
                  const status = t.status || (t.type === 'income' ? 'expected' : 'pending');
                  const displayAmount = paid > 0 ? paid : amount;
                  const outstanding = Math.max(0, amount - paid);
                  const isExpense = t.type === 'expense';
                  const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                  const isOverdue = Boolean(isExpense && dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date() && status !== 'paid');

                  return (
                    <tr key={t.id} className="hover:bg-[var(--color-accent)]/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]">{formatDate(t.date)}</td>
                    <td className="px-6 py-4 text-sm text-[color:var(--color-text)]">
                      <div className="max-w-xs font-medium text-[color:var(--color-text)] truncate">
                        {t.concept || t.description || t('finance.transactions.noConcept', { defaultValue: 'Sin concepto' })}
                      </div>
                      {(t.provider || t.dueDate) && (
                        <div className="mt-1 text-xs text-[color:var(--color-text)]/60 space-y-0.5">
                          {t.provider && <div>{t.provider}</div>}
                          {t.dueDate && (
                            <div className={isOverdue ? 'text-[color:var(--color-danger)]' : ''}>
                              {t('finance.transactions.dueOn', { defaultValue: 'Vence:' })} {formatDate(t.dueDate)}
                            </div>
                          )}
                        </div>
                      )}
                      {Array.isArray(t.attachments) && t.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-text)]/70">
                          {t.attachments.map((att, index) => {
                            const label = att?.filename || `${t('finance.transactions.attachment', { defaultValue: 'Adjunto' })} ${index + 1}`;
                            return att?.url ? (
                              <a
                                key={att.url || index}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[color:var(--color-primary)] hover:underline"
                              >
                                <Paperclip size={12} />
                                {label}
                              </a>
                            ) : (
                              <span key={index} className="inline-flex items-center gap-1">
                                <Paperclip size={12} />
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]/60"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{t.category || t('finance.transactions.noCategory', { defaultValue: 'Sin categoría' })}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-[var(--color-success)]/15 text-[color:var(--color-success)]' : 'bg-[var(--color-danger)]/15 text-[color:var(--color-danger)]'}`}>{t.type === 'income' ? t('finance.transactions.income', { defaultValue: 'Ingreso' }) : t('finance.transactions.expense', { defaultValue: 'Gasto' })}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[status] || status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${t.type === 'income' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(displayAmount))}
                      {outstanding > 0 && (
                        <p className="text-xs text-[color:var(--color-text)]/60 mt-1">
                          {t(t.type === 'expense' ? 'finance.transactions.outstandingExpense' : 'finance.transactions.outstandingIncome', { defaultValue: t.type === 'expense' ? 'Pendiente:' : 'Por recibir:' })} {formatCurrency(outstanding)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button aria-label="Editar transacción" onClick={() => handleEditTransaction(t)} className="text-[var(--color-primary)] hover:brightness-110"><Edit3 size={16} /></button>
                        <button aria-label="Eliminar transacción" onClick={() => handleDeleteTransaction(t)} className="text-[color:var(--color-danger)] hover:brightness-110"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleCSVSelected} />

      <Modal open={showBankModal} onClose={() => setShowBankModal(false)} title="Importar movimientos bancarios">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><p className="text-sm text-gray-600">Conecta tu cuenta bancaria usando Nordigen y luego importa por fecha.</p></div>
            <div><label className="block text-sm text-gray-700 mb-1">Desde</label><input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-gray-300" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">Hasta</label><input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-gray-300" /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setShowBankModal(false)}>Cancelar</Button><Button onClick={async ()=>{ const res = await onImportBank({ from: dateFrom || undefined, to: dateTo || undefined }); if(!res?.success) toast.error(res?.error || 'No se pudieron importar movimientos'); else setShowBankModal(false); }} disabled={isLoading}>Importar</Button></div>
          <p className="text-xs text-gray-500">Requiere backend con Nordigen configurado.</p>
        </div>
      </Modal>

      <Modal open={showCsvModal} onClose={()=>setShowCsvModal(false)} title={t('finance.transactions.csv.title', { defaultValue: 'Importar CSV - Mapeo de columnas' })} size="lg">
        <div className="space-y-4">
          {csvError && <p className="text-sm text-red-600">{csvError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['date','desc','amount','type','category'].map((field) => (
              <div key={field}>
                <label className="block text-sm text-gray-700 mb-1">{({date:t('finance.transactions.csv.fields.date', { defaultValue: 'Fecha' }),desc:t('finance.transactions.csv.fields.description', { defaultValue: 'Descripción' }),amount:t('finance.transactions.csv.fields.amount', { defaultValue: 'Importe' }),type:t('finance.transactions.csv.fields.type', { defaultValue: 'Tipo' }),category:t('finance.transactions.csv.fields.category', { defaultValue: 'Categoría' })})[field]}</label>
                <select className="w-full border rounded px-2 py-1" value={csvMapping[field]} onChange={(e)=>setCsvMapping(m=>({...m,[field]: Number(e.target.value)}))}>
                  <option value={-1}>-- {t('finance.transactions.csv.none', { defaultValue: 'Ninguna' })} --</option>
                  {csvHeaders.map((h,i)=>(<option key={i} value={i}>{h || `Columna ${i+1}`}</option>))}
                </select>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm text-[color:var(--color-text)]/70 mb-2">{t('finance.transactions.csv.preview', { defaultValue: 'Vista previa' })}</p>
            <div className="overflow-auto max-h-64 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-2 py-1 text-left">{t('finance.transactions.csv.fields.date', { defaultValue: 'Fecha' })}</th><th className="px-2 py-1 text-left">{t('finance.transactions.csv.fields.description', { defaultValue: 'Descripción' })}</th><th className="px-2 py-1 text-left">{t('finance.transactions.csv.fields.type', { defaultValue: 'Tipo' })}</th><th className="px-2 py-1 text-left">{t('finance.transactions.csv.fields.category', { defaultValue: 'Categoría' })}</th><th className="px-2 py-1 text-right">{t('finance.transactions.csv.fields.amount', { defaultValue: 'Importe' })}</th></tr></thead>
                <tbody>
                  {csvRows.slice(0,6).map((row,idx)=>{
                    const get = (i) => i >= 0 && i < row.length ? row[i] : '';
                    const rawAmount = Number((get(csvMapping.amount) || '').replace(/[^0-9.-]/g, '')) || 0;
                    let t = (get(csvMapping.type) || '').toLowerCase(); if (!t) t = rawAmount < 0 ? 'expense' : 'income'; t = t.includes('gasto') || t === 'expense' ? 'Gasto' : 'Ingreso';
                    return (<tr key={idx} className="odd:bg-white even:bg-gray-50"><td className="px-2 py-1">{(get(csvMapping.date) || '').slice(0,10)}</td><td className="px-2 py-1">{get(csvMapping.desc)}</td><td className="px-2 py-1">{t}</td><td className="px-2 py-1">{get(csvMapping.category) || 'OTROS'}</td><td className="px-2 py-1 text-right">{get(csvMapping.amount)}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setShowCsvModal(false)}>Cancelar</Button><Button onClick={async ()=>{ try{ setCsvLoading(true); let imported=0; let skipped=0; const sig = (o)=> `${(o.date||'').slice(0,10)}|${(o.concept||'').toLowerCase().trim()}|${Number(o.amount)||0}|${o.type}`; const existing = new Set(transactions.map(t => sig({ date:t.date, concept:t.concept||t.description, amount:t.amount, type:t.type }))); for (const row of csvRows){ const get=(i)=> i>=0 && i<row.length ? row[i] : ''; const rawAmount=Number((get(csvMapping.amount)||'').replace(/[^0-9.-]/g,''))||0; let type=(get(csvMapping.type)||'').toLowerCase(); if(!type) type=rawAmount<0?'expense':'income'; if(type.includes('gasto')||type==='expense') type='expense'; else type='income'; const tx={ date:(get(csvMapping.date)||'').slice(0,10), concept:(get(csvMapping.desc)||'').replace(/^"|"$/g,''), amount:Math.abs(rawAmount), type, category:get(csvMapping.category)||'OTROS', source:'csv' }; const k=sig(tx); if(existing.has(k)){ skipped++; continue; } await onCreateTransaction(tx); existing.add(k); imported++; } toast.success(`Importadas ${imported} · Duplicadas omitidas ${skipped}`); setShowCsvModal(false);} catch(e){ toast.error('No se pudo importar CSV'); } finally { setCsvLoading(false);} }} disabled={csvLoading}>Importar</Button></div>
        </div>
      </Modal>
    </div>
  );
}









