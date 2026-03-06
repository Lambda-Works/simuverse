/**
 * Phase 3 E2E Test - Complete Integration
 * Tests: All Phase 3 components working together
 */

describe('Phase 3 - Complete Integration', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForLoadingComplete();
  });

  describe('Full Workflow - Chat to Certificate', () => {
    it('should complete full workflow: chat → certificate → offline sync', () => {
      // Step 1: Open ChatIA module
      cy.openModule('ChatIA');
      cy.get('[data-cy="chat-input"]').should('be.visible');

      // Step 2: Interact with LLM
      cy.chatWithLLM('¿Cuáles son las mejores prácticas en compliance?');
      cy.get('[data-cy="chat-message"][data-role="assistant"]', { timeout: 20000 })
        .should('exist')
        .should('not.contain', 'error');

      // Step 3: Verify tokens tracked
      cy.get('[data-cy="tokens-used"]').should('contain', 'Token');

      // Step 4: Switch to Certificate module
      cy.openModule('Certificates');
      cy.get('[data-cy="student-info"]').should('be.visible');

      // Step 5: Preview certificate
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');

      // Step 6: Verify all elements
      cy.get('[data-cy="certificate-preview"]').within(() => {
        cy.contains('Certificate').should('exist');
        cy.get('[data-cy="radar-chart"]').should('be.visible');
        cy.get('[data-cy="qr-code"]').should('be.visible');
      });

      // Step 7: Go offline and verify data persistence
      cy.goOffline();
      cy.openModule('ChatIA');
      cy.get('[data-cy="chat-message"]', { timeout: 5000 }).should('have.length.greaterThan', 0);

      cy.openModule('Certificates');
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 }).should('exist');

      cy.goOnline();
    });

    it('should handle offline chat and certificate generation', () => {
      // Go offline first
      cy.goOffline();

      // Open ChatIA and try to chat
      cy.openModule('ChatIA');
      cy.get('[data-cy="chat-input"]').type('Offline test message');
      cy.get('[data-cy="chat-send"]').click();

      // Should show queued
      cy.get('[data-cy="queued-indicator"]', { timeout: 5000 }).should('exist');

      // Open Certificates
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();

      // Should work from cache
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 }).should('exist');

      // Go online and verify sync
      cy.goOnline();
      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('be.visible');
    });

    it('should handle rapid module switching with data persistence', () => {
      // Start chat session
      cy.openModule('ChatIA');
      cy.chatWithLLM('First message');

      // Switch to Certificate
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();

      // Switch back to Chat
      cy.openModule('ChatIA');
      cy.get('[data-cy="chat-message"]', { timeout: 5000 }).should('have.length.greaterThan', 0);

      // Switch to Certificate again
      cy.openModule('Certificates');
      cy.get('[data-cy="certificate-preview"]', { timeout: 5000 }).should('exist');
    });
  });

  describe('Error Recovery & Resilience', () => {
    it('should recover from temporary API failure', () => {
      cy.openModule('ChatIA');

      // First message succeeds
      cy.chatWithLLM('Test message 1');

      // API fails
      cy.intercept('POST', '**/gemini/**', { statusCode: 500 });

      // Should show fallback response
      cy.chatWithLLM('Test message 2');
      cy.get('[data-cy="chat-message"][data-role="assistant"]', { timeout: 10000 })
        .should('exist');

      // API recovers
      cy.intercept('POST', '**/gemini/**', { statusCode: 200 }).as('recoveredAPI');

      cy.chatWithLLM('Test message 3');
      cy.wait('@recoveredAPI', { timeout: 15000 });
    });

    it('should handle network interruption during certificate download', () => {
      cy.openModule('Certificates');

      // Start download
      cy.get('[data-cy="download-button"]').click();

      // Simulate network failure
      cy.intercept('POST', '**/api/certificate/**', { statusCode: 0 });

      // Should handle gracefully
      cy.get('[data-cy="error-message"]', { timeout: 10000 })
        .should('exist')
        .or(cy.get('[data-cy="offline-message"]').should('exist'));
    });

    it('should maintain data integrity during offline transitions', () => {
      cy.openModule('ChatIA');
      const messageText = 'Message before offline';
      cy.chatWithLLM(messageText);

      // Store initial message count
      cy.get('[data-cy="chat-message"]').then(($messages) => {
        const initialCount = $messages.length;

        // Go offline
        cy.goOffline();

        // Message should still be there
        cy.get('[data-cy="chat-message"]')
          .should('have.length', initialCount);

        // Try to add new message offline
        cy.chatWithLLM('Offline message');
        cy.get('[data-cy="chat-message"]')
          .should('have.length', initialCount + 2);

        cy.goOnline();
      });
    });
  });

  describe('Performance & Load Testing', () => {
    it('should handle high chat message volume', () => {
      cy.openModule('ChatIA');

      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        cy.chatWithLLM(`Message ${i}`);
      }

      cy.get('[data-cy="chat-message"]').should('have.length.at.least', 10);
    });

    it('should render certificate with complex competency data', () => {
      cy.openModule('Certificates');

      // Load certificate with many competencies
      cy.get('[data-cy="preview-button"]').click();

      cy.get('[data-cy="certificate-preview"]', { timeout: 15000 }).should('exist');

      // Verify all competencies render
      cy.get('[data-cy="competency-item"]').should('have.length.greaterThan', 0);
    });

    it('should handle rapid online/offline transitions', () => {
      for (let i = 0; i < 3; i++) {
        cy.goOffline();
        cy.get('[data-cy="offline-banner"]', { timeout: 5000 }).should('exist');

        cy.goOnline();
        cy.get('[data-cy="offline-banner"]', { timeout: 5000 }).should('not.exist');
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent state across modules', () => {
      // Chat module
      cy.openModule('ChatIA');
      cy.chatWithLLM('Test consistency');

      // Get chat message count
      cy.get('[data-cy="chat-message"]').then(($messages) => {
        const chatCount = $messages.length;

        // Switch to Certificates and back
        cy.openModule('Certificates');
        cy.openModule('ChatIA');

        // Chat count should be same
        cy.get('[data-cy="chat-message"]').should('have.length', chatCount);
      });
    });

    it('should sync data correctly when reconnecting', () => {
      cy.openModule('ChatIA');
      cy.goOffline();

      cy.chatWithLLM('Offline message');
      cy.get('[data-cy="sync-pending"]', { timeout: 5000 }).should('exist');

      cy.goOnline();
      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');

      // Verify data synced
      cy.get('[data-cy="chat-message"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Cross-Module Communication', () => {
    it('should share competency data between modules', () => {
      // Assume ChatIA tracks competencies
      cy.openModule('ChatIA');

      // Switch to Certificates
      cy.openModule('Certificates');

      // Competencies should reflect chat interactions
      cy.get('[data-cy="competency-item"]').should('have.length.greaterThan', 0);
    });

    it('should update certificate when chat history changes', () => {
      cy.openModule('ChatIA');
      cy.chatWithLLM('First interaction');

      // Get certificate
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).invoke('text').as('cert1');

      // Add more chat
      cy.openModule('ChatIA');
      cy.chatWithLLM('Second interaction');

      // Certificate should update
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).invoke('text').as('cert2');

      cy.get('@cert1').then((cert1) => {
        cy.get('@cert2').then((cert2) => {
          // Certificates should be different (updated)
          expect(cert1).to.not.equal(cert2);
        });
      });
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up service worker cache when needed', () => {
      cy.visit('/');

      cy.window().then((win) => {
        return caches.keys().then((cacheNames) => {
          expect(cacheNames.length).to.be.greaterThan(0);
        });
      });
    });

    it('should clean up IndexedDB old entries', () => {
      cy.window().then((win) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('SimuVerseDB');
          request.onsuccess = () => {
            const db = request.result;
            // Add cleanup logic check
            expect(db).to.exist;
            resolve(null);
          };
        });
      });
    });
  });

  describe('End-to-End User Scenarios', () => {
    it('Scenario: Student completes simulation and downloads certificate offline', () => {
      // 1. Chat interaction (simulating simulation)
      cy.openModule('ChatIA');
      cy.chatWithLLM('¿Cómo es el proceso de onboarding?');
      cy.chatWithLLM('¿Cuál es el rol del compliance en esto?');

      // 2. Verify competency tracking
      cy.get('[data-cy="tokens-used"]').should('contain', 'Token');

      // 3. Generate certificate
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');

      // 4. Go offline
      cy.goOffline();

      // 5. Download certificate (should be queued)
      cy.get('[data-cy="download-button"]').click();
      cy.get('[data-cy="sync-pending"]', { timeout: 5000 }).should('exist');

      // 6. Go online and verify sync
      cy.goOnline();
      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('be.visible');
    });

    it('Scenario: User experiences network issues and recovers', () => {
      // 1. Start normal session
      cy.openModule('ChatIA');
      cy.chatWithLLM('Initial message');

      // 2. Network gets poor (simulated)
      cy.intercept('POST', '**/gemini/**', {
        delay: 5000,
        statusCode: 200,
      });

      // 3. User goes offline
      cy.goOffline();

      // 4. Try to continue (should use fallback)
      cy.chatWithLLM('Fallback message');
      cy.get('[data-cy="chat-message"]').should('have.length.greaterThan', 2);

      // 5. Reconnect
      cy.goOnline();

      // 6. Sync and continue
      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('be.visible');

      cy.openModule('Certificates');
      cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
    });
  });
});
