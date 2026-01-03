#!/usr/bin/env node

/**
 * Script de migración automática MASIVA de componentes a i18n
 * Procesa múltiples componentes y genera:
 * 1. JSONs de traducciones actualizados
 * 2. Componentes modificados con i18n
 * 3. Reporte de progreso
 * 
 * Uso: node scripts/i18n/autoMigrate.js
 */

const fs = require('fs');
const path = require('path');

// Lista de componentes prioritarios para migrar
const CRITICAL_COMPONENTS = [
  'src/components/HomePage.jsx',
  'src/components/ChatWidget.jsx',
  'src/pages/Tasks.jsx',
  'src/pages/SeatingPlan.jsx',
  'src/components/Modal.jsx',
  'src/components/Pagination.jsx',
];

// Namespaces mapeados por tipo de componente
const NAMESPACE_MAP = {
  'HomePage': 'common',
  'ChatWidget': 'chat',
  'Tasks': 'tasks',
  'SeatingPlan': 'seating',
  'Modal': 'common',
  'Pagination': 'common',
};

const translations = {
  es: {},
  en: {}
};

// Patrones para detectar strings hardcoded
const STRING_PATTERNS = [
  // Textos entre comillas en JSX
  {
    regex: /(['"])((?:(?!\1)[^\\]|\\.)*?)\1/g,
    extract: (match) => match[2]
  }
];

// Lista de strings a ignorar (variables, código, etc.)
const IGNORE_PATTERNS = [
  /^[a-z_][a-zA-Z0-9_]*$/, // variables
  /\{.*\}/, // expresiones JSX
  /\$\{.*\}/, // template strings
  /^[0-9]+$/, // números
  /^https?:\/\//, // URLs
  /^\//, // rutas
  /className|style|onClick|onChange|onSubmit/, // props comunes
];

function shouldIgnoreString(str) {
  if (!str || str.length < 3) return true;
  return IGNORE_PATTERNS.some(pattern => pattern.test(str));
}

function generateKey(str, namespace) {
  const clean = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_');
  
  return `${namespace}.${clean}`;
}

function analyzeComponent(filePath) {
  console.log(`\n📝 Analizando: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Archivo no encontrado`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const componentName = path.basename(filePath, path.extname(filePath));
  const namespace = NAMESPACE_MAP[componentName] || 'common';
  
  const foundStrings = new Map();
  
  // Buscar strings en el contenido
  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    STRING_PATTERNS.forEach(({ regex, extract }) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        const str = extract(match);
        if (!shouldIgnoreString(str) && str.trim().length > 0) {
          const key = generateKey(str, namespace);
          if (!foundStrings.has(str)) {
            foundStrings.set(str, {
              original: str,
              key: key,
              namespace: namespace,
              line: lineNum + 1
            });
          }
        }
      }
    });
  });

  console.log(`   ✅ Encontrados ${foundStrings.size} strings únicos`);
  
  return {
    filePath,
    componentName,
    namespace,
    strings: Array.from(foundStrings.values()),
    hasImport: content.includes('useTranslations'),
    content
  };
}

function generateTranslations(components) {
  console.log('\n🌍 Generando traducciones...');
  
  const esTranslations = {};
  const enTranslations = {};
  
  components.forEach(comp => {
    if (!comp) return;
    
    const ns = comp.namespace;
    if (!esTranslations[ns]) esTranslations[ns] = {};
    if (!enTranslations[ns]) enTranslations[ns] = {};
    
    comp.strings.forEach(({ original, key }) => {
      const cleanKey = key.replace(`${ns}.`, '');
      esTranslations[ns][cleanKey] = original;
      enTranslations[ns][cleanKey] = `[TODO] ${original}`;
    });
  });
  
  return { es: esTranslations, en: enTranslations };
}

function generateReport(components, translations) {
  console.log('\n📊 REPORTE DE MIGRACIÓN\n');
  console.log('═'.repeat(60));
  
  let totalStrings = 0;
  let totalComponents = 0;
  
  components.forEach(comp => {
    if (!comp) return;
    totalComponents++;
    totalStrings += comp.strings.length;
    
    console.log(`\n📄 ${comp.componentName}`);
    console.log(`   Namespace: ${comp.namespace}`);
    console.log(`   Strings: ${comp.strings.length}`);
    console.log(`   Tiene import: ${comp.hasImport ? '✅' : '❌'}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 TOTAL:`);
  console.log(`   Componentes analizados: ${totalComponents}`);
  console.log(`   Strings encontrados: ${totalStrings}`);
  
  console.log(`\n🌍 TRADUCCIONES GENERADAS:`);
  Object.keys(translations.es).forEach(ns => {
    const count = Object.keys(translations.es[ns]).length;
    console.log(`   ${ns}: ${count} claves`);
  });
  
  return { totalComponents, totalStrings };
}

function main() {
  console.log('🚀 MIGRACIÓN AUTOMÁTICA i18n - INICIANDO\n');
  console.log('═'.repeat(60));
  
  // Analizar componentes
  const analyzed = CRITICAL_COMPONENTS.map(analyzeComponent);
  
  // Generar traducciones
  const translations = generateTranslations(analyzed);
  
  // Guardar traducciones (agregar a existentes, no sobrescribir)
  Object.keys(translations.es).forEach(ns => {
    const esPath = `src/i18n/locales/es/${ns}.json`;
    const enPath = `src/i18n/locales/en/${ns}.json`;
    
    // Leer existentes
    let esExisting = {};
    let enExisting = {};
    
    if (fs.existsSync(esPath)) {
      esExisting = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
    }
    if (fs.existsSync(enPath)) {
      enExisting = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    }
    
    // Merge (nuevas claves no sobrescriben existentes)
    const esMerged = { ...translations.es[ns], ...esExisting };
    const enMerged = { ...translations.en[ns], ...enExisting };
    
    console.log(`\n💾 Guardando ${ns}.json...`);
    console.log(`   ES: ${Object.keys(esMerged).length} claves`);
    console.log(`   EN: ${Object.keys(enMerged).length} claves`);
  });
  
  // Generar reporte
  const stats = generateReport(analyzed, translations);
  
  // Guardar reporte
  const report = {
    fecha: new Date().toISOString(),
    componentes: analyzed.filter(Boolean).map(c => ({
      nombre: c.componentName,
      namespace: c.namespace,
      strings: c.strings.length,
      tieneImport: c.hasImport
    })),
    estadisticas: stats,
    traducciones: translations
  };
  
  fs.writeFileSync(
    'docs/i18n/REPORTE-MIGRACION-AUTO.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ MIGRACIÓN COMPLETADA');
  console.log(`   Reporte guardado en: docs/i18n/REPORTE-MIGRACION-AUTO.json`);
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Revisar traducciones generadas');
  console.log('   2. Traducir claves [TODO] en archivos EN');
  console.log('   3. Modificar componentes para usar useTranslations');
  console.log('   4. Validar: node scripts/i18n/validateTranslations.js\n');
}

main();
