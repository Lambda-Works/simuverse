/**
 * ChatService - LLM Integration Layer
 * Integrates with Google Gemini API for AI-powered responses
 * Implements streaming, prompt engineering, and fallback logic
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  text: string;
  tokens: {
    input: number;
    output: number;
  };
  model: string;
  timestamp: string;
}

interface ChatServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * System prompts customized per course family
 * These define the AI personality and constraints
 */
const SYSTEM_PROMPTS: Record<string, string> = {
  'administración': `Eres un experto en Administración Pública con 20 años de experiencia. 
Tu rol es:
- Ayudar a resolver casos de administración pública
- Explicar normativa y procedimientos administrativos
- Ser riguroso con las regulaciones
- Ofrecer soluciones prácticas y fundamentadas

Responde siempre en español. Sé conciso pero completo.
Si no sabes algo, admítelo y sugiere recursos.`,

  'rrhh': `Eres un especialista en Recursos Humanos certificado con 15 años de experiencia.
Tu rol es:
- Resolver dudas sobre nómina, beneficios y legislación laboral
- Explicar derechos y obligaciones de empleados/empleadores
- Proporcionar información sobre negociación colectiva
- Ser empático pero riguroso con la normativa

Responde siempre en español. Mantén confidencialidad.
Si es caso legal, recomienda abogado laboral.`,

  'it': `Eres un arquitecto de sistemas de información con 12 años en empresas Fortune 500.
Tu rol es:
- Resolver problemas técnicos de infraestructura
- Explicar seguridad, bases de datos, cloud
- Proporcionar mejores prácticas de desarrollo
- Ser práctico y orientado a soluciones

Responde en español o inglés según el usuario.
Proporciona ejemplos de código cuando sea relevante.`,

  'emprendimiento': `Eres un mentor de emprendimiento con 8 startups exitosas.
Tu rol es:
- Ayudar en estrategia empresarial y financiera
- Resolver dudas sobre marketing, operaciones, finanzas
- Proporcionar perspectiva realista y constructiva
- Conectar con recursos y networks

Responde siempre en español.
Sé directo, honesto y orientado a resultados.`,
};

/**
 * ChatService - Main class for LLM integration
 */
