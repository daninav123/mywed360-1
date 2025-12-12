#!/usr/bin/env node

/**
 * Style Audit - MaLoveApp
 * 
 * Audita archivos JSX/TSX para encontrar patrones de estilo inconsistentes
 * basados en la guía de estilo oficial (STYLE_GUIDE.md)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patrones anti-patrón que NO deberían estar en el código
const ANTI_PATTERNS = {
  gradients: {
    regex: /bg-gradient-to-[a-z]+|from-\[.*?\]|via-\[.*?\]|to-\[.*?\]/g,
    message: '❌ Usa degradados (bg-gradient-*) - Usar cards blancos simples',
    severity: 'high'
  },
  blurEffects: {
    regex: /blur-\d+xl|blur-\d+lg|backdrop-blur/g,
    message: '❌ Usa efectos blur - No permitido',
    severity: 'high'
  },
  hardcodedColors: {
    regex: /#[0-9a-fA-F]{3,8}(?!\/\d+)/g, // Excluye opacity como #fff/10
    message: '⚠️ Color hardcodeado - Usar variables CSS',
    severity: 'medium'
  },
  excessiveShadows: {
    regex: /shadow-2xl|shadow-3xl/g,
    message: '⚠️ Sombra excesiva - Usar shadow-md',
    severity: 'low'
  },
  inlineStyles: {
    regex: /style=\{\{.*?backgroundColor.*?\}\}/g,
    message: '⚠️ Estilo inline con colores - Usar Tailwind y variables',
    severity: 'medium'
  },
  excessiveHover: {
    regex: /hover:scale-\[1\.\d{2,}\]|hover:-translate-y-\d+/g,
    message: '⚠️ Efecto hover excesivo - Simplificar',
    severity: 'low'
  }
};

// Patrones correctos que deberían estar presentes
const GOOD_PATTERNS = {
  cssVariables: /var\(--color-[a-z]+\)/g,
  standardCard: /bg-\[var\(--color-surface\)\].*?rounded-xl.*?shadow-md/g,
  standardPadding: /p-4 md:p-6|p-6 md:p-8/g
};

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Buscar anti-patrones
  for (const [name, pattern] of Object.entries(ANTI_PATTERNS)) {
    const matches = content.match(pattern.regex);
    if (matches) {
      issues.push({
        file: filePath,
        pattern: name,
        severity: pattern.severity,
        message: pattern.message,
        count: matches.length,
        examples: matches.slice(0, 3) // Primeros 3 ejemplos
      });
    }
  }
  
  return issues;
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Ignorar directorios
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath, results);
      }
      continue;
    }
    
    // Solo archivos JSX/TSX
    if (!/\.(jsx|tsx)$/.test(file)) continue;
    
    const issues = auditFile(filePath);
    if (issues.length > 0) {
      results.push(...issues);
    }
  }
  
  return results;
}

function generateReport(issues) {
  console.log('\n🎨 AUDITORÍA DE ESTILO - MaLoveApp\n');
  console.log('═'.repeat(80));
  
  // Agrupar por severidad
  const bySeverity = {
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };
  
  // Resumen
  console.log('\n📊 RESUMEN:\n');
  console.log(`  🔴 Problemas críticos:  ${bySeverity.high.length}`);
  console.log(`  🟡 Problemas medios:    ${bySeverity.medium.length}`);
  console.log(`  🟢 Problemas menores:   ${bySeverity.low.length}`);
  console.log(`  📝 Total:               ${issues.length}\n`);
  
  // Agrupar por archivo
  const byFile = {};
  issues.forEach(issue => {
    const file = issue.file.replace(process.cwd(), '.');
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(issue);
  });
  
  // Mostrar por severidad
  ['high', 'medium', 'low'].forEach(severity => {
    if (bySeverity[severity].length === 0) return;
    
    const emoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
    const title = severity === 'high' ? 'CRÍTICO' : severity === 'medium' ? 'MEDIO' : 'MENOR';
    
    console.log(`\n${emoji} ${title}:\n`);
    console.log('─'.repeat(80));
    
    const filesWithSeverity = Object.entries(byFile)
      .filter(([file, fileIssues]) => fileIssues.some(i => i.severity === severity))
      .sort(([, a], [, b]) => b.length - a.length);
    
    filesWithSeverity.forEach(([file, fileIssues]) => {
      const relevantIssues = fileIssues.filter(i => i.severity === severity);
      console.log(`\n📄 ${file}`);
      
      relevantIssues.forEach(issue => {
        console.log(`   ${issue.message}`);
        console.log(`   Ocurrencias: ${issue.count}`);
        if (issue.examples.length > 0) {
          console.log(`   Ejemplos: ${issue.examples.join(', ')}`);
        }
      });
    });
  });
  
  // Top 10 archivos con más problemas
  console.log('\n\n📋 TOP 10 ARCHIVOS CON MÁS PROBLEMAS:\n');
  console.log('─'.repeat(80));
  
  const topFiles = Object.entries(byFile)
    .map(([file, issues]) => ({ file, count: issues.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  topFiles.forEach(({ file, count }, index) => {
    console.log(`${index + 1}. ${file} (${count} problemas)`);
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 Para corregir, consulta: STYLE_GUIDE.md\n');
}

// Ejecutar
const targetDir = path.join(process.cwd(), 'apps/main-app/src');

if (!fs.existsSync(targetDir)) {
  console.error('❌ Directorio no encontrado:', targetDir);
  process.exit(1);
}

console.log('🔍 Escaneando archivos...');
const issues = scanDirectory(targetDir);

if (issues.length === 0) {
  console.log('\n✅ ¡Perfecto! No se encontraron problemas de estilo.\n');
} else {
  generateReport(issues);
  
  // Guardar reporte JSON
  const reportPath = path.join(process.cwd(), '.windsurf/style-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    totalIssues: issues.length,
    issues: issues
  }, null, 2));
  
  console.log(`📄 Reporte detallado guardado en: .windsurf/style-audit-report.json\n`);
}
