import {
  isPlaceholderFirebaseCredential,
  resolveFirebaseCredentials,
} from './firebase-credentials';

describe('firebase-credentials', () => {
  const envKeys = [
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ] as const;

  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of envKeys) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it('detects .env.example-style placeholder private keys', () => {
    expect(
      isPlaceholderFirebaseCredential(
        'simuverse-dev',
        'firebase-adminsdk-xxxxx@simuverse-dev.iam.gserviceaccount.com',
        '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
      ),
    ).toBe(true);
  });

  it('returns null for placeholder env vars so API can boot without Firebase', () => {
    process.env.FIREBASE_PROJECT_ID = 'simuverse-dev';
    process.env.FIREBASE_CLIENT_EMAIL =
      'firebase-adminsdk-xxxxx@simuverse-dev.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"';

    expect(resolveFirebaseCredentials()).toBeNull();
  });

  it('returns null when service-account path is missing or empty', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH =
      '/run/secrets/firebase-service-account.json';
    expect(resolveFirebaseCredentials()).toBeNull();
  });

  it('accepts a long-looking PEM when fields are not placeholders', () => {
    const body = 'A'.repeat(100);
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;

    expect(
      isPlaceholderFirebaseCredential(
        'simuverse-dev',
        'firebase-adminsdk@simuverse-dev.iam.gserviceaccount.com',
        privateKey,
      ),
    ).toBe(false);
  });
});
