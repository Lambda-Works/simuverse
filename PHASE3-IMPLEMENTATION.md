# Phase 3 - Complete Implementation Guide

## 📋 Overview

Phase 3 implements four critical features for the SimuVerse platform:
1. **LLM Integration** - Gemini API with intelligent fallback
2. **Certificate Generation** - Professional PDF with radar charts
3. **PWA Features** - Offline support and background sync
4. **E2E Testing** - Comprehensive Cypress test suite

**Status**: 🟢 Production Ready  
**Total Lines of Code**: 2,500+  
**New Services**: 2  
**New Components**: 2  
**Test Suite**: 150+ test cases

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
cd simuverse-engine
npm install

# Install Cypress for E2E testing
npm install --save-dev cypress
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables**:
```env
# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-1.5-flash
VITE_GEMINI_MAX_TOKENS=2000

# Certificate Issuer Info
VITE_CERTIFICATE_ISSUER_NAME=SimuVerse Academy
VITE_CERTIFICATE_THEME=professional

# PWA
VITE_PWA_ENABLED=true
VITE_CACHE_VERSION=v1

# Backend API
VITE_API_BASE_URL=http://localhost:3000/api
```

**Optional Variables**:
```env
# OpenAI Fallback
VITE_OPENAI_API_KEY=your_openai_key

# Email Configuration
VITE_CERTIFICATE_EMAIL_SERVICE=gmail
VITE_CERTIFICATE_EMAIL_USER=your-email@gmail.com

# Debug
VITE_DEBUG_LOG=false
VITE_TRACK_TOKENS=true
```

### 3. Get API Keys

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy to `.env` as `VITE_GEMINI_API_KEY`

#### OpenAI Key (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy to `.env` as `VITE_OPENAI_API_KEY`

---

## 📚 LLM Integration (ChatService)

### Architecture

```
ChatIAModule (React Component)
    ↓
ChatService (Singleton)
    ├─ Gemini API (Primary)
    ├─ Fallback Patterns (Backup)
    └─ Error Handling
```

### Usage

```typescript
import { chatService } from '@/services/ChatService';

// Generate response
const response = await chatService.generateResponse(
  message,
  conversationHistory,
  familyType // 'RRHH' | 'IT' | 'Administración' | 'Emprendimiento'
);

// Access tokens
console.log(response.tokens); // { input: 120, output: 350 }
```

### System Prompts (4 Family Types)

#### 1. RRHH (Human Resources)
- Focus: Compliance, labor laws, employee relations
- Tone: Empathetic, regulatory-aware
- Use case: HR policies, recruitment, employee development

#### 2. IT (Technology)
- Focus: System architecture, technical depth, scalability
- Tone: Technical, precise, solution-oriented
- Use case: Infrastructure, security, technical decisions

#### 3. Administración (Public Administration)
- Focus: Regulations, public policy, administrative procedures
- Tone: Formal, regulatory, structured
- Use case: Government operations, compliance, procedures

#### 4. Emprendimiento (Entrepreneurship)
- Focus: Business growth, results, market strategy
- Tone: Direct, results-focused, practical
- Use case: Startups, business strategy, innovation

### Fallback Logic

When Gemini API fails:

```
Input: "¿Qué es compliance?"
↓
Pattern Match: compliance, regulación, cumplimiento
↓
Fallback Response: Predefined answer for RRHH family
↓
Display: Response with "fallback" indicator
```

### Error Handling

```typescript
try {
  const response = await chatService.generateResponse(message, history, family);
} catch (error) {
  if (error.type === 'RATE_LIMIT') {
    // Wait and retry
  } else if (error.type === 'INVALID_KEY') {
    // Show setup instructions
  } else if (error.type === 'TIMEOUT') {
    // Use fallback
  }
}
```

### Token Tracking

```
Input Tokens: Words/tokens sent to API
Output Tokens: Words/tokens returned
Total: input + output

Display: "Tokens Used: 120 (in) + 350 (out) = 470 total"
```

---

## 🎓 Certificate Generation

### Architecture

