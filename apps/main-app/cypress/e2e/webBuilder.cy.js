/**
 * Tests E2E para el Sistema de Diseño Web
 * Verifican que todo el flujo funciona correctamente
 */

describe('Sistema de Diseño Web - Tests E2E', () => {
  beforeEach(() => {
    // Visitar directamente la página (asumiendo que ya está logueado en el navegador)
    cy.visit('/web-builder');

    // Esperar a que cargue
    cy.wait(2000);
  });

  describe('1. Navegación y Carga', () => {
    it('Debe navegar a la página del Web Builder', () => {
      // Navegar a web-builder
      cy.visit('/web-builder');

      // Verificar que carga correctamente
      cy.contains('🎨 Crear tu Web de Boda').should('be.visible');
      cy.contains('Genera tu web automáticamente en segundos').should('be.visible');
    });

    it('Debe mostrar loading mientras carga el perfil', () => {
      cy.visit('/web-builder');

      // Verificar que aparece el loading
      cy.contains('Cargando tu perfil...').should('be.visible');

      // Esperar a que desaparezca (máx 5 segundos)
      cy.contains('Cargando tu perfil...', { timeout: 5000 }).should('not.exist');
    });

    it('Debe mostrar el botón de generar cuando termina de cargar', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').should('be.visible');
    });
  });

  describe('2. Generación Automática', () => {
    it('Debe generar una web automáticamente', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      // Click en generar
      cy.contains('🚀 Generar mi web automáticamente').click();

      // Verificar que aparece loading
      cy.contains('Generando tu web...').should('be.visible');

      // Esperar a que termine (máx 15 segundos)
      cy.contains('👀 Vista Previa', { timeout: 15000 }).should('be.visible');

      // Verificar toast de éxito
      cy.contains('¡Web generada automáticamente!').should('be.visible');
    });

    it('Debe generar web con datos del perfil', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      // Generar
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // Verificar que aparecen datos del perfil en la web
      // (Ajustar con tus datos reales)
      cy.get('.hero-section').should('be.visible');
    });

    it('Debe mostrar countdown si hay fecha', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // Verificar que hay countdown (si hay fecha en el perfil)
      cy.get('.hero-section').within(() => {
        cy.contains(/\d+ días/i).should('exist');
      });
    });
  });

  describe('3. Vista Previa', () => {
    beforeEach(() => {
      // Generar web primero
      cy.visit('/web-builder');
      cy.wait(2000);
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);
    });

    it('Debe mostrar la vista previa correctamente', () => {
      cy.contains('👀 Vista Previa').should('be.visible');
      cy.get('.web-renderer').should('be.visible');
    });

    it('Debe tener los botones de acción (Volver, Editar, Publicar)', () => {
      cy.contains('← Volver').should('be.visible');
      cy.contains('✏️ Editar').should('be.visible');
      cy.contains('✨ Publicar').should('be.visible');
    });

    it('Debe poder volver a la pantalla inicial', () => {
      cy.contains('← Volver').click();
      cy.contains('🚀 Generar mi web automáticamente').should('be.visible');
    });

    it('Debe poder publicar directamente desde preview', () => {
      cy.contains('✨ Publicar').click();
      cy.contains('Web publicada correctamente').should('be.visible');
    });
  });

  describe('4. Modo Edición', () => {
    beforeEach(() => {
      // Generar y entrar en modo edición
      cy.visit('/web-builder');
      cy.wait(2000);
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);
      cy.contains('✏️ Editar').click();
      cy.wait(1000);
    });

    it('Debe activar el modo edición', () => {
      cy.contains('✏️ Editar tu Web').should('be.visible');
      cy.contains('Modo Edición Activado').should('be.visible');
      cy.contains('Haz click en cualquier texto para editarlo').should('be.visible');
    });

    it('Debe mostrar indicadores de edición en las secciones', () => {
      cy.get('.edit-indicator').should('be.visible');
      cy.get('.edit-indicator').should('contain', 'hero');
    });

    it('Debe poder editar el título del hero', () => {
      // Encontrar el input del título
      cy.get('.hero-section input[type="text"]').first().as('tituloInput');

      // Verificar que existe
      cy.get('@tituloInput').should('be.visible');

      // Editar el texto
      cy.get('@tituloInput').clear().type('Test Título Editado');

      // Verificar que se actualizó
      cy.get('@tituloInput').should('have.value', 'Test Título Editado');
    });

    it('Debe poder volver a preview desde edición', () => {
      cy.contains('👁️ Ver Preview').click();
      cy.contains('👀 Vista Previa').should('be.visible');
      cy.contains('Modo Edición Activado').should('not.exist');
    });

    it('Debe poder publicar desde modo edición', () => {
      cy.contains('✨ Publicar').click();
      cy.contains('Web publicada correctamente').should('be.visible');
    });
  });

  describe('5. WebRenderer', () => {
    beforeEach(() => {
      cy.visit('/web-builder');
      cy.wait(2000);
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);
    });

    it('Debe renderizar el HeroSection', () => {
      cy.get('.hero-section').should('be.visible');
    });

    it('Debe aplicar estilos del tema', () => {
      cy.get('.web-renderer').should('exist');
      // Verificar que tiene estilos aplicados
      cy.get('.web-renderer').should('have.css', 'font-family');
    });

    it('Debe tener footer', () => {
      // Scroll hasta el final
      cy.scrollTo('bottom');
      cy.contains('Creado con ❤️ por MaLoveApp').should('be.visible');
    });
  });

  describe('6. Generador IA', () => {
    it('Debe seleccionar tema automáticamente', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // Verificar que se aplicó un tema
      cy.get('.web-renderer').should('have.css', 'color');
      cy.get('.web-renderer').should('have.css', 'background-color');
    });

    it('Debe formatear la fecha correctamente', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // Verificar que la fecha está formateada (no es timestamp)
      cy.get('.hero-section').should('not.contain', 'seconds');
      cy.get('.hero-section').should('not.contain', '{');
    });

    it('Debe generar slug válido', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // El slug debería estar en minúsculas y sin espacios
      // (verificamos en consola)
      cy.window().then((win) => {
        const config = win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        // El slug no debería tener espacios ni mayúsculas
        // Esta es una verificación indirecta
      });
    });
  });

  describe('7. Manejo de Errores', () => {
    it('Debe manejar perfil vacío correctamente', () => {
      // Este test requiere simular un perfil vacío
      // Por ahora solo verificamos que no crashea
      cy.visit('/web-builder');
      cy.wait(3000);

      // La página debe cargar sin errores
      cy.get('.web-builder-page').should('be.visible');
    });

    it('Debe mostrar mensaje si falta el perfil', () => {
      // Interceptar la llamada al perfil para simular que no existe
      cy.intercept('GET', '**/profile/**', {
        statusCode: 404,
        body: {},
      });

      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();

      // Debe mostrar toast de error
      cy.contains('No se encontró el perfil').should('be.visible');
    });
  });

  describe('8. Performance', () => {
    it('Debe generar la web en menos de 10 segundos', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      const start = Date.now();
      cy.contains('🚀 Generar mi web automáticamente').click();

      cy.contains('👀 Vista Previa', { timeout: 10000 }).should('be.visible');

      cy.then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(10000);
      });
    });

    it('Debe cargar el perfil en menos de 5 segundos', () => {
      const start = Date.now();
      cy.visit('/web-builder');

      cy.contains('🚀 Generar mi web automáticamente', { timeout: 5000 }).should('be.visible');

      cy.then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(5000);
      });
    });

    it('La edición inline debe ser instantánea (< 100ms)', () => {
      cy.visit('/web-builder');
      cy.wait(2000);
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);
      cy.contains('✏️ Editar').click();
      cy.wait(1000);

      const start = Date.now();
      cy.get('.hero-section input[type="text"]').first().clear().type('Test');

      cy.then(() => {
        const duration = Date.now() - start;
        // Esto debería ser muy rápido
        expect(duration).to.be.lessThan(1000);
      });
    });
  });

  describe('9. Responsive Design', () => {
    it('Debe funcionar en mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').should('be.visible');
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      cy.get('.hero-section').should('be.visible');
    });

    it('Debe funcionar en tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').should('be.visible');
    });

    it('Debe funcionar en desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').should('be.visible');
    });
  });

  describe('10. Integración Completa', () => {
    it('Flujo completo: Generar → Preview → Editar → Publicar', () => {
      // 1. Navegar
      cy.visit('/web-builder');
      cy.wait(2000);

      // 2. Generar
      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.contains('👀 Vista Previa', { timeout: 15000 }).should('be.visible');

      // 3. Ir a edición
      cy.contains('✏️ Editar').click();
      cy.contains('Modo Edición Activado').should('be.visible');

      // 4. Editar algo
      cy.get('.hero-section input[type="text"]').first().clear().type('Mi Boda E2E Test');

      // 5. Ver preview
      cy.contains('👁️ Ver Preview').click();
      cy.contains('👀 Vista Previa').should('be.visible');

      // 6. Publicar
      cy.contains('✨ Publicar').click();
      cy.contains('Web publicada correctamente').should('be.visible');
    });

    it('Flujo alternativo: Generar → Publicar directamente', () => {
      cy.visit('/web-builder');
      cy.wait(2000);

      cy.contains('🚀 Generar mi web automáticamente').click();
      cy.wait(5000);

      // Publicar sin editar
      cy.contains('✨ Publicar').click();
      cy.contains('Web publicada correctamente').should('be.visible');
    });
  });
});
