/**
 * Servicio para sincronizar planes de pago de proveedores con transacciones de finanzas
 */

/**
 * Genera transacciones desde el plan de pagos de un proveedor
 * @param {Object} provider - Datos del proveedor
 * @param {string} provider.id - ID del proveedor
 * @param {string} provider.name - Nombre del proveedor
 * @param {string} provider.service - Servicio del proveedor
 * @param {Array} provider.paymentSchedule - Plan de pagos
 * @returns {Array} Array de transacciones a crear/actualizar
 */
export function generateTransactionsFromSchedule(provider) {
  if (!provider?.paymentSchedule || !Array.isArray(provider.paymentSchedule)) {
    return [];
  }

  return provider.paymentSchedule.map(installment => ({
    type: 'expense',
    amount: installment.amount || 0,
    status: installment.status || 'pending',
    category: provider.service || 'Otros',
    provider: provider.name || '',
    concept: `${provider.name} - ${installment.description}`,
    description: installment.description || '',
    dueDate: installment.dueDate || null,
    date: installment.status === 'paid' ? installment.paidDate : null,
    paidAmount: installment.status === 'paid' ? installment.amount : 0,
    source: 'payment_schedule',
    meta: {
      providerId: provider.id,
      installmentId: installment.id,
      source: 'payment_schedule'
    }
  }));
}

/**
 * Sincroniza el plan de pagos de un proveedor con las transacciones existentes
 * @param {Object} provider - Datos del proveedor con paymentSchedule
 * @param {Array} existingTransactions - Transacciones existentes
 * @param {Function} addTransaction - Función para añadir transacción
 * @param {Function} updateTransaction - Función para actualizar transacción
 * @param {Function} deleteTransaction - Función para eliminar transacción
 */
export async function syncPaymentScheduleWithTransactions(
  provider,
  existingTransactions,
  { addTransaction, updateTransaction, deleteTransaction }
) {
  if (!provider?.paymentSchedule) {
    console.log('[PaymentSchedule] No hay plan de pagos para sincronizar');
    return;
  }

  console.log('[PaymentSchedule] Sincronizando plan de pagos:', provider.name);

  // Buscar transacciones existentes de este proveedor que vengan de payment_schedule
  const providerScheduleTransactions = existingTransactions.filter(
    tx => tx.meta?.providerId === provider.id && tx.meta?.source === 'payment_schedule'
  );

  console.log('[PaymentSchedule] Transacciones existentes del plan:', providerScheduleTransactions.length);

  // Map de installmentId -> transactionId para tracking
  const installmentToTransactionMap = new Map();
  providerScheduleTransactions.forEach(tx => {
    if (tx.meta?.installmentId) {
      installmentToTransactionMap.set(tx.meta.installmentId, tx.id);
    }
  });

  // Procesar cada cuota del plan
  const results = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  for (const installment of provider.paymentSchedule) {
    try {
      const transactionData = {
        type: 'expense',
        amount: installment.amount || 0,
        status: installment.status || 'pending',
        category: provider.service || 'Otros',
        provider: provider.name || '',
        concept: `${provider.name} - ${installment.description}`,
        description: installment.description || '',
        dueDate: installment.dueDate || null,
        date: installment.status === 'paid' ? (installment.paidDate || null) : null,
        paidAmount: installment.status === 'paid' ? installment.amount : 0,
        source: 'payment_schedule',
        meta: {
          providerId: provider.id,
          installmentId: installment.id,
          source: 'payment_schedule'
        }
      };

      const existingTransactionId = installmentToTransactionMap.get(installment.id);

      if (existingTransactionId) {
        // Actualizar transacción existente
        await updateTransaction(existingTransactionId, transactionData);
        results.updated++;
        console.log('[PaymentSchedule] Transacción actualizada:', existingTransactionId);
      } else {
        // Crear nueva transacción
        await addTransaction(transactionData);
        results.created++;
        console.log('[PaymentSchedule] Transacción creada para:', installment.description);
      }
    } catch (error) {
      console.error('[PaymentSchedule] Error procesando cuota:', installment.description, error);
      results.errors.push({ installment: installment.description, error: error.message });
    }
  }

  // Eliminar transacciones que ya no están en el plan
  const currentInstallmentIds = new Set(provider.paymentSchedule.map(i => i.id));
  for (const tx of providerScheduleTransactions) {
    if (tx.meta?.installmentId && !currentInstallmentIds.has(tx.meta.installmentId)) {
      try {
        await deleteTransaction(tx.id);
        results.deleted++;
        console.log('[PaymentSchedule] Transacción eliminada:', tx.id);
      } catch (error) {
        console.error('[PaymentSchedule] Error eliminando transacción:', tx.id, error);
        results.errors.push({ transaction: tx.id, error: error.message });
      }
    }
  }

  console.log('[PaymentSchedule] Sincronización completada:', results);
  return results;
}

