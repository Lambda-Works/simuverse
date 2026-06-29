import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { SimulationsModule } from './simulations/simulations.module';
import { CatalogModule } from './catalog/catalog.module';
import { AssessmentsModule } from './assessments/assessments.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CoursesModule, ScenariosModule, SimulationsModule, CatalogModule, AssessmentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
