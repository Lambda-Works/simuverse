import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { GlobalStatsController } from './global-stats.controller';
import { TeacherGroupsController } from './teacher-groups.controller';
import { AdminService } from './admin.service';
import { CoursesModule } from '../courses/courses.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [CoursesModule, RbacModule],
  controllers: [AdminController, GlobalStatsController, TeacherGroupsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
