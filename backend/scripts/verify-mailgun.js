import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la ra�z del proyecto
const rootDir = path.resolve(__dirname, '..', '..');
const envPath = path.join(rootDir, '.env');

console.log('=� Cargando variables desde:', envPath);
dotenv.config({ path: envPath });

console.log('\n= Verificaci�n de Configuraci�n Mailgun\n');
console.log('='.repeat(60));

const checks = {
  'MAILGUN_API_KEY': process.env.MAILGUN_API_KEY,
  'VITE_MAILGUN_API_KEY': process.env.VITE_MAILGUN_API_KEY,
  'MAILGUN_DOMAIN': process.env.MAILGUN_DOMAIN,
  'VITE_MAILGUN_DOMAIN': process.env.VITE_MAILGUN_DOMAIN,
  'MAILGUN_SENDING_DOMAIN': process.env.MAILGUN_SENDING_DOMAIN,
  'VITE_MAILGUN_SENDING_DOMAIN': process.env.VITE_MAILGUN_SENDING_DOMAIN,
  'MAILGUN_EU_REGION': process.env.MAILGUN_EU_REGION,
  'VITE_MAILGUN_EU_REGION': process.env.VITE_MAILGUN_EU_REGION,
  'MAILGUN_SIGNING_KEY': process.env.MAILGUN_SIGNING_KEY,
};

let hasErrors = false;
let hasWarnings = false;

console.log('\n=� Estado de Variables:\n');

for (const [key, value] of Object.entries(checks)) {
  const status = value ? '' : 'L';
  let displayValue = 'NO DEFINIDA';
  
  if (value) {
    if (key.includes('API_KEY') || key.includes('SIGNING_KEY')) {
      displayValue = value.substring(0, 8) + '***' + value.substring(value.length - 8);
    } else if (key.includes('REGION')) {
      displayValue = value;
    } else {
      displayValue = value;
    }
  }
  
  console.log(`${status} ${key.padEnd(30)} ${displayValue}`);
  
  if (!value && key.startsWith('MAILGUN_') && key !== 'MAILGUN_SIGNING_KEY') {
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n=� DIAGN�STICO:\n');

// Verificar configuraci�n cr�tica
if (!checks.MAILGUN_API_KEY) {
  console.log('L CR�TICO: MAILGUN_API_KEY no est� definida');
  hasErrors = true;
} else {
  console.log(' MAILGUN_API_KEY configurada');
}

if (!checks.MAILGUN_DOMAIN) {
  console.log('L CR�TICO: MAILGUN_DOMAIN no est� definida');
  hasErrors = true;
} else {
  console.log(' MAILGUN_DOMAIN configurada:', checks.MAILGUN_DOMAIN);
}

if (checks.MAILGUN_EU_REGION === 'true') {
  console.log(' Regi�n EU configurada (api.eu.mailgun.net)');
} else {
  console.log('9  Regi�n US (api.mailgun.net)');
}

// Verificar fallbacks
console.log('\n= Verificaci�n de Fallbacks:\n');

if (checks.VITE_MAILGUN_API_KEY && !checks.MAILGUN_API_KEY) {
  console.log('� AVISO: Solo existe VITE_MAILGUN_API_KEY');
  console.log('   Backend necesita MAILGUN_API_KEY (sin prefijo VITE_)');
  hasWarnings = true;
}

if (checks.VITE_MAILGUN_DOMAIN && !checks.MAILGUN_DOMAIN) {
  console.log('� AVISO: Solo existe VITE_MAILGUN_DOMAIN');
  console.log('   Backend necesita MAILGUN_DOMAIN (sin prefijo VITE_)');
  hasWarnings = true;
}

// Test de creaci�n de cliente
console.log('\n=' Test de Cliente Mailgun:\n');

try {
  const mailgunJs = (await import('mailgun-js')).default;
  
  const apiKey = checks.MAILGUN_API_KEY || checks.VITE_MAILGUN_API_KEY;
  const domain = checks.MAILGUN_DOMAIN || checks.VITE_MAILGUN_DOMAIN;
  const euRegion = (checks.MAILGUN_EU_REGION || checks.VITE_MAILGUN_EU_REGION) === 'true';
  
  if (!apiKey || !domain) {
    console.log('L No se puede crear cliente: faltan credenciales');
    hasErrors = true;
  } else {
    const options = {
      apiKey,
      domain
    };
    
    if (euRegion) {
      options.host = 'api.eu.mailgun.net';
    }
    
    const mg = mailgunJs(options);
    console.log(' Cliente Mailgun creado correctamente');
    console.log('   - API Key:', apiKey.substring(0, 8) + '***');
    console.log('   - Dominio:', domain);
    console.log('   - Host:', options.host || 'api.mailgun.net (US)');
    
    // Intentar validar el dominio
    console.log('\n< Validando dominio...');
    
    try {
      await new Promise((resolve, reject) => {
        mg.get(`/domains/${domain}`, (err, body) => {
          if (err) {
            reject(err);
          } else {
            resolve(body);
          }
        });
      });
      
      console.log(' Dominio v�lido y accesible en Mailgun');
    } catch (validateError) {
      console.log('� No se pudo validar el dominio:', validateError.message);
      console.log('   Esto puede ser normal si el dominio no est� completamente configurado');
      hasWarnings = true;
    }
  }
} catch (error) {
  console.log('L Error creando cliente:', error.message);
  hasErrors = true;
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('\n<� RESUMEN FINAL:\n');

if (!hasErrors && !hasWarnings) {
  console.log(' �Configuraci�n PERFECTA! El sistema de emails est� listo.');
  console.log('\n=� Puedes probar el env�o con:');
  console.log('   curl -X POST http://localhost:4004/api/mailgun/send-test \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"toEmail":"tu-email@ejemplo.com","subject":"Test"}\'');
  process.exit(0);
} else if (hasErrors) {
  console.log('L Configuraci�n INCORRECTA - los emails NO funcionar�n');
  console.log('\n=' Acciones requeridas:');
  console.log('   1. Revisar el archivo .env en la ra�z del proyecto');
  console.log('   2. Asegurar que existen MAILGUN_API_KEY y MAILGUN_DOMAIN');
  console.log('   3. Reiniciar el servidor backend');
  process.exit(1);
} else if (hasWarnings) {
  console.log('� Configuraci�n con ADVERTENCIAS - puede funcionar pero hay mejoras');
  console.log('\n=� Recomendaciones:');
  console.log('   - Verificar el dominio en el panel de Mailgun');
  console.log('   - Asegurar que los registros DNS est�n configurados');
  process.exit(0);
}
