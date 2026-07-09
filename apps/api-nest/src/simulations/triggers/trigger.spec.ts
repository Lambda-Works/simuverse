import { Test, TestingModule } from '@nestjs/testing';
import { TriggerService } from './trigger.service';
import { SessionMemoryService } from '../session-memory.service';
import { Trigger, TriggerContext } from './trigger.interface';
import { EmailTrigger } from './email.trigger';
import { CrisisTrigger } from './crisis.trigger';
import { CrisisEngine } from '../engines/crisis-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TriggerService', () => {
  let service: TriggerService;
  let sessionMemory: SessionMemoryService;
  let prismaMock: Record<string, any>;

  const mockTrigger: Trigger = {
    name: 'mock',
    shouldFire: jest.fn().mockReturnValue(true),
    getMessage: jest.fn().mockReturnValue('Mock fired'),
  };

  const mockCtx: TriggerContext = {
    scenario: { content: { emails: [] } },
    config: null,
    state: 'development',
  };

  beforeEach(async () => {
    prismaMock = {
      simulationChatLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionMemoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    sessionMemory = module.get(SessionMemoryService);
    service = new TriggerService([mockTrigger], sessionMemory);
  });

  beforeEach(() => {
    (mockTrigger.shouldFire as jest.Mock).mockReturnValue(true);
    (mockTrigger.getMessage as jest.Mock).mockReturnValue('Mock fired');
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return messages from triggers that fire', () => {
      const results = service.check('sim-1', mockCtx);
      expect(results).toHaveLength(1);
      expect(results[0].triggerName).toBe('mock');
      expect(results[0].message).toBe('Mock fired');
    });

    it('should skip triggers that should not fire', () => {
      (mockTrigger.shouldFire as jest.Mock).mockReturnValue(false);
      const results = service.check('sim-1', mockCtx);
      expect(results).toHaveLength(0);
    });

    it('should enforce cooldown per trigger type', () => {
      // First fire — should succeed
      const first = service.check('sim-1', mockCtx);
      expect(first).toHaveLength(1);

      // Second fire immediately — should be on cooldown
      const second = service.check('sim-1', mockCtx);
      expect(second).toHaveLength(0);
    });

    it('should allow fire after cooldown expires', () => {
      // First fire
      service.check('sim-1', mockCtx);

      // Simulate cooldown expiry by manipulating lastTriggerFires
      const session = sessionMemory['cache'].get('sim-1');
      if (session) {
        session.lastTriggerFires['mock'] = Date.now() - 6 * 60 * 1000; // 6 min ago
      }

      const results = service.check('sim-1', mockCtx);
      expect(results).toHaveLength(1);
    });

    it('should track cooldown per trigger name independently', () => {
      const triggerA: Trigger = {
        name: 'triggerA',
        shouldFire: jest.fn().mockReturnValue(true),
        getMessage: jest.fn().mockReturnValue('A fired'),
      };
      const triggerB: Trigger = {
        name: 'triggerB',
        shouldFire: jest.fn().mockReturnValue(true),
        getMessage: jest.fn().mockReturnValue('B fired'),
      };

      service = new TriggerService([triggerA, triggerB], sessionMemory);

      const results = service.check('sim-1', mockCtx);
      expect(results).toHaveLength(2);

      // Both on cooldown now
      const results2 = service.check('sim-1', mockCtx);
      expect(results2).toHaveLength(0);

      // Only A expires
      const session = sessionMemory['cache'].get('sim-1');
      if (session) {
        session.lastTriggerFires['triggerA'] = Date.now() - 6 * 60 * 1000;
      }

      const results3 = service.check('sim-1', mockCtx);
      expect(results3).toHaveLength(1);
      expect(results3[0].triggerName).toBe('triggerA');
    });

    it('should record trigger fire in session memory', () => {
      service.check('sim-1', mockCtx);
      const lastFired = sessionMemory.getLastTriggerFire('sim-1', 'mock');
      expect(lastFired).toBeDefined();
      expect(Date.now() - lastFired!).toBeLessThan(1000);
    });
  });
});

