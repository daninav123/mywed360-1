/**
 * Test directo con token del usuario
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

async function testDirectAuth() {
  console.log('🧪 Test directo de autenticación\n');
  
  // Crear un custom token
  const customToken = await auth.createCustomToken(USER_ID);
  console.log('✅ Token creado');
  
  // Intentar hacer una consulta al endpoint
  const url = 'http://localhost:4004/api/mail?folder=sent';
  
  console.log(`\n📡 Consultando: ${url}`);
  console.log('   Con Authorization: Bearer [token]\n');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${customToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`📊 Status: ${response.status} ${response.statusText}`);
  
  const text = await response.text();
  
  if (response.ok) {
    try {
      const data = JSON.parse(text);
      console.log(`\n✅ RESPUESTA EXITOSA:`);
      console.log(`   Emails devueltos: ${Array.isArray(data) ? data.length : 'no es array'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\n   Primeros emails:`);
        data.slice(0, 3).forEach(email => {
          console.log(`   - ${email.subject} (${email.from} → ${email.to})`);
        });
      }
    } catch (e) {
      console.log('   Respuesta:', text.substring(0, 200));
    }
  } else {
    console.log(`\n❌ ERROR:`);
    console.log(`   ${text}`);
  }
}

testDirectAuth().catch(console.error);
