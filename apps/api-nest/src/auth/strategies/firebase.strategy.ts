import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import * as jwt from 'jsonwebtoken';
import { FirebaseAdminService } from '../firebase-admin.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private firebaseAdmin: FirebaseAdminService,
    private usersService: UsersService,
  ) {
    super();
  }

  async validate(req: Request) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    // Unit/e2e tests and local without Firebase: HS256 JWT fallback
    const useJwtFallback =
      !this.firebaseAdmin.isConfigured ||
      process.env.AUTH_TEST_MODE === 'jwt' ||
      process.env.NODE_ENV === 'test';

    if (useJwtFallback) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as {
          sub: string;
          email?: string;
          role?: string;
        };
        const user = await this.usersService.findById(payload.sub);
        if (!user || (user as any).is_active === false) {
          throw new UnauthorizedException();
        }
        return { sub: user.id, id: user.id, email: user.email, role: user.role };
      } catch {
        throw new UnauthorizedException('Invalid token');
      }
    }

    try {
      const decoded = await this.firebaseAdmin.verifyIdToken(token);
      const user = await this.usersService.findOrCreateFromFirebase({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        name: (decoded.name as string) || decoded.email?.split('@')[0] || 'Usuario',
      });
      if (!user.is_active) {
        throw new UnauthorizedException('User is inactive');
      }
      return { sub: user.id, id: user.id, email: user.email, role: user.role };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
