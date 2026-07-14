import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY || '';
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = process.env.OPENAI_CHAT_MODEL || 'gpt-5.4-nano';

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== '');
  }

  async chat(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    this.logger.log(`Using OpenAI provider (${this.model})`);

    const response = await axios.post(
      this.apiUrl,
      {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }
    return content;
  }
}
