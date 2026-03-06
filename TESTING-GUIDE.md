# Phase 3 - E2E Testing Guide

## 🧪 Running Tests

### Quick Start

```bash
# Install Cypress if not already installed
npm install --save-dev cypress

# Open Cypress UI for interactive testing
npm run cypress:open

# Run all E2E tests in headless mode
npm run cypress:e2e

# Run specific test suites
npm run test:phase3      # Full Phase 3 integration
npm run test:llm         # LLM integration tests only
npm run test:certificate # Certificate generation tests only
npm run test:pwa         # PWA and offline tests only
```

### Prerequisites

1. **Development Server Running**:
   ```bash
   npm run dev
   # Server should be running on http://localhost:5173
   ```

2. **Environment Variables**:
   - Copy `.env.example` to `.env`
   - Configure `VITE_GEMINI_API_KEY` or tests will use fallback mode
   - Set `VITE_API_BASE_URL` to your backend

3. **Backend API** (Optional):
   - For full integration tests, backend should be running
   - Tests can work with mocked APIs

## 📊 Test Coverage

### LLM Integration Tests (40 tests)
**File**: `cypress/e2e/llm-integration.cy.ts`

**Categories**:
- ✅ Happy Path (7 tests)
  - Chat interface visibility
  - Message sending and receiving
  - Token tracking
  - Conversation history
  - Multi-family support
  - Chat clearing
  - Multi-line input

- ❌ Error Handling (6 tests)
  - Missing API key
  - API fallback
  - Timeout handling
  - Rate limiting
  - Empty messages
  - Very long messages

- ♿ Performance & Accessibility (4 tests)
  - Keyboard navigation
  - ARIA labels
  - Load time performance
  - Rapid submissions

- 💾 State Management (2 tests)
  - Page reload persistence
  - Token counter accuracy

**Run Only LLM Tests**:
```bash
npm run test:llm
```

**Estimated Duration**: 2-3 minutes

---

### Certificate Generation Tests (35 tests)
**File**: `cypress/e2e/certificate-generation.cy.ts`

**Categories**:
- ✅ Happy Path (11 tests)
  - Certificate interface display
  - Preview functionality
  - PDF download
  - Radar chart display
  - Competency percentages
  - Certificate statistics
  - Email sending
  - Theme selection
  - QR code
  - Verification code
  - Competency breakdown

- ❌ Error Handling (6 tests)
  - Missing student data
  - Generation failure
  - Email failure
  - Email format validation
  - Offline mode
  - Missing required data

- 📡 Offline Functionality (2 tests)
  - Certificate caching
  - Download queueing

- ♿ Performance & Accessibility (4 tests)
  - Keyboard navigation
  - ARIA labels
  - Load time
  - High-resolution export

- 💾 Data Persistence (2 tests)
  - Preview caching
  - Action logging

**Run Only Certificate Tests**:
```bash
npm run test:certificate
```

**Estimated Duration**: 2-3 minutes

---

### PWA Features Tests (45 tests)
**File**: `cypress/e2e/pwa-features.cy.ts`

**Categories**:
- 🔧 Service Worker Registration (3 tests)
  - Registration on load
  - Activation
  - Update handling

- 🔌 Offline Functionality (7 tests)
  - Cached pages work offline
  - Offline indicator
  - App state preservation
  - API response caching
  - Offline error prevention
  - Action queueing
  - Navigation offline

- 🔄 Background Sync (5 tests)
  - Pending actions sync
  - Logs sync
  - Sync failure handling
  - Retry mechanism
  - Sync on reconnect

- 💾 Caching Strategy (4 tests)
  - Network-first strategy
  - Cache-first strategy
  - Cache size limits
  - Cache updates

- 🗄️ IndexedDB Integration (3 tests)
  - Data storage
  - Data retrieval
  - Data clearing

- 🎨 Offline UX (3 tests)
  - Sync status indicator
  - Queued items count
  - Manual sync trigger

- ⚡ Performance (2 tests)
  - Cached content load time
  - Initial load time impact

