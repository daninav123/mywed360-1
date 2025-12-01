import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

/**
 * Guarda o actualiza un presupuesto de proveedor dentro de la ruta
 * weddings/{weddingId}/suppliers/{supplierId}/budgets/{budgetId}
 *
 * @param {Object} params
 * @param {string} params.weddingId
 * @param {string} params.supplierId
 * @param {string} [params.budgetId] - opcional, si no se pasa se genera automáticamente
 * @param {string} params.description
 * @param {number} params.amount
 * @param {string} params.currency
 * @param {'pending'|'accepted'|'rejected'} params.status
 * @param {string} params.emailId - ID del correo del que se extrajo
 */
export async function saveSupplierBudget({
  weddingId,
  supplierId,
  budgetId,
  description,
  amount,
  currency = 'EUR',
  status = 'pending',
  emailId,
}) {
  if (!weddingId || !supplierId) {
    throw new Error('weddingId y supplierId obligatorios');
  }

  const budgetsCol = db
    .collection('weddings')
    .doc(weddingId)
    .collection('suppliers')
    .doc(supplierId)
    .collection('budgets');

  const createdAt = FieldValue.serverTimestamp();

  // Si no hay budgetId proporcionado, se crea un nuevo doc
  const docRef = budgetId ? budgetsCol.doc(budgetId) : budgetsCol.doc();

  const payload = {
    weddingId,
    supplierId,
    description,
    amount,
    currency,
    status,
    emailId,
    createdAt,
    updatedAt: createdAt,
  };

  try {
    await docRef.set(payload, { merge: true });
    logger.info(`💰 Presupuesto guardado para wedding ${weddingId}, supplier ${supplierId}`);
    return docRef.id;
  } catch (err) {
    logger.error('❌ Error guardando presupuesto proveedor:', err);
    throw err;
  }
}
