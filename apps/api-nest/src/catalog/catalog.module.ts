import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CategoriesService } from './categories.service';
import { TechSheetsService } from './tech-sheets.service';
import { DocumentsService } from './documents.service';
import { AssignmentsService } from './assignments.service';
import { DocumentsController } from './documents.controller';
import { AssignmentsController } from './assignments.controller';

@Module({
  controllers: [CatalogController, DocumentsController, AssignmentsController],
  providers: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService],
  exports: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService],
})
export class CatalogModule {}
