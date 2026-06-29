import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { GlobalStatsController } from './global-stats.controller';
import { AccessRequestsController } from './access-requests.controller';
import { TeacherGroupsController } from './teacher-groups.controller';
import { RequestAccessController } from './request-access.controller';
import { AdminService } from './admin.service';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [AdminController, GlobalStatsController, AccessRequestsController, TeacherGroupsController, RequestAccessController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
