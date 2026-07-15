import axios from 'axios';
import { OpenAiService } from './openai.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenAiService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-openai-key',
      OPENAI_CHAT_MODEL: 'gpt-5.4-nano',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('isConfigured returns true when API key is set', () => {
    const service = new OpenAiService();
    expect(service.isConfigured()).toBe(true);
  });

  it('isConfigured returns false when API key is missing', () => {
    process.env.OPENAI_API_KEY = '';
    const service = new OpenAiService();
    expect(service.isConfigured()).toBe(false);
  });

  it('chat sends request to OpenAI chat completions', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { choices: [{ message: { content: 'OpenAI reply' } }] },
    });

    const service = new OpenAiService();
    const result = await service.chat('Hola', 'System prompt', [
      { role: 'user', content: 'Prev' },
    ]);

    expect(result).toBe('OpenAI reply');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        model: 'gpt-5.4-nano',
        messages: expect.arrayContaining([
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Prev' },
          { role: 'user', content: 'Hola' },
        ]),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openai-key',
        }),
      }),
    );
  });

  it('chat throws when API key is not configured', async () => {
    process.env.OPENAI_API_KEY = '';
    const service = new OpenAiService();
    await expect(service.chat('Hola', 'System')).rejects.toThrow(
      'OPENAI_API_KEY is not configured',
    );
  });

  it('chat throws when OpenAI returns empty content', async () => {
    mockedAxios.post.mockResolvedValue({ data: { choices: [{ message: {} }] } });
    const service = new OpenAiService();
    await expect(service.chat('Hola', 'System')).rejects.toThrow(
      'OpenAI returned empty content',
    );
  });
});
