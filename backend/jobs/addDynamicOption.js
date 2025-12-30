import { db } from '../config/firebase.js';
import { generateKey } from '../services/aiOptionValidation.js';

/**
 * Añade una opción aprobada al catálogo dinámico global
 */
async function addDynamicOption(suggestion, validation) {
  try {
    console.log('🔧 addDynamicOption - Iniciando...');
    console.log('  Suggestion:', JSON.stringify(suggestion, null, 2));
    console.log('  Validation:', JSON.stringify(validation, null, 2));
    
    const { category, optionLabel } = suggestion;
    
    console.log(`  Category: ${category}`);
    console.log(`  OptionLabel: ${optionLabel}`);
    
    const key = validation.suggestedKey || generateKey(optionLabel);
    const label = validation.suggestedLabel || optionLabel;
    const type = validation.suggestedType || 'boolean';

    console.log(`  Generated key: ${key}`);
    console.log(`  Label: ${label}`);

    const docRef = db.collection('supplier_dynamic_specs').doc(category);
    console.log(`  DocRef path: supplier_dynamic_specs/${category}`);
    
    const doc = await docRef.get();
    console.log(`  Doc exists: ${doc.exists}`);

    const currentOptions = doc.exists ? (doc.data().dynamicOptions || {}) : {};
    console.log(`  Current options count: ${Object.keys(currentOptions).length}`);
    
    // Añadir nueva opción
    currentOptions[key] = label;
    console.log(`  New options count: ${Object.keys(currentOptions).length}`);

    // Guardar o actualizar documento
    const dataToSave = {
      category,
      dynamicOptions: currentOptions,
      updatedAt: new Date(),
      lastAddedOption: {
        key,
        label,
        addedAt: new Date(),
        suggestionId: suggestion.id
      }
    };
    
    console.log('  Guardando en Firestore:', JSON.stringify(dataToSave, null, 2));
    await docRef.set(dataToSave, { merge: true });
    console.log('  ✅ Guardado exitoso en Firestore');

    console.log(`✅ Opción dinámica añadida: ${category}.${key} = "${label}"`);
    
    return { success: true, key, label };
  } catch (error) {
    console.error('❌ Error añadiendo opción dinámica:', error);
    console.error('  Stack:', error.stack);
    throw error;
  }
}

export { addDynamicOption };
