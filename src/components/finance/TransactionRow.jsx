import React from 'react';
import { Paperclip } from 'lucide-react';

export default function TransactionRow({
  tx,
  getPaidValue,
  statusLabels,
  statusStyles,
  tr = (k) => k,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
}) {
  const amount = Number(tx.amount) || 0;
  const paid = getPaidValue(tx);
  const status = tx.status || (tx.type === 'income' ? 'expected' : 'pending');
  const displayAmount = paid > 0 ? paid : amount;
  const outstanding = Math.max(0, amount - paid);
  const isExpense = tx.type === 'expense';
  const dueDate = tx.dueDate ? new Date(tx.dueDate) : null;
  const isOverdue = Boolean(isExpense && dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date() && status !== 'paid');

  return (
    <tr className="hover:bg-[var(--color-accent)]/10">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]">{formatDate(tx.date)}</td>
      <td className="px-6 py-4 text-sm text-[color:var(--color-text)]">
        <div className="max-w-xs font-medium text-[color:var(--color-text)] truncate">
          {tx.concept || tx.description || tr('finance.transactions.noConcept', { defaultValue: 'Sin concepto' })}
        </div>
        {(tx.provider || tx.dueDate) && (
          <div className="mt-1 text-xs text-[color:var(--color-text)]/60 space-y-0.5">
            {tx.provider && <div>{tx.provider}</div>}
            {tx.dueDate && (
              <div className={isOverdue ? 'text-[color:var(--color-danger)]' : ''}>
                {tr('finance.transactions.dueOn', { defaultValue: 'Vence:' })} {formatDate(tx.dueDate)}
              </div>
            )}
          </div>
        )}
        {Array.isArray(tx.attachments) && tx.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-text)]/70">
            {tx.attachments.map((att, index) => {
              const label = att?.filename || `${tr('finance.transactions.attachment', { defaultValue: 'Adjunto' })} ${index + 1}`;
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--color-text)]/60">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[color:var(--color-text)]/10 text-[color:var(--color-text)]">
          {tx.category || tr('finance.transactions.noCategory', { defaultValue: 'No category' })}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-[var(--color-success)]/15 text-[color:var(--color-success)]' : 'bg-[var(--color-danger)]/15 text-[color:var(--color-danger)]'}`}>
          {tx.type === 'income' ? tr('finance.transactions.income', { defaultValue: 'Ingreso' }) : tr('finance.transactions.expense', { defaultValue: 'Gasto' })}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-[color:var(--color-text)]/10 text-[color:var(--color-text)]/70'}`}>
          {statusLabels[status] || status}
        </span>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${tx.type === 'income' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(displayAmount))}
        {outstanding > 0 && (
          <p className="text-xs text-[color:var(--color-text)]/60 mt-1">
            {tr(tx.type === 'expense' ? 'finance.transactions.outstandingExpense' : 'finance.transactions.outstandingIncome', { defaultValue: tx.type === 'expense' ? 'Pendiente:' : 'Por recibir:' })} {formatCurrency(outstanding)}
          </p>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button aria-label="Editar transacción" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-text)]/20 px-2 py-1 text-[color:var(--color-text)] hover:bg-[var(--color-accent)]/10" onClick={() => onEdit && onEdit(tx)}>
            <span className="sr-only">Editar</span>
          </button>
          <button aria-label="Borrar transacción" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-text)]/20 px-2 py-1 text-[color:var(--color-danger)] hover:bg-[var(--color-danger)]/10" onClick={() => onDelete && onDelete(tx)}>
            <span className="sr-only">Borrar</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

