import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Firebase Admin wrapper. Uses dynamic imports so Jest unit tests that boot
 * AppModule without Firebase still work (jose ESM in firebase-admin breaks CJS Jest).
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private configured = false;

  async onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase Admin not configured (missing FIREBASE_*). Auth will use JWT_SECRET fallback for tests/dev.',
      );
      return;
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    this.configured = true;
    this.logger.log(`Firebase Admin initialized for project ${projectId}`);
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