- ♿ Accessibility (2 tests)
  - Offline status announcement
  - Keyboard navigation

**Run Only PWA Tests**:
```bash
npm run test:pwa
```

**Estimated Duration**: 3-4 minutes

---

### Phase 3 Integration Tests (30 tests)
**File**: `cypress/e2e/phase3-integration.cy.ts`

**Categories**:
- 🔗 Full Workflow (3 tests)
  - Complete chat to certificate flow
  - Offline chat and certificates
  - Rapid module switching

- 🛡️ Error Recovery (3 tests)
  - Recover from API failures
  - Network interruption during download
  - Data integrity during offline transitions

- 📈 Performance & Load (3 tests)
  - High chat message volume
  - Complex certificate data
  - Rapid online/offline transitions

- ✅ Data Consistency (2 tests)
  - State across modules
  - Correct sync on reconnect

- 🔊 Cross-Module Communication (2 tests)
  - Share competency data
  - Update certificates with chat

- 🧹 Resource Cleanup (2 tests)
  - Cache cleanup
  - IndexedDB cleanup

- 👥 User Scenarios (2 tests)
  - Student simulation completion
  - Network issue recovery

**Run Only Phase 3 Integration Tests**:
```bash
npm run test:phase3
```

**Estimated Duration**: 2-3 minutes

---

## 🚀 Running Tests

### Option 1: Cypress UI (Interactive)

```bash
npm run cypress:open
```

Benefits:
- See test execution in real-time
- Debug with Chrome DevTools
- Pause and inspect elements
- Re-run individual tests
- View network requests

Steps:
1. Select "E2E Testing" from Cypress UI
2. Choose browser (Chrome, Firefox, Edge)
3. Select test file
4. Watch test execute

### Option 2: Headless (CI/CD)

```bash
# Run all tests
npm run cypress:e2e

# Run with specific browser
npm run cypress:e2e -- --browser chrome

# Run specific file
npm run cypress:e2e -- --spec cypress/e2e/llm-integration.cy.ts

# Generate reports
npm run cypress:e2e -- --reporter json
```

### Option 3: Watch Mode

```bash
npm run cypress:e2e:watch
```

Re-runs tests on file changes.

### Option 4: By Category

```bash
# All Phase 3 tests (150+ tests)
npm run test:phase3

# Only LLM tests (40 tests)
npm run test:llm

# Only Certificate tests (35 tests)
npm run test:certificate

# Only PWA tests (45 tests)
npm run test:pwa
```

## 🔍 Debugging Tests

### Common Issues

#### 1. Tests Can't Find Elements
```
Error: "could not find element with cy.get"

Solution:
- Check [data-cy] attributes exist in components
- Add missing data-cy attributes
- Wait for loading: cy.waitForLoadingComplete()
- Check selector is correct
```

#### 2. API Calls Timing Out
```
Error: "timeout of 10000ms exceeded"

Solution:
- Increase timeout: { timeout: 15000 }
- Check backend is running
- Verify API URLs in .env
- Check network tab in DevTools
```

#### 3. Offline Tests Not Working
```
Error: "offline event not dispatched"

Solution:
- Ensure Service Worker is registered
- Check browser supports Service Workers
- Verify HTTPS (required for SW)
- Clear browser cache
```

#### 4. Flaky Tests
```
Error: "test fails intermittently"

Solution:
- Add explicit waits: cy.get(..., { timeout: 10000 })
- Wait for loading: cy.waitForLoadingComplete()
- Debounce API calls
- Use network stubs for consistency
```

### Debug Mode

```bash
# Run with detailed logging
DEBUG=cypress:* npm run cypress:e2e

# Run single test with debugging
npm run cypress:e2e -- --spec cypress/e2e/llm-integration.cy.ts --headed

# Pause on failure
npm run cypress:e2e -- --headed
# Then click "Pause" when test fails
```

### Browser DevTools

In Cypress UI:
1. Click "Inspect" to open DevTools
2. Pause execution with DevTools debugger
3. Inspect DOM elements
4. Check Network requests
5. Review Console messages

