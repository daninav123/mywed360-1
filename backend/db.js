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
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

// Deshabilitar el uso del emulador salvo que se indique explícitamente
// Esto evita errores de conexión (ECONNREFUSED) cuando el emulador no está arrancado.
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.USE_FIRESTORE_EMULATOR !== 'true') {
  console.warn('⚠️  FIRESTORE_EMULATOR_HOST está definido pero USE_FIRESTORE_EMULATOR no es "true". Usando Firestore real.');
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
    const jsonStr = clean.startsWith('{')
      ? clean
      : Buffer.from(clean, 'base64').toString('utf8');
    parsedServiceAccount = JSON.parse(jsonStr);
    console.log('✅ Credencial de servicio cargada desde variable de entorno');
  } catch (e) {
    console.error('❌ No se pudo parsear FIREBASE_SERVICE_ACCOUNT_JSON. Se intentará método alternativo:', e.message);
  }
}

if (!admin.apps.length) {
  // Build init options dynamically to avoid passing invalid credential
  const initOptions = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || (parsedServiceAccount && parsedServiceAccount.project_id),
  };

  if (parsedServiceAccount) {
    initOptions.credential = admin.credential.cert(parsedServiceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    initOptions.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(initOptions);

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`⚙️  Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. Firestore access will fail unless the emulator is running or Application Default Credentials are configured.');
  }
}

export const db = getFirestore();
