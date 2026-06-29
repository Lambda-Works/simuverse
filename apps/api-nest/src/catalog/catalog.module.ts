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
import { SimulatedCompaniesController } from './simulated-companies.controller';
import { StudentAssignmentsController } from './student-assignments.controller';
import {
  FoundationConfigController,
  EndorsersController,
  CourseEndorsersController,
  LegajoController,
  SimulationSessionsController,
  CertificatesController,
} from './missing-controllers';

@Module({
  controllers: [
    CatalogController,
    DocumentsController,
    AssignmentsController,
    CatalogQueryController,
    SimulatedCompaniesController,
    StudentAssignmentsController,
    FoundationConfigController,
    EndorsersController,
    CourseEndorsersController,
    LegajoController,
    SimulationSessionsController,
    CertificatesController,
  ],
  providers: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService, CatalogQueryService],
  exports: [CategoriesService, TechSheetsService, DocumentsService, AssignmentsService, CatalogQueryService],
})
export class CatalogModule {}
