import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../database/connection';

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface TokenPayload {
  user_id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private userRepository: Repository<User>;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly BCRYPT_ROUNDS = 10;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: payload.email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const password_hash = await bcrypt.hash(payload.password, this.BCRYPT_ROUNDS);

    const newUser = this.userRepository.create({
      email: payload.email,
      password_hash: password_hash,
      name: payload.name,
      role: payload.role || UserRole.STUDENT,
      is_active: true
    });

    const savedUser = await this.userRepository.save(newUser);

    const token = this.generateAccessToken({
      user_id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    });

    // Remove sensitive data before returning
    const userResponse = {
      ...savedUser,
      password_hash: undefined
    } as any;

    return { user: userResponse, token };
  }

  async login(payload: LoginPayload): Promise<{ user: User; token: string; refreshToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email: payload.email }
    });

    if (!user || !user.is_active) {
      throw new Error('Invalid credentials or account disabled');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date();
    await this.userRepository.save(user);

    const token = this.generateAccessToken({
      user_id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = this.generateRefreshToken({
      user_id: user.id,
      email: user.email,
      role: user.role
    });

    const userResponse = {
      ...user,
      password_hash: undefined
    } as any;

    return { user: userResponse, token, refreshToken };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as TokenPayload;

      const user = await this.userRepository.findOne({
        where: { id: decoded.user_id }
      });

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const newToken = this.generateAccessToken({
        user_id: user.id,
        email: user.email,
        role: user.role
      });

      const newRefreshToken = this.generateRefreshToken({
        user_id: user.id,
        email: user.email,
        role: user.role
      });

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserById(user_id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: user_id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });
  }

  private generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRY });
  }
}
