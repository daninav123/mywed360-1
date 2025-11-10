import { get as apiGet, post as apiPost } from './apiClient';
import { getMailsPage } from './emailService';

function parseAmountToNumber(amountStr) {
  try {
    if (!amountStr) return null;
    const s = String(amountStr).replace(/[^0-9.,]/g, '').trim();
    if (!s) return null;
    // Heurística: si hay coma y punto, el separador de miles suele ser el primero que aparece repetido
    // Simplificar: quitar separadores de miles y usar último separador como decimal
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let normalized = s;
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      normalized = s.replace(/,/g, '');
    } else {
      normalized = s.replace(/,/g, '.');
    }
    const n = parseFloat(normalized);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

export async function getPaymentSuggestions({ folder = 'inbox', limit = 50 } = {}) {
  try {
    const { items } = await getMailsPage(folder, { limit }).catch(() => ({ items: [] }));
    const mails = Array.isArray(items) ? items : [];
    const suggestions = [];
    for (const m of mails) {
      try {
        const res = await apiGet(`/api/email-insights/${encodeURIComponent(m.id)}`, { auth: true, silent: true });
        if (!res.ok) continue;
        const data = await res.json();
        let pays = Array.isArray(data?.payments) ? data.payments : [];
        // Intentar re-analizar si no hay pagos detectados
        if (!pays.length) {
          try {
            const re = await apiPost(`/api/email-insights/reanalyze/${encodeURIComponent(m.id)}`, {}, { auth: true, silent: true });
            if (re.ok) {
              const data2 = await re.json();
              pays = Array.isArray(data2?.payments) ? data2.payments : [];
            }
          } catch {}
        }
        for (const p of pays) {
          const amountNum = parseAmountToNumber(p.amount || '');
          suggestions.push({
            mailId: m.id,
            subject: m.subject || '(Sin asunto)',
            date: m.date || new Date().toISOString(),
            from: m.from || '',
            amount: amountNum,
            rawAmount: p.amount || '',
            currency: (p.currency || '').toUpperCase() || 'EUR',
            direction: p.direction || 'outgoing',
            method: p.method || '',
            provider: '',
          });
        }
      } catch {}
    }
    return suggestions;
  } catch {
    return [];
  }
}

export default { getPaymentSuggestions };
