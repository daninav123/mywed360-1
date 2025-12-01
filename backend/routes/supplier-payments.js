import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import { requireSupplierAuth } from './supplier-dashboard.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// ============================================
// PAGOS Y FACTURACIÓN
// ============================================

// POST /payments/setup - Configurar cuenta de Stripe Connect
router.post('/payments/setup', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'stripe_not_configured' });
    }

    const { email, businessName, country = 'ES' } = req.body;

    // Crear cuenta de Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email: email || req.supplier.contact?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName || req.supplier.name,
        product_description: req.supplier.description || '',
      },
    });

    // Crear link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/supplier/dashboard/${req.supplier.id}/payments/refresh`,
      return_url: `${process.env.FRONTEND_URL}/supplier/dashboard/${req.supplier.id}/payments/success`,
      type: 'account_onboarding',
    });

    // Guardar en Firestore
    await db.collection('suppliers').doc(req.supplier.id).update({
      'payments.stripeAccountId': account.id,
      'payments.onboardingStartedAt': FieldValue.serverTimestamp(),
      'payments.status': 'pending_onboarding',
    });

    logger.info(`Supplier ${req.supplier.id} started Stripe onboarding`);

    return res.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: account.id,
    });
  } catch (error) {
    logger.error('Error setting up Stripe:', error);
    return res.status(500).json({ error: 'stripe_setup_failed', message: error.message });
  }
});

// GET /payments/status - Verificar estado de cuenta Stripe
router.get('/payments/status', requireSupplierAuth, async (req, res) => {
  try {
    const supplierDoc = await db.collection('suppliers').doc(req.supplier.id).get();
    const supplierData = supplierDoc.data();

    if (!supplierData?.payments?.stripeAccountId) {
      return res.json({
        success: true,
        status: 'not_configured',
        paymentsEnabled: false,
      });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'stripe_not_configured' });
    }

    const account = await stripe.accounts.retrieve(supplierData.payments.stripeAccountId);

    const paymentsEnabled = account.charges_enabled && account.payouts_enabled;

    // Actualizar estado en Firestore
    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .update({
        'payments.status': paymentsEnabled ? 'active' : 'pending',
        'payments.lastCheckedAt': FieldValue.serverTimestamp(),
      });

    return res.json({
      success: true,
      status: paymentsEnabled ? 'active' : 'pending',
      paymentsEnabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    logger.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'stripe_check_failed' });
  }
});

// POST /payments/invoice - Crear factura
router.post('/payments/invoice', requireSupplierAuth, express.json(), async (req, res) => {
  try {
    const { clientId, items, dueDate, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items_required' });
    }

    // Calcular total
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.21; // IVA 21% (ajustar según país)
    const total = subtotal + tax;

    const invoiceData = {
      supplierId: req.supplier.id,
      clientId,
      items,
      subtotal,
      tax,
      total,
      currency: 'EUR',
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const invoiceRef = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('invoices')
      .add(invoiceData);

    logger.info(`Supplier ${req.supplier.id} created invoice ${invoiceRef.id}`);

    return res.json({
      success: true,
      invoiceId: invoiceRef.id,
      invoice: { id: invoiceRef.id, ...invoiceData },
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    return res.status(500).json({ error: 'invoice_creation_failed' });
  }
});

// GET /payments/invoices - Listar facturas
router.get('/payments/invoices', requireSupplierAuth, async (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('invoices')
      .orderBy('createdAt', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(Number(limit)).get();
    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ success: true, invoices });
  } catch (error) {
    logger.error('Error listing invoices:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /payments/invoice/:invoiceId/send - Enviar factura por email
router.post('/payments/invoice/:invoiceId/send', requireSupplierAuth, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoiceDoc = await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('invoices')
      .doc(invoiceId)
      .get();

    if (!invoiceDoc.exists) {
      return res.status(404).json({ error: 'invoice_not_found' });
    }

    const invoice = invoiceDoc.data();

    // TODO: Enviar email con PDF de la factura
    // Por ahora, solo actualizamos el estado

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('invoices')
      .doc(invoiceId)
      .update({
        sentAt: FieldValue.serverTimestamp(),
        status: 'sent',
      });

    logger.info(`Supplier ${req.supplier.id} sent invoice ${invoiceId}`);

    return res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error) {
    logger.error('Error sending invoice:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /payments/invoice/:invoiceId/mark-paid - Marcar factura como pagada
router.post(
  '/payments/invoice/:invoiceId/mark-paid',
  requireSupplierAuth,
  express.json(),
  async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod = 'manual', transactionId } = req.body;

      await db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('invoices')
        .doc(invoiceId)
        .update({
          status: 'paid',
          paidAt: FieldValue.serverTimestamp(),
          paymentMethod,
          transactionId: transactionId || null,
        });

      logger.info(`Supplier ${req.supplier.id} marked invoice ${invoiceId} as paid`);

      return res.json({ success: true });
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      return res.status(500).json({ error: 'internal_error' });
    }
  }
);

export default router;
