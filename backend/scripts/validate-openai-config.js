#!/usr/bin/env node
/**
 * Script para validar que la configuración de OpenAI es correcta
 * Verifica API key y Project ID
 */

import 'dotenv/config';

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'OPENAI_PROJECT_ID'
];

console.log('\n🔍 Validando configuración de OpenAI...\n');

let hasErrors = false;

// Verificar variables de entorno
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName} no está configurada`);
    hasErrors = true;
  } else {
    const maskedValue = varName.includes('KEY') 
      ? value.slice(0, 10) + '...' + value.slice(-4)
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

// Verificar que coincidan con los valores esperados
const expectedProjectId = 'proj_7IWFKysvJciPmnkpqop9rrpT';
const expectedKeyPrefix = 'sk-proj-JhAy2_RDf60';

if (process.env.OPENAI_PROJECT_ID !== expectedProjectId) {
  console.error(`❌ OPENAI_PROJECT_ID incorrecto. Esperado: ${expectedProjectId}`);
  hasErrors = true;
}

if (!process.env.OPENAI_API_KEY?.startsWith(expectedKeyPrefix)) {
  console.error(`❌ OPENAI_API_KEY parece incorrecta (no empieza con ${expectedKeyPrefix})`);
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ Hay errores en la configuración de OpenAI\n');
  process.exit(1);
} else {
  console.log('\n✅ Configuración de OpenAI correcta\n');
  
  // Test de conexión
  console.log('🔄 Probando conexión con OpenAI...\n');
  
  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      project: process.env.OPENAI_PROJECT_ID,
      timeout: 10000
    });
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5
    });
    
    console.log('✅ Conexión exitosa con OpenAI');
    console.log(`   Modelo: ${response.model}`);
    console.log(`   Respuesta: ${response.choices[0].message.content}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error conectando con OpenAI:', err.message);
    if (err.code) console.error(`   Código: ${err.code}`);
    process.exit(1);
  }
}
