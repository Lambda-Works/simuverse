import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { GlobalStatsController } from './global-stats.controller';
import { AccessRequestsController } from './access-requests.controller';
import { TeacherGroupsController } from './teacher-groups.controller';
import { AdminService } from './admin.service';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [AdminController, GlobalStatsController, AccessRequestsController, TeacherGroupsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
