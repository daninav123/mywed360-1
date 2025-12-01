const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

// Cargar variables locales para que Cypress use siempre el backend local en dev/test
// Priorizar .env.test si existe
[
  path.resolve(__dirname, ".env.test"),
  path.resolve(__dirname, ".env.local"),
  path.resolve(__dirname, ".env"),
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

// Inicializar Firebase Admin para tareas de Cypress
let firebaseInitialized = false;

function initializeFirebase() {
  if (!firebaseInitialized && !admin.apps.length) {
    try {
      const serviceAccountPath = path.resolve(__dirname, "backend/serviceAccountKey.json");
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log("✅ Firebase Admin inicializado para Cypress");
      } else {
        console.warn("⚠️ serviceAccountKey.json no encontrado, tareas de Firebase no disponibles");
      }
    } catch (error) {
      console.error("❌ Error inicializando Firebase Admin:", error.message);
    }
  }
  return firebaseInitialized;
}

module.exports = defineConfig({
  e2e: {
    // URL base por defecto del frontend (siempre 5173 con Vite)
    // Puede sobreescribirse puntualmente con CYPRESS_BASE_URL si fuera necesario
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      BACKEND_BASE_URL:
        process.env.BACKEND_BASE_URL ||
        process.env.VITE_BACKEND_BASE_URL ||
        "http://localhost:4004",
      STUB_RSVP: false,
    },
    setupNodeEvents(on, config) {
      // Tareas personalizadas de Firebase
      on("task", {
        /**
         * Query de Firestore
         */
        "firebase:query": async ({ collection, where = [], orderBy = [], limit = 10 }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return [];
          }

          try {
            const db = admin.firestore();
            let query = db.collection(collection);

            // Aplicar filtros where
            where.forEach(([field, op, value]) => {
              query = query.where(field, op, value);
            });

            // Aplicar orderBy
            orderBy.forEach(([field, direction = 'asc']) => {
              query = query.orderBy(field, direction);
            });

            // Aplicar limit
            if (limit) {
              query = query.limit(limit);
            }

            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Convertir Timestamps a objetos serializables
              timestamp: doc.data().timestamp?.toDate ? {
                toDate: () => doc.data().timestamp.toDate()
              } : doc.data().timestamp
            }));
          } catch (error) {
            console.error("Error en firebase:query:", error);
            throw error;
          }
        },

        /**
         * Eliminar documentos por condición
         */
        "firebase:deleteWhere": async ({ collection, where = [] }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return 0;
          }

          try {
            const db = admin.firestore();
            let query = db.collection(collection);

            where.forEach(([field, op, value]) => {
              query = query.where(field, op, value);
            });

            const snapshot = await query.get();
            const batch = db.batch();

            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            
            console.log(`🗑️ Eliminados ${snapshot.size} documentos de ${collection}`);
            return snapshot.size;
          } catch (error) {
            console.error("Error en firebase:deleteWhere:", error);
            throw error;
          }
        },

        /**
         * Crear documento
         */
        "firebase:create": async ({ collection, data }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();
            const docRef = await db.collection(collection).add(data);
            return docRef.id;
          } catch (error) {
            console.error("Error en firebase:create:", error);
            throw error;
          }
        },

        /**
         * Obtener documento por ID
         */
        "firebase:get": async ({ collection, id }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();
            const doc = await db.collection(collection).doc(id).get();
            
            if (!doc.exists) {
              return null;
            }

            return {
              id: doc.id,
              ...doc.data()
            };
          } catch (error) {
            console.error("Error en firebase:get:", error);
            throw error;
          }
        }
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
