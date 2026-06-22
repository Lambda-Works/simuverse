import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Test configuration
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    
    // Screenshot and video
    screenshotOnRunFailure: true,
    video: true,
    videoUploadOnPasses: false,
    
    // Retries
    retries: 1,
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:5001/api',
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
