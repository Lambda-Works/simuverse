import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

class UpsertTermsDto {
  @IsString()
  @MinLength(1)
  version: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

@Controller('terms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TermsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('current')
  async current() {
    const terms = await this.prisma.termsVersion.findFirst({
      where: { is_current: true },
      orderBy: { published_at: 'desc' },
    });
    if (!terms) return null;
    return {
      id: terms.id,
      version: terms.version,
      title: terms.title,
      content: terms.content,
      published_at: terms.published_at,
    };
  }

  @Get()
  @Roles('admin')
  async list() {
    return this.prisma.termsVersion.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: UpsertTermsDto) {
    if (dto.publish) {
      await this.prisma.termsVersion.updateMany({
        data: { is_current: false },
      });
    }

    return this.prisma.termsVersion.create({
      data: {
        version: dto.version,
        title: dto.title,
        content: dto.content,
        is_current: !!dto.publish,
        published_at: dto.publish ? new Date() : null,
      },
    });
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertTermsDto,
  ) {
    const existing = await this.prisma.termsVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Terms version not found');

    if (dto.publish) {
      await this.prisma.termsVersion.updateMany({
        data: { is_current: false },
      });
    }

    return this.prisma.termsVersion.update({
      where: { id },
      data: {
        version: dto.version,
        title: dto.title,
        content: dto.content,
        ...(dto.publish
          ? { is_current: true, published_at: new Date() }
          : {}),
      },
    });
  }

  @Post(':id/publish')
  @Roles('admin')
  async publish(@Param('id', ParseIntPipe) id: number) {
    const existing = await this.prisma.termsVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Terms version not found');

    await this.prisma.termsVersion.updateMany({ data: { is_current: false } });
    return this.prisma.termsVersion.update({
      where: { id },
      data: { is_current: true, published_at: new Date() },
    });
  }
}
