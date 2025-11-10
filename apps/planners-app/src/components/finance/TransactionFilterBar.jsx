import { Search } from 'lucide-react';
import React from 'react';

export default function TransactionFilterBar({
  t,
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  providerFilter,
  onProviderChange,
  dateRange,
  onDateRangeChange,
  onlyUncategorized,
  onOnlyUncategorizedChange,
  sortBy,
  onSortByChange,
  categories = [],
  providers = [],
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text)]/40"
        />
        <input
          type="text"
          placeholder={t('finance.transactions.searchPlaceholder', {
            defaultValue: 'Buscar por concepto...',
          })}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
        />
      </div>

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
      >
        <option value="">
          {t('finance.transactions.allTypes', { defaultValue: 'Todos los tipos' })}
        </option>
        <option value="income">
          {t('finance.transactions.incomes', { defaultValue: 'Ingresos' })}
        </option>
        <option value="expense">
          {t('finance.transactions.expenses', { defaultValue: 'Gastos' })}
        </option>
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
      >
        <option value="">
          {t('finance.transactions.allCategories', { defaultValue: 'Todas las categorías' })}
        </option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={providerFilter}
        onChange={(e) => onProviderChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
      >
        <option value="">
          {t('finance.transactions.allProviders', { defaultValue: 'Todos los proveedores' })}
        </option>
        {providers.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
      >
        <option value="">
          {t('finance.transactions.allDays', { defaultValue: 'Todos los días' })}
        </option>
        <option value="30">
          {t('finance.transactions.last30', { defaultValue: 'Últimos 30 días' })}
        </option>
        <option value="90">
          {t('finance.transactions.last90', { defaultValue: 'Últimos 90 días' })}
        </option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text)]/20"
      >
        <option value="date_desc">
          {t('finance.transactions.sort.dateDesc', { defaultValue: 'Fecha ↓' })}
        </option>
        <option value="date_asc">
          {t('finance.transactions.sort.dateAsc', { defaultValue: 'Fecha ↑' })}
        </option>
        <option value="amount_desc">
          {t('finance.transactions.sort.amountDesc', { defaultValue: 'Monto ↓' })}
        </option>
        <option value="amount_asc">
          {t('finance.transactions.sort.amountAsc', { defaultValue: 'Monto ↑' })}
        </option>
      </select>

      <div className="flex items-center">
        <label className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text)]/70">
          <input
            type="checkbox"
            checked={onlyUncategorized}
            onChange={(e) => onOnlyUncategorizedChange(e.target.checked)}
          />
          {t('finance.transactions.onlyUncategorized', { defaultValue: 'Solo sin categoría' })}
        </label>
      </div>
    </div>
  );
}
