import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseStrategy } from './strategies/firebase.strategy';
import { FirebaseAdminService } from './firebase-admin.service';
import { RecaptchaService } from './recaptcha.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseStrategy,
    FirebaseAdminService,
    RecaptchaService,
  ],
  exports: [AuthService, FirebaseAdminService, RecaptchaService],
})
export class AuthModule {}
