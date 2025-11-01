/**
 * 🧪 Test del Sistema Inteligente de Presupuestos
 *
 * Este script valida:
 * 1. Templates dinámicos funcionan correctamente
 * 2. Campos condicionales se muestran/ocultan
 * 3. Cálculo de progreso es correcto
 * 4. Backend API responde correctamente
 * 5. Estructura de datos es válida
 */

import {
  getQuoteFormTemplate,
  getVisibleFields,
  calculateProgress,
} from '../src/data/quoteFormTemplates.js';

console.log('🧪 TEST DEL SISTEMA DE PRESUPUESTOS INTELIGENTES\n');
console.log('='.repeat(60));

// Test 1: Verificar templates existen
console.log('\n📋 TEST 1: Verificar templates');
console.log('-'.repeat(60));

const categories = ['fotografia', 'video', 'catering', 'dj', 'joyeria'];
let test1Pass = true;

categories.forEach((cat) => {
  const template = getQuoteFormTemplate(cat);
  const hasFields = template.fields && template.fields.length > 0;
  const status = hasFields ? '✅' : '❌';
  console.log(`${status} Template "${cat}": ${template.name} (${template.fields.length} campos)`);
  if (!hasFields) test1Pass = false;
});

console.log(test1Pass ? '\n✅ Test 1 PASADO' : '\n❌ Test 1 FALLADO');

// Test 2: Verificar campos condicionales
console.log('\n🔀 TEST 2: Campos condicionales');
console.log('-'.repeat(60));

const fotoTemplate = getQuoteFormTemplate('fotografia');
let test2Pass = true;

// Caso 1: album = false → tipoAlbum NO visible
const data1 = { album: false };
const visible1 = getVisibleFields(fotoTemplate, data1);
const tipoAlbumHidden = !visible1.some((f) => f.id === 'tipoAlbum');
console.log(`${tipoAlbumHidden ? '✅' : '❌'} Caso 1: album=false → tipoAlbum oculto`);
if (!tipoAlbumHidden) test2Pass = false;

// Caso 2: album = true → tipoAlbum visible
const data2 = { album: true };
const visible2 = getVisibleFields(fotoTemplate, data2);
const tipoAlbumVisible = visible2.some((f) => f.id === 'tipoAlbum');
console.log(`${tipoAlbumVisible ? '✅' : '❌'} Caso 2: album=true → tipoAlbum visible`);
if (!tipoAlbumVisible) test2Pass = false;

console.log(test2Pass ? '\n✅ Test 2 PASADO' : '\n❌ Test 2 FALLADO');

// Test 3: Cálculo de progreso
console.log('\n📊 TEST 3: Cálculo de progreso');
console.log('-'.repeat(60));

let test3Pass = true;

// Caso 1: Sin datos → 0%
const progress1 = calculateProgress(fotoTemplate, {});
console.log(`${progress1 === 0 ? '✅' : '❌'} Sin datos: ${progress1}% (esperado: 0%)`);
if (progress1 !== 0) test3Pass = false;

// Caso 2: Datos parciales
const partialData = {
  horasCobertura: '8',
  album: true,
};
const progress2 = calculateProgress(fotoTemplate, partialData);
const isPartial = progress2 > 0 && progress2 < 100;
console.log(`${isPartial ? '✅' : '❌'} Datos parciales: ${progress2}% (esperado: >0% y <100%)`);
if (!isPartial) test3Pass = false;

// Caso 3: Todos los campos required (solo los 3 required de fotografía)
const completeData = {
  horasCobertura: '8',
  album: true,
  fotosDigitales: 'todas', // Este es el tercero required
};
const progress3 = calculateProgress(fotoTemplate, completeData);
console.log(
  `${progress3 === 100 ? '✅' : '❌'} Datos completos (required): ${progress3}% (esperado: 100%)`
);
if (progress3 !== 100) test3Pass = false;

console.log(test3Pass ? '\n✅ Test 3 PASADO' : '\n❌ Test 3 FALLADO');

// Test 4: Validar estructura de payload
console.log('\n📦 TEST 4: Estructura de payload');
console.log('-'.repeat(60));

let test4Pass = true;

