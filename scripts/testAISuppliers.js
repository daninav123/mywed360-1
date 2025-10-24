#!/usr/bin/env node

/**
 * Script para probar el endpoint de búsqueda de proveedores IA
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno del backend
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://localhost:4004';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

console.log('\n══════════════════════════════════════════════════════════');
console.log('  🤖 DIAGNÓSTICO DE BÚSQUEDA IA DE PROVEEDORES');
console.log('══════════════════════════════════════════════════════════\n');

// 1. Verificar variables de entorno
console.log('📋 1. VARIABLES DE ENTORNO');
console.log('─'.repeat(60));

if (OPENAI_API_KEY) {
  const masked = `${OPENAI_API_KEY.substring(0, 8)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`;
  console.log(`✅ OPENAI_API_KEY: ${masked}`);
} else {
  console.log('❌ OPENAI_API_KEY: NO CONFIGURADA');
}

console.log(`✅ BACKEND_URL: ${BACKEND_URL}`);
console.log('');

// 2. Verificar backend
console.log('📡 2. CONECTIVIDAD CON BACKEND');
console.log('─'.repeat(60));

const testBackend = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log(`✅ Backend respondiendo (${response.status})`);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Backend no responde');
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Inicia el backend: cd backend && npm run dev');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
};

// 3. Probar endpoint de AI Suppliers
const testAISuppliers = async () => {
  console.log('🔍 3. PRUEBA DEL ENDPOINT /api/ai-suppliers');
  console.log('─'.repeat(60));

  try {
    console.log('Enviando búsqueda: "fotografo boda madrid"\n');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/ai-suppliers`,
      {
        query: 'fotografo boda madrid',
        service: 'Fotografia',
        location: 'Madrid',
        budget: '1500-2500 EUR',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        validateStatus: () => true, // Aceptar cualquier status
      }
    );

    console.log(`📥 Respuesta del servidor:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(response.headers['content-type'])}`);
    console.log('');

    if (response.status === 200) {
      console.log('✅ BÚSQUEDA EXITOSA\n');
      
      const results = response.data;
      if (Array.isArray(results) && results.length > 0) {
        console.log(`   Resultados encontrados: ${results.length}`);
        console.log('');
        
        results.slice(0, 3).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.title || result.name || 'Sin nombre'}`);
          console.log(`      Servicio: ${result.service || 'N/A'}`);
          console.log(`      Ubicación: ${result.location || 'N/A'}`);
          console.log(`      Precio: ${result.priceRange || result.price || 'N/A'}`);
          console.log(`      Link: ${result.link || 'N/A'}`);
          console.log('');
        });
        
        return true;
      } else {
        console.log('⚠️  Respuesta vacía (sin resultados)');
        console.log(`   Data: ${JSON.stringify(results)}`);
        console.log('');
        return false;
      }
    } else if (response.status === 401) {
      console.log('❌ ERROR: No autenticado');
      console.log('   El endpoint requiere autenticación');
      console.log('   💡 Prueba desde el frontend con un usuario logueado');
      console.log('');
      return false;
    } else if (response.status === 500) {
      console.log('❌ ERROR EN EL SERVIDOR\n');
      
      const error = response.data;
      console.log(`   Error: ${error.error || 'unknown'}`);
      console.log(`   Details: ${error.details || 'N/A'}`);
      console.log('');
      
      if (error.error === 'OPENAI_API_KEY missing') {
        console.log('   💡 Causa: OPENAI_API_KEY no está configurada en el backend');
        console.log('   💡 Solución:');
        console.log('      1. Verifica backend/.env');
        console.log('      2. Añade: OPENAI_API_KEY=tu-key-aqui');
        console.log('      3. Reinicia el backend');
      } else if (error.error === 'openai_failed') {
        console.log('   💡 Causa: Error al llamar a OpenAI API');
        console.log('   💡 Posibles razones:');
        console.log('      - API Key inválida o expirada');
        console.log('      - Límite de cuota excedido');
        console.log('      - Problemas de conectividad con OpenAI');
      }
      
      console.log('');
      return false;
    } else {
      console.log(`⚠️  Respuesta inesperada: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data)}`);
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR EN LA PETICIÓN\n');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('   No se recibió respuesta del servidor');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    return false;
  }
};

// Ejecutar diagnóstico
const main = async () => {
  if (!OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY no encontrada\n');
    console.log('💡 SOLUCIÓN:');
    console.log('   1. Edita backend/.env');
    console.log('   2. Añade: OPENAI_API_KEY=sk-proj-...');
    console.log('   3. Reinicia el backend');
    console.log('');
    process.exit(1);
  }

  const backendOk = await testBackend();
  
  if (!backendOk) {
    console.log('══════════════════════════════════════════════════════════');
    console.log('❌ No se puede continuar sin el backend corriendo');
    console.log('══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }

  const searchOk = await testAISuppliers();

  console.log('══════════════════════════════════════════════════════════');
  
  if (searchOk) {
    console.log('\n✅ EL BUSCADOR DE PROVEEDORES IA ESTÁ FUNCIONANDO\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Prueba desde la app frontend');
    console.log('   2. Ve a Proveedores → Buscar con IA');
    console.log('   3. Busca: "fotografo boda madrid"');
  } else {
    console.log('\n❌ EL BUSCADOR DE PROVEEDORES IA NO FUNCIONA\n');
    console.log('📝 Revisa:');
    console.log('   1. Logs del backend para más detalles');
    console.log('   2. Variables de entorno en backend/.env');
    console.log('   3. Cuota de OpenAI API en https://platform.openai.com/usage');
  }
  
  console.log('\n══════════════════════════════════════════════════════════\n');
  
  process.exit(searchOk ? 0 : 1);
};

main();
