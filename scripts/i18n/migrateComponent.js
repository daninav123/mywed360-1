#!/usr/bin/env node

/**
 * Script para migrar automáticamente un componente a i18n
 * Uso: node scripts/i18n/migrateComponent.js <ruta-componente> [namespace]
 * Ejemplo: node scripts/i18n/migrateComponent.js src/components/HomePage.jsx common
 */

const fs = require('fs');
const path = require('path');

const componentPath = process.argv[2];
const namespace = process.argv[3] || 'common';

if (!componentPath) {
  console.error('❌ Debes proporcionar la ruta del componente');
  console.error('Uso: node scripts/i18n/migrateComponent.js <ruta-componente> [namespace]');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), componentPath);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ El archivo no existe: ${fullPath}`);
  process.exit(1);
}

console.log(`\n🔍 Analizando: ${componentPath}`);
console.log(`📦 Namespace: ${namespace}\n`);

const content = fs.readFileSync(fullPath, 'utf-8');

// Detectar strings hardcoded (patrones comunes)
const patterns = [
  // Strings en JSX entre comillas
  />\s*["']([^"'<>]+)["']\s*</g,
  // Atributos placeholder, title, alt, aria-label
  /(placeholder|title|alt|aria-label)=["']([^"']+)["']/g,
  // Botones y textos
  /<button[^>]*>\s*["']?([^<>"']+)["']?\s*<\/button>/g,
  // Labels
  /<label[^>]*>\s*["']?([^<>"']+)["']?\s*<\/label>/g,
  // Headings
  /<h[1-6][^>]*>\s*["']?([^<>"']+)["']?\s*<\/h[1-6]>/g,
];

const foundStrings = new Set();
let matches = 0;

patterns.forEach(pattern => {
  let match;
  const regex = new RegExp(pattern);
  const tempContent = content;
  
  while ((match = regex.exec(tempContent)) !== null) {
    const str = match[match.length - 1];
    if (str && str.trim() && str.length > 2 && !str.includes('{') && !str.includes('$')) {
      foundStrings.add(str.trim());
      matches++;
    }
  }
});

if (foundStrings.size === 0) {
  console.log('✅ No se encontraron strings hardcoded evidentes');
  process.exit(0);
}

console.log(`📊 Encontrados ${foundStrings.size} strings únicos (${matches} ocurrencias totales):\n`);

const suggestions = [];
foundStrings.forEach(str => {
  // Generar clave sugerida
  const key = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_');
  
  suggestions.push({
    original: str,
    key: key,
    namespace: namespace
  });
  
  console.log(`   "${str}"`);
  console.log(`   → ${namespace}.${key}\n`);
});

// Generar JSON para agregar a las traducciones
console.log('\n📝 JSON a agregar en src/i18n/locales/es/' + namespace + '.json:\n');
const jsonES = {};
suggestions.forEach(s => {
  jsonES[s.key] = s.original;
});
console.log(JSON.stringify(jsonES, null, 2));

console.log('\n📝 JSON a agregar en src/i18n/locales/en/' + namespace + '.json:\n');
const jsonEN = {};
suggestions.forEach(s => {
  jsonEN[s.key] = `[EN] ${s.original}`; // Marcador para traducir
});
console.log(JSON.stringify(jsonEN, null, 2));

console.log('\n💡 Próximos pasos:');
console.log('1. Copia los JSONs a los archivos de traducción');
console.log('2. Traduce las claves EN al inglés');
console.log('3. En el componente:');
console.log('   - Importa: import useTranslations from \'../hooks/useTranslations\';');
console.log('   - Usa: const { t } = useTranslations();');
console.log('   - Reemplaza cada string por: {t(\'' + namespace + '.clave\')}');
console.log('\n✨ Tip: Revisa el ejemplo en docs/i18n/EJEMPLO-MIGRACION-CHATWIDGET.md\n');