describe('EmailTrigger', () => {
  let trigger: EmailTrigger;
  let sessionMemory: SessionMemoryService;
  let prismaMock: Record<string, any>;

  beforeEach(async () => {
    prismaMock = {
      simulationChatLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionMemoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    sessionMemory = module.get(SessionMemoryService);
    trigger = new EmailTrigger(sessionMemory);
  });

  describe('shouldFire', () => {
    it('should fire when there are pending unread emails', () => {
      const ctx: TriggerContext = {
        scenario: {
          content: {
            emails: [
              { id: 'e1', from: 'boss@co.com', subject: 'Urgent', body: 'Help', read: false },
            ],
          },
        },
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(true);
    });

    it('should not fire when no emails exist', () => {
      const ctx: TriggerContext = {
        scenario: { content: {} },
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });

    it('should not fire when all emails are read', () => {
      const ctx: TriggerContext = {
        scenario: {
          content: {
            emails: [
              { id: 'e1', from: 'boss@co.com', subject: 'Urgent', body: 'Help', read: true },
            ],
          },
        },
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });

    it('should not fire for already triggered emails', () => {
      sessionMemory.append('sim-1', { speaker: 'system', message: 'init' });
      sessionMemory.markEmailTriggered('sim-1', 'e1');

      const ctx: TriggerContext = {
        scenario: {
          content: {
            emails: [
              { id: 'e1', from: 'boss@co.com', subject: 'Urgent', body: 'Help', read: false },
            ],
          },
        },
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });

    it('should handle missing scenario content gracefully', () => {
      const ctx: TriggerContext = {
        scenario: null,
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });
  });

  describe('getMessage', () => {
    it('should return formatted email notification', () => {
      const ctx: TriggerContext = {
        scenario: {
          content: {
            emails: [
              { id: 'e1', from: 'boss@co.com', subject: 'Report needed', body: 'Send report' },
            ],
          },
        },
        config: null,
        state: 'development',
      };

      const msg = trigger.getMessage('sim-1', ctx);
      expect(msg).toContain('boss@co.com');
      expect(msg).toContain('Report needed');
    });

    it('should mark email as triggered after getMessage', () => {
      const ctx: TriggerContext = {
        scenario: {
          content: {
            emails: [
              { id: 'e1', from: 'boss@co.com', subject: 'Urgent', body: 'Help' },
            ],
          },
        },
        config: null,
        state: 'development',
      };

      trigger.getMessage('sim-1', ctx);
      expect(sessionMemory.getTriggeredEmails('sim-1')).toContain('e1');
    });

    it('should return empty string when no pending emails', () => {
      const ctx: TriggerContext = {
        scenario: { content: {} },
        config: null,
        state: 'development',
      };

      expect(trigger.getMessage('sim-1', ctx)).toBe('');
    });
  });
});

describe('CrisisTrigger', () => {
  let trigger: CrisisTrigger;
  let crisisEngine: CrisisEngine;
  let sessionMemory: SessionMemoryService;
  let prismaMock: Record<string, any>;

  beforeEach(async () => {
    prismaMock = {
      simulationChatLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionMemoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    sessionMemory = module.get(SessionMemoryService);
    crisisEngine = new CrisisEngine();
    trigger = new CrisisTrigger(crisisEngine);
  });

  afterEach(() => {
    crisisEngine.clearAll();
  });

  describe('shouldFire', () => {
    it('should fire when there is an active crisis', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'informatica');

      const ctx: TriggerContext = {
        scenario: {},
        config: { family_type: 'informatica' } as any,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(true);
    });

    it('should not fire when no crisis exists', () => {
      const ctx: TriggerContext = {
        scenario: {},
        config: { family_type: 'informatica' } as any,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });

    it('should not fire when crisis is resolved', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'informatica');
      crisisEngine.resolveCrisis('sim-1', 'a');

      const ctx: TriggerContext = {
        scenario: {},
        config: { family_type: 'informatica' } as any,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(false);
    });

    it('should use default family_type when config is null', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'administracion');

      const ctx: TriggerContext = {
        scenario: {},
        config: null,
        state: 'development',
      };

      expect(trigger.shouldFire('sim-1', ctx)).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('should return crisis title and description', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'informatica');

      const ctx: TriggerContext = {
        scenario: {},
        config: { family_type: 'informatica' } as any,
        state: 'development',
      };

      const msg = trigger.getMessage('sim-1', ctx);
      expect(msg).toContain('Crisis activa');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('should return empty string when crisis is resolved', () => {
      crisisEngine.getOrCreateCrisis('sim-1', 'informatica');
      crisisEngine.resolveCrisis('sim-1', 'a');

      const ctx: TriggerContext = {
        scenario: {},
        config: { family_type: 'informatica' } as any,
        state: 'development',
      };

      expect(trigger.getMessage('sim-1', ctx)).toBe('');
    });
  });
});
