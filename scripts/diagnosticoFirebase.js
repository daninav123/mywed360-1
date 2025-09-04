/**
 * Script de diagnóstico para verificar el estado de Firebase Auth y permisos
 */

const { initializeApp } = require('firebase/app');
const { getAuth, onAuthStateChanged } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Configuración de Firebase (usando variables de entorno)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔍 Iniciando diagnóstico de Firebase...');
console.log('📋 Configuración Firebase:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Verificar estado de autenticación
console.log('\n🔐 Verificando estado de autenticación...');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ Usuario autenticado:', user.uid);
    console.log('📧 Email:', user.email);
    
    // Intentar acceder a la subcolección de bodas del usuario
    console.log('\n📋 Verificando acceso a bodas del usuario...');
    try {
      const userWeddingsCol = collection(db, 'users', user.uid, 'weddings');
      const snapshot = await getDocs(userWeddingsCol);
      console.log('✅ Acceso exitoso a users/{uid}/weddings');
      console.log('📊 Bodas encontradas:', snapshot.docs.length);
      
      snapshot.docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}, Datos:`, doc.data());
      });
      
    } catch (error) {
      console.error('❌ Error accediendo a bodas del usuario:', error.code, error.message);
    }
    
  } else {
    console.log('❌ No hay usuario autenticado');
    console.log('💡 Sugerencia: Asegúrate de que el usuario esté logueado en la aplicación');
  }
  
  // Salir del proceso después del diagnóstico
  setTimeout(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  }, 2000);
});

// Timeout de seguridad
setTimeout(() => {
  console.log('\n⏰ Timeout: No se detectó cambio en el estado de autenticación');
  process.exit(1);
}, 10000);
