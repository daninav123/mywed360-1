/**
 * 🧪 TEST E2E - PDF Upload & AI Analysis
 * 
 * Test completo del flujo de subida de PDF y análisis con IA
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_URL = 'http://localhost:4004';
const TEST_PDF_PATH = join(__dirname, 'test-sample.pdf');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

async function createTestPDF() {
  log('📄', colors.blue, 'Creando PDF de prueba...');
  
  // Crear un PDF simple para testing (en formato texto plano como placeholder)
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
100 700 Td
(PRESUPUESTO BODA) Tj
0 -20 Td
(Proveedor: MusicEvents) Tj
0 -20 Td
(Categoria: Musica) Tj
0 -20 Td
(Precio: 1500 euros) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000413 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
488
%%EOF`;
  
  fs.writeFileSync(TEST_PDF_PATH, pdfContent);
  log('✅', colors.green, `PDF de prueba creado en: ${TEST_PDF_PATH}`);
}

async function testBackendRunning() {
  log('🔍', colors.cyan, 'Test 1/5: Verificando que el backend está corriendo...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok || response.status === 404) {
      log('✅', colors.green, 'Backend está corriendo');
      return true;
    }
    throw new Error(`Backend devolvió status ${response.status}`);
  } catch (error) {
    log('❌', colors.red, `Backend NO está corriendo: ${error.message}`);
    return false;
  }
}

async function testOpenAIConfig() {
  log('🔍', colors.cyan, 'Test 2/5: Verificando configuración de OpenAI...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/ai-training/debug-config`);
    const data = await response.json();
    
    console.log('   📋 Configuración actual:');
    console.log(`      API Key: ${data.config.apiKeyPrefix}${data.config.apiKeySuffix}`);
    console.log(`      Project ID: ${data.config.projectId}`);
    console.log(`      OpenAI Client: ${data.config.openaiConfigured ? '✅' : '❌'}`);
    
    if (!data.config.openaiConfigured) {
      log('❌', colors.red, 'OpenAI NO está configurado');
      return false;
    }
    
    if (data.config.apiKeySuffix.includes('_o0A')) {
      log('⚠️', colors.yellow, 'API Key INCORRECTA detectada (termina en _o0A)');
      log('💡', colors.blue, 'Solución: Backend cargó variables de entorno del sistema, no del .env');
      return false;
    }
    
    if (data.config.apiKeySuffix.includes('M4sA')) {
      log('✅', colors.green, 'API Key CORRECTA (termina en M4sA)');
    }
    
    if (data.config.projectId !== 'proj_7IWFKysvJciPmnkpqop9rrpT') {
      log('❌', colors.red, `Project ID incorrecto: ${data.config.projectId}`);
      return false;
    }
    
    log('✅', colors.green, 'Configuración OpenAI correcta');
    return true;
  } catch (error) {
    log('❌', colors.red, `Error verificando config: ${error.message}`);
    return false;
  }
}

async function testPDFUpload() {
  log('🔍', colors.cyan, 'Test 3/5: Subiendo PDF de prueba...');
  
  try {
    if (!fs.existsSync(TEST_PDF_PATH)) {
      await createTestPDF();
    }
    
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(TEST_PDF_PATH), {
      filename: 'test-presupuesto.pdf',
      contentType: 'application/pdf',
    });
    
    log('📤', colors.blue, 'Enviando PDF al backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/admin/ai-training/extract-pdf`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    
    const responseText = await response.text();
    console.log(`   📥 Status: ${response.status} ${response.statusText}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log(`   📄 Response (raw): ${responseText.substring(0, 500)}`);
      throw new Error('Respuesta no es JSON válido');
    }
    
    if (!response.ok) {
      console.log(`   ❌ Error del servidor:`, data);
      
      if (data.error && data.error.includes('401')) {
        log('💡', colors.yellow, 'ERROR 401 - API Key incorrecta o Project ID faltante');
      }
      
      return false;
    }
    
    console.log(`   📋 Respuesta:`, JSON.stringify(data, null, 2));
    
    if (!data.success) {
      log('❌', colors.red, `Upload falló: ${data.error}`);
      return false;
    }
    
    log('✅', colors.green, 'PDF subido correctamente');
    return data;
  } catch (error) {
    log('❌', colors.red, `Error en upload: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testAIExtraction(extractedData) {
  log('🔍', colors.cyan, 'Test 4/5: Verificando extracción de IA...');
  
  if (!extractedData || !extractedData.data) {
    log('❌', colors.red, 'No hay datos extraídos para verificar');
    return false;
  }
  
  const data = extractedData.data;
  console.log('   📊 Datos extraídos:');
  console.log(`      Categoría: ${data.categoryName || '❌ NO EXTRAÍDO'}`);
  console.log(`      Proveedor: ${data.supplierName || '❌ NO EXTRAÍDO'}`);
  console.log(`      Precio: ${data.totalPrice || '❌ NO EXTRAÍDO'}`);
  console.log(`      Servicios: ${data.servicesIncluded?.length || 0} items`);
  
  let passed = true;
  
  if (!data.categoryName && !data.supplierName && !data.totalPrice) {
    log('❌', colors.red, 'IA no extrajo ningún dato básico');
    passed = false;
  }
  
  if (passed) {
    log('✅', colors.green, 'IA extrajo datos correctamente');
  }
  
  return passed;
}

async function testDataStructure(extractedData) {
  log('🔍', colors.cyan, 'Test 5/5: Verificando estructura de datos...');
  
  if (!extractedData || !extractedData.data) {
    log('❌', colors.red, 'No hay datos para verificar estructura');
    return false;
  }
  
  const data = extractedData.data;
  const requiredFields = [
    'categoryName',
    'supplierName',
    'totalPrice',
    'servicesIncluded',
    'paymentTerms',
    'deliveryTime',
    'emailBody',
    'additionalNotes'
  ];
  
  let passed = true;
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      log('⚠️', colors.yellow, `Campo faltante: ${field}`);
      passed = false;
    }
  }
  
  if (!Array.isArray(data.servicesIncluded)) {
    log('❌', colors.red, 'servicesIncluded no es un array');
    passed = false;
  }
  
  if (passed) {
    log('✅', colors.green, 'Estructura de datos correcta');
  }
  
  return passed;
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('🧪', colors.cyan, 'INICIANDO TEST E2E - PDF UPLOAD & AI ANALYSIS');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    backendRunning: false,
    openaiConfig: false,
    pdfUpload: false,
    aiExtraction: false,
    dataStructure: false,
  };
  
  // Test 1: Backend running
  results.backendRunning = await testBackendRunning();
  if (!results.backendRunning) {
    log('🛑', colors.red, 'ABORTANDO: Backend no está corriendo');
    return results;
  }
  
  console.log('');
  
  // Test 2: OpenAI config
  results.openaiConfig = await testOpenAIConfig();
  if (!results.openaiConfig) {
    log('🛑', colors.red, 'ABORTANDO: Configuración OpenAI incorrecta');
    log('💡', colors.blue, 'SOLUCIÓN SUGERIDA:');
    console.log('   1. pkill -f nodemon');
    console.log('   2. unset OPENAI_API_KEY');
    console.log('   3. unset OPENAI_PROJECT_ID');
    console.log('   4. npm run dev');
    return results;
  }
  
  console.log('');
  
  // Test 3: PDF Upload
  const uploadResult = await testPDFUpload();
  results.pdfUpload = !!uploadResult;
  if (!results.pdfUpload) {
    log('🛑', colors.red, 'ABORTANDO: Upload de PDF falló');
    return results;
  }
  
  console.log('');
  
  // Test 4: AI Extraction
  results.aiExtraction = await testAIExtraction(uploadResult);
  
  console.log('');
  
  // Test 5: Data Structure
  results.dataStructure = await testDataStructure(uploadResult);
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  log('📊', colors.cyan, 'RESUMEN DE TESTS');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Backend Running', passed: results.backendRunning },
    { name: 'OpenAI Config', passed: results.openaiConfig },
    { name: 'PDF Upload', passed: results.pdfUpload },
    { name: 'AI Extraction', passed: results.aiExtraction },
    { name: 'Data Structure', passed: results.dataStructure },
  ];
  
  tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? colors.green : colors.red;
    console.log(`${icon} ${color}${test.name}${colors.reset}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    log('🎉', colors.green, 'TODOS LOS TESTS PASARON - SISTEMA 100% FUNCIONAL');
  } else {
    log('❌', colors.red, 'ALGUNOS TESTS FALLARON - REVISAR ERRORES ARRIBA');
  }
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// Ejecutar tests
runTests().catch(error => {
  log('💥', colors.red, `Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
