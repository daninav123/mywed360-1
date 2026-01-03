#!/usr/bin/env node
/**
 * Script: seedPersonalizationProfiles.js
 * ---------------------------------------------
 * Crea datos de ejemplo enfocados en personalización avanzada
 * (perfiles con contrastes, recomendaciones, tareas y ajustes de presupuesto).
 *
 * Uso:
 *   node scripts/seedPersonalizationProfiles.js
 *   node scripts/seedPersonalizationProfiles.js --prefix=demo --force
 *   node scripts/seedPersonalizationProfiles.js --keyPath=./serviceAccount.json
 *
 * Requisitos:
 * - GOOGLE_APPLICATION_CREDENTIALS o --keyPath apuntando a un JSON de servicio Firebase.
 * - Permisos de lectura/escritura sobre Firestore.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import { randomUUID } from 'crypto';

const FieldValue = () => admin.firestore.FieldValue.serverTimestamp();

const ARG_PREFIX = '--';

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith(ARG_PREFIX)) continue;
    const [key, value] = arg.substring(2).split('=');
    args[key] = value ?? true;
  }
  return args;
}

async function ensureAdmin(keyPath) {
  if (admin.apps.length) return;
  let credential;
  if (keyPath) {
    const path = require('path');
    const fs = require('fs');
    const absolute = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(absolute)) {
      console.error('❌  No se encontró la credencial:', absolute);
      process.exit(1);
    }
    credential = admin.credential.cert(require(absolute));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function clearSubcollection(ref) {
  const snapshot = await ref.get();
  const batch = admin.firestore().batch();
  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

const BASE_SAMPLES = [
  {
    slug: 'demo-minimal-circus',
    name: 'Demo · Minimalista con speakeasy circo',
    weddingDate: '2026-03-21',
    summary:
      'Boda minimalista en museo contemporáneo con experiencia secreta estilo circo vintage durante el after-party.',
    profile: {
      eventType: 'wedding',
      stylePrimary: 'minimalista',
      styleSecondary: 'luxe',
      vibeKeywords: ['minimal', 'monocromático', 'arte contemporáneo'],
      guestCountRange: { min: 80, max: 110 },
      budgetRange: { min: 45000, max: 52000, currency: 'EUR' },
      priorityAreas: ['experiencia invitados', 'decoración', 'after-party'],
      mustHaveVendors: ['lighting_design', 'art_curator'],
      accessibilityNeeds: ['acceso silla de ruedas', 'señalética braille'],
      dietaryRestrictions: ['veganos', 'sin gluten'],
      specialMoments: [
        { id: 'vows', title: 'Votos en sala principal', notes: 'Escultura luminosa como backdrop', responsibleRole: 'planner' },
      ],
      specialInterests: [
        {
          id: randomUUID(),
          idea: 'Instalación lumínica con esculturas minimalistas',
          tipo: 'decoracion',
          nivelEntusiasmo: 'mustHave',
          contexto: 'Integra el estilo del museo y refuerza el tono minimalista',
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          idea: 'Speakeasy de circo vintage secreto',
          tipo: 'experiencia',
          nivelEntusiasmo: 'mustHave',
          contexto: 'Sorpresa durante el after-party',
          nivelContraste: 'contraste_controlado',
          relacionaConStyle: 'after_party',
          zonaAplicacion: 'sala-anexa-speakeasy',
          requiresReview: false,
          createdBy: 'planner',
          createdAt: new Date().toISOString(),
        },
      ],
      noGoItems: [
        {
          id: randomUUID(),
          descripcion: 'Globos tradicionales',
          motivo: 'visual',
          registradoPor: 'planner',
          createdAt: new Date().toISOString(),
        },
      ],
      communicationPreferences: { channel: 'email', language: 'es' },
      confidenceScore: 0.82,
    },
    insights: {
      summary:
        'Predomina estética minimalista; se habilita un contraste controlado con experiencia circense para sorprender.',
      tags: ['minimalista', 'circo', 'after_party'],
      nextBestActions: ['recommendation-speakeasy-layout', 'task-lighting-review'],
      profileGaps: [],
      styleWeights: { coreStyleWeight: 0.78, contrasteWeight: 0.22, limit: 0.35 },
      trends: [
        {
          id: randomUUID(),
          insight: 'Los after-party temáticos aumentan satisfacción 18% en bodas minimalistas.',
          source: 'analytics',
        },
      ],
      telemetry: { recommendationsAppliedRatio: 0.66, feedbackScore: 4.7 },
    },
    recommendations: [
      {
        id: 'rec-light-sculptures',
        title: 'Co-crear instalación lumínica minimalista',
        destination: 'tasks',
        status: 'applied',
        fitScore: 0.94,
        type: 'core',
        motive: 'Refuerza narrativa minimalista',
      },
      {
        id: 'rec-circus-speakeasy',
        title: 'Diseñar speakeasy circo vintage',
        destination: 'tasks',
        status: 'suggested',
        fitScore: 0.81,
        type: 'contrast',
        motive: 'Crear sorpresa controlada en after-party',
        context: { zonaAplicacion: 'sala-anexa-speakeasy', nivelContraste: 'contraste_controlado' },
      },
    ],
    tasks: [
      {
        title: 'Coordinar instalación lumínica con curador del museo',
        status: 'in_progress',
        category: 'decoracion',
        dueDate: '2026-02-10',
        assignedTo: 'planner',
      },
      {
        title: 'Diseñar recorrido secreto para speakeasy',
        status: 'suggested',
        category: 'experiencia',
        dueDate: '2026-02-25',
        assignedTo: 'planner',
        contrastContext: { zonaAplicacion: 'sala-anexa-speakeasy', nivelContraste: 'contraste_controlado' },
      },
    ],
    budgetAdjustments: [
      {
        category: 'experiencias',
        amount: 6500,
        currency: 'EUR',
        reason: 'Producción speakeasy y artistas circenses',
      },
    ],
  },
  {
    slug: 'demo-boho-urban-night',
    name: 'Demo · Boho natural + noche urbana',
    weddingDate: '2026-07-12',
    summary:
      'Ceremonia boho al aire libre con transición a rooftop urbano nocturno inspirado en neón y arte callejero.',
    profile: {
      eventType: 'wedding',
      stylePrimary: 'boho',
      styleSecondary: 'nature',
      vibeKeywords: ['boho', 'botánico', 'luz natural'],
      guestCountRange: { min: 120, max: 150 },
      budgetRange: { min: 38000, max: 42000, currency: 'EUR' },
      priorityAreas: ['ceremonia', 'gastronomía', 'after-party'],
      mustHaveVendors: ['florist_bespoke', 'mixology_team'],
      accessibilityNeeds: [],
      dietaryRestrictions: ['vegetarianos'],
      specialMoments: [
        { id: 'sunset-ceremony', title: 'Ceremonia al atardecer', notes: 'Arco floral orgánico', responsibleRole: 'planner' },
      ],
      specialInterests: [
        {
          id: randomUUID(),
          idea: 'Ceremonia boho con arco orgánico',
          tipo: 'decoracion',
          nivelEntusiasmo: 'mustHave',
          contexto: 'Elemento central de la ceremonia',
          createdBy: 'couple',
          createdAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          idea: 'After-party urbano con visuales neón',
          tipo: 'experiencia',
          nivelEntusiasmo: 'considerar',
          contexto: 'Contraste buscado para sorprende a invitados jóvenes',
          nivelContraste: 'contraste_controlado',
          relacionaConStyle: 'after_party',
          zonaAplicacion: 'rooftop-neon',
          requiresReview: true,
          createdBy: 'planner',
          createdAt: new Date().toISOString(),
        },
      ],
      noGoItems: [
        {
          id: randomUUID(),
          descripcion: 'Atracciones infantiles',
          motivo: 'cutre',
          registradoPor: 'planner',
          createdAt: new Date().toISOString(),
        },
      ],
      communicationPreferences: { channel: 'assistant', language: 'es' },
      confidenceScore: 0.75,
    },
    insights: {
      summary:
        'Se mantiene esencia boho durante ceremonia y banquete; el after-party urbano requiere revisión para asegurar coherencia logística.',
      tags: ['boho', 'urbano', 'after_party'],
      nextBestActions: ['recommendation-neon-vendors', 'followup-contrast-review'],
      profileGaps: [{ categoria: 'logistica_rooftop', estado: 'pending', followUpId: 'gap-logistica-rooftop' }],
      styleWeights: { coreStyleWeight: 0.7, contrasteWeight: 0.3, limit: 0.35 },
      trends: [],
      telemetry: { recommendationsAppliedRatio: 0.42, feedbackScore: 4.1 },
    },
    recommendations: [
      {
        id: 'rec-boho-lighting',
        title: 'Confirmar iluminación cálida para ceremonia boho',
        destination: 'tasks',
        status: 'applied',
        fitScore: 0.9,
        type: 'core',
      },
      {
        id: 'rec-neon-visuals',
        title: 'Prototipar visuales neón para after-party urbano',
        destination: 'tasks',
        status: 'conflict',
        fitScore: 0.58,
        type: 'contrast',
        conflictReason: 'requiresReview',
        context: { zonaAplicacion: 'rooftop-neon', nivelContraste: 'contraste_controlado' },
      },
    ],
    tasks: [
      {
        title: 'Diseñar disposición floral boho',
        status: 'completed',
        category: 'decoracion',
        dueDate: '2026-05-01',
        assignedTo: 'florist_bespoke',
      },
      {
        title: 'Evaluar logística rooftop para contraste urbano',
        status: 'pending_review',
        category: 'logistica',
        dueDate: '2026-05-20',
        assignedTo: 'planner_assistant',
        contrastContext: { zonaAplicacion: 'rooftop-neon', nivelContraste: 'contraste_controlado', requiresReview: true },
      },
    ],
    budgetAdjustments: [
      {
        category: 'iluminacion',
        amount: 2800,
        currency: 'EUR',
        reason: 'Iluminación dinámica para transición boho → urbano',
      },
    ],
  },
  {
    slug: 'demo-classic-futuristic',
    name: 'Demo · Clásica elegante con show futurista',
    weddingDate: '2026-11-05',
    summary:
      'Banquete clásico en palacio histórico con acto central futurista (mapping holográfico) durante la apertura del baile.',
    profile: {
      eventType: 'wedding',
      stylePrimary: 'clasico',
      styleSecondary: 'elegante',
      vibeKeywords: ['formal', 'romántico', 'histórico'],
      guestCountRange: { min: 180, max: 220 },
      budgetRange: { min: 75000, max: 90000, currency: 'EUR' },
      priorityAreas: ['banquete', 'experiencia visual', 'música'],
      mustHaveVendors: ['orquesta', 'catering_premium'],
      accessibilityNeeds: ['rampas temporales'],
      dietaryRestrictions: ['kosher', 'sin lactosa'],
      specialMoments: [
        { id: 'first-dance', title: 'Primer baile', notes: 'Orquesta + mapping holográfico', responsibleRole: 'planner' },
      ],
      specialInterests: [
        {
          id: randomUUID(),
          idea: 'Banquete clásico con orquesta en vivo',
          tipo: 'banquete',
          nivelEntusiasmo: 'mustHave',
          contexto: 'Eje principal del evento',
          createdBy: 'couple',
          createdAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          idea: 'Show de mapping holográfico futurista',
          tipo: 'experiencia',
          nivelEntusiasmo: 'mustHave',
          contexto: 'Apertura del primer baile',
          nivelContraste: 'full_contraste',
          relacionaConStyle: 'first_dance',
          zonaAplicacion: 'salon-principal',
          requiresReview: false,
          createdBy: 'planner',
          createdAt: new Date().toISOString(),
        },
      ],
      noGoItems: [
        {
          id: randomUUID(),
          descripcion: 'Disfraces para invitados',
          motivo: 'no refleja estilo',
          registradoPor: 'couple',
          createdAt: new Date().toISOString(),
        },
      ],
      communicationPreferences: { channel: 'email', language: 'es' },
      confidenceScore: 0.88,
    },
    insights: {
      summary: 'Predominio clásico elegante con espectáculo futurista puntual durante el primer baile.',
      tags: ['clasico', 'futurista', 'mapping'],
      nextBestActions: ['recommendation-mapping-provider', 'task-rehearsal-schedule'],
      profileGaps: [],
      styleWeights: { coreStyleWeight: 0.72, contrasteWeight: 0.28, limit: 0.3 },
      trends: [
        {
          id: randomUUID(),
          insight: 'Los shows tecnológicos incrementan la compartibilidad en redes en 25%.',
          source: 'analytics',
        },
      ],
      telemetry: { recommendationsAppliedRatio: 0.78, feedbackScore: 4.9 },
    },
    recommendations: [
      {
        id: 'rec-mapping-provider',
        title: 'Contratar proveedor de mapping holográfico',
        destination: 'tasks',
        status: 'applied',
        fitScore: 0.87,
        type: 'contrast',
        context: { zonaAplicacion: 'salon-principal', nivelContraste: 'full_contraste' },
      },
      {
        id: 'rec-orchestra-setlist',
        title: 'Diseñar setlist clásico con transiciones modernas',
        destination: 'tasks',
        status: 'suggested',
        fitScore: 0.82,
        type: 'core',
      },
    ],
    tasks: [
      {
        title: 'Planificar ensayo conjunto orquesta + mapping',
        status: 'suggested',
        category: 'produccion',
        dueDate: '2026-09-15',
        assignedTo: 'production_lead',
        contrastContext: { zonaAplicacion: 'salon-principal', nivelContraste: 'full_contraste' },
      },
    ],
    budgetAdjustments: [
      {
        category: 'tecnologia',
        amount: 18000,
        currency: 'EUR',
        reason: 'Alquiler servidores y producción mapping holográfico',
      },
    ],
  },
];

function createWeddingDocument(sample, prefix) {
  const nowIso = new Date().toISOString();
  return {
    name: prefix ? `${prefix} · ${sample.name}` : sample.name,
    summary: sample.summary,
    weddingDate: sample.weddingDate,
    ownerIds: [],
    plannerIds: [],
    subscription: 'demo',
    weddingProfile: sample.profile,
    weddingInsights: sample.insights,
    weddingInfo: {
      createdVia: 'seedPersonalizationProfiles',
      seedVersion: '2025-10-14',
      updatedAtIso: nowIso,
    },
    createdAt: FieldValue(),
    updatedAt: FieldValue(),
  };
}

async function seedSample(db, sample, options) {
  const { prefix = 'demo-personalizacion', force = false } = options;
  const docId = `${prefix}-${sample.slug}`;
  const weddingRef = db.collection('weddings').doc(docId);
  const exists = (await weddingRef.get()).exists;

  if (exists && !force) {
    console.log(`ℹ️  Ya existe ${docId}. Usa --force para sobrescribir.`);
    return;
  }

  if (exists && force) {
    await clearSubcollection(weddingRef.collection('recommendations'));
    await clearSubcollection(weddingRef.collection('tasks'));
    await clearSubcollection(weddingRef.collection('budgetAdjustments'));
  }

  const payload = createWeddingDocument(sample, prefix);
  await weddingRef.set(payload, { merge: true });

  const recCollection = weddingRef.collection('recommendations');
  for (const rec of sample.recommendations) {
    await recCollection.doc(rec.id).set({
      ...rec,
      createdAt: FieldValue(),
      updatedAt: FieldValue(),
    });
  }

  const taskCollection = weddingRef.collection('tasks');
  for (const task of sample.tasks) {
    await taskCollection.doc(randomUUID()).set({
      ...task,
      createdAt: FieldValue(),
      updatedAt: FieldValue(),
    });
  }

  const budgetCollection = weddingRef.collection('budgetAdjustments');
  for (const adj of sample.budgetAdjustments) {
    await budgetCollection.doc(randomUUID()).set({
      ...adj,
      createdAt: FieldValue(),
      updatedAt: FieldValue(),
    });
  }

  console.log(`✅  Seed listo para ${sample.slug} -> ${docId}`);
}

async function main() {
  const args = parseArgs();
  if (args.dryRun) {
    console.log('ℹ️  Dry-run, se listarían los siguientes seeds:');
    BASE_SAMPLES.forEach((sample) => {
      console.log(` • ${sample.slug}: ${sample.profile.stylePrimary} + contrastes (${sample.profile.specialInterests.length})`);
    });
    process.exit(0);
  }

  await ensureAdmin(args.keyPath);
  const db = admin.firestore();
  const options = {
    prefix: args.prefix ?? 'demo-personalizacion',
    force: Boolean(args.force),
  };

  for (const sample of BASE_SAMPLES) {
    await seedSample(db, sample, options);
  }

  console.log('\n🎉  Semillas de personalización cargadas.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Falló el seed de personalización continua', err);
  process.exit(1);
});
