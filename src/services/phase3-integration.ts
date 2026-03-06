/**
 * Phase 3 Integration Script
 * Adds StudentCertificate component to DynamicWorkbench
 * Run this to integrate certificate module into main workbench
 */

export const createCertificateModule = () => ({
  id: 'certificates',
  name: 'Certificados',
  description: 'Genera y descarga certificados de simulación profesionales',
  icon: 'Award',
  component: 'StudentCertificate',
  enabled: true,
  order: 4,
  metadata: {
    version: '1.0',
    requires: ['ChatIA'], // Requires chat history for competencies
    offline: true,
    requiresAuth: true
  }
});

/**
 * Service Worker Initialization
 * Add this to your main.tsx or App.tsx
 */
export const initializeServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service Worker registered:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[PWA] New version available, prompt user to update');
            // Show update notification to user
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
};

/**
 * ChatService Initialization
 * Call this in your app initialization
 */
export const initializeLLMService = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[LLM] No API key found. Using fallback mode.');
    return false;
  }

  try {
    // Test API key validity
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'test' }]
        }]
      })
    });

    if (response.ok) {
      console.log('[LLM] API key validated');
      return true;
    } else {
      console.warn('[LLM] API key invalid or rate limited');
      return false;
    }
  } catch (error) {
    console.warn('[LLM] API validation failed:', error);
    return false;
  }
};

/**
 * Integration Checklist
 * Use this to verify all Phase 3 components are properly integrated
 */
export const phase3IntegrationChecklist = {
  llmIntegration: {
    completed: false,
    checks: [
      '✓ ChatService created',
      '? ChatIAModule updated to use ChatService',
      '? VITE_GEMINI_API_KEY configured',
      '? Fallback responses tested',
      '? Token tracking working'
    ]
  },
  certificateGeneration: {
    completed: false,
    checks: [
      '✓ CertificateService created',
      '✓ StudentCertificate component created',
      '? Component integrated into DynamicWorkbench',
      '? Theme system tested',
      '? PDF generation tested',
      '? Email functionality working'
    ]
  },
  pwaFeatures: {
    completed: false,
    checks: [
      '✓ Service Worker created',
      '✓ useServiceWorker hook created',
      '? Service Worker registered in app',
      '? Offline caching working',
      '? Background sync implemented',
      '? IndexedDB storage tested'
    ]
  },
  e2eTestSuite: {
    completed: false,
    checks: [
      '✓ Cypress configured',
      '✓ Test files created (150+ tests)',
      '✓ Custom commands implemented',
      '? All tests passing locally',
      '? CI/CD pipeline running tests',
      '? Coverage > 80%'
    ]
  },
  documentation: {
    completed: false,
    checks: [
      '✓ Phase 3 Implementation Guide',
      '✓ Testing Guide',
      '✓ .env.example created',
      '? Code comments completed',
      '? API documentation updated',
      '? User guide prepared'
    ]
  }
};

/**
 * Environment Setup Validator
 * Checks if all required env variables are set
 */
