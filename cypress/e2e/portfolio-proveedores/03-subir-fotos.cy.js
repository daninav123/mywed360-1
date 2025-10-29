/**
 * TEST E2E: Subir Fotos al Portfolio
 *
 * Verifica que el proveedor pueda subir, editar y eliminar
 * fotos de su portfolio
 */

describe('Portfolio Proveedores - Gestión de Fotos', () => {
  const supplierId = 'supplier-test-001';

  const mockPhotos = [
    {
      id: 'photo-001',
      title: 'Ramo de novia',
      description: 'Ramo clásico con rosas blancas',
      category: 'bodas',
      original: 'https://via.placeholder.com/800x600',
      uploadedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      isCover: false,
      featured: false,
    },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock auth
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    // Interceptar GET portfolio
    cy.intercept('GET', `/api/supplier-dashboard/portfolio`, {
      statusCode: 200,
      body: {
        success: true,
        photos: mockPhotos,
        stats: {
          total: mockPhotos.length,
          cover: mockPhotos.filter((p) => p.isCover).length,
          featured: mockPhotos.filter((p) => p.featured).length,
        },
      },
    }).as('getPortfolio');
  });

  it('Debe cargar la página del portfolio correctamente', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Verificar título
    cy.contains('Mi Portfolio', { timeout: 10000 }).should('be.visible');

    // Verificar botón añadir foto
    cy.contains('button', /Añadir Foto|Subir Foto/i).should('be.visible');
  });

  it('Debe abrir modal al hacer clic en "Añadir Foto"', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Hacer clic en añadir foto
    cy.contains('button', /Añadir Foto|Subir Foto/i).click();

    // Verificar que abre el modal
    cy.get('[data-testid="upload-modal"]', { timeout: 5000 })
      .should('be.visible')
      .or(cy.contains('Subir Foto').should('be.visible'));
  });

  it('Debe validar tipo de archivo (solo imágenes)', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    cy.contains('button', /Añadir Foto/i).click();

    // Intentar subir archivo no válido
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    cy.get('input[type="file"]').then((input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(invalidFile);
      input[0].files = dataTransfer.files;
      input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verificar mensaje de error
    cy.contains(/tipo.*inválido|solo.*jpg|png|webp/i, { timeout: 5000 }).should('be.visible');
  });

  it('Debe validar tamaño máximo de archivo (5MB)', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    cy.contains('button', /Añadir Foto/i).click();

    // Crear archivo grande (simulado)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    cy.get('input[type="file"]').then((input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);
      input[0].files = dataTransfer.files;
      input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verificar mensaje de error
    cy.contains(/demasiado grande|máximo 5mb/i, { timeout: 5000 }).should('be.visible');
  });

  it('Debe permitir subir una imagen válida', () => {
    // Interceptar POST
    cy.intercept('POST', `/api/supplier-dashboard/portfolio`, {
      statusCode: 201,
      body: {
        success: true,
        photoId: 'photo-new-001',
        photo: {
          id: 'photo-new-001',
          title: 'Nueva foto',
          category: 'bodas',
          original: 'https://via.placeholder.com/800x600',
        },
      },
    }).as('uploadPhoto');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    cy.contains('button', /Añadir Foto/i).click();

    // Subir imagen válida
    cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      cy.get('input[type="file"]').then((input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Rellenar formulario
    cy.get('input[name="title"]').type('Nueva foto de prueba');
    cy.get('textarea[name="description"]').type('Descripción de la foto');
    cy.get('select[name="category"]').select('bodas');

    // Enviar formulario
    cy.contains('button', /Subir|Guardar/i).click();

    // Verificar que se sube
    cy.wait('@uploadPhoto', { timeout: 10000 });

    // Verificar mensaje de éxito
    cy.contains(/foto.*subida|éxito/i).should('be.visible');
  });

  it('Debe mostrar preview de la imagen antes de subir', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    cy.contains('button', /Añadir Foto/i).click();

    // Subir imagen
    cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      cy.get('input[type="file"]').then((input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Verificar que muestra preview
    cy.get('img[alt*="Preview"]', { timeout: 5000 }).should('be.visible');
  });

  it('Debe permitir editar una foto existente', () => {
    cy.intercept('PUT', `/api/supplier-dashboard/portfolio/photo-001`, {
      statusCode: 200,
      body: { success: true },
    }).as('updatePhoto');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Hacer clic en editar de la primera foto
    cy.get('[data-testid="photo-card"]')
      .first()
      .within(() => {
        cy.get('button[aria-label*="Editar"]').click();
      });

    // Editar título
    cy.get('input[name="title"]').clear().type('Título editado');

    // Guardar cambios
    cy.contains('button', /Guardar|Actualizar/i).click();

    cy.wait('@updatePhoto');

    // Verificar mensaje de éxito
    cy.contains(/actualizada|editada/i).should('be.visible');
  });

  it('Debe permitir eliminar una foto', () => {
    cy.intercept('DELETE', `/api/supplier-dashboard/portfolio/photo-001`, {
      statusCode: 200,
      body: { success: true },
    }).as('deletePhoto');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Hacer clic en eliminar
    cy.get('[data-testid="photo-card"]')
      .first()
      .within(() => {
        cy.get('button[aria-label*="Eliminar"]').click();
      });

    // Confirmar eliminación
    cy.contains('button', /Eliminar|Confirmar/i).click();

    cy.wait('@deletePhoto');

    // Verificar mensaje de éxito
    cy.contains(/eliminada/i).should('be.visible');
  });

  it('Debe permitir establecer foto de portada', () => {
    cy.intercept('PUT', `/api/supplier-dashboard/portfolio/photo-001`, {
      statusCode: 200,
      body: { success: true },
    }).as('setCover');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Hacer clic en "Establecer como portada"
    cy.get('[data-testid="photo-card"]')
      .first()
      .within(() => {
        cy.contains('button', /Portada/i).click();
      });

    cy.wait('@setCover');

    // Verificar mensaje de éxito
    cy.contains(/portada/i).should('be.visible');
  });

  it('Debe permitir marcar foto como destacada', () => {
    cy.intercept('PUT', `/api/supplier-dashboard/portfolio/photo-001`, {
      statusCode: 200,
      body: { success: true },
    }).as('setFeatured');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Editar foto
    cy.get('[data-testid="photo-card"]')
      .first()
      .within(() => {
        cy.get('button[aria-label*="Editar"]').click();
      });

    // Marcar como destacada
    cy.get('input[type="checkbox"][name="featured"]').check();

    // Guardar
    cy.contains('button', /Guardar/i).click();

    cy.wait('@setFeatured');
  });

  it('Debe mostrar estadísticas del portfolio', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Verificar que muestra stats
    cy.contains(/\d+ fotos?/i).should('be.visible');
  });

  it('Debe permitir filtrar por categoría', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Verificar botones de filtro
    cy.contains('button', 'Todas').should('be.visible');
    cy.contains('button', 'Bodas').should('be.visible');

    // Hacer clic en filtro
    cy.contains('button', 'Bodas').click();

    // Verificar que está activo
    cy.contains('button', 'Bodas').should('have.class', /active|selected/);
  });

  it('Debe cambiar entre vista grid y lista', () => {
    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Verificar botones de vista
    cy.get('button[aria-label*="vista grid"]', { timeout: 5000 })
      .should('exist')
      .or(cy.get('button[title*="Grid"]').should('exist'));
  });
});
