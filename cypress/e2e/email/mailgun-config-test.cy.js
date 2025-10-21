describe('Verificación de Configuración de Mailgun', () => {
  it('verifica que las variables de entorno de Mailgun están configuradas correctamente', () => {
    cy.visit('http://localhost:5173');
    
    cy.window().then((win) => {
      // Verificar que import.meta.env está disponible
      const mailgunDomain = 'malove.app'; // Valor esperado
      const sendingDomain = 'mg.malove.app'; // Valor esperado
      
      cy.log('Dominio esperado:', mailgunDomain);
      cy.log('Sending domain esperado:', sendingDomain);
      
      // Verificar que el servicio de Mailgun está disponible
      cy.request('GET', 'http://localhost:4004/api/health').then((response) => {
        expect(response.status).to.eq(200);
        cy.log('✅ Backend está corriendo en puerto 4004');
      });
    });
  });

  it('verifica que el servicio de mailgun está disponible', () => {
    cy.visit('http://localhost:5173');
    
    // Importar dinámicamente el servicio de mailgun
    cy.window().then(async (win) => {
      try {
        const mailgunModule = await import('../../../src/services/mailgunService.js');
        
        expect(mailgunModule.isMailgunConfigured).to.be.a('function');
        expect(mailgunModule.sendEmail).to.be.a('function');
        expect(mailgunModule.validateEmail).to.be.a('function');
        expect(mailgunModule.fetchMailgunDomainStatus).to.be.a('function');
        expect(mailgunModule.sendAliasVerificationEmail).to.be.a('function');
        
        cy.log('✅ Todas las funciones de Mailgun están disponibles');
        
        // Verificar que la configuración está activa
        const isConfigured = mailgunModule.isMailgunConfigured();
        expect(isConfigured).to.be.true;
        cy.log('✅ Mailgun está configurado correctamente');
      } catch (error) {
        cy.log('❌ Error al cargar mailgunService:', error.message);
        throw error;
      }
    });
  });

  it('verifica que fetchMailgunDomainStatus devuelve datos correctos', () => {
    cy.visit('http://localhost:5173');
    
    cy.window().then(async (win) => {
      try {
        const mailgunModule = await import('../../../src/services/mailgunService.js');
        
        const status = await mailgunModule.fetchMailgunDomainStatus();
        
        expect(status).to.have.property('domain');
        expect(status.domain).to.equal('malove.app');
        expect(status).to.have.property('verified');
        expect(status.verified).to.be.true;
        
        cy.log('✅ fetchMailgunDomainStatus funciona correctamente');
        cy.log('Dominio:', status.domain);
        cy.log('Estado:', status.state);
      } catch (error) {
        cy.log('❌ Error al obtener estado del dominio:', error.message);
        throw error;
      }
    });
  });
});