export const validateEnvironment = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required for LLM
  if (!import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_OPENAI_API_KEY) {
    warnings.push('No LLM API key configured - using fallback mode');
  }

  // Required for Certificates
  if (!import.meta.env.VITE_CERTIFICATE_ISSUER_NAME) {
    warnings.push('Certificate issuer name not configured - using default');
  }

  // Required for PWA
  if (!import.meta.env.VITE_PWA_ENABLED) {
    warnings.push('PWA disabled in configuration');
  }

  // Required for Backend
  if (!import.meta.env.VITE_API_BASE_URL) {
    errors.push('VITE_API_BASE_URL not configured');
  }

  // Optional but recommended
  if (import.meta.env.PROD && !import.meta.env.VITE_DEBUG_LOG === false) {
    warnings.push('Debug logging enabled in production - consider disabling');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Quick Integration Steps
 * Follow these steps to integrate Phase 3 into existing codebase
 */
export const quickIntegrationSteps = [
  {
    step: 1,
    title: 'Environment Setup',
    description: 'Copy .env.example to .env and configure variables',
    command: 'cp .env.example .env',
    estimated_time: '5 minutes'
  },
  {
    step: 2,
    title: 'Service Worker Registration',
    description: 'Add useServiceWorker hook to main App component',
    code: `
      import { useServiceWorker } from '@/hooks/useServiceWorker';
      
      export function App() {
        const { isOnline } = useServiceWorker();
        
        return (
          <div>
            {!isOnline && <OfflineBanner />}
            {/* App content */}
          </div>
        );
      }
    `,
    estimated_time: '10 minutes'
  },
  {
    step: 3,
    title: 'Add Certificate Module',
    description: 'Integrate StudentCertificate into DynamicWorkbench',
    code: `
      import { StudentCertificate } from '@/components/StudentCertificate';
      import { createCertificateModule } from '@/services/phase3-integration';
      
      const modules = [
        // ... existing modules
        createCertificateModule()
      ];
    `,
    estimated_time: '15 minutes'
  },
  {
    step: 4,
    title: 'Verify LLM Integration',
    description: 'Test ChatService and ChatIAModule integration',
    command: 'npm run dev && navigate to ChatIA module',
    estimated_time: '10 minutes'
  },
  {
    step: 5,
    title: 'Run Tests',
    description: 'Execute full test suite to verify everything works',
    command: 'npm run cypress:e2e',
    estimated_time: '15 minutes'
  },
  {
    step: 6,
    title: 'Deploy',
    description: 'Build and deploy to production',
    command: 'npm run build && deploy',
    estimated_time: '20 minutes'
  }
];

/**
 * Troubleshooting Helper
 * Common issues and solutions
 */
export const troubleshootingGuide = {
  'Service Worker not registering': {
    cause: 'Likely missing HTTPS in production or manifest.json',
    solutions: [
      'Ensure HTTPS is enabled',
      'Verify /manifest.json exists',
      'Check browser console for errors',
      'Clear browser cache',
      'Disable browser extensions'
    ]
  },
  'LLM API timeout': {
    cause: 'Network issues or API overload',
    solutions: [
      'Check network connection',
      'Verify API key is valid',
      'Increase timeout value',
      'Use fallback mode',
      'Check API rate limits'
    ]
  },
  'Certificate PDF not generating': {
    cause: 'Canvas API issue or missing data',
    solutions: [
      'Verify student data is complete',
      'Check canvas context initialization',
      'Test with different browser',
      'Check browser console for errors',
      'Verify competency data format'
    ]
  },
  'Offline mode not working': {
    cause: 'Service Worker not active or IndexedDB issues',
    solutions: [
      'Verify Service Worker is registered',
      'Check IndexedDB storage limits',
      'Clear browser cache',
      'Check DevTools > Application > Service Workers',
      'Verify HTTPS'
    ]
  },
  'Tests failing intermittently': {
    cause: 'Timing issues or async operations',
    solutions: [
      'Increase Cypress timeout',
      'Add explicit waits',
      'Use cy.waitForLoadingComplete()',
      'Check network mocking',
      'Run tests with --headed flag'
    ]
  }
};

/**
 * Performance Monitoring
 * Track Phase 3 metrics
 */
export const setupPerformanceMonitoring = () => {
  // LLM Metrics
  if (window.performance && window.performance.mark) {
    // Mark LLM API calls
    window.addEventListener('llm:request', () => {
      performance.mark('llm-api-start');
    });

    window.addEventListener('llm:response', () => {
      performance.mark('llm-api-end');
      performance.measure('llm-api', 'llm-api-start', 'llm-api-end');
    });
  }

  // Certificate Metrics
  if (window.performance && window.performance.mark) {
    window.addEventListener('certificate:generate', () => {
      performance.mark('cert-gen-start');
    });

    window.addEventListener('certificate:complete', () => {
      performance.mark('cert-gen-end');
      performance.measure('cert-generation', 'cert-gen-start', 'cert-gen-end');
    });
  }

  // PWA Metrics
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      console.log('[Metrics] Service Worker ready');
    });
  }
};

/**
 * Export all helpers
 */
export default {
  createCertificateModule,
  initializeServiceWorker,
  initializeLLMService,
  phase3IntegrationChecklist,
  validateEnvironment,
  quickIntegrationSteps,
  troubleshootingGuide,
  setupPerformanceMonitoring
};
