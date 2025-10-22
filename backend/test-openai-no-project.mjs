// Probar OpenAI SIN project ID
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

console.log('🧪 Probando OpenAI SIN project ID...\n');
console.log('API Key:', apiKey ? `${apiKey.slice(0, 20)}...` : 'NO DEFINIDA');
console.log('');

if (!apiKey) {
  console.error('❌ No hay API key');
  process.exit(1);
}

try {
  // SIN project parameter
  const openai = new OpenAI({ apiKey });
  
  console.log('✅ Cliente inicializado (sin project)');
  console.log('🚀 Llamando a OpenAI...\n');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Di solo "funciona"' }],
    max_tokens: 5,
  });
  
  console.log('✅ FUNCIONA:', completion.choices[0].message.content);
  console.log('\n🎉 La key funciona SIN project ID');
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('Status:', error.status);
  console.error('Code:', error.code);
}
