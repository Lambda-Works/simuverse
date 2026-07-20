import { NotFoundException } from '@nestjs/common';
import { SponsorsService } from './sponsors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SponsorsService', () => {
  let service: SponsorsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      sponsor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new SponsorsService(prisma as PrismaService);
  });

  it('findAll orders by name', async () => {
    prisma.sponsor.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(prisma.sponsor.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('findOne throws NotFoundException for a missing sponsor', async () => {
    prisma.sponsor.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('create passes the dto straight to prisma', async () => {
    const dto = { name: 'Acme', website: 'https://acme.com' };
    prisma.sponsor.create.mockResolvedValue({ id: 1, ...dto, is_active: true });
    await service.create(dto);
    expect(prisma.sponsor.create).toHaveBeenCalledWith({ data: dto });
  });

  it('remove soft-deletes by setting is_active false', async () => {
    prisma.sponsor.update.mockResolvedValue({ id: 1, is_active: false });
    await service.remove(1);
    expect(prisma.sponsor.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { is_active: false } });
  });

  it('remove maps a P2025 prisma error to NotFoundException', async () => {
    prisma.sponsor.update.mockRejectedValue({ code: 'P2025' });
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });

  it('reactivate sets is_active true', async () => {
    prisma.sponsor.update.mockResolvedValue({ id: 1, is_active: true });
    await service.reactivate(1);
    expect(prisma.sponsor.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { is_active: true } });
  });
});
