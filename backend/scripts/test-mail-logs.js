/**
 * Test para verificar logs de debug en /api/mail
 */

import fetch from 'node-fetch';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const auth = getAuth();
const USER_ID = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

async function testMailLogs() {
  console.log('🧪 Test de logs en /api/mail\n');
  
  // Crear un ID token real
  const user = await auth.getUser(USER_ID);
  console.log(`✅ Usuario: ${user.email}`);
  
  // Crear un custom token y luego cambiarlo por un ID token
  // En este script no podemos hacer eso fácilmente, así que vamos a usar
  // una petición sin auth para ver si al menos llega al log PRE-AUTH
  
  const url = 'http://localhost:4004/api/mail?folder=sent';
  
  console.log(`\n📡 Consultando: ${url}`);
  console.log('   SIN token (para ver si llega al log PRE-AUTH)\n');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log(`\n📄 Respuesta:`);
    console.log(text.substring(0, 500));
    
    console.log(`\n💡 Revisa los logs del backend para ver:`);
    console.log(`   - 🚨 [INDEX] PRE-AUTH`);
    console.log(`   - ✅ [INDEX] POST-AUTH (si pasa auth)`);
    console.log(`   - 🔥 [MAIL-ROUTER]`);
    console.log(`   - 🔍🔍🔍 LISTMAILS EJECUTANDOSE`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testMailLogs().catch(console.error);
