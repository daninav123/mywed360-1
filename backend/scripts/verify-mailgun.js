import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const envPath = path.join(rootDir, '.env');

console.log('==> Cargando variables desde:', envPath);
dotenv.config({ path: envPath });

console.log('\n=== Verificacion de Configuracion Mailgun\n');
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

console.log('\n=== DIAGNOSTICO:\n');

if (!checks.MAILGUN_API_KEY) {
  console.log('X CRITICO: MAILGUN_API_KEY no esta definida');
  hasErrors = true;
} else {
  console.log('+ MAILGUN_API_KEY configurada');
}

if (!checks.MAILGUN_DOMAIN) {
  console.log('X CRITICO: MAILGUN_DOMAIN no esta definida');
  hasErrors = true;
} else {
  console.log('+ MAILGUN_DOMAIN configurada');
}

for (const [key, value] of Object.entries(checks)) {
  const status = value ? 'OK' : 'NO';
  console.log(`  ${key}: ${status}`);
}

console.log('\n=== Verificacion de Fallbacks:\n');

if (checks.VITE_MAILGUN_API_KEY && !checks.MAILGUN_API_KEY) {
  console.log('! AVISO: Solo existe VITE_MAILGUN_API_KEY');
  console.log('   Backend necesita MAILGUN_API_KEY (sin prefijo VITE_)');
  hasWarnings = true;
}

if (checks.VITE_MAILGUN_DOMAIN && !checks.MAILGUN_DOMAIN) {
  console.log('! AVISO: Solo existe VITE_MAILGUN_DOMAIN');
  console.log('   Backend necesita MAILGUN_DOMAIN (sin prefijo VITE_)');
  hasWarnings = true;
}

console.log('\n=== Test de Cliente Mailgun:\n');

try {
  const mailgunJs = (await import('mailgun-js')).default;
  
  const apiKey = checks.MAILGUN_API_KEY || checks.VITE_MAILGUN_API_KEY;
  const domain = checks.MAILGUN_DOMAIN || checks.VITE_MAILGUN_DOMAIN;
  const euRegion = (checks.MAILGUN_EU_REGION || checks.VITE_MAILGUN_EU_REGION) === 'true';
  
  if (!apiKey || !domain) {
    console.log('X No se puede crear cliente: faltan credenciales');
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
    console.log('+ Cliente Mailgun creado correctamente');
    console.log(`  Region: ${euRegion ? 'EU' : 'US'}`);
    console.log(`  Domain: ${domain}`);
    
    if (typeof mg.messages === 'function') {
      console.log('+ API de mensajes disponible');
    } else {
      console.log('! AVISO: API de mensajes no detectada');
      hasWarnings = true;
    }
  }
} catch (error) {
  console.log('X Error creando cliente:', error.message);
  hasErrors = true;
}

console.log('\n' + '='.repeat(60));
console.log('\n=== RESUMEN FINAL:\n');

if (!hasErrors && !hasWarnings) {
  console.log('+ Configuracion PERFECTA! El sistema de emails esta listo.');
  console.log('\n=== Puedes probar el envio con:');
  console.log('   curl -X POST http://localhost:4004/api/mailgun/send-test \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"toEmail":"tu-email@ejemplo.com","subject":"Test"}\'');
  process.exit(0);
} else if (hasErrors) {
  console.log('X Configuracion INCORRECTA - los emails NO funcionaran');
  console.log('\n=== Acciones requeridas:');
  console.log('   1. Revisar el archivo .env en la raiz del proyecto');
  console.log('   2. Asegurar que existen MAILGUN_API_KEY y MAILGUN_DOMAIN');
  console.log('   3. Reiniciar el servidor backend');
  process.exit(1);
} else if (hasWarnings) {
  console.log('! Configuracion con ADVERTENCIAS - puede funcionar pero hay mejoras');
  console.log('\n=== Recomendaciones:');
  console.log('   - Verificar el dominio en el panel de Mailgun');
  console.log('   - Asegurar que los registros DNS estan configurados');
  process.exit(0);
}
