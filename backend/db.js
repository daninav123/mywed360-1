import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', '.env'),
];
const loadedEnvFiles = new Set();
for (const candidate of envCandidates) {
  if (!loadedEnvFiles.has(candidate) && fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
    loadedEnvFiles.add(candidate);
  }
}

// Deshabilitar el uso del emulador salvo que se indique explícitamente
// Esto evita errores de conexión (ECONNREFUSED) cuando el emulador no está arrancado.
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.USE_FIRESTORE_EMULATOR !== 'true') {
  console.warn(
    '⚠️  FIRESTORE_EMULATOR_HOST está definido pero USE_FIRESTORE_EMULATOR no es "true". Usando Firestore real.'
  );
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

// Detect whether we're in local dev with Firestore emulator or production with service account.
// If GOOGLE_APPLICATION_CREDENTIALS is provided and the file exists, use it. Otherwise allow
// Firebase Admin to fall back to application default credentials. When FIRESTORE_EMULATOR_HOST
// is set the Admin SDK automatically routes all calls to the emulator.

// Permitir inyectar credencial de servicio vía variable de entorno (JSON directo o base64)
const RAW_SERVICE_ACCOUNT =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
let parsedServiceAccount = null;
if (RAW_SERVICE_ACCOUNT) {
  try {
    // Si la credencial viene en base64, decodificar
    let clean = RAW_SERVICE_ACCOUNT.trim();
    if (
      (clean.startsWith("'") && clean.endsWith("'")) ||
      (clean.startsWith('"') && clean.endsWith('"'))
    ) {
      clean = clean.slice(1, -1);
    }
    const jsonStr = clean.startsWith('{') ? clean : Buffer.from(clean, 'base64').toString('utf8');
    parsedServiceAccount = JSON.parse(jsonStr);
    console.log('✅ Credencial de servicio cargada desde variable de entorno');
  } catch (e) {
    console.error(
      '❌ No se pudo parsear FIREBASE_SERVICE_ACCOUNT_JSON. Se intentará método alternativo:',
      e.message
    );
  }
}

if (!admin.apps.length) {
  console.log('🔍 [db.js] Initializing Firebase Admin...');
  console.log('  - parsedServiceAccount exists:', !!parsedServiceAccount);
  console.log('  - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

  // Build init options dynamically to avoid passing invalid credential
  const initOptions = {
    projectId:
      process.env.VITE_FIREBASE_PROJECT_ID ||
      (parsedServiceAccount && parsedServiceAccount.project_id),
    // Firebase ahora usa .firebasestorage.app por defecto
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'lovenda-98c77.firebasestorage.app',
  };

  console.log('  - Project ID:', initOptions.projectId);
  console.log('  - Storage Bucket:', initOptions.storageBucket);

  if (parsedServiceAccount) {
    console.log('  ✅ Using parsed service account from env var');
    initOptions.credential = admin.credential.cert(parsedServiceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Resolver ruta relativa o absoluta
    const credPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (fs.existsSync(credPath)) {
      const json = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      initOptions.credential = admin.credential.cert(json);
      console.log(
        `✅ Credencial de servicio cargada desde GOOGLE_APPLICATION_CREDENTIALS: ${credPath}`
      );
    } else {
      console.warn(`⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a archivo no existente: ${credPath}`);
    }
  } else {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'serviceAccount.json'),
        path.resolve(process.cwd(), 'serviceAccountKey.json'),
        path.resolve(__dirname, 'serviceAccountKey.json'),
        path.resolve(__dirname, 'serviceAccount.json'),
        path.resolve(__dirname, '..', 'serviceAccount.json'),
        path.resolve(__dirname, '..', 'serviceAccountKey.json'),
      ];

      console.log('  - Searching for service account file in candidates...');
      candidates.forEach((c, i) => {
        const exists = fs.existsSync(c);
        console.log(`    ${i + 1}. ${exists ? '✓' : '✗'} ${c}`);
      });

      const svcPath = candidates.find((p) => fs.existsSync(p));
      if (svcPath) {
        const json = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
        initOptions.credential = admin.credential.cert(json);
        console.log(`  ✅ Credencial de servicio cargada desde ${svcPath}`);
      } else {
        console.error('  ❌ No se encontró archivo de credenciales en ninguna ubicación');
        console.error('  - Candidates checked:', candidates);
      }
    } catch (e) {
      console.error('  ❌ Error al cargar serviceAccount.json:', e?.message);
      console.error('  - Stack:', e?.stack);
    }
  }

  console.log('  - Initializing admin app with credential:', !!initOptions.credential);
  admin.initializeApp(initOptions);
  console.log('  ✅ Firebase Admin initialized successfully');

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`⚙️  Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      '⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. Firestore access will fail unless the emulator is running or Application Default Credentials are configured.'
    );
  }
}

export const db = getFirestore();
export { admin };
