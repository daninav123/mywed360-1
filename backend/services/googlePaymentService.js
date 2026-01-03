/**
 * Servicio para verificar compras y suscripciones de Google Play
 */

import { google } from 'googleapis';

const androidpublisher = google.androidpublisher('v3');

/**
 * Obtiene cliente autenticado de Google Play
 */
async function getGooglePlayClient() {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Credenciales de Google Play no configuradas');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });

  const authClient = await auth.getClient();
  google.options({ auth: authClient });

  return androidpublisher;
}

/**
 * Verifica una suscripción de Google Play
 * @param {string} productId - ID del producto de suscripción
 * @param {string} purchaseToken - Token de compra
 * @returns {Promise<Object>} - Resultado de la verificación
 */
export async function verifyGoogleSubscription(productId, purchaseToken) {
  try {
    const packageName = process.env.GOOGLE_PACKAGE_NAME || 'com.maloveapp';
    const client = await getGooglePlayClient();

    const response = await client.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken
    });

    const purchase = response.data;

    // Validar estado de la compra
    // paymentState: 0 = Pending, 1 = Received, 2 = Free trial, 3 = Pending deferred upgrade/downgrade
    const isValid = purchase.paymentState === 1 || purchase.paymentState === 2;

    if (!isValid) {
      return {
        valid: false,
        error: 'Payment not received'
      };
    }

    return {
      valid: true,
      orderId: purchase.orderId,
      productId,
      purchaseToken,
      paymentState: purchase.paymentState,
      expiryTimeMillis: purchase.expiryTimeMillis,
      autoRenewing: purchase.autoRenewing,
      acknowledgementState: purchase.acknowledgementState,
      kind: purchase.kind,
      startTimeMillis: purchase.startTimeMillis,
      cancelReason: purchase.cancelReason
    };

  } catch (error) {
    console.error('❌ Error verificando suscripción Google:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Verifica una compra única de Google Play
 * @param {string} productId - ID del producto
 * @param {string} purchaseToken - Token de compra
 * @returns {Promise<Object>} - Resultado de la verificación
 */
export async function verifyGooglePurchase(productId, purchaseToken) {
  try {
    const packageName = process.env.GOOGLE_PACKAGE_NAME || 'com.maloveapp';
    const client = await getGooglePlayClient();

    const response = await client.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken
    });

    const purchase = response.data;

    // Validar estado de la compra
    // purchaseState: 0 = Purchased, 1 = Canceled, 2 = Pending
    const isValid = purchase.purchaseState === 0;

    if (!isValid) {
      return {
        valid: false,
        error: purchase.purchaseState === 1 ? 'Purchase canceled' : 'Purchase pending'
      };
    }

    return {
      valid: true,
      orderId: purchase.orderId,
      productId,
      purchaseToken,
      purchaseState: purchase.purchaseState,
      purchaseTimeMillis: purchase.purchaseTimeMillis,
      acknowledgementState: purchase.acknowledgementState,
      kind: purchase.kind,
      consumptionState: purchase.consumptionState
    };

  } catch (error) {
    console.error('❌ Error verificando compra Google:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Reconoce (acknowledge) una compra de Google Play
 * Necesario para confirmar que se procesó la compra
 */
export async function acknowledgeGooglePurchase(productId, purchaseToken) {
  try {
    const packageName = process.env.GOOGLE_PACKAGE_NAME || 'com.maloveapp';
    const client = await getGooglePlayClient();

    await client.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken
    });

    console.log('✅ Compra Google reconocida');
    return { success: true };

  } catch (error) {
    console.error('❌ Error reconociendo compra Google:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reconoce (acknowledge) una suscripción de Google Play
 */
export async function acknowledgeGoogleSubscription(subscriptionId, purchaseToken) {
  try {
    const packageName = process.env.GOOGLE_PACKAGE_NAME || 'com.maloveapp';
    const client = await getGooglePlayClient();

    await client.purchases.subscriptions.acknowledge({
      packageName,
      subscriptionId,
      token: purchaseToken
    });

    console.log('✅ Suscripción Google reconocida');
    return { success: true };

  } catch (error) {
    console.error('❌ Error reconociendo suscripción Google:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mapea product IDs de Google a IDs internos
 */
export function mapGoogleProductId(googleProductId) {
  const mapping = {
    'wedding_pass': 'wedding_pass',
    'wedding_pass_plus': 'wedding_pass_plus',
    'planner_pack5_monthly': 'planner_pack5_monthly',
    'planner_pack5_annual': 'planner_pack5_annual',
    'planner_pack15_monthly': 'planner_pack15_monthly',
    'planner_pack15_annual': 'planner_pack15_annual',
    'teams40_monthly': 'teams40_monthly',
    'teams40_annual': 'teams40_annual',
    'teams_unlimited_monthly': 'teams_unlimited_monthly',
    'teams_unlimited_annual': 'teams_unlimited_annual'
  };

  return mapping[googleProductId] || googleProductId;
}
