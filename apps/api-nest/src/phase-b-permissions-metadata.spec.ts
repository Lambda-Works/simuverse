import { ScenariosController } from './scenarios/scenarios.controller';
import { CatalogController } from './catalog/catalog.controller';
import { DocumentsController } from './catalog/documents.controller';
import { AssignmentsController } from './catalog/assignments.controller';
import { StudentAssignmentsController } from './catalog/student-assignments.controller';
import { SimulatedCompaniesController } from './catalog/simulated-companies.controller';
import { TemplatesController } from './templates/templates.controller';
import { PromptTemplatesCompatController } from './templates/prompt-templates-compat.controller';
import { SimulationReviewController } from './simulations/simulation-review.controller';
import { FilesController } from './files/files.controller';
import { MinistryController } from './ministry/ministry.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { AssessmentsController } from './assessments/assessments.controller';
import { UsersController } from './users/users.controller';
import { RbacController } from './rbac/rbac.controller';
import { CatalogQueryController } from './catalog/catalog-query.controller';
import { CoursesController } from './courses/courses.controller';
import { SimulationsController } from './simulations/simulations.controller';
import { PERMISSIONS_KEY } from './common/decorators/permissions.decorator';

describe('Phase B — @Permissions() metadata verification', () => {
  // ── Task 3.1: ScenariosController ────────────────────────────────
  describe('Task 3.1 — ScenariosController', () => {
    it('class-level: scenarios.read', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, ScenariosController);
      expect(perms).toEqual(['scenarios.read']);
    });

    it('method-level: POST create → scenarios.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, ScenariosController.prototype.create);
      expect(perms).toEqual(['scenarios.manage']);
    });

    it('method-level: PUT update → scenarios.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, ScenariosController.prototype.update);
      expect(perms).toEqual(['scenarios.manage']);
    });

    it('method-level: DELETE remove → scenarios.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, ScenariosController.prototype.remove);
      expect(perms).toEqual(['scenarios.manage']);
    });
  });

  // ── Task 3.2: CatalogController, DocumentsController, AssignmentsController ──
  describe('Task 3.2 — CatalogController', () => {
    it('class-level: catalog.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CatalogController);
      expect(perms).toEqual(['catalog.manage']);
    });
  });

  describe('Task 3.2 — DocumentsController', () => {
    it('class-level: documents.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, DocumentsController);
      expect(perms).toEqual(['documents.manage']);
    });
  });

  describe('Task 3.2 — AssignmentsController', () => {
    it('class-level: assignments.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, AssignmentsController);
      expect(perms).toEqual(['assignments.manage']);
    });
  });

  // ── Task 3.3: StudentAssignmentsController, SimulatedCompaniesController ──
  describe('Task 3.3 — StudentAssignmentsController', () => {
    it('class-level: assignments.read', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, StudentAssignmentsController);
      expect(perms).toEqual(['assignments.read']);
    });
  });

  describe('Task 3.3 — SimulatedCompaniesController', () => {
    it('class-level: companies.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, SimulatedCompaniesController);
      expect(perms).toEqual(['companies.manage']);
    });
  });

  // ── Task 3.4: TemplatesController, PromptTemplatesCompatController, SimulationReviewController ──
  describe('Task 3.4 — TemplatesController', () => {
    it('class-level: templates.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, TemplatesController);
      expect(perms).toEqual(['templates.manage']);
    });
  });

  describe('Task 3.4 — PromptTemplatesCompatController', () => {
    it('class-level: templates.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, PromptTemplatesCompatController);
      expect(perms).toEqual(['templates.manage']);
    });
  });

  describe('Task 3.4 — SimulationReviewController', () => {
    it('class-level: simulations.read', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, SimulationReviewController);
      expect(perms).toEqual(['simulations.read']);
    });
  });

  // ── Task 3.5: FilesController, MinistryController ──
  describe('Task 3.5 — FilesController', () => {
    it('class-level: files.read (GET base)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, FilesController);
      expect(perms).toEqual(['files.read']);
    });

    it('method-level: upload → files.upload', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, FilesController.prototype.upload);
      expect(perms).toEqual(['files.upload']);
    });

    it('method-level: update → files.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, FilesController.prototype.update);
      expect(perms).toEqual(['files.manage']);
    });

    it('method-level: remove → files.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, FilesController.prototype.remove);
      expect(perms).toEqual(['files.manage']);
    });
  });

  describe('Task 3.5 — MinistryController', () => {
    it('class-level: ministry.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, MinistryController);
      expect(perms).toEqual(['ministry.manage']);
    });
  });

  // ── Task 3.6: NotificationsController, AssessmentsController, UsersController ──
  describe('Task 3.6 — NotificationsController', () => {
    it('class-level: notifications.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, NotificationsController);
      expect(perms).toEqual(['notifications.manage']);
    });
  });

  describe('Task 3.6 — AssessmentsController', () => {
    it('method-level: create → assessments.create', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, AssessmentsController.prototype.create);
      expect(perms).toEqual(['assessments.create']);
    });

    it('GET findAll: no @Permissions (role-gated only)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, AssessmentsController.prototype.findAll);
      expect(perms).toBeUndefined();
    });
  });

  describe('Task 3.6 — UsersController', () => {
    it('method-level: findAll → users.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findAll);
      expect(perms).toEqual(['users.manage']);
    });

    it('method-level: createUser → users.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.createUser);
      expect(perms).toEqual(['users.manage']);
    });

    it('method-level: remove → users.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.remove);
      expect(perms).toEqual(['users.manage']);
    });

    it('method-level: reactivate → users.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.reactivate);
      expect(perms).toEqual(['users.manage']);
    });

    it('findOne: no @Permissions (student self-check preserved)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findOne);
      expect(perms).toBeUndefined();
    });

    it('update: no @Permissions (student self-check preserved)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.update);
      expect(perms).toBeUndefined();
    });
  });

  // ── Task 3.7: RbacController, CatalogQueryController, CoursesController, SimulationsController ──
  describe('Task 3.7 — RbacController', () => {
    it('class-level: rbac.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, RbacController);
      expect(perms).toEqual(['rbac.manage']);
    });
  });

  describe('Task 3.7 — CatalogQueryController', () => {
    it('PUT upsertRolePermissions → rbac.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CatalogQueryController.prototype.upsertRolePermissions);
      expect(perms).toEqual(['rbac.manage']);
    });

    it('GET getRolePermissions: no @Permissions (role-gated)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CatalogQueryController.prototype.getRolePermissions);
      expect(perms).toBeUndefined();
    });
  });

  describe('Task 3.7 — CoursesController', () => {
    it('method-level: create → courses.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype.create);
      expect(perms).toEqual(['courses.manage']);
    });

    it('method-level: update → courses.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype.update);
      expect(perms).toEqual(['courses.manage']);
    });

    it('method-level: remove → courses.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype.remove);
      expect(perms).toEqual(['courses.manage']);
    });

    it('method-level: regeneratePassword → courses.manage', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype.regeneratePassword);
      expect(perms).toEqual(['courses.manage']);
    });

    it('findAll: no @Permissions (role-gated only)', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype.findAll);
      expect(perms).toBeUndefined();
    });
  });

  describe('Task 3.7 — SimulationsController', () => {
    it('method-level: getAdminHistory → simulations.read', () => {
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, SimulationsController.prototype.getAdminHistory);
      expect(perms).toEqual(['simulations.read']);
    });
  });
});
