const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = 'planivia-98c77';
const serviceAccountPath = path.join(__dirname, '..', 'backend', 'serviceAccount.json');

async function deployStorageRulesWithAdmin() {
  try {
    console.log('🚀 Desplegando reglas de Firebase Storage con Admin SDK...\n');
    
    // 1. Leer reglas
    const rulesPath = path.join(__dirname, '..', 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    console.log('📝 Reglas cargadas');
    
    // 2. Inicializar Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        projectId: PROJECT_ID,
      });
    }
    console.log('✅ Admin SDK inicializado');
    
    // 3. Usar Security Rules API directamente
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
    });
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    console.log('📤 Creando ruleset...');
    
    // Crear ruleset
    const createUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
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
    
    // IMPORTANTE: Usar el endpoint correcto con updateMask
    console.log('\n📤 Desplegando ruleset...');
    const bucketName = 'planivia-98c77.firebasestorage.app';
    
    // Primero obtener la release actual
    const getUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/firebase.storage%2F${bucketName}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token.token}`
      }
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.text();
      throw new Error(`Error obteniendo release: ${getResponse.status}\n${error}`);
    }
    
    const currentRelease = await getResponse.json();
    console.log('📋 Release actual:', currentRelease.rulesetName);
    
    // Actualizar con PUT completo
    const updateUrl = getUrl;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: currentRelease.name,
        rulesetName: ruleset.name,
        createTime: currentRelease.createTime,
        updateTime: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log('📋 Response status:', updateResponse.status);
      console.log('📋 Error completo:', error);
      throw new Error(`Error actualizando release: ${updateResponse.status}`);
    }
    
    const release = await updateResponse.json();
    console.log('\n✅ ¡Reglas de Storage desplegadas correctamente!');
    console.log('📋 Release:', release.name);
    console.log('🕐 Actualizado:', release.updateTime);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deployStorageRulesWithAdmin();