```
StudentCertificate Component
    ↓
CertificateService
    ├─ Canvas Drawing
    ├─ PDF Generation
    ├─ Email Handler
    └─ Theme System
```

### Features

#### 1. Professional Design
- **Dimensions**: 1200x850px (A4 equivalent)
- **Border**: Decorative 8px themed border
- **Header**: Issuer name, certificate title, date
- **Main Content**: Student name, achievement statement
- **Radar Chart**: 5-level competency visualization
- **QR Code**: Verification code
- **Footer**: Signature line, date, verification code

#### 2. Theme System

```typescript
// Available themes
const themes = {
  professional: { primary: '#1e40af', secondary: '#0c4a6e' },
  modern: { primary: '#7c3aed', secondary: '#a78bfa' },
  light: { primary: '#f59e0b', secondary: '#fcd34d' },
  dark: { primary: '#1f2937', secondary: '#374151' }
};
```

#### 3. Radar Chart

Automatically draws 5-level radar for competencies:

```
         TOP (100%)
        /   |   \
    75%/ 5-4-3-2-1 \75%
      /  (levels)   \
    50%/             \50%
    /                 \
   BOTTOM (0%)        
```

### Usage

```typescript
import { certificateService } from '@/services/CertificateService';

// Generate preview
const dataUrl = await certificateService.getPreviewDataUrl(studentData);

// Download
await certificateService.downloadCertificate(
  studentData,
  'certificate-student-001.pdf'
);

// Email
await certificateService.emailCertificate(
  studentData,
  'student@example.com'
);
```

### Student Data Structure

```typescript
interface StudentData {
  id: string;
  name: string;
  email: string;
  course: string;
  family: string;
  score: number;
  completionTime: string; // HH:MM:SS
  completionDate: string; // YYYY-MM-DD
  simulationId: string;
  competencies: {
    [key: string]: number; // 0-100
  };
  actionsLog: Array<{
    timestamp: string;
    action: string;
    details: string;
  }>;
}
```

### Verification

QR Code contains:
```
{
  id: "STU-001",
  verificationCode: "ABC123XYZ789",
  timestamp: 1705318800000,
  issuer: "SimuVerse Academy"
}
```

---

## 🌐 PWA Features (Service Worker)

### Architecture

```
App
 ├─ Service Worker (Registration)
 │   ├─ Cache Management
 │   ├─ Offline Support
 │   └─ Background Sync
 ├─ IndexedDB
 │   ├─ pendingActions
 │   ├─ pendingLogs
 │   └─ cachedData
 └─ useServiceWorker Hook
     ├─ Online/Offline Detection
     ├─ Sync Triggers
     └─ Cache Control
```

### Cache Strategies

#### 1. Network-First (APIs)
```
Try Network → On Success: Cache Result
           → On Failure: Return Cached
```

#### 2. Cache-First (Static Assets)
```
Try Cache → On Miss: Fetch from Network
          → Cache Result
```

### Setup

1. **Register Service Worker** (in `main.tsx`):

```typescript
import { useServiceWorker } from '@/hooks/useServiceWorker';

export function App() {
  const { isOnline, triggerSync } = useServiceWorker();
  
  return (
    <div>
      {!isOnline && <OfflineBanner />}
      {/* App content */}
    </div>
  );
}
```

2. **Manifest** (`public/manifest.json`):

```json
{
  "name": "SimuVerse",
  "short_name": "SimuVerse",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

3. **HTML** (`index.html`):

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
```

### IndexedDB Schema

```typescript
// pendingActions Store
{
  id: "action-1",
  type: "chat_message",
  timestamp: 1705318800000,
  data: { message: "..." },
  synced: false
}

// cachedData Store
{
  key: "student:STU-001",
  value: { /* student data */ },
  expiry: 1705405200000
}
```

### Background Sync

```typescript
// Automatic sync when online restored
if (navigator.serviceWorker.ready && 'SyncManager' in window) {
  registration.sync.register('sync-actions');
  registration.sync.register('sync-logs');
}
```

### Offline UI Components

