// Script simple para testear login de ReSona
import fetch from 'node-fetch';

// ⚠️ PROTECCIÓN: Este script NO debe ejecutarse en producción
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Este script de testing NO debe ejecutarse en producción');
  console.error('   Está diseñado solo para desarrollo local');
  process.exit(1);
}

const BACKEND_URL = 'http://localhost:4004';

async function testLogin(email, password) {
  console.log('\n🔐 TESTEANDO LOGIN');
  console.log('='.repeat(50));
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('');

  try {
    const response = await fetch(`${BACKEND_URL}/api/supplier-dashboard/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('');

    if (response.ok && data.success) {
      console.log('✅ LOGIN EXITOSO!');
      console.log('');
      console.log('Proveedor:', data.supplier.name);
      console.log('Email:', data.supplier.email);
      console.log('ID:', data.supplier.id);
      console.log('Status:', data.supplier.status);
      console.log('');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('');
      console.log('🎉 Las credenciales son correctas!');
      return true;
    } else {
      console.log('❌ LOGIN FALLIDO');
      console.log('');
      console.log('Error:', data.error);
      console.log('Message:', data.message || 'N/A');
      console.log('');
      console.log('Response completa:');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR DE CONEXIÓN');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('Verifica que el backend esté corriendo:');
    console.log('lsof -i :4004 | grep LISTEN');
    return false;
  }
}

async function main() {
  console.log('\n🧪 TEST DE LOGIN - Proveedor ReSona\n');

  // Test 1: Credenciales correctas
  console.log('\n📋 Test 1: Credenciales correctas');
  const test1 = await testLogin('resona@icloud.com', 'test123');

  // Test 2: Email incorrecto
  console.log('\n📋 Test 2: Email incorrecto (para comparar)');
  const test2 = await testLogin('resona@test.com', 'test123');

  // Test 3: Password incorrecta
  console.log('\n📋 Test 3: Password incorrecta (para comparar)');
  const test3 = await testLogin('resona@icloud.com', 'Test123');

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TESTS\n');
  console.log(`Test 1 (resona@icloud.com / test123): ${test1 ? '✅' : '❌'}`);
  console.log(`Test 2 (resona@test.com / test123): ${test2 ? '✅' : '❌'}`);
  console.log(`Test 3 (resona@icloud.com / Test123): ${test3 ? '✅' : '❌'}`);
  console.log('');

  if (test1) {
    console.log('✅ CONCLUSIÓN: Las credenciales correctas son:');
    console.log('');
    console.log('   Email: resona@icloud.com');
    console.log('   Password: test123');
    console.log('');
    console.log('🎯 Usa EXACTAMENTE estas credenciales en:');
    console.log('   http://localhost:5175/login');
    console.log('');
    console.log('💡 TIP: Cópialas y pégalas, NO las escribas a mano');
  } else {
    console.log('❌ ERROR: Las credenciales correctas no funcionan');
    console.log('');
    console.log('Ejecuta para resetear:');
    console.log('   node backend/reset-resona-password.js');
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

main();
