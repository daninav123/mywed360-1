import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const projectId = process.env.OPENAI_PROJECT_ID;

console.log('🔍 PRUEBA DIRECTA OPENAI');
console.log('========================');
console.log('API Key (primeros 20):', apiKey?.substring(0, 20));
console.log('API Key (últimos 10):', apiKey?.substring(apiKey.length - 10));
console.log('Project ID:', projectId);
console.log('');

const client = new OpenAI({
  apiKey,
  project: projectId,
  timeout: 10000,
});

console.log('📡 Haciendo llamada de prueba...\n');

try {
  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Di solo "OK"' }
    ],
    max_tokens: 10,
  });
  
  console.log('✅ ¡ÉXITO! OpenAI responde correctamente');
  console.log('Respuesta:', response.choices[0].message.content);
  console.log('Modelo usado:', response.model);
  console.log('\n🎉 La configuración de OpenAI es CORRECTA\n');
  process.exit(0);
} catch (error) {
  console.error('❌ ERROR en llamada OpenAI:');
  console.error('Código:', error.status || error.code);
  console.error('Mensaje:', error.message);
  console.error('');
  console.error('🔴 LA API KEY ES INVÁLIDA O ESTÁ REVOCADA');
  console.error('👉 Genera una nueva en: https://platform.openai.com/api-keys');
  console.error('');
  process.exit(1);
}
