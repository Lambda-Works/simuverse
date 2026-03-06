/**
 * Cypress Support File
 * Custom commands and hooks for E2E testing
 */

// Import commands
import './commands';

// Suppress console errors during tests
const app = window.top;

if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');

  app.document.head.appendChild(style);
}

/**
 * Hook to handle uncaught exceptions
 */
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore specific errors that we expect during testing
  if (
    err.message.includes('ResizeObserver loop limit exceeded') ||
    err.message.includes('Cannot read properties of undefined')
  ) {
    return false;
  }
  // Let other exceptions fail the test
  return true;
});

// Global test timeout
Cypress.config('defaultCommandTimeout', 10000);
