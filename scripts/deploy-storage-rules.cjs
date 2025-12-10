const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'lovenda-98c77';
const BUCKET_NAME = 'lovenda-98c77.firebasestorage.app';

async function deployStorageRules() {
  try {
    console.log('🚀 Desplegando reglas de Firebase Storage...\n');
    
    // 1. Leer las reglas
    const rulesPath = path.join(__dirname, '..', 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    console.log('📝 Reglas cargadas desde storage.rules');
    
    // 2. Obtener token de acceso
    const auth = new GoogleAuth({
      keyFile: path.join(__dirname, '..', 'backend', 'serviceAccount.json'),
      scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    console.log('🔑 Token de acceso obtenido');
    
    // 3. Desplegar usando Firebase Management API v1beta1
    console.log('📤 Desplegando reglas...');
    
    const url = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`;
    
    // Crear nuevo ruleset
    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          files: [{
            name: 'storage.rules',
            content: rulesContent
          }]
        }
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Error creando ruleset: ${createResponse.status}\n${error}`);
    }
    
    const ruleset = await createResponse.json();
    console.log('✅ Ruleset creado:', ruleset.name);
    
    // 4. Listar releases existentes primero
    console.log('📋 Listando releases existentes...');
    const listUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`;
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${token.token}`,
      }
    });
    
    if (listResponse.ok) {
      const releases = await listResponse.json();
      console.log('Releases encontradas:');
      if (releases.releases) {
        releases.releases.forEach(r => {
          console.log(`  - ${r.name} → ${r.rulesetName}`);
        });
      }
    }
    
    // 5. Actualizar release de Storage (igual que Firestore)
    console.log('\n📤 Desplegando reglas de Storage...');
    
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/firebase.storage~2F${BUCKET_NAME.replace(/\./g, '~2E')}`;
    
    const releaseResponse = await fetch(releaseUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        release: {
          name: `projects/${PROJECT_ID}/releases/firebase.storage/${BUCKET_NAME}`,
          rulesetName: ruleset.name
        }
      })
    });
    
    if (!releaseResponse.ok) {
      const error = await releaseResponse.text();
      throw new Error(`Error desplegando: ${releaseResponse.status}\n${error}`);
    }
    
    const release = await releaseResponse.json();
    console.log('✅ Release actualizada correctamente');
    console.log(`  Release: ${release.name}`);
    console.log(`  Actualizado: ${release.updateTime}`);
    console.log('\n✅ Reglas de Storage desplegadas correctamente!');
    console.log('📋 Bucket:', BUCKET_NAME);
    console.log('🕐 Actualizado:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.message);
    process.exit(1);
  }
}

deployStorageRules();
