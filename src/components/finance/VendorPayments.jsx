import React from 'react';
import Card from '../Card';
import { AlertCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const VendorPayments = ({ transactions }) => {
  const now = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(now.getDate() + 7);

  // Clasificar transacciones
  const paymentStatus = React.useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      if (transaction.type !== 'expense') return acc;
      
      const paymentDate = new Date(transaction.paymentDate);
      const isPaid = transaction.status === 'paid';
      const isOverdue = !isPaid && paymentDate < now;
      const isUpcoming = !isPaid && paymentDate > now && paymentDate <= oneWeekFromNow;
      const isFuture = !isPaid && paymentDate > oneWeekFromNow;

      if (isPaid) acc.paid.push(transaction);
      else if (isOverdue) acc.overdue.push(transaction);
      else if (isUpcoming) acc.upcoming.push(transaction);
      else if (isFuture) acc.future.push(transaction);

      return acc;
    }, { 
      paid: [], 
      overdue: [], 
      upcoming: [], 
      future: [] 
    });
  }, [transactions]);

  // Calcular totales
  const calculateTotal = (items) => 
    items.reduce((sum, item) => sum + parseFloat(item.realCost || 0), 0);

  const totals = {
    paid: calculateTotal(paymentStatus.paid),
    overdue: calculateTotal(paymentStatus.overdue),
    upcoming: calculateTotal(paymentStatus.upcoming),
    future: calculateTotal(paymentStatus.future)
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const PaymentStatusCard = ({ title, items, total, icon, color }) => (
    <div className="border rounded-lg overflow-hidden">
      <div className={`p-3 ${color.bg} ${color.text} font-medium flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <span className="font-bold">{items.length}</span>
      </div>
      <div className="p-3">
        <p className="text-2xl font-bold mb-2">{formatCurrency(total)}</p>
        {items.length > 0 && (
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="text-sm border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{item.provider}</span>
                  <span>{formatCurrency(item.realCost)}</span>
                </div>
                <div className="text-xs text-[color:var(--color-text)]/60">
                  {item.item} â€¢ {new Date(item.paymentDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertCircle className="text-[color:var(--color-primary)]" />
        Seguimiento de Pagos a Proveedores
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaymentStatusCard
          title="Pagos Vencidos"
          items={paymentStatus.overdue}
          total={totals.overdue}
          icon={<AlertCircle className="w-4 h-4" />}
          color={{ bg: 'bg-[var(--color-danger)]/10', text: 'text-[color:var(--color-danger)]' }}
        />
        <PaymentStatusCard
          title="Próximos Pagos"
          items={paymentStatus.upcoming}
          total={totals.upcoming}
          icon={<Clock className="w-4 h-4" />}
          color={{ bg: 'bg-[var(--color-warning)]/10', text: 'text-[color:var(--color-warning)]' }}
        />
        <PaymentStatusCard
          title="Pagos Futuros"
          items={paymentStatus.future}
          total={totals.future}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={{ bg: 'bg-[var(--color-primary)]/10', text: 'text-[color:var(--color-primary)]' }}
        />
        <PaymentStatusCard
          title="Pagos Realizados"
          items={paymentStatus.paid}
          total={totals.paid}
          icon={<CheckCircle className="w-4 h-4" />}
          color={{ bg: 'bg-[var(--color-success)]/10', text: 'text-[color:var(--color-success)]' }}
        />
      </div>
    </Card>
  );
};
