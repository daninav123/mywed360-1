#!/usr/bin/env node
/**
 * syncLegalRequirementsCatalog.js
 * ---------------------------------------------------------
 * Sincroniza el catálogo legal estructurado (`legalRequirementsCatalog`)
 * con Firestore. Usa el dataset generado en
 * `docs/protocolo/legal/legal-requirements-catalog.json` por defecto.
 *
 * Uso:
 *   node scripts/syncLegalRequirementsCatalog.js
 *   node scripts/syncLegalRequirementsCatalog.js --file=path/to/catalog.json
 *   node scripts/syncLegalRequirementsCatalog.js --dry-run
 *   node scripts/syncLegalRequirementsCatalog.js --prune
 *
 * Requisitos:
 *   - Variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando a un
 *     service account JSON o bien FIREBASE_SERVICE_ACCOUNT con la ruta al JSON.
 *   - Permisos de escritura en Firestore.
 *
 * Flags:
 *   --file=<path>   Ruta al catálogo JSON (por defecto el snapshot en docs/…)
 *   --dry-run       No escribe en Firestore; solo muestra lo que haría.
 *   --prune         Elimina requisitos en Firestore que no existan en el JSON.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const DEFAULT_DATASET = path.join(
  'docs',
  'protocolo',
  'legal',
  'legal-requirements-catalog.json'
);

const args = process.argv.slice(2);
const options = {
  file: DEFAULT_DATASET,
  dryRun: false,
  prune: false,
};

for (const arg of args) {
  if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--prune') {
    options.prune = true;
  } else if (arg.startsWith('--file=')) {
    options.file = arg.split('=')[1];
  } else if (arg === '--help' || arg === '-h') {
    console.log(
      [
        'syncLegalRequirementsCatalog.js',
        '--------------------------------',
        'Sincroniza el catálogo legal con Firestore.',
        '',
        'Flags:',
        '  --file=<path>   Ruta al JSON del catálogo.',
        '  --dry-run       Simula sin escribir.',
        '  --prune         Elimina documentos que no estén en el JSON.',
      ].join('\n')
    );
    process.exit(0);
  }
}

const datasetPath = path.resolve(process.cwd(), options.file);
if (!fs.existsSync(datasetPath)) {
  console.error(`✗ No se encontró el archivo de catálogo en "${datasetPath}"`);
  process.exit(1);
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (error) {
  console.error('✗ No se pudo leer o parsear el catálogo JSON:', error.message);
  process.exit(1);
}

const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountPath) {
  console.error(
    '✗ Define GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_SERVICE_ACCOUNT con el path del service account JSON.'
  );
  process.exit(1);
}

let serviceAccount;
try {
  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
} catch (error) {
  console.error('✗ No se pudo cargar el service account JSON:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const countries = catalog.countries || {};
const schemaVersion = catalog.schemaVersion ?? 1;

const log = (message) => console.log(message);

async function syncRequirementDoc({ countryCode, typeKey, requirement, countryName }) {
  const docId = requirement.id || `${typeKey}-auto`;
  const countryRef = db.collection('legalRequirementsCatalog').doc(countryCode);
  const typeRef = countryRef.collection(typeKey);

  const payload = {
    ...requirement,
    countryCode,
    countryName,
    ceremonyType: typeKey,
    schemaVersion,
    sourceUrl:
      requirement.links?.[0]?.url ||
      countries[countryCode]?.metadata?.sourceUrl ||
      catalog.source ||
      null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (options.dryRun) {
    log(`• [dry-run] ${countryCode}/${typeKey}/${docId} <- ${payload.displayName || docId}`);
    return;
  }

  await typeRef.doc(docId).set(payload, { merge: true });
  log(`✓ ${countryCode}/${typeKey}/${docId}`);
}

async function syncCountry(code, entry) {
  const countryRef = db.collection('legalRequirementsCatalog').doc(code);
  const countryName = entry.name || code;

  if (options.dryRun) {
    log(`\n[${code}] Actualizar metadatos (dry-run)`);
  } else {
    await countryRef.set(
      {
        name: countryName,
        metadata: entry.metadata || {},
        schemaVersion,
        source: catalog.source || entry.metadata?.sourceUrl || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    log(`\n[${code}] Metadatos actualizados`);
  }

  const ceremonyTypes = entry.ceremonyTypes || {};

  for (const [typeKey, data] of Object.entries(ceremonyTypes)) {
    const requirements = Array.isArray(data.requirements) ? data.requirements : [];
    const typeRef = countryRef.collection(typeKey);
    let staleIds = new Set();

    if (options.prune || options.dryRun) {
      const existingDocs = await typeRef.listDocuments();
      staleIds = new Set(existingDocs.map((doc) => doc.id));
    }

    for (const requirement of requirements) {
      await syncRequirementDoc({ countryCode: code, typeKey, requirement, countryName });
      const docId = requirement.id || `${typeKey}-auto`;
      staleIds.delete(docId);
    }

    if (options.prune) {
      for (const staleId of staleIds) {
        if (options.dryRun) {
          log(`• [dry-run] eliminar ${code}/${typeKey}/${staleId}`);
        } else {
          await typeRef.doc(staleId).delete();
          log(`✂ ${code}/${typeKey}/${staleId} eliminado por prune`);
        }
      }
    }
  }
}

(async function main() {
  try {
    const countryEntries = Object.entries(countries);
    if (countryEntries.length === 0) {
      console.warn('⚠ El catálogo no contiene países para sincronizar.');
      process.exit(0);
    }

    log(
      `Sincronizando ${countryEntries.length} países (schemaVersion=${schemaVersion})${options.dryRun ? ' [dry-run]' : ''}${options.prune ? ' [prune]' : ''}`
    );

    for (const [code, entry] of countryEntries) {
      await syncCountry(code, entry);
    }

    log('\n✔ Sincronización finalizada.');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error durante la sincronización:', error);
    process.exit(1);
  }
})();
