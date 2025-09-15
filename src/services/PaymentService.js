import { post } from './apiClient';

export async function checkoutProviderDeposit({ providerId, providerName, amount = 100, currency = 'EUR' }) {
  const desc = `Señal proveedor: ${providerName || providerId}`;
  const res = await post('/api/payments/checkout', { amount, currency, description: desc, metadata: { providerId, providerName } }, { auth: true });
  if (!res.ok) throw new Error(`checkout ${res.status}`);
  const data = await res.json();
  if (!data?.url) throw new Error('No session URL');
  window.open(data.url, '_blank', 'noopener');
  return true;
}

