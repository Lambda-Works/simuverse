import { Module } from '@nestjs/common';
import { TermsController } from './terms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TermsController],
})
export class TermsModule {}
