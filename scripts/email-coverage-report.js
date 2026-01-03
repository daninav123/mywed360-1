#!/usr/bin/env node

/**
 * Script para generar un informe de cobertura espec�fico para el sistema de correo
 * 
 * Este script analiza los informes de cobertura y genera un resumen espec�fico
 * para los componentes y servicios relacionados con el sistema de correo.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuraci�n
const EMAIL_COMPONENTS_PATH = path.join('src', 'components', 'email');
const EMAIL_SERVICES_PATH = path.join('src', 'services');
const EMAIL_SERVICE_FILES = ['emailService.js', 'tagService.js'];
const COVERAGE_THRESHOLD = 80; // Porcentaje m�nimo de cobertura aceptable

// Colores para la consola
const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Ejecuta las pruebas y genera el informe de cobertura
 */
function runTests() {
  try {
    console.log(`${COLORS.bold}Ejecutando pruebas para el sistema de correo...${COLORS.reset}`);
    
    // Ejecutar pruebas espec�ficas del sistema de correo
    execSync('npx vitest run --coverage "src/test/services/Email*.test.js" "src/test/services/Tag*.test.js" "src/test/components/Email*.test.jsx"', { 
      stdio: 'inherit' 
    });
    
    console.log(`\n${COLORS.green} Pruebas completadas${COLORS.reset}\n`);
  } catch (error) {
    console.error(`${COLORS.red} Error al ejecutar las pruebas: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

/**
 * Analiza el informe de cobertura
 */
function analyzeCoverage() {
  try {
    console.log(`${COLORS.bold}Analizando cobertura...${COLORS.reset}`);
    
    // Leer el informe de cobertura (ajustar seg�n el formato que genera vitest)
    const coveragePath = path.join('coverage', 'coverage-final.json');
    
    if (!fs.existsSync(coveragePath)) {
      throw new Error(`No se encontr� el informe de cobertura en ${coveragePath}`);
    }
    
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    // Filtrar archivos relacionados con el sistema de correo
    const emailFiles = Object.keys(coverageData).filter(filePath => 
      filePath.includes(EMAIL_COMPONENTS_PATH) || 
      (filePath.includes(EMAIL_SERVICES_PATH) && EMAIL_SERVICE_FILES.some(file => filePath.includes(file)))
    );
    
    // Analizar cada archivo
    const results = emailFiles.map(filePath => {
      const fileData = coverageData[filePath];
      const statements = fileData.statementMap ? Object.keys(fileData.statementMap).length : 0;
      const coveredStatements = statements > 0 
        ? Object.keys(fileData.s).filter(key => fileData.s[key] > 0).length 
        : 0;
      
      const percentage = statements > 0 
        ? (coveredStatements / statements) * 100 
        : 0;
      
      return {
        file: path.basename(filePath),
        path: filePath,
        statements,
        coveredStatements,
        percentage: Math.round(percentage * 100) / 100
      };
    });
    
    // Generar informe
    console.log('\n========== INFORME DE COBERTURA DEL SISTEMA DE CORREO ==========\n');
    
    results.forEach(result => {
      let color = COLORS.green;
      if (result.percentage < COVERAGE_THRESHOLD) {
        color = result.percentage < COVERAGE_THRESHOLD * 0.8 ? COLORS.red : COLORS.yellow;
      }
      
      console.log(`${result.file}: ${color}${result.percentage}%${COLORS.reset} (${result.coveredStatements}/${result.statements} sentencias)`);
    });
    
    // Cobertura global
    const totalStatements = results.reduce((sum, result) => sum + result.statements, 0);
    const totalCovered = results.reduce((sum, result) => sum + result.coveredStatements, 0);
    const totalPercentage = totalStatements > 0 
      ? Math.round((totalCovered / totalStatements) * 10000) / 100
      : 0;
    
    let overallColor = COLORS.green;
    if (totalPercentage < COVERAGE_THRESHOLD) {
      overallColor = totalPercentage < COVERAGE_THRESHOLD * 0.8 ? COLORS.red : COLORS.yellow;
    }
    
    console.log('\n--------------------------------------------------------');
    console.log(`COBERTURA GLOBAL: ${overallColor}${totalPercentage}%${COLORS.reset} (${totalCovered}/${totalStatements} sentencias)`);
    console.log('--------------------------------------------------------\n');
    
    // Identificar archivos que necesitan m�s pruebas
    const lowCoverageFiles = results.filter(r => r.percentage < COVERAGE_THRESHOLD)
      .sort((a, b) => a.percentage - b.percentage);
    
    if (lowCoverageFiles.length > 0) {
      console.log(`${COLORS.bold}Archivos que necesitan m�s pruebas:${COLORS.reset}`);
      lowCoverageFiles.forEach(result => {
        console.log(`${COLORS.yellow}${result.file}${COLORS.reset}: ${result.percentage}%`);
      });
    } else {
      console.log(`${COLORS.green}�Todos los archivos cumplen o superan el umbral de cobertura del ${COVERAGE_THRESHOLD}%!${COLORS.reset}`);
    }
    
    // Mensaje final
    if (totalPercentage < COVERAGE_THRESHOLD) {
      console.log(`\n${COLORS.yellow}La cobertura global (${totalPercentage}%) est� por debajo del umbral recomendado (${COVERAGE_THRESHOLD}%).${COLORS.reset}`);
    } else {
      console.log(`\n${COLORS.green}La cobertura global (${totalPercentage}%) cumple o supera el umbral recomendado (${COVERAGE_THRESHOLD}%).${COLORS.reset}`);
    }
    
    return {
      totalPercentage,
      belowThreshold: totalPercentage < COVERAGE_THRESHOLD,
      lowCoverageFiles
    };
  } catch (error) {
    console.error(`${COLORS.red} Error al analizar la cobertura: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

/**
 * Funci�n principal
 */
function main() {
  console.log(`${COLORS.bold}====== AN�LISIS DE COBERTURA DEL SISTEMA DE CORREO ======${COLORS.reset}\n`);
  
  // Ejecutar pruebas y generar cobertura
  runTests();
  
  // Analizar la cobertura
  const result = analyzeCoverage();
  
  // Generar informe HTML para visualizaci�n
  console.log('\nGenerando informe HTML de cobertura...');
  execSync('npm run test:coverage:html', { stdio: 'inherit' });
  console.log(`${COLORS.green}Informe HTML generado en: ./coverage/index.html${COLORS.reset}\n`);
  
  // Salir con c�digo de error si no se alcanza el umbral (�til para CI)
  if (result.belowThreshold) {
    console.log(`${COLORS.yellow}ADVERTENCIA: La cobertura est� por debajo del umbral requerido.${COLORS.reset}`);
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar script
main();
