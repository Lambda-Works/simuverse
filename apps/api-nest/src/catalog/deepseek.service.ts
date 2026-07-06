import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly apiKey = process.env.OPENCODE_ZEN_API_KEY;
  private readonly apiUrl = 'https://opencode.ai/zen/v1/chat/completions';
  private readonly defaultSystemPrompt =
    'Eres un experto en análisis de documentos educativos del Ministerio de Educación.';

  async chat(prompt: string, system?: string): Promise<string> {
    const maxRetries = 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: 'mimo-v2.5-free',
            messages: [
              {
                role: 'system',
                content: system || this.defaultSystemPrompt,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          },
        );

        return response.data.choices[0].message.content;
      } catch (error: any) {
        lastError = error;
        const isRetryable =
          error.code === 'ECONNABORTED' || // timeout
          error.message?.includes('timeout') ||
          (error.response?.status >= 500 && error.response?.status < 600);

        if (isRetryable && attempt < maxRetries) {
          this.logger.warn(
            `DeepSeek API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
          );
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}