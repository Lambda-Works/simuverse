import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /** Internal use only — returns password_hash for auth verification. */
  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password_hash: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async create(data: { email: string; password_hash: string; name: string; role?: string }) {
    return this.prisma.user.create({
      data: data as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });
  }

  async findAll(role?: string) {
    const where = role ? { role: role as any } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByIdPublic(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, data: { name?: string; email?: string; role?: string; password_hash?: string }) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: data as any,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { is_active: false },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundException('User not found');
      throw error;
    }
  }

  async reactivate(id: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { is_active: true },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundException('User not found');
      throw error;
    }
  }
}
