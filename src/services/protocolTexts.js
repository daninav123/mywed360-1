/**
 * Protocol Texts Service
 * Gestión de textos del protocolo de boda
 * Sprint 6 - Protocolo Subsistemas, S6-T001
 */

import i18n from '../i18n';
import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Categorías de textos
 */
export const TEXT_CATEGORIES = {
  CEREMONY: 'ceremony',
  RECEPTION: 'reception',
  SPEECHES: 'speeches',
  TOASTS: 'toasts',
  READINGS: 'readings',
  VOWS: 'vows',
  THANK_YOU: 'thank_you',
  WELCOME: 'welcome'
};

/**
 * Templates predefinidos
 */
const DEFAULT_TEMPLATES = {
  ceremony_welcome: {
    title: 'Bienvenida Ceremonia',
    category: TEXT_CATEGORIES.CEREMONY,
    content: i18n.t('common.queridos_familiares_amigos_nos_reunimos_hoy'),
    variables: ['NOMBRE_NOVIO', 'NOMBRE_NOVIA', 'FECHA', 'LUGAR']
  },
  ceremony_vows: {
    title: 'Votos Matrimoniales',
    category: TEXT_CATEGORIES.VOWS,
    content: 'Yo, [NOMBRE], te tomo a ti, [NOMBRE_PAREJA], como mi esposo/a...',
    variables: ['NOMBRE', 'NOMBRE_PAREJA']
  },
  reception_welcome: {
    title: i18n.t('common.bienvenida_recepcion'),
    category: TEXT_CATEGORIES.RECEPTION,
    content: i18n.t('common.bienvenidos_celebracion_nuestra_boda_gracias_por'),
    variables: ['NOMBRE_NOVIO', 'NOMBRE_NOVIA']
  },
  toast_parents: {
    title: 'Brindis Padres',
    category: TEXT_CATEGORIES.TOASTS,
    content: 'Un brindis por nuestros padres, quienes nos han guiado hasta este momento...',
    variables: ['NOMBRE_PADRES_NOVIO', 'NOMBRE_PADRES_NOVIA']
  },
  speech_groom: {
    title: 'Discurso del Novio',
    category: TEXT_CATEGORIES.SPEECHES,
    content: i18n.t('common.quiero_agradecer_todos_por_estar_aqui'),
    variables: ['NOMBRE_NOVIA', 'FECHA_CONOCIERON', 'ANECDOTA']
  },
  reading_love: {
    title: 'Lectura sobre el Amor',
    category: TEXT_CATEGORIES.READINGS,
    content: 'El amor es paciente, el amor es bondadoso. No tiene envidia, no es jactancioso...',
    variables: []
  },
  thank_you_card: {
    title: 'Tarjeta de Agradecimiento',
    category: TEXT_CATEGORIES.THANK_YOU,
    content: i18n.t('common.queridoa_nombreinvitado_gracias_por_acompanarnos_nuestro'),
    variables: ['NOMBRE_INVITADO', 'REGALO']
  }
};

/**
 * ProtocolTexts Service
 */
class ProtocolTextsService {
  /**
   * Obtiene todos los textos de una boda
   */
  async getTexts(weddingId, category = null) {
    try {
      let textsQuery = collection(db, 'weddings', weddingId, 'protocolTexts');
      
      if (category) {
        textsQuery = query(textsQuery, where('category', '==', category));
      }

      const snapshot = await getDocs(textsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting texts:', error);
      throw error;
    }
  }

  /**
   * Obtiene un texto específico
   */
  async getText(weddingId, textId) {
    try {
      const textRef = doc(db, 'weddings', weddingId, 'protocolTexts', textId);
      const textDoc = await getDoc(textRef);

      if (!textDoc.exists()) {
        return null;
      }

      return {
        id: textDoc.id,
        ...textDoc.data()
      };
    } catch (error) {
      console.error('Error getting text:', error);
      throw error;
    }
  }

  /**
   * Guarda un texto
   */
  async saveText(weddingId, textId, textData) {
    try {
      const textRef = doc(db, 'weddings', weddingId, 'protocolTexts', textId);

      await setDoc(textRef, {
        ...textData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return { id: textId, ...textData };
    } catch (error) {
      console.error('Error saving text:', error);
      throw error;
    }
  }

  /**
   * Procesa variables en texto
   */
  processVariables(text, variables) {
    let processed = text;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      processed = processed.replace(regex, value || `[${key}]`);
    });

    return processed;
  }

  /**
   * Obtiene templates por defecto
   */
  getDefaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Inicializa textos con templates
   */
  async initializeWithTemplates(weddingId) {
    try {
      const promises = Object.entries(DEFAULT_TEMPLATES).map(([key, template]) => 
        this.saveText(weddingId, key, {
          ...template,
          isDefault: true,
          createdAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);

      return { initialized: true, count: promises.length };
    } catch (error) {
      console.error('Error initializing templates:', error);
      throw error;
    }
  }

  /**
   * Exporta todos los textos
   */
  async exportTexts(weddingId) {
    try {
      const texts = await this.getTexts(weddingId);

      return texts.map(text => ({
        title: text.title,
        category: text.category,
        content: text.content
      }));
    } catch (error) {
      console.error('Error exporting texts:', error);
      throw error;
    }
  }

  /**
   * Busca textos
   */
  async searchTexts(weddingId, searchTerm) {
    try {
      const texts = await this.getTexts(weddingId);

      return texts.filter(text => 
        text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        text.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching texts:', error);
      throw error;
    }
  }
}

const protocolTextsService = new ProtocolTextsService();
export default protocolTextsService;

/**
 * Hook React
 */
export function useProtocolTexts(weddingId) {
  const [texts, setTexts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!weddingId) return;

    const loadTexts = async () => {
      try {
        setLoading(true);
        const data = await protocolTextsService.getTexts(weddingId);
        setTexts(data);
      } catch (error) {
        console.error('Error loading texts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTexts();
  }, [weddingId]);

  const saveText = React.useCallback(async (textId, textData) => {
    const saved = await protocolTextsService.saveText(weddingId, textId, textData);
    setTexts(prev => {
      const index = prev.findIndex(t => t.id === textId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    return saved;
  }, [weddingId]);

  return {
    texts,
    loading,
    saveText,
    protocolTextsService
  };
}
