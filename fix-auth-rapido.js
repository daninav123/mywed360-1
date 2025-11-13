/**
 * SOLUCIÓN RÁPIDA - AUTENTICACIÓN FIREBASE
 * Ejecutar en la consola del navegador (F12)
 */

console.log('🔑 FIX AUTENTICACIÓN FIREBASE');
console.log('=============================\n');

async function autenticarRapido() {
  try {
    // 1. Obtener Firebase Auth
    console.log('1️⃣ Obteniendo Firebase Auth...');
    const { getFirebaseAuth } = await import('/src/firebaseConfig.jsx');
    const auth = getFirebaseAuth();

    if (!auth) {
      console.error('❌ Firebase Auth no disponible');
      return;
    }

    console.log('✅ Firebase Auth obtenido');

    // 2. Ver si ya hay usuario
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ YA ESTÁS AUTENTICADO:');
      console.log('   - UID:', currentUser.uid);
      console.log('   - Email:', currentUser.email);
      console.log('\n🔄 REFRESCA LA PÁGINA para que cargue las bodas');
      return;
    }

    console.log('⚠️ No hay usuario autenticado');

    // 3. Intentar autenticación con email conocido
    const email = 'danielnavarrocampos@icloud.com';

    console.log('\n2️⃣ OPCIONES DE AUTENTICACIÓN:');
    console.log('==============================');
    console.log('\nOPCIÓN 1: Autenticación con email y contraseña');
    console.log('Ejecuta en consola:');
    console.log(`  loginWithPassword('${email}', 'TU_CONTRASEÑA')`);

    console.log('\nOPCIÓN 2: Crear nueva cuenta');
    console.log('Ejecuta en consola:');
    console.log(`  crearCuenta('${email}', 'TU_NUEVA_CONTRASEÑA')`);

    console.log('\nOPCIÓN 3: Resetear contraseña');
    console.log('Ejecuta en consola:');
    console.log(`  resetPassword('${email}')`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Función para login
window.loginWithPassword = async (email, password) => {
  try {
    console.log('🔐 Autenticando...');
    const { getFirebaseAuth } = await import('/src/firebaseConfig.jsx');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getFirebaseAuth();

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ ¡AUTENTICADO!');
    console.log('   Usuario:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    console.log('\n🔄 RECARGANDO PÁGINA...');

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    console.error('   Código:', error.code);

    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 El usuario no existe. Usa crearCuenta() para registrarte');
    }
    if (error.code === 'auth/wrong-password') {
      console.log('\n💡 Contraseña incorrecta. Usa resetPassword() para recuperarla');
    }
  }
};

// Función para crear cuenta
window.crearCuenta = async (email, password) => {
  try {
    console.log('📝 Creando cuenta...');
    const { getFirebaseAuth } = await import('/src/firebaseConfig.jsx');
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const auth = getFirebaseAuth();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ ¡CUENTA CREADA!');
    console.log('   Usuario:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    console.log('\n🔄 RECARGANDO PÁGINA...');

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error al crear cuenta:', error.message);
    console.error('   Código:', error.code);

    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 El email ya está registrado. Usa loginWithPassword() para entrar');
    }
    if (error.code === 'auth/weak-password') {
      console.log('\n💡 Contraseña muy débil. Usa al menos 6 caracteres');
    }
  }
};

// Función para reset password
window.resetPassword = async (email) => {
  try {
    console.log('📧 Enviando email de recuperación...');
    const { getFirebaseAuth } = await import('/src/firebaseConfig.jsx');
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const auth = getFirebaseAuth();

    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de recuperación enviado a:', email);
    console.log('   Revisa tu bandeja de entrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Ejecutar
autenticarRapido();

console.log('\n📝 FUNCIONES DISPONIBLES:');
console.log('========================');
console.log('loginWithPassword(email, password) - Iniciar sesión');
console.log('crearCuenta(email, password)       - Crear nueva cuenta');
console.log('resetPassword(email)               - Recuperar contraseña');
