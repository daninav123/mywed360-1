import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import logger from '../logger.js';
import { calculateCommission, normalizeCommissionRules } from '../utils/commission.js';

const router = express.Router();

const toDateSafe = (value) => {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && value._seconds !== undefined) {
    return new Date(value._seconds * 1000);
  }
  return null;
};

/**
 * Genera un token único para un código de descuento
 */
function generatePartnerToken(code) {
  return crypto
    .createHash('sha256')
    .update(`${code}-mywed360-partner-${process.env.JWT_SECRET || 'fallback-secret'}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Obtiene estadísticas públicas de un código de descuento usando su token
 * GET /api/partner/:token
 */
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  
  if (!token || token.length < 16) {
    return res.status(400).json({ error: 'invalid_token' });
  }

  try {
    // Buscar el código de descuento por token
    const discountSnapshot = await db.collection('_system').doc('config').collection('discounts')
      .where('partnerToken', '==', token)
      .limit(1)
      .get();

    if (discountSnapshot.empty) {
      return res.status(404).json({ 
        error: 'not_found',
        message: 'Código de descuento no encontrado o token inválido'
      });
    }

    const discountDoc = discountSnapshot.docs[0];
    const discountData = discountDoc.data();
    
    // Verificar que esté activo (soporta 'active' y 'activo')
    const status = (discountData.status || '').toLowerCase();
    if (status !== 'active' && status !== 'activo') {
      return res.status(403).json({
        error: 'inactive',
        message: 'Este código de descuento está desactivado'
      });
    }

    // Verificar fechas de validez
    const now = new Date();
    if (discountData.validFrom) {
      const validFrom = new Date(discountData.validFrom);
      if (now < validFrom) {
        return res.status(403).json({
          error: 'not_started',
          message: `Este código estará disponible desde el ${validFrom.toLocaleDateString('es-ES')}`
        });
      }
    }
    if (discountData.validUntil) {
      const validUntil = new Date(discountData.validUntil);
      if (now > validUntil) {
        return res.status(403).json({
          error: 'expired',
          message: `Este código expiró el ${validUntil.toLocaleDateString('es-ES')}`
        });
      }
    }

    // Buscar todos los pagos que usaron este código
    const paymentsSnapshot = await db.collection('_system').doc('config').collection('payments')
      .where('discountCode', '==', discountData.code)
      .where('status', 'in', ['paid', 'succeeded', 'completed'])
      .get();

    const currency = discountData.currency || 'EUR';
    const commissionRules = normalizeCommissionRules(discountData.commissionRules || null, {
      defaultCurrency: currency,
    });
    const commissionStartDate = toDateSafe(discountData.validFrom) || toDateSafe(discountData.createdAt);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let totalRevenue = 0;
    let lastMonthRevenue = 0;
    let totalUses = 0;
    let lastMonthUses = 0;
    const users = [];
    const userIds = new Set();
    const paymentRecords = [];
    const lastMonthPayments = [];

    for (const paymentDoc of paymentsSnapshot.docs) {
      const rawPayment = paymentDoc.data() || {};
      const amount = Number(rawPayment.amount ?? rawPayment.total ?? 0);
      
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const paymentDate = toDateSafe(rawPayment.createdAt)
        || toDateSafe(rawPayment.paidAt)
        || toDateSafe(rawPayment.completedAt)
        || (commissionStartDate || now);

      const normalizedPayment = {
        ...rawPayment,
        amount,
        createdAt: paymentDate,
      };

      paymentRecords.push(normalizedPayment);

      totalRevenue += amount;
      totalUses++;

      const userId = normalizedPayment.userId || normalizedPayment.uid || normalizedPayment.user?.uid;
      const userEmail = normalizedPayment.email || normalizedPayment.user?.email || normalizedPayment.userEmail;
      
      if (userId && !userIds.has(userId)) {
        userIds.add(userId);
        users.push({
          id: userId,
          email: userEmail || `${userId}@user.com`,
          amount,
          date: paymentDate,
        });
      }

      if (paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd) {
        lastMonthRevenue += amount;
        lastMonthUses++;
        lastMonthPayments.push(normalizedPayment);
      }
    }

    const commissionOptions = {
      currency,
      startDate: commissionStartDate || null,
    };

    const commissionSummary = calculateCommission(paymentRecords, commissionRules, commissionOptions);
    const commissionLastMonth = calculateCommission(lastMonthPayments, commissionRules, commissionOptions);

    const response = {
      code: discountData.code,
      type: discountData.type || 'campaign',
      assignedTo: discountData.assignedTo || { name: 'Partner', email: '' },
      validFrom: toDateSafe(discountData.validFrom)?.toISOString() || null,
      validUntil: toDateSafe(discountData.validUntil)?.toISOString() || null,
      stats: {
        total: {
          revenue: totalRevenue,
          uses: totalUses,
          users: userIds.size,
          currency,
          commission: commissionSummary,
        },
        lastMonth: {
          revenue: lastMonthRevenue,
          uses: lastMonthUses,
          currency,
          commission: commissionLastMonth,
        },
      },
      users: users
        .sort((a, b) => b.date - a.date)
        .slice(0, 50)
        .map(u => ({
          email: u.email,
          amount: u.amount,
          date: u.date.toISOString().split('T')[0],
        })),
      maxUses: discountData.maxUses || null,
      createdAt: toDateSafe(discountData.createdAt)?.toISOString() || null,
      commissionRules,
      debug: {
        commissionPayments: commissionSummary.paymentsEvaluated,
        commissionUnassignedRevenue: commissionSummary.unassignedRevenue,
      },
    };

    logger.info(`[partner-stats] Token ${token.substring(0, 8)}... accessed for code ${discountData.code}`);
    
    return res.json(response);
  } catch (error) {
    logger.error('[partner-stats] Error fetching stats:', error);
    return res.status(500).json({ 
      error: 'server_error',
      message: 'Error al obtener estadísticas'
    });
  }
});

/**
 * Genera o regenera el token de partner para un código de descuento (admin only)
 * POST /api/partner/generate-token
 */
router.post('/generate-token', async (req, res) => {
  const { discountId } = req.body;

  if (!discountId) {
    return res.status(400).json({ error: 'discount_id_required' });
  }

  try {
    const discountRef = db.collection('_system').doc('config').collection('discounts').doc(discountId);
    const discountDoc = await discountRef.get();

    if (!discountDoc.exists) {
      return res.status(404).json({ error: 'discount_not_found' });
    }

    const discountData = discountDoc.data();
    const token = generatePartnerToken(discountData.code);

    await discountRef.update({
      partnerToken: token,
      partnerTokenGeneratedAt: new Date(),
      updatedAt: new Date(),
    });

    const partnerUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/partner/${token}`;

    logger.info(`[partner-stats] Token generated for discount ${discountData.code}`);

    return res.json({
      token,
      url: partnerUrl,
      code: discountData.code,
    });
  } catch (error) {
    logger.error('[partner-stats] Error generating token:', error);
    return res.status(500).json({ error: 'server_error' });
  }
});

export { generatePartnerToken };
export default router;
