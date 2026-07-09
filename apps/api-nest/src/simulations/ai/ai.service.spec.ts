import { AIService, PromptData } from './ai.service';
import { DeepSeekService } from '../../catalog/deepseek.service';

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService({} as DeepSeekService);
  });

  describe('buildSystemPrompt — personality fields', () => {
    const basePromptData: PromptData = {
      base_role: 'Sos un profesor de contabilidad.',
      course_context: 'Curso de contabilidad básica.',
      knowledge_base: 'Plan de cuentas, asientos contables.',
      student_history: [],
      personality_traits: ['amigable', 'paciente'],
    };

    it('should include base_role in output', () => {
      const prompt = service.buildSystemPrompt(basePromptData);
      expect(prompt).toContain('Sos un profesor de contabilidad.');
    });

    it('should include course_context', () => {
      const prompt = service.buildSystemPrompt(basePromptData);
      expect(prompt).toContain('Curso de contabilidad básica.');
    });

    it('should include knowledge_base', () => {
      const prompt = service.buildSystemPrompt(basePromptData);
      expect(prompt).toContain('Plan de cuentas, asientos contables.');
    });

    it('should include personality_traits joined by comma', () => {
      const prompt = service.buildSystemPrompt(basePromptData);
      expect(prompt).toContain('amigable, paciente');
    });

    it('should include tone and language when chatbot_humano_enabled', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
        tone: 'amigable',
        language: 'es',
      });
      expect(prompt).toContain('Tono: amigable');
      expect(prompt).toContain('Idioma: es');
    });

    it('should use defaults for tone/language when not provided', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
      });
      expect(prompt).toContain('Tono: profesional');
      expect(prompt).toContain('Idioma: español');
    });

    it('should include role_behavior when chatbot_humano_enabled', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
        role_behavior: 'Hablá como un contador experimentado.',
      });
      expect(prompt).toContain('COMPORTAMIENTO DE ROL');
      expect(prompt).toContain('Hablá como un contador experimentado.');
    });

    it('should NOT include role_behavior when chatbot_humano_enabled is false', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: false,
        role_behavior: 'Hablá como un contador.',
      });
      expect(prompt).not.toContain('COMPORTAMIENTO DE ROL');
    });

    it('should include off-topic guard instruction when chatbot_humano_enabled', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
      });
      expect(prompt).toContain('temas no relacionados con el curso');
      expect(prompt).toContain('redirige amablemente');
    });

    it('should NOT include off-topic guard when chatbot_humano_enabled is false', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: false,
      });
      expect(prompt).not.toContain('temas no relacionados');
    });

    it('should include state instruction when current_state is provided', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
        current_state: 'greeting',
      });
      expect(prompt).toContain('INSTRUCCIONES PARA ESTADO: GREETING');
      expect(prompt).toContain('bienvenida al estudiante');
    });

    it('should NOT include state instruction when chatbot_humano_enabled is false', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: false,
        current_state: 'greeting',
      });
      expect(prompt).not.toContain('INSTRUCCIONES PARA ESTADO');
    });

    it('should NOT contain hardcoded INSTRUCCIONES CRÍTICAS', () => {
      const prompt = service.buildSystemPrompt(basePromptData);
      expect(prompt).not.toContain('INSTRUCCIONES CRÍTICAS');
    });
  });

  describe('trimSystemPrompt', () => {
    it('should not trim if under max tokens', () => {
      const short = 'Short prompt under limit.';
      const result = service.trimSystemPrompt(short, 2000);
      expect(result).toBe(short);
    });

    it('should trim lowest-priority sections first', () => {
      // Create a prompt with identifiable sections
      const sections = [
        'Section A (base role) content.',
        'Section B (context) content.',
        'Section C (knowledge) content.',
        'Section D (personality) content.',
        'Section E (role behavior) content.',
        'Section F (offtopic) content.',
        'Section G (state) content.',
        'Section H (history) content.',
        'Section I (tone) content.',
      ];
      const longPrompt = sections.join('\n\n');

      // Set max tokens very low to force trimming
      // 50 tokens * 4 chars = 200 chars max
      const result = service.trimSystemPrompt(longPrompt, 50);

      expect(result.length).toBeLessThanOrEqual(200);
      // Earlier sections (base role) should survive
      expect(result).toContain('Section A');
      // Last sections (tone, history) should be trimmed
      expect(result).not.toContain('Section I');
    });

    it('should handle empty prompt', () => {
      const result = service.trimSystemPrompt('', 2000);
      expect(result).toBe('');
    });
  });
});
