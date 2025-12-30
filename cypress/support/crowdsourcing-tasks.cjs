/**
 * Cypress Tasks para testing del sistema de crowdsourcing
 * Estos tasks se ejecutan en Node.js y pueden acceder a Firestore directamente
 */

const admin = require('firebase-admin');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Inicializar Firebase Admin si no está ya inicializado
function ensureFirebaseInitialized() {
  if (!admin.apps.length) {
    try {
      const serviceAccountPath = path.join(__dirname, '../../backend/serviceAccount.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin inicializado para tareas de crowdsourcing");
      } else {
        throw new Error('serviceAccount.json no encontrado');
      }
    } catch (error) {
      console.error("❌ Error inicializando Firebase Admin:", error.message);
      throw error;
    }
  }
  return admin;
}

module.exports = {
  /**
   * Limpia datos de test de usuarios específicos
   */
  async cleanupTestData({ emails, cleanSuggestions = false }) {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    const batch = db.batch();
    let deletedCount = 0;

    try {
      // Eliminar usuarios de autenticación
      for (const email of emails) {
        try {
          const user = await admin.auth().getUserByEmail(email);
          await admin.auth().deleteUser(user.uid);
          console.log(`✅ Usuario eliminado: ${email}`);
          
          // Eliminar datos de Firestore
          const userDoc = db.collection('users').doc(user.uid);
          batch.delete(userDoc);
          deletedCount++;
        } catch (error) {
          if (error.code !== 'auth/user-not-found') {
            console.error(`Error eliminando usuario ${email}:`, error);
          }
        }
      }

      // Eliminar sugerencias de test si se solicita
      if (cleanSuggestions) {
        const suggestionsSnapshot = await db.collection('supplier_option_suggestions')
          .where('suggestedBy.email', 'in', emails)
          .get();

        suggestionsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      }

      await batch.commit();
      console.log(`🧹 Limpieza completada: ${deletedCount} documentos eliminados`);
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error en cleanup:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verifica sugerencias en Firestore
   */
  async checkFirestoreSuggestions({ userEmail, expectedCount }) {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    
    try {
      const snapshot = await db.collection('supplier_option_suggestions')
        .where('suggestedBy.email', '==', userEmail)
        .get();

      const suggestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        count: suggestions.length,
        suggestions,
        matchesExpected: suggestions.length === expectedCount
      };
    } catch (error) {
      console.error('Error verificando sugerencias:', error);
      return { count: 0, suggestions: [], error: error.message };
    }
  },

  /**
   * Ejecuta el job de procesamiento de sugerencias
   */
  async runSupplierOptionsJob() {
    try {
      const scriptPath = path.join(__dirname, '../../backend/scripts/run-option-suggestions-job.js');
      
      console.log('🚀 Ejecutando job de procesamiento de sugerencias...');
      
      // Escapar el path correctamente para manejar espacios
      const output = execSync(`node "${scriptPath}"`, {
        encoding: 'utf-8',
        timeout: 30000, // 30 segundos timeout
        shell: '/bin/bash' // Usar bash para mejor manejo de paths con espacios
      });

      console.log('📋 Output del job:', output);

      // Parsear el output para obtener estadísticas
      const processedMatch = output.match(/(\d+) procesadas/);
      const approvedMatch = output.match(/(\d+) aprobadas/);
      const rejectedMatch = output.match(/(\d+) rechazadas/);

      return {
        success: true,
        output,
        processed: processedMatch ? parseInt(processedMatch[1]) : 0,
        approved: approvedMatch ? parseInt(approvedMatch[1]) : 0,
        rejected: rejectedMatch ? parseInt(rejectedMatch[1]) : 0
      };
    } catch (error) {
      console.error('❌ Error ejecutando job:', error);
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr
      };
    }
  },

  /**
   * Verifica opciones dinámicas en el catálogo
   */
  async checkDynamicOptions({ category }) {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    
    try {
      const doc = await db.collection('supplier_dynamic_specs').doc(category).get();
      
      if (!doc.exists) {
        return { exists: false, optionsCount: 0, options: {} };
      }

      const data = doc.data();
      const options = data.dynamicOptions || {};
      
      return {
        exists: true,
        optionsCount: Object.keys(options).length,
        options
      };
    } catch (error) {
      console.error('Error verificando opciones dinámicas:', error);
      return { exists: false, optionsCount: 0, error: error.message };
    }
  },

  /**
   * Obtiene opciones aprobadas para una categoría
   */
  async getApprovedOptions({ category }) {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    
    try {
      const doc = await db.collection('supplier_dynamic_specs').doc(category).get();
      
      if (!doc.exists) {
        return [];
      }

      const data = doc.data();
      const options = data.dynamicOptions || {};
      
      return Object.entries(options).map(([key, value]) => ({
        key,
        label: value.label,
        type: value.type,
        addedAt: value.addedAt,
        usageCount: value.usageCount || 0
      }));
    } catch (error) {
      console.error('Error obteniendo opciones aprobadas:', error);
      return [];
    }
  },

  /**
   * Obtiene estadísticas del sistema de crowdsourcing
   */
  async getCrowdsourcingStats() {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    
    try {
      const snapshot = await db.collection('supplier_option_suggestions').get();
      
      const stats = {
        total: snapshot.size,
        approved: 0,
        review: 0,
        rejected: 0,
        pending: 0,
        scores: []
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats[data.status] = (stats[data.status] || 0) + 1;
        
        if (data.aiValidation?.score) {
          stats.scores.push(data.aiValidation.score);
        }
      });

      // Calcular score promedio
      if (stats.scores.length > 0) {
        const sum = stats.scores.reduce((a, b) => a + b, 0);
        stats.avgScore = Math.round(sum / stats.scores.length);
      } else {
        stats.avgScore = 0;
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { total: 0, approved: 0, review: 0, rejected: 0, avgScore: 0 };
    }
  },

  /**
   * Verifica notificaciones de un usuario
   */
  async checkUserNotifications({ userId }) {
    ensureFirebaseInitialized();
    const db = admin.firestore();
    
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error verificando notificaciones:', error);
      return [];
    }
  }
};
