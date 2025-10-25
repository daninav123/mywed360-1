import i18n from '../i18n';

/**
 * Stripe Service - Frontend
 * Maneja la creación de sesiones de checkout con Stripe
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004i18n.t('common.crea_una_sesion_checkout_para_producto')wedding_pass', 'planner_pack5_monthly')
 * @param {string} weddingId - ID de la boda (opcional)
 * @returns {Promise<Object>} - Objeto con sessionId y url de checkout
 */
export async function createCheckoutSession({ productId, weddingId = null }) {
  try {
    const token = localStorage.getItem('authTokeni18n.t('common.todo_ajustar_segun_sistema_auth_const')POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        productId,
        weddingId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || i18n.t('common.error_crear_sesion_pago'));
    }

    return await response.json();

  } catch (error) {
    console.error('Error en createCheckoutSession:', error);
    throw error;
  }
}

/**
 * IDs de productos para Stripe
 */
export const PRODUCT_IDS = {
  // Parejas (one-time)
  weddingPass: 'wedding_pass',
  weddingPassPlus: 'wedding_pass_plus',
  
  // Planners (subscriptions)
  pack5Monthly: 'planner_pack5_monthly',
  pack5Annual: 'planner_pack5_annual',
  pack15Monthly: 'planner_pack15_monthly',
  pack15Annual: 'planner_pack15_annual',
  teams40Monthly: 'teams40_monthly',
  teams40Annual: 'teams40_annual',
  teamsUnlimitedMonthly: 'teams_unlimited_monthly',
  teamsUnlimitedAnnual: 'teams_unlimited_annuali18n.t('common.verifica_estado_una_sesion_checkout_param')authToken');

    const response = await fetch(`${API_BASE_URL}/api/stripe/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(i18n.t('common.error_obtener_sesion'));
    }

    return await response.json();

  } catch (error) {
    console.error('Error en getCheckoutSession:', error);
    throw error;
  }
}

/**
 * Obtiene el portal de gestión de suscripciones del cliente
 * @returns {Promise<string>} - URL del portal del cliente
 */
export async function createCustomerPortalSession() {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        returnUrl: window.location.origin + '/dashboard',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al crear portal del cliente');
    }

    const { url } = await response.json();
    return url;

  } catch (error) {
    console.error('Error en createCustomerPortalSession:', error);
    throw error;
  }
}
