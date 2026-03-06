/**
 * Phase 3 E2E Test - LLM Integration (ChatIA Module)
 * Tests: Gemini API integration with fallback logic
 */

describe('LLM Integration - ChatIA Module', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.openModule('ChatIA');
  });

  describe('Happy Path', () => {
    it('should display chat interface with input and send button', () => {
      cy.get('[data-cy="chat-input"]').should('be.visible');
      cy.get('[data-cy="chat-send"]').should('be.visible');
      cy.get('[data-cy="chat-messages"]').should('exist');
    });

    it('should send message and receive LLM response', () => {
      const testMessage = '¿Cuáles son los pasos para una contratación correcta?';
      
      cy.get('[data-cy="chat-input"]').type(testMessage);
      cy.get('[data-cy="chat-send"]').click();
      
      // Check user message appears
      cy.get('[data-cy="chat-message"][data-role="user"]')
        .last()
        .should('contain', testMessage);
      
      // Wait for assistant response (with longer timeout for API)
      cy.get('[data-cy="chat-message"][data-role="assistant"]', { timeout: 20000 })
        .should('exist')
        .should('not.contain', 'error')
        .should('not.be.empty');
    });

    it('should display token usage in stats', () => {
      cy.chatWithLLM('Explica brevemente qué es compliance');
      
      cy.get('[data-cy="chat-stats"]').should('be.visible');
      cy.get('[data-cy="tokens-used"]').should('contain', 'Token');
      cy.get('[data-cy="tokens-input"]').should('contain', /\d+/);
      cy.get('[data-cy="tokens-output"]').should('contain', /\d+/);
    });

    it('should maintain conversation history', () => {
      cy.chatWithLLM('¿Qué es un compliance?');
      cy.chatWithLLM('¿Cuáles son sus beneficios?');
      
      // Check both messages are present
      cy.get('[data-cy="chat-message"]').should('have.length.at.least', 4); // 2 user + 2 assistant
      cy.get('[data-cy="chat-message"]').first().should('contain', 'compliance');
      cy.get('[data-cy="chat-message"]').eq(2).should('contain', 'beneficios');
    });

    it('should support multiple family types', () => {
      // Test with different family types if selector exists
      const families = ['RRHH', 'IT', 'Administración', 'Emprendimiento'];
      
      families.forEach((family) => {
        cy.get('[data-cy="family-selector"]').select(family);
        cy.chatWithLLM(`Explicación según familia: ${family}`);
        cy.get('[data-cy="chat-message"][data-role="assistant"]')
          .last()
          .should('not.contain', 'error');
      });
    });

    it('should clear chat history', () => {
      cy.chatWithLLM('Primer mensaje');
      cy.get('[data-cy="clear-chat"]').click();
      cy.get('[data-cy="confirm-clear"]').click();
      
      cy.get('[data-cy="chat-message"]').should('not.exist');
    });

    it('should handle multi-line input', () => {
      const multiLineMessage = 'Primera línea\nSegunda línea\nTercera línea';
      
      cy.get('[data-cy="chat-input"]').type(multiLineMessage);
      cy.get('[data-cy="chat-send"]').click();
      
      cy.get('[data-cy="chat-message"][data-role="user"]')
        .last()
        .should('contain', 'Primera línea');
    });
  });

  describe('Error Handling', () => {
    it('should show error when API key is missing', () => {
      // This assumes env var is cleared for this test
      cy.chatWithLLM('Test message');
      
      cy.get('[data-cy="chat-error"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /API key|configurar/i);
    });

    it('should fall back to pattern matching when API fails', () => {
      // Force offline to trigger fallback
      cy.goOffline();
      
      cy.chatWithLLM('¿Qué es compliance?');
      
      // Should still get a response (from fallback)
      cy.get('[data-cy="chat-message"][data-role="assistant"]', { timeout: 10000 })
        .should('exist')
        .should('contain', /compliance|regulación/i);
      
      cy.goOnline();
    });

    it('should show timeout error for slow responses', () => {
      // Note: This test depends on API timeout configuration
      cy.intercept('POST', '**/gemini/**', (req) => {
        req.reply(() => new Promise(resolve => setTimeout(() => resolve({ statusCode: 504 }), 15000)));
      });
      
      cy.chatWithLLM('Test message');
      
      cy.get('[data-cy="chat-error"]', { timeout: 20000 })
        .should('be.visible')
        .should('contain', /timeout|tiempo|límite/i);
    });

    it('should handle rate limiting gracefully', () => {
      cy.intercept('POST', '**/gemini/**', { statusCode: 429, body: { error: 'Too many requests' } });
      
      cy.chatWithLLM('Test message');
      
      cy.get('[data-cy="chat-error"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /rate limit|intenta más tarde|límite de solicitudes/i);
    });

    it('should handle empty message submission', () => {
      cy.get('[data-cy="chat-send"]').click();
      
      // Should show validation error or do nothing
      cy.get('[data-cy="chat-error"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /vacío|requerido|escribir/i);
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(5000);
      
      cy.get('[data-cy="chat-input"]').type(longMessage);
      cy.get('[data-cy="chat-send"]').click();
      
      // Should either send or show length warning
      cy.get('[data-cy="chat-message"]', { timeout: 10000 }).should('exist');
    });
  });

  describe('Performance & Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('[data-cy="chat-input"]').focus().should('be.focused');
      
      // Type with keyboard
      cy.get('[data-cy="chat-input"]').type('Mensaje{shift}{enter}');
      cy.get('[data-cy="chat-send"]').should('be.focused');
      cy.get('[data-cy="chat-send"]').type('{enter}');
      
      cy.get('[data-cy="chat-message"]').should('have.length.at.least', 2);
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="chat-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="chat-send"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="chat-messages"]').should('have.attr', 'role', 'log');
    });

    it('should not exceed reasonable load times', () => {
      cy.chatWithLLM('Test message');
      
      cy.get('[data-cy="chat-message"][data-role="assistant"]', { timeout: 20000 })
        .should('exist');
    });

    it('should handle rapid message submissions', () => {
      cy.chatWithLLM('Mensaje 1');
      cy.chatWithLLM('Mensaje 2');
      cy.chatWithLLM('Mensaje 3');
      
      cy.get('[data-cy="chat-message"]').should('have.length.at.least', 6);
    });
  });

  describe('State Management', () => {
    it('should persist chat on page reload', () => {
      cy.chatWithLLM('Mensaje antes de reload');
      
      cy.reload();
      cy.waitForLoadingComplete();
      
      // Check if message persists (depends on implementation)
      cy.get('[data-cy="chat-message"]', { timeout: 10000 })
        .should('have.length.at.least', 1);
    });

    it('should update token counter accurately', () => {
      cy.chatWithLLM('Short');
      cy.get('[data-cy="tokens-used"]').should('contain', 'Token');
      
      const firstTokenCount = cy.get('[data-cy="tokens-used"]').invoke('text');
      
      cy.chatWithLLM('This is a much longer message with more words and tokens');
      const secondTokenCount = cy.get('[data-cy="tokens-used"]').invoke('text');
      
      // Second should have more tokens
      secondTokenCount.should('not.equal', firstTokenCount);
    });
  });
});
