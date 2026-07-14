import { Injectable, Logger, Optional } from '@nestjs/common';
import axios from 'axios';
import { DeepSeekService } from '../../catalog/deepseek.service';
import { OpenAiService } from './openai.service';

export interface PromptData {
  base_role: string;
  course_context: string;
  knowledge_base: string;
  student_history: string[];
  personality_traits: string[];
  // New fields for chatbot humano
  tone?: string;
  language?: string;
  role_behavior?: string;
  chatbot_humano_enabled?: boolean;
  current_state?: string;
  /** Practice agent identity e.g. practica-1 */
  agent_key?: string;
  /** Practice difficulty label */
  difficulty?: string;
  /** Summary of previous practice for continuity */
  prior_context?: string;
}

/** Section identifiers for priority-based trimming (higher index = trimmed first). */
interface PromptSection {
  id: string;
  header: string;
  body: string;
  priority: number;
}

const DEFAULT_MAX_TOKENS = 2000;
const CHARS_PER_TOKEN = 4; // heuristic for Spanish

export interface AIResponse {
  response: string;
  mode: 'live' | 'scripted';
}

export interface FallbackContext {
  scenarioContext?: string;
  constraints?: string[];
  base_role?: string;
  course_context?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private geminiApiKey: string;
  private geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(
    private readonly deepseek: DeepSeekService,
    @Optional() private readonly openai?: OpenAiService,
  ) {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  // ─── Fallback offline engine ─────────────────────────────────────────

  private detectIntent(msg: string): string {
    const m = msg.toLowerCase();
    if (/^(hola|buenos|buenas|buen\s|saludos|hi\b|hey\b)/.test(m)) return 'greeting';
    if (/(problema|error|falla|urgente|crisis|inconveniente|rompió|caído|alerta)/.test(m)) return 'problem';
    if (/(propongo|sugiero|creo que|deberíamos|podríamos|mi propuesta|solución|planteo)/.test(m)) return 'proposal';
    if (/(reporte|informe|datos|estadística|cifra|número|resultado|balance|liquidación|cálculo)/.test(m)) return 'data';
    if (/(cómo|qué|cuándo|dónde|por qué|cuál|quién|\?)/.test(m)) return 'question';
    return 'default';
  }

  private getConstraintHint(constraints?: string[]): string {
    if (!constraints || constraints.length === 0) {
      return 'el protocolo establecido';
    }
    const idx = Math.floor(Date.now() / 60000) % constraints.length;
    return constraints[idx];
  }

  private hashStr(s: string): number {
    let h = 0;
    for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return Math.abs(h);
  }

  private generateFallbackResponse(
    userMessage: string,
    _systemPrompt: string,
    ctx?: FallbackContext,
  ): string {
    const intent = this.detectIntent(userMessage);
    const constraint = this.getConstraintHint(ctx?.constraints);
    const ctxSnippet = ctx?.scenarioContext
      ? `Recordá el contexto del escenario: "${ctx.scenarioContext.substring(0, 90).trimEnd()}..."`
      : '';

    const banks: Record<string, string[]> = {
      greeting: [
        `¡Bien que estés aquí! Hay bastante trabajo por delante. ${ctxSnippet ? ctxSnippet + ' ' : ''}¿Por dónde querés empezar?`,
        `Hola. Tenés acceso al sistema. Lo primero que debés tener en claro: ${constraint}. ¿Listos para arrancar?`,
        `Bienvenido. Ya era momento. Recordá siempre: ${constraint}. ¿Cuál es tu primer paso?`,
      ],
      problem: [
        `Entiendo la urgencia. Antes de actuar, recordá: ${constraint}. ¿Cuál es tu diagnóstico de la situación?`,
        `Esta clase de situaciones requieren criterio. ${ctxSnippet ? ctxSnippet + ' ' : ''}¿Qué medidas tomaste hasta ahora?`,
        `Serio esto. Para resolverlo tenés que tener presente: ${constraint}. Describí los pasos que vas a seguir.`,
      ],
      proposal: [
        `Interesante planteo. Pero antes de avanzar, ¿tuviste en cuenta que ${constraint}? Desarrollá tu razonamiento.`,
        `Puede funcionar. ${ctxSnippet ? ctxSnippet + ' ' : ''}¿Qué datos te respaldan?`,
        `Antes de implementarlo, verificá que se ajuste a: ${constraint}. ¿Podés confirmarlo con documentación?`,
      ],
      data: [
        `Los datos son claros. Ahora, ¿cómo los interpretás considerando que ${constraint}?`,
        `Bien, tenés la información. El siguiente paso es analizarla con criterio. ${ctxSnippet ? ctxSnippet + ' ' : ''}¿Cuál es tu conclusión?`,
        `Esos números son la base. Para avanzar también considerá: ${constraint}. ¿Qué decidís?`,
      ],
      question: [
        `Para orientarte: ${constraint}. ${ctxSnippet ? ctxSnippet + ' ' : ''}Revisá los recursos disponibles y decime qué encontrás.`,
        `Buena pregunta. Lo que necesitás saber es: ${constraint}. ¿Eso te ayuda a avanzar?`,
        `El sistema tiene la respuesta. Pista: ${constraint}. Buscá en la documentación y volvé con lo que hallaste.`,
      ],
      default: [
        `Seguimos avanzando. Recordá que ${constraint}. ¿Cuál es tu siguiente paso?`,
        `Entendido. ${ctxSnippet ? ctxSnippet + ' ' : ''}Para continuar correctamente: ${constraint}. ¿Estamos alineados?`,
        `Bien. El foco tiene que estar en: ${constraint}. Contame más sobre lo que tenés en mente.`,
      ],
    };

    const pool = banks[intent] ?? banks.default;
    return pool[this.hashStr(userMessage) % pool.length];
  }

  // ─── DeepSeek provider ──────────────────────────────────────────────

  private async sendMessageToDeepSeek(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<AIResponse> {
    const historyStr =
      conversationHistory.length > 0
        ? '\n\n--- CONVERSATION HISTORY ---\n' +
          conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')
        : '';

    const fullPrompt = historyStr
      ? `${historyStr}\n\n--- CURRENT MESSAGE ---\n${userMessage}`
      : userMessage;

    this.logger.log('Using DeepSeek provider (deepseek-v4-flash)');
    const response = await this.deepseek.chat(fullPrompt, systemPrompt);
    return { response, mode: 'live' };
  }

  // ─── Public API ──────────────────────────────────────────────────────

  buildSystemPrompt(promptData: PromptData): string {
    const {
      base_role,
      course_context,
      knowledge_base,
      personality_traits,
      student_history,
      tone,
      language,
      role_behavior,
      chatbot_humano_enabled,
      current_state,
      agent_key,
      difficulty,
      prior_context,
    } = promptData;

    const sections: PromptSection[] = [];

    const employmentAxis = this.deepseek?.getEmploymentAxis?.() ?? '';
    if (employmentAxis) {
      sections.push({
        id: 'employment_axis',
        header: 'EJE EMPLEABILIDAD',
        body: employmentAxis.trim(),
        priority: 0,
      });
    }

    // Practice identity / difficulty / prior context
    if (agent_key || difficulty || prior_context) {
      const parts: string[] = [
        'MODO: solo prácticas y tareas. NO evalúes, califiques ni asignes notas.',
      ];
      if (agent_key) parts.push(`Identidad del agente: ${agent_key}`);
      if (difficulty) parts.push(`Dificultad de la práctica: ${difficulty}`);
      if (prior_context) {
        parts.push(`Contexto resumido de prácticas anteriores:\n${prior_context}`);
      }
      sections.push({
        id: 'practice_context',
        header: 'CONTEXTO DE PRÁCTICA',
        body: parts.join('\n'),
        priority: 0,
      });
    }

    // 1. Base role (highest priority — never trimmed)
    sections.push({
      id: 'base_role',
      header: '',
      body: base_role,
      priority: 0,
    });

    // 2. Course context
    sections.push({
      id: 'course_context',
      header: 'CONTEXTO DEL CURSO',
      body: course_context,
      priority: 1,
    });

    // 3. Knowledge base
    sections.push({
      id: 'knowledge_base',
      header: 'BASE DE CONOCIMIENTOS',
      body: knowledge_base,
      priority: 2,
    });

    // 4. Personality traits
    if (personality_traits.length > 0) {
      sections.push({
        id: 'personality_traits',
        header: 'CARACTERÍSTICAS DE PERSONALIDAD',
        body: personality_traits.join(', '),
        priority: 3,
      });
    }

    // 5. Role behavior (new field)
    if (chatbot_humano_enabled && role_behavior) {
      sections.push({
        id: 'role_behavior',
        header: 'COMPORTAMIENTO DE ROL',
        body: role_behavior,
        priority: 4,
      });
    }

    // 6. Off-topic guard instruction
    if (chatbot_humano_enabled) {
      sections.push({
        id: 'offtopic_instructions',
        header: 'INSTRUCCIONES DE TEMAS NO RELACIONADOS',
        body: 'Si el estudiante pregunta sobre temas no relacionados con el curso, redirige amablemente sin responder la pregunta. Mantén el foco en la simulación y el aprendizaje.',
        priority: 5,
      });
    }

    // 7. State-specific instruction (lowest priority — trimmed first)
    if (chatbot_humano_enabled && current_state) {
      sections.push({
        id: 'state_instructions',
        header: `INSTRUCCIONES PARA ESTADO: ${current_state.toUpperCase()}`,
        body: this.getStateInstruction(current_state),
        priority: 6,
      });
    }

    // 8. Student history (informational, trimmed early)
    const historyText =
      student_history.length > 0 ? student_history.join('\n') : 'Principiante, sin interacciones previas.';
    sections.push({
      id: 'student_history',
      header: 'HISTORIAL DEL ALUMNO',
      body: historyText,
      priority: 7,
    });

    // 9. Tone/language settings (if chatbot humano enabled)
    if (chatbot_humano_enabled) {
      const toneLine = tone ? `Tono: ${tone}` : 'Tono: profesional';
      const langLine = language ? `Idioma: ${language}` : 'Idioma: español';
      sections.push({
        id: 'tone_language',
        header: 'CONFIGURACIÓN DE COMUNICACIÓN',
        body: `${toneLine}\n${langLine}`,
        priority: 8,
      });
    }

    const raw = this.renderSections(sections);
    return this.trimSystemPrompt(raw, DEFAULT_MAX_TOKENS);
  }

  /**
   * Get state-specific instruction text.
   */
  private getStateInstruction(state: string): string {
    const instructions: Record<string, string> = {
      greeting:
        'Estás dando la bienvenida al estudiante. Sé cálido, presentate brevemente y explicá de qué trata la simulación. No des tareas todavía.',
      development:
        'El estudiante está trabajando en las tareas del escenario. Sé profesional, guiá sin dar respuestas directas. NO evalúes ni califiques.',
      milestone:
        'Se alcanzó un hito importante (evento, crisis o logro). Reconocé el progreso del estudiante, hacé un breve resumen y motivá a continuar.',
      closing:
        'La simulación está por finalizar. Hacé un cierre amable, resumí los puntos clave de la práctica y agradecé la participación.',
    };
    return instructions[state] ?? 'Responde de forma profesional y contextual.';
  }

  /**
   * Render sections into a single prompt string.
   */
  private renderSections(sections: PromptSection[]): string {
    return sections
      .map((s) => (s.header ? `${s.header}:\n${s.body}` : s.body))
      .join('\n\n');
  }

  /**
   * Trim system prompt to fit within maxTokens using priority-based section removal.
   * Heuristic: 1 token ≈ 4 chars for Spanish.
   * Sections are sorted by priority descending — lowest priority (highest number) trimmed first.
   */
  trimSystemPrompt(prompt: string, maxTokens: number = DEFAULT_MAX_TOKENS): string {
    const maxChars = maxTokens * CHARS_PER_TOKEN;

    if (prompt.length <= maxChars) {
      return prompt;
    }

    // Split into sections by double newline, preserving headers
    const rawSections = prompt.split(/\n\n(?=[A-ZÁÉÍÓÚÑ])/);

    // Tag each section with a priority index (order of appearance = priority)
    const tagged = rawSections.map((section, index) => ({
      text: section,
      priority: index,
    }));

    // Sort by priority descending (highest index = lowest priority = trimmed first)
    tagged.sort((a, b) => b.priority - a.priority);

    let trimmed = prompt;
    const removed: string[] = [];

    for (const section of tagged) {
      if (trimmed.length <= maxChars) break;
      trimmed = trimmed.replace(section.text, '').replace(/\n{3,}/g, '\n\n').trim();
      removed.push(section.text.substring(0, 40) + '...');
    }

    if (removed.length > 0) {
      this.logger.warn(
        `System prompt trimmed by ${prompt.length - trimmed.length} chars, removed ${removed.length} sections: ${removed.join('; ')}`,
      );
    }

    return trimmed;
  }

  async sendMessageToGemini(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    fallbackCtx?: FallbackContext,
  ): Promise<AIResponse> {
    // Primary: OpenAI gpt-5.4-nano (chat only)
    if (this.openai?.isConfigured()) {
      try {
        const response = await this.openai.chat(userMessage, systemPrompt, conversationHistory);
        return { response, mode: 'live' };
      } catch (error) {
        this.logger.warn(`OpenAI failed, falling back to DeepSeek: ${(error as Error).message}`);
      }
    }

    // Fallback: DeepSeek
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim() !== '') {
      try {
        return await this.sendMessageToDeepSeek(userMessage, systemPrompt, conversationHistory);
      } catch (error) {
        this.logger.warn(`DeepSeek failed, falling back: ${(error as Error).message}`);
      }
    }

    const isKeyMissing =
      !this.geminiApiKey ||
      this.geminiApiKey === 'tu_gemini_api_key_aqui' ||
      this.geminiApiKey.trim() === '';

    if (isKeyMissing) {
      return {
        response: this.generateFallbackResponse(userMessage, systemPrompt, fallbackCtx),
        mode: 'scripted',
      };
    }

    try {
      const messages = [
        ...conversationHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          system_instruction: { parts: { text: systemPrompt } },
          contents: messages,
          generation_config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        { timeout: 30000 },
      );

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        return {
          response: this.generateFallbackResponse(userMessage, systemPrompt, fallbackCtx),
          mode: 'scripted',
        };
      }
      return { response: content, mode: 'live' };
    } catch {
      return {
        response: this.generateFallbackResponse(userMessage, systemPrompt, fallbackCtx),
        mode: 'scripted',
      };
    }
  }

