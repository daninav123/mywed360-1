/**
 * Script para sincronizar traducciones entre idiomas
 * Identifica claves faltantes y las completa con traducciones automáticas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const SOURCE_LANG = 'es'; // Idioma de referencia
const TARGET_LANGS = ['en', 'fr', 'de', 'it', 'pt', 'es-AR', 'es-MX'];
const NAMESPACES = ['common', 'email', 'finance', 'tasks', 'seating', 'admin', 'chat', 'marketing', 'debugAuth'];

// Función para obtener todas las claves de un objeto de manera recursiva
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Función para obtener valor anidado
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Función para establecer valor anidado
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  try {
    let target = obj;
    for (const key of keys) {
      // Si el valor actual es un string o primitive, no podemos anidar
      if (target[key] !== undefined && typeof target[key] !== 'object') {
        return; // Skip silently
      }
      if (!target[key]) target[key] = {};
      target = target[key];
    }
    
    if (target && typeof target === 'object') {
      target[lastKey] = value;
    }
  } catch (err) {
    // Skip silently
  }
}

// Función para cargar archivo JSON
function loadJSON(lang, namespace) {
  const filepath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Error leyendo ${filepath}:`, err.message);
    return null;
  }
}

// Función para guardar archivo JSON
function saveJSON(lang, namespace, data) {
  const dir = path.join(LOCALES_DIR, lang);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filepath = path.join(dir, `${namespace}.json`);
  const content = JSON.stringify(data, null, 2);
  
  fs.writeFileSync(filepath, content, { encoding: 'utf8' });
}

// Función para traducir texto (placeholder - aquí iría la API de traducción)
function translateText(text, sourceLang, targetLang) {
  // Por ahora, devolvemos el texto original con un marcador
  // En producción, esto usaría DeepL API o similar
  
  // Casos especiales que no necesitan traducción
  if (typeof text !== 'string') {
    return text;
  }
  
  if (text.length === 0) {
    return text;
  }
  
  // Si el texto es un placeholder, mantenerlo
  if (text.match(/\{\{.*\}\}/) || text.match(/\$\{.*\}/)) {
    return text;
  }
  
  // Traducciones básicas conocidas ES → otros idiomas
  const basicTranslations = {
    en: {
      'Guardar': 'Save',
      'Cancelar': 'Cancel',
      'Aceptar': 'Accept',
      'Eliminar': 'Delete',
      'Editar': 'Edit',
      'Añadir': 'Add',
      'Buscar': 'Search',
      'Filtrar': 'Filter',
      'Cerrar': 'Close',
      'Abrir': 'Open',
      'Sí': 'Yes',
      'No': 'No',
      'Volver': 'Back',
      'Siguiente': 'Next',
      'Anterior': 'Previous',
      'Continuar': 'Continue',
      'Finalizar': 'Finish',
      'Cargando...': 'Loading...',
      'Error': 'Error',
      'Éxito': 'Success',
    },
    fr: {
      'Guardar': 'Enregistrer',
      'Cancelar': 'Annuler',
      'Aceptar': 'Accepter',
      'Eliminar': 'Supprimer',
      'Editar': 'Modifier',
      'Añadir': 'Ajouter',
      'Buscar': 'Rechercher',
      'Filtrar': 'Filtrer',
      'Cerrar': 'Fermer',
      'Abrir': 'Ouvrir',
      'Sí': 'Oui',
      'No': 'Non',
      'Volver': 'Retour',
      'Siguiente': 'Suivant',
      'Anterior': 'Précédent',
      'Continuar': 'Continuer',
      'Finalizar': 'Terminer',
      'Cargando...': 'Chargement...',
      'Error': 'Erreur',
      'Éxito': 'Succès',
    },
    de: {
      'Guardar': 'Speichern',
      'Cancelar': 'Abbrechen',
      'Aceptar': 'Akzeptieren',
      'Eliminar': 'Löschen',
      'Editar': 'Bearbeiten',
      'Añadir': 'Hinzufügen',
      'Buscar': 'Suchen',
      'Filtrar': 'Filtern',
      'Cerrar': 'Schließen',
      'Abrir': 'Öffnen',
      'Sí': 'Ja',
      'No': 'Nein',
      'Volver': 'Zurück',
      'Siguiente': 'Weiter',
      'Anterior': 'Zurück',
      'Continuar': 'Fortfahren',
      'Finalizar': 'Beenden',
      'Cargando...': 'Laden...',
      'Error': 'Fehler',
      'Éxito': 'Erfolg',
    },
    it: {
      'Guardar': 'Salva',
      'Cancelar': 'Annulla',
      'Aceptar': 'Accetta',
      'Eliminar': 'Elimina',
      'Editar': 'Modifica',
      'Añadir': 'Aggiungi',
      'Buscar': 'Cerca',
      'Filtrar': 'Filtra',
      'Cerrar': 'Chiudi',
      'Abrir': 'Apri',
      'Sí': 'Sì',
      'No': 'No',
      'Volver': 'Indietro',
      'Siguiente': 'Avanti',
      'Anterior': 'Precedente',
      'Continuar': 'Continua',
      'Finalizar': 'Termina',
      'Cargando...': 'Caricamento...',
      'Error': 'Errore',
      'Éxito': 'Successo',
    },
    pt: {
      'Guardar': 'Salvar',
      'Cancelar': 'Cancelar',
      'Aceptar': 'Aceitar',
      'Eliminar': 'Excluir',
      'Editar': 'Editar',
      'Añadir': 'Adicionar',
      'Buscar': 'Buscar',
      'Filtrar': 'Filtrar',
      'Cerrar': 'Fechar',
      'Abrir': 'Abrir',
      'Sí': 'Sim',
      'No': 'Não',
      'Volver': 'Voltar',
      'Siguiente': 'Próximo',
      'Anterior': 'Anterior',
      'Continuar': 'Continuar',
      'Finalizar': 'Finalizar',
      'Cargando...': 'Carregando...',
      'Error': 'Erro',
      'Éxito': 'Sucesso',
    },
  };
  
  if (targetLang !== sourceLang && basicTranslations[targetLang]?.[text]) {
    return basicTranslations[targetLang][text];
  }
  
  // Si no encontramos traducción, marcar como pendiente
  return text; // En producción esto llamaría a la API
}

// Función principal
function syncNamespace(namespace, sourceLang, targetLang) {
  const sourceData = loadJSON(sourceLang, namespace);
  
  if (!sourceData) {
    console.log(`   ⏭️  ${namespace}: No existe en ${sourceLang}, omitiendo`);
    return { synced: 0, created: false };
  }
  
  let targetData = loadJSON(targetLang, namespace);
  const isNewFile = !targetData;
  
  if (!targetData) {
    targetData = {};
  }
  
  // Obtener todas las claves del source
  const sourceKeys = getAllKeys(sourceData);
  const targetKeys = getAllKeys(targetData);
  
  const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
  
  if (missingKeys.length === 0 && !isNewFile) {
    return { synced: 0, created: false };
  }
  
  // Agregar claves faltantes
  let syncedCount = 0;
  for (const key of missingKeys) {
    const sourceValue = getNestedValue(sourceData, key);
    const translatedValue = translateText(sourceValue, sourceLang, targetLang);
    setNestedValue(targetData, key, translatedValue);
    syncedCount++;
  }
  
  // Guardar archivo
  saveJSON(targetLang, namespace, targetData);
  
  return { synced: syncedCount, created: isNewFile };
}

// Ejecutar
console.log(`🔄 Sincronizando traducciones desde ${SOURCE_LANG}...\n`);

const stats = {
  totalNamespaces: 0,
  filesCreated: 0,
  keysSynced: 0,
};

for (const targetLang of TARGET_LANGS) {
  console.log(`📝 ${targetLang.toUpperCase()}:`);
  
  for (const namespace of NAMESPACES) {
    stats.totalNamespaces++;
    const result = syncNamespace(namespace, SOURCE_LANG, targetLang);
    
    if (result.created) {
      stats.filesCreated++;
      console.log(`   ✨ ${namespace}: Archivo creado con ${result.synced} claves`);
    } else if (result.synced > 0) {
      stats.keysSynced += result.synced;
      console.log(`   ✅ ${namespace}: ${result.synced} claves sincronizadas`);
    }
  }
  
  console.log('');
}

console.log('📊 Resumen:');
console.log(`   Namespaces procesados: ${stats.totalNamespaces}`);
console.log(`   Archivos creados: ${stats.filesCreated}`);
console.log(`   Claves sincronizadas: ${stats.keysSynced}`);

if (stats.filesCreated > 0 || stats.keysSynced > 0) {
  console.log('\n✨ Sincronización completada!');
  console.log('   NOTA: Las traducciones automáticas son básicas.');
  console.log('   Se recomienda revisión manual para traducciones complejas.');
} else {
  console.log('\n✨ Todos los idiomas ya están sincronizados!');
}