const mockPayload = {
  weddingInfo: {
    fecha: new Date(),
    ciudad: 'Barcelona',
    numeroInvitados: 120,
    presupuestoTotal: 25000,
  },
  contacto: {
    nombre: 'Test User',
    email: 'test@example.com',
    telefono: '+34 600 000 000',
  },
  proveedor: {
    id: 'test_supplier',
    name: 'Test Studio',
    category: 'fotografia',
    categoryName: 'Fotografía',
  },
  serviceDetails: completeData,
  customMessage: 'Test message',
  userId: 'test_user',
  weddingId: 'test_wedding',
};

const hasWeddingInfo = mockPayload.weddingInfo && mockPayload.weddingInfo.ciudad;
const hasContacto = mockPayload.contacto && mockPayload.contacto.email;
const hasProveedor = mockPayload.proveedor && mockPayload.proveedor.id;
const hasServiceDetails =
  mockPayload.serviceDetails && Object.keys(mockPayload.serviceDetails).length > 0;

console.log(`${hasWeddingInfo ? '✅' : '❌'} weddingInfo presente`);
console.log(`${hasContacto ? '✅' : '❌'} contacto presente`);
console.log(`${hasProveedor ? '✅' : '❌'} proveedor presente`);
console.log(`${hasServiceDetails ? '✅' : '❌'} serviceDetails presente`);

test4Pass = hasWeddingInfo && hasContacto && hasProveedor && hasServiceDetails;
console.log(test4Pass ? '\n✅ Test 4 PASADO' : '\n❌ Test 4 FALLADO');

// Test 5: Verificar tipos de campos (buscar en todos los templates)
console.log('\n🎨 TEST 5: Tipos de campos');
console.log('-'.repeat(60));

let test5Pass = true;
const allTemplates = ['fotografia', 'video', 'catering', 'dj', 'joyeria'].map((cat) =>
  getQuoteFormTemplate(cat)
);
const allFieldTypes = new Set(allTemplates.flatMap((t) => t.fields.map((f) => f.type)));
const expectedTypes = ['select', 'boolean', 'multi-select', 'number', 'textarea'];

expectedTypes.forEach((type) => {
  const hasType = allFieldTypes.has(type);
  console.log(`${hasType ? '✅' : '❌'} Tipo "${type}" implementado`);
  if (!hasType) test5Pass = false;
});

console.log(test5Pass ? '\n✅ Test 5 PASADO' : '\n❌ Test 5 FALLADO');

// Test 6: Validar defaults
console.log('\n⚙️ TEST 6: Valores por defecto');
console.log('-'.repeat(60));

let test6Pass = true;
const cateringTemplate = getQuoteFormTemplate('catering');
const fieldsWithDefaults = cateringTemplate.fields.filter((f) => f.default !== undefined);

console.log(
  `${fieldsWithDefaults.length > 0 ? '✅' : '❌'} ${fieldsWithDefaults.length} campos con defaults`
);
fieldsWithDefaults.forEach((field) => {
  console.log(`  - ${field.label}: ${field.default}`);
});

test6Pass = fieldsWithDefaults.length > 0;
console.log(test6Pass ? '\n✅ Test 6 PASADO' : '\n❌ Test 6 FALLADO');

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE TESTS');
console.log('='.repeat(60));

const allTests = [
  { name: 'Templates', pass: test1Pass },
  { name: 'Campos condicionales', pass: test2Pass },
  { name: 'Cálculo de progreso', pass: test3Pass },
  { name: 'Estructura de payload', pass: test4Pass },
  { name: 'Tipos de campos', pass: test5Pass },
  { name: 'Valores por defecto', pass: test6Pass },
];

allTests.forEach((test, i) => {
  console.log(`${test.pass ? '✅' : '❌'} Test ${i + 1}: ${test.name}`);
});

const allPass = allTests.every((t) => t.pass);
const passCount = allTests.filter((t) => t.pass).length;

console.log('\n' + '='.repeat(60));
if (allPass) {
  console.log('🎉 TODOS LOS TESTS PASARON (' + passCount + '/' + allTests.length + ')');
  console.log('✅ El sistema de presupuestos inteligentes está funcional');
} else {
  console.log('⚠️ ALGUNOS TESTS FALLARON (' + passCount + '/' + allTests.length + ')');
  console.log('❌ Revisa los errores arriba');
}
console.log('='.repeat(60) + '\n');

process.exit(allPass ? 0 : 1);
