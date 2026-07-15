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
    if (!fs.existsSync(resolved)) {
      throw new Error(`Firebase service account file not found: ${resolved}`);
    }

    const json = JSON.parse(fs.readFileSync(resolved, 'utf8')) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (!json.project_id || !json.client_email || !json.private_key) {
      throw new Error(`Invalid Firebase service account JSON: ${resolved}`);
    }

    return {
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key,
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    return { projectId, clientEmail, privateKey };
  }

  return null;
}
