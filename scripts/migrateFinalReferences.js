#!/usr/bin/env node

/**
 * Script FINAL para capturar TODAS las referencias restantes de Lovenda/myWed360
 */

const fs = require('fs');
const path = require('path');

const files = [
  // i18n brandName - TODOS los idiomas que aún tienen "Lovenda"
  'src/i18n/locales/ar/common.json',
  'src/i18n/locales/bg/common.json',
  'src/i18n/locales/ca/common.json',
  'src/i18n/locales/cs/common.json',
  'src/i18n/locales/da/common.json',
  'src/i18n/locales/de/common.json',
  'src/i18n/locales/el/common.json',
  'src/i18n/locales/en/common.json',
  'src/i18n/locales/es/common.json',
  'src/i18n/locales/es-AR/common.json',
  'src/i18n/locales/es-MX/common.json',
  'src/i18n/locales/et/common.json',
  'src/i18n/locales/eu/common.json',
  'src/i18n/locales/fi/common.json',
  'src/i18n/locales/fr/common.json',
  'src/i18n/locales/fr-CA/common.json',
  'src/i18n/locales/hr/common.json',
  'src/i18n/locales/hu/common.json',
  'src/i18n/locales/is/common.json',
  'src/i18n/locales/it/common.json',
  'src/i18n/locales/lt/common.json',
  'src/i18n/locales/lv/common.json',
  'src/i18n/locales/mt/common.json',
  'src/i18n/locales/nl/common.json',
  'src/i18n/locales/no/common.json',
  'src/i18n/locales/pl/common.json',
  'src/i18n/locales/pt/common.json',
  'src/i18n/locales/ro/common.json',
  'src/i18n/locales/ru/common.json',
  'src/i18n/locales/sk/common.json',
  'src/i18n/locales/sl/common.json',
  'src/i18n/locales/sv/common.json',
  'src/i18n/locales/tr/common.json',
];

const replacements = [
  { find: /"brandName":\s*"Lovenda"/g, replace: '"brandName": "MaLoveApp"' },
  { find: /"title":\s*"Bienvenida a Lovenda"/g, replace: '"title": "Bienvenida a MaLoveApp"' },
  { find: /"title":\s*"Welcome to Lovenda"/g, replace: '"title": "Welcome to MaLoveApp"' },
  { find: /"title":\s*"Bienvenido a Lovenda"/g, replace: '"title": "Bienvenido a MaLoveApp"' },
  { find: /"description":\s*"Tu cuenta de Lovenda/g, replace: '"description": "Tu cuenta de MaLoveApp' },
];

let totalChanges = 0;

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(({ find, replace }) => {
    const before = content;
    content = content.replace(find, replace);
    if (content !== before) {
      changed = true;
      totalChanges++;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${file}`);
  }
});

console.log(`\n✅ Total changes made: ${totalChanges}`);
