/**
 * Test directo de OpenAI API
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🧪 Test directo de OpenAI API\n');

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ No se encontró OPENAI_API_KEY en .env');
  process.exit(1);
}

console.log(`✅ API Key encontrada: ${apiKey.substring(0, 20)}...\n`);

async function testOpenAI() {
  try {
    const projectId = process.env.OPENAI_PROJECT_ID;
    
    console.log('Inicializando cliente OpenAI...');
    console.log(`Project ID: ${projectId || 'not set'}\n`);
    
    const client = new OpenAI({
      apiKey,
      project: projectId,
      timeout: 10000,
      maxRetries: 1,
    });

    console.log('✅ Cliente inicializado\n');

    console.log('Haciendo llamada a la API...');
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Responde con un JSON simple: {"test": "ok"}' },
        { role: 'user', content: 'Test' },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    console.log('✅ Respuesta recibida:');
    console.log(completion.choices[0]?.message?.content);
    console.log('\n✅ OpenAI funciona correctamente\n');

  } catch (error) {
    console.error('❌ Error en llamada OpenAI:');
    console.error('Mensaje:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
    console.error('\nStack:', error.stack);
  }
}

testOpenAI();
