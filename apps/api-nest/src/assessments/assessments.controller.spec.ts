import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('AssessmentsController — RBAC Phase A (method-level)', () => {
  let controller: AssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [{ provide: AssessmentsService, useValue: {} }],
    }).compile();

    controller = module.get(AssessmentsController);
  });

  describe('POST method @Roles', () => {
    it('has roles admin and teacher on create', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, controller.create);
      expect(roles).toEqual(['admin', 'teacher']);
    });
  });
});
