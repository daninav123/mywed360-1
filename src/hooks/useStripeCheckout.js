import { useState } from 'react';
import { createCheckoutSession, PRODUCT_IDS } from '../services/stripeService';
import { useTranslations } from '../../hooks/useTranslations';

/**
 * Hook personalizado para manejar checkout de Stripe
 * @returns {Object} Estado y funciones para checkout
 */
export function useStripeCheckout() {
  const { t } = useTranslations();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Inicia el proceso de checkout
   * @param {string} productId - ID del producto
   * @param {string} weddingId - ID de la boda (opcional)
   */
  const startCheckout = async (productId, weddingId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await createCheckoutSession({ productId, weddingId });
      
      // Redirigir a Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error(t('common.recibio_url_checkout'));
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return {
    startCheckout,
    isLoading,
    error,
  };
}

export { PRODUCT_IDS };
