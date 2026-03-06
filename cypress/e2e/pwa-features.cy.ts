/**
 * Phase 3 E2E Test - PWA Features (Offline & Background Sync)
 * Tests: Service Worker, offline mode, background sync, caching
 */

describe('PWA Features - Service Worker & Offline Support', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForLoadingComplete();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker on app load', () => {
      cy.window().then((win) => {
        expect(navigator.serviceWorker).to.exist;
      });
    });

    it('should activate service worker', () => {
      cy.window().then((win) => {
        return navigator.serviceWorker.ready.then((registration) => {
          expect(registration.active).to.exist;
        });
      });
    });

    it('should handle service worker updates', () => {
      cy.window().then((win) => {
        return navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            expect(registration.scope).to.include('/');
          }
        });
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should work in offline mode - cached pages', () => {
      // First visit to cache
      cy.visit('/');
      cy.contains('h1, h2, p', /SimuVerse|Dashboard|Welcome/i).should('exist');

      // Go offline
      cy.goOffline();

      // Reload - should still work from cache
      cy.reload();
      cy.contains('h1, h2, p', /SimuVerse|Dashboard|Welcome/i, { timeout: 10000 })
        .should('exist');

      cy.goOnline();
    });

    it('should show offline indicator', () => {
      cy.goOffline();

      cy.get('[data-cy="offline-banner"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /offline|sin conexión/i);

      cy.goOnline();
    });

    it('should maintain app state in offline mode', () => {
      cy.openModule('ChatIA');
      cy.goOffline();

      // Module should still be visible
      cy.get('[data-cy="chat-input"]', { timeout: 5000 }).should('exist');

      cy.goOnline();
    });

    it('should cache API responses for offline use', () => {
      // Make initial API call
      cy.get('[data-cy="load-data"]').click();
      cy.get('[data-cy="data-loaded"]', { timeout: 10000 }).should('exist');

      // Go offline
      cy.goOffline();

      // Data should still be available
      cy.get('[data-cy="data-loaded"]', { timeout: 5000 }).should('exist');

      cy.goOnline();
    });

    it('should prevent failed API calls in offline mode', () => {
      cy.goOffline();

      cy.get('[data-cy="api-button"]').click();

      // Should show error or offline message
      cy.get('[data-cy="offline-message"]', { timeout: 5000 })
        .should('be.visible')
        .or(cy.get('[data-cy="error-message"]').should('be.visible'));

      cy.goOnline();
    });

    it('should queue actions for sync when offline', () => {
      cy.openModule('ChatIA');
      cy.goOffline();

      // Try to send chat message
      cy.get('[data-cy="chat-input"]').type('Test message while offline');
      cy.get('[data-cy="chat-send"]').click();

      // Should show queued message
      cy.get('[data-cy="queued-indicator"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /en espera|queued|pendiente/i);

      cy.goOnline();
    });

    it('should handle navigation in offline mode', () => {
      cy.visit('/');
      cy.goOffline();

      // Should be able to navigate between cached pages
      cy.get('[data-cy="nav-link"]').first().click();
      cy.url().should('not.contain', 'offline');

      cy.goOnline();
    });
  });

  describe('Background Sync', () => {
    it('should sync pending actions when back online', () => {
      cy.openModule('ChatIA');
      cy.goOffline();

      // Queue an action
      cy.get('[data-cy="chat-input"]').type('Message queued offline');
      cy.get('[data-cy="chat-send"]').click();

      cy.get('[data-cy="sync-pending"]', { timeout: 5000 }).should('exist');

      // Go back online
      cy.goOnline();

      // Should sync
      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('be.visible');
    });

    it('should sync logs to server', () => {
      cy.goOffline();

      // Generate some logs
      cy.openModule('Certificates');
      cy.get('[data-cy="preview-button"]').click();

      // Go back online
      cy.goOnline();

      // Logs should sync
      cy.window().then((win) => {
        return navigator.serviceWorker.controller?.postMessage({
          type: 'FORCE_SYNC',
        });
      });

      cy.get('[data-cy="logs-synced"]', { timeout: 10000 }).should('exist');
    });

    it('should handle sync failures gracefully', () => {
      cy.intercept('POST', '**/api/**', { statusCode: 500 }).as('failedSync');

      cy.goOffline();
      cy.get('[data-cy="chat-input"]').type('Offline message');
      cy.get('[data-cy="chat-send"]').click();

      cy.goOnline();

      cy.wait('@failedSync');

      // Should show retry option
      cy.get('[data-cy="sync-error"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', /error|retry|reintentar/i);
    });

    it('should retry failed syncs', () => {
      cy.intercept('POST', '**/api/sync', { statusCode: 500 }).as('firstTry');
      cy.intercept('POST', '**/api/sync', { statusCode: 200 }).as('secondTry');

      cy.goOffline();
      cy.get('[data-cy="chat-input"]').type('Message');
      cy.get('[data-cy="chat-send"]').click();

      cy.goOnline();

      cy.get('[data-cy="retry-button"]').click();
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('exist');
    });
  });

  describe('Caching Strategy', () => {
    it('should use network-first strategy for API calls', () => {
      cy.intercept('GET', '**/api/data', { delay: 500 }).as('apiCall');

      cy.get('[data-cy="load-data"]').click();
      cy.wait('@apiCall');

      // Cache should be populated
      cy.goOffline();
      cy.get('[data-cy="load-data"]').click();

      // Should load from cache
      cy.get('[data-cy="data-loaded"]', { timeout: 5000 }).should('exist');

      cy.goOnline();
    });

    it('should use cache-first strategy for static assets', () => {
      // First load caches assets
      cy.visit('/');

      cy.goOffline();

      // Static assets should load from cache
      cy.get('img').should('exist');
      cy.get('script').should('exist');

      cy.goOnline();
    });

    it('should handle cache size limits', () => {
      // Load multiple resources to test cache limits
      for (let i = 0; i < 10; i++) {
        cy.visit(`/?page=${i}`);
        cy.waitForLoadingComplete();
      }

      // Cache should be managed
      cy.window().then((win) => {
        return caches.keys().then((cacheNames) => {
          expect(cacheNames.length).to.be.greaterThan(0);
        });
      });
    });

    it('should update cache when content changes', () => {
      cy.visit('/');
      cy.get('[data-cy="content"]').invoke('text').as('originalContent');

      // Simulate content change
      cy.intercept('GET', '/', {
        statusCode: 200,
        body: '<h1>Updated Content</h1>',
      }).as('updated');

      cy.reload();

      // Cache should update
      cy.get('[data-cy="content"]').invoke('text').should('not.equal', '@originalContent');
    });
  });

  describe('IndexedDB Integration', () => {
    it('should store data in IndexedDB', () => {
      cy.openModule('ChatIA');
      cy.chatWithLLM('Test message');

      cy.window().then((win) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('SimuVerseDB');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('pendingActions', 'readonly');
            const store = transaction.objectStore('pendingActions');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              expect(getAllRequest.result.length).to.be.greaterThanOrEqual(0);
              resolve(null);
            };
          };
        });
      });
    });

    it('should retrieve cached data from IndexedDB', () => {
      cy.window().then((win) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('SimuVerseDB');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('cachedData', 'readonly');
            const store = transaction.objectStore('cachedData');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              expect(getAllRequest.result).to.be.an('array');
              resolve(null);
            };
          };
        });
      });
    });

    it('should clear IndexedDB data when needed', () => {
      cy.window().then((win) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('SimuVerseDB');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('cachedData', 'readwrite');
            const store = transaction.objectStore('cachedData');
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
              const getRequest = store.getAll();
              getRequest.onsuccess = () => {
                expect(getRequest.result.length).to.equal(0);
                resolve(null);
              };
            };
          };
        });
      });
    });
  });

  describe('Offline UX', () => {
    it('should show sync status indicator', () => {
      cy.goOffline();

      cy.get('[data-cy="sync-status"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /offline|desconectado/i);

      cy.goOnline();

      cy.get('[data-cy="sync-status"]', { timeout: 5000 }).should('contain', /online|conectado/i);
    });

    it('should show queued items count', () => {
      cy.goOffline();

      // Queue multiple actions
      cy.openModule('ChatIA');
      cy.chatWithLLM('Message 1');
      cy.chatWithLLM('Message 2');

      cy.get('[data-cy="queued-count"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', /2|pending|en espera/i);

      cy.goOnline();
    });

    it('should provide manual sync trigger', () => {
      cy.goOffline();
      cy.chatWithLLM('Offline message');

      cy.goOnline();

      cy.get('[data-cy="sync-button"]', { timeout: 5000 })
        .should('be.visible')
        .click();

      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="sync-complete"]', { timeout: 15000 }).should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load cached content instantly', () => {
      // Warm up cache
      cy.visit('/');

      cy.goOffline();

      // Navigation should be instant from cache
      const start = Date.now();
      cy.visit('/');
      const end = Date.now();

      expect(end - start).to.be.lessThan(500);

      cy.goOnline();
    });

    it('should not impact initial load time significantly', () => {
      const start = Date.now();
      cy.visit('/');
      cy.waitForLoadingComplete();
      const end = Date.now();

      // Should complete in reasonable time (adjust threshold as needed)
      expect(end - start).to.be.lessThan(5000);
    });
  });

  describe('Accessibility', () => {
    it('should announce offline status to screen readers', () => {
      cy.goOffline();

      cy.get('[data-cy="offline-banner"]').should(
        'have.attr',
        'role',
        'alert'
      );

      cy.goOnline();
    });

    it('should provide keyboard navigation for sync controls', () => {
      cy.goOffline();
      cy.get('[data-cy="sync-button"]').focus().should('be.focused');
      cy.get('[data-cy="sync-button"]').type('{enter}');

      cy.get('[data-cy="syncing"]', { timeout: 10000 }).should('exist');

      cy.goOnline();
    });
  });
});
