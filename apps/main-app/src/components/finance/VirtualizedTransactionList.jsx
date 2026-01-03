import { Edit3, Trash2 } from 'lucide-react';
import React from 'react';
import { FixedSizeList as List } from 'react-window';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

export default function VirtualizedTransactionList({ items, getPaidValue, onEdit, onDelete }) {
  const { t } = useTranslations();
  const statusLabels = {
    pending: t('finance.transactions.status.pending', { defaultValue: 'Pendiente' }),
    partial: t('finance.transactions.status.partial', { defaultValue: 'Pago parcial' }),
    paid: t('finance.transactions.status.paid', { defaultValue: 'Pagado' }),
    expected: t('finance.transactions.status.expected', { defaultValue: 'Esperado' }),
    received: t('finance.transactions.status.received', { defaultValue: 'Recibido' }),
  };
  const statusStyles = {
    pending: 'bg-[var(--color-warning-15)] text-[color:var(--color-warning)]',
    partial: 'bg-[var(--color-primary-15)] text-[color:var(--color-primary)]',
    paid: 'bg-[var(--color-success-15)] text-[color:var(--color-success)]',
    expected: 'bg-[color:var(--color-text-10)] text-[color:var(--color-text-70)]',
    received: 'bg-[var(--color-success-15)] text-[color:var(--color-success)]',
  };
  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 px-6 py-3 bg-[var(--color-surface)] text-xs font-medium text-[color:var(--color-text-60)] uppercase tracking-wider">
        <div>{t('finance.transactions.headers.date', { defaultValue: 'Fecha' })}</div>
        <div className="col-span-2">
          {t('finance.transactions.headers.concept', { defaultValue: 'Concepto' })}
        </div>
        <div>{t('finance.transactions.headers.category', { defaultValue: 'Categoría' })}</div>
        <div>{t('finance.transactions.headers.type', { defaultValue: 'Tipo' })}</div>
        <div>{t('finance.transactions.headers.status', { defaultValue: 'Estado' })}</div>
        <div className="text-right">
          {t('finance.transactions.headers.amount', { defaultValue: 'Monto' })}
        </div>
      </div>
      <List height={520} itemCount={items.length} itemSize={68} width={'100%'}>
        {({ index, style }) => {
          const tx = items[index];
          const amount = Number(tx.amount) || 0;
          const paid = getPaidValue(tx);
          const status = tx.status || (tx.type === 'income' ? 'expected' : 'pending');
          const displayAmount = paid > 0 ? paid : amount;
          const outstanding = Math.max(0, amount - paid);
          const isExpense = tx.type === 'expense';
          const dueDate = tx.dueDate ? new Date(tx.dueDate) : null;
          const isOverdue = Boolean(
            isExpense &&
              dueDate &&
              !Number.isNaN(dueDate.getTime()) &&
              dueDate < new Date() &&
              status !== 'paid'
          );
          return (
            <div
              style={style}
              key={tx.id}
              className="grid grid-cols-8 gap-2 px-6 items-center border-b border-[color:var(--color-text-10)] hover:bg-[var(--color-primary-5)] transition-colors duration-150"
            >
              <div className="text-sm text-[color:var(--color-text)]">{formatDate(tx.date)}</div>
              <div className="col-span-2 text-sm text-[color:var(--color-text)]">
                <div className="font-medium truncate">
                  {tx.concept ||
                    tx.description ||
                    t('finance.transactions.noConcept', { defaultValue: 'Sin concepto' })}
                </div>
                {(tx.provider || tx.dueDate) && (
                  <div className="mt-0.5 text-xs text-[color:var(--color-text-60)] space-y-0.5">
                    {tx.provider && <div>{tx.provider}</div>}
                    {tx.dueDate && (
                      <div className={isOverdue ? 'text-[color:var(--color-danger)]' : ''}>
                        {t('finance.transactions.dueOn', { defaultValue: 'Vence:' })}{' '}
                        {formatDate(tx.dueDate)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-[color:var(--color-text-60)]">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[color:var(--color-text-10)] text-[color:var(--color-text)]">
                  {tx.category ||
                    t('finance.transactions.noCategory', { defaultValue: 'Sin categoría' })}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-[var(--color-success-15)] text-[color:var(--color-success)]' : 'bg-[var(--color-danger-15)] text-[color:var(--color-danger)]'}`}
                >
                  {tx.type === 'income'
                    ? t('finance.transactions.income', { defaultValue: 'Ingreso' })
                    : t('finance.transactions.expense', { defaultValue: 'Gasto' })}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-[color:var(--color-text-10)] text-[color:var(--color-text-70)]'}`}
                >
                  {statusLabels[status] || status}
                </span>
              </div>
              <div
                className={`text-sm font-medium text-right ${tx.type === 'income' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(Math.abs(displayAmount))}
                {outstanding > 0 && (
                  <p className="text-xs text-[color:var(--color-text-60)] mt-0.5">
                    {t(
                      tx.type === 'expense'
                        ? 'finance.transactions.outstandingExpense'
                        : 'finance.transactions.outstandingIncome',
                      { defaultValue: tx.type === 'expense' ? 'Pendiente:' : 'Por recibir:' }
                    )}{' '}
                    {formatCurrency(outstanding)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="inline-flex gap-1.5 justify-end">
                  <button
                    aria-label={t('app.edit', { defaultValue: 'Editar' })}
                    onClick={() => onEdit?.(tx)}
                    className="p-2 rounded-md text-[color:var(--color-primary)] hover:bg-[var(--color-primary-10)] transition-colors duration-150"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    aria-label={t('app.delete', { defaultValue: 'Eliminar' })}
                    onClick={() => onDelete?.(tx)}
                    className="p-2 rounded-md text-[color:var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors duration-150"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      </List>
    </div>
  );
}
