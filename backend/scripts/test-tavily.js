// Script para probar que Tavily está configurada correctamente
// Ejecutar: node backend/scripts/test-tavily.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env del backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

console.log('🔍 Verificando configuración de Tavily...\n');

// 1. Verificar que las API keys están configuradas
console.log('📋 Variables de entorno:');
console.log(`  TAVILY_API_KEY: ${TAVILY_API_KEY ? '✅ Configurada (' + TAVILY_API_KEY.substring(0, 10) + '...)' : '❌ NO configurada'}`);
console.log(`  OPENAI_API_KEY: ${OPENAI_API_KEY ? '✅ Configurada (' + OPENAI_API_KEY.substring(0, 10) + '...)' : '❌ NO configurada'}`);
console.log('');

if (!TAVILY_API_KEY) {
  console.log('❌ ERROR: TAVILY_API_KEY no está configurada');
  console.log('   Añádela en backend/.env:');
  console.log('   TAVILY_API_KEY=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\n');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.log('⚠️  ADVERTENCIA: OPENAI_API_KEY no está configurada');
  console.log('   Se necesita para estructurar los resultados\n');
}

// 2. Probar búsqueda con Tavily
console.log('🔎 Probando búsqueda con Tavily API...');

const testQuery = 'fotógrafo de bodas en Madrid España';

async function testTavilySearch() {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: testQuery,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
        include_domains: [
          'bodas.net',
          'bodas.com.mx',
          'instagram.com',
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    console.log(`✅ Búsqueda exitosa! Encontrados ${results.length} resultados\n`);

    if (results.length > 0) {
      console.log('📄 Primeros resultados:');
      results.slice(0, 3).forEach((result, idx) => {
        console.log(`\n  ${idx + 1}. ${result.title}`);
        console.log(`     URL: ${result.url}`);
        console.log(`     Score: ${result.score}`);
        console.log(`     Contenido: ${result.content.substring(0, 100)}...`);
      });
      console.log('');
    }

    console.log('✅ ¡Tavily está funcionando correctamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('  1. Añade VITE_SEARCH_PROVIDER=tavily en .env del frontend');
    console.log('  2. Reinicia backend y frontend');
    console.log('  3. Prueba una búsqueda en la página de Proveedores');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('❌ ERROR al probar Tavily:');
    console.log(`   ${error.message}`);
    console.log('');

    if (error.message.includes('401')) {
      console.log('💡 Solución: API Key inválida');
      console.log('   - Verifica que la key esté correcta en backend/.env');
      console.log('   - Regenera la key en https://tavily.com/dashboard\n');
    } else if (error.message.includes('429')) {
      console.log('💡 Solución: Límite de búsquedas excedido');
      console.log('   - Espera al siguiente ciclo mensual');
      console.log('   - O configura billing en https://tavily.com/pricing\n');
    } else if (error.message.includes('fetch')) {
      console.log('💡 Solución: Error de conexión');
      console.log('   - Verifica tu conexión a internet');
      console.log('   - Verifica que https://api.tavily.com/ sea accesible\n');
    }

    process.exit(1);
  }
}

testTavilySearch();
