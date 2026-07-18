import { Test, TestingModule } from '@nestjs/testing';
import { ScenariosController } from './scenarios/scenarios.controller';
import { ScenariosService } from './scenarios/scenarios.service';
import { CatalogController } from './catalog/catalog.controller';
import { CategoriesService } from './catalog/categories.service';
import { TechSheetsService } from './catalog/tech-sheets.service';
import { DocumentsController } from './catalog/documents.controller';
import { DocumentsService } from './catalog/documents.service';
import { AssignmentsController } from './catalog/assignments.controller';
import { AssignmentsService } from './catalog/assignments.service';
import { StudentAssignmentsController } from './catalog/student-assignments.controller';
import { SimulatedCompaniesController } from './catalog/simulated-companies.controller';
import { SimulationReviewController } from './simulations/simulation-review.controller';
import { PromptTemplatesCompatController } from './templates/prompt-templates-compat.controller';
import { PromptTemplatesService } from './templates/prompt-templates.service';
import { PromptConfigService } from './templates/prompt-config.service';
import { FilesController } from './files/files.controller';
import { FilesService } from './files/files.service';
import { TemplatesController } from './templates/templates.controller';
import { FlowTemplatesService } from './templates/flow-templates.service';
import { MinistryController } from './ministry/ministry.controller';
import { MinistryService } from './ministry/ministry.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { AssessmentsController } from './assessments/assessments.controller';
import { AssessmentsService } from './assessments/assessments.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { PrismaService } from './prisma/prisma.service';
import { ROLES_KEY } from './common/decorators/roles.decorator';

describe('Phase A — All controllers metadata verification', () => {
  const mockService = {};

  describe('Task 1.1 — Class-level guards', () => {
    it('ScenariosController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, ScenariosController)).toEqual(['admin', 'teacher']);
    });

    it('CatalogController: admin only', () => {
      expect(Reflect.getMetadata(ROLES_KEY, CatalogController)).toEqual(['admin']);
    });

    it('DocumentsController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, DocumentsController)).toEqual(['admin', 'teacher']);
    });

    it('AssignmentsController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, AssignmentsController)).toEqual(['admin', 'teacher']);
    });

    it('StudentAssignmentsController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, StudentAssignmentsController)).toEqual(['admin', 'teacher']);
    });

    it('SimulatedCompaniesController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, SimulatedCompaniesController)).toEqual(['admin', 'teacher']);
    });

    it('SimulationReviewController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, SimulationReviewController)).toEqual(['admin', 'teacher']);
    });
  });

  describe('Task 1.2 — Class-level guards', () => {
    it('PromptTemplatesCompatController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, PromptTemplatesCompatController)).toEqual(['admin', 'teacher']);
    });

    it('FilesController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, FilesController)).toEqual(['admin', 'teacher']);
    });

    it('TemplatesController: admin, teacher', () => {
      expect(Reflect.getMetadata(ROLES_KEY, TemplatesController)).toEqual(['admin', 'teacher']);
    });

    it('MinistryController: admin, ministerio', () => {
      expect(Reflect.getMetadata(ROLES_KEY, MinistryController)).toEqual(['admin', 'ministerio']);
    });

    it('NotificationsController: admin', () => {
      expect(Reflect.getMetadata(ROLES_KEY, NotificationsController)).toEqual(['admin']);
    });
  });

  describe('Task 1.3 — Method-level guards', () => {
    it('AssessmentsController POST: admin, teacher', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, AssessmentsController.prototype.create);
      expect(roles).toEqual(['admin', 'teacher']);
    });

    it('UsersController GET /findAll: admin', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.findAll);
      expect(roles).toEqual(['admin']);
    });

    it('UsersController POST /create: admin', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.createUser);
      expect(roles).toEqual(['admin']);
    });

    it('UsersController DELETE: admin', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.remove);
      expect(roles).toEqual(['admin']);
    });

    it('UsersController reactivate: admin', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.reactivate);
      expect(roles).toEqual(['admin']);
    });

    it('UsersController GET /:id: no roles (student self-check)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.findOne);
      expect(roles).toBeUndefined();
    });

    it('UsersController PUT /:id: no roles (student self-check)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.update);
      expect(roles).toBeUndefined();
    });
  });

  describe('Guard metadata — all controllers have UseGuards', () => {
    const controllers = [
      { name: 'ScenariosController', target: ScenariosController },
      { name: 'CatalogController', target: CatalogController },
      { name: 'DocumentsController', target: DocumentsController },
      { name: 'AssignmentsController', target: AssignmentsController },
      { name: 'StudentAssignmentsController', target: StudentAssignmentsController },
      { name: 'SimulatedCompaniesController', target: SimulatedCompaniesController },
      { name: 'SimulationReviewController', target: SimulationReviewController },
      { name: 'PromptTemplatesCompatController', target: PromptTemplatesCompatController },
      { name: 'FilesController', target: FilesController },
      { name: 'TemplatesController', target: TemplatesController },
      { name: 'MinistryController', target: MinistryController },
      { name: 'NotificationsController', target: NotificationsController },
    ];

    controllers.forEach(({ name, target }) => {
      it(`${name} has JwtAuthGuard + RolesGuard`, () => {
        const guards = Reflect.getMetadata('__guards__', target) || [];
        const guardNames = guards.map((g: any) => g.name || g);
        expect(guardNames).toContain('JwtAuthGuard');
        expect(guardNames).toContain('RolesGuard');
      });
    });
  });
});
