import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly apiKey = process.env.DEEPSEEK_API_KEY;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly defaultSystemPrompt = this.loadSystemPrompt();
  private readonly employmentAxis = this.loadEmploymentAxis();

  private loadSystemPrompt(): string {
    try {
      return fs.readFileSync(path.join(__dirname, 'system-prompt.md'), 'utf-8');
    } catch {
      return 'Eres un experto en análisis de documentos educativos del Ministerio de Educación.';
    }
  }

  private loadEmploymentAxis(): string {
    try {
      return fs.readFileSync(path.join(__dirname, 'employment-axis.md'), 'utf-8');
    } catch {
      this.logger.warn('employment-axis.md not found, employment axis will be empty');
      return '';
    }
  }

  getEmploymentAxis(): string {
    return this.employmentAxis;
  }

  async chat(prompt: string, system?: string): Promise<string> {
    const maxRetries = 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: 'deepseek-v4-flash',
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
            max_tokens: 16384,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 180000,
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