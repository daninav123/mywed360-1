import { db } from '../config/firebase.js';
import { validateSupplierOption } from '../services/aiOptionValidation.js';
import { SPEC_LABELS } from '../../apps/main-app/src/utils/supplierRequirementsTemplate.js';

async function processOptionSuggestions() {
  console.log('🔄 Iniciando procesamiento de sugerencias de opciones...');
  
  try {
    const pendingSnapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', 'pending')
      .limit(10)
      .get();

    if (pendingSnapshot.empty) {
      console.log('✅ No hay sugerencias pendientes');
      return { processed: 0, approved: 0, rejected: 0 };
    }

    console.log(`📋 Procesando ${pendingSnapshot.size} sugerencias...`);

    let processed = 0;
    let approved = 0;
    let rejected = 0;

    for (const doc of pendingSnapshot.docs) {
      const suggestion = { id: doc.id, ...doc.data() };
      
      console.log(`🔍 Validando: ${suggestion.optionLabel} (${suggestion.category})`);

      await db.collection('supplier_option_suggestions')
        .doc(doc.id)
        .update({ status: 'validating' });

      const existingOptions = SPEC_LABELS[suggestion.category] || {};
      
      const validationResult = await validateSupplierOption(suggestion, existingOptions);

      if (!validationResult.success) {
        console.error(`❌ Error validando ${suggestion.optionLabel}:`, validationResult.error);
        await db.collection('supplier_option_suggestions')
          .doc(doc.id)
          .update({ 
            status: 'error',
            aiValidation: validationResult.validation,
            'metadata.updatedAt': new Date()
          });
        continue;
      }

      const validation = validationResult.validation;
      const score = validation.score;

      let newStatus = 'pending';
      let approvedBy = null;

      if (validation.duplicate) {
        newStatus = 'duplicate';
        rejected++;
      } else if (score >= 80) {
        newStatus = 'approved';
        approvedBy = 'system';
        approved++;
        
        await addDynamicOption(suggestion, validation);
        await notifyUserApproval(suggestion);
      } else if (score < 60) {
        newStatus = 'rejected';
        rejected++;
        await notifyUserRejection(suggestion, validation.reasoning);
      } else {
        newStatus = 'review';
      }

      await db.collection('supplier_option_suggestions')
        .doc(doc.id)
        .update({
          status: newStatus,
          aiValidation: validation,
          'metadata.updatedAt': new Date(),
          'metadata.approvedAt': newStatus === 'approved' ? new Date() : null,
          'metadata.approvedBy': approvedBy
        });

      processed++;
      console.log(`✅ Procesado: ${suggestion.optionLabel} - Status: ${newStatus} (Score: ${score})`);
    }

    console.log(`✅ Procesamiento completado: ${processed} procesadas, ${approved} aprobadas, ${rejected} rechazadas`);
    
    return { processed, approved, rejected };

  } catch (error) {
    console.error('❌ Error en processOptionSuggestions:', error);
    throw error;
  }
}

async function addDynamicOption(suggestion, validation) {
  try {
    const { category } = suggestion;
    const optionKey = validation.suggestedKey;
    
    const dynamicSpecRef = db.collection('supplier_dynamic_specs').doc(category);
    const dynamicSpecDoc = await dynamicSpecRef.get();

    const newOption = {
      label: validation.suggestedLabel,
      type: validation.suggestedType,
      default: validation.suggestedType === 'boolean' ? false : null,
      addedAt: new Date(),
      addedBy: 'system',
      usageCount: 0,
      originSuggestionId: suggestion.id
    };

    if (dynamicSpecDoc.exists) {
      await dynamicSpecRef.update({
        [`dynamicOptions.${optionKey}`]: newOption,
        lastUpdated: new Date()
      });
    } else {
      await dynamicSpecRef.set({
        category,
        dynamicOptions: {
          [optionKey]: newOption
        },
        lastUpdated: new Date()
      });
    }

    console.log(`✨ Opción dinámica añadida: ${category}.${optionKey}`);
  } catch (error) {
    console.error('❌ Error añadiendo opción dinámica:', error);
  }
}

async function notifyUserApproval(suggestion) {
  try {
    const notification = {
      userId: suggestion.suggestedBy.userId,
      type: 'option_approved',
      title: '✅ Tu sugerencia fue aprobada',
      message: `La opción "${suggestion.optionLabel}" para ${suggestion.categoryName} ya está disponible para todos los usuarios.`,
      data: {
        suggestionId: suggestion.id,
        category: suggestion.category,
        optionLabel: suggestion.optionLabel
      },
      read: false,
      createdAt: new Date()
    };

    await db.collection('notifications').add(notification);
    console.log(`📬 Notificación enviada a ${suggestion.suggestedBy.userId}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de aprobación:', error);
  }
}

async function notifyUserRejection(suggestion, reasoning) {
  try {
    const notification = {
      userId: suggestion.suggestedBy.userId,
      type: 'option_rejected',
      title: '❌ Sugerencia no aprobada',
      message: `La opción "${suggestion.optionLabel}" no cumplió los criterios. Razón: ${reasoning}`,
      data: {
        suggestionId: suggestion.id,
        category: suggestion.category,
        optionLabel: suggestion.optionLabel,
        reasoning
      },
      read: false,
      createdAt: new Date()
    };

    await db.collection('notifications').add(notification);
  } catch (error) {
    console.error('❌ Error enviando notificación de rechazo:', error);
  }
}

async function cleanupRejectedSuggestions() {
  console.log('🧹 Limpiando sugerencias rechazadas antiguas...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', 'in', ['rejected', 'duplicate'])
      .where('metadata.createdAt', '<', thirtyDaysAgo)
      .get();

    if (snapshot.empty) {
      console.log('✅ No hay sugerencias para limpiar');
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ ${snapshot.size} sugerencias rechazadas eliminadas`);
    return snapshot.size;

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    throw error;
  }
}

export {
  processOptionSuggestions,
  cleanupRejectedSuggestions
};
