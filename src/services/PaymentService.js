import i18n from '../i18n';
import { post } from './apiClient';

export async function checkoutProviderDeposit({
  providerId,
  providerName,
  amount = 100,
  currency = 'EURi18n.t('common.weddingid_null_const_desc_senal_proveedor')/api/payments/checkout',
    {
      amount,
      currency,
      description: desc,
      weddingId,
      metadata: { providerId, providerName, weddingId },
    },
    { auth: true }
  );
  if (!res.ok) throw new Error(`checkout ${res.status}`);
  const data = await res.json();
  if (!data?.url) throw new Error('No session URL');
  window.open(data.url, '_blank', 'noopener');
  return true;
}
