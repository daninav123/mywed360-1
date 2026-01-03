/**
 * SCRIPT DE LIMPIEZA - Ejecutar en consola del navegador
 * Limpia localStorage y fuerza recarga del Seating Plan
 */

console.log('🧹 LIMPIANDO LOCALSTORAGE DE SEATING...');

// 1. Limpiar flag de diseño moderno
const oldValue = localStorage.getItem('seating_modern_design');
console.log('📋 Valor anterior:', oldValue);

localStorage.removeItem('seating_modern_design');
console.log('✅ Flag de diseño moderno eliminado');

// 2. Verificar limpieza
const newValue = localStorage.getItem('seating_modern_design');
console.log('📋 Valor nuevo:', newValue);

if (newValue === null) {
  console.log('✅ LIMPIEZA EXITOSA');
  console.log('🔄 Recargando página en 2 segundos...');

  setTimeout(() => {
    window.location.reload(true); // Hard reload
  }, 2000);
} else {
  console.error('❌ ERROR: No se pudo limpiar localStorage');
}
