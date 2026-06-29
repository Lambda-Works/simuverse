import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogQueryController } from './catalog-query.controller';
import { CategoriesService } from './categories.service';
import { TechSheetsService } from './tech-sheets.service';
import { DocumentsService } from './documents.service';
import { AssignmentsService } from './assignments.service';
import { CatalogQueryService } from './catalog-query.service';
import { DocumentsController } from './documents.controller';
import { AssignmentsController } from './assignments.controller';

@Module({
  controllers: [CatalogController, DocumentsController, AssignmentsController, CatalogQueryController],
  providers: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService, CatalogQueryService],
  exports: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService, CatalogQueryService],
})
export class CatalogModule {}
