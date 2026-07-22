import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        firebase_uid: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  /** Internal use only — returns password_hash for auth verification / migration. */
  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password_hash: true,
        firebase_uid: true,
        is_active: true,
      },
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firebase_uid: true,
        is_active: true,
        created_at: true,
        updated_at: true,
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
        firebase_uid: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOrCreateFromFirebase(data: {
    firebaseUid: string;
    email: string;
    name: string;
    role?: string;
  }) {
    const byUid = await this.findByFirebaseUid(data.firebaseUid);
    if (byUid) return byUid;

    if (data.email) {
      const byEmail = await this.findByEmail(data.email);
      if (byEmail) {
        return this.prisma.user.update({
          where: { id: byEmail.id },
          data: { firebase_uid: data.firebaseUid },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firebase_uid: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          },
        });
      }
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        firebase_uid: data.firebaseUid,
        role: data.role || 'student',
        password_hash: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firebase_uid: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async create(data: {
    email: string;
    password_hash?: string | null;
    name: string;
    role?: string;
    firebase_uid?: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash ?? null,
        name: data.name,
        role: data.role || 'student',
        firebase_uid: data.firebase_uid ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firebase_uid: true,
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

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      password_hash?: string | null;
      firebase_uid?: string | null;
    },
  ) {
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

  async hardDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.is_active) throw new BadRequestException('Solo se pueden eliminar usuarios desactivados');

    return this.prisma.user.delete({ where: { id } });
  }
}
