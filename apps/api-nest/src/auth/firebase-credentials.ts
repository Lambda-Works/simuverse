import * as fs from 'fs';
import * as path from 'path';

export interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function resolveCredentialPath(pathEnv: string): string {
  if (path.isAbsolute(pathEnv)) {
    return pathEnv;
  }

  const candidates = [
    path.resolve(process.cwd(), pathEnv),
    path.resolve(process.cwd(), '../..', pathEnv),
    path.resolve(process.cwd(), '../../..', pathEnv),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), pathEnv);
}

/**
 * True when env values look like .env.example placeholders, not real credentials.
 * CI copies .env.example → .env; treating placeholders as "unset" avoids boot crashes.
 */
export function isPlaceholderFirebaseCredential(
  projectId: string,
  clientEmail: string,
  privateKey: string,
): boolean {
  const key = privateKey.trim();
  if (
    key.includes('...') ||
    key.includes('YOUR_') ||
    key.includes('your_') ||
    !key.includes('BEGIN PRIVATE KEY') ||
    !key.includes('END PRIVATE KEY')
  ) {
    return true;
  }

  if (
    clientEmail.includes('xxxxx') ||
    clientEmail.includes('example.com') ||
    projectId.includes('your-') ||
    projectId === 'your_project_id'
  ) {
    return true;
  }

  // Real PEM bodies are long; placeholder keys are short even after \n expansion.
  const body = key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  return body.length < 80;
}

/**
 * Firebase Admin credentials from:
 * 1) FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS (JSON file), or
 * 2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (Hub per-key env).
 */
export function resolveFirebaseCredentials(): FirebaseServiceAccount | null {
  const pathEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (pathEnv) {
    const resolved = resolveCredentialPath(pathEnv);
    try {
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        const raw = fs.readFileSync(resolved, 'utf8').trim();
        if (raw) {
          const json = JSON.parse(raw) as {
            project_id?: string;
            client_email?: string;
            private_key?: string;
          };

          if (json.project_id && json.client_email && json.private_key) {
            if (
              !isPlaceholderFirebaseCredential(
                json.project_id,
                json.client_email,
                json.private_key,
              )
            ) {
              return {
                projectId: json.project_id,
                clientEmail: json.client_email,
                privateKey: json.private_key,
              };
            }
          }
        }
      }
      // Missing/empty/invalid mounted file → fall through to FIREBASE_* env vars.
    } catch {
      // Unreadable JSON → fall through to FIREBASE_* env vars.
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Strip wrapping quotes that some env loaders leave in place.
    privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

    if (isPlaceholderFirebaseCredential(projectId, clientEmail, privateKey)) {
      return null;
    }

    return { projectId, clientEmail, privateKey };
  }

  return null;
}