/**
 * Calcula alertas de saldo insuficiente para pagos futuros
 * @param {Array} transactions - Todas las transacciones
 * @param {number} currentBalance - Saldo actual
 * @param {number} daysLookahead - Días hacia adelante para revisar (default: 90)
 * @returns {Array} Array de alertas
 */
export function calculateBalanceAlerts(transactions, currentBalance, daysLookahead = 90) {
  const now = new Date();
  const lookaheadDate = new Date();
  lookaheadDate.setDate(now.getDate() + daysLookahead);

  // Filtrar transacciones pendientes futuras dentro del periodo
  const upcomingExpenses = transactions
    .filter(tx => {
      if (tx.type !== 'expense') return false;
      if (tx.status === 'paid') return false;
      if (!tx.dueDate) return false;

      const dueDate = new Date(tx.dueDate);
      return dueDate >= now && dueDate <= lookaheadDate;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (upcomingExpenses.length === 0) {
    return [];
  }

  // Simular balance día a día
  const alerts = [];
  let simulatedBalance = currentBalance;
  const processedDates = new Set();

  for (const expense of upcomingExpenses) {
    const dueDate = new Date(expense.dueDate);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Agrupar gastos del mismo día
    if (processedDates.has(dueDateStr)) continue;
    processedDates.add(dueDateStr);

    // Sumar todos los gastos del mismo día
    const dayExpenses = upcomingExpenses.filter(tx => {
      const txDate = new Date(tx.dueDate).toISOString().split('T')[0];
      return txDate === dueDateStr;
    });

    const dayTotal = dayExpenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Verificar si hay saldo suficiente
    if (simulatedBalance < dayTotal) {
      const deficit = dayTotal - simulatedBalance;
      alerts.push({
        type: 'insufficient_balance',
        severity: 'high',
        date: dueDateStr,
        currentBalance: simulatedBalance,
        required: dayTotal,
        deficit,
        transactions: dayExpenses.map(tx => ({
          id: tx.id,
          provider: tx.provider,
          concept: tx.concept,
          amount: tx.amount
        }))
      });
    }

    simulatedBalance -= dayTotal;
  }

  return alerts;
}

/**
 * Obtiene el próximo pago de un proveedor
 * @param {Object} provider - Datos del proveedor
 * @returns {Object|null} Próximo pago o null
 */
export function getNextPayment(provider) {
  if (!provider?.paymentSchedule || !Array.isArray(provider.paymentSchedule)) {
    return null;
  }

  const now = new Date();
  const pendingPayments = provider.paymentSchedule
    .filter(item => {
      if (item.status === 'paid') return false;
      if (!item.dueDate) return false;
      return new Date(item.dueDate) >= now;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return pendingPayments[0] || null;
}

/**
 * Calcula el total pendiente de pagar de un proveedor
 * @param {Object} provider - Datos del proveedor
 * @returns {number} Total pendiente
 */
export function getTotalPending(provider) {
  if (!provider?.paymentSchedule || !Array.isArray(provider.paymentSchedule)) {
    return 0;
  }

  return provider.paymentSchedule
    .filter(item => item.status !== 'paid')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Calcula el total pagado de un proveedor
 * @param {Object} provider - Datos del proveedor
 * @returns {number} Total pagado
 */
export function getTotalPaid(provider) {
  if (!provider?.paymentSchedule || !Array.isArray(provider.paymentSchedule)) {
    return 0;
  }

  return provider.paymentSchedule
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
}
