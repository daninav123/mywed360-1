/**
 * Legal Documents Service
 * Sprint 6 - S6-T002
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
    const docRef = doc(db, 'weddings', weddingId, 'legal', docType);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : LEGAL_TEMPLATES[docType];
  }

  async saveDoc(weddingId, docType, content) {
    const docRef = doc(db, 'weddings', weddingId, 'legal', docType);
    await setDoc(docRef, { content, updatedAt: new Date().toISOString() });
  }

  getTemplates() {
    return LEGAL_TEMPLATES;
  }
}

export default new LegalDocsService();
