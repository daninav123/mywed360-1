const fs = require('fs');

const agg = JSON.parse(fs.readFileSync('roadmap_aggregated.json', 'utf8'));

const parcial = agg.modules.filter(m => m.conclusion === 'parcial');
const pendiente = agg.modules.filter(m => m.conclusion === 'pendiente');
const implementado = agg.modules.filter(m => m.conclusion === 'implementado');

console.log('=== ESTADO DE MÓDULOS EN ROADMAP_AGGREGATED ===\n');
console.log(`✅ Implementados: ${implementado.length}`);
console.log(`⚠️  Parciales: ${parcial.length}`);
console.log(`❌ Pendientes: ${pendiente.length}`);
console.log(`📊 Total módulos: ${agg.modules.length}\n`);

console.log('\n=== MÓDULOS CON IMPLEMENTACIÓN PARCIAL ===\n');
parcial.forEach((m, i) => {
  console.log(`${i+1}. ${m.title}`);
  console.log(`   Estado: PARCIAL`);
  if (m.pendingLines && m.pendingLines.length > 0) {
    console.log(`   Pendiente: ${m.pendingLines[0].substring(0, 120)}...`);
  }
  if (m.roadmapSection) {
    const roadmapPreview = m.roadmapSection.substring(0, 150).replace(/\n/g, ' ');
    console.log(`   Roadmap: ${roadmapPreview}...`);
  }
  console.log('');
});

console.log('\n=== MÓDULOS PENDIENTES (Top 5) ===\n');
pendiente.slice(0, 5).forEach((m, i) => {
  console.log(`${i+1}. ${m.title}`);
  console.log(`   Estado: PENDIENTE`);
  if (m.pendingLines && m.pendingLines.length > 0) {
    console.log(`   Pendiente: ${m.pendingLines[0].substring(0, 120)}...`);
  }
  console.log('');
});
