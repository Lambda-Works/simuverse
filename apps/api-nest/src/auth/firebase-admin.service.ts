import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { resolveFirebaseCredentials } from './firebase-credentials';

/**
 * Firebase Admin wrapper. Uses dynamic imports so Jest unit tests that boot
 * AppModule without Firebase still work (jose ESM in firebase-admin breaks CJS Jest).
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private configured = false;

  async onModuleInit() {
    const credentials = resolveFirebaseCredentials();

    if (!credentials) {
      this.logger.warn(
        'Firebase Admin not configured (set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_*). Auth will use JWT_SECRET fallback for tests/dev.',
      );
      return;
    }

    try {
      const { cert, getApps, initializeApp } = await import('firebase-admin/app');
      if (!getApps().length) {
        initializeApp({
          credential: cert(credentials),
        });
      }
      this.configured = true;
      this.logger.log(`Firebase Admin initialized for project ${credentials.projectId}`);
    } catch (err: any) {
      // Never crash API boot on bad/placeholder credentials (e.g. CI using .env.example).
      this.logger.warn(
        `Firebase Admin init failed (${err?.message || err}). Auth will use JWT_SECRET fallback.`,
      );
      this.configured = false;
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  private async auth() {
    if (!this.configured) {
      throw new Error('Firebase Admin is not configured');
    }
    const { getAuth } = await import('firebase-admin/auth');
    return getAuth();
  }

  async verifyIdToken(idToken: string) {
    return (await this.auth()).verifyIdToken(idToken);
  }

  async createUser(params: {
    email: string;
    password: string;
    displayName: string;
    uid?: string;
  }) {
    return (await this.auth()).createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
      uid: params.uid,
      emailVerified: false,
    });
  }

  async getUserByEmail(email: string) {
    try {
      return await (await this.auth()).getUserByEmail(email);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') return null;
      throw err;
    }
  }

  async importUsersWithBcrypt(
    users: Array<{
      uid: string;
      email: string;
      displayName: string;
      passwordHash: Buffer;
    }>,
  ) {
    const importUsers = users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      passwordHash: u.passwordHash,
      emailVerified: true,
    }));

    return (await this.auth()).importUsers(importUsers, {
      hash: { algorithm: 'BCRYPT' },
    });
  }
}
