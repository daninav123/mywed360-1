/**
 * Servicio para verificar recibos y notificaciones de Apple
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Verifica un recibo de compra con Apple
 * @param {string} receiptData - Base64 encoded receipt
 * @returns {Promise<Object>} - Resultado de la verificación
 */
export async function verifyAppleReceipt(receiptData) {
  try {
    const password = process.env.APPLE_SHARED_SECRET;

    if (!password) {
      throw new Error('APPLE_SHARED_SECRET no configurado');
    }

    // Intentar primero con producción
    let response = await sendReceiptToApple(
      APPLE_PRODUCTION_URL,
      receiptData,
      password
    );

    // Si el estado es 21007, es un recibo de sandbox
    if (response.status === 21007) {
      console.log('📱 Recibo de sandbox detectado, reintentando...');
      response = await sendReceiptToApple(
        APPLE_SANDBOX_URL,
        receiptData,
        password
      );
    }

    // Códigos de estado de Apple
    // 0 = válido
    // 21000-21010 = varios errores
    if (response.status !== 0) {
      return {
        valid: false,
        error: getAppleErrorMessage(response.status)
      };
    }

    // Extraer información de la última transacción
    const { receipt } = response;
    const latestReceipt = response.latest_receipt_info?.[0] || receipt.in_app?.[0];

    if (!latestReceipt) {
      return {
        valid: false,
        error: 'No transaction found in receipt'
      };
    }

    return {
      valid: true,
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      originalTransactionId: latestReceipt.original_transaction_id,
      purchaseDate: new Date(parseInt(latestReceipt.purchase_date_ms)),
      expiresDate: latestReceipt.expires_date_ms 
        ? new Date(parseInt(latestReceipt.expires_date_ms))
        : null,
      environment: response.environment, // 'Production' o 'Sandbox'
      bundleId: receipt.bundle_id
    };

  } catch (error) {
    console.error('❌ Error verificando recibo Apple:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Envía un recibo a Apple para verificación
 */
async function sendReceiptToApple(url, receiptData, password) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': password,
      'exclude-old-transactions': true
    })
  });

  return await response.json();
}

/**
 * Verifica la firma JWT de una notificación de Apple
 * @param {Object} notification - Notificación de Apple
 * @returns {Promise<boolean>} - true si es válida
 */
export async function verifyAppleNotification(notification) {
  try {
    const { signedPayload } = notification;

    if (!signedPayload) {
      return false;
    }

    // Decodificar sin verificar primero para obtener el header
    const decoded = jwt.decode(signedPayload, { complete: true });

    if (!decoded) {
      return false;
    }

    // En producción, deberías verificar la firma con las claves públicas de Apple
    // Por ahora, solo validamos la estructura
    // TODO: Implementar verificación real con claves públicas de Apple
    
    console.log('⚠️ ADVERTENCIA: Verificación de firma Apple simplificada');
    console.log('   En producción, verifica con las claves públicas de Apple');

    // Validar que tenga los campos esperados
    const payload = decoded.payload;
    
    if (!payload.notificationType || !payload.data) {
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Error verificando notificación Apple:', error);
    return false;
  }
}

/**
 * Traduce códigos de error de Apple a mensajes legibles
 */
function getAppleErrorMessage(statusCode) {
  const errors = {
    21000: 'The App Store could not read the JSON object you provided',
    21002: 'The data in the receipt-data property was malformed',
    21003: 'The receipt could not be authenticated',
    21004: 'The shared secret you provided does not match',
    21005: 'The receipt server is not currently available',
    21006: 'This receipt is valid but subscription has expired',
    21007: 'This receipt is from sandbox but sent to production',
    21008: 'This receipt is from production but sent to sandbox',
    21009: 'Internal data access error',
    21010: 'The user account cannot be found or has been deleted'
  };

  return errors[statusCode] || `Unknown error: ${statusCode}`;
}

/**
 * Mapea product IDs de Apple a IDs internos
 */
export function mapAppleProductId(appleProductId) {
  const mapping = {
    'com.maloveapp.weddingpass': 'wedding_pass',
    'com.maloveapp.weddingpassplus': 'wedding_pass_plus',
    'com.maloveapp.plannerpack5.monthly': 'planner_pack5_monthly',
    'com.maloveapp.plannerpack5.annual': 'planner_pack5_annual',
    'com.maloveapp.plannerpack15.monthly': 'planner_pack15_monthly',
    'com.maloveapp.plannerpack15.annual': 'planner_pack15_annual',
    'com.maloveapp.teams40.monthly': 'teams40_monthly',
    'com.maloveapp.teams40.annual': 'teams40_annual',
    'com.maloveapp.teamsunlimited.monthly': 'teams_unlimited_monthly',
    'com.maloveapp.teamsunlimited.annual': 'teams_unlimited_annual'
  };

  return mapping[appleProductId] || appleProductId;
}