  async analyzeStudentPerformance(
    course_id: string,
    logs: any[],
    evalCriteria: string[],
  ): Promise<Record<string, any>> {
    const analysisPrompt = `
    Eres un evaluador pedagógico experto. Analiza los siguientes logs de actividad de un alumno y proporciona un análisis detallado.
    
    CRITERIOS DE EVALUACIÓN: ${evalCriteria.join(', ')}
    
    LOGS DE ACTIVIDAD:
    ${JSON.stringify(logs, null, 2)}
    
    Por favor, devuelve un JSON con:
    - hard_skills: {criterio: puntuación 0-100}
    - soft_skills: {criterio: puntuación 0-100}
    - overall_score: puntuación general 0-100
    - recommendations: array de recomendaciones
    - strengths: array de fortalezas
    - areas_to_improve: array de áreas a mejorar`;

    const systemPrompt =
      'Eres un evaluador pedagógico riguroso y justo. Devuelve SOLO JSON válido, sin explicaciones adicionales.';

    try {
      const aiResult = await this.sendMessageToGemini(analysisPrompt, systemPrompt);

      if (aiResult.mode === 'scripted') {
        return this.buildHeuristicEvaluation(logs, evalCriteria);
      }

      const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), ai_mode: 'live' };
      }
      return this.buildHeuristicEvaluation(logs, evalCriteria);
    } catch {
      return this.buildHeuristicEvaluation(logs, evalCriteria);
    }
  }

  private buildHeuristicEvaluation(logs: any[], evalCriteria: string[]): Record<string, any> {
    const total = logs.length;
    const messages = logs.filter((l) => l.event_type === 'message_sent');
    const correct = logs.filter((l) => l.is_correct === 1).length;
    const incorrect = logs.filter((l) => l.is_correct === 0).length;
    const evaluated = correct + incorrect;

    const accuracy = evaluated > 0 ? Math.round((correct / evaluated) * 100) : 70;
    const participation = Math.min(
      100,
      Math.round((messages.length / Math.max(1, total)) * 100 + 30),
    );
    const overall = Math.round(accuracy * 0.6 + participation * 0.4);

    const hard_skills: Record<string, number> = {};
    const soft_skills: Record<string, number> = {};

    evalCriteria.forEach((c, i) => {
      if (i % 2 === 0) hard_skills[c] = Math.max(50, accuracy + (((i * 3) % 20) - 10));
      else soft_skills[c] = Math.max(50, participation + (((i * 5) % 20) - 10));
    });

    return {
      hard_skills,
      soft_skills,
      overall_score: overall,
      recommendations: [
        overall < 70
          ? 'Revisá los materiales del módulo y volvé a practicar los puntos débiles.'
          : 'Buen desempeño general. Continúa reforzando los conceptos avanzados.',
        messages.length < 5
          ? 'Intentá interactuar más con el simulador para obtener mejor retroalimentación.'
          : 'Excelente nivel de participación durante la simulación.',
      ],
      strengths:
        accuracy >= 70
          ? ['Buena precisión en las respuestas', 'Comprensión del tema']
          : ['Participación activa'],
      areas_to_improve:
        accuracy < 70
          ? ['Precisión en las respuestas', 'Profundización conceptual']
          : ['Consistencia'],
      ai_mode: 'scripted',
    };
  }
}
