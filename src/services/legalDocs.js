/**
 * Legal Documents Service
 * Sprint 6 - S6-T002
 */

import i18n from '../i18n';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const LEGAL_TEMPLATES = {
  privacy: {
    title: i18n.t('common.politica_privacidad'),
    content: i18n.t('common.los_datos_personales_recogidos_seran_tratados')
  },
  terms: {
    title: 'Términos y Condiciones',
    content: 'Al confirmar su asistencia, acepta las condiciones del evento...'
  },
  cookies: {
    title: i18n.t('common.politica_cookies'),
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
