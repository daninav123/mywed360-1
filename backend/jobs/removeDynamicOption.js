import { db } from '../config/firebase.js';

/**
 * Elimina una opción del catálogo dinámico global
 */
async function removeDynamicOption(suggestion) {
  try {
    console.log('🗑️ removeDynamicOption - Iniciando...');
    console.log('  Suggestion:', JSON.stringify(suggestion, null, 2));
    
    const { category, aiValidation } = suggestion;
    
    if (!aiValidation?.suggestedKey) {
      console.log('  ⚠️ No hay suggestedKey en aiValidation, no se puede eliminar');
      return { success: false, reason: 'No suggestedKey' };
    }
    
    const key = aiValidation.suggestedKey;
    
    console.log(`  Category: ${category}`);
    console.log(`  Key to remove: ${key}`);

    const docRef = db.collection('supplier_dynamic_specs').doc(category);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('  ℹ️ Documento no existe, nada que eliminar');
      return { success: true, reason: 'Document does not exist' };
    }

    const currentOptions = doc.data().dynamicOptions || {};
    console.log(`  Current options:`, Object.keys(currentOptions));
    
    if (!currentOptions[key]) {
      console.log(`  ℹ️ Opción ${key} no existe en el catálogo, nada que eliminar`);
      return { success: true, reason: 'Option not in catalog' };
    }
    
    // Eliminar opción
    delete currentOptions[key];
    console.log(`  Opciones después de eliminar:`, Object.keys(currentOptions));

    // Actualizar documento
    await docRef.set({
      category,
      dynamicOptions: currentOptions,
      updatedAt: new Date(),
      lastRemovedOption: {
        key,
        removedAt: new Date(),
        suggestionId: suggestion.id
      }
    }, { merge: true });
    
    console.log('  ✅ Opción eliminada del catálogo');
    console.log(`✅ Opción dinámica eliminada: ${category}.${key}`);
    
    return { success: true, key };
  } catch (error) {
    console.error('❌ Error eliminando opción dinámica:', error);
    console.error('  Stack:', error.stack);
    throw error;
  }
}

export { removeDynamicOption };