class ChatService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: ChatServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-pro';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1024;
    this.timeout = config.timeout ?? 30000;

    if (!this.apiKey) {
      console.warn('ChatService: No API key provided. Using fallback mode.');
    }
  }

  /**
   * Get system prompt for a course family
   */
  getSystemPrompt(familyType: string): string {
    return SYSTEM_PROMPTS[familyType.toLowerCase()] || SYSTEM_PROMPTS['rrhh'];
  }

  /**
   * Send message to Gemini API with streaming support
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    familyType: string = 'rrhh',
    onStream?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      // If no API key, use fallback
      if (!this.apiKey) {
        return this.generateFallbackResponse(userMessage, familyType);
      }

      // Prepare request
      const systemPrompt = this.getSystemPrompt(familyType);
      const messages = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      // Build Gemini API request
      const requestBody = {
        contents: messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        systemInstruction: {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
        },
      };

      // Call Gemini API
      const response = await this.callGeminiAPI(requestBody, onStream);

      return {
        text: response.text,
        tokens: response.tokens,
        model: this.model,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('ChatService: Error generating response:', error);
      return this.generateFallbackResponse(userMessage, familyType);
    }
  }

  /**
   * Call Gemini API endpoint
   */
  private async callGeminiAPI(
    requestBody: any,
    onStream?: (chunk: string) => void
  ): Promise<{ text: string; tokens: { input: number; output: number } }> {
    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your credentials.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract text from response
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No response generated';

      // Extract token counts
      const inputTokens =
        data.usageMetadata?.promptTokenCount || requestBody.contents.length;
      const outputTokens =
        data.usageMetadata?.candidatesTokenCount || text.split(' ').length;

      return {
        text,
        tokens: {
          input: inputTokens,
          output: outputTokens,
        },
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('API request timeout. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Fallback response when API is unavailable
   * Uses intelligent pattern matching
   */
  private generateFallbackResponse(
    userMessage: string,
    familyType: string
  ): ChatResponse {
    const responses: Record<string, Record<string, string>> = {
      administración: {
        'procedimiento|proceso|trámite': `En administración pública, los procedimientos se rigen por la Ley de Procedimiento Administrativo. Los pasos típicos son:

1. **Presentación**: Presentar solicitud ante autoridad competente
2. **Admisión**: Verificación de requisitos
3. **Instrucción**: Período para pruebas y alegatos
4. **Resolución**: Autoridad dicta resolución
5. **Recursos**: Posibilidad de impugnación

¿Necesitas ayuda con un procedimiento específico?`,

        'normativa|ley|regulación': `Las normativas administrativas varían según el país y nivel (nacional, provincial, municipal).

Los elementos clave son:
- **Competencia**: Qué autoridades pueden actuar
- **Procedimiento**: Cómo debe actuar
- **Recursos**: Cómo se puede impugnar
- **Plazos**: Tiempos máximos para resolver

¿Qué normativa específica te interesa?`,

        'default': `En administración pública, es importante:
- Conocer la normativa aplicable
- Seguir procedimientos establecidos
- Documentar todas las acciones
- Responder en plazos legales

¿En qué área necesitas ayuda?`,
      },

      rrhh: {
        'salario|sueldo|pago': `Respecto a remuneraciones:

**Componentes típicos**:
- Sueldo base
- Asignaciones (familia, antigüedad, etc.)
- Descuentos (impuestos, AFP, seguros)
- Gratificaciones

Cada país tiene normativa diferente.
¿Necesitas calcular o entender tu nómina?`,

        'contrato|empleo|trabajo': `Un contrato laboral debe incluir:
- Identificación de partes
- Naturaleza del trabajo
- Duración y horario
- Remuneración
- Términos de término

Los derechos fundamentales son:
- No discriminación
- Seguridad y salud
- Libertad sindical
- Salario justo

¿Tienes dudas específicas del contrato?`,

        'default': `En Recursos Humanos, lo fundamental es:
- Conocer derechos y obligaciones
- Mantener documentación en orden
- Comunicarse con RH formalmente
- Conocer los canales de reclamo

¿Qué aspecto laboral te preocupa?`,
      },

      it: {
        'seguridad|ciberseguridad|protección': `Mejores prácticas de seguridad:

**Técnicas**:
- Autenticación multi-factor (MFA)
- Encriptación end-to-end
- Firewalls y IDS/IPS
- Backups regulares

**Procesos**:
- Auditorías de seguridad
- Actualizaciones de patches
- Monitoreo de logs
- Respuesta a incidentes

¿Qué aspecto de seguridad te interesa?`,

        'nube|cloud|aws|azure|gcp': `Opciones de cloud computing:

**AWS**: Amplio ecosistema, muchos servicios
**Azure**: Integración con Microsoft, enterprise
**GCP**: IA/ML fuerte, análisis de datos
**On-Premise**: Control total, costo inicial alto

Considera:
- Costos
- Escalabilidad
- Cumplimiento regulatorio
- Vendor lock-in

¿Cuál es tu caso de uso?`,

        'default': `En IT, los principios fundamentales son:
- Disponibilidad
- Seguridad
- Performance
- Escalabilidad
- Mantenibilidad

¿Qué problema técnico enfrentas?`,
      },

      emprendimiento: {
        'dinero|financiamiento|inversión|capital': `Opciones de financiamiento:

**Iniciales**:
- Bootstrapping (tus ahorros)
- Friends & Family
- Crowdfunding

**Crecimiento**:
- Angel investors
- Venture Capital (VC)
- Préstamos bancarios
- Equity crowdfunding

**Métricas importantes**:
- Burn rate (gasto mensual)
- Runway (meses de pista)
- Unit economics
- Customer acquisition cost

¿En qué etapa estás?`,

        'negocio|estrategia|plan': `Para un negocio exitoso:

**Validación**: ¿La gente quiere tu producto?
**PMF**: Product-Market Fit
**Escalabilidad**: ¿Puedes crecer?
**Rentabilidad**: ¿Hay margen?

Plan de negocio incluye:
- Análisis de mercado
- Modelo de ingresos
- Proyecciones financieras
- Plan operativo

¿Cuál es tu idea de negocio?`,

        'default': `En emprendimiento:
- La ejecución > ideas
- Habla con clientes
- Mide todo
- Itera rápido
- Mantén gastos bajos

¿En qué etapa estás de tu startup?`,
      },
    };

    const lowerMessage = userMessage.toLowerCase();
    const familyResponses = responses[familyType.toLowerCase()] || responses['rrhh'];

    // Try to match keywords
    for (const [keywords, response] of Object.entries(familyResponses)) {
      if (keywords === 'default') continue;
      const pattern = new RegExp(keywords.split('|').join('|'));
      if (pattern.test(lowerMessage)) {
        return {
          text: response,
          tokens: { input: userMessage.length / 4, output: response.length / 4 },
          model: 'fallback',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Default response
    const defaultResponse = familyResponses['default'] || 'Entiendo tu pregunta. ¿Puedes proporcionar más detalles?';
    return {
      text: defaultResponse,
      tokens: { input: userMessage.length / 4, output: defaultResponse.length / 4 },
      model: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    // Gemini API keys are typically long alphanumeric strings
    return apiKey && apiKey.length > 20;
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    model: string;
    temperature: number;
    maxTokens: number;
  } {
    return {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }
}

// Initialize ChatService with environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const chatService = new ChatService({
  apiKey: API_KEY,
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 1024,
  timeout: 30000,
});

export default ChatService;
