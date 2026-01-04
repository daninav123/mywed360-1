/**
 * Contract Email Service - PostgreSQL Version
 * Detecta contratos en emails y los guarda
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const EMAIL_KEYWORDS = ['contrato', 'contract', 'agreement', 'contratación', 'firmado'];
const ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

const matchesContractHeuristics = (email) => {
  const subject = String(email?.subject || '').toLowerCase();
  const body = String(email?.body || '').toLowerCase();
  return EMAIL_KEYWORDS.some((keyword) => subject.includes(keyword) || body.includes(keyword));
};

export async function processEmailForContract(email, weddingId) {
  if (!email || !weddingId) return null;
  
  if (!matchesContractHeuristics(email)) return null;
  
  const attachments = email?.attachments || [];
  if (attachments.length === 0) return null;

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/contracts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weddingId,
        provider: email.from || 'Proveedor',
        type: 'Contrato',
        status: 'Pendiente',
        source: {
          emailId: email.id,
          subject: email.subject,
          from: email.from,
          receivedAt: email.date,
        },
        attachments
      })
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.contract || result.data;
  } catch (error) {
    console.error('Error processing contract email:', error);
    return null;
  }
}

export async function getContractsByWedding(weddingId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/contracts?weddingId=${weddingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.contracts || result.data || [];
  } catch {
    return [];
  }
}

export default { processEmailForContract, getContractsByWedding };
