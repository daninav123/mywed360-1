/**
 * SCRIPT PARA SOLUCIONAR DETECCIÓN DE BODAS
 * Ejecutar en la consola del navegador (F12)
 */

console.log('🔍 DIAGNÓSTICO DE BODAS');
console.log('========================');

// 1. Verificar usuario
const uid = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';
console.log('👤 Usuario UID:', uid);

// 2. Verificar localStorage
console.log('\n📦 Verificando localStorage...');
const localKey = `mywed_weddings_${uid}`;
const localData = localStorage.getItem(localKey);
console.log(`Clave: ${localKey}`);
console.log('Datos:', localData ? JSON.parse(localData) : 'VACÍO');

// 3. Verificar boda activa
const activeKey = `activeWeddingId_${uid}`;
const activeWedding = localStorage.getItem(activeKey);
console.log('\n🎯 Boda activa:', activeWedding || 'NINGUNA');

// 4. SOLUCIÓN 1: Crear boda de prueba en localStorage
console.log('\n✅ SOLUCIÓN 1: Crear boda de prueba');
console.log('=================================');

const createTestWedding = () => {
  const testWedding = {
    id: `wedding-${Date.now()}`,
    name: 'Mi Boda de Prueba',
    date: new Date(2025, 5, 15).toISOString(), // 15 Junio 2025
    location: 'Madrid, España',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: uid,
    status: 'planning',
  };

  // Guardar en localStorage
  const weddingsData = {
    weddings: [testWedding],
    activeWeddingId: testWedding.id,
    lastUpdated: Date.now(),
  };

  localStorage.setItem(localKey, JSON.stringify(weddingsData));
  localStorage.setItem(activeKey, testWedding.id);

  console.log('✅ Boda de prueba creada:', testWedding);
  console.log('🔄 REFRESCA LA PÁGINA para ver los cambios');

  return testWedding;
};

// 5. SOLUCIÓN 2: Limpiar y resetear
const resetWeddings = () => {
  console.log('\n🧹 SOLUCIÓN 2: Limpiar todo');
  console.log('===========================');

  localStorage.removeItem(localKey);
  localStorage.removeItem(activeKey);

  console.log('✅ Limpieza completada');
  console.log('🔄 REFRESCA LA PÁGINA');
};

// 6. Comandos disponibles
console.log('\n📝 COMANDOS DISPONIBLES:');
console.log('=======================');
console.log('createTestWedding() - Crear boda de prueba');
console.log('resetWeddings()     - Limpiar todas las bodas');

// Exportar funciones al window
window.createTestWedding = createTestWedding;
window.resetWeddings = resetWeddings;

console.log('\n💡 Ejecuta createTestWedding() para crear una boda de prueba');
