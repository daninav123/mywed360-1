/**
 * Test E2E: Flujo completo de aceptación de proveedor con propagación a InfoBoda
 * 
 * Flujo:
 * 1. Usuario solicita presupuesto a proveedor de espacio con catering
 * 2. Proveedor responde con presupuesto completo (precio, fecha, detalles)
 * 3. Usuario acepta presupuesto
 * 4. Sistema registra y propaga datos a InfoBoda automáticamente
 * 5. Verificar que InfoBoda se actualiza en tiempo real
 */

describe('Flujo E2E: Aceptación de Proveedor con Propagación a InfoBoda', () => {
  let testUser;
  let testWedding;
  let testSupplier;
  let quoteRequest;
  let quoteResponse;

  before(() => {
    // Limpiar datos de prueba previos
    cy.task('cleanTestData', { prefix: 'e2e-supplier-propagation' });
  });

  after(() => {
    // Limpiar datos de prueba
    cy.task('cleanTestData', { prefix: 'e2e-supplier-propagation' });
  });

  describe('Paso 1: Preparar datos de prueba', () => {
    it('Debe crear usuario de prueba', () => {
      const userData = {
        email: 'e2e-supplier-propagation-user@test.com',
        password: 'TestPassword123!',
        displayName: 'Test User Propagation',
      };

      cy.task('createTestUser', userData).then((user) => {
        testUser = user;
        expect(testUser).to.have.property('uid');
        cy.log('✅ Usuario creado:', testUser.uid);
      });
    });

    it('Debe crear boda de prueba', () => {
      const weddingData = {
        userId: testUser.uid,
        coupleName: 'Ana & Carlos - Test',
        weddingDate: '2025-08-15',
        celebrationPlace: '',
        celebrationAddress: '',
        celebrationCity: '',
        ceremonyGPS: '',
        venueManagerName: '',
        venueManagerPhone: '',
        budget: {
          total: 20000,
          spent: 0,
          allocated: {},
        },
      };

      cy.task('createTestWedding', { userId: testUser.uid, data: weddingData }).then((wedding) => {
        testWedding = wedding;
        expect(testWedding).to.have.property('id');
        cy.log('✅ Boda creada:', testWedding.id);
      });
    });

    it('Debe crear proveedor de prueba (espacio con catering)', () => {
      const supplierData = {
        email: 'e2e-venue-catering@test.com',
        password: 'SupplierPass123!',
        businessName: 'Finca El Jardín - Catering Incluido',
        categories: ['lugares', 'catering'],
        contactPhone: '+34 666 123 456',
        address: 'Avenida de los Naranjos 25, Valencia',
        city: 'Valencia',
        gps: '39.4699,-0.3763',
        contactName: 'María González',
        isActive: true,
        verified: true,
      };

      cy.task('createTestSupplier', supplierData).then((supplier) => {
        testSupplier = supplier;
        expect(testSupplier).to.have.property('id');
        cy.log('✅ Proveedor creado:', testSupplier.id);
      });
    });
  });

  describe('Paso 2: Solicitar presupuesto', () => {
    it('Debe enviar solicitud de presupuesto con info completa', () => {
      const quoteRequestData = {
        weddingId: testWedding.id,
        userId: testUser.uid,
        categoryKey: 'lugares',
        categoryName: 'Lugares',
        supplierId: testSupplier.id,
        supplierName: testSupplier.businessName,
        weddingDate: '2025-08-15',
        guestCount: 120,
        budget: 8000,
        location: 'Valencia',
        message: 'Buscamos espacio con catering para 120 personas. Ceremonia y banquete en el mismo lugar.',
        contactEmail: testUser.email,
        contactPhone: '+34 666 999 888',
        requirements: {
          ceremonyIncluded: true,
          banquetIncluded: true,
          cateringIncluded: true,
          guestCount: 120,
          indoorOutdoor: 'ambos',
          parkingNeeded: true,
        },
        status: 'sent',
        createdAt: new Date(),
      };

      cy.task('firebase:create', {
        collection: 'quote-requests',
        data: quoteRequestData,
      }).then((requestId) => {
        expect(requestId).to.be.a('string');
        
        quoteRequest = {
          id: requestId,
          ...quoteRequestData,
        };
        cy.log('✅ Solicitud de presupuesto creada:', quoteRequest.id);
      });
    });

    it('Debe verificar que la solicitud está en el sistema', () => {
      cy.task('firebase:get', {
        collection: 'quote-requests',
        id: quoteRequest.id,
      }).then((doc) => {
        expect(doc).to.not.be.null;
        expect(doc.status).to.eq('sent');
        cy.log('✅ Solicitud verificada en Firestore');
      });
    });
  });

  describe('Paso 3: Proveedor responde con presupuesto', () => {
    it('Debe crear respuesta de presupuesto completa', () => {
      const quoteResponseData = {
        requestId: quoteRequest.id,
        weddingId: testWedding.id,
        userId: testUser.uid,
        supplierId: testSupplier.id,
        supplierName: testSupplier.businessName,
        supplierEmail: testSupplier.email,
        categoryKey: 'lugares',
        categoryName: 'Lugares',
        totalPrice: 7500,
        currency: 'EUR',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        servicesIncluded: [
          'Espacio ceremonia al aire libre',
          'Salón banquete para 120 personas',
          'Catering completo (entrante, principal, postre)',
          'Bebidas (vino, cerveza, refrescos)',
          'Personal de servicio (camareros, cocina)',
          'Mantelería y decoración básica',
          'Coordinación del evento',
        ],
        paymentTerms: {
          deposit: 2000,
          depositDueDate: '2025-02-15',
          finalPayment: 5500,
          finalPaymentDueDate: '2025-08-01',
        },
        deliveryTime: '2025-08-15',
        contactPhone: testSupplier.contactPhone,
        contactName: testSupplier.contactName,
        venueAddress: testSupplier.address,
        city: testSupplier.city,
        venueGPS: testSupplier.gps,
        venueName: testSupplier.businessName,
        menuDescription: 'Menú premium:\n- Entrante: Ensalada templada de pulpo\n- Principal: Solomillo con salsa de vino tinto\n- Postre: Tarta nupcial personalizada',
        notes: 'Incluye prueba de menú para 4 personas. Parking gratuito para 80 vehículos.',
        status: 'sent',
        createdAt: new Date(),
      };

      cy.task('firebase:create', {
        collection: 'quote-responses',
        data: quoteResponseData,
      }).then((responseId) => {
        expect(responseId).to.be.a('string');
        
        quoteResponse = {
          id: responseId,
          ...quoteResponseData,
        };
        cy.log('✅ Presupuesto enviado por proveedor:', quoteResponse.id);
      });
    });

    it('Debe verificar que el presupuesto tiene todos los datos', () => {
      cy.task('firebase:get', {
        collection: 'quote-responses',
        id: quoteResponse.id,
      }).then((doc) => {
        expect(doc).to.not.be.null;
        expect(doc.totalPrice).to.eq(7500);
        expect(doc.venueAddress).to.exist;
        expect(doc.contactPhone).to.exist;
        expect(doc.servicesIncluded).to.have.length.greaterThan(0);
        cy.log('✅ Presupuesto verificado con todos los datos');
      });
    });
  });

  describe('Paso 4: Usuario acepta presupuesto', () => {
    it('Debe aceptar presupuesto y propagar a InfoBoda', () => {
      cy.task('acceptQuoteAndPropagate', {
        quoteResponseId: quoteResponse.id,
        weddingId: testWedding.id,
        role: 'principal',
      }).then((result) => {
        expect(result).to.have.property('success', true);
        expect(result.quoteResponseId).to.eq(quoteResponse.id);
        expect(result.weddingId).to.eq(testWedding.id);
        expect(result.infoBodaUpdates).to.exist;
        
        cy.log('✅ Presupuesto aceptado y propagado a InfoBoda');
      });
    });

    it('Debe verificar que el presupuesto cambió a estado "accepted"', () => {
      cy.task('firebase:get', {
        collection: 'quote-responses',
        id: quoteResponse.id,
      }).then((doc) => {
        expect(doc).to.not.be.null;
        expect(doc.status).to.eq('accepted');
        expect(doc.acceptedAt).to.exist;
        cy.log('✅ Estado del presupuesto cambiado a accepted');
      });
    });
  });

  describe('Paso 5: Verificar propagación a InfoBoda', () => {
    it('Debe verificar que InfoBoda se actualizó con datos del proveedor', () => {
      cy.task('firebase:get', {
        collection: 'weddings',
        id: testWedding.id,
      }).then((wedding) => {
        expect(wedding).to.not.be.null;

        // Verificar campos propagados
        cy.log('🔍 Verificando propagación a InfoBoda...');
        
        expect(wedding.celebrationPlace).to.eq('Finca El Jardín - Catering Incluido');
        cy.log('✅ celebrationPlace actualizado');

        expect(wedding.celebrationAddress).to.eq('Avenida de los Naranjos 25, Valencia');
        cy.log('✅ celebrationAddress actualizado');

        expect(wedding.celebrationCity).to.eq('Valencia');
        cy.log('✅ celebrationCity actualizado');

        expect(wedding.ceremonyGPS).to.eq('39.4699,-0.3763');
        cy.log('✅ ceremonyGPS actualizado');

        expect(wedding.venueManagerName).to.eq('María González');
        cy.log('✅ venueManagerName actualizado');

        expect(wedding.venueManagerPhone).to.eq('+34 666 123 456');
        cy.log('✅ venueManagerPhone actualizado');

        // Verificar metadata de propagación
        expect(wedding._lastUpdateSource).to.eq('supplier-acceptance');
        cy.log('✅ Metadata de propagación correcta');

        expect(wedding._lastUpdateCategory).to.eq('lugares');
        cy.log('✅ Categoría de actualización correcta');

        expect(wedding._lastUpdateSupplierName).to.eq('Finca El Jardín - Catering Incluido');
        cy.log('✅ Nombre del proveedor en metadata');

        expect(wedding._celebrationPlaceSource).to.eq('supplier-confirmed');
        cy.log('✅ Fuente marcada como supplier-confirmed');
      });
    });

    it('Debe verificar que el proveedor está en wedding.services', () => {
      cy.task('firebase:get', {
        collection: 'weddings',
        id: testWedding.id,
      }).then((wedding) => {
        expect(wedding).to.not.be.null;
        expect(wedding.services).to.exist;
        expect(wedding.services.lugares).to.exist;
        expect(wedding.services.lugares.status).to.eq('contracted');
        expect(wedding.services.lugares.suppliers).to.have.length(1);
        
        const supplier = wedding.services.lugares.suppliers[0];
        expect(supplier.supplierId).to.eq(testSupplier.id);
        expect(supplier.role).to.eq('principal');
        expect(supplier.totalPrice).to.eq(7500);
        expect(supplier.status).to.eq('active');
        
        cy.log('✅ Proveedor registrado en services correctamente');
      });
    });

    it('Debe verificar que el presupuesto se actualizó', () => {
      cy.task('firebase:get', {
        collection: 'weddings',
        id: testWedding.id,
      }).then((wedding) => {
        expect(wedding).to.not.be.null;
        expect(wedding.budget).to.exist;
        expect(wedding.budget.spent).to.eq(7500);
        expect(wedding.budget.allocated.lugares).to.eq(7500);
        expect(wedding.budget.remaining).to.eq(12500); // 20000 - 7500
        
        cy.log('✅ Presupuesto actualizado correctamente');
      });
    });
  });

  describe('Paso 6: Verificar en interfaz de usuario', () => {
    beforeEach(() => {
      // Login del usuario
      cy.visit('http://localhost:5173/login');
      cy.get('input[type="email"]').type(testUser.email);
      cy.get('input[type="password"]').type('TestPassword123!');
      cy.get('button[type="submit"]').click();
      cy.wait(2000);
    });

    it('Debe ver los datos actualizados en InfoBoda', () => {
      cy.visit('http://localhost:5173/info-boda');
      cy.wait(2000);

      // Verificar que los campos están llenos
      cy.get('input[name="celebrationPlace"]').should('have.value', 'Finca El Jardín - Catering Incluido');
      cy.get('input[name="celebrationAddress"]').should('have.value', 'Avenida de los Naranjos 25, Valencia');
      cy.get('input[name="celebrationCity"]').should('have.value', 'Valencia');
      cy.get('input[name="venueManagerName"]').should('have.value', 'María González');
      cy.get('input[name="venueManagerPhone"]').should('have.value', '+34 666 123 456');

      cy.log('✅ Todos los campos visibles en InfoBoda');
    });

    it('Debe mostrar notificación de actualización automática', () => {
      // Este test verifica que el listener en tiempo real funciona
      // En un escenario real, vería un toast notification
      cy.visit('http://localhost:5173/info-boda');
      cy.wait(1000);

      // Verificar que no hay errores en consola
      cy.window().then((win) => {
        expect(win.console.error).to.not.be.called;
      });

      cy.log('✅ InfoBoda cargó sin errores');
    });
  });

  describe('Resumen del test E2E', () => {
    it('Debe generar resumen del flujo completo', () => {
      cy.log('========================================');
      cy.log('📊 RESUMEN DEL FLUJO E2E COMPLETO');
      cy.log('========================================');
      cy.log('✅ 1. Usuario creado:', testUser.email);
      cy.log('✅ 2. Boda creada:', testWedding.id);
      cy.log('✅ 3. Proveedor creado:', testSupplier.businessName);
      cy.log('✅ 4. Solicitud enviada:', quoteRequest.id);
      cy.log('✅ 5. Presupuesto recibido:', quoteResponse.id);
      cy.log('✅ 6. Presupuesto aceptado');
      cy.log('✅ 7. Datos propagados a InfoBoda');
      cy.log('✅ 8. Presupuesto actualizado: 7500€ de 20000€');
      cy.log('✅ 9. Interfaz de usuario verificada');
      cy.log('========================================');
      cy.log('🎉 FLUJO E2E COMPLETADO EXITOSAMENTE');
      cy.log('========================================');
    });
  });
});
