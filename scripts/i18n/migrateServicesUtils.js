#!/usr/bin/env node

/**
 * Script para migrar strings de servicios y utils a i18n
 * Estos archivos no son React, así que la lógica es diferente
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');
const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');

let filesModified = 0;
let stringsAdded = 0;

const translations = {
  es: {},
  en: {},
  fr: {},
};

// Diccionario de traducciones específicas
const TRANSLATIONS = {
  en: {
    'Muy débil': 'Very weak',
    'Introduce una contraseña con al menos 8 caracteres.': 'Enter a password with at least 8 characters.',
    'Aumenta la longitud a 12 caracteres o más.': 'Increase length to 12 characters or more.',
    'Combina mayúsculas y minúsculas.': 'Combine uppercase and lowercase.',
    'Añade números para reforzarla.': 'Add numbers to strengthen it.',
    'Incluye símbolos como !, %, # o similares.': 'Include symbols like !, %, # or similar.',
    'Evita repetir el mismo carácter varias veces seguidas.': 'Avoid repeating the same character multiple times.',
    'Mailgun no está configurado correctamente': 'Mailgun is not configured correctly',
    'Correo electrónico requerido': 'Email required',
    'Este nombre de usuario no está disponible': 'This username is not available',
    'Contraseña incorrecta': 'Incorrect password',
    'Email inválido': 'Invalid email',
    'Demasiados intentos. Intenta más tarde': 'Too many attempts. Try again later',
    'El email ya está en uso': 'Email is already in use',
    'Sin título': 'Untitled',
    'Operación cancelada': 'Operation cancelled',
    'Invitado anónimo': 'Anonymous guest',
    'Firebase no está configurado (db nulo)': 'Firebase is not configured (null db)',
    'Galería de recuerdos': 'Memory gallery',
    'Conexión con base de datos de emails OK': 'Email database connection OK',
    'Error de conexión con Firestore': 'Firestore connection error',
    'IndexedDB está bloqueado o no disponible': 'IndexedDB is blocked or unavailable',
    'IndexedDB no está disponible en este navegador': 'IndexedDB is not available in this browser',
    'Conexión restablecida correctamente': 'Connection restored successfully',
    'Invitación no encontrada': 'Invitation not found',
    'Organización y Logística': 'Organization and Logistics',
    'Después de la Boda': 'After the Wedding',
  },
  fr: {
    'Muy débil': 'Très faible',
    'Introduce una contraseña con al menos 8 caracteres.': 'Entrez un mot de passe d\'au moins 8 caractères.',
    'Aumenta la longitud a 12 caracteres o más.': 'Augmentez la longueur à 12 caractères ou plus.',
    'Combina mayúsculas y minúsculas.': 'Combinez majuscules et minuscules.',
    'Añade números para reforzarla.': 'Ajoutez des chiffres pour le renforcer.',
    'Incluye símbolos como !, %, # o similares.': 'Incluez des symboles comme !, %, # ou similaires.',
    'Evita repetir el mismo carácter varias veces seguidas.': 'Évitez de répéter le même caractère plusieurs fois.',
    'Mailgun no está configurado correctamente': 'Mailgun n\'est pas configuré correctement',
    'Correo electrónico requerido': 'Email requis',
    'Este nombre de usuario no está disponible': 'Ce nom d\'utilisateur n\'est pas disponible',
    'Contraseña incorrecta': 'Mot de passe incorrect',
    'Email inválido': 'Email invalide',
    'Demasiados intentos. Intenta más tarde': 'Trop de tentatives. Réessayez plus tard',
    'El email ya está en uso': 'L\'email est déjà utilisé',
    'Sin título': 'Sans titre',
    'Operación cancelada': 'Opération annulée',
    'Invitado anónimo': 'Invité anonyme',
    'Firebase no está configurado (db nulo)': 'Firebase n\'est pas configuré (db null)',
    'Galería de recuerdos': 'Galerie de souvenirs',
    'Conexión con base de datos de emails OK': 'Connexion à la base de données d\'emails OK',
    'Error de conexión con Firestore': 'Erreur de connexion Firestore',
    'IndexedDB está bloqueado o no disponible': 'IndexedDB est bloqué ou indisponible',
    'IndexedDB no está disponible en este navegador': 'IndexedDB n\'est pas disponible dans ce navigateur',
    'Conexión restablecida correctamente': 'Connexion rétablie avec succès',
    'Invitación no encontrada': 'Invitation introuvable',
    'Organización y Logística': 'Organisation et Logistique',
    'Después de la Boda': 'Après le Mariage',
  }
};

function generateKey(text, namespace = 'common') {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 6)
    .join('_');
  
  return cleaned || 'text_' + Math.random().toString(36).substr(2, 9);
}

function translateText(text, lang) {
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][text]) {
    return TRANSLATIONS[lang][text];
  }
  
  // Traducción básica palabra por palabra como fallback
  const words = {
    en: {
      'conexión': 'connection',
      'error': 'error',
      'configurado': 'configured',
      'correctamente': 'correctly',
      'no': 'not',
      'disponible': 'available',
      'base': 'database',
      'datos': 'data',
    },
    fr: {
      'conexión': 'connexion',
      'error': 'erreur',
      'configurado': 'configuré',
      'correctamente': 'correctement',
      'no': 'non',
      'disponible': 'disponible',
      'base': 'base',
      'datos': 'données',
    }
  };
  
  return text;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Detectar strings en español (más flexible)
  const spanishRegex = /['"]([^'"]{3,}[áéíóúñÁÉÍÓÚÑ¿¡][^'"]{1,})['"]/g;
  let match;
  const replacements = [];
  const lines = content.split('\n');
  
  // Primero, analizar qué strings necesitan migración
  while ((match = spanishRegex.exec(content)) !== null) {
    const text = match[1];
    const fullMatch = match[0];
    
    // Filtrar casos que no necesitan traducción
    if (text.length < 3) continue;
    if (/^[A-Z_]+$/.test(text)) continue;
    if (/^\/.+\/$/.test(text)) continue; // regex
    if (/^https?:\/\//.test(text)) continue; // URLs
    
    // Encontrar la línea
    const lineNum = content.substring(0, match.index).split('\n').length - 1;
    const line = lines[lineNum];
    
    // Excluir comentarios
    if (line.trim().startsWith('//')) continue;
    if (line.trim().startsWith('*')) continue;
    if (line.trim().startsWith('/*')) continue;
    
    // Excluir imports/exports
    if (/^\s*(import|export)/.test(line)) continue;
    
    // Excluir console
    if (/console\.[a-z]+\(/.test(line)) continue;
    
    const key = generateKey(text);
    const fullKey = `common.${key}`;
    
    // Guardar traducción
    if (!translations.es[key]) {
      translations.es[key] = text;
      translations.en[key] = translateText(text, 'en');
      translations.fr[key] = translateText(text, 'fr');
      stringsAdded++;
    }
    
    // Determinar el reemplazo según el contexto
    let replacement;
    if (line.includes('return ') && !line.includes('{')) {
      // En return simple
      replacement = `i18n.t('${fullKey}')`;
    } else {
      // En asignaciones u otros contextos
      replacement = `i18n.t('${fullKey}')`;
    }
    
    replacements.push({
      original: fullMatch,
      replacement: replacement,
      text: text,
    });
  }
  
  if (replacements.length > 0) {
    // Aplicar reemplazos
    replacements.forEach(({ original, replacement }) => {
      content = content.replace(original, replacement);
    });
    
    // Añadir import de i18n al inicio si no existe
    if (!content.includes('import i18n from') && !content.includes("import i18n from")) {
      const firstImport = content.search(/^import /m);
      if (firstImport !== -1) {
        content = content.slice(0, firstImport) + 
                  "import i18n from '../i18n';\n" + 
                  content.slice(firstImport);
      } else {
        content = "import i18n from '../i18n';\n\n" + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)} (${replacements.length} strings)`);
    filesModified++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir, targetDirs = ['services', 'utils']) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage', 'i18n', 'test', 'tests', '__tests__'].includes(entry.name)) {
        continue;
      }
      
      scanDirectory(fullPath, targetDirs);
    } else if (entry.isFile()) {
      if (!/\.js$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      
      // Verificar que está en uno de los directorios objetivo
      const inTargetDir = targetDirs.some(target => fullPath.includes(path.sep + target + path.sep));
      if (inTargetDir) {
        console.log(`   Procesando: ${path.relative(process.cwd(), fullPath)}`);
        migrateFile(fullPath);
      }
    }
  }
}

function saveTranslations() {
  console.log('\n\n💾 Guardando traducciones...\n');
  
  ['es', 'en', 'fr'].forEach(lang => {
    const filePath = path.join(LOCALES_DIR, lang, 'common.json');
    
    // Leer existentes
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    // Merge (no sobrescribir existentes)
    const merged = { ...existing, ...translations[lang] };
    
    // Ordenar claves
    const sorted = Object.keys(merged).sort().reduce((acc, key) => {
      acc[key] = merged[key];
      return acc;
    }, {});
    
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf-8');
    console.log(`   ✓ ${lang}/common.json - ${Object.keys(sorted).length} claves totales`);
  });
}

console.log('🔧 Migrando servicios y utils a i18n\n');
console.log('=' .repeat(70) + '\n');

scanDirectory(SRC_DIR, ['services', 'utils']);
saveTranslations();

console.log('\n' + '='.repeat(70));
console.log('\n✅ MIGRACIÓN COMPLETADA\n');
console.log(`   Archivos modificados: ${filesModified}`);
console.log(`   Strings añadidos: ${stringsAdded}\n`);