```typescript
// Offline Banner
<OfflineBanner 
  isOnline={isOnline}
  onSync={triggerSync}
  pendingCount={pendingActionsCount}
/>

// Sync Status
<SyncStatus 
  isSyncing={isSyncing}
  syncComplete={syncComplete}
  error={syncError}
/>
```

---

## 🧪 E2E Testing (Cypress)

### Test Structure

```
cypress/
├── e2e/
│   ├── llm-integration.cy.ts (40 tests)
│   ├── certificate-generation.cy.ts (35 tests)
│   ├── pwa-features.cy.ts (45 tests)
│   └── phase3-integration.cy.ts (30 tests)
├── support/
│   ├── commands.ts (Custom commands)
│   ├── e2e.ts (Setup)
│   └── index.d.ts (Types)
└── fixtures/
    └── phase3-data.json (Test data)
```

### Run Tests

```bash
# Run all E2E tests
npm run cypress:e2e

# Run specific test
npm run cypress:e2e -- --spec cypress/e2e/llm-integration.cy.ts

# Open Cypress UI
npm run cypress:open

# Run with specific environment
VITE_ENV=production npm run cypress:e2e
```

### Test Categories

#### 1. LLM Integration (llm-integration.cy.ts)
- ✅ API response handling
- ✅ Fallback logic
- ✅ Token tracking
- ✅ Error scenarios
- ✅ Offline behavior

**Example Test**:
```typescript
it('should send message and receive LLM response', () => {
  cy.chatWithLLM('¿Cuáles son los pasos para una contratación?');
  cy.get('[data-cy="chat-message"][data-role="assistant"]')
    .should('exist')
    .should('not.contain', 'error');
});
```

#### 2. Certificate Generation (certificate-generation.cy.ts)
- ✅ Preview functionality
- ✅ PDF download
- ✅ Email sending
- ✅ Theme selection
- ✅ Offline caching

**Example Test**:
```typescript
it('should download certificate as PDF', () => {
  cy.get('[data-cy="download-button"]').click();
  cy.get('[data-cy="download-success"]', { timeout: 15000 })
    .should('be.visible');
});
```

#### 3. PWA Features (pwa-features.cy.ts)
- ✅ Service Worker registration
- ✅ Offline mode
- ✅ Background sync
- ✅ Cache strategies
- ✅ IndexedDB operations

**Example Test**:
```typescript
it('should work in offline mode', () => {
  cy.visit('/');
  cy.goOffline();
  cy.reload();
  cy.contains(/SimuVerse|Dashboard/).should('exist');
  cy.goOnline();
});
```

#### 4. Phase 3 Integration (phase3-integration.cy.ts)
- ✅ Full workflow tests
- ✅ Cross-module communication
- ✅ Error recovery
- ✅ Performance scenarios
- ✅ User workflows

**Example Test**:
```typescript
it('should complete full workflow: chat → certificate → offline sync', () => {
  cy.openModule('ChatIA');
  cy.chatWithLLM('¿Cuáles son las mejores prácticas?');
  cy.openModule('Certificates');
  cy.get('[data-cy="preview-button"]').click();
  cy.goOffline();
  // ... verify offline functionality
});
```

### Custom Commands

```typescript
// Login
cy.login('user@example.com', 'password');

// Chat with LLM
cy.chatWithLLM('Your message');

// Generate certificate
cy.generateCertificate();

// Offline/Online
cy.goOffline();
cy.goOnline();

// Load module
cy.openModule('ChatIA');
cy.openModule('Certificates');
```

### Test Data

Use fixtures in `cypress/fixtures/phase3-data.json`:

```typescript
it('should use fixture data', () => {
  cy.fixture('phase3-data').then((data) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('studentData', JSON.stringify(data.studentData));
      }
    });
  });
});
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Gemini API key validated
- [ ] Certificate theme tested
- [ ] Service Worker registration tested
- [ ] All E2E tests passing
- [ ] Error handling verified
- [ ] Offline functionality tested

### Build

```bash
npm run build

# Output: dist/
```

### Production Deployment

```bash
# Verify builds
npm run build
npm run preview

# Deploy to hosting
npm run deploy

