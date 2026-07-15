import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { RecaptchaService } from './recaptcha.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseAdmin: FirebaseAdminService,
    private recaptcha: RecaptchaService,
    private prisma: PrismaService,
  ) {}

  /**
   * Register via backend: verify captcha → create Firebase user → create local user → accept terms.
   * Client then signs in with Firebase SDK.
   */
  async register(
    data: {
      email: string;
      password: string;
      name: string;
      role?: string;
      recaptchaToken?: string;
      acceptTerms?: boolean;
      termsVersionId?: number;
    },
    remoteIp?: string,
  ) {
    await this.recaptcha.verify(data.recaptchaToken, remoteIp);

    const currentTerms = await this.getCurrentTerms();
    if (currentTerms) {
      if (!data.acceptTerms) {
        throw new BadRequestException('Terms and conditions must be accepted');
      }
      if (!data.termsVersionId || data.termsVersionId !== currentTerms.id) {
        throw new BadRequestException('Terms version is outdated; refresh and accept again');
      }
    }

    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    let firebaseUid: string | null = null;

    if (this.firebaseAdmin.isConfigured) {
      const existingFb = await this.firebaseAdmin.getUserByEmail(data.email);
      if (existingFb) {
        throw new ConflictException('Email already registered');
      }
      const fbUser = await this.firebaseAdmin.createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      });
      firebaseUid = fbUser.uid;
    }

    // Test/dev without Firebase: keep bcrypt hash for JWT fallback login
    const passwordHash =
      !this.firebaseAdmin.isConfigured
        ? await bcrypt.hash(data.password, 10)
        : null;

    const user = await this.usersService.create({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      role: data.role || 'student',
      firebase_uid: firebaseUid,
    });

    if (currentTerms) {
      await this.prisma.userTermsAcceptance.create({
        data: {
          user_id: user.id,
          terms_version_id: currentTerms.id,
        },
      });
    }

    // JWT fallback for tests without Firebase client
    if (!this.firebaseAdmin.isConfigured || process.env.AUTH_TEST_MODE === 'jwt') {
      return this.generateTokens(user.id, user.email, user.role);
    }

    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      requiresFirebaseSignIn: true,
    };
  }

  /**
   * Legacy password login — only when Firebase is not configured (tests/local).
   * Production login happens on the client via Firebase SDK.
   */
  async login(
    email: string,
    password: string,
    recaptchaToken?: string,
    remoteIp?: string,
  ) {
    await this.recaptcha.verify(recaptchaToken, remoteIp);

    if (this.firebaseAdmin.isConfigured && process.env.AUTH_TEST_MODE !== 'jwt') {
      throw new BadRequestException(
        'Use Firebase Authentication on the client; then call GET /auth/me with the ID token',
      );
    }

    const user = await this.usersService.findByEmailForAuth(email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  /** After Firebase client sign-in: sync profile + terms status. */
  async syncFromToken(userId: string) {
    return this.getProfile(userId);
  }

  async refresh(refreshToken: string) {
    // Kept for JWT test fallback only
    if (this.firebaseAdmin.isConfigured && process.env.AUTH_TEST_MODE !== 'jwt') {
      throw new BadRequestException(
        'Token refresh is handled by the Firebase client SDK',
      );
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentTerms = await this.getCurrentTerms();
    let termsAccepted = true;
    let currentTermsVersion: { id: number; version: string; title: string; content: string } | null =
      null;

    if (currentTerms) {
      currentTermsVersion = {
        id: currentTerms.id,
        version: currentTerms.version,
        title: currentTerms.title,
        content: currentTerms.content,
      };
      const acceptance = await this.prisma.userTermsAcceptance.findUnique({
        where: {
          user_id_terms_version_id: {
            user_id: userId,
            terms_version_id: currentTerms.id,
          },
        },
      });
      termsAccepted = !!acceptance;
    }

    return {
      ...user,
      terms_accepted: termsAccepted,
      current_terms: currentTermsVersion,
    };
  }

  async acceptTerms(userId: string, termsVersionId: number) {
    const current = await this.getCurrentTerms();
    if (!current || current.id !== termsVersionId) {
      throw new BadRequestException('Invalid or outdated terms version');
    }

    await this.prisma.userTermsAcceptance.upsert({
      where: {
        user_id_terms_version_id: {
          user_id: userId,
          terms_version_id: termsVersionId,
        },
      },
      create: { user_id: userId, terms_version_id: termsVersionId },
      update: { accepted_at: new Date() },
    });

    return this.getProfile(userId);
  }

  async getCurrentTerms() {
    return this.prisma.termsVersion.findFirst({
      where: { is_current: true },
      orderBy: { published_at: 'desc' },
    });
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      token: accessToken,
      refreshToken: refreshToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: userId, email, role },
    };
  }
}
