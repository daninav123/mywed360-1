#!/usr/bin/env node

/**
 * Script para migrar aria-labels hardcodeados a i18n
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');
const LOCALES_DIR = path.join(__dirname, '../../src/i18n/locales');

let filesFixed = 0;
const translations = { es: {}, en: {}, fr: {} };

function generateAriaKey(text) {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('_');
  return `aria_${cleaned}`;
}

function translateToEn(text) {
  const dict = {
    'detalle del correo electrónico': 'email detail',
    'dirección de correo del remitente': 'sender email address',
    'fecha de envío': 'sending date',
    'tamaño del archivo': 'file size',
    'selección de carpetas': 'folder selection',
    'búsqueda': 'search',
    'configuración': 'settings',
    'cerrar': 'close',
    'abrir': 'open',
    'eliminar': 'delete',
    'editar': 'edit',
    'guardar': 'save',
    'cancelar': 'cancel',
    'menú': 'menu',
    'navegación': 'navigation',
  };
  
  const lower = text.toLowerCase();
  for (const [es, en] of Object.entries(dict)) {
    if (lower.includes(es)) {
      return text.replace(new RegExp(es, 'gi'), en);
    }
  }
  
  return text;
}

function translateToFr(text) {
  const dict = {
    'detalle del correo electrónico': 'détail du courriel',
    'dirección de correo del remitente': 'adresse e-mail de l\'expéditeur',
    'fecha de envío': 'date d\'envoi',
    'tamaño del archivo': 'taille du fichier',
    'selección de carpetas': 'sélection de dossiers',
    'búsqueda': 'recherche',
    'configuración': 'paramètres',
    'cerrar': 'fermer',
    'abrir': 'ouvrir',
    'eliminar': 'supprimer',
    'editar': 'modifier',
    'guardar': 'enregistrer',
    'cancelar': 'annuler',
    'menú': 'menu',
    'navegación': 'navigation',
  };
  
  const lower = text.toLowerCase();
  for (const [es, fr] of Object.entries(dict)) {
    if (lower.includes(es)) {
      return text.replace(new RegExp(es, 'gi'), fr);
    }
  }
  
  return text;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Buscar aria-label="texto en español"
  const regex = /aria-label=["']([^"']*[áéíóúñÁÉÍÓÚÑ¿¡][^"']*)["']/g;
  let match;
  const replacements = [];
  
  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    const key = generateAriaKey(text);
    
    // Guardar traducción
    if (!translations.es[key]) {
      translations.es[key] = text;
      translations.en[key] = translateToEn(text);
      translations.fr[key] = translateToFr(text);
    }
    
    replacements.push({
      original: match[0],
      replacement: `aria-label={t('common.${key}')}`,
    });
  }
  
  if (replacements.length > 0) {
    replacements.forEach(({ original, replacement }) => {
      content = content.replace(original, replacement);
    });
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)} (${replacements.length} aria-labels)`);
    filesFixed++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage', 'i18n'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.jsx$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      
      fixFile(fullPath);
    }
  }
}

function saveTranslations() {
  ['es', 'en', 'fr'].forEach(lang => {
    const filePath = path.join(LOCALES_DIR, lang, 'common.json');
    
    // Leer existentes
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    // Merge
    const merged = { ...existing, ...translations[lang] };
    
    // Ordenar claves
    const sorted = Object.keys(merged).sort().reduce((acc, key) => {
      acc[key] = merged[key];
      return acc;
    }, {});
    
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf-8');
    console.log(`\n✓ ${lang}/common.json actualizado`);
  });
}

console.log('🔧 Migrando aria-labels a i18n...\n');
scanDirectory(SRC_DIR);
saveTranslations();
console.log(`\n✅ Archivos corregidos: ${filesFixed}`);
console.log(`   Nuevas claves aria: ${Object.keys(translations.es).length}\n`);
