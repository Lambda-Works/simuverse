import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['student', 'teacher', 'admin', 'ministerio'] as const)
  role?: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @IsOptional()
  @IsInt()
  termsVersionId?: number;
}

class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

class AcceptTermsDto {
  @IsInt()
  termsVersionId: number;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      dto.email,
      dto.password,
      dto.recaptchaToken,
      req.ip,
    );
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Get('terms/current')
  async currentTerms() {
    const terms = await this.authService.getCurrentTerms();
    if (!terms) return null;
    return {
      id: terms.id,
      version: terms.version,
      title: terms.title,
      content: terms.content,
      published_at: terms.published_at,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(@CurrentUser('id') userId: string) {
    return this.authService.syncFromToken(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept-terms')
  @HttpCode(HttpStatus.OK)
  async acceptTerms(
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptTermsDto,
  ) {
    return this.authService.acceptTerms(userId, dto.termsVersionId);
  }
}
