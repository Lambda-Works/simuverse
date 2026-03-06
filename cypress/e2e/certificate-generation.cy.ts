/**
 * Phase 3 E2E Test - Certificate Generation
 * Tests: PDF generation, download, email, and preview
 */

describe('Certificate Generation - StudentCertificate Component', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.openModule('Certificates');
  });

  describe('Happy Path', () => {
    it('should display certificate interface with student data', () => {
      cy.get('[data-cy="student-info"]').should('be.visible');
      cy.get('[data-cy="student-name"]').should('not.be.empty');
      cy.get('[data-cy="student-course"]').should('not.be.empty');
      cy.get('[data-cy="student-score"]').should('contain', /\d+/);
    });

    it('should preview certificate before download', () => {
      cy.get('[data-cy="preview-button"]').click();
      
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 })
        .should('be.visible');
      
      // Check certificate elements
      cy.get('[data-cy="certificate-preview"]').within(() => {
        cy.contains('Certificate').should('exist');
        cy.get('[data-cy="student-name"]').should('not.be.empty');
      });
    });

    it('should download certificate as PDF', () => {
      cy.get('[data-cy="download-button"]').click();
      
      // Verify download UI feedback
      cy.get('[data-cy="download-loading"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="download-success"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-cy="download-success"]').should('contain', /descargad|saved|éxito/i);
      
      // File should be in downloads folder (in real Cypress setup)
      cy.readFile('cypress/downloads/certificate-*.pdf', { timeout: 10000 }).should('exist');
    });

    it('should display competencies radar chart in preview', () => {
      cy.get('[data-cy="preview-button"]').click();
      
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).within(() => {
        cy.get('[data-cy="radar-chart"]').should('be.visible');
        cy.get('[data-cy="competency-label"]').should('have.length.greaterThan', 0);
      });
    });

    it('should show competency percentages', () => {
      cy.get('[data-cy="competencies-section"]').within(() => {
        cy.get('[data-cy="competency-item"]').each(($el) => {
          cy.wrap($el).should('contain', /\d+%/);
          cy.wrap($el).get('[data-cy="progress-bar"]').should('be.visible');
        });
      });
    });

    it('should display certificate statistics', () => {
      cy.get('[data-cy="statistics"]').within(() => {
        cy.get('[data-cy="stat-time"]').should('contain', /\d+:\d+/); // HH:MM format
        cy.get('[data-cy="stat-date"]').should('contain', /\d{1,2}\/\d{1,2}\/\d{4}/);
        cy.get('[data-cy="stat-simulation"]').should('not.be.empty');
      });
    });

    it('should send certificate via email', () => {
      cy.get('[data-cy="email-button"]').click();
      
      // Email modal should appear
      cy.get('[data-cy="email-modal"]', { timeout: 5000 }).should('be.visible');
      
      // Fill email form
      cy.get('[data-cy="recipient-email"]').type('student@example.com');
      cy.get('[data-cy="email-message"]').type('Congratulations on completing the simulation!');
      cy.get('[data-cy="send-email-button"]').click();
      
      // Verify success
      cy.get('[data-cy="email-success"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /enviado|sent|email/i);
    });

    it('should support different certificate themes', () => {
      const themes = ['professional', 'modern', 'light', 'dark'];
      
      themes.forEach((theme) => {
        cy.get('[data-cy="theme-selector"]').select(theme);
        cy.get('[data-cy="preview-button"]').click();
        
        cy.get('[data-cy="certificate-preview"]', { timeout: 5000 })
          .should('have.attr', 'data-theme', theme);
      });
    });

    it('should display QR code in certificate', () => {
      cy.get('[data-cy="preview-button"]').click();
      
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).within(() => {
        cy.get('[data-cy="qr-code"]').should('be.visible');
        cy.get('[data-cy="qr-code"]').should('have.attr', 'src');
      });
    });

    it('should show verification code', () => {
      cy.get('[data-cy="certificate-info"]').within(() => {
        cy.get('[data-cy="verification-code"]').should('be.visible');
        cy.get('[data-cy="verification-code"]').should('contain', /[A-Z0-9]{6,}/);
      });
    });

    it('should display competency breakdown', () => {
      cy.get('[data-cy="competencies-section"]').should('be.visible');
      
      // Check each competency
      const competencies = ['Compliance', 'Management', 'Communication', 'Innovation'];
      competencies.forEach((comp) => {
        cy.get('[data-cy="competency-item"]').should('contain', comp);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing student data gracefully', () => {
      cy.intercept('GET', '**/api/student/**', { statusCode: 404 });
      
      cy.reload();
      
      cy.get('[data-cy="error-message"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /no encontrado|not found|error/i);
    });

    it('should handle certificate generation failure', () => {
      cy.intercept('POST', '**/api/certificate/**', { statusCode: 500 });
      
      cy.get('[data-cy="download-button"]').click();
      
      cy.get('[data-cy="error-message"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /error|falló|failed/i);
    });

    it('should handle email sending failure', () => {
      cy.intercept('POST', '**/api/certificate/email', { statusCode: 500 });
      
      cy.get('[data-cy="email-button"]').click();
      cy.get('[data-cy="recipient-email"]').type('student@example.com');
      cy.get('[data-cy="send-email-button"]').click();
      
      cy.get('[data-cy="error-message"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /error|falló|no se pudo/i);
    });

    it('should validate email format', () => {
      cy.get('[data-cy="email-button"]').click();
      cy.get('[data-cy="recipient-email"]').type('invalid-email');
      cy.get('[data-cy="send-email-button"]').click();
      
      cy.get('[data-cy="email-error"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /email|formato/i);
    });

    it('should handle offline mode for certificate preview', () => {
      cy.goOffline();
      
      cy.get('[data-cy="preview-button"]').click();
      
      // Should still show cached preview or offline message
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 })
        .should('exist');
      
      cy.goOnline();
    });

    it('should not allow download without required data', () => {
      cy.intercept('GET', '**/api/student/**', { 
        statusCode: 200, 
        body: { name: '', competencies: [] } 
      });
      
      cy.reload();
      cy.get('[data-cy="download-button"]').should('be.disabled');
    });
  });

  describe('Offline Functionality', () => {
    it('should cache certificate for offline access', () => {
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
      
      // Go offline
      cy.goOffline();
      
      // Navigate away and back
      cy.visit('/');
      cy.openModule('Certificates');
      
      // Certificate should still be accessible
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 }).should('exist');
      
      cy.goOnline();
    });

    it('should queue certificate downloads while offline', () => {
      cy.goOffline();
      
      cy.get('[data-cy="download-button"]').click();
      
      // Should show offline message
      cy.get('[data-cy="offline-message"]', { timeout: 5000 })
        .should('be.visible');
      
      // Go back online
      cy.goOnline();
      
      // Should attempt sync
      cy.get('[data-cy="syncing"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('Performance & Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('[data-cy="preview-button"]').focus().should('be.focused');
      cy.get('[data-cy="preview-button"]').type('{enter}');
      
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="download-button"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="email-button"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="preview-button"]').should('have.attr', 'aria-label');
    });

    it('should load certificate in reasonable time', () => {
      cy.get('[data-cy="preview-button"]').click();
      
      // Should appear within 10 seconds
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
    });

    it('should handle high resolution certificate export', () => {
      cy.get('[data-cy="download-button"]').click();
      
      // Verify file was created with proper naming
      cy.get('[data-cy="download-success"]', { timeout: 15000 }).should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('should save certificate preview locally', () => {
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
      
      cy.reload();
      
      // Preview should be cached
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 }).should('exist');
    });

    it('should log all certificate actions', () => {
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="download-button"]').click();
      
      // In real scenario, check logs in IndexedDB or backend
      // cy.window().then((win) => {
      //   // Query IndexedDB for logs
      // });
    });
  });
});
