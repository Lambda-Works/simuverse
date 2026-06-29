import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Students can only view themselves
    if (currentUserRole === 'student' && currentUserId !== id) {
      throw new ForbiddenException('Students can only view their own profile');
    }
    return this.usersService.findByIdPublic(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Students can only update themselves
    if (currentUserRole === 'student' && currentUserId !== id) {
      throw new ForbiddenException('Students can only update their own profile');
    }

    const updateData: any = { ...dto };
    if (dto.password) {
      const bcrypt = await import('bcrypt');
      updateData.password_hash = await bcrypt.hash(dto.password, 10);
      delete updateData.password;
    }

    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
