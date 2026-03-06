/**
 * Custom Cypress Commands for Phase 3 Testing
 */

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.contains('button', /login|sign in/i).click();
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.contains('button', /login|sign in/i).click();
  cy.url().should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.contains('button', /logout|sign out/i).click();
});

// Wait for loading
Cypress.Commands.add('waitForLoadingComplete', () => {
  cy.get('[data-cy="loading-spinner"]', { timeout: 10000 }).should('not.exist');
  cy.get('.skeleton').should('not.exist');
});

// Open module
Cypress.Commands.add('openModule', (moduleName: string) => {
  cy.contains('button', moduleName).click();
  cy.waitForLoadingComplete();
});

// Chat command - send message to LLM
Cypress.Commands.add('chatWithLLM', (message: string) => {
  cy.get('[data-cy="chat-input"]').type(message);
  cy.get('[data-cy="chat-send"]').click();
  cy.get('[data-cy="chat-loading"]', { timeout: 15000 }).should('not.exist');
  cy.get('[data-cy="chat-message"]').last().should('contain', message);
});

// Generate certificate
Cypress.Commands.add('generateCertificate', () => {
  cy.contains('button', /generate|download/i).click();
  cy.get('[data-cy="certificate-preview"]', { timeout: 10000 }).should('exist');
});

// Download file command
Cypress.Commands.add('downloadFile', (fileName: string) => {
  cy.contains('button', /download/i).click();
  // Verify download started (in real scenario, you'd check the download folder)
  cy.get('[data-cy="download-success"]', { timeout: 5000 }).should('be.visible');
});

// Check offline functionality
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    win.dispatchEvent(new Event('offline'));
  });
});

Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    win.dispatchEvent(new Event('online'));
  });
});

// Declare types for TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      waitForLoadingComplete(): Chainable<void>;
      openModule(moduleName: string): Chainable<void>;
      chatWithLLM(message: string): Chainable<void>;
      generateCertificate(): Chainable<void>;
      downloadFile(fileName: string): Chainable<void>;
      goOffline(): Chainable<void>;
      goOnline(): Chainable<void>;
    }
  }
}
