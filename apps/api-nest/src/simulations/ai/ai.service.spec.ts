import { AIService, PromptData } from './ai.service';
import { DeepSeekService } from '../../catalog/deepseek.service';
import { OpenAiService } from './openai.service';

describe('AIService', () => {
  let service: AIService;
  let deepseek: jest.Mocked<Pick<DeepSeekService, 'chat' | 'getEmploymentAxis'>>;
  let openai: jest.Mocked<Pick<OpenAiService, 'isConfigured' | 'chat'>>;

  beforeEach(() => {
    deepseek = {
      getEmploymentAxis: jest.fn().mockReturnValue(''),
      chat: jest.fn(),
    };
    openai = {
      isConfigured: jest.fn(),
      chat: jest.fn(),
    };
    service = new AIService(deepseek as unknown as DeepSeekService);
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
      expect(prompt).toContain('RECHAZAR ÚNICAMENTE');
      expect(prompt).toContain('EXCEPCIONES');
    });

    it('should include off-topic guard when chatbot_humano_enabled is false (universal guard)', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: false,
      });
      expect(prompt).toContain('REGLA: Solo podés hablar sobre temas relacionados');
    });

    it('should include off-topic guard for BOTH chatbot_humano_enabled true AND false (universal guard)', () => {
      const promptTrue = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
      });
      const promptFalse = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: false,
      });
      expect(promptTrue).toContain('RESTRICCIÓN ABSOLUTA DE CONTENIDO');
      expect(promptFalse).toContain('RESTRICCIÓN ABSOLUTA DE CONTENIDO');
    });

    it('should include subject_domain in off-topic guard when provided', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
        subject_domain: 'contabilidad',
      });
      expect(prompt).toContain('contabilidad');
    });

    it('should use generic guard fallback when subject_domain is missing', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        chatbot_humano_enabled: true,
      });
      expect(prompt).toContain('REGLA: Solo podés hablar sobre temas relacionados');
      expect(prompt).toContain('Si debés rechazar, respondé:');
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

    it('includes a custom system_prompt when provided', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        system_prompt: 'Actuá como un cliente enojado que reclama por un producto defectuoso.',
      });
      expect(prompt).toContain('Actuá como un cliente enojado que reclama por un producto defectuoso.');
    });

    it('leads with the custom system_prompt before base_role', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        system_prompt: 'PROMPT_PERSONALIZADO_MARCADOR',
      });
      expect(prompt.indexOf('PROMPT_PERSONALIZADO_MARCADOR')).toBeLessThan(
        prompt.indexOf('Sos un profesor de contabilidad.'),
      );
    });

    it('includes a custom coaching_prompt under a coaching section', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        coaching_prompt: 'Guiá al alumno con preguntas socráticas, sin dar la respuesta.',
      });
      expect(prompt).toContain('GUÍA DE COACHING');
      expect(prompt).toContain('Guiá al alumno con preguntas socráticas, sin dar la respuesta.');
    });

    it('omits custom prompt sections when they are empty or whitespace', () => {
      const prompt = service.buildSystemPrompt({
        ...basePromptData,
        system_prompt: '   ',
        coaching_prompt: '',
      });
      expect(prompt).not.toContain('GUÍA DE COACHING');
    });

    it('should prepend employment axis content when available', () => {
      const employmentContent =
        '# Eje Empleabilidad — Contenido Estático\n\nEmpleabilidad.\nMedidas de Seguridad e Higiene en el ámbito laboral.';
      const svc = new AIService({
        getEmploymentAxis: () => employmentContent,
      } as DeepSeekService);

      const prompt = svc.buildSystemPrompt(basePromptData);

      expect(prompt).toContain('EJE EMPLEABILIDAD');
      expect(prompt).toContain('Eje Empleabilidad — Contenido Estático');
      expect(prompt).toContain('Medidas de Seguridad e Higiene en el ámbito laboral.');
      expect(prompt.indexOf('EJE EMPLEABILIDAD')).toBeLessThan(
        prompt.indexOf('Sos un profesor de contabilidad.'),
      );
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

  describe('sendMessage provider fallback', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.DEEPSEEK_API_KEY;
      jest.clearAllMocks();
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('uses OpenAI as primary chat provider when configured', async () => {
      openai.isConfigured.mockReturnValue(true);
      openai.chat.mockResolvedValue('OpenAI response');

      const svc = new AIService(
        deepseek as unknown as DeepSeekService,
        openai as unknown as OpenAiService,
      );

      const result = await svc.sendMessage('Hola', 'System prompt', []);

      expect(openai.chat).toHaveBeenCalledWith('Hola', 'System prompt', []);
      expect(deepseek.chat).not.toHaveBeenCalled();
      expect(result).toEqual({ response: 'OpenAI response', mode: 'live' });
    });

    it('falls back to DeepSeek when OpenAI fails', async () => {
      openai.isConfigured.mockReturnValue(true);
      openai.chat.mockRejectedValue(new Error('OpenAI unavailable'));
      process.env.DEEPSEEK_API_KEY = 'deepseek-test-key';
      deepseek.chat.mockResolvedValue('DeepSeek response');

      const svc = new AIService(
        deepseek as unknown as DeepSeekService,
        openai as unknown as OpenAiService,
      );

      const result = await svc.sendMessage('Hola', 'System prompt', []);

      expect(openai.chat).toHaveBeenCalled();
      expect(deepseek.chat).toHaveBeenCalled();
      expect(result).toEqual({ response: 'DeepSeek response', mode: 'live' });
    });

    it('uses scripted fallback when no live providers are available', async () => {
      openai.isConfigured.mockReturnValue(false);

      const svc = new AIService(
        deepseek as unknown as DeepSeekService,
        openai as unknown as OpenAiService,
      );

      const result = await svc.sendMessage('Hola', 'System prompt', []);

      expect(openai.chat).not.toHaveBeenCalled();
      expect(deepseek.chat).not.toHaveBeenCalled();
      expect(result.mode).toBe('scripted');
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('uses DeepSeek first when preferDeepSeek=true', async () => {
      process.env.DEEPSEEK_API_KEY = 'deepseek-test-key';
      deepseek.chat.mockResolvedValue('DeepSeek response');

      const svc = new AIService(
        deepseek as unknown as DeepSeekService,
        openai as unknown as OpenAiService,
      );

      const result = await svc.sendMessage('Hola', 'System prompt', [], undefined, true);

      expect(deepseek.chat).toHaveBeenCalled();
      expect(openai.chat).not.toHaveBeenCalled();
      expect(result).toEqual({ response: 'DeepSeek response', mode: 'live' });
    });

    it('uses scripted fallback when preferDeepSeek=true and DeepSeek fails', async () => {
      openai.isConfigured.mockReturnValue(true);
      process.env.DEEPSEEK_API_KEY = 'deepseek-test-key';
      deepseek.chat.mockRejectedValue(new Error('DeepSeek unavailable'));

      const svc = new AIService(
        deepseek as unknown as DeepSeekService,
        openai as unknown as OpenAiService,
      );

      const result = await svc.sendMessage('Hola', 'System prompt', [], undefined, true);

      expect(deepseek.chat).toHaveBeenCalled();
      expect(openai.chat).not.toHaveBeenCalled();
      expect(result.mode).toBe('scripted');
    });
  });
});