## 📝 Writing New Tests

### Template

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForLoadingComplete();
  });

  it('should do something', () => {
    // Arrange
    cy.openModule('ModuleName');
    
    // Act
    cy.get('[data-cy="button"]').click();
    
    // Assert
    cy.get('[data-cy="result"]').should('be.visible');
  });

  it('should handle errors', () => {
    cy.intercept('GET', '**/api/**', { statusCode: 500 });
    
    cy.get('[data-cy="button"]').click();
    cy.get('[data-cy="error"]').should('contain', 'error');
  });
});
```

### Best Practices

1. **Use data-cy attributes**
   ```typescript
   // Good
   cy.get('[data-cy="submit-button"]').click();
   
   // Avoid
   cy.get('button.submit').click();
   ```

2. **Wait for elements**
   ```typescript
   // Good
   cy.get('[data-cy="result"]', { timeout: 10000 }).should('exist');
   
   // Avoid
   cy.get('[data-cy="result"]').should('exist');
   ```

3. **Use custom commands**
   ```typescript
   // Good
   cy.chatWithLLM('message');
   cy.openModule('ChatIA');
   
   // Avoid
   // ... manual implementation
   ```

4. **Test user behavior**
   ```typescript
   // Good
   cy.get('[data-cy="chat-input"]').type('message');
   cy.get('[data-cy="chat-send"]').click();
   
   // Avoid
   cy.window().then(win => win.chatService.sendMessage());
   ```

## 🎯 Test Execution Strategy

### Local Development
```bash
# Watch mode for development
npm run test:watch

# Quick validation before commit
npm run test:phase3

# Full test suite (hourly)
npm run cypress:e2e
```

### CI/CD Pipeline
```bash
# Pre-commit hook
npm run test:llm && npm run test:certificate

# Pre-push hook
npm run test:phase3

# Pre-release
npm run cypress:e2e
```

### Troubleshooting Pipeline

If tests fail in CI but pass locally:
1. Check Node version matches
2. Verify environment variables
3. Clear npm cache: `npm cache clean --force`
4. Install dependencies fresh: `rm -rf node_modules && npm install`
5. Run with more verbosity: `DEBUG=cypress:* npm run cypress:e2e`

## 📊 Test Reports

### Generate Report

```bash
# JSON report
npm run cypress:e2e -- --reporter json --reporter-options reportDir=cypress/reports,overwrite=true

# HTML report (using mochawesome)
npm run cypress:e2e -- --reporter mochawesome --reporter-options reportDir=cypress/reports

# Terminal report
npm run cypress:e2e -- --reporter spec
```

### View Results

- **Local**: Open `cypress/reports/index.html` in browser
- **CI**: Review in CI dashboard (GitHub Actions, Jenkins, etc.)

## 🚀 Performance Metrics

Target metrics for Phase 3 tests:

```
LLM Integration:
- API Response: < 3 seconds
- Chat display: < 100ms
- Token tracking: < 50ms

Certificate Generation:
- Preview generation: < 2 seconds
- PDF download: < 5 seconds
- Email sending: < 3 seconds

PWA Features:
- Offline load: < 1 second (cached)
- Sync trigger: < 500ms
- IndexedDB write: < 100ms

Overall Test Suite:
- Total execution: < 15 minutes
- Per-test average: < 10 seconds
```

Monitor test execution times:
```bash
npm run cypress:e2e -- --reporter spec | grep "passing"
```

## ✅ Pre-Release Checklist

Before releasing Phase 3:

- [ ] All 150+ tests passing
- [ ] No flaky tests
- [ ] Coverage > 80%
- [ ] Performance metrics met
- [ ] Error handling tested
- [ ] Offline functionality verified
- [ ] Mobile responsiveness checked
- [ ] Accessibility compliant
- [ ] Documentation updated

## 📞 Support

For test-related issues:
1. Check this guide
2. Review test files for similar cases
3. Check Cypress documentation
4. Ask in development team chat

---

**Last Updated**: 2024  
**Maintained by**: SimuVerse QA Team
