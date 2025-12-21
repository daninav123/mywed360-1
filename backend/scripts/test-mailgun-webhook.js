import fetch from 'node-fetch';

const webhookUrl = 'http://localhost:4004/api/inbound/mailgun';

const testEmail = {
  // Mailgun signature (requerido pero no verificaremos en test)
  timestamp: Math.floor(Date.now() / 1000).toString(),
  token: 'test-token-' + Date.now(),
  signature: 'test-signature',
  
  // Email data
  recipient: 'dani@mg.malove.app',
  sender: 'test@example.com',
  subject: 'Test Email - Respuesta presupuesto',
  'body-plain': 'Hola, adjunto te envío el presupuesto solicitado.',
  'stripped-text': 'Hola, adjunto te envío el presupuesto solicitado.',
};

console.log('🧪 Enviando email de prueba al webhook...');
console.log('Destinatario:', testEmail.recipient);
console.log('Remitente:', testEmail.sender);
console.log('Asunto:', testEmail.subject);
console.log('');

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(testEmail).toString(),
  });
  
  const data = await response.json();
  
  console.log('✅ Respuesta del webhook:', response.status);
  console.log('📦 Data:', data);
  console.log('');
  console.log('👀 Ahora revisa los logs del backend para ver si el email se procesó correctamente');
} catch (error) {
  console.error('❌ Error:', error.message);
}
