// Script temporal para verificar OpenAI
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

console.log('🔍 Verificando configuración de OpenAI...\n');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.slice(0, 15)}...` : '❌ NO CONFIGURADA');
console.log('OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || '❌ NO CONFIGURADO');
console.log('');

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY no está en las variables de entorno');
  process.exit(1);
}

try {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    project: process.env.OPENAI_PROJECT_ID || undefined,
  });
  
  console.log('✅ Cliente OpenAI inicializado correctamente');
  console.log('');
  console.log('🧪 Probando llamada a OpenAI...');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'Di "test exitoso" si puedes leer esto'
      }
    ],
    max_tokens: 20,
  });
  
  console.log('✅ Respuesta de OpenAI:', completion.choices[0].message.content);
  console.log('');
  console.log('🎉 TODO FUNCIONA CORRECTAMENTE');
  
} catch (error) {
  console.error('❌ ERROR al llamar a OpenAI:');
  console.error('Código:', error.code);
  console.error('Mensaje:', error.message);
  console.error('Status:', error.status);
  console.error('');
  console.error('Detalles completos:', error);
  process.exit(1);
}
