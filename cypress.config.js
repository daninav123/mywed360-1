const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // URL base por defecto del frontend (siempre 5173 con Vite)
    // Puede sobreescribirse puntualmente con CYPRESS_BASE_URL si fuera necesario
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || process.env.VITE_BACKEND_BASE_URL || 'https://mywed360-backend.onrender.com',
    },
  },
});
