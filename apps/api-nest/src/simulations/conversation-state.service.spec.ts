import { ConversationStateService, ConversationStateName } from './conversation-state.service';

describe('ConversationStateService', () => {
  let service: ConversationStateService;

  beforeEach(() => {
    service = new ConversationStateService();
  });

  describe('getState', () => {
    it('should return greeting state for unknown simulation', () => {
      const state = service.getState('sim-1');
      expect(state.state).toBe('greeting');
      expect(state.messageCount).toBe(0);
      expect(state.simulationId).toBe('sim-1');
    });

    it('should return existing state after transition', () => {
      service.transition('sim-1', 'development');
      const state = service.getState('sim-1');
      expect(state.state).toBe('development');
      expect(state.messageCount).toBe(1);
    });
  });

  describe('transition — valid', () => {
    it('should transition greeting → development', () => {
      const result = service.transition('sim-1', 'development');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('development');
      expect(result!.messageCount).toBe(1);
    });

    it('should transition development → milestone', () => {
      service.transition('sim-1', 'development');
      const result = service.transition('sim-1', 'milestone');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('milestone');
    });

    it('should transition milestone → development', () => {
      service.transition('sim-1', 'development');
      service.transition('sim-1', 'milestone');
      const result = service.transition('sim-1', 'development');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('development');
    });

    it('should transition development → closing', () => {
      service.transition('sim-1', 'development');
      const result = service.transition('sim-1', 'closing');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('closing');
    });

    it('should transition milestone → closing', () => {
      service.transition('sim-1', 'development');
      service.transition('sim-1', 'milestone');
      const result = service.transition('sim-1', 'closing');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('closing');
    });
  });

  describe('transition — invalid', () => {
    it('should reject greeting → milestone', () => {
      const result = service.transition('sim-1', 'milestone');
      expect(result).toBeNull();
      expect(service.getState('sim-1').state).toBe('greeting');
    });

    it('should reject greeting → closing', () => {
      const result = service.transition('sim-1', 'closing');
      expect(result).toBeNull();
    });

    it('should reject closing → any state', () => {
      service.transition('sim-1', 'development');
      service.transition('sim-1', 'closing');

      expect(service.transition('sim-1', 'greeting')).toBeNull();
      expect(service.transition('sim-1', 'development')).toBeNull();
      expect(service.transition('sim-1', 'milestone')).toBeNull();
    });

    it('should reject development → greeting', () => {
      service.transition('sim-1', 'development');
      const result = service.transition('sim-1', 'greeting');
      expect(result).toBeNull();
    });
  });

  describe('incrementMessage', () => {
    it('should increment message count without changing state', () => {
      service.transition('sim-1', 'development');
      service.incrementMessage('sim-1');
      service.incrementMessage('sim-1');
      const state = service.getState('sim-1');
      expect(state.state).toBe('development');
      expect(state.messageCount).toBe(3); // 1 from transition + 2 increments
    });
  });

  describe('autoTransition', () => {
    it('should transition greeting → development at messageCount >= 2', () => {
      service.incrementMessage('sim-1');
      const result = service.autoTransition('sim-1');
      expect(result.state).toBe('development');
      expect(result.messageCount).toBe(3); // 1 (increment) + 1 (auto increment) + 1 (transition increment)
    });

    it('should transition development → closing at messageCount >= 20', () => {
      service.transition('sim-1', 'development');
      // Simulate 18 more messages to reach messageCount = 19 in development
      for (let i = 0; i < 18; i++) {
        service.incrementMessage('sim-1');
      }
      const result = service.autoTransition('sim-1');
      expect(result.state).toBe('closing');
      expect(result.messageCount).toBe(21); // 19 + 1 auto increment + 1 transition
    });

    it('should not auto-transition greeting if only 1 message', () => {
      // messageCount stays at 0, autoTransition increments to 1, greeting requires >= 2
      const result = service.autoTransition('sim-1');
      expect(result.state).toBe('greeting');
      expect(result.messageCount).toBe(1);
    });

    it('should not auto-transition development if messageCount < 20', () => {
      service.transition('sim-1', 'development');
      service.incrementMessage('sim-1'); // messageCount = 2
      const result = service.autoTransition('sim-1');
      expect(result.state).toBe('development');
      expect(result.messageCount).toBe(3);
    });
  });

  describe('getStatePrompt', () => {
    it('should return prompt for each state', () => {
      const states: ConversationStateName[] = ['greeting', 'development', 'milestone', 'closing'];
      for (const state of states) {
        const prompt = service.getStatePrompt(state);
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(10);
      }
    });
  });

  describe('remove', () => {
    it('should remove state for a simulation', () => {
      service.transition('sim-1', 'development');
      expect(service.getState('sim-1').state).toBe('development');
      service.remove('sim-1');
      expect(service.getState('sim-1').state).toBe('greeting');
    });
  });
});