# Verify PWA
# 1. Check manifest.json loads
# 2. Service Worker registered
# 3. Offline functionality works
# 4. Certificate generation tested
```

---

## 📊 Monitoring

### Key Metrics to Track

```typescript
// LLM Metrics
- API response time (target: <3s)
- Fallback usage rate (target: <5%)
- Token usage (track costs)
- Error rate by type

// Certificate Metrics
- Generation time (target: <2s)
- Download success rate (target: 99%)
- Theme popularity
- Email delivery rate

// PWA Metrics
- Offline session duration
- Sync success rate (target: 99%)
- Cache hit rate (target: >90%)
- IndexedDB size usage

// Testing Metrics
- Test pass rate (target: 100%)
- Test coverage (target: >80%)
- Performance (target: <5s per test)
```

### Error Tracking

Configure error logging:

```typescript
// In ChatService
catch (error) {
  logError('LLM_API_ERROR', {
    type: error.type,
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

// In CertificateService
catch (error) {
  logError('CERTIFICATE_ERROR', {
    studentId: studentData.id,
    step: 'generation',
    error: error.message
  });
}
```

---

## 🐛 Troubleshooting

### LLM Issues

**Problem**: API key error
```
Solution: Verify VITE_GEMINI_API_KEY in .env
         Check key has correct permissions
         Try regenerating key
```

**Problem**: Timeout errors
```
Solution: Check network connection
         Increase VITE_GEMINI_MAX_TOKENS
         Use fallback (happens automatically)
```

**Problem**: Rate limiting
```
Solution: Implement request throttling
         Cache responses
         Use fallback responses
```

### Certificate Issues

**Problem**: QR code not visible
```
Solution: Verify canvas context initialization
         Check theme colors have sufficient contrast
         Test with different browsers
```

**Problem**: PDF not downloading
```
Solution: Check browser download settings
         Verify filename is valid
         Check storage space
```

### PWA Issues

**Problem**: Service Worker not registering
```
Solution: Check HTTPS (required for SW)
         Verify manifest.json exists
         Clear browser cache
```

**Problem**: Offline data not syncing
```
Solution: Check IndexedDB storage limits
         Verify background sync permission
         Check network connectivity
```

---

## 📈 Performance Optimization

### LLM

```typescript
// Cache responses
const responseCache = new Map();

// Reuse connections
const geminiClient = new Gemini({ connection: 'keep-alive' });

// Stream responses
await chatService.generateResponse(message, history, family, {
  stream: true,
  onChunk: (chunk) => updateUI(chunk)
});
```

### Certificates

```typescript
// Cache canvas drawings
const canvasCache = new Map();

// Lazy load theme
const theme = await loadTheme(themeName);

// Optimize PDF size
canvas.toDataURL('image/jpeg', 0.8); // Compression
```

### PWA

```typescript
// Efficient caching
const CACHE_VERSION = 'v1';
const MAX_CACHE_SIZE = 500; // MB

// Compress IndexedDB
const blob = new Blob([data], { type: 'application/json' });

// Batch sync
setTimeout(() => syncAll(), 1000); // Debounce
```

---

## 📞 Support & Resources

### Documentation
- [Gemini API Docs](https://ai.google.dev/)
- [OpenAI Docs](https://platform.openai.com/docs)
- [Cypress Docs](https://docs.cypress.io)
- [Service Worker MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Common Issues Forum
- Check Phase 3 Issues Tracker
- Review error logs in browser console
- Test with fixtures in Cypress

### Team Contact
- Backend: [contact info]
- Frontend: [contact info]
- DevOps: [contact info]

---

## ✅ Completion Checklist

Phase 3 is complete when:

- [x] ChatService integrated and tested
- [x] ChatIAModule using real LLM
- [x] CertificateService fully functional
- [x] StudentCertificate component integrated
- [x] Service Worker registered and tested
- [x] PWA features working offline
- [x] All Cypress tests passing (150+)
- [x] Error handling implemented
- [x] Documentation complete
- [x] Performance benchmarks met

---

**Last Updated**: 2024  
**Version**: 1.0  
**Maintained by**: SimuVerse Development Team
