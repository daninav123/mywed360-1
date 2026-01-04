/**
 * Legal Documents Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const LEGAL_TEMPLATES = {
  privacy: {
    title: 'Política de Privacidad',
    content: 'Los datos personales recogidos serán tratados conforme al RGPD...'
  },
  terms: {
    title: 'Términos y Condiciones',
    content: 'Al confirmar su asistencia, acepta las condiciones del evento...'
  },
  cookies: {
    title: 'Política de Cookies',
    content: 'Este sitio web utiliza cookies para mejorar la experiencia...'
  }
};

class LegalDocsService {
  async getDoc(weddingId, docType) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/api/weddings/${weddingId}/legal/${docType}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const result = await response.json();
        return result.document || result.data;
      }
    } catch {}
    return LEGAL_TEMPLATES[docType];
  }

  async saveDoc(weddingId, docType, content) {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/weddings/${weddingId}/legal/${docType}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
  }

  getTemplates() {
    return LEGAL_TEMPLATES;
  }
}

export default new LegalDocsService();
